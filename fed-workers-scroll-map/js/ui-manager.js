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

  // if (step.description) {
  //   descriptionHTML += `<p>${step.description}</p>`;
  // }

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

  console.log(
    "Showing enhanced spotlight panel with spotlights:",
    step.spotlights
  );

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

  // Add subtitle explaining the panel
  const panelSubtitle = document.createElement("p");
  panelSubtitle.className = "panel-subtitle";
  panelSubtitle.textContent =
    "Select a spotlight to focus on different types of vulnerable communities";
  panelSubtitle.style.fontSize = "12px";
  panelSubtitle.style.fontStyle = "italic";
  panelSubtitle.style.color = "#666";
  panelSubtitle.style.marginBottom = "15px";
  elements.spotlightPanel.appendChild(panelSubtitle);

  // Create content for each spotlight
  if (step.spotlights && step.spotlights.length > 0) {
    step.spotlights.forEach((spotlight) => {
      const spotlightSection = document.createElement("div");
      spotlightSection.className = "spotlight-section";
      spotlightSection.dataset.id = spotlight.id;

      // Create spotlight header container (will contain title and icon)
      const headerContainer = document.createElement("div");
      headerContainer.className = "spotlight-header";
      headerContainer.style.display = "flex";
      headerContainer.style.alignItems = "center";
      headerContainer.style.marginBottom = "8px";
      spotlightSection.appendChild(headerContainer);

      // Add icon based on spotlight category
      const icon = document.createElement("div");
      icon.className = "spotlight-icon";
      icon.style.width = "20px";
      icon.style.height = "20px";
      icon.style.borderRadius = "50%";
      icon.style.marginRight = "10px";
      icon.style.flexShrink = "0";

      // Set color based on spotlight category
      if (spotlight.id === "triple_threat") {
        icon.style.backgroundColor = "#a50f15";
      } else if (spotlight.id === "extreme_dependency") {
        icon.style.backgroundColor = "#de2d26";
      } else if (spotlight.id === "tribal_rural") {
        icon.style.backgroundColor = "#fb6a4a";
      } else {
        icon.style.backgroundColor = "#f03b20";
      }

      headerContainer.appendChild(icon);

      // Add title
      const spotlightTitle = document.createElement("h5");
      spotlightTitle.textContent = spotlight.title || "Spotlight";
      spotlightTitle.style.margin = "0";
      headerContainer.appendChild(spotlightTitle);

      // Add description
      const spotlightDesc = document.createElement("p");
      spotlightDesc.textContent = spotlight.description || "";
      spotlightDesc.style.fontSize = "13px";
      spotlightDesc.style.lineHeight = "1.4";
      spotlightSection.appendChild(spotlightDesc);

      // Add stats in a visually appealing way
      if (spotlight.stats && spotlight.stats.length > 0) {
        const statsContainer = document.createElement("div");
        statsContainer.className = "stats-container";
        statsContainer.style.backgroundColor = "#f9f9f9";
        statsContainer.style.borderRadius = "4px";
        statsContainer.style.padding = "8px";
        statsContainer.style.marginTop = "10px";

        const statsTitle = document.createElement("div");
        statsTitle.textContent = "Key Statistics";
        statsTitle.style.fontSize = "12px";
        statsTitle.style.fontWeight = "bold";
        statsTitle.style.marginBottom = "5px";
        statsContainer.appendChild(statsTitle);

        const statsList = document.createElement("ul");
        statsList.style.listStyleType = "none";
        statsList.style.padding = "0";
        statsList.style.margin = "0";

        spotlight.stats.forEach((stat) => {
          const statItem = document.createElement("li");
          statItem.textContent = stat;
          statItem.style.fontSize = "12px";
          statItem.style.padding = "3px 0";
          statItem.style.display = "flex";
          statItem.style.alignItems = "center";

          // Add bullet point icon
          const bulletPoint = document.createElement("span");
          bulletPoint.innerHTML = "&#8226;"; // Bullet character
          bulletPoint.style.color = icon.style.backgroundColor;
          bulletPoint.style.fontSize = "16px";
          bulletPoint.style.marginRight = "8px";
          statItem.prepend(bulletPoint);

          statsList.appendChild(statItem);
        });

        statsContainer.appendChild(statsList);
        spotlightSection.appendChild(statsContainer);
      }

      // Add a small "view on map" button
      const viewButton = document.createElement("button");
      viewButton.textContent = "View on Map";
      viewButton.className = "view-map-button";
      viewButton.style.backgroundColor = "#f0f0f0";
      viewButton.style.border = "1px solid #ddd";
      viewButton.style.borderRadius = "4px";
      viewButton.style.padding = "5px 10px";
      viewButton.style.fontSize = "11px";
      viewButton.style.cursor = "pointer";
      viewButton.style.marginTop = "10px";
      viewButton.style.transition = "background-color 0.2s";

      // Add hover effect
      viewButton.addEventListener("mouseover", function () {
        this.style.backgroundColor = "#e0e0e0";
      });

      viewButton.addEventListener("mouseout", function () {
        this.style.backgroundColor = "#f0f0f0";
      });

      spotlightSection.appendChild(viewButton);

      // Add click event to highlight corresponding counties
      // Use both the section and button click events
      const selectSpotlight = () => {
        // First deactivate all sections
        const sections =
          elements.spotlightPanel.querySelectorAll(".spotlight-section");
        sections.forEach((s) => {
          s.classList.remove("active");
          s.style.borderLeft = "none";
          s.style.paddingLeft = "10px";

          // Reset any view buttons
          const btn = s.querySelector(".view-map-button");
          if (btn) {
            btn.textContent = "View on Map";
            btn.style.backgroundColor = "#f0f0f0";
          }
        });

        // Then activate this one
        spotlightSection.classList.add("active");
        spotlightSection.style.borderLeft = `4px solid ${icon.style.backgroundColor}`;
        spotlightSection.style.paddingLeft = "12px";

        // Update button text and style
        viewButton.textContent = "Currently Viewing";
        viewButton.style.backgroundColor = "#e6e6e6";

        // Use an event to communicate with the visualization
        const event = new CustomEvent("spotlight-selected", {
          detail: { spotlightId: spotlight.id },
        });
        window.dispatchEvent(event);
      };

      spotlightSection.addEventListener("click", selectSpotlight);
      viewButton.addEventListener("click", function (e) {
        e.stopPropagation(); // Prevent double triggering
        selectSpotlight();
      });

      elements.spotlightPanel.appendChild(spotlightSection);
    });

    // Activate the first spotlight by default
    const firstSection =
      elements.spotlightPanel.querySelector(".spotlight-section");
    if (firstSection) {
      // Trigger a click to activate it
      setTimeout(() => {
        firstSection.click();
      }, 100);
    }
  } else {
    // If no spotlights, show a message
    const noSpotlights = document.createElement("p");
    noSpotlights.textContent = "No spotlight data available";
    elements.spotlightPanel.appendChild(noSpotlights);
  }

  // Add data source info at the bottom
  const dataSource = document.createElement("div");
  dataSource.className = "data-source";
  dataSource.textContent = "Data: Federal employment statistics & Census data";
  dataSource.style.fontSize = "10px";
  dataSource.style.color = "#888";
  dataSource.style.marginTop = "15px";
  dataSource.style.borderTop = "1px solid #eee";
  dataSource.style.paddingTop = "5px";
  elements.spotlightPanel.appendChild(dataSource);

  // Show the panel with a fade-in effect
  elements.spotlightPanel.style.opacity = "0";
  elements.spotlightPanel.style.display = "block";

  // Apply fade-in transition
  setTimeout(() => {
    elements.spotlightPanel.style.transition = "opacity 0.5s ease";
    elements.spotlightPanel.style.opacity = "1";
  }, 10);
}

