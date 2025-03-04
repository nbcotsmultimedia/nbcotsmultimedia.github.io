// ui-manager.js - Manages UI elements and interactions
import config from "./config.js";
import * as utils from "./utils/index.js";

// DOM elements
let elements = {
  mapContainer: null,
  description: null,
  transitionText: null,
  svg: null,
  tooltip: null,
  loadingMessage: null,
  spotlightPanel: null,
};

/**
 * Initialize the UI elements
 * @returns {Object} DOM elements
 */
export function initialize() {
  // Get DOM elements
  elements.mapContainer = document.getElementById("map-container");
  elements.description = document.getElementById("description");
  elements.transitionText = document.getElementById("transition-text");
  elements.svg = document.getElementById("map-svg");

  // Create UI elements
  elements.tooltip = utils.dom.createTooltip();
  elements.loadingMessage = utils.dom.createLoadingMessage();
  elements.spotlightPanel = createSpotlightPanel();

  // Add elements to DOM
  elements.svg.parentNode.appendChild(elements.loadingMessage);

  // Don't add spotlight panel yet - it will be added when needed

  return elements;
}

/**
 * Create a panel for displaying spotlight information
 * @returns {HTMLElement} The spotlight panel element
 */
function createSpotlightPanel() {
  const panel = document.createElement("div");
  panel.id = "spotlight-panel";
  panel.className = "spotlight-panel";
  panel.style.display = "none"; // Hidden by default

  return panel;
}

/**
 * Show loading message
 * @param {string} message - Loading message to display
 */
export function showLoading(message) {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message || "Loading...";
    elements.loadingMessage.style.display = "block";
  }
}

/**
 * Hide loading message
 */
export function hideLoading() {
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = "none";
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
export function showError(message) {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message;
    elements.loadingMessage.style.backgroundColor = "rgba(255, 200, 200, 0.9)";
    elements.loadingMessage.style.display = "block";
  }
}

/**
 * Update description text based on current step
 * @param {number} stepIndex - Current step index
 */
export function updateDescription(stepIndex) {
  if (!elements.description) return;

  const step = config.steps[stepIndex];

  // Update title and description
  let descriptionHTML = `<h3>${step.title}</h3>`;

  if (step.description) {
    descriptionHTML += `<p>${step.description}</p>`;
  }

  // Update the DOM element
  elements.description.innerHTML = descriptionHTML;

  // Update transition text if available
  if (elements.transitionText && step.transitionText) {
    elements.transitionText.innerHTML = `<p>${step.transitionText}</p>`;
    elements.transitionText.style.display = "block";
  } else if (elements.transitionText) {
    elements.transitionText.style.display = "none";
  }

  // Handle spotlight panel for the spotlight step
  if (step.spotlightMode) {
    showSpotlightPanel(step);
  } else {
    hideSpotlightPanel();
  }
}

/**
 * Hide the spotlight panel
 */
function hideSpotlightPanel() {
  if (elements.spotlightPanel) {
    elements.spotlightPanel.style.display = "none";
  }
}

/**
 * Show the spotlight panel with content from the current step
 * @param {Object} step - Current step configuration
 */
