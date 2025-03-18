// scrollHandler.js - Scrollytelling functionality for visualization

import config from "./config.js";
import { createElement, rafify } from "./utils.js";
import { preloadDataForNextSteps } from "./dataService.js";

// #region - State and Elements

// State for scroll interactions
let state = {
  currentStep: 0,
  sectionChangeTimeout: null,
  resizeTicking: false,
  scrollY: 0,
  headerVisible: true,
};

// DOM elements for scrollytelling
let elements = {
  sectionsContainer: null,
  progressContainer: null,
  progressBar: null,
  stepIndicators: null,
  stickyContainer: null,
  intersectionObserver: null,
  header: null,
};

// #endregion

// #region - Initialization

/**
 * Initialize scrollytelling functionality
 * @param {Object} appState - Application state
 * @param {Object} renderFunction - Function to render current step
 */
export function initializeScrollytelling(appState, renderFunction) {
  console.log("Initializing scrollytelling...");

  // Store references to important elements
  elements.header = document.querySelector("header");
  elements.stickyContainer = document.querySelector(".sticky-container");

  // Only create sections container if it doesn't exist
  if (!elements.sectionsContainer) {
    let sectionsContainer = document.querySelector(".sections");

    if (!sectionsContainer) {
      sectionsContainer = document.createElement("div");
      sectionsContainer.className = "sections";

      // Insert after the sticky container
      elements.stickyContainer = document.querySelector(".sticky-container");
      if (elements.stickyContainer) {
        elements.stickyContainer.parentNode.insertBefore(
          sectionsContainer,
          elements.stickyContainer.nextSibling
        );
      } else {
        // Fallback if sticky container not found
        document.body.appendChild(sectionsContainer);
      }
    }

    // Store reference to sections container
    elements.sectionsContainer = sectionsContainer;
  }

  // Create all scroll sections
  createScrollSections();

  // Create progress indicator if it doesn't exist already
  if (!document.querySelector(".progress-indicator")) {
    createProgressIndicator();
  }

  // Set up scroll event listener with better performance
  window.addEventListener("scroll", rafify(handleScroll), {
    passive: true,
  });

  // Use IntersectionObserver if available (much better performance)
  if ("IntersectionObserver" in window) {
    setupIntersectionObserver(appState, renderFunction);
  }

  // Set up header transition triggers
  setupHeaderTransition();

  // Enhance scroll performance
  ensureScrollSectionsStyling();

  // Set initial state based on current scroll position
  setTimeout(() => {
    handleScroll();
  }, 200);

  // Initial preload of data for upcoming sections
  preloadDataForNextSteps(state.currentStep);
}

/**
 * Set up transition effect for header and sticky container
 */
function setupHeaderTransition() {
  if (!elements.header || !elements.stickyContainer) {
    console.warn("Missing elements for header transition");
    return;
  }

  // Get header height for calculations
  const headerHeight = elements.header.offsetHeight;

  // When header is hidden, move sticky container up
  function updateStickyPosition() {
    if (window.scrollY > headerHeight && state.headerVisible) {
      // Hide header and move sticky container up
      elements.header.classList.add("scrolled");
      elements.stickyContainer.classList.add("header-hidden");
      state.headerVisible = false;
    } else if (window.scrollY <= headerHeight / 2 && !state.headerVisible) {
      // Show header and move sticky container back down
      elements.header.classList.remove("scrolled");
      elements.stickyContainer.classList.remove("header-hidden");
      state.headerVisible = true;
    }
  }

  // Add scroll listener specific to header transition
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateStickyPosition();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  // Initial position check
  updateStickyPosition();
}

/**
 * Create all scroll sections from config
 */
