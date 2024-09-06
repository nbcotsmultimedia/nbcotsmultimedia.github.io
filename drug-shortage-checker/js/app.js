// app.js
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  try {
    showLoading(true);
    // Use the fetchDrugData function from api.js
    const data = await fetchDrugData();
    if (typeof window.initSearch === "function") {
      window.initSearch(data);
    } else {
      console.error(
        "initSearch function not found. Make sure search.js is loaded properly."
      );
    }
    showLoading(false);
  } catch (error) {
    console.error("Failed to initialize app:", error);
    showError("Failed to load drug data. Please try again later.");
    showLoading(false);
  }
}

function showLoading(isLoading) {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = isLoading ? "block" : "none";
  }
}

function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
}
