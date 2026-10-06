import json
from types import SimpleNamespace

import pytest

import services


def make_response(text, sources=None, has_metadata=True):
    chunks = [
        SimpleNamespace(web=SimpleNamespace(title=title, uri=uri))
        for title, uri in (sources or [])
    ]
    chunks.append(SimpleNamespace(web=None))
    metadata = SimpleNamespace(grounding_chunks=chunks) if has_metadata else None
    return SimpleNamespace(text=text, candidates=[SimpleNamespace(grounding_metadata=metadata)])


def make_client(*outcomes):
    client = SimpleNamespace(models=SimpleNamespace())
    calls = []
    queue = list(outcomes)

    def generate_content(**kwargs):
        calls.append(kwargs)
        outcome = queue.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    client.models.generate_content = generate_content
    client.calls = calls
    return client


@pytest.fixture
def fake_client(mocker):
    def install(*outcomes):
        client = make_client(*outcomes)
        mocker.patch("services.get_random_client", return_value=client)
        return client

    return install


@pytest.fixture
def weather(mocker):
    return mocker.patch("services.get_current_weather", return_value="Rainy, 8°C")


class TestCleanAndParseJson:
    def test_plain_json(self):
        assert services.clean_and_parse_json('{"a": 1}') == {"a": 1}

    def test_fenced_json_block(self):
        text = 'Here you go:\n```json\n{"a": 1}\n```\nEnjoy'

        assert services.clean_and_parse_json(text) == {"a": 1}

    def test_json_embedded_in_prose(self):
        assert services.clean_and_parse_json('Sure! {"a": {"b": 2}} done') == {"a": {"b": 2}}

    def test_text_without_json_falls_back_to_text_payload(self):
        assert services.clean_and_parse_json("just words") == {
            "text": "just words",
            "related_item_ids": [],
        }

    def test_invalid_json_falls_back_to_text_payload(self):
        result = services.clean_and_parse_json("{not valid}")

        assert result == {"text": "{not valid}", "related_item_ids": []}

    @pytest.mark.parametrize("empty", ["", None])
    def test_empty_response(self, empty):
        assert services.clean_and_parse_json(empty) == {"text": "", "related_item_ids": []}


