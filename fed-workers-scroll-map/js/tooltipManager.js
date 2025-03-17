// tooltipManager.js - Tooltip management for the map visualization

import { formatValue, getStateAbbreviation } from "./utils.js";

// #region - Tooltip Initialization and DOM

let tooltipElement = null;
let tooltipInitialized = false;

/**
 * Initialize tooltip only when needed
 */
function initializeTooltipOnDemand() {
  if (!tooltipInitialized) {
    tooltipElement = createTooltip();
    setupTooltipDismissHandlers();
    tooltipInitialized = true;
  }
}

/**
 * Create tooltip element
 * @return {HTMLElement} - The tooltip element
 */
function createTooltip() {
  // Check if tooltip already exists
  let tooltip = document.getElementById("tooltip");

  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);
  }

  return tooltip;
}

/**
 * Set up handlers to dismiss tooltip when appropriate
 */
function setupTooltipDismissHandlers() {
  // These events should hide the tooltip
  const events = ["scroll", "resize", "wheel"];

  events.forEach((eventType) => {
    window.addEventListener(eventType, hideTooltipOnScroll, { passive: true });
  });

  // Also hide tooltip when user starts to interact with the keyboard
  window.addEventListener("keydown", hideTooltipOnScroll);

  // Add touch event handlers for mobile
  window.addEventListener("touchstart", hideTooltipOnScroll, { passive: true });
}

/**
 * Hide tooltip on scroll or related events
 */
function hideTooltipOnScroll() {
  // For wheel events, always hide tooltip immediately
  if (tooltipElement) {
    tooltipElement.style.display = "none";
  }
}

/**
 * Get tooltip element, initializing if needed
 * @return {HTMLElement} - The tooltip element
 */
function getTooltip() {
  if (!tooltipElement) {
    initializeTooltipOnDemand();
  }
  return tooltipElement;
}

/**
 * Position tooltip at optimal location
 * @param {Event} event - Mouse event
 * @param {string} content - Tooltip HTML content
 */
/**
 * Position tooltip at optimal location based on available space
 * @param {Event} event - Mouse event
 * @param {string} content - Tooltip HTML content
 */
