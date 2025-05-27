// scrollHandler.js - Scrollytelling with Scrollama.js
// scrollama-handler.js - Scrollytelling with Scrollama.js

import config from "./config.js";
import { debounce } from "./utils.js";

// State for scroll interactions
let state = {
  currentStep: 0,
  scroller: null,
  isTransitioning: false,
};

// DOM elements for scrollytelling
let elements = {
  progressContainer: null,
  progressBar: null,
  stepIndicators: null,
  stickyContainer: null,
  header: null,
};

/**
 * Initialize scrollytelling with Scrollama
 * @param {Object} appState - Application state
 * @param {Function} renderFunction - Function to render current step
 */
export function initializeScrollytelling(appState, renderFunction) {
  console.log("Initializing scrollytelling with Scrollama...");

  // Store references to important elements
  elements.header = document.querySelector("header");
  elements.stickyContainer = document.querySelector(".sticky-container");

  // Ensure Scrollama is loaded
  if (typeof scrollama !== "function") {
    console.error(
      "Scrollama not found! Make sure to include the scrollama.js script."
    );
    return;
  }

  // Initialize Scrollama
  state.scroller = scrollama();

  // Select existing scroll sections
  const existingSections = document.querySelectorAll(".scroll-section");

  if (existingSections.length === 0) {
    console.warn(
      'No scroll sections found. Make sure your HTML has elements with the "scroll-section" class.'
    );
    return;
  }

  console.log(`Found ${existingSections.length} existing scroll sections.`);

  // Setup the scroller
  state.scroller
    .setup({
      step: ".scroll-section", // Elements that trigger a step
      offset: 0.5, // When the step is 50% in view
      debug: false, // Set to true during development
    })
    .onStepEnter((response) => {
      // Skip if we're in the middle of a transition
      if (state.isTransitioning) return;

      // Get the index from the step element
      const stepIndex = parseInt(response.element.dataset.step, 10);

      // Prevent rapid oscillation between steps
      state.isTransitioning = true;
      setTimeout(() => {
        state.isTransitioning = false;
      }, 200);

      console.log(
        `Scrollama: Step ${stepIndex} entered (direction: ${response.direction})`
      );

      // Update state
      state.currentStep = stepIndex;
      appState.currentStep = stepIndex;

      // Add active class to the current section
      document.querySelectorAll(".scroll-section").forEach((section) => {
        section.classList.remove("active");
        section.classList.remove("active-spotlight");
      });

      response.element.classList.add("active");

      // Check if this is a spotlight section
      const stepConfig = config.steps[stepIndex];
      if (stepConfig && stepConfig.isSpotlightView) {
        response.element.classList.add("active-spotlight");
        document.body.setAttribute("data-active-spotlight", stepConfig.id);
      } else {
        document.body.removeAttribute("data-active-spotlight");
      }

      // Call the rendering function
      if (renderFunction) {
        renderFunction();
      }

      // Update progress indicator
      updateProgressIndicator(stepIndex, config.steps.length);

      // Update step title if function exists
      if (window.main && window.main.updateStepTitle) {
        window.main.updateStepTitle(stepIndex);
      }

      // Update URL hash for sharing
      if (history.replaceState) {
        history.replaceState(null, null, `#section-${stepIndex}`);
      }
    });

  // Create progress indicator if it doesn't exist
  ensureProgressIndicator();

  // Check if URL has a hash to navigate to specific step
  checkInitialHash();

  // Update mobile navigation
  updateMobileNavigation();

  // Setup resize handler with debouncing
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      state.scroller.resize();
    }, 200);
  });
}

/**
 * Ensure progress indicator exists
 */
