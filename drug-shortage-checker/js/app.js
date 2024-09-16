// app.js

//#region - INITIALIZATION

// On DOM load, run functions to initialize the app, toggle dark mode, and call crosstalk
/**
 * Main entry point for the application.
 * Initializes the app, dark mode toggle, and signals iframe resize when DOM is ready.
 */
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initDarkModeToggle();
  if (typeof signalIframeResize === "function") {
    signalIframeResize();
  } else {
    console.error("signalIframeResize function not found");
  }
});

//#endregion

//#region - CROSSTALK

// Initialize crosstalk
/**
 * Initializes cross-domain communication (crosstalk) if the page is in an iframe.
 * Creates a dummy xtalk object if not in an iframe to prevent errors.
 */
function initCrosstalk() {
  if (window.parent !== window) {
    xtalk.parentDomain = document.referrer;
    xtalk.init();
  } else {
    console.warn(
      "Page is not in an iframe. Crosstalk functionality will be disabled."
    );
    // Create a dummy xtalk object to prevent errors
    window.xtalk = {
      signalIframe: function () {
        console.log(
          "Crosstalk signalIframe called, but page is not in an iframe."
        );
      },
      init: function () {
        console.log("Crosstalk init called, but page is not in an iframe.");
      },
    };
  }
}

//#endregion

//#region - MAIN APP

// Initialize the app
/**
 * Initializes the main application.
 * Fetches drug data, initializes search functionality, and handles loading states.
 */
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
    signalIframeResize(); // Use the wrapper function
  } catch (error) {
    console.error("Failed to initialize app:", error);
    showError("Failed to load drug data. Please try again later.");
    showLoading(false);
  }
}

//#endregion

//#region - UI HELPERS

// Control visibility of the loading indicator
/**
 * Controls the visibility of the loading indicator.
 * @param {boolean} isLoading - Whether to show or hide the loading indicator.
 */
function showLoading(isLoading) {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.style.display = isLoading ? "block" : "none";
  }
}

// Show an error message to the user
/**
 * Displays an error message to the user.
 * @param {string} message - The error message to display.
 */
function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
}

//#endregion

//#region - DARK MODE

// Manage dark mode toggle functionality
/**
 * Initializes the dark mode toggle functionality.
 * Handles user preferences, local storage, and system color scheme changes.
 */
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById("darkModeToggle");

  if (!darkModeToggle) {
    console.error("Dark mode toggle element not found");
    return;
  }

  // Set initial state based on saved preference or system preference
  const savedTheme = localStorage.getItem("darkMode");
  const prefersDarkScheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  if (savedTheme === "enabled" || (savedTheme === null && prefersDarkScheme)) {
    enableDarkMode();
  } else {
    disableDarkMode();
  }

  // Handle toggle changes
  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      enableDarkMode();
    } else {
      disableDarkMode();
    }
  });

  // Listen for system color scheme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (localStorage.getItem("darkMode") === null) {
        if (e.matches) {
          enableDarkMode();
        } else {
          disableDarkMode();
        }
      }
    });
}

/**
 * Enables dark mode and updates related states.
 */
function enableDarkMode() {
  document.body.classList.add("dark-mode");
  document.getElementById("darkModeToggle").checked = true;
  localStorage.setItem("darkMode", "enabled");
}

/**
 * Disables dark mode and updates related states.
 */
function disableDarkMode() {
  document.body.classList.remove("dark-mode");
  document.getElementById("darkModeToggle").checked = false;
  localStorage.setItem("darkMode", "disabled");
}

//#endregion