function createScrollSections() {
  const sectionsContainer = elements.sectionsContainer;

  // Clear any existing sections first
  while (sectionsContainer.firstChild) {
    sectionsContainer.removeChild(sectionsContainer.firstChild);
  }

  console.log(
    "Creating scroll sections for all steps including spotlight views"
  );

  // Create all sections at once
  for (let i = 0; i < config.steps.length; i++) {
    createScrollSection(i, sectionsContainer);
  }

  // Add spacer at the bottom
  const spacer = document.createElement("div");
  spacer.className = "section-spacer";
  spacer.style.height = "50vh";
  sectionsContainer.appendChild(spacer);

  // Make sure all spotlight sections have proper height and visibility
  ensureSpotlightSectionsVisibility();
}

/**
 * Create a single scroll section
 * @param {number} index - Step index
 * @param {HTMLElement} container - Container for sections
 */
function createScrollSection(index, container) {
  const step = config.steps[index];

  const section = createElement("div", {
    className: "scroll-section",
    id: `section-${index}`,
    dataset: {
      step: index,
      loaded: "true",
    },
  });

  // Add section content for better UX - each section gets a title and description
  const content = createElement("div", {
    className: "section-content",
  });

  // Add title (will be visible in the section, not just the sticky title)
  const title = createElement("h3", {
    textContent: step.title,
    className: "section-title",
  });
  content.appendChild(title);

  // Add description if available
  if (step.description) {
    const description = createElement("p", {
      textContent: step.description,
      className: "section-description",
    });
    content.appendChild(description);
  }

  // Add additional info for spotlight sections
  if (step.isSpotlightView) {
    // Add count data as a small statistic
    const stats = createElement("div", {
      className: "section-stats",
    });

    if (step.countiesCount) {
      const countiesInfo = createElement("p", {
        className: "stat-item",
        innerHTML: `<strong>${step.countiesCount.toLocaleString()}</strong> counties affected`,
      });
      stats.appendChild(countiesInfo);
    }

    if (step.federalWorkersCount) {
      const workersInfo = createElement("p", {
        className: "stat-item",
        innerHTML: `<strong>${step.federalWorkersCount.toLocaleString()}</strong> federal workers`,
      });
      stats.appendChild(workersInfo);
    }

    content.appendChild(stats);
  }

  section.appendChild(content);
  container.appendChild(section);
}

/**
 * Ensure spotlight sections have proper styling
 */
function ensureSpotlightSectionsVisibility() {
  // Get all sections
  const sections = document.querySelectorAll(".scroll-section");

  // Loop through each section
  sections.forEach((section) => {
    const stepIndex = parseInt(section.dataset.step, 10);
    const stepConfig = config.steps[stepIndex];

    // If this is a spotlight section, ensure it has proper styling
    if (stepConfig && stepConfig.isSpotlightView) {
      // Add a special class for spotlight sections
      section.classList.add("spotlight-section");

      // Add specific color for each type of spotlight
      if (stepConfig.clusterType === "rural") {
        section.style.borderLeftColor = "#41ab5d"; // Green for rural
      } else if (stepConfig.clusterType === "reservation") {
        section.style.borderLeftColor = "#0fb7d4"; // Cyan for reservations
      } else if (stepConfig.clusterType === "distressed") {
        section.style.borderLeftColor = "#c13ec7"; // Magenta for distressed
      }
    }
  });
}

/**
 * Enhance section styling for better visual feedback
 */
function ensureScrollSectionsStyling() {
  // Get all sections
  const sections = document.querySelectorAll(".scroll-section");

  // Loop through each section
  sections.forEach((section) => {
    const stepIndex = parseInt(section.dataset.step, 10);
    const stepConfig = config.steps[stepIndex];

    // Add proper box-sizing and transitions
    section.style.boxSizing = "border-box";
    section.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";

    // Add proper padding, especially for the first section to account for header
    if (stepIndex === 0) {
      const headerHeight = elements.header ? elements.header.offsetHeight : 120;
      section.style.paddingTop = `${headerHeight + 50}px`; // Add extra padding for first section
    } else {
      section.style.padding = "8vh 1rem"; // Vertical padding as percentage of viewport height
    }

    // Add margin between sections
    section.style.marginBottom = "30vh";

    // Subtle transform for active state
    section.addEventListener("transitionend", (e) => {
      if (
        e.propertyName === "opacity" &&
        section.classList.contains("active")
      ) {
        section.style.transform = "translateY(0)";
      }
    });

    // If this is a spotlight section, ensure it has proper styling
    if (stepConfig && stepConfig.isSpotlightView) {
      // Add a special class for spotlight sections
      section.classList.add("spotlight-section");

      // Set data attribute for cluster type if available
      if (stepConfig.clusterType) {
        section.setAttribute("data-cluster-type", stepConfig.clusterType);
      }
    }
  });
}

