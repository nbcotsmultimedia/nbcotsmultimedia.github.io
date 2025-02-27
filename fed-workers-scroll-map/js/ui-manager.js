// ui-manager.js - Manages UI elements and interactions

const uiManager = {
  // DOM elements
  elements: {
    mapContainer: null,
    description: null,
    svg: null,
    tooltip: null,
    loadingMessage: null,
  },

  // Initialize the UI elements
  initialize: function () {
    // Get DOM elements
    this.elements.mapContainer = document.getElementById("map-container");
    this.elements.description = document.getElementById("description");
    this.elements.svg = document.getElementById("map-svg");

    // Create UI elements
    this.elements.tooltip = utils.dom.createTooltip();
    this.elements.loadingMessage = utils.dom.createLoadingMessage();

    // Add loading message to DOM
    this.elements.svg.parentNode.appendChild(this.elements.loadingMessage);

    return this.elements;
  },

  // Hide loading message
  hideLoading: function () {
    if (this.elements.loadingMessage) {
      this.elements.loadingMessage.remove();
    }
  },

  // Update description text based on current step
  updateDescription: function (stepIndex) {
    if (this.elements.description) {
      this.elements.description.textContent = config.steps[stepIndex].title;
    }
  },

  // Handle county hover - show tooltip
  handleCountyHover: function (event, county, step, outlierInfo) {
    // Visual highlight
    d3.select(event.currentTarget)
      .attr("stroke-width", 1.5)
      .attr("stroke", "#000");

    // Show tooltip with county data
    const countyName = county.properties.name;
    const stateName = county.properties.stateName || "Unknown";
    let dataToDisplay = "";
    let outlierStatus = "";

    if (step.id === "federal_workers") {
      const fedWorkersValue = county.properties.fed_workers_per_100k;

      // Add outlier status if applicable
      if (fedWorkersValue > outlierInfo.upperBound) {
        outlierStatus = `<div class="tooltip-outlier high">Significant outlier (high)</div>`;
      } else if (fedWorkersValue < outlierInfo.lowerBound) {
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
              county.properties.federal_workers
                ? county.properties.federal_workers.toLocaleString()
                : "N/A"
            }</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Total Workers:</span>
            <span class="tooltip-value">${
              county.properties.total_workers
                ? county.properties.total_workers.toLocaleString()
                : "N/A"
            }</span>
          </div>
        </div>
      `;
    } else {
      const vulnIndex = county.properties.vulnerabilityIndex;

      // Add outlier status if applicable
      if (vulnIndex > outlierInfo.upperBound) {
        outlierStatus = `<div class="tooltip-outlier high">Significant outlier (high)</div>`;
      } else if (vulnIndex < outlierInfo.lowerBound) {
        outlierStatus = `<div class="tooltip-outlier low">Significant outlier (low)</div>`;
      }

      dataToDisplay = `
        ${outlierStatus}
        <div class="tooltip-data">
          <div class="tooltip-row">
            <span class="tooltip-label">Vulnerability Index:</span>
            <span class="tooltip-value">${
              vulnIndex ? vulnIndex.toFixed(1) : "N/A"
            }</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Median Income:</span>
            <span class="tooltip-value">${
              county.properties.median_income
                ? county.properties.median_income.toLocaleString()
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
    const tooltipWidth = 250; // Approximate tooltip width

    // If tooltip would go off right edge, position it to the left of the cursor
    if (tooltipX + tooltipWidth > viewportWidth - 20) {
      tooltipX = event.pageX - tooltipWidth - tooltipOffset;
    }

    // Set tooltip content and position
    this.elements.tooltip.style.display = "block";
    this.elements.tooltip.style.left = `${tooltipX}px`;
    this.elements.tooltip.style.top = `${tooltipY}px`;
    this.elements.tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${countyName}, ${stateName}</strong>
      </div>
      ${dataToDisplay}
    `;
  },

  // Handle county leave - hide tooltip
  handleCountyLeave: function (county, outlierInfo) {
    // Return to normal styling with some exceptions
    d3.select(event.currentTarget)
      .attr("stroke-width", 0.5)
      .attr("stroke", "#fff");

    // Hide tooltip
    this.elements.tooltip.style.display = "none";
  },
};
