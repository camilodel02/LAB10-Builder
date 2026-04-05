# UC-sanity: endpoint de salud disponible para orquestación y smoke tests.


def test_health_returns_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