/**
 * Create progress indicator for navigation
 */
function createProgressIndicator() {
  // Create container for progress indicator
  const progressContainer = createElement("div", {
    className: "progress-indicator",
  });

  // Create progress bar
  const progressBar = createElement("div", {
    className: "progress-bar",
  });
  progressContainer.appendChild(progressBar);

  // Create step indicators
  const stepsContainer = createElement("div", {
    className: "step-indicators",
  });

  config.steps.forEach((step, index) => {
    const stepIndicator = createElement("div", {
      className: "step-indicator",
      dataset: { step: index },
      onclick: () => {
        navigateToSection(index);
      },
    });

    stepsContainer.appendChild(stepIndicator);
  });

  progressContainer.appendChild(stepsContainer);
  document.body.appendChild(progressContainer);

  // Store references
  elements.progressContainer = progressContainer;
  elements.progressBar = progressBar;
  elements.stepIndicators = stepsContainer.querySelectorAll(".step-indicator");

  // Add/remove class
  progressContainer.classList.add("initializing");
  setTimeout(() => {
    progressContainer.classList.remove("initializing");
  }, 500);

  // Make progress indicator adjust position when header hides
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 120 && state.headerVisible) {
        progressContainer.style.top = "50%";
        progressContainer.classList.add("header-hidden");
      } else if (window.scrollY <= 60 && !state.headerVisible) {
        progressContainer.style.top = "calc(50% + 60px)";
        progressContainer.classList.remove("header-hidden");
      }
    },
    { passive: true }
  );
}

// #endregion

// #region - Scroll Handling & Intersection Observer

/**
 * Set up observer to detect section visibility
 * @param {Object} appState - Application state
 * @param {Function} renderFunction - Function to call when step changes
 */
