import respx
from fastapi.testclient import TestClient
from httpx import Response

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "recommendation-api"


@respx.mock
def test_recommendations_call_catalog():
    respx.get("http://localhost:3001/recipes").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": 1,
                    "title": "Pasta",
                    "difficulty": "easy",
                    "ingredients": ["tomato", "pasta"],
                }
            ],
        )
    )

    response = client.get("/recommendations")
    assert response.status_code == 200
    assert response.json()["recommendations"][0]["title"] == "Pasta"

