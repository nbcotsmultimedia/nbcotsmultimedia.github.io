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

    // Determine which data to use
    const mapDataToUse =
      state.currentStep === 0 ? dataManager.stateData : dataManager.mapData;

    // Render map
    visualization.renderMap(
      elements.svg,
      mapDataToUse,
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

    // Get the total number of steps
    const totalSteps = config.steps.length;

    // Calculate the scroll position thresholds for each step
    // Each step gets an equal portion of the scroll range
    const stepSize = 1 / totalSteps;

    // Determine current step based on scroll position
    let newStep = 0; // Default to first step

    for (let i = 1; i < totalSteps; i++) {
      if (scrollPosition >= i * stepSize) {
        newStep = i;
      }
    }

    // Update only if step changed
    if (newStep !== state.currentStep) {
      console.log("Changing from step", state.currentStep, "to step", newStep);
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
