// app.js
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initDarkModeToggle();
  xtalk.signalIframe();
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
    xtalk.signalIframe(); // Call crosstalk
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

function initDarkModeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");

  if (!darkModeToggle) {
    console.error("Dark mode toggle element not found");
    return;
  }

  // Check for saved theme preference or default to system preference
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.checked = true;
  } else if (localStorage.getItem("darkMode") === "disabled") {
    document.body.classList.remove("dark-mode");
    darkModeToggle.checked = false;
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.body.classList.add("dark-mode");
    darkModeToggle.checked = true;
  }

  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "enabled");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "disabled");
    }
  });

  // Listen for changes in system color scheme
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (localStorage.getItem("darkMode") === null) {
        darkModeToggle.checked = e.matches;
        document.body.classList.toggle("dark-mode", e.matches);
      }
    });
}