function positionTooltip(event, content) {
  const tooltip = getTooltip();
  const viewportWidth = window.innerWidth;

  // Clear previous arrow classes
  tooltip.classList.remove(
    "right-arrow",
    "left-arrow",
    "top-arrow",
    "bottom-arrow",
    "visible"
  );

  // Set content first so we can measure accurate dimensions
  tooltip.innerHTML = content;

  // Ensure tooltip is visible for measuring but not displayed yet
  tooltip.style.cssText = "display: block; opacity: 0; position: absolute;";

  // Get tooltip dimensions after content is set
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;

  // Get viewport dimensions
  const viewportHeight = window.innerHeight;

  // Calculate cursor position relative to viewport
  const cursorX = event.clientX;
  const cursorY = event.clientY;

  // Calculate available space in each direction
  const spaceRight = viewportWidth - cursorX - 15;
  const spaceLeft = cursorX - 15;
  const spaceBelow = viewportHeight - cursorY - 15;
  const spaceAbove = cursorY - 15;

  // For mobile, prefer top/bottom positioning to avoid edges
  let position, styleText;

  if (viewportWidth < 480) {
    // On mobile, prefer top/bottom positioning
    if (spaceBelow >= tooltipHeight) {
      position = "top";
      const left = Math.max(
        window.scrollX + 5, // Smaller padding on mobile
        Math.min(
          event.pageX - tooltipWidth / 2,
          window.scrollX + viewportWidth - tooltipWidth - 5
        )
      );
      styleText = `left: ${left}px; top: ${event.pageY + 15}px;`;
    } else if (spaceAbove >= tooltipHeight) {
      position = "bottom";
      const left = Math.max(
        window.scrollX + 5, // Smaller padding on mobile
        Math.min(
          event.pageX - tooltipWidth / 2,
          window.scrollX + viewportWidth - tooltipWidth - 5
        )
      );
      styleText = `left: ${left}px; top: ${
        event.pageY - tooltipHeight - 15
      }px;`;
    } else if (spaceRight >= tooltipWidth) {
      // Fall back to right positioning if needed
      position = "right";
      styleText = `left: ${event.pageX + 15}px; top: ${Math.max(
        window.scrollY + 10,
        event.pageY - tooltipHeight / 2
      )}px;`;
    } else {
      // Last resort is left positioning
      position = "left";
      styleText = `left: ${event.pageX - tooltipWidth - 15}px; top: ${Math.max(
        window.scrollY + 10,
        event.pageY - tooltipHeight / 2
      )}px;`;
    }
  } else {
    // Original desktop positioning logic
    if (spaceRight >= tooltipWidth) {
      position = "right";
      styleText = `left: ${event.pageX + 15}px; top: ${Math.max(
        window.scrollY + 10,
        event.pageY - tooltipHeight / 2
      )}px;`;
    } else if (spaceLeft >= tooltipWidth) {
      position = "left";
      styleText = `left: ${event.pageX - tooltipWidth - 15}px; top: ${Math.max(
        window.scrollY + 10,
        event.pageY - tooltipHeight / 2
      )}px;`;
    } else if (spaceBelow >= tooltipHeight) {
      position = "top";
      const left = Math.max(
        window.scrollX + 10,
        Math.min(
          event.pageX - tooltipWidth / 2,
          window.scrollX + viewportWidth - tooltipWidth - 10
        )
      );
      styleText = `left: ${left}px; top: ${event.pageY + 15}px;`;
    } else {
      position = "bottom";
      const left = Math.max(
        window.scrollX + 10,
        Math.min(
          event.pageX - tooltipWidth / 2,
          window.scrollX + viewportWidth - tooltipWidth - 10
        )
      );
      styleText = `left: ${left}px; top: ${
        event.pageY - tooltipHeight - 15
      }px;`;
    }
  }

  // Apply all styles at once to minimize reflow
  styleText += "display: block; opacity: 1;";
  tooltip.style.cssText = styleText;

  // Add arrow class based on position
  tooltip.classList.add(`${position}-arrow`, "visible");
}

// #endregion

// #region - Tooltip Content Generators

/**
 * Generate tooltip content based on feature and step config
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 * @return {string} - HTML content for tooltip
 */
function generateTooltipContent(feature, stepConfig) {
  const name = feature.properties.name;
  const stateName = feature.properties.stateName || "Unknown";
  const stateAbbr = getStateAbbreviation(stateName);
  const vulnerabilityIndex = feature.properties.vulnerabilityIndex;
  const fedWorkers = feature.properties.fed_workers_per_100k;
  const unemployment = feature.properties.unemployment_rate;
  const income = feature.properties.median_income;

  let tooltipContent = "";

  // Only use the special style for vulnerability-related maps
  if (
    stepConfig.id === "vulnerability_index" ||
    stepConfig.isSpotlightView ||
    stepConfig.showVulnerability
  ) {
    // Use the cleaned up modern style
    tooltipContent = `
      <div class="tooltip-modern">
        <h2>${name}, ${stateAbbr}</h2>
        
        <div class="tooltip-score">
          <h1>${
            vulnerabilityIndex ? vulnerabilityIndex.toFixed(1) : "N/A"
          }<span class="score-scale">/100</span></h1>
          <p>Vulnerability score</p>
          <div class="score-bar">
            <div class="score-indicator" style="left: ${
              vulnerabilityIndex ? vulnerabilityIndex : 0
            }%;"></div>
          </div>
        </div>
        
        <div class="tooltip-metrics">
          <div class="metric-row">
            <span class="metric-label">FEDERAL WORKERS</span>
            <span class="metric-value">${formatValue(
              fedWorkers,
              "fed_workers_per_100k"
            )}</span>
          </div>
          <div class="metric-sub">per capita</div>
          
          <div class="metric-row">
            <span class="metric-label">UNEMPLOYMENT</span>
            <span class="metric-value">${
              unemployment ? unemployment.toFixed(1) + "%" : "N/A"
            }</span>
          </div>
          
          <div class="metric-row" style="margin-bottom: 0;">
            <span class="metric-label">MEDIAN INCOME</span>
            <span class="metric-value">${
              income ? "$" + income.toLocaleString() : "N/A"
            }</span>
          </div>
        </div>
      </div>`;
  } else {
    // For non-vulnerability maps, use a simpler tooltip
    tooltipContent = `
      <div class="tooltip-simple">
        <div class="tooltip-header">
          <strong>${name}, ${stateAbbr}</strong>
        </div>
        <div class="tooltip-data">
          <div class="tooltip-row">
            <span class="tooltip-label">${stepConfig.title}:</span>
            <span class="tooltip-value">${formatValue(
              feature.properties[stepConfig.dataField],
              stepConfig.dataField
            )}</span>
          </div>
        </div>
      </div>`;
  }

  return tooltipContent;
}

