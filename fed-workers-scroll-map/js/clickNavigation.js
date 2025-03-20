// clickNavigation.js - Button-based navigation replacing scrollytelling
// This module will replace the scrollama-based navigation with buttons

import config from "./config.js";

// State for navigation
let state = {
  currentStep: 0,
  isTransitioning: false,
};

// DOM elements for navigation
let elements = {
  navigationContainer: null,
  prevButton: null,
  nextButton: null,
  stepIndicators: null,
  currentStepIndicator: null,
  stickyContainer: null,
  sectionsContainer: null,
  header: null,
  stepTitleContainer: null,
};

// Store the render function reference
let renderFunction = null;
let appState = null;

/**
 * Initialize button navigation
 * @param {Object} globalAppState - Application state
 * @param {Function} globalRenderFunction - Function to render current step
 */
export function initializeButtonNavigation(
  globalAppState,
  globalRenderFunction
) {
  console.log("Initializing button navigation...");

  // Store references
  appState = globalAppState;
  renderFunction = globalRenderFunction;

  // Store references to important elements
  elements.header = document.querySelector("header");
  elements.stickyContainer = document.querySelector(".sticky-container");
  elements.sectionsContainer = document.querySelector(".sections");
  elements.stepTitleContainer = document.querySelector(".step-title-container");

  // Get existing scroll sections (we'll hide these but use their data)
  const existingSections = document.querySelectorAll(".scroll-section");

  if (existingSections.length === 0) {
    console.warn(
      "No sections found. Make sure your HTML has elements with the 'scroll-section' class."
    );
    return;
  }

  console.log(`Found ${existingSections.length} existing sections.`);

  // Create navigation container if it doesn't exist
  createNavigationContainer();

  // Hide scroll sections as we don't need them to be visible anymore
  hideScrollSections(existingSections);

  // Set initial step
  navigateToSection(0);

  // Check if URL has a hash to navigate to specific step
  checkInitialHash();

  // Add window resize handler
  window.addEventListener("resize", () => {
    // Update navigation container positioning on resize
    positionNavigationContainer();
  });

  // Position based on current screen size
  positionNavigationContainer();
}

/**
 * Create navigation container with buttons and indicators
 */
function createNavigationContainer() {
  // Create or find navigation container
  let navigationContainer = document.querySelector(
    ".click-navigation-container"
  );

  if (!navigationContainer) {
    navigationContainer = document.createElement("div");
    navigationContainer.className = "click-navigation-container";
    document.body.appendChild(navigationContainer);
  }

  // Create navigation buttons
  const prevButton = document.createElement("button");
  prevButton.className = "nav-button prev-button";
  prevButton.setAttribute("aria-label", "Previous section");
  prevButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  `;

  const nextButton = document.createElement("button");
  nextButton.className = "nav-button next-button";
  nextButton.setAttribute("aria-label", "Next section");
  nextButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;

  // Create step indicators container
  const stepsContainer = document.createElement("div");
  stepsContainer.className = "step-indicators";

  // Create and add info button to show/hide legend at small screens
  const infoButton = document.createElement("button");
  infoButton.className = "nav-button info-button";
  infoButton.setAttribute("aria-label", "Toggle information");
  infoButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  `;

  // Create a simplified, minimal step indicator
  const currentStepIndicator = document.createElement("div");
  currentStepIndicator.className = "current-step-indicator";
  currentStepIndicator.innerHTML = `<span class="current-step">1</span>/<span class="total-steps">${config.steps.length}</span>`;

  // For streamlined design, we'll only add the arrows and current step indicator
  // Add all elements to the navigation container
  navigationContainer.appendChild(prevButton);
  navigationContainer.appendChild(currentStepIndicator);
  navigationContainer.appendChild(nextButton);

  // Add event listeners for buttons
  prevButton.addEventListener("click", () => {
    navigatePrevious();
  });

  nextButton.addEventListener("click", () => {
    navigateNext();
  });

  infoButton.addEventListener("click", () => {
    toggleInformation();
  });

  // Store references
  elements.navigationContainer = navigationContainer;
  elements.prevButton = prevButton;
  elements.nextButton = nextButton;
  elements.stepIndicators =
    navigationContainer.querySelectorAll(".step-indicator");
  elements.currentStepIndicator = currentStepIndicator;

  // Add CSS styles for the navigation container
  addNavigationStyles();
}

