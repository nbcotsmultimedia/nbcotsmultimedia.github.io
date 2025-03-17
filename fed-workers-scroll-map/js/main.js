// main.js - Entry point and core application logic

import config from "./config.js";
import {
  createLoadingMessage,
  showLoading,
  hideLoading,
  showError,
} from "./utils.js";
import dataService from "./dataService.js";
import mapRenderer from "./mapRenderer.js";
import scrollHandler from "./scrollHandler.js";
import tooltipManager from "./tooltipManager.js";

// #region - Application State

// Application state
const state = {
  currentStep: 0,
  mapInitialized: false,
  initialMapShown: false,
  dimensions: null,
  data: {
    counties: null,
    states: null,
  },
  currentRenderId: null,
  headerHidden: false,
  lastScrollY: 0,
};

// DOM elements
const elements = {
  mapContainer: null,
  description: null,
  svg: null,
  tooltip: null,
  loadingMessage: null,
  sectionsContainer: null,
  stickyContainer: null,
  header: null,
  stepTitleContainer: null,
  currentStepTitle: null,
  currentStepDescription: null,
};

// #endregion

// #region - Initialization and Setup

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

// App initialization with deferred loading
async function initializeApp() {
  console.log("Initializing application...");

  // Initialize cache system first
  dataService.initializeCache();

  // Get essential DOM elements
  elements.mapContainer = document.getElementById("map-container");
  elements.description = document.getElementById("description");
  elements.svg = document.getElementById("map-svg");
  elements.header = document.querySelector("header");
  elements.stickyContainer = document.querySelector(".sticky-container");

  // Create loading message (immediate visual feedback)
  elements.loadingMessage = createLoadingMessage();
  elements.svg.parentNode.appendChild(elements.loadingMessage);

  // Set up sticky map container
  setupStickyMap();

  // Set up scroll event listeners for header hiding
  setupScrollListeners();

  // Set initial dimensions
  state.dimensions = mapRenderer.initializeMapSvg(elements.svg);

  // Stage 1: Initial load of just state outlines for immediate display
  try {
    showLoading(elements.loadingMessage, "Loading map data...");

    // Start progressive loading of all data
    dataService
      .loadDataProgressive((data) => {
        // Update state with the latest data
        state.data = data;

        // Mark map as initialized once we have some data
        if (!state.mapInitialized && data.states && data.states.length > 0) {
          state.mapInitialized = true;
        }

        // Store the data in window for direct access
        window.currentData = data;

        // Render current step with the updated data
        renderCurrentStep();

        // After initial rendering, force load the cluster data
        if (data.counties && data.counties.length > 0) {
          dataService.loadClusterData().then((clusterData) => {
            console.log("Loaded cluster data:", {
              ruralCount: clusterData.ruralFedData.length,
              reservationCount: clusterData.reservationData.length,
              distressedCount: clusterData.distressedData.length,
            });

            // Apply the cluster data directly to the state data
            dataService.enhanceDataWithClusters(state.data, clusterData);

            // Re-render with enhanced data
            renderCurrentStep();
          });
        }
      })
      .then(() => {
        // Mark map as fully initialized
        state.mapInitialized = true;
        hideLoading(elements.loadingMessage);

        // Defer non-essential initializations
        setTimeout(() => {
          // Initialize scrollytelling after map is visible
          scrollHandler.initializeScrollytelling(state, renderCurrentStep);

          // Check if URL has a hash to navigate to specific step
          scrollHandler.checkInitialHash();

          // Apply enhanced scroll performance optimizations
          enhanceScrollPerformance();

          console.log("Application fully initialized");
        }, 500); // Delay to ensure main content is visible first
      });
  } catch (error) {
    console.error("Error initializing application:", error);
    showError(
      elements.loadingMessage,
      "Error loading map data. Please try refreshing the page."
    );
  }
}

// Set up scroll event listeners for header/sticky behavior
function setupScrollListeners() {
  if (!elements.header || !elements.stickyContainer) return;

  let ticking = false;
  const headerHeight = elements.header.offsetHeight;

  // Listen for scroll events
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDirection =
            currentScrollY > state.lastScrollY ? "down" : "up";

          // Hide header when scrolling down past header height
          if (scrollDirection === "down" && currentScrollY > headerHeight) {
            if (!state.headerHidden) {
              elements.header.classList.add("scrolled");
              console.log("Added scrolled class", currentScrollY, headerHeight);
              elements.stickyContainer.classList.add("header-hidden");
              state.headerHidden = true;
            }
          }
          // Show header when scrolling up significantly or at top
          else if (
            (scrollDirection === "up" &&
              state.headerHidden &&
              state.lastScrollY - currentScrollY > 50) ||
            currentScrollY < headerHeight / 2
          ) {
            elements.header.classList.remove("scrolled");
            elements.stickyContainer.classList.remove("header-hidden");
            state.headerHidden = false;
          }

          state.lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
}

