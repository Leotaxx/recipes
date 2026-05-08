import os
from collections import Counter

import httpx
from fastapi import FastAPI, HTTPException

CATALOG_API_URL = os.getenv("CATALOG_API_URL", "http://localhost:3001").rstrip("/")

app = FastAPI(title="recommendation-api", version="1.0.0")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "recommendation-api"}


@app.get("/recommendations")
async def recommendations(cuisine: str | None = None):
    params = {"cuisine": cuisine} if cuisine else None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{CATALOG_API_URL}/recipes", params=params)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="catalog-api unavailable") from exc

    recipes = response.json()
    if not recipes:
        return {"recommendations": [], "reason": "No recipes available"}

    ingredient_counts = Counter(
        ingredient.lower()
        for recipe in recipes
        for ingredient in recipe.get("ingredients", [])
    )
    popular = {name for name, _count in ingredient_counts.most_common(3)}

    scored = sorted(
        recipes,
        key=lambda recipe: (
            recipe.get("difficulty") == "easy",
            len(popular.intersection({item.lower() for item in recipe.get("ingredients", [])})),
        ),
        reverse=True,
    )

    return {
        "recommendations": scored[:3],
        "reason": "Prioritised easy recipes using common ingredients",
    }

