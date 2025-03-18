// loader.js - Style and resource loading management

(function () {
  // Wait for DOM to be ready before trying to modify body
  function init() {
    if (document.body) {
      // Add loading state to body immediately
      document.body.classList.add("is-loading");

      // Create the loader element
      createLoader();

      // Register all event handlers
      registerEventHandlers();
    } else {
      // Body not ready yet, wait a bit and try again
      setTimeout(init, 10);
    }
  }

  // Start initialization
  init();

  // Create loader element
  function createLoader() {
    if (document.querySelector(".loader")) return;

    const loader = document.createElement("div");
    loader.className = "loader";

    const spinner = document.createElement("div");
    spinner.className = "loader-spinner";

    loader.appendChild(spinner);
    document.body.appendChild(loader);
  }

  // Function to remove loading state
  function removeLoadingState() {
    // Short timeout to ensure styles are applied
    setTimeout(() => {
      if (document.body) {
        document.body.classList.remove("is-loading");
      }

      // Remove loader after transition completes
      setTimeout(() => {
        const loader = document.querySelector(".loader");
        if (loader) {
          loader.remove();
        }
      }, 500); // Match the transition duration
    }, 100);
  }

  // Register all event handlers
  function registerEventHandlers() {
    // Main load event handler
    window.addEventListener("load", () => {
      removeLoadingState();

      // Initialize map if possible
      if (typeof window.initializeMapSvg === "function") {
        const mapSvg = document.getElementById("map-svg");
        if (mapSvg) {
          window.initializeMapSvg(mapSvg);
        }
      }
    });

    // Fallback in case 'load' event doesn't fire
    document.addEventListener("DOMContentLoaded", () => {
      // Set a maximum wait time
      setTimeout(() => {
        if (document.body && document.body.classList.contains("is-loading")) {
          console.warn("Forced loading state removal after timeout");
          removeLoadingState();
        }
      }, 3000);
    });

    // Handle transition complete events
    document.addEventListener("transitionend", (e) => {
      if (
        e.target.classList.contains("map-group") ||
        e.target.classList.contains("tooltip") ||
        e.target.classList.contains("step-title-container")
      ) {
        e.target.classList.add("transition-complete");
      }
    });
  }

  // Expose helper functions to window
  window.styleLoader = {
    prepareForTransition: function (element) {
      if (element) {
        element.classList.remove("transition-complete");
        void element.offsetWidth; // Force reflow
      }
    },

    nextFrame: function (callback) {
      requestAnimationFrame(() => {
        requestAnimationFrame(callback);
      });
    },
  };
})();
