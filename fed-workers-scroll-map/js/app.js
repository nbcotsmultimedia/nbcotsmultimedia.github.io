// app.js - Main application code

document.addEventListener("DOMContentLoaded", () => {
  // Application state
  const state = {
    currentStep: 0, // Current visualization step
    mapInitialized: false, // Whether map has been initialized
    dimensions: null, // Current map dimensions
  };

  // Initialize UI elements
  const elements = uiManager.initialize();

  // Set initial dimensions
  state.dimensions = utils.setDimensions(elements.svg);

  // Main initialization function
  async function initialize() {
    try {
      // Load data
      await dataManager.loadAllData();

      // Hide loading message
      uiManager.hideLoading();

      // Mark as initialized
      state.mapInitialized = true;

      // Update description and render map
      uiManager.updateDescription(state.currentStep);
      renderCurrentStep();

      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing application:", error);

      // Show error message
      elements.loadingMessage.textContent =
        "Error loading map data. Please try refreshing the page.";
      elements.loadingMessage.style.backgroundColor =
        "rgba(255, 200, 200, 0.9)";
    }
  }

  // Render the current step
  function renderCurrentStep() {
    if (!state.mapInitialized || !dataManager.mapData) {
      console.warn("Cannot render map: not initialized or no data");
      return;
    }

    // Get statistics for the current step
    const stepStatistics = dataManager.getStatisticsForStep(state.currentStep);

    // Render map
    visualization.renderMap(
      elements.svg,
      dataManager.mapData,
      state.dimensions,
      state.currentStep,
      stepStatistics,
      (event, county, step, outlierInfo) =>
        uiManager.handleCountyHover(event, county, step, outlierInfo),
      () => uiManager.handleCountyLeave()
    );
  }

  // Handle scroll events to change step
  function handleScroll() {
    if (!state.mapInitialized) return;

    const containerRect = elements.mapContainer.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const containerTop = containerRect.top;
    const windowHeight = window.innerHeight;

    // Calculate scroll position relative to container
    const scrollPosition = (windowHeight / 2 - containerTop) / containerHeight;

    // Determine current step based on scroll position
    let newStep = 0; // Default to first step

    if (scrollPosition >= 0.5) {
      newStep = 1; // Second step (vulnerability index)
    }

    // Update only if step changed
    if (newStep !== state.currentStep) {
      state.currentStep = newStep;
      uiManager.updateDescription(state.currentStep);
      renderCurrentStep();
    }
  }

  // Handle window resize
  function handleResize() {
    state.dimensions = utils.setDimensions(elements.svg);

    if (state.mapInitialized) {
      renderCurrentStep();
    }
  }

  // Initialize
  initialize();

  // Set up event listeners
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", _.debounce(handleResize, 200));
});