/**
 * Add necessary CSS styles for navigation
 */
function addNavigationStyles() {
  // Create a style element if needed
  let styleElement = document.getElementById("click-navigation-styles");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "click-navigation-styles";
    document.head.appendChild(styleElement);
  }

  // Define the CSS
  const css = `
    .click-navigation-container {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: white;
      border-radius: 30px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      padding: 8px 12px;
      z-index: 1000;
      transition: all 0.3s ease;
    }
    
    .nav-button {
      background: none;
      border: none;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      cursor: pointer;
      border-radius: 50%;
      padding: 0;
      transition: all 0.2s ease;
    }
    
    .nav-button:hover, .nav-button:focus {
      background-color: rgba(0, 0, 0, 0.05);
      color: #333;
    }
    
    .nav-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .current-step-indicator {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin: 0 12px;
    }
    
    .step-indicators {
      display: none;
      gap: 8px;
      margin: 0 10px;
    }
    
    .step-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: none;
      background-color: rgba(200, 200, 200, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0;
    }
    
    .step-indicator.active {
      background-color: #333;
      transform: scale(1.3);
    }
    
    .step-indicator:hover, .step-indicator:focus {
      transform: scale(1.3);
      background-color: #666;
    }

    .info-button {
      margin-left: 5px;
    }
    
    /* Show step indicators on larger screens */
    @media (min-width: 768px) {
      .step-indicators {
        display: flex;
      }
      
      .current-step-indicator {
        display: none;
      }
      
      .click-navigation-container {
        padding: 8px 15px;
      }
    }

    /* Information toggle for mobile */
    .info-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.95);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      transform: translateY(100%);
      transition: transform 0.3s ease-out;
    }

    .info-overlay.visible {
      transform: translateY(0);
    }

    .info-overlay-content {
      max-width: 600px;
      width: 100%;
    }

    .info-close {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    }

    /* Hide scroll sections since we're using buttons */
    .sections.button-navigation-active {
      visibility: hidden;
      height: 0;
      overflow: hidden;
    }
  `;

  // Add the CSS to the style element
  styleElement.textContent = css;
}

/**
 * Position navigation container based on screen size
 */
function positionNavigationContainer() {
  if (!elements.navigationContainer) return;

  // Adjust position based on screen size
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    elements.navigationContainer.style.bottom = "20px";
    elements.navigationContainer.style.left = "50%";
    elements.navigationContainer.style.transform = "translateX(-50%)";
    elements.navigationContainer.style.flexDirection = "row";
  } else {
    // For desktop we could also position it on the side if preferred
    elements.navigationContainer.style.bottom = "20px";
    elements.navigationContainer.style.left = "50%";
    elements.navigationContainer.style.transform = "translateX(-50%)";
    elements.navigationContainer.style.flexDirection = "row";
  }
}

/**
 * Hide the original scroll sections since we're using button navigation
 * @param {NodeList} sections - Original scroll sections to hide
 */
function hideScrollSections(sections) {
  if (elements.sectionsContainer) {
    elements.sectionsContainer.classList.add("button-navigation-active");
  }
}

/**
 * Navigate to the previous section
 */
export function navigatePrevious() {
  if (state.currentStep > 0) {
    navigateToSection(state.currentStep - 1);
  }
}

/**
 * Navigate to the next section
 */
export function navigateNext() {
  if (state.currentStep < config.steps.length - 1) {
    navigateToSection(state.currentStep + 1);
  }
}