function showSpotlightPanel(step) {
  if (!elements.spotlightPanel) return;

  console.log("Showing spotlight panel with spotlights:", step.spotlights);

  // Make sure panel is in the DOM
  if (!elements.spotlightPanel.parentNode) {
    elements.mapContainer.appendChild(elements.spotlightPanel);
  }

  // Clear previous content
  elements.spotlightPanel.innerHTML = "";

  // Create title for panel
  const panelTitle = document.createElement("h4");
  panelTitle.textContent = "Vulnerability Spotlights";
  elements.spotlightPanel.appendChild(panelTitle);

  // Create content for each spotlight
  if (step.spotlights && step.spotlights.length > 0) {
    step.spotlights.forEach((spotlight) => {
      const spotlightSection = document.createElement("div");
      spotlightSection.className = "spotlight-section";
      spotlightSection.dataset.id = spotlight.id;

      // Add title
      const spotlightTitle = document.createElement("h5");
      spotlightTitle.textContent = spotlight.title || "Spotlight";
      spotlightSection.appendChild(spotlightTitle);

      // Add description
      const spotlightDesc = document.createElement("p");
      spotlightDesc.textContent = spotlight.description || "";
      spotlightSection.appendChild(spotlightDesc);

      // Add stats if available
      if (spotlight.stats && spotlight.stats.length > 0) {
        const statsList = document.createElement("ul");
        spotlight.stats.forEach((stat) => {
          const statItem = document.createElement("li");
          statItem.textContent = stat;
          statsList.appendChild(statItem);
        });
        spotlightSection.appendChild(statsList);
      }

      // Add click event to highlight corresponding counties
      spotlightSection.addEventListener("click", () => {
        // First deactivate all sections
        const sections =
          elements.spotlightPanel.querySelectorAll(".spotlight-section");
        sections.forEach((s) => s.classList.remove("active"));

        // Then activate this one
        spotlightSection.classList.add("active");

        // Use an event to communicate with the visualization
        const event = new CustomEvent("spotlight-selected", {
          detail: { spotlightId: spotlight.id },
        });
        window.dispatchEvent(event);
      });

      elements.spotlightPanel.appendChild(spotlightSection);
    });

    // Activate the first spotlight by default
    const firstSection =
      elements.spotlightPanel.querySelector(".spotlight-section");
    if (firstSection) {
      firstSection.classList.add("active");
      const firstId = firstSection.dataset.id;

      // Use an event to communicate with the visualization
      const event = new CustomEvent("spotlight-selected", {
        detail: { spotlightId: firstId },
      });
      window.dispatchEvent(event);
    }
  } else {
    // If no spotlights, show a message
    const noSpotlights = document.createElement("p");
    noSpotlights.textContent = "No spotlight data available";
    elements.spotlightPanel.appendChild(noSpotlights);
  }

  // Show the panel
  elements.spotlightPanel.style.display = "block";
}

/**
 * Toggle spotlight section active state
 * @param {string} spotlightId - ID of the spotlight to activate
 */
