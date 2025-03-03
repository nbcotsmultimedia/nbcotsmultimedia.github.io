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
  // Update the updateDescription function in ui-manager.js to remove the narrative example cases
  // and add a special description for the vulnerability index step

  // This is the function we need to modify:
  updateDescription: function (stepIndex) {
    if (!this.elements.description) return;

    const step = config.steps[stepIndex];
    let descriptionHTML = `<h3>${step.title}</h3>`;

    // Add custom description content based on step
    if (step.id === "vulnerable_counties") {
      descriptionHTML += `
    <p>Highlighted counties (in red) have both high federal employment (>${config.vulnerability.highFederalThreshold} per 100k workers) 
    and high economic vulnerability scores (>${config.vulnerability.highVulnerabilityThreshold}), making them especially susceptible to 
    ripple effects from federal job cuts.</p>
    <p>Vulnerability is calculated based on federal employment dependency, 
    unemployment rates, and median income levels relative to national averages.</p>
  `;
    } else if (step.id === "vulnerability_index") {
      descriptionHTML += `
    <p>Counties with high vulnerability scores (≥ ${config.vulnerability.highVulnerabilityThreshold}) 
    are highlighted in red. These areas may face greater economic challenges 
    from potential federal job reductions.</p>
    <p>Vulnerability is calculated based on federal employment dependency, 
    unemployment rates, and median income levels relative to national averages.</p>
  `;
    } else if (step.description) {
      // Use description from config if available
      descriptionHTML += `<p>${step.description}</p>`;
    }
    // We're removing the narrative examples cases
    // Removed the case for step.id === "narrative_example_1" and others

    // Update the DOM element
    this.elements.description.innerHTML = descriptionHTML;
  },

  // Handle county hover - show tooltip
  handleCountyHover: function (event, feature, step, outlierInfo) {
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

    if (step.id === "state_federal_workers" || step.id === "federal_workers") {
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
    if (this.elements.tooltip) {
      this.elements.tooltip.style.display = "block";
      this.elements.tooltip.style.left = `${tooltipX}px`;
      this.elements.tooltip.style.top = `${tooltipY}px`;
      this.elements.tooltip.innerHTML = `
        <div class="tooltip-header">
          <strong>${name}${isStateLevel ? "" : `, ${stateName}`}</strong>
        </div>
        ${dataToDisplay}
      `;
    }
  },

  // Handle county leave - hide tooltip
  handleCountyLeave: function (event) {
    // Get the current target from the event
    if (event && event.currentTarget) {
      // Return to normal styling
      d3.select(event.currentTarget)
        .attr("stroke-width", 0.5)
        .attr("stroke", "#fff");
    }

    // Hide tooltip if it exists
    if (this.elements.tooltip) {
      this.elements.tooltip.style.display = "none";
    }
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
