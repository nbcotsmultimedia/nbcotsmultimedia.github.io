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
 * Generate tooltip content for federal worker distribution
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 * @return {string} - HTML content for tooltip
 */
function generateFederalWorkersTooltipContent(feature, stepConfig) {
  const name = feature.properties.name;
  const stateAbbr = getStateAbbreviation(
    feature.properties.stateName || "Unknown"
  );
  const isStateLevel = stepConfig.isStateLevel === true;

  // Choose the correct field based on whether this is state or county level
  const fedWorkersField = isStateLevel
    ? "state_fed_workers_per_100k"
    : "fed_workers_per_100k";

  // For debugging
  // console.log("Feature properties:", feature.properties);

  // Get the federal workers value using the correct field
  const fedWorkers = feature.properties[fedWorkersField] || 0;

  // For workforce percentage:
  // 1. Try direct field
  // 2. Try calculated field
  // 3. Fall back to reasonable default (2.5% for states, matching national average)
  let workforcePercent = 0;

  // Try multiple possible field names
  if (isStateLevel) {
    // For states, try these field names in order
    if (feature.properties.state_fed_workers_pct !== undefined) {
      workforcePercent = feature.properties.state_fed_workers_pct;
    } else if (feature.properties.state_workforce_pct !== undefined) {
      workforcePercent = feature.properties.state_workforce_pct;
    } else if (feature.properties.pct_federal !== undefined) {
      workforcePercent = feature.properties.pct_federal;
    } else if (fedWorkers > 0) {
      // Calculate percentage based on rule of thumb:
      // ~2.5% of U.S. workforce is federal, and 2,500 federal workers per 100k = ~2.5%
      workforcePercent = fedWorkers / 1000;
    } else {
      workforcePercent = 2.5; // Default approximation for states
    }
  } else {
    // For counties, try these field names in order
    if (feature.properties.fed_workers_pct !== undefined) {
      workforcePercent = feature.properties.fed_workers_pct;
    } else if (feature.properties.pct_federal !== undefined) {
      workforcePercent = feature.properties.pct_federal;
    } else if (feature.properties.workforce_pct !== undefined) {
      workforcePercent = feature.properties.workforce_pct;
    } else if (fedWorkers > 0) {
      // Calculate percentage based on rule of thumb:
      // ~2.5% of U.S. workforce is federal, and 2,500 federal workers per 100k = ~2.5%
      workforcePercent = fedWorkers / 1000;
    } else {
      workforcePercent = 1.5; // Default approximation for counties
    }
  }

  // Format numbers appropriately
  const formattedFedWorkers =
    fedWorkers > 1000
      ? (fedWorkers / 1000).toFixed(1) + "K"
      : fedWorkers.toLocaleString();

  const formattedPercent = workforcePercent.toFixed(1) + "%";

  // Clean modern tooltip design matching goal implementation
  return `
    <div class="tooltip-modern">
      <h2>${name}, ${stateAbbr}</h2>
      <div class="tooltip-metrics">
        <div class="metric-row">
          <span class="metric-label">FEDERAL WORKERS</span>
          <span class="metric-value">${formattedFedWorkers}</span>
        </div>
      </div>
    </div>
  `;
}
function generateTooltipContent(feature, stepConfig) {
  // Route to specific tooltip generators based on step ID
  if (stepConfig.id.includes("federal_workers")) {
    return generateFederalWorkersTooltipContent(feature, stepConfig);
  } else if (
    stepConfig.id === "vulnerability_index" ||
    stepConfig.showVulnerability
  ) {
    return generateVulnerabilityTooltipContent(feature, stepConfig);
  } else if (stepConfig.isSpotlightView) {
    return generateSpotlightTooltipContent(feature, stepConfig);
  }

  // Default tooltip for other steps
  return generateDefaultTooltipContent(feature, stepConfig);
}
/**
 * Generate tooltip content for spotlight views without facilities data
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 * @return {string} - HTML content for tooltip
 */
