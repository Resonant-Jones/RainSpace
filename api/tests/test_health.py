"""Health endpoint behaviour."""

from __future__ import annotations


def test_health_reports_ok(client) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database"] == "ok"
    assert payload["service"] == "creator-distribution-platform-api"


def test_openapi_document_is_served(client) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/api/creators/{creator_slug}/catalog" in response.json()["paths"]