function setupIntersectionObserver(appState, renderFunction) {
  // First check if we already have sections to observe
  const sections = document.querySelectorAll(".scroll-section");
  if (sections.length === 0) {
    console.warn("No sections found to observe");
    return;
  }

  // Clean up existing observer if it exists
  if (elements.intersectionObserver) {
    elements.intersectionObserver.disconnect();
  }

  // Options for intersection observer with optimized settings for smooth transitions
  const options = {
    root: null, // Use viewport as root
    rootMargin: "-15% 0px -20% 0px", // More centered detection with bias toward top
    threshold: [0.05, 0.15, 0.25, 0.35, 0.45], // More sensitive at lower values for earlier detection
  };

  console.log(
    "Setting up IntersectionObserver for " + sections.length + " sections"
  );

  // Create a variable to track the previous spotlight section
  let previousSpotlightSection = null;

  // Create a new observer with better spotlight view detection
  const observer = new IntersectionObserver((entries) => {
    // Find the most visible section using intersection ratio as measure
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);

    if (visibleEntries.length > 0) {
      // Look at all visible entries and find the one with highest intersection ratio
      const mostVisible = visibleEntries.reduce(
        (max, entry) =>
          entry.intersectionRatio > max.intersectionRatio ? entry : max,
        visibleEntries[0]
      );

      // Check if we're changing sections to avoid unnecessary updates
      const sectionIndex = parseInt(mostVisible.target.dataset.step, 10);

      if (sectionIndex !== state.currentStep) {
        // Debounce section changes for smoother transitions
        if (state.sectionChangeTimeout) {
          clearTimeout(state.sectionChangeTimeout);
        }

        // Short delay to prevent rapid oscillation between sections
        state.sectionChangeTimeout = setTimeout(() => {
          // Get the step configuration for new section
          const newStepConfig = config.steps[sectionIndex];
          const isNewSpotlight = newStepConfig && newStepConfig.isSpotlightView;

          // Handle spotlight transition
          if (previousSpotlightSection !== null) {
            // Reset any inline styles from the previous spotlight section
            const prevSection = document.getElementById(
              `section-${previousSpotlightSection}`
            );
            if (prevSection) {
              // Keep the spotlight-section class but reset any inline styles
              prevSection.style.borderLeftColor = "";
              prevSection.style.boxShadow = "";
              // Add additional style resets as needed

              // Add a class to indicate this is a previous spotlight section
              prevSection.classList.add("previous-spotlight");
              prevSection.classList.remove("active-spotlight");
            }
          }

          // Set the current spotlight section if this is a spotlight view
          previousSpotlightSection = isNewSpotlight ? sectionIndex : null;

          // If this is a spotlight section, add a special active class
          if (isNewSpotlight) {
            mostVisible.target.classList.add("active-spotlight");

            // Add spotlight type as data attribute for specific styling
            document.body.setAttribute(
              "data-active-spotlight",
              newStepConfig.id
            );
          } else {
            // Remove spotlight data attribute if this is not a spotlight
            document.body.removeAttribute("data-active-spotlight");
          }

          // Update section active states
          sections.forEach((section) => {
            // First remove active class from all sections
            section.classList.remove("active");

            // If this isn't the current section, also remove any active-spotlight class
            if (section !== mostVisible.target) {
              section.classList.remove("active-spotlight");
            }
          });

          // Now add active class to current section
          mostVisible.target.classList.add("active");

          // Update state
          state.currentStep = sectionIndex;
          appState.currentStep = sectionIndex;

          // Call updateStepTitle if available
          if (window.main && window.main.updateStepTitle) {
            window.main.updateStepTitle(sectionIndex);
          }

          // Update progress indicator immediately for visual feedback
          updateProgressIndicator(sectionIndex, config.steps.length);

          // Use requestAnimationFrame for smoother render timing
          requestAnimationFrame(() => {
            if (appState.mapInitialized && renderFunction) {
              renderFunction();
            }
          });

          // Preload data for upcoming sections
          preloadDataForNextSteps(sectionIndex);
        }, 50); // Short delay that won't be noticeable to users
      }
    }
  }, options);

  // Start observing all sections
  sections.forEach((section) => {
    observer.observe(section);
  });

  // Store observer for cleanup
  elements.intersectionObserver = observer;
}

/**
 * Handle scroll events (fallback for browsers without IntersectionObserver)
 */