export function activateSpotlight(spotlightId) {
  if (!elements.spotlightPanel) return;

  console.log("Activating spotlight:", spotlightId);

  // Reset all spotlight sections
  const sections =
    elements.spotlightPanel.querySelectorAll(".spotlight-section");
  sections.forEach((section) => {
    section.classList.remove("active");
  });

  // Activate the selected spotlight
  const activeSection = elements.spotlightPanel.querySelector(
    `.spotlight-section[data-id="${spotlightId}"]`
  );
  if (activeSection) {
    activeSection.classList.add("active");

    // Scroll to the active section if needed
    activeSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/**
 * Handle feature hover - show tooltip
 * @param {Event} event - Mouse event
 * @param {Object} feature - Map feature data
 * @param {Object} step - Current step configuration
 * @param {Object} outlierInfo - Outlier statistics
 */
export function handleFeatureHover(event, feature, step, outlierInfo) {
  if (!event || !feature) return;

  // Visual highlight
  d3.select(event.currentTarget)
    .attr("stroke-width", step.isStateLevel ? 2 : 1.5)
    .attr("stroke", "#000");

  // Show tooltip with feature data
  const isStateLevel = step.isStateLevel === true;
  const name = feature.properties.name;
  const stateName = isStateLevel
    ? ""
    : feature.properties.stateName || "Unknown";

  let dataToDisplay = "";
  let outlierStatus = "";

  if (
    step.id === "state_federal_workers" ||
    step.id === "federal_workers" ||
    step.id === "federal_facilities"
  ) {
    const fedWorkersValue = isStateLevel
      ? feature.properties.state_fed_workers_per_100k
      : feature.properties.fed_workers_per_100k;

    // Add outlier status if applicable and outlierInfo exists
    if (outlierInfo && fedWorkersValue > outlierInfo.upperBound) {
      outlierStatus = `<div class="tooltip-outlier high">Significant outlier (high)</div>`;
    } else if (outlierInfo && fedWorkersValue < outlierInfo.lowerBound) {
      outlierStatus = `<div class="tooltip-outlier low">Significant outlier (low)</div>`;
    }

    dataToDisplay = `
      ${outlierStatus}
      <div class="tooltip-data">
        <div class="tooltip-row">
          <span class="tooltip-label">Federal Workers per 100k:</span>
          <span class="tooltip-value">${
            fedWorkersValue === 0
              ? "0"
              : fedWorkersValue
              ? fedWorkersValue.toFixed(1)
              : "N/A"
          }</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Federal Workers:</span>
          <span class="tooltip-value">${
            feature.properties.federal_workers
              ? feature.properties.federal_workers.toLocaleString()
              : "N/A"
          }</span>
        </div>
      </div>
    `;
  } else if (
    step.id === "vulnerability_index" ||
    step.id === "vulnerable_counties"
  ) {
    const vulnerabilityScore = feature.properties.vulnerabilityIndex;
    const fedWorkers = feature.properties.fed_workers_per_100k;

    // Check if this is a vulnerable county
    let vulnerableStatus = "";
    if (
      feature.properties.isVulnerable ||
      (fedWorkers >= config.vulnerability.highFederalThreshold &&
        vulnerabilityScore >= config.vulnerability.highVulnerabilityThreshold)
    ) {
      vulnerableStatus = `
        <div class="tooltip-vulnerable">
          High vulnerability to federal job cuts
        </div>
      `;
    }

    // For the spotlight step, check if this is a spotlighted county
    let spotlightStatus = "";
    if (step.spotlightMode && feature.properties.isSpotlighted) {
      spotlightStatus = `
        <div class="tooltip-spotlight">
          Featured county: ${
            feature.properties.spotlightCategory || "Highlighted Example"
          }
        </div>
      `;
    }

    dataToDisplay = `
      ${vulnerableStatus}
      ${spotlightStatus}
      <div class="tooltip-data">
        <div class="tooltip-row">
          <span class="tooltip-label">Vulnerability Score:</span>
          <span class="tooltip-value">${
            vulnerabilityScore ? vulnerabilityScore.toFixed(1) : "N/A"
          }</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Federal Workers per 100k:</span>
          <span class="tooltip-value">${
            fedWorkers ? fedWorkers.toFixed(1) : "N/A"
          }</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Unemployment Rate:</span>
          <span class="tooltip-value">${
            feature.properties.unemployment_rate
              ? feature.properties.unemployment_rate.toFixed(1) + "%"
              : "N/A"
          }</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Median Income:</span>
          <span class="tooltip-value">${
            feature.properties.median_income
              ? "$" + feature.properties.median_income.toLocaleString()
              : "N/A"
          }</span>
        </div>
      </div>
    `;
  }

  // Position tooltip
  const tooltipOffset = 5;
  let tooltipX = event.pageX + tooltipOffset;
  let tooltipY = event.pageY + tooltipOffset;

  // Make sure tooltip stays in viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = 250; // Approximate tooltip width
  const tooltipHeight = 150; // Approximate tooltip height

  // If tooltip would go off right edge, position it to the left of the cursor
  if (tooltipX + tooltipWidth > viewportWidth - 20) {
    tooltipX = event.pageX - tooltipWidth - tooltipOffset;
  }

  // If tooltip would go off bottom edge, position it above the cursor
  if (tooltipY + tooltipHeight > viewportHeight - 20) {
    tooltipY = event.pageY - tooltipHeight - tooltipOffset;
  }

  // Set tooltip content and position if tooltip element exists
  if (elements.tooltip) {
    elements.tooltip.style.display = "block";
    elements.tooltip.style.left = `${tooltipX}px`;
    elements.tooltip.style.top = `${tooltipY}px`;
    elements.tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${name}${isStateLevel ? "" : `, ${stateName}`}</strong>
      </div>
      ${dataToDisplay}
    `;
  }
}

/**
 * Handle feature leave - hide tooltip
 */
export function handleFeatureLeave() {
  // Return to normal styling
  if (event && event.currentTarget) {
    d3.select(event.currentTarget)
      .attr("stroke-width", 0.5)
      .attr("stroke", "#fff");
  }

  // Hide tooltip
  if (elements.tooltip) {
    elements.tooltip.style.display = "none";
  }
}