/**
 * Generate tooltip content for layered components
 * @param {Object} feature - Feature data
 * @param {Array} components - Component configurations
 * @return {string} - HTML content for tooltip
 */
function generateLayeredTooltipContent(feature, components) {
  let tooltipContent = `
    <div class="tooltip-header">
      <strong>${feature.properties.name}, ${
    feature.properties.stateName || ""
  }</strong>
    </div>
    <div class="tooltip-data">
      <div style="font-weight:bold;margin-bottom:5px;">Component Values:</div>
  `;

  // Add each component
  components.forEach((component) => {
    const fieldName = component.dataField;
    const value = feature.properties[fieldName];

    // Format the value based on the field
    let formattedValue = "N/A";
    if (value !== null && value !== undefined) {
      formattedValue = formatValue(value, fieldName);
    }

    // Get component color for the label
    const colorSet = component.colorSet || "blues";
    const colors = config.colors[colorSet] || config.colors.federal;
    const color = colors[colors.length - 2]; // Use a dark color from the set

    // Add component row
    tooltipContent += `
      <div class="tooltip-row">
        <span class="tooltip-label" style="color:${color};font-weight:bold;">${
      component.title.split(" (")[0]
    }:</span>
        <span class="tooltip-value">${formattedValue}</span>
      </div>
    `;
  });

  // Add vulnerability score if available
  if (feature.properties.vulnerabilityIndex) {
    tooltipContent += `
      <div class="tooltip-row" style="margin-top:8px;border-top:1px solid #eee;padding-top:4px;">
        <span class="tooltip-label">Vulnerability Score:</span>
        <span class="tooltip-value">${feature.properties.vulnerabilityIndex.toFixed(
          1
        )}</span>
      </div>
    `;
  }

  tooltipContent += `</div>`;

  return tooltipContent;
}

/**
 * Generate tooltip content for spotlight views
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 * @return {string} - HTML content for tooltip
 */