function ensureProgressIndicator() {
  // Check if progress indicator already exists
  let progressIndicator = document.querySelector(".progress-indicator");

  if (!progressIndicator) {
    // Create progress indicator
    progressIndicator = document.createElement("div");
    progressIndicator.className = "progress-indicator";

    // Create progress bar
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressIndicator.appendChild(progressBar);

    // Create step indicators
    const stepsContainer = document.createElement("div");
    stepsContainer.className = "step-indicators";

    // Add indicator for each step
    config.steps.forEach((step, index) => {
      const stepIndicator = document.createElement("button");
      stepIndicator.className = "step-indicator";
      stepIndicator.dataset.step = index;
      stepIndicator.setAttribute("aria-label", `Go to section: ${step.title}`);

      // Add click handler
      stepIndicator.addEventListener("click", () => {
        navigateToSection(index);
      });

      stepsContainer.appendChild(stepIndicator);
    });

    progressIndicator.appendChild(stepsContainer);
    document.body.appendChild(progressIndicator);
  }

  elements.progressContainer = progressIndicator;
  elements.progressBar = progressIndicator.querySelector(".progress-bar");
  elements.stepIndicators =
    progressIndicator.querySelectorAll(".step-indicator");
}

/**
 * Update mobile navigation buttons
 */
function updateMobileNavigation() {
  // Get references to buttons
  const prevButton = document.querySelector(".prev-button");
  const nextButton = document.querySelector(".next-button");
  const currentStepEl = document.querySelector(".current-step");
  const totalStepsEl = document.querySelector(".total-steps");

  // Set total steps count
  if (totalStepsEl) {
    totalStepsEl.textContent = config.steps.length;
  }

  // Set initial value
  if (currentStepEl) {
    currentStepEl.textContent = state.currentStep + 1;
  }

  // Add click handlers
  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (state.currentStep > 0) {
        navigateToSection(state.currentStep - 1);
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (state.currentStep < config.steps.length - 1) {
        navigateToSection(state.currentStep + 1);
      }
    });
  }

  // Initial update
  updateMobileButtonState(state.currentStep, config.steps.length);
}

/**
 * Update mobile button states
 */
function updateMobileButtonState(currentStep, totalSteps) {
  const prevButton = document.querySelector(".prev-button");
  const nextButton = document.querySelector(".next-button");

  if (prevButton) {
    prevButton.disabled = currentStep === 0;
    prevButton.style.opacity = currentStep === 0 ? "0.5" : "1";
  }

  if (nextButton) {
    nextButton.disabled = currentStep === totalSteps - 1;
    nextButton.style.opacity = currentStep === totalSteps - 1 ? "0.5" : "1";
  }
}

/**
 * Update progress indicator
 * @param {number} currentStep - Current step index
 * @param {number} totalSteps - Total number of steps
 */
function updateProgressIndicator(currentStep, totalSteps) {
  // Update progress bar
  if (elements.progressBar) {
    const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
    elements.progressBar.style.height = `${progressPercentage}%`;
  }

  // Update step indicators
  if (elements.stepIndicators) {
    elements.stepIndicators.forEach((indicator, index) => {
      indicator.classList.remove("active", "completed");

      if (index === currentStep) {
        indicator.classList.add("active");
      } else if (index < currentStep) {
        indicator.classList.add("completed");
      }
    });
  }

  // Update mobile step indicator
  const currentStepEl = document.querySelector(".current-step");
  if (currentStepEl) {
    currentStepEl.textContent = currentStep + 1;
  }

  // Update mobile buttons state
  updateMobileButtonState(currentStep, totalSteps);
}

/**
 * Navigate to a specific section
 * @param {number} sectionIndex - Index of the section to navigate to
 */
export function navigateToSection(sectionIndex) {
  const section = document.querySelector(`#section-${sectionIndex}`);
  if (!section) {
    console.warn(`Section with index ${sectionIndex} not found`);
    return;
  }

  // Scroll to section
  section.scrollIntoView({ behavior: "smooth" });

  // Update state immediately for responsive UX
  state.currentStep = sectionIndex;
  updateProgressIndicator(sectionIndex, config.steps.length);
}

/**
 * Check if URL has a hash and navigate there
 */
export function checkInitialHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#section-")) {
    const sectionIndex = parseInt(hash.replace("#section-", ""), 10);

    if (
      !isNaN(sectionIndex) &&
      sectionIndex >= 0 &&
      sectionIndex < config.steps.length
    ) {
      setTimeout(() => {
        navigateToSection(sectionIndex);
      }, 500);
    }
  }
}

export default {
  initializeScrollytelling,
  navigateToSection,
  checkInitialHash,
  getCurrentStep: () => state.currentStep,
};
