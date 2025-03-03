// app.js - Main application code

import config from "./config.js";
import DataManager from "./utils/data-manager.js";
import * as utils from "./utils/index.js";
import * as uiManager from "./ui-manager.js";
// Import the specific functions from visualization.js
import { renderMap } from "./visualization.js";

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

  // Create data manager instance
  const dataManager = new DataManager(utils);

  // Make dataManager globally available for visualization.js functions
  window.dataManager = dataManager;

  // Main initialization function
  async function initialize() {
    try {
      // Show loading message
      uiManager.showLoading("Loading map data...");

      // Load and process data
      const processedData = await dataManager.initialize();

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
      uiManager.showError(
        "Error loading map data. Please try refreshing the page."
      );
    }
  }

  // Render the current step
  function renderCurrentStep() {
    if (!state.mapInitialized) {
      console.warn("Cannot render map: not initialized");
      return;
    }

    // Get statistics for the current step
    let stepStatistics = dataManager.getStatisticsForStep(state.currentStep);

    // Ensure stepStatistics has all required properties
    if (!stepStatistics) {
      console.warn("No statistics returned for step", state.currentStep);
      stepStatistics = {
        min: 0,
        max: 100,
        mean: 50,
        median: 50,
        breaks: [20, 40, 60, 80, 100],
        quantileBreaks: [20, 40, 60, 80, 100],
        outliers: {
          upperBound: 100,
          lowerBound: 0,
        },
      };
    }

    // Determine which data to use based on step configuration
    const currentStepConfig = config.steps[state.currentStep];
    let mapDataToUse = currentStepConfig.isStateLevel
      ? dataManager.stateData
      : dataManager.mapData;

    console.log("Rendering step:", state.currentStep, "with data:", {
      stepConfig: currentStepConfig,
      hasMapData: !!mapDataToUse,
      mapDataLength: mapDataToUse ? mapDataToUse.length : 0,
      stateDataLength: dataManager.stateData ? dataManager.stateData.length : 0,
      dimensions: state.dimensions,
    });

    try {
      // Ensure mapDataToUse is valid
      if (!mapDataToUse || !Array.isArray(mapDataToUse)) {
        console.warn("Invalid map data for rendering", mapDataToUse);
        // Create empty array as fallback
        mapDataToUse = [];
      }

      // Ensure we have all required parameters before rendering
      if (!elements.svg || !state.dimensions || !currentStepConfig) {
        console.warn("Missing required parameters for rendering map");
        return;
      }

      // Render map using the imported renderMap function directly
      renderMap({
        svg: elements.svg,
        data: mapDataToUse,
        dimensions: state.dimensions,
        stepConfig: currentStepConfig,
        statistics: stepStatistics,
        onHover: (event, feature) =>
          uiManager.handleFeatureHover(
            event,
            feature,
            currentStepConfig,
            stepStatistics
          ),
        onLeave: () => uiManager.handleFeatureLeave(),
      });
    } catch (error) {
      console.error("Error rendering map:", error);
      uiManager.showError(
        "Error rendering visualization. Please try refreshing the page."
      );
    }
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