class TestApiKeys:
    def test_single_key(self):
        assert services.get_api_keys() == ["test-key"]

    def test_pool_takes_precedence_and_splits_on_whitespace(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEYS", " k1  k2\nk3 ")

        assert services.get_api_keys() == ["k1", "k2", "k3"]

    def test_blank_pool_falls_back_to_single_key(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEYS", "   ")

        assert services.get_api_keys() == ["test-key"]

    def test_no_keys(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_API_KEY")

        assert services.get_api_keys() == []

    def test_keys_are_read_on_every_call(self, monkeypatch):
        assert services.get_api_keys() == ["test-key"]

        monkeypatch.setenv("GOOGLE_API_KEY", "rotated")

        assert services.get_api_keys() == ["rotated"]


class TestGetRandomClient:
    def test_raises_without_keys(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_API_KEY")

        with pytest.raises(ValueError, match="API Keys"):
            services.get_random_client()

    def test_builds_client_with_one_of_the_keys(self, mocker, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEYS", "k1 k2")
        client_cls = mocker.patch("services.genai.Client")
        mocker.patch("services.random.choice", side_effect=lambda keys: keys[1])

        result = services.get_random_client()

        client_cls.assert_called_once_with(api_key="k2")
        assert result is client_cls.return_value


class TestGetCurrentWeather:
    @pytest.fixture
    def respond(self, mocker):
        def install(payload):
            mocker.patch(
                "services.requests.get",
                return_value=SimpleNamespace(json=lambda: payload),
            )

        return install

    @pytest.mark.parametrize(
        "code,condition",
        [
            (0, "Clear sky"),
            (1, "Cloudy"),
            (3, "Cloudy"),
            (45, "Foggy"),
            (48, "Foggy"),
            (51, "Rainy"),
            (65, "Rainy"),
            (82, "Rainy"),
            (71, "Snowy"),
            (86, "Snowy"),
            (95, "Thunderstorm"),
            (99, "Thunderstorm"),
            (4, "Unknown"),
        ],
    )
    def test_maps_weather_codes(self, respond, code, condition):
        respond({"current": {"temperature_2m": 12.5, "weather_code": code}})

        assert services.get_current_weather(40.4, -3.7) == f"{condition}, 12.5°C"

    def test_requests_the_right_url_with_timeout(self, mocker):
        get = mocker.patch(
            "services.requests.get",
            return_value=SimpleNamespace(
                json=lambda: {"current": {"temperature_2m": 1, "weather_code": 0}}
            ),
        )

        services.get_current_weather(40.4, -3.7)

        url = get.call_args.args[0]
        assert "latitude=40.4" in url and "longitude=-3.7" in url
        assert get.call_args.kwargs["timeout"] == 3

    def test_response_without_current_returns_none(self, respond):
        respond({"error": True})

        assert services.get_current_weather(1, 2) is None

    def test_network_error_returns_none(self, mocker):
        mocker.patch("services.requests.get", side_effect=TimeoutError("slow"))

        assert services.get_current_weather(1, 2) is None

    def test_malformed_payload_returns_none(self, respond):
        respond({"current": {"temperature_2m": 3}})

        assert services.get_current_weather(1, 2) is None


class TestGenerateStylePersona:
    inventory = [{"id": "a", "type": "shirt"}]

    def test_returns_parsed_json(self, fake_client):
        client = fake_client(make_response('{"text": "Classic", "related_item_ids": ["a"]}'))

        result = services.generate_style_persona(self.inventory)

        assert result == {"text": "Classic", "related_item_ids": ["a"]}
        assert client.calls[0]["model"] == services.FALLBACK_MODELS[0]
        assert json.dumps(self.inventory, indent=2) in client.calls[0]["contents"]

    def test_falls_back_to_next_model(self, fake_client):
        client = fake_client(RuntimeError("quota"), make_response('{"text": "ok"}'))

        result = services.generate_style_persona(self.inventory)

        assert result == {"text": "ok"}
        assert [c["model"] for c in client.calls] == services.FALLBACK_MODELS[:2]

    def test_returns_none_when_every_model_fails(self, fake_client):
        client = fake_client(*[RuntimeError("down")] * len(services.FALLBACK_MODELS))

        assert services.generate_style_persona(self.inventory) is None
        assert [c["model"] for c in client.calls] == services.FALLBACK_MODELS

    def test_missing_api_keys_returns_none(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_API_KEY")

        assert services.generate_style_persona(self.inventory) is None

    def test_includes_weather_when_location_given(self, fake_client, weather):
        client = fake_client(make_response('{"text": "ok"}'))

        services.generate_style_persona(self.inventory, 40.4, -3.7)

        weather.assert_called_once_with(40.4, -3.7)
        assert "User Location Weather: Rainy, 8°C." in client.calls[0]["contents"]

    def test_skips_weather_without_location(self, fake_client, weather):
        client = fake_client(make_response('{"text": "ok"}'))

        services.generate_style_persona(self.inventory)

        weather.assert_not_called()
        assert "User Location Weather" not in client.calls[0]["contents"]

    def test_unavailable_weather_is_omitted(self, fake_client, weather):
        weather.return_value = None
        client = fake_client(make_response('{"text": "ok"}'))

        services.generate_style_persona(self.inventory, 40.4, -3.7)

        assert "User Location Weather" not in client.calls[0]["contents"]


class TestChatWithStylist:
    def chat(self, **overrides):
        args = dict(user_message="outfit?", chat_history=[], inventory_context=[{"id": "a"}])
        args.update(overrides)
        return services.chat_with_stylist_service(**args)

    def test_returns_text_ids_and_sources(self, fake_client):
        fake_client(
            make_response(
                '{"text": "Wear this", "related_item_ids": ["a"]}',
                sources=[("Vogue", "https://vogue.example")],
            )
        )

        assert self.chat() == {
            "text": "Wear this",
            "related_item_ids": ["a"],
            "sources": [{"title": "Vogue", "uri": "https://vogue.example"}],
        }

    def test_plain_text_reply_is_used_as_is(self, fake_client):
        fake_client(make_response("Just wear jeans"))

        result = self.chat()

        assert result["text"] == "Just wear jeans"
        assert result["related_item_ids"] == []

    def test_json_without_text_uses_raw_response(self, fake_client):
        fake_client(make_response('{"related_item_ids": ["a"]}'))

        result = self.chat()

        assert result["text"] == '{"related_item_ids": ["a"]}'
        assert result["related_item_ids"] == ["a"]

    def test_empty_reply_gets_default_text(self, fake_client):
        fake_client(make_response(""))

        assert self.chat()["text"] == "Here is what I found."

    def test_response_without_text_gets_default_text_without_retrying(self, fake_client):
        client = fake_client(make_response(None))

        result = self.chat()

        assert result["text"] == "Here is what I found."
        assert len(client.calls) == 1

    def test_no_grounding_metadata_means_no_sources(self, fake_client):
        fake_client(make_response('{"text": "hi"}', has_metadata=False))

        assert self.chat()["sources"] == []

    def test_no_candidates_means_no_sources(self, fake_client):
        response = SimpleNamespace(text='{"text": "hi"}', candidates=[])
        fake_client(response)

        assert self.chat()["sources"] == []

    def test_grounding_metadata_without_chunks(self, fake_client):
        response = SimpleNamespace(
            text='{"text": "hi"}',
            candidates=[SimpleNamespace(grounding_metadata=SimpleNamespace(grounding_chunks=None))],
        )
        fake_client(response)

        assert self.chat()["sources"] == []

    def test_history_is_mapped_and_empty_messages_skipped(self, fake_client):
        client = fake_client(make_response('{"text": "ok"}'))
        history = [
            {"role": "user", "content": "hello"},
            {"role": "model", "content": "hi there"},
            {"role": "model", "content": ""},
            {"role": "user"},
        ]

        self.chat(chat_history=history)

        contents = client.calls[0]["contents"]
        assert [c.role for c in contents] == ["user", "model", "user"]
        assert [c.parts[0].text for c in contents] == ["hello", "hi there", "outfit?"]

    def test_system_instruction_includes_inventory(self, fake_client):
        client = fake_client(make_response('{"text": "ok"}'))

        self.chat(inventory_context=[{"id": "zzz"}])

        assert '"id": "zzz"' in client.calls[0]["config"].system_instruction

    def test_includes_weather_when_location_given(self, fake_client, weather):
        client = fake_client(make_response('{"text": "ok"}'))

        self.chat(lat=40.4, lon=-3.7)

        assert "User Location Weather: Rainy, 8°C" in client.calls[0]["config"].system_instruction

    def test_skips_weather_without_location(self, fake_client, weather):
        fake_client(make_response('{"text": "ok"}'))

        self.chat()

        weather.assert_not_called()

    def test_falls_back_to_next_model(self, fake_client):
        client = fake_client(RuntimeError("quota"), make_response('{"text": "ok"}'))

        assert self.chat()["text"] == "ok"
        assert [c["model"] for c in client.calls] == services.FALLBACK_MODELS[:2]

    def test_all_models_failing_returns_friendly_message(self, fake_client):
        fake_client(*[RuntimeError("down")] * len(services.FALLBACK_MODELS))

        result = self.chat()

        assert "High Traffic" in result["text"]
        assert result["sources"] == []

    def test_missing_api_keys_returns_friendly_message(self, monkeypatch):
        monkeypatch.delenv("GOOGLE_API_KEY")

        assert "High Traffic" in self.chat()["text"]


class TestAnalyzeVideoService:
    @staticmethod
    def video(state, name="files/1"):
        return SimpleNamespace(
            state=SimpleNamespace(name=state),
            name=name,
            uri="gs://video",
            mime_type="video/mp4",
        )

    @pytest.fixture
    def setup(self, mocker):
        mocker.patch("services.time.sleep")

        def install(uploaded, *polled, generated='{"inventory": [{"id": "1"}]}', outcomes=None):
            client = make_client(*(outcomes or [SimpleNamespace(text=generated)]))
            client.files = SimpleNamespace(
                upload=mocker.Mock(return_value=uploaded),
                get=mocker.Mock(side_effect=list(polled)),
            )
            mocker.patch("services.get_random_client", return_value=client)
            return client

        return install

    def test_active_video_goes_straight_to_generation(self, setup, mocker):
        persona = mocker.patch("services.generate_style_persona", return_value=None)
        client = setup(self.video("ACTIVE"))

        result = services.analyze_video_service("clip.mp4")

        client.files.upload.assert_called_once_with(file="clip.mp4")
        client.files.get.assert_not_called()
        assert client.calls[0]["model"] == services.VIDEO_MODELS[0]
        persona.assert_called_once_with([{"id": "1"}], None, None)
        assert result == {"inventory": [{"id": "1"}]}

    def test_falls_back_to_the_next_model_when_one_is_overloaded(self, setup, mocker):
        mocker.patch("services.generate_style_persona", return_value=None)
        client = setup(
            self.video("ACTIVE"),
            outcomes=[RuntimeError("503 UNAVAILABLE"), SimpleNamespace(text='{"inventory": []}')],
        )

        result = services.analyze_video_service("clip.mp4")

        assert [c["model"] for c in client.calls] == services.VIDEO_MODELS[:2]
        assert client.calls[0]["contents"] == client.calls[1]["contents"]
        assert result == {"inventory": []}

    def test_uses_the_same_client_for_every_model(self, setup, mocker):
        mocker.patch("services.generate_style_persona", return_value=None)
        setup(
            self.video("ACTIVE"),
            outcomes=[RuntimeError("503"), SimpleNamespace(text='{"inventory": []}')],
        )

        services.analyze_video_service("clip.mp4")

        services.get_random_client.assert_called_once()

    def test_raises_the_last_error_when_every_model_fails(self, setup):
        client = setup(
            self.video("ACTIVE"),
            outcomes=[RuntimeError("first")] * (len(services.VIDEO_MODELS) - 1) + [RuntimeError("last")],
        )

        with pytest.raises(RuntimeError, match="last"):
            services.analyze_video_service("clip.mp4")

        assert [c["model"] for c in client.calls] == services.VIDEO_MODELS

    def test_waits_while_video_is_processing(self, setup, mocker):
        mocker.patch("services.generate_style_persona", return_value=None)
        client = setup(self.video("PROCESSING"), self.video("PROCESSING"), self.video("ACTIVE"))

        services.analyze_video_service("clip.mp4")

        assert client.files.get.call_count == 2
        client.files.get.assert_called_with(name="files/1")
        assert services.time.sleep.call_count == 2

    def test_failed_processing_raises(self, setup):
        client = setup(self.video("FAILED"))

        with pytest.raises(ValueError, match="processing failed"):
            services.analyze_video_service("clip.mp4")

        assert client.calls == []

    def test_failed_processing_after_waiting_raises(self, setup):
        setup(self.video("PROCESSING"), self.video("FAILED"))

        with pytest.raises(ValueError, match="processing failed"):
            services.analyze_video_service("clip.mp4")

    def test_upload_error_is_propagated(self, mocker):
        client = SimpleNamespace(files=SimpleNamespace(upload=mocker.Mock(side_effect=OSError("boom"))))
        mocker.patch("services.get_random_client", return_value=client)

        with pytest.raises(OSError, match="boom"):
            services.analyze_video_service("clip.mp4")

    def test_persona_replaces_welcome_message(self, setup, mocker):
        persona = mocker.patch(
            "services.generate_style_persona", return_value={"text": "Persona text"}
        )
        setup(
            self.video("ACTIVE"),
            generated='{"inventory": [{"id": "1"}], "welcome_message": "hello"}',
        )

        result = services.analyze_video_service("clip.mp4", 40.4, -3.7)

        assert result["welcome_message"] == "Persona text"
        persona.assert_called_once_with([{"id": "1"}], 40.4, -3.7)

    def test_missing_persona_keeps_original_welcome_message(self, setup, mocker):
        mocker.patch("services.generate_style_persona", return_value=None)
        setup(
            self.video("ACTIVE"),
            generated='{"inventory": [], "welcome_message": "hello"}',
        )

        assert services.analyze_video_service("clip.mp4")["welcome_message"] == "hello"

    def test_persona_without_text_is_ignored(self, setup, mocker):
        mocker.patch("services.generate_style_persona", return_value={"related_item_ids": []})
        setup(
            self.video("ACTIVE"),
            generated='{"inventory": [], "welcome_message": "hello"}',
        )

        assert services.analyze_video_service("clip.mp4")["welcome_message"] == "hello"

    def test_persona_with_empty_text_is_ignored(self, setup, mocker):
        mocker.patch("services.generate_style_persona", return_value={"text": ""})
        setup(
            self.video("ACTIVE"),
            generated='{"inventory": [], "welcome_message": "hello"}',
        )

        assert services.analyze_video_service("clip.mp4")["welcome_message"] == "hello"

    def test_result_without_inventory_skips_persona(self, setup, mocker):
        persona = mocker.patch("services.generate_style_persona")
        setup(self.video("ACTIVE"), generated='{"suggestion_starter": "x"}')

        result = services.analyze_video_service("clip.mp4")

        persona.assert_not_called()
        assert result == {"suggestion_starter": "x"}

    def test_invalid_model_json_raises(self, setup):
        setup(self.video("ACTIVE"), generated="not json")

        with pytest.raises(json.JSONDecodeError):
            services.analyze_video_service("clip.mp4")
