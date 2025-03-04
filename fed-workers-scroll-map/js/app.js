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
      uiManager.showLoading("Loading base map...");

      // Load and process critical data first for faster initial render
      const baseData = await dataManager.initializeBaseMap();

      // Mark base map as initialized
      state.mapInitialized = true;

      // Update description and render base map
      uiManager.updateDescription(state.currentStep);
      renderCurrentStep();

      // Change loading message but keep it displayed
      uiManager.showLoading("Loading detailed data...");

      // Load additional data in background
      await dataManager.loadDetailData();

      // Now hide loading message
      uiManager.hideLoading();

      // Re-render with complete data
      state.needsRender = true;
      renderCurrentStep();

      console.log("Map initialization fully complete");

      // Listen for data updates
      window.addEventListener("dataUpdate", () => {
        state.needsRender = true;
        renderCurrentStep();
      });
    } catch (error) {
      console.error("Error initializing application:", error);
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

    // Only re-render if necessary (add check for data or step change)
    if (!state.needsRender && state.lastRenderedStep === state.currentStep) {
      return;
    }

    // Get statistics for the current step
    let stepStatistics = dataManager.getStatisticsForStep(state.currentStep);

    // Reset flag
    state.needsRender = false;
    state.lastRenderedStep = state.currentStep;

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
        // Add facilitiesData parameter
        facilitiesData: dataManager.facilitiesData,
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

    // Throttle scroll events
    if (state.scrollThrottle) return;

    state.scrollThrottle = true;
    setTimeout(() => {
      state.scrollThrottle = false;
    }, 60); // Slightly more responsive

    const containerRect = elements.mapContainer.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const containerTop = containerRect.top;
    const windowHeight = window.innerHeight;

    // Calculate scroll position relative to container
    const scrollPosition = (windowHeight / 2 - containerTop) / containerHeight;

    // Get the total number of steps
    const totalSteps = config.steps.length;

    // Calculate the scroll position thresholds for each step
    const stepSize = 1 / totalSteps;

    // Determine current step based on scroll position
    let newStep = 0; // Default to first step

    for (let i = 1; i < totalSteps; i++) {
      if (scrollPosition >= i * stepSize) {
        newStep = i;
      }
    }

    // Store the scroll progress within the current step (0 to 1)
    // This can be used for more fine-grained animations
    const stepProgress = (scrollPosition - newStep * stepSize) / stepSize;
    state.currentStepProgress = Math.max(0, Math.min(1, stepProgress));

    // Update only if step changed
    if (newStep !== state.currentStep) {
      console.log(
        "Changing from step",
        state.currentStep,
        "to step",
        newStep,
        "with progress",
        stepProgress
      );

      // Store the previous step for transition effects
      state.previousStep = state.currentStep;
      state.currentStep = newStep;
      state.needsRender = true;

      // Show transition indicator if available
      if (elements.stepIndicator) {
        updateStepIndicator(state.currentStep, totalSteps);
      }

      // Update description with transition animation
      uiManager.updateDescription(state.currentStep);

      // Render the current step
      renderCurrentStep();

      // If this is a transition to or from a spotlight step, handle special transitions
      handleSpotlightTransition(state.previousStep, state.currentStep);
    }

    // Even if the step hasn't changed, we can update some visual elements
    // based on the scroll progress within a step
    updateVisualElementsBasedOnProgress(
      state.currentStep,
      state.currentStepProgress
    );
  }

  /**
   * Update visual elements based on scroll progress within a step
   * @param {number} currentStep - The current step index
   * @param {number} progress - The progress within the step (0 to 1)
   */
  function updateVisualElementsBasedOnProgress(currentStep, progress) {
    // This can be used to create subtle animations as the user scrolls within a step
    // For example, you could fade certain elements, adjust opacity, etc.

    // For spotlight steps, we can fade between different highlighted counties
    if (currentStep >= 3 && currentStep <= 5) {
      // Steps 4-6 are index 3-5
      // Adjust spotlight panel opacity based on scroll position
      if (elements.spotlightPanel) {
        // Fade in at the beginning of the step and out at the end
        const opacity =
          progress < 0.1
            ? progress * 10
            : progress > 0.9
            ? (1 - progress) * 10
            : 1;
        elements.spotlightPanel.style.opacity = opacity.toString();
      }
    }
  }

  /**
   * Special transition handling when moving to/from spotlight steps
   * @param {number} previousStep - The previous step index
   * @param {number} currentStep - The current step index
   */
  function handleSpotlightTransition(previousStep, currentStep) {
    // Check if we're transitioning to or from a spotlight step
    const isEnteringSpotlight =
      (previousStep < 3 && currentStep >= 3) ||
      (previousStep > 5 && currentStep >= 3 && currentStep <= 5);

    const isExitingSpotlight =
      previousStep >= 3 &&
      previousStep <= 5 &&
      (currentStep < 3 || currentStep > 5);

    const isChangingSpotlight =
      previousStep >= 3 &&
      previousStep <= 5 &&
      currentStep >= 3 &&
      currentStep <= 5 &&
      previousStep !== currentStep;

    if (isEnteringSpotlight) {
      // Add a welcome message or visual cue when entering spotlight section
      showSpotlightIntro(currentStep - 3); // Convert to 0-based index for spotlights
    } else if (isExitingSpotlight) {
      // Clean up any spotlight-specific elements
      hideSpotlightElements();
    } else if (isChangingSpotlight) {
      // Smoothly transition between different spotlight types
      transitionBetweenSpotlights(previousStep - 3, currentStep - 3);
    }
  }

  /**
   * Show introduction elements when entering a spotlight section
   * @param {number} spotlightIndex - The index of the spotlight (0-2)
   */
  function showSpotlightIntro(spotlightIndex) {
    // Create and display any special intro elements for spotlights
    // This could be a brief splash screen explaining the spotlight type

    const spotlightTypes = [
      "Triple Threat Areas",
      "Extreme Dependency Communities",
      "Tribal Communities & Rural Areas",
    ];

    const introText = [
      "These areas face multiple economic challenges that make them especially vulnerable to federal job cuts.",
      "These communities have an unusually high percentage of federal jobs, creating significant dependency.",
      "These areas already face limited economic opportunities, making federal employment critical.",
    ];

    // Create a temporary intro overlay if it doesn't exist
    if (!elements.spotlightIntro) {
      elements.spotlightIntro = document.createElement("div");
      elements.spotlightIntro.className = "spotlight-intro";
      elements.spotlightIntro.style.position = "absolute";
      elements.spotlightIntro.style.top = "50%";
      elements.spotlightIntro.style.left = "50%";
      elements.spotlightIntro.style.transform = "translate(-50%, -50%)";
      elements.spotlightIntro.style.background = "rgba(255, 255, 255, 0.9)";
      elements.spotlightIntro.style.padding = "20px";
      elements.spotlightIntro.style.borderRadius = "8px";
      elements.spotlightIntro.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      elements.spotlightIntro.style.zIndex = "1000";
      elements.spotlightIntro.style.textAlign = "center";
      elements.spotlightIntro.style.maxWidth = "400px";
      elements.spotlightIntro.style.transition = "opacity 0.5s ease";
      elements.spotlightIntro.style.opacity = "0";

      // Add to the DOM
      elements.mapContainer.appendChild(elements.spotlightIntro);
    }

    // Update content
    elements.spotlightIntro.innerHTML = `
    <h3 style="color: #333; margin-bottom: 10px;">Spotlight: ${spotlightTypes[spotlightIndex]}</h3>
    <p style="color: #555; margin-bottom: 15px;">${introText[spotlightIndex]}</p>
    <p style="font-size: 12px; color: #777;">Continue scrolling to explore</p>
  `;

    // Different border color based on spotlight type
    const borderColors = ["#a50f15", "#de2d26", "#fb6a4a"];
    elements.spotlightIntro.style.borderLeft = `4px solid ${borderColors[spotlightIndex]}`;

    // Show with fade in
    elements.spotlightIntro.style.opacity = "1";

    // Auto hide after 3 seconds
    setTimeout(() => {
      if (elements.spotlightIntro) {
        elements.spotlightIntro.style.opacity = "0";

        // Remove from DOM after fade out
        setTimeout(() => {
          if (elements.spotlightIntro && elements.spotlightIntro.parentNode) {
            elements.spotlightIntro.parentNode.removeChild(
              elements.spotlightIntro
            );
            elements.spotlightIntro = null;
          }
        }, 500);
      }
    }, 3000);
  }

  /**
   * Hide any spotlight-specific elements when exiting spotlight sections
   */
  function hideSpotlightElements() {
    // Remove any intro elements
    if (elements.spotlightIntro && elements.spotlightIntro.parentNode) {
      elements.spotlightIntro.parentNode.removeChild(elements.spotlightIntro);
      elements.spotlightIntro = null;
    }

    // Hide the spotlight panel with a fade out
    if (elements.spotlightPanel) {
      elements.spotlightPanel.style.transition = "opacity 0.5s ease";
      elements.spotlightPanel.style.opacity = "0";

      // After fading out, actually hide it
      setTimeout(() => {
        if (elements.spotlightPanel) {
          elements.spotlightPanel.style.display = "none";
        }
      }, 500);
    }
  }

  /**
   * Smooth transition between different spotlight types
   * @param {number} fromIndex - Previous spotlight index (0-2)
   * @param {number} toIndex - New spotlight index (0-2)
   */
  function transitionBetweenSpotlights(fromIndex, toIndex) {
    // Create a temporary transition indicator
    const transitionIndicator = document.createElement("div");
    transitionIndicator.className = "spotlight-transition";
    transitionIndicator.style.position = "absolute";
    transitionIndicator.style.top = "20px";
    transitionIndicator.style.left = "50%";
    transitionIndicator.style.transform = "translateX(-50%)";
    transitionIndicator.style.background = "rgba(255, 255, 255, 0.95)";
    transitionIndicator.style.padding = "8px 15px";
    transitionIndicator.style.borderRadius = "20px";
    transitionIndicator.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    transitionIndicator.style.zIndex = "1000";
    transitionIndicator.style.fontSize = "12px";
    transitionIndicator.style.fontWeight = "bold";
    transitionIndicator.style.color = "#333";
    transitionIndicator.style.transition = "opacity 0.3s ease";
    transitionIndicator.style.opacity = "0";

    // Spotlight names
    const spotlightNames = [
      "Triple Threat Areas",
      "Extreme Dependency Communities",
      "Tribal & Rural Communities",
    ];

    // Set content
    transitionIndicator.innerHTML = `Viewing: ${spotlightNames[toIndex]}`;

    // Add to DOM
    elements.mapContainer.appendChild(transitionIndicator);

    // Show with fade in
    setTimeout(() => {
      transitionIndicator.style.opacity = "1";
    }, 10);

    // Auto hide after 2 seconds
    setTimeout(() => {
      transitionIndicator.style.opacity = "0";

      // Remove from DOM after fade out
      setTimeout(() => {
        if (transitionIndicator.parentNode) {
          transitionIndicator.parentNode.removeChild(transitionIndicator);
        }
      }, 300);
    }, 2000);
  }

  /**
   * Update step indicator to show current position in story
   * @param {number} currentStep - The current step index
   * @param {number} totalSteps - Total number of steps
   */
  function updateStepIndicator(currentStep, totalSteps) {
    if (!elements.stepIndicator) {
      // Create step indicator if it doesn't exist
      elements.stepIndicator = document.createElement("div");
      elements.stepIndicator.className = "step-indicator";
      elements.stepIndicator.style.position = "fixed";
      elements.stepIndicator.style.right = "15px";
      elements.stepIndicator.style.top = "50%";
      elements.stepIndicator.style.transform = "translateY(-50%)";
      elements.stepIndicator.style.display = "flex";
      elements.stepIndicator.style.flexDirection = "column";
      elements.stepIndicator.style.gap = "8px";
      elements.stepIndicator.style.zIndex = "1000";

      // Create dots for each step
      for (let i = 0; i < totalSteps; i++) {
        const dot = document.createElement("div");
        dot.className = "step-dot";
        dot.dataset.step = i;
        dot.style.width = "10px";
        dot.style.height = "10px";
        dot.style.borderRadius = "50%";
        dot.style.backgroundColor = "#ccc";
        dot.style.transition = "all 0.3s ease";
        dot.style.cursor = "pointer";

        // Add click event to navigate to this step
        dot.addEventListener("click", () => {
          // Calculate the scroll position for this step
          const stepSize = 1 / totalSteps;
          const targetScroll =
            i * stepSize * containerHeight + windowHeight / 2;

          // Scroll to the position
          window.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        });

        elements.stepIndicator.appendChild(dot);
      }

      document.body.appendChild(elements.stepIndicator);
    }

    // Update active dot
    const dots = elements.stepIndicator.querySelectorAll(".step-dot");
    dots.forEach((dot, index) => {
      if (index === currentStep) {
        dot.style.backgroundColor = getStepColor(index);
        dot.style.transform = "scale(1.3)";
        dot.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
      } else {
        dot.style.backgroundColor = "#ccc";
        dot.style.transform = "scale(1)";
        dot.style.boxShadow = "none";
      }
    });
  }

  /**
   * Get color for a step based on its type
   * @param {number} stepIndex - Step index
   * @returns {string} - Color code
   */
  function getStepColor(stepIndex) {
    if (stepIndex < 3) {
      return "#3182bd"; // Blue for federal worker steps
    } else if (stepIndex === 3) {
      return "#a50f15"; // Dark red for triple threat
    } else if (stepIndex === 4) {
      return "#de2d26"; // Medium red for extreme dependency
    } else if (stepIndex === 5) {
      return "#fb6a4a"; // Light red for tribal communities
    } else {
      return "#555"; // Default color
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