/**
 * Toggle spotlight section active state with enhanced visual feedback
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
    section.style.borderLeft = "none";
    section.style.paddingLeft = "10px";

    // Reset view buttons
    const btn = section.querySelector(".view-map-button");
    if (btn) {
      btn.textContent = "View on Map";
      btn.style.backgroundColor = "#f0f0f0";
    }
  });

  // Activate the selected spotlight
  const activeSection = elements.spotlightPanel.querySelector(
    `.spotlight-section[data-id="${spotlightId}"]`
  );

  if (activeSection) {
    activeSection.classList.add("active");

    // Get the spotlight icon to match the color
    const spotlightIcon = activeSection.querySelector(".spotlight-icon");
    if (spotlightIcon) {
      activeSection.style.borderLeft = `4px solid ${spotlightIcon.style.backgroundColor}`;
      activeSection.style.paddingLeft = "12px";
    }

    // Update button text and style
    const viewButton = activeSection.querySelector(".view-map-button");
    if (viewButton) {
      viewButton.textContent = "Currently Viewing";
      viewButton.style.backgroundColor = "#e6e6e6";
    }

    // Scroll to the active section with smooth animation
    activeSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/**
 * Handle feature hover - show enhanced tooltip for spotlights
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

  // Special handling for spotlight steps
  if (step.spotlightMode) {
    // Check if this is a spotlighted county
    const isSpotlighted = feature.properties.isSpotlighted || false;
    const isMainSpotlight = feature.properties.isMainSpotlight || false;
    const spotlightCategory = feature.properties.spotlightCategory || "";

    // Get key metrics based on the spotlight category
    const fedWorkers = feature.properties.fed_workers_per_100k || 0;
    const federalWorkersRaw = feature.properties.federal_workers || 0;
    const unemploymentRate = feature.properties.unemployment_rate || 0;
    const medianIncome = feature.properties.median_income || 0;
    const vulnerabilityScore = feature.properties.vulnerabilityIndex || 0;

    // Create a specialized tooltip for spotlight counties
    if (isSpotlighted) {
      // Determine which category this is
      let categoryTitle = "";
      let categoryColor = "";
      let keyMetrics = [];

      if (spotlightCategory === "triple_threat") {
        categoryTitle = "Triple Threat County";
        categoryColor = "#a50f15";
        keyMetrics = [
          {
            label: "Unemployment Rate",
            value: `${unemploymentRate.toFixed(1)}%`,
          },
          {
            label: "Median Income",
            value: `$${medianIncome.toLocaleString()}`,
          },
          {
            label: "Federal Workers",
            value: `${federalWorkersRaw.toLocaleString()}`,
          },
          { label: "Fed Jobs per 100k", value: `${fedWorkers.toFixed(1)}` },
        ];
      } else if (spotlightCategory === "extreme_dependency") {
        categoryTitle = "Extreme Dependency County";
        categoryColor = "#de2d26";
        keyMetrics = [
          {
            label: "Federal Jobs",
            value: `${(fedWorkers / 1000).toFixed(1)}% of workforce`,
          },
          {
            label: "Federal Workers",
            value: `${federalWorkersRaw.toLocaleString()}`,
          },
          {
            label: "Unemployment Rate",
            value: `${unemploymentRate.toFixed(1)}%`,
          },
          { label: "Potential Impact", value: "High" },
        ];
      } else if (spotlightCategory === "tribal_rural") {
        categoryTitle = "Tribal/Rural County";
        categoryColor = "#fb6a4a";
        keyMetrics = [
          {
            label: "Median Income",
            value: `$${medianIncome.toLocaleString()}`,
          },
          {
            label: "Federal Workers",
            value: `${federalWorkersRaw.toLocaleString()}`,
          },
          { label: "Fed Jobs per 100k", value: `${fedWorkers.toFixed(1)}` },
          { label: "Rural Opportunity", value: "Limited" },
        ];
      }

      // Build the spotlight tooltip
      let spotlightHtml = `
        <div class="tooltip-spotlight" style="background-color: ${categoryColor};">
          ${categoryTitle}${isMainSpotlight ? " (Focus Area)" : ""}
        </div>
        <div class="tooltip-data">
      `;

      // Add key metrics
      keyMetrics.forEach((metric) => {
        spotlightHtml += `
          <div class="tooltip-row">
            <span class="tooltip-label">${metric.label}:</span>
            <span class="tooltip-value">${metric.value}</span>
          </div>
        `;
      });

      // Add vulnerability score
      spotlightHtml += `
          <div class="tooltip-row" style="margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">
            <span class="tooltip-label">Vulnerability Score:</span>
            <span class="tooltip-value" style="color: ${
              vulnerabilityScore > 25 ? "#d32f2f" : "#555"
            };">
              ${vulnerabilityScore.toFixed(1)}
            </span>
          </div>
        </div>
      `;

      dataToDisplay = spotlightHtml;
    }
    // Standard tooltip for non-spotlight counties
    else {
      const vulnerabilityScore = feature.properties.vulnerabilityIndex;

      dataToDisplay = `
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
        </div>
      `;
    }
  }
  // Normal tooltip handling for non-spotlight steps
  else if (
    step.id === "state_federal_workers" ||
    step.id === "federal_workers"
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
  } else if (step.id === "vulnerability_index") {
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

    dataToDisplay = `
      ${vulnerableStatus}
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
  const tooltipHeight = 180; // Increased approximate tooltip height for spotlight data

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

    // Enhanced styling for spotlight tooltips
    if (step.spotlightMode && feature.properties.isSpotlighted) {
      elements.tooltip.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.2)";
      elements.tooltip.style.border = "1px solid #ccc";
    } else {
      elements.tooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
      elements.tooltip.style.border = "1px solid #e0e0e0";
    }

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
