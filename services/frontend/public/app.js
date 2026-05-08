const recipesEl = document.querySelector("#recipes");
const recommendationsEl = document.querySelector("#recommendations");
const reasonEl = document.querySelector("#reason");
const form = document.querySelector("#recipe-form");

function recipeCard(recipe) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.join(", ") : "";
  return `
    <article class="recipe">
      <h3>${recipe.title}</h3>
      <div class="meta">${recipe.cuisine || "Mixed"} · ${recipe.difficulty}</div>
      <p>${ingredients}</p>
    </article>
  `;
}

async function loadRecipes() {
  const [recipesResponse, recommendationResponse] = await Promise.all([
    fetch("/api/catalog/recipes"),
    fetch("/api/recommendations/recommendations")
  ]);
  const recipes = await recipesResponse.json();
  const recommendations = await recommendationResponse.json();
  recipesEl.innerHTML = recipes.map(recipeCard).join("");
  recommendationsEl.innerHTML = recommendations.recommendations.map(recipeCard).join("");
  reasonEl.textContent = recommendations.reason;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  await fetch("/api/catalog/recipes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: data.get("title"),
      cuisine: data.get("cuisine"),
      difficulty: data.get("difficulty"),
      ingredients: String(data.get("ingredients")).split(",").map((item) => item.trim()).filter(Boolean),
      steps: data.get("steps")
    })
  });
  form.reset();
  await loadRecipes();
});

document.querySelector("#refresh").addEventListener("click", loadRecipes);
loadRecipes().catch((error) => {
  recipesEl.textContent = `Could not load recipes: ${error.message}`;
});