// Set up sticky map container for scrollytelling
function setupStickyMap() {
  // Check if we already have a sticky container in the HTML
  const existingStickyContainer = document.querySelector(".sticky-container");

  if (
    existingStickyContainer &&
    existingStickyContainer.contains(elements.mapContainer)
  ) {
    // Already set up correctly in HTML
    elements.stickyContainer = existingStickyContainer;
    console.log("Using existing sticky container from HTML");
    return;
  }

  // Create a container for the sticky map if needed
  const stickyContainer =
    existingStickyContainer || document.createElement("div");
  stickyContainer.className = "sticky-container";

  // Get the parent of the map container
  const parent = elements.mapContainer.parentNode;

  // Only move things around if we're creating a new structure
  if (!existingStickyContainer) {
    // Move the map container into the sticky container
    parent.insertBefore(stickyContainer, elements.mapContainer);
    stickyContainer.appendChild(elements.mapContainer);
  }

  // Store reference
  elements.stickyContainer = stickyContainer;

  // Create and add a title container if it doesn't exist
  // In the setupStickyMap function, replace the section that handles the title container
  // Store reference to the existing title container
  elements.stepTitleContainer = document.querySelector(".step-title-container");
  if (elements.stepTitleContainer) {
    elements.currentStepTitle = elements.stepTitleContainer.querySelector(
      ".current-step-title"
    );
    elements.currentStepDescription = elements.stepTitleContainer.querySelector(
      ".current-step-description"
    );
    console.log(
      "Found existing step title container:",
      elements.stepTitleContainer
    );
  }

  console.log("Sticky container set up:", stickyContainer);
}

// Enhanced performance optimizations
function enhanceScrollPerformance() {
  // Use optimized resize handler with requestAnimationFrame
  window.addEventListener(
    "resize",
    () => {
      if (!state.resizeTicking) {
        requestAnimationFrame(() => {
          state.dimensions = mapRenderer.initializeMapSvg(elements.svg);
          if (state.mapInitialized) {
            renderCurrentStep();
          }
          state.resizeTicking = false;
        });
        state.resizeTicking = true;
      }
    },
    { passive: true }
  );

  // Preload data for upcoming steps
  dataService.preloadDataForNextSteps(state.currentStep);
}

// Update step title with proper styling
function updateStepTitle(stepIndex) {
  // Get the elements directly from the DOM in case they weren't properly stored
  const titleElement = document.querySelector(".current-step-title");
  const descriptionElement = document.querySelector(
    ".current-step-description"
  );

  console.log("Updating title for step:", stepIndex, {
    titleElement,
    descriptionElement,
  });

  const stepConfig = config.steps[stepIndex];
  if (stepConfig) {
    // Update title
    if (titleElement) {
      titleElement.textContent = stepConfig.title;
    }

    // Update description
    if (descriptionElement && stepConfig.description) {
      descriptionElement.textContent = stepConfig.description;

      // Add stats element for spotlight views
      if (stepConfig.isSpotlightView) {
        // Do nothing, or you could add alternative content here
        // For example, you could add a special class to the description instead
      } else {
        const statsElement = document.querySelector(".step-stats");
        if (statsElement) {
          statsElement.remove();
        }
      }
    }
  }

  console.log("Updated title and description for step:", stepIndex);
}

// #endregion

// #region - Rendering and Map Display

// Delegate rendering to the map renderer
function renderCurrentStep() {
  if (!state.mapInitialized || !elements.svg) {
    console.warn("Cannot render map: not initialized");
    return;
  }

  // Add debug logging to verify elements exist
  console.log("Step title elements:", {
    container: elements.stepTitleContainer,
    title: elements.currentStepTitle,
    description: elements.currentStepDescription,
  });

  // Update the step title
  updateStepTitle(state.currentStep);

  const svgElement = d3.select(elements.svg);

  // Delegate to the renderer, passing all necessary elements
  mapRenderer.renderCurrentStep(
    state,
    state.data,
    svgElement,
    state.dimensions,
    tooltipManager
  );

  // Update window location hash for easier sharing
  if (history.replaceState) {
    history.replaceState(null, null, `#section-${state.currentStep}`);
  }
}

// #endregion

// Export public API
export default {
  // Expose these for debugging or external control
  state,
  elements,
  renderCurrentStep,
  navigateToSection: scrollHandler.navigateToSection,
  updateStepTitle,
};