function handleScroll() {
  // Skip if we're using IntersectionObserver
  if (elements.intersectionObserver && "IntersectionObserver" in window) return;

  // Get all sections
  const sections = document.querySelectorAll(".scroll-section");
  if (sections.length === 0) {
    console.warn("No sections found for scroll handling");
    return;
  }

  // Find section closest to the middle of the viewport
  let currentSectionIndex = 0;
  let maxVisibility = 0;

  const viewportHeight = window.innerHeight;
  const viewportCenter = window.scrollY + viewportHeight / 2;

  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top + window.scrollY;
    const sectionBottom = sectionTop + rect.height;

    // Enhanced visibility calculation for spotlight sections
    let visibility;
    if (section.classList.contains("spotlight-section")) {
      // For spotlight sections, more weight to even partial visibility
      visibility = Math.min(
        1,
        (Math.min(viewportCenter + viewportHeight / 2, sectionBottom) -
          Math.max(viewportCenter - viewportHeight / 2, sectionTop)) /
          (viewportHeight * 0.7) // Lower threshold for spotlight sections
      );
    } else {
      // For regular sections, standard visibility
      const visibilityTop =
        Math.min(sectionBottom, viewportCenter) -
        Math.max(sectionTop, viewportCenter - viewportHeight / 2);
      const visibilityBottom =
        Math.min(sectionBottom, viewportCenter + viewportHeight / 2) -
        Math.max(sectionTop, viewportCenter);
      visibility = Math.max(
        0,
        (visibilityTop + visibilityBottom) / rect.height
      );
    }

    // Update active class based on visibility
    if (visibility > 0.25) {
      // Lower threshold for "active"
      section.classList.add("active");
    } else {
      section.classList.remove("active");
    }

    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      currentSectionIndex = index;
    }
  });

  // Only update if the step has changed or isn't set
  if (currentSectionIndex !== state.currentStep) {
    console.log(`Scroll: transitioning to step ${currentSectionIndex}`);

    // Update state
    state.currentStep = currentSectionIndex;

    // Update progress indicator
    updateProgressIndicator(currentSectionIndex, config.steps.length);

    // Notify caller about step change
    return currentSectionIndex;
  }

  return null;
}

/**
 * Update progress indicator
 * @param {number} currentStep - Index of current step
 * @param {number} totalSteps - Total number of steps
 */
function updateProgressIndicator(currentStep, totalSteps) {
  if (!elements.progressBar || !elements.stepIndicators) return;

  // Update progress bar - now shows vertical progress
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  elements.progressBar.style.height = `${progressPercentage}%`;

  // Update step indicators
  elements.stepIndicators.forEach((indicator, index) => {
    indicator.classList.remove("active", "completed");

    if (index === currentStep) {
      indicator.classList.add("active");
    } else if (index < currentStep) {
      indicator.classList.add("completed");
    }
  });
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

  // Get the scroll position
  const rect = section.getBoundingClientRect();
  const scrollPosition = window.scrollY + rect.top - 100; // Offset for header

  // Get the step configuration
  const stepConfig = config.steps[sectionIndex];
  const isSpotlight = stepConfig && stepConfig.isSpotlightView;

  // Handle spotlight transitions
  if (isSpotlight) {
    // Remove previous active-spotlight class from all sections
    document.querySelectorAll(".active-spotlight").forEach((s) => {
      s.classList.remove("active-spotlight");
      s.classList.add("previous-spotlight");
    });

    // Add active-spotlight class to this section
    section.classList.add("active-spotlight");
    section.classList.remove("previous-spotlight");

    // Set the data attribute for specific styling
    document.body.setAttribute("data-active-spotlight", stepConfig.id);
  } else {
    // Remove spotlight data attribute if not a spotlight
    document.body.removeAttribute("data-active-spotlight");
  }

  // Remove active class from all sections
  document.querySelectorAll(".scroll-section").forEach((s) => {
    s.classList.remove("active");
  });

  // Add active class to target section (for immediate visual feedback)
  section.classList.add("active");

  // Scroll to section
  window.scrollTo({
    top: scrollPosition,
    behavior: "smooth",
  });

  // Update state immediately for better UX
  state.currentStep = sectionIndex;
  updateProgressIndicator(sectionIndex, config.steps.length);

  return sectionIndex;
}

/**
 * Check if the page loaded with a hash tag and navigate there
 */
export function checkInitialHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#section-")) {
    const stepIndex = parseInt(hash.replace("#section-", ""), 10);
    if (
      !isNaN(stepIndex) &&
      stepIndex >= 0 &&
      stepIndex < config.steps.length
    ) {
      // Wait for everything to be set up
      setTimeout(() => {
        navigateToSection(stepIndex);
      }, 500);
    }
  }
}

// #endregion

// Export a public API for scroll handling
export default {
  initializeScrollytelling,
  navigateToSection,
  checkInitialHash,
  getCurrentStep: () => state.currentStep,
  setupHeaderTransition,
};