function generateSpotlightTooltipContent(feature, stepConfig) {
  // Get basic data
  const name = feature.properties.name;
  const stateName = feature.properties.stateName || "Unknown";
  const stateAbbr = getStateAbbreviation(stateName);
  const vulnerabilityScore = feature.properties.vulnerabilityIndex;
  const fedWorkers = feature.properties.fed_workers_per_100k;
  const unemployment = feature.properties.unemployment_rate;
  const income = feature.properties.median_income;
  const facilityCount = feature.properties.facility_count || 0;

  // Use the updated modern tooltip style matching the image
  let tooltipContent = `
  <div class="tooltip-modern">
    <h2>${name}, ${stateAbbr}</h2>
    
    <div class="tooltip-score">
      <h1>${
        vulnerabilityScore ? vulnerabilityScore.toFixed(1) : "N/A"
      }<span class="score-scale">/100</span></h1>
      <p>Vulnerability score</p>
      <div class="score-bar">
        <div class="score-indicator" style="left: ${
          vulnerabilityScore ? vulnerabilityScore : 0
        }%;"></div>
      </div>
    </div>
    
    <div class="tooltip-metrics">
      <div class="metric-row">
        <span class="metric-label">Federal workers</span>
        <span class="metric-value">${formatValue(
          fedWorkers,
          "fed_workers_per_100k"
        )}</span>
      </div>
      <div class="metric-sub">per capita</div>
      
      <!-- REMOVE THESE TWO BLOCKS FOR RESERVATION COUNTIES -->
      <!-- Don't include reservation score and native american percentage -->
      
      <div class="metric-row">
        <span class="metric-label">Unemployment</span>
        <span class="metric-value">${
          unemployment ? unemployment.toFixed(1) + "%" : "N/A"
        }</span>
      </div>
      
      <div class="metric-row">
        <span class="metric-label">Median Income</span>
        <span class="metric-value">${
          income ? "$" + income.toLocaleString() : "N/A"
        }</span>
      </div>
    </div>`;

  // Add facilities section if data is available
  if (facilityCount > 0) {
    tooltipContent += `
    <div class="tooltip-facilities">
      <h3>${facilityCount} federal facilities</h3>`;

    // Add additional facility details if available
    if (feature.properties.top_federal_agencies) {
      tooltipContent += `
      <div class="facility-row">
        <span class="facility-label">TOP AGENCIES</span>
        <p class="facility-value">${
          feature.properties.top_federal_agencies || "Data not available"
        }</p>
      </div>`;
    }

    if (feature.properties.federal_facility_types) {
      tooltipContent += `
      <div class="facility-row">
        <span class="facility-label">KEY FACILITIES</span>
        <p class="facility-value">${
          feature.properties.federal_facility_types || "Data not available"
        }</p>
      </div>`;
    }

    tooltipContent += `</div>`;
  }

  // Close the tooltip
  tooltipContent += `</div>`;

  return tooltipContent;
}

// #endregion

// #region - Event Handlers

/**
 * Handle hover on map features
 * @param {Event} event - Mouse event
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 */
function handleHover(event, feature, stepConfig) {
  // Initialize tooltip if this is first interaction
  initializeTooltipOnDemand();

  // Highlight the hovered feature
  d3.select(event.currentTarget)
    .attr("stroke-width", stepConfig.isStateLevel ? 2 : 1.5)
    .attr("stroke", "#000");

  // Get tooltip content
  const tooltipContent = generateTooltipContent(feature, stepConfig);

  // Show tooltip
  positionTooltip(event, tooltipContent);
}

/**
 * Handle hover for layered view
 * @param {Event} event - Mouse event
 * @param {Object} feature - Feature data
 * @param {Array} components - Component configurations
 */
function handleLayeredHover(event, feature, components) {
  // Highlight the hovered feature
  d3.select(event.currentTarget)
    .attr("stroke-width", 1.5)
    .attr("stroke", "#000");

  // Generate layered tooltip content
  const tooltipContent = generateLayeredTooltipContent(feature, components);

  // Show tooltip
  positionTooltip(event, tooltipContent);
}

/**
 * Handle hover events for spotlight views
 * @param {Event} event - Mouse event
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 */
function handleSpotlightHover(event, feature, stepConfig) {
  // Highlight the hovered feature
  d3.select(event.currentTarget).attr("stroke-width", 2).attr("stroke", "#000");

  // Generate spotlight tooltip content
  const tooltipContent = generateSpotlightTooltipContent(feature, stepConfig);

  // Show tooltip
  positionTooltip(event, tooltipContent);
}

/**
 * Handle leave events
 * @param {Event} event - Mouse event
 */
function handleLeave(event) {
  // Return to normal styling
  if (event && event.currentTarget) {
    d3.select(event.currentTarget)
      .attr("stroke-width", 0.5)
      .attr("stroke", "#fff");
  }

  // Hide tooltip
  if (tooltipElement) {
    tooltipElement.style.display = "none";
  }
}

// #endregion

// Export a public API for the tooltip manager
export default {
  handleHover,
  handleLayeredHover,
  handleSpotlightHover,
  handleLeave,
  createTooltip,
  hideTooltip: hideTooltipOnScroll,
};
