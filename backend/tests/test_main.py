import importlib
import os

import pytest
from fastapi.testclient import TestClient

VIDEO = ("clip.mp4", b"fake-video-bytes", "video/mp4")


def test_root(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Gemini Stylist Backend API"}


def test_lifespan_creates_and_removes_temp_dir(app_module, tmp_path):
    with TestClient(app_module.app):
        assert (tmp_path / "temp_uploads").is_dir()

    assert not (tmp_path / "temp_uploads").exists()


class TestAnalyzeVideo:
    def test_returns_service_result_and_forwards_location(self, client, mocker):
        service = mocker.patch(
            "main.analyze_video_service", return_value={"inventory": [{"id": "1"}]}
        )

        response = client.post(
            "/analyze-video",
            files={"file": VIDEO},
            data={"lat": "40.4", "lon": "-3.7"},
        )

        assert response.status_code == 200
        assert response.json() == {"inventory": [{"id": "1"}]}
        path, lat, lon = service.call_args.args
        assert path.startswith("temp_uploads")
        assert path.endswith(".mp4")
        assert (lat, lon) == (40.4, -3.7)

    def test_location_is_optional(self, client, mocker):
        service = mocker.patch("main.analyze_video_service", return_value={})

        client.post("/analyze-video", files={"file": VIDEO})

        assert service.call_args.args[1:] == (None, None)

    def test_saves_upload_content_and_removes_temp_file(self, client, mocker):
        seen = {}

        def fake_service(path, lat, lon):
            with open(path, "rb") as saved:
                seen["content"] = saved.read()
            seen["path"] = path
            return {}

        mocker.patch("main.analyze_video_service", side_effect=fake_service)

        client.post("/analyze-video", files={"file": VIDEO})

        assert seen["content"] == b"fake-video-bytes"
        assert not os.path.exists(seen["path"])

    @pytest.mark.parametrize(
        "filename", ["../../evil.mp4", "/etc/evil.mp4", "..\\..\\evil.mp4"]
    )
    def test_ignores_client_supplied_path(self, client, mocker, tmp_path, filename):
        service = mocker.patch("main.analyze_video_service", return_value={})

        client.post(
            "/analyze-video", files={"file": (filename, b"x", "video/mp4")}
        )

        path = service.call_args.args[0]
        assert os.path.dirname(os.path.abspath(path)) == str(tmp_path / "temp_uploads")
        assert "evil" not in os.path.basename(path)
        assert not (tmp_path.parent / "evil.mp4").exists()

    def test_file_without_extension(self, client, mocker):
        service = mocker.patch("main.analyze_video_service", return_value={})

        client.post("/analyze-video", files={"file": ("noext", b"x", "video/mp4")})

        assert os.path.splitext(service.call_args.args[0])[1] == ""

    def test_service_failure_returns_500_without_leaking_details(
        self, client, mocker, tmp_path
    ):
        mocker.patch(
            "main.analyze_video_service", side_effect=RuntimeError("secret-detail")
        )

        response = client.post("/analyze-video", files={"file": VIDEO})

        assert response.status_code == 500
        assert response.json() == {"detail": "Video analysis failed"}
        assert "secret-detail" not in response.text
        assert os.listdir(tmp_path / "temp_uploads") == []

    def test_requires_file(self, client):
        response = client.post("/analyze-video")

        assert response.status_code == 422


class TestChat:
    payload = {
        "user_message": "what should I wear?",
        "chat_history": [{"role": "user", "content": "hi"}],
        "inventory_context": [{"id": "1"}],
        "lat": 40.4,
        "lon": -3.7,
    }

    def test_returns_service_response(self, client, mocker):
        service = mocker.patch(
            "main.chat_with_stylist_service",
            return_value={"text": "wear a coat", "related_item_ids": ["1"]},
        )

        response = client.post("/api/chat", json=self.payload)

        assert response.status_code == 200
        assert response.json() == {"text": "wear a coat", "related_item_ids": ["1"]}
        service.assert_called_once_with(
            user_message="what should I wear?",
            chat_history=[{"role": "user", "content": "hi"}],
            inventory_context=[{"id": "1"}],
            lat=40.4,
            lon=-3.7,
        )

    def test_location_is_optional(self, client, mocker):
        service = mocker.patch("main.chat_with_stylist_service", return_value={})
        payload = {k: v for k, v in self.payload.items() if k not in ("lat", "lon")}

        client.post("/api/chat", json=payload)

        assert service.call_args.kwargs["lat"] is None
        assert service.call_args.kwargs["lon"] is None

    def test_service_failure_returns_500_without_leaking_details(
        self, client, mocker
    ):
        mocker.patch(
            "main.chat_with_stylist_service", side_effect=RuntimeError("secret-detail")
        )

        response = client.post("/api/chat", json=self.payload)

        assert response.status_code == 500
        assert response.json() == {"detail": "Chat failed"}
        assert "secret-detail" not in response.text

    @pytest.mark.parametrize(
        "missing", ["user_message", "chat_history", "inventory_context"]
    )
    def test_rejects_missing_required_field(self, client, missing):
        payload = {k: v for k, v in self.payload.items() if k != missing}

        response = client.post("/api/chat", json=payload)

        assert response.status_code == 422


class TestCors:
    def preflight(self, client, origin):
        return client.options(
            "/api/chat",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
            },
        )

    @pytest.mark.parametrize(
        "origin",
        [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://gemini-stylist-demo.web.app",
        ],
    )
    def test_allows_listed_origins(self, client, origin):
        response = self.preflight(client, origin)

        assert response.headers["access-control-allow-origin"] == origin

    def test_rejects_unlisted_origin(self, client):
        response = self.preflight(client, "https://evil.example")

        assert "access-control-allow-origin" not in response.headers

    def test_extra_origins_from_environment(self, tmp_path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        monkeypatch.setenv("CORS_ORIGINS", " https://a.example , https://b.example ,")
        import main

        module = importlib.reload(main)

        assert "https://a.example" in module.origins
        assert "https://b.example" in module.origins
        assert "" not in module.origins
        with TestClient(module.app) as test_client:
            response = self.preflight(test_client, "https://b.example")
            assert response.headers["access-control-allow-origin"] == "https://b.example"