/**
 * Navigate to a specific section
 * @param {number} stepIndex - Index of the step to navigate to
 */
export function navigateToSection(stepIndex) {
  // Check if we're in the middle of a transition
  if (state.isTransitioning) return;

  console.log(`Navigating to step ${stepIndex}`);

  // Block transitions briefly
  state.isTransitioning = true;
  setTimeout(() => {
    state.isTransitioning = false;
  }, 400); // Transition block time

  // Update state
  state.currentStep = stepIndex;
  appState.currentStep = stepIndex;

  // Update UI to reflect current step
  updateStepIndicators(stepIndex);

  // Check if this is a spotlight section
  const stepConfig = config.steps[stepIndex];
  if (stepConfig && stepConfig.isSpotlightView) {
    document.body.setAttribute("data-active-spotlight", stepConfig.id);
  } else {
    document.body.removeAttribute("data-active-spotlight");
  }

  // Call the render function to update the visualization
  if (renderFunction) {
    renderFunction();
  }

  // Update URL hash for sharing
  if (history.replaceState) {
    history.replaceState(null, null, `#section-${stepIndex}`);
  }
}

/**
 * Update step indicators to reflect current state
 * @param {number} currentStep - Current step index
 */
function updateStepIndicators(currentStep) {
  // Update step indicator dots
  if (elements.stepIndicators) {
    elements.stepIndicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === currentStep);
    });
  }

  // Update the numeric step indicator
  const currentStepEl =
    elements.currentStepIndicator?.querySelector(".current-step");
  if (currentStepEl) {
    currentStepEl.textContent = currentStep + 1;
  }

  // Update navigation button states
  updateButtonState(currentStep, config.steps.length);
}

/**
 * Update button states based on current position
 * @param {number} currentStep - Current step index
 * @param {number} totalSteps - Total number of steps
 */
function updateButtonState(currentStep, totalSteps) {
  if (elements.prevButton) {
    elements.prevButton.disabled = currentStep === 0;
    elements.prevButton.style.opacity = currentStep === 0 ? "0.5" : "1";
  }

  if (elements.nextButton) {
    elements.nextButton.disabled = currentStep === totalSteps - 1;
    elements.nextButton.style.opacity =
      currentStep === totalSteps - 1 ? "0.5" : "1";
  }
}

/**
 * Toggle information overlay visibility
 */
function toggleInformation() {
  let infoOverlay = document.querySelector(".info-overlay");

  if (!infoOverlay) {
    // Create overlay if it doesn't exist
    infoOverlay = document.createElement("div");
    infoOverlay.className = "info-overlay";

    const closeBtn = document.createElement("button");
    closeBtn.className = "info-close";
    closeBtn.innerHTML = "×";
    closeBtn.addEventListener("click", toggleInformation);

    const content = document.createElement("div");
    content.className = "info-overlay-content";

    // Get current step content
    const stepConfig = config.steps[state.currentStep];
    content.innerHTML = `
      <h2>${stepConfig.title}</h2>
      <p>${stepConfig.description}</p>
      ${
        stepConfig.isSpotlightView
          ? `
      <div class="step-stats">
        <p><strong>Counties:</strong> ${stepConfig.countiesCount}</p>
        <p><strong>Federal Workers:</strong> ${stepConfig.federalWorkersCount.toLocaleString()}</p>
      </div>
      `
          : ""
      }
    `;

    infoOverlay.appendChild(closeBtn);
    infoOverlay.appendChild(content);
    document.body.appendChild(infoOverlay);

    // Trigger reflow for transition
    void infoOverlay.offsetWidth;
  }

  // Toggle visibility
  infoOverlay.classList.toggle("visible");
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

// Export the API
export default {
  initializeButtonNavigation,
  navigateToSection,
  navigatePrevious,
  navigateNext,
  checkInitialHash,
  getCurrentStep: () => state.currentStep,
};
