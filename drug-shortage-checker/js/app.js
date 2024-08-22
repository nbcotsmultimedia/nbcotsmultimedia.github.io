// app.js
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  try {
    showLoading(true);
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

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  setupCancelButton();
});

function setupCancelButton() {
  const searchInput = document.getElementById("search-input");
  const cancelButton = document.getElementById("cancel-search");

  searchInput.addEventListener("input", () => {
    cancelButton.style.display = searchInput.value ? "block" : "none";
  });

  cancelButton.addEventListener("click", () => {
    searchInput.value = "";
    cancelButton.style.display = "none";
    document.getElementById("autocomplete-results").innerHTML = "";
    document.getElementById("results-container").innerHTML = "";
  });
}