function generateSpotlightTooltipContent(feature, stepConfig) {
  // Get basic data
  const name = feature.properties.name;
  const stateAbbr = getStateAbbreviation(
    feature.properties.stateName || "Unknown"
  );
  const vulnerabilityScore = feature.properties.vulnerabilityIndex || 0;
  const fedWorkers = feature.properties.fed_workers_per_100k || 0;
  const unemployment = feature.properties.unemployment_rate || 0;
  const income = feature.properties.median_income || 0;

  // Format the federal workers value (per capita)
  const formattedFedWorkers =
    fedWorkers > 1000
      ? (fedWorkers / 1000).toFixed(1) + "K"
      : fedWorkers.toLocaleString();

  // Use the updated modern tooltip style matching the goal implementation - no facilities data
  return `
  <div class="tooltip-modern">
    <h2>${name}, ${stateAbbr}</h2>
    
    <div class="tooltip-score">
      <h1>${vulnerabilityScore.toFixed(
        0
      )}<span class="score-scale">/100</span></h1>
      <p>Vulnerability score</p>
      <div class="score-bar">
        <div class="score-indicator" style="left: ${vulnerabilityScore}%;"></div>
      </div>
    </div>
    
    <div class="tooltip-metrics">
      <div class="metric-row">
        <span class="metric-label">FEDERAL WORKERS</span>
        <span class="metric-value">${formattedFedWorkers}</span>
      </div>
      
      <div class="metric-row">
        <span class="metric-label">UNEMPLOYMENT</span>
        <span class="metric-value">${unemployment.toFixed(1)}%</span>
      </div>
      
      <div class="metric-row">
        <span class="metric-label">MEDIAN INCOME</span>
        <span class="metric-value">$${income.toLocaleString("en-US", {
          maximumFractionDigits: 0,
        })}</span>
      </div>
    </div>
  </div>
  `;
}
/**
 * Generate tooltip content for vulnerability map
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 * @return {string} - HTML content for tooltip
 */
function generateVulnerabilityTooltipContent(feature, stepConfig) {
  const name = feature.properties.name;
  const stateAbbr = getStateAbbreviation(
    feature.properties.stateName || "Unknown"
  );
  const vulnerabilityScore = feature.properties.vulnerabilityIndex || 0;
  const fedWorkers = feature.properties.fed_workers_per_100k || 0;
  const unemployment = feature.properties.unemployment_rate || 0;
  const income = feature.properties.median_income || 0;

  // Format the federal workers value (per capita)
  const formattedFedWorkers =
    fedWorkers > 1000
      ? (fedWorkers / 1000).toFixed(1) + "K"
      : fedWorkers.toLocaleString();

  // Create clean tooltip design with gradient score bar - no facilities data
  return `
    <div class="tooltip-modern">
      <h2>${name}, ${stateAbbr}</h2>
      
      <div class="tooltip-score">
        <h1>${vulnerabilityScore.toFixed(
          0
        )}<span class="score-scale">/100</span></h1>
        <p>Vulnerability score</p>
        <div class="score-bar">
          <div class="score-indicator" style="left: ${vulnerabilityScore}%;"></div>
        </div>
      </div>
      
      <div class="tooltip-metrics">
        <div class="metric-row">
          <span class="metric-label">FEDERAL WORKERS</span>
          <span class="metric-value">${formattedFedWorkers}</span>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">UNEMPLOYMENT</span>
          <span class="metric-value">${unemployment.toFixed(1)}%</span>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">MEDIAN INCOME</span>
          <span class="metric-value">$${income.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
}

// #region - Helper functions

/**
 * Generate default tooltip content for any other map types
 * @param {Object} feature - Feature data
 * @param {Object} stepConfig - Step configuration
 * @return {string} - HTML content for tooltip
 */
function generateDefaultTooltipContent(feature, stepConfig) {
  const name = feature.properties.name;
  const stateAbbr = getStateAbbreviation(
    feature.properties.stateName || "Unknown"
  );
  const dataField = stepConfig.dataField;
  const value = feature.properties[dataField];

  return `
    <div class="tooltip-modern">
      <h2>${name}, ${stateAbbr}</h2>
      <div class="tooltip-metrics">
        <div class="metric-row">
          <span class="metric-label">${stepConfig.title}</span>
          <span class="metric-value">${formatValue(value, dataField)}</span>
        </div>
      </div>
    </div>
  `;
}
/**
 * Format agencies data to match the goal implementation
 * @param {string} agenciesData - Raw agencies data
 * @return {string} - Formatted agencies data
 */
function formatAgenciesData(agenciesData) {
  if (!agenciesData) return "Not available";

  // Format: "Interior (123), Health and Human Services (62), Agriculture (4), Energy (2), Commerce (1)"
  // Parse the string logic would depend on your data structure
  // This is a placeholder assuming your data is already in the right format
  return agenciesData;
}
/**
 * Format facility types data to match the goal implementation
 * @param {string} facilityTypesData - Raw facility types data
 * @return {string} - Formatted facility types data
 */
function formatFacilityTypesData(facilityTypesData) {
  if (!facilityTypesData) return "Not available";

  // Format: "Building (177), Land (2), Structure (15)"
  // Parse the string logic would depend on your data structure
  // This is a placeholder assuming your data is already in the right format
  return facilityTypesData;
}

// #endregion

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
