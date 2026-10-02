import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def api_key(monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEYS", raising=False)
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")


@pytest.fixture
def app_module(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    import main
    return importlib.reload(main)


@pytest.fixture
def client(app_module):
    with TestClient(app_module.app) as test_client:
        yield test_client
