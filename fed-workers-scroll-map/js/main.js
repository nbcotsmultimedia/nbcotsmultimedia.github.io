// main.js - Main application code and visualization handling

import config from "./config.js";

// Application state
let state = {
  currentStep: 0,
  mapInitialized: false,
  dimensions: null,
  data: {
    counties: null,
    states: null,
  },
};

// DOM elements
let elements = {
  mapContainer: null,
  description: null,
  svg: null,
  tooltip: null,
  loadingMessage: null,
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

// Initialize the application
async function initializeApp() {
  console.log("Initializing application...");

  // Get DOM elements
  elements.mapContainer = document.getElementById("map-container");
  elements.description = document.getElementById("description");
  elements.svg = document.getElementById("map-svg");

  // Create tooltip
  elements.tooltip = createTooltip();

  // Create loading message
  elements.loadingMessage = createLoadingMessage();
  elements.svg.parentNode.appendChild(elements.loadingMessage);

  // Create navigation buttons
  createNavigationButtons();

  // Set initial dimensions
  state.dimensions = setDimensions(elements.svg);

  // Load data
  try {
    showLoading("Loading map data...");
    await loadData();
    hideLoading();

    // Mark map as initialized
    state.mapInitialized = true;

    // Render initial state
    updateDescription(state.currentStep);
    renderCurrentStep();

    // Set up event listeners - using buttons instead of scroll
    // window.addEventListener('scroll', handleScroll); // Disabled for button navigation
    window.addEventListener("resize", debounce(handleResize, 200));

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Error initializing application:", error);
    showError("Error loading map data. Please try refreshing the page.");
  }
}

// Load all necessary data
async function loadData() {
  try {
    // Load county data
    const countiesResponse = await fetch(config.urls.countiesGeoJSON);
    const countiesData = await countiesResponse.json();

    // Load state data
    const statesResponse = await fetch(config.urls.statesGeoJSON);
    const statesData = await statesResponse.json();

    // Load data from CSV
    const dataResponse = await fetch(config.urls.dataSheet);
    const csvText = await dataResponse.text();

    // Parse CSV
    const parsedData = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    // Load additional data for the vulnerability clusters
    const ruralFedResponse = await fetch(config.urls.ruralFederalDependentData);
    const ruralFedText = await ruralFedResponse.text();
    const ruralFedData = Papa.parse(ruralFedText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const reservationResponse = await fetch(
      config.urls.nativeAmericanReservationData
    );
    const reservationText = await reservationResponse.text();
    const reservationData = Papa.parse(reservationText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const distressedResponse = await fetch(
      config.urls.economicallyDistressedData
    );
    const distressedText = await distressedResponse.text();
    const distressedData = Papa.parse(distressedText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    // Process the data
    state.data = processData(
      countiesData,
      statesData,
      parsedData,
      ruralFedData,
      reservationData,
      distressedData
    );

    return state.data;
  } catch (error) {
    console.error("Error loading data:", error);
    throw new Error("Failed to load map data");
  }
}

// Render the current step
function renderCurrentStep() {
  if (!state.mapInitialized) {
    console.warn("Cannot render map: not initialized");
    return;
  }

  // Get the current step configuration
  const currentStepConfig = config.steps[state.currentStep];
  const isStateLevel = currentStepConfig.isStateLevel === true;
  const isSpotlightView = currentStepConfig.isSpotlightView === true;
  const isCombinedView = currentStepConfig.isCombinedView === true;

  // Clear the SVG
  const svgElement = d3.select(elements.svg);
  svgElement.selectAll("*").remove();

  // Set up map projection
  const projection = d3
    .geoAlbersUsa()
    .scale(state.dimensions.width * 1.3)
    .translate([state.dimensions.width * 0.49, state.dimensions.height * 0.5]);

  const path = d3.geoPath().projection(projection);

  // Determine which data to use
  const features = isStateLevel ? state.data.states : state.data.counties;

  // Check for special visualization types
  if (isSpotlightView) {
    renderSpotlightView(svgElement, features, path, currentStepConfig);
    return;
  }

  if (isCombinedView) {
    renderCombinedClusterView(svgElement, features, path, currentStepConfig);
    return;
  }

  // For special types like component previews
  if (currentStepConfig.isComponentPreview) {
    renderComponentPreview(svgElement, features, path, state.dimensions);
    return;
  }

  // For the layered approach
  if (currentStepConfig.showLayeredComponents) {
    renderLayeredComponents(svgElement, features, path, currentStepConfig);
    return;
  }

  // Create color scale
  const colorScale = createColorScale(currentStepConfig);

  // If this step shows previous components, render them first
  if (currentStepConfig.showPrevious && currentStepConfig.isComponent) {
    renderPreviousComponents(
      svgElement,
      features,
      path,
      state.dimensions,
      currentStepConfig
    );
  }

  // Draw the map
  const featurePaths = svgElement
    .selectAll(isStateLevel ? "path.state" : "path.county")
    .data(features)
    .join("path")
    .attr("class", isStateLevel ? "state" : "county")
    .attr("d", path)
    .attr("fill", (d) => getFillColor(d, currentStepConfig, colorScale))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", isStateLevel ? 0.5 : 0.2) // Reduced stroke width
    .attr("opacity", currentStepConfig.isComponent ? 0.85 : 1) // Slightly transparent for components
    .on("mouseover", function (event, d) {
      handleHover(event, d, currentStepConfig);
    })
    .on("mouseout", function () {
      handleLeave();
    });

  // If showing counties, also add state boundaries for context
  if (!isStateLevel) {
    svgElement
      .selectAll("path.state-outline")
      .data(state.data.states)
      .join("path")
      .attr("class", "state-outline")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5) // Reduced from 1
      .attr("stroke-opacity", 0.5)
      .attr("pointer-events", "none");
  }
  // Add a simple legend
  createSimpleLegend(svgElement, state.dimensions, currentStepConfig);

  // If this is a component, add a weight indicator
  if (currentStepConfig.isComponent) {
    addComponentWeightIndicator(
      svgElement,
      state.dimensions,
      currentStepConfig
    );
  }
}

// Render layered components to create a trivariate choropleth
function renderLayeredComponents(
  svgElement,
  features,
  path,
  currentStepConfig
) {
  // Get all the components we need to display
  const steps = config.steps;
  const currentIndex = steps.indexOf(currentStepConfig);

  // First, add a base white/light gray layer
  svgElement
    .selectAll("path.base-layer")
    .data(features)
    .join("path")
    .attr("class", "base-layer")
    .attr("d", path)
    .attr("fill", "#f8f8f8") // Very light gray
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.1); // Very thin stroke for base layer

  // Add state boundaries for context
  svgElement
    .selectAll("path.state-outline")
    .data(state.data.states)
    .join("path")
    .attr("class", "state-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#666")
    .attr("stroke-width", 0.5) // Reduced from 1
    .attr("stroke-opacity", 0.5)
    .attr("pointer-events", "none");

  // Get components to display based on current step
  let componentsToDisplay = [];

  // For the federal workers component, just show that one
  if (currentStepConfig.id === "federal_workers_component") {
    componentsToDisplay = [currentStepConfig];
  }
  // For unemployment, show federal + unemployment
  else if (currentStepConfig.id === "unemployment_component") {
    componentsToDisplay = [
      steps.find((s) => s.id === "federal_workers_component"),
      currentStepConfig,
    ];
  }
  // For income, show all three
  else if (currentStepConfig.id === "income_component") {
    componentsToDisplay = [
      steps.find((s) => s.id === "federal_workers_component"),
      steps.find((s) => s.id === "unemployment_component"),
      currentStepConfig,
    ];
  }
  // For vulnerability preview, show all three in full opacity
  else if (currentStepConfig.id === "vulnerability_preview") {
    componentsToDisplay = [
      steps.find((s) => s.id === "federal_workers_component"),
      steps.find((s) => s.id === "unemployment_component"),
      steps.find((s) => s.id === "income_component"),
    ];
  }

  // Create a layered visualization
  componentsToDisplay.forEach((component, index) => {
    // Create color scale for this component
    const colorScale = createColorScale(component);

    // Set opacity and blend mode based on component
    let opacity = 0.7; // Semi-transparent
    let blendMode = "multiply"; // Use multiply for blending colors

    // For vulnerability preview, increase opacity
    if (currentStepConfig.id === "vulnerability_preview") {
      opacity = 0.8;
    }

    // Adjust blend mode for different color combinations
    if (
      component.colorSet === "magenta" ||
      component.colorSet === "cyan" ||
      component.colorSet === "yellow"
    ) {
      blendMode = "multiply"; // Better for CMY color mixing
    }

    // Create a group for this layer
    const layerGroup = svgElement
      .append("g")
      .attr("class", `layer-${component.id}`);

    // Draw this component layer
    layerGroup
      .selectAll("path.component")
      .data(features)
      .join("path")
      .attr("class", `component ${component.id}`)
      .attr("d", path)
      .attr("fill", (d) => getFillColor(d, component, colorScale))
      .attr("stroke", "none") // No stroke for better blending
      .style("mix-blend-mode", blendMode)
      .attr("opacity", opacity)
      .on("mouseover", function (event, d) {
        // Highlight on hover
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 0.3); // Thinner stroke on hover
        handleLayeredHover(event, d, componentsToDisplay);
      })
      .on("mouseout", function () {
        // Remove highlight
        d3.select(this).attr("stroke", "none");
        handleLeave();
      });
  });

  // Add outlines for counties after all layers
  svgElement
    .selectAll("path.county-outline")
    .data(features)
    .join("path")
    .attr("class", "county-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.2) // Reduced from 0.5
    .attr("pointer-events", "none"); // Pass through events to layers below
}

// Handle hover for layered view
function handleLayeredHover(event, feature, components) {
  // Build tooltip content
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
      if (fieldName === "median_income") {
        formattedValue = `${value.toLocaleString()}`;
      } else if (fieldName === "unemployment_rate") {
        formattedValue = `${value.toFixed(1)}%`;
      } else if (fieldName === "fed_workers_per_100k") {
        formattedValue = value.toLocaleString() + " per 100k";
      } else {
        formattedValue = value.toLocaleString();
      }
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

  // Show tooltip
  elements.tooltip.style.display = "block";
  elements.tooltip.style.left = `${event.pageX + 10}px`;
  elements.tooltip.style.top = `${event.pageY + 10}px`;
  elements.tooltip.innerHTML = tooltipContent;
}

// Render previous components with lower opacity
function renderPreviousComponents(
  svgElement,
  features,
  path,
  dimensions,
  currentStep
) {
  // Find previous component steps
  const steps = config.steps;
  const currentIndex = steps.indexOf(currentStep);
  const previousComponents = steps
    .slice(0, currentIndex)
    .filter((step) => step.isComponent);

  // Create a group for previous components
  const prevGroup = svgElement
    .append("g")
    .attr("class", "previous-components")
    .style("opacity", 0.5);

  // Render each previous component with reduced size
  previousComponents.forEach((component, i) => {
    // Calculate position for the smaller component map
    const mapWidth = dimensions.width * 0.3; // 30% of full width
    const mapHeight = dimensions.height * 0.3;
    const xPos = 20; // Left padding
    const yPos = dimensions.height - mapHeight - 20 - i * (mapHeight + 10); // Bottom up

    // Create a group for this component
    const componentGroup = prevGroup
      .append("g")
      .attr("class", `component-${component.id}`)
      .attr("transform", `translate(${xPos}, ${yPos})`);

    // Add background
    componentGroup
      .append("rect")
      .attr("width", mapWidth)
      .attr("height", mapHeight)
      .attr("fill", "#f9f9f9")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("rx", 3)
      .attr("ry", 3);

    // Create a smaller projection for this component
    const smallProjection = d3
      .geoAlbersUsa()
      .scale(mapWidth * 1.3)
      .translate([mapWidth * 0.49, mapHeight * 0.5]);

    const smallPath = d3.geoPath().projection(smallProjection);

    // Create color scale for this component
    const colorScale = createColorScale(component);

    // Draw the component map
    componentGroup
      .selectAll("path.mini-county")
      .data(features)
      .join("path")
      .attr("class", "mini-county")
      .attr("d", smallPath)
      .attr("fill", (d) => getFillColor(d, component, colorScale))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.2);

    // Add component title
    componentGroup
      .append("text")
      .attr("x", mapWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text(`${component.title}`);
  });
}

// Render the combined component preview
function renderComponentPreview(svgElement, features, path, dimensions) {
  // Get all components
  const components = config.steps.filter((step) => step.isComponent);

  // Set up map for the combined view
  svgElement
    .selectAll("path.county")
    .data(features)
    .join("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", (d) => calculateCombinedColor(d, components))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      // Custom hover for combined view
      handleCombinedHover(event, d, components);
    })
    .on("mouseout", function () {
      handleLeave();
    });

  // Add state boundaries
  svgElement
    .selectAll("path.state-outline")
    .data(state.data.states)
    .join("path")
    .attr("class", "state-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#666")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.5)
    .attr("pointer-events", "none");
}

// Render spotlight views
function renderSpotlightView(svgElement, features, path, stepConfig) {
  // Create color scale for vulnerability index (base layer)
  const colorScale = createColorScale({
    dataField: "vulnerabilityIndex",
    colorSet: "vulnerability",
    breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
  });

  // Get the fields to use for this spotlight
  const spotlightField = stepConfig.spotlightField;
  const salientField = stepConfig.salientField;

  // Draw the base vulnerability map with reduced opacity for non-spotlight counties
  svgElement
    .selectAll("path.county")
    .data(features)
    .join("path")
    .attr("class", (d) => {
      let classes = "county";
      if (d.properties[spotlightField]) classes += " spotlight";
      if (d.properties[salientField]) classes += " salient";
      return classes;
    })
    .attr("d", path)
    .attr("fill", (d) =>
      getFillColor(d, { dataField: "vulnerabilityIndex" }, colorScale)
    )
    .attr("stroke", (d) => (d.properties[salientField] ? "#000" : "#ffffff"))
    .attr("stroke-width", (d) => (d.properties[salientField] ? 1.5 : 0.2))
    .attr("opacity", (d) => {
      // Full opacity for spotlight counties, reduced for others
      if (d.properties[spotlightField]) return 1.0;
      return 0.3; // Dimmed for non-spotlight counties
    })
    .on("mouseover", function (event, d) {
      handleSpotlightHover(event, d, stepConfig);
    })
    .on("mouseout", function () {
      handleLeave();
    });

  // Add state boundaries for context
  svgElement
    .selectAll("path.state-outline")
    .data(state.data.states)
    .join("path")
    .attr("class", "state-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#666")
    .attr("stroke-width", 0.5)
    .attr("stroke-opacity", 0.5)
    .attr("pointer-events", "none");

  // Add the standard vulnerability legend
  createSimpleLegend(svgElement, state.dimensions, stepConfig);
}

// Calculate a combined color based on all components
function calculateCombinedColor(feature, components) {
  // Get normalized scores for each component
  let totalScore = 0;
  let totalWeight = 0;

  components.forEach((component) => {
    const value = feature.properties[component.dataField];
    if (value !== undefined && value !== null) {
      // Calculate normalized score (0-1)
      let normalizedScore;
      if (component.invertScale) {
        // For inverted scales (like income where lower is worse)
        const max = component.breaks[component.breaks.length - 1];
        normalizedScore = 1 - Math.min(1, value / max);
      } else {
        const max = component.breaks[component.breaks.length - 1];
        normalizedScore = Math.min(1, value / max);
      }

      // Add to weighted total
      totalScore += normalizedScore * component.componentWeight;
      totalWeight += component.componentWeight;
    }
  });

  // Safety check for edge cases
  if (totalWeight === 0) return "#cccccc";

  // Get final score (0-1)
  const finalScore = totalScore / totalWeight;

  // Return color from vulnerability color scale
  return d3.interpolateReds(finalScore);
}

// Handle hover for combined view
function handleCombinedHover(event, feature, components) {
  // Highlight the hovered feature
  d3.select(event.currentTarget)
    .attr("stroke-width", 1.5)
    .attr("stroke", "#000");

  // Calculate component scores
  const scores = components.map((component) => {
    const value = feature.properties[component.dataField];
    let score = "N/A";
    let normalizedScore = 0;

    if (value !== undefined && value !== null) {
      // Format the value appropriately
      if (component.dataField === "median_income") {
        score = `${value.toLocaleString()}`;
      } else if (component.dataField === "unemployment_rate") {
        score = `${value.toFixed(1)}%`;
      } else {
        score = value.toLocaleString();
      }

      // Calculate normalized score
      const max = component.breaks[component.breaks.length - 1];
      normalizedScore = component.invertScale
        ? 1 - Math.min(1, value / max)
        : Math.min(1, value / max);
    }

    // Calculate contribution to final score
    const contribution = normalizedScore * component.componentWeight;

    return {
      title: component.title.split(" (")[0], // Remove the weight part
      score,
      normalizedScore,
      weight: component.componentWeight,
      contribution,
    };
  });

  // Calculate total vulnerability score
  const totalScore = scores.reduce((sum, s) => sum + s.contribution, 0);
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

  // Create tooltip content
  let tooltipContent = `
    <div class="tooltip-header">
      <strong>${feature.properties.name}, ${
    feature.properties.stateName || ""
  }</strong>
    </div>
    <div class="tooltip-data">
      <div style="font-weight:bold;margin-bottom:5px;">Component Scores:</div>
  `;

  // Add each component
  scores.forEach((score) => {
    tooltipContent += `
      <div class="tooltip-row">
        <span class="tooltip-label">${score.title} (${(
      score.weight * 100
    ).toFixed(0)}%):</span>
        <span class="tooltip-value">${score.score}</span>
      </div>
    `;
  });

  // Add final vulnerability score
  tooltipContent += `
      <div class="tooltip-row" style="margin-top:10px;font-weight:bold;border-top:1px solid #eee;padding-top:5px;">
        <span class="tooltip-label">Vulnerability Score:</span>
        <span class="tooltip-value">${finalScore.toFixed(1)}</span>
      </div>
    </div>
  `;

  // Show tooltip
  elements.tooltip.style.display = "block";
  elements.tooltip.style.left = `${event.pageX + 10}px`;
  elements.tooltip.style.top = `${event.pageY + 10}px`;
  elements.tooltip.innerHTML = tooltipContent;
}

// Handle hover events for spotlight views
function handleSpotlightHover(event, feature, stepConfig) {
  // Highlight the hovered feature
  d3.select(event.currentTarget)
    .attr("stroke-width", 2)
    .attr("stroke", "#000")
    .attr("stroke-opacity", 1);

  // Get basic data for tooltip
  const name = feature.properties.name;
  const stateName = feature.properties.stateName || "Unknown";
  const isInCluster = feature.properties[stepConfig.spotlightField];
  const isSalient = feature.properties[stepConfig.salientField];

  // Get vulnerability and cluster scores
  const vulnerabilityScore = feature.properties.vulnerabilityIndex;
  const clusterScore = feature.properties[stepConfig.scoreField];

  // Get federal worker data
  const fedWorkers = feature.properties.fed_workers_per_100k;
  const totalWorkers = feature.properties.total_workers;
  const pctFederal = feature.properties.pct_federal;

  // Get new facility data if available
  const facilityCount = feature.properties.facility_count;
  const topAgencies = feature.properties.top_federal_agencies;
  const facilityTypes = feature.properties.federal_facility_types;
  const topInstallations = feature.properties.top_federal_installations;
  const facilitySummary = feature.properties.federal_facilities_summary;

  // Build tooltip content with a responsive layout
  let tooltipContent = `
    <div class="tooltip-header">
      <strong>${name}, ${stateName}</strong>
      ${
        isInCluster
          ? '<div class="cluster-badge">' +
            stepConfig.title.split(" ")[0] +
            "</div>"
          : ""
      }
      ${isSalient ? '<div class="salient-badge">Key Example</div>' : ""}
    </div>
    <div class="tooltip-data">`;

  // Add core vulnerability metrics
  tooltipContent += `
      <div class="tooltip-section">
        <h4 style="margin: 0 0 5px 0; border-bottom: 1px solid #ddd; font-size: 13px;">Vulnerability Metrics</h4>
        <div class="tooltip-row">
          <span class="tooltip-label">Vulnerability Score:</span>
          <span class="tooltip-value">${
            vulnerabilityScore ? vulnerabilityScore.toFixed(1) : "N/A"
          }</span>
        </div>`;

  if (isInCluster && clusterScore) {
    tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">${
            stepConfig.clusterType === "rural"
              ? "Rural Federal"
              : stepConfig.clusterType === "reservation"
              ? "Reservation"
              : "Distress"
          } Score:</span>
          <span class="tooltip-value">${clusterScore.toFixed(1)}</span>
        </div>`;
  }

  // Add federal employment information
  tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Federal Workers:</span>
          <span class="tooltip-value">${
            fedWorkers ? fedWorkers.toLocaleString() + " per 100k" : "N/A"
          }</span>
        </div>`;

  // Add percent federal if available
  if (pctFederal !== undefined && pctFederal !== null) {
    tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">% Federal Employment:</span>
          <span class="tooltip-value">${(pctFederal * 100).toFixed(1)}%</span>
        </div>`;
  }

  // Cluster-specific metrics
  if (stepConfig.clusterType === "rural") {
    tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Area Type:</span>
          <span class="tooltip-value">Rural/Non-Metro</span>
        </div>`;
  } else if (stepConfig.clusterType === "reservation") {
    const nativePercent = feature.properties.native_american_pct;
    if (nativePercent !== undefined && nativePercent !== null) {
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Native Population:</span>
          <span class="tooltip-value">${nativePercent.toFixed(1)}%</span>
        </div>`;
    }
  } else if (stepConfig.clusterType === "distressed") {
    // Add unemployment and median income
    const unemployment = feature.properties.unemployment_rate;
    const income = feature.properties.median_income;
    tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Unemployment:</span>
          <span class="tooltip-value">${
            unemployment ? unemployment.toFixed(1) + "%" : "N/A"
          }</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Median Income:</span>
          <span class="tooltip-value">${
            income ? "$" + income.toLocaleString() : "N/A"
          }</span>
        </div>`;
  }

  tooltipContent += `
      </div>`;

  // Only add facility section if there's actual facility data available
  if (
    isInCluster &&
    (facilityCount || topAgencies || facilityTypes || topInstallations)
  ) {
    tooltipContent += `
      <div class="tooltip-section">
        <h4 style="margin: 8px 0 5px 0; border-bottom: 1px solid #ddd; font-size: 13px;">Federal Facilities</h4>`;

    // Add facility count if available
    if (facilityCount !== undefined && facilityCount !== null) {
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Facility Count:</span>
          <span class="tooltip-value">${facilityCount}</span>
        </div>`;
    }

    // Add top agencies if available (truncate if too long)
    if (topAgencies) {
      let displayAgencies = topAgencies;
      if (displayAgencies.length > 60) {
        displayAgencies = displayAgencies.substring(0, 57) + "...";
      }
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Top Agencies:</span>
          <span class="tooltip-value">${displayAgencies}</span>
        </div>`;
    }

    // Add top installations if available (truncate if too long)
    if (topInstallations) {
      let displayInstallations = topInstallations;
      if (displayInstallations.length > 60) {
        displayInstallations = displayInstallations.substring(0, 57) + "...";
      }
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Key Facilities:</span>
          <span class="tooltip-value">${displayInstallations}</span>
        </div>`;
    }

    // Add facility types if available (truncate if too long)
    if (facilityTypes) {
      let displayTypes = facilityTypes;
      if (displayTypes.length > 60) {
        displayTypes = displayTypes.substring(0, 57) + "...";
      }
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Facility Types:</span>
          <span class="tooltip-value">${displayTypes}</span>
        </div>`;
    }

    tooltipContent += `
      </div>`;
  }

  // Close the tooltip-data div
  tooltipContent += `
    </div>
    
    <style>
      .tooltip-section {
        margin-bottom: 5px;
      }
      .tooltip-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
        font-size: 12px;
      }
      .tooltip-label {
        font-weight: 500;
        margin-right: 10px;
      }
      .cluster-badge, .salient-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        margin-left: 5px;
      }
      .cluster-badge {
        background-color: ${
          stepConfig.clusterType === "rural"
            ? "#41ab5d"
            : stepConfig.clusterType === "reservation"
            ? "#0fb7d4"
            : "#c13ec7"
        };
        color: white;
      }
      .salient-badge {
        background-color: #ffd000;
        color: black;
      }
      .tooltip-header {
        margin-bottom: 8px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
    </style>
  `;

  // Show tooltip with appropriate sizing
  elements.tooltip.style.display = "block";
  elements.tooltip.style.left = `${event.pageX + 10}px`;
  elements.tooltip.style.top = `${event.pageY + 10}px`;
  elements.tooltip.style.maxWidth = "300px";
  elements.tooltip.innerHTML = tooltipContent;
}

// Add component weight indicator
function addComponentWeightIndicator(svgElement, dimensions, component) {
  // Create a weight indicator at the top right
  const weight = component.componentWeight * 100;
  const xPos = dimensions.width - 150;
  const yPos = 30;

  // Add background
  const weightIndicator = svgElement
    .append("g")
    .attr("class", "weight-indicator")
    .attr("transform", `translate(${xPos}, ${yPos})`);

  // Add background
  weightIndicator
    .append("rect")
    .attr("width", 140)
    .attr("height", 40)
    .attr("fill", "rgba(255, 255, 255, 0.8)")
    .attr("stroke", "#ccc")
    .attr("rx", 5)
    .attr("ry", 5);

  // Add title
  weightIndicator
    .append("text")
    .attr("x", 70)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text("Weight in Vulnerability Index");

  // Add weight percentage
  weightIndicator
    .append("text")
    .attr("x", 70)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(`${weight}%`);
}

// Create a simplified legend
function createSimpleLegend(svgElement, dimensions, stepConfig) {
  const legendWidth = 260;
  const legendHeight = 20;
  const legendX = dimensions.width - legendWidth - 20;
  const legendY = dimensions.height - 40;

  // Create legend container
  const legend = svgElement
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  // Add background for better readability
  legend
    .append("rect")
    .attr("x", -10)
    .attr("y", -25)
    .attr("width", legendWidth + 20)
    .attr("height", legendHeight + 45)
    .attr("fill", "rgba(255, 255, 255, 0.85)")
    .attr("rx", 4)
    .attr("ry", 4);

  // Add legend title
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -10)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(stepConfig.title);

  // Get colors from config
  const colorSet = stepConfig.colorSet || "blues";
  const colors = config.colors[colorSet] || config.colors.federal;

  // Create color blocks
  const numCategories = 5;
  const segmentWidth = legendWidth / numCategories;

  for (let i = 0; i < numCategories; i++) {
    const x = i * segmentWidth;

    // Draw the color block
    legend
      .append("rect")
      .attr("x", x)
      .attr("y", 0)
      .attr("width", segmentWidth)
      .attr("height", legendHeight)
      .style("fill", colors[i + 1]) // Skip the lightest color
      .style("stroke", "#555")
      .style("stroke-width", 0.5);

    // Add labels
    legend
      .append("text")
      .attr("x", x + segmentWidth / 2)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .text(i === 0 ? "Low" : i === numCategories - 1 ? "High" : "");
  }
}

// Enhanced getFillColor function with debugging for missing data
function getFillColor(feature, stepConfig, colorScale) {
  const fieldName = stepConfig.dataField;
  let value = feature.properties[fieldName];

  // If we need to invert the scale (for median income where lower is worse)
  if (stepConfig.invertScale) {
    // Invert the color scale
    const colors = config.colors[stepConfig.colorSet];
    const normalizedValue = 1 - value / 150000; // Arbitrary max
    const colorIndex = Math.min(
      Math.floor(normalizedValue * colors.length),
      colors.length - 1
    );
    return colors[colorIndex];
  }

  return colorScale(value);
}

// Enhanced data processing function to handle special counties
function processData(
  countiesData,
  statesData,
  vulnerabilityData,
  ruralFedData,
  reservationData,
  distressedData
) {
  // Extract county features from topojson
  const counties = topojson.feature(
    countiesData,
    countiesData.objects.counties
  ).features;

  // Extract state features from topojson
  const states = topojson.feature(
    statesData,
    statesData.objects.states
  ).features;

  // Create lookup for vulnerability data
  const vulnerabilityByCounty = {};
  const missingCounties = [];

  vulnerabilityData.forEach((row) => {
    if (!row.NAME) return;

    vulnerabilityByCounty[row.NAME] = {
      fedDependency: row.fed_dependency || row.pct_federal || 0,
      vulnerabilityIndex: row.vulnerability_index || 0,
      fed_workers_per_100k: row.fed_workers_per_100k,
      unemployment_rate: row.unemployment_rate,
      median_income: row.median_income,
      state_fed_workers_per_100k: row.state_fed_workers_per_100k,
    };
  });

  // Create lookups for the cluster data
  // Create lookups for the cluster data
  const ruralFedByCounty = {};
  ruralFedData.forEach((row) => {
    if (!row.NAME) return;
    ruralFedByCounty[row.NAME] = {
      is_rural_federal_dependent: true,
      rural_fed_score: row.rural_fed_score || 0,
      rural_fed_salient_example:
        row.salient_example === true || row.salient_example === "True",
      // Add the new federal facility fields
      facility_count: row.facility_count,
      top_federal_agencies: row.top_federal_agencies,
      federal_facility_types: row.federal_facility_types,
      top_federal_installations: row.top_federal_installations,
      federal_facilities_summary: row.federal_facilities_summary,
      // Include additional data fields
      pct_federal: row.pct_federal,
      total_workers: row.total_workers,
    };
  });

  const reservationByCounty = {};
  reservationData.forEach((row) => {
    if (!row.NAME) return;
    reservationByCounty[row.NAME] = {
      is_native_american_reservation: true,
      reservation_score: row.reservation_score || 0,
      reservation_salient_example:
        row.salient_example === true || row.salient_example === "True",
      // Add the new federal facility fields
      facility_count: row.facility_count,
      top_federal_agencies: row.top_federal_agencies,
      federal_facility_types: row.federal_facility_types,
      top_federal_installations: row.top_federal_installations,
      federal_facilities_summary: row.federal_facilities_summary,
      // Include additional data fields
      pct_federal: row.pct_federal,
      total_workers: row.total_workers,
      native_american_pct: row.native_american_pct,
    };
  });

  const distressedByCounty = {};
  distressedData.forEach((row) => {
    if (!row.NAME) return;
    distressedByCounty[row.NAME] = {
      is_economically_distressed: true,
      distress_score: row.distress_score || 0,
      distress_salient_example:
        row.salient_example === true || row.salient_example === "True",
      // Add the new federal facility fields
      facility_count: row.facility_count,
      top_federal_agencies: row.top_federal_agencies,
      federal_facility_types: row.federal_facility_types,
      top_federal_installations: row.top_federal_installations,
      federal_facilities_summary: row.federal_facilities_summary,
      // Include additional data fields
      pct_federal: row.pct_federal,
      total_workers: row.total_workers,
    };
  });

  // Create a state-level aggregation for counties that are missing data
  const stateAverages = {};

  // Merge county data with vulnerability and cluster data
  const processedCounties = counties.map((county) => {
    const countyFips = county.id;
    const stateFipsCode = countyFips.substring(0, 2);
    const stateName = config.stateFips[stateFipsCode] || "Unknown";
    const countyName = county.properties.name;

    // Find vulnerability data for this county using enhanced matching
    let vulnerabilityInfo = {};
    let ruralFedInfo = {};
    let reservationInfo = {};
    let distressedInfo = {};

    const possibleKeys = getCountyMatchKeys(countyName, stateName);

    // Find vulnerability data
    let matchFound = false;
    for (const key of possibleKeys) {
      if (vulnerabilityByCounty[key]) {
        vulnerabilityInfo = vulnerabilityByCounty[key];
        matchFound = true;
        break;
      }
    }

    // Find rural federal dependent data
    for (const key of possibleKeys) {
      if (ruralFedByCounty[key]) {
        ruralFedInfo = ruralFedByCounty[key];
        break;
      }
    }

    // Find reservation data
    for (const key of possibleKeys) {
      if (reservationByCounty[key]) {
        reservationInfo = reservationByCounty[key];
        break;
      }
    }

    // Find distressed data
    for (const key of possibleKeys) {
      if (distressedByCounty[key]) {
        distressedInfo = distressedByCounty[key];
        break;
      }
    }

    // Track counties in multiple clusters
    const clusterCount = [
      ruralFedInfo.is_rural_federal_dependent,
      reservationInfo.is_native_american_reservation,
      distressedInfo.is_economically_distressed,
    ].filter(Boolean).length;

    // Determine the cluster type for the combined view
    let clusterType = "none";
    if (clusterCount > 1) {
      clusterType = "multiple";
    } else if (ruralFedInfo.is_rural_federal_dependent) {
      clusterType = "rural";
    } else if (reservationInfo.is_native_american_reservation) {
      clusterType = "reservation";
    } else if (distressedInfo.is_economically_distressed) {
      clusterType = "distressed";
    }

    // If no match found, track for debugging
    if (!matchFound) {
      missingCounties.push({
        fips: countyFips,
        name: countyName,
        state: stateName,
        checkedKeys: possibleKeys,
      });

      // Collect data for state averages as fallback
      if (!stateAverages[stateFipsCode]) {
        stateAverages[stateFipsCode] = {
          totalFedWorkers: 0,
          totalUnemployment: 0,
          totalIncome: 0,
          countFedWorkers: 0,
          countUnemployment: 0,
          countIncome: 0,
        };
      }
    } else {
      // Contribute to state averages if we have this data
      if (!stateAverages[stateFipsCode]) {
        stateAverages[stateFipsCode] = {
          totalFedWorkers: 0,
          totalUnemployment: 0,
          totalIncome: 0,
          countFedWorkers: 0,
          countUnemployment: 0,
          countIncome: 0,
        };
      }

      if (vulnerabilityInfo.fed_workers_per_100k) {
        stateAverages[stateFipsCode].totalFedWorkers +=
          vulnerabilityInfo.fed_workers_per_100k;
        stateAverages[stateFipsCode].countFedWorkers++;
      }

      if (vulnerabilityInfo.unemployment_rate) {
        stateAverages[stateFipsCode].totalUnemployment +=
          vulnerabilityInfo.unemployment_rate;
        stateAverages[stateFipsCode].countUnemployment++;
      }

      if (vulnerabilityInfo.median_income) {
        stateAverages[stateFipsCode].totalIncome +=
          vulnerabilityInfo.median_income;
        stateAverages[stateFipsCode].countIncome++;
      }
    }

    return {
      ...county,
      properties: {
        ...county.properties,
        ...vulnerabilityInfo,
        ...ruralFedInfo,
        ...reservationInfo,
        ...distressedInfo,
        stateName,
        combined_cluster_type: clusterType,
        in_multiple_clusters: clusterCount > 1,
        cluster_count: clusterCount,
        fed_workers_per_100k: vulnerabilityInfo.fed_workers_per_100k || null,
        vulnerabilityIndex: vulnerabilityInfo.vulnerabilityIndex || null,
      },
    };
  });

  // Calculate state averages
  Object.keys(stateAverages).forEach((stateFips) => {
    const data = stateAverages[stateFips];
    stateAverages[stateFips].avgFedWorkers =
      data.countFedWorkers > 0
        ? data.totalFedWorkers / data.countFedWorkers
        : null;
    stateAverages[stateFips].avgUnemployment =
      data.countUnemployment > 0
        ? data.totalUnemployment / data.countUnemployment
        : null;
    stateAverages[stateFips].avgIncome =
      data.countIncome > 0 ? data.totalIncome / data.countIncome : null;
  });

  // Second pass - fill in missing data with state averages
  const filledCounties = processedCounties.map((county) => {
    const stateFips = county.id.substring(0, 2);
    const countyName = county.properties.name;
    const stateName = county.properties.stateName;
    const stateAvg = stateAverages[stateFips] || {};

    // Check if county is missing data and state average is available
    if (
      county.properties.fed_workers_per_100k === null &&
      stateAvg.avgFedWorkers
    ) {
      county.properties.fed_workers_per_100k = stateAvg.avgFedWorkers;
    }

    if (
      county.properties.unemployment_rate === null &&
      stateAvg.avgUnemployment
    ) {
      county.properties.unemployment_rate = stateAvg.avgUnemployment;
    }

    if (county.properties.median_income === null && stateAvg.avgIncome) {
      county.properties.median_income = stateAvg.avgIncome;
    }

    // Calculate vulnerability index if missing but components are available
    if (
      county.properties.vulnerabilityIndex === null &&
      county.properties.fed_workers_per_100k !== null
    ) {
      // Get component weights from config
      const fedWeight =
        config.steps.find((s) => s.id === "federal_workers_component")
          ?.componentWeight || 0.5;
      const unemploymentWeight =
        config.steps.find((s) => s.id === "unemployment_component")
          ?.componentWeight || 0.3;
      const incomeWeight =
        config.steps.find((s) => s.id === "income_component")
          ?.componentWeight || 0.2;

      // Normalize component values
      const fedMax =
        config.steps.find((s) => s.id === "federal_workers_component")
          ?.breaks?.[4] || 10000;
      const unemploymentMax =
        config.steps.find((s) => s.id === "unemployment_component")
          ?.breaks?.[4] || 15;
      const incomeMax =
        config.steps.find((s) => s.id === "income_component")?.breaks?.[4] ||
        90000;

      // Add safety checks to prevent NaN
      const normalizedFed = Math.min(
        1,
        isNaN(county.properties.fed_workers_per_100k)
          ? 0
          : county.properties.fed_workers_per_100k / fedMax
      );

      // Use available unemployment data or default to average
      let normalizedUnemployment = 0;
      if (
        county.properties.unemployment_rate !== null &&
        !isNaN(county.properties.unemployment_rate)
      ) {
        normalizedUnemployment = Math.min(
          1,
          county.properties.unemployment_rate / unemploymentMax
        );
      } else if (stateAvg.avgUnemployment) {
        normalizedUnemployment = Math.min(
          1,
          stateAvg.avgUnemployment / unemploymentMax
        );
      }

      // Use available income data or default to average
      let normalizedIncome = 0;
      if (
        county.properties.median_income !== null &&
        !isNaN(county.properties.median_income)
      ) {
        normalizedIncome =
          1 - Math.min(1, county.properties.median_income / incomeMax);
      } else if (stateAvg.avgIncome) {
        normalizedIncome = 1 - Math.min(1, stateAvg.avgIncome / incomeMax);
      }

      // Calculate weighted score with safety check
      const score =
        (normalizedFed * fedWeight +
          normalizedUnemployment * unemploymentWeight +
          normalizedIncome * incomeWeight) *
        100;

      // Ensure the score is not NaN
      county.properties.vulnerabilityIndex = isNaN(score) ? 0 : score;
    }

    // Special handling for Doña Ana County, New Mexico
    if (countyName === "Doña Ana" && stateName === "New Mexico") {
      // Check if there's still an issue with the vulnerability index
      if (
        county.properties.vulnerabilityIndex === null ||
        isNaN(county.properties.vulnerabilityIndex)
      ) {
        // Calculate simpler vulnerability index based just on federal workers
        if (county.properties.fed_workers_per_100k) {
          const fedMax = 10000;
          const normalizedFed = Math.min(
            1,
            county.properties.fed_workers_per_100k / fedMax
          );
          county.properties.vulnerabilityIndex = normalizedFed * 100;
        } else {
          // Fallback value
          county.properties.vulnerabilityIndex = 50;
        }
      }
    }

    return county;
  });

  // Fix any remaining NaN values
  filledCounties.forEach((county) => {
    if (isNaN(county.properties.vulnerabilityIndex)) {
      county.properties.vulnerabilityIndex = 0;
    }
    if (isNaN(county.properties.fed_workers_per_100k)) {
      county.properties.fed_workers_per_100k = null;
    }
    if (isNaN(county.properties.unemployment_rate)) {
      county.properties.unemployment_rate = null;
    }
    if (isNaN(county.properties.median_income)) {
      county.properties.median_income = null;
    }
  });

  // Process state data
  const processedStates = states.map((state) => {
    const stateFips = state.id;
    const stateName = config.stateFips[stateFips] || "Unknown";
    const stateAvg = stateAverages[stateFips] || {};

    return {
      ...state,
      properties: {
        ...state.properties,
        stateName,
        state_fed_workers_per_100k: stateAvg.avgFedWorkers || null,
      },
    };
  });

  // Return the processed data
  return {
    counties: processedCounties,
    states: states.map((state) => {
      const stateFips = state.id;
      const stateName = config.stateFips[stateFips] || "Unknown";
      const stateAvg = stateAverages[stateFips] || {};

      return {
        ...state,
        properties: {
          ...state.properties,
          stateName,
          state_fed_workers_per_100k: stateAvg.avgFedWorkers || null,
        },
      };
    }),
  };
}

// Helper function for county name matching with better special case handling
function getCountyMatchKeys(countyName, stateName) {
  const keys = [
    `${countyName} County, ${stateName}`,
    `${countyName}, ${stateName}`,
  ];

  // Add special cases for Alaska
  if (stateName === "Alaska") {
    keys.push(`${countyName} Borough, ${stateName}`);
    keys.push(`${countyName} Census Area, ${stateName}`);
    keys.push(`${countyName} Municipality, ${stateName}`);
    keys.push(`${countyName} City and Borough, ${stateName}`);
  }

  // Add special case for Louisiana
  if (stateName === "Louisiana") {
    keys.push(`${countyName} Parish, ${stateName}`);
  }

  // Handle other special cases
  if (stateName === "Virginia") {
    keys.push(`${countyName} city, ${stateName}`);
    keys.push(`${countyName} City, ${stateName}`);
  }

  // Look for specific known problematic counties and add their alternate names
  if (countyName === "Fairfax" && stateName === "Virginia") {
    keys.push("Fairfax County");
    keys.push("Fairfax city, Virginia");
  }

  if (countyName === "Richmond" && stateName === "Virginia") {
    keys.push("Richmond city, Virginia");
  }

  if (countyName === "Valdez-Cordova" && stateName === "Alaska") {
    keys.push("Valdez-Cordova Census Area, Alaska");
    keys.push("Chugach Census Area, Alaska");
    keys.push("Copper River Census Area, Alaska");
  }

  if (countyName === "Petersburg" && stateName === "Alaska") {
    keys.push("Petersburg Census Area, Alaska");
    keys.push("Petersburg Borough, Alaska");
  }

  if (countyName === "Accomack" && stateName === "Virginia") {
    keys.push("Accomack County, Virginia");
    keys.push("Accomac County, Virginia"); // Alternate spelling
  }

  // Doña Ana, NM
  if (countyName === "Doña Ana" && stateName === "New Mexico") {
    keys.push("Dona Ana County, New Mexico"); // Without the ñ
    keys.push("Dona Ana, New Mexico"); // Without the ñ
    keys.push("Doña Ana County, New Mexico"); // With the ñ
  }

  // Add simple name as fallback
  keys.push(countyName);

  return keys;
}

// Create a color scale
function createColorScale(stepConfig) {
  const colorSet = stepConfig.colorSet || "blues";
  const colors = config.colors[colorSet] || config.colors.federal;

  // Use quantile scale for simplicity
  const domain = stepConfig.breaks || [1000, 2500, 5000, 7500, 10000];

  return d3.scaleThreshold().domain(domain).range(colors);
}

// Create navigation buttons for easier debugging
function createNavigationButtons() {
  // Create container for the buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "navigation-buttons";
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "center";
  buttonContainer.style.marginTop = "20px";
  buttonContainer.style.marginBottom = "20px";
  buttonContainer.style.gap = "10px";

  // Create previous button
  const prevButton = document.createElement("button");
  prevButton.textContent = "← Previous";
  prevButton.style.padding = "8px 15px";
  prevButton.style.fontSize = "14px";
  prevButton.style.cursor = "pointer";
  prevButton.addEventListener("click", () =>
    navigateToStep(state.currentStep - 1)
  );

  // Create next button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next →";
  nextButton.style.padding = "8px 15px";
  nextButton.style.fontSize = "14px";
  nextButton.style.cursor = "pointer";
  nextButton.addEventListener("click", () =>
    navigateToStep(state.currentStep + 1)
  );

  // Create step indicator
  elements.stepIndicator = document.createElement("div");
  elements.stepIndicator.style.padding = "8px 15px";
  elements.stepIndicator.style.fontSize = "14px";
  elements.stepIndicator.style.border = "1px solid #ccc";
  updateStepIndicator();

  // Add direct step navigation dropdown
  const stepSelect = document.createElement("select");
  stepSelect.style.padding = "8px";
  stepSelect.style.fontSize = "14px";

  // Add options for each step
  config.steps.forEach((step, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = step.title;
    stepSelect.appendChild(option);
  });

  // Handle selection change
  stepSelect.addEventListener("change", (e) => {
    navigateToStep(parseInt(e.target.value));
  });

  // Add the buttons to the container
  buttonContainer.appendChild(prevButton);
  buttonContainer.appendChild(elements.stepIndicator);
  buttonContainer.appendChild(nextButton);
  buttonContainer.appendChild(stepSelect);

  // Add the container to the page
  elements.mapContainer.insertBefore(
    buttonContainer,
    elements.mapContainer.firstChild
  );

  // Store references to the buttons
  elements.prevButton = prevButton;
  elements.nextButton = nextButton;
  elements.stepSelect = stepSelect;
}

// Update step indicator text
function updateStepIndicator() {
  if (!elements.stepIndicator) return;

  const totalSteps = config.steps.length;
  elements.stepIndicator.textContent = `Step ${
    state.currentStep + 1
  } of ${totalSteps}`;

  // Update dropdown too
  if (elements.stepSelect) {
    elements.stepSelect.value = state.currentStep;
  }
}

// Navigate to a specific step
function navigateToStep(stepIndex) {
  // Ensure the step index is valid
  const totalSteps = config.steps.length;
  if (stepIndex < 0) stepIndex = 0;
  if (stepIndex >= totalSteps) stepIndex = totalSteps - 1;

  // Update only if step changed
  if (stepIndex !== state.currentStep) {
    state.currentStep = stepIndex;

    // Update UI elements
    updateDescription(state.currentStep);
    updateStepIndicator();

    // Render the new step
    renderCurrentStep();
  }
}

// Update description text
function updateDescription(stepIndex) {
  if (!elements.description) return;

  const step = config.steps[stepIndex];

  // Update with title and description
  let descriptionHTML = `<strong>${step.title}</strong>`;

  // Add description if available
  if (step.description) {
    descriptionHTML += `<p>${step.description}</p>`;
  }

  elements.description.innerHTML = descriptionHTML;
}

// Handle hover events
function handleHover(event, feature, stepConfig) {
  // Highlight the hovered feature
  d3.select(event.currentTarget)
    .attr("stroke-width", stepConfig.isStateLevel ? 2 : 1.5)
    .attr("stroke", "#000");

  // Get data for tooltip
  const isStateLevel = stepConfig.isStateLevel === true;
  const name = feature.properties.name;
  const stateName = isStateLevel
    ? ""
    : feature.properties.stateName || "Unknown";
  const fieldName = stepConfig.dataField;
  const value = feature.properties[fieldName];

  // Format the value based on the field
  let formattedValue = "N/A";
  if (value !== null && value !== undefined) {
    if (fieldName === "median_income") {
      formattedValue = `${value.toLocaleString()}`;
    } else if (fieldName === "unemployment_rate") {
      formattedValue = `${value.toFixed(1)}%`;
    } else if (fieldName === "vulnerabilityIndex") {
      formattedValue = `${value.toFixed(1)} / 100`;
    } else if (fieldName === "fed_workers_per_100k") {
      formattedValue = value.toLocaleString();
    } else {
      formattedValue = value.toLocaleString();
    }
  }

  // Build tooltip content based on step type
  let tooltipContent = `
    <div class="tooltip-header">
      <strong>${name}${isStateLevel ? "" : `, ${stateName}`}</strong>
    </div>
    <div class="tooltip-data">
  `;

  // If this is a component step, show additional info
  if (stepConfig.isComponent) {
    // Add component info
    tooltipContent += `
      <div class="tooltip-row">
        <span class="tooltip-label">${stepConfig.title.split(" (")[0]}:</span>
        <span class="tooltip-value">${formattedValue}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Weight in Index:</span>
        <span class="tooltip-value">${stepConfig.componentWeight * 100}%</span>
      </div>
    `;

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
  } else if (stepConfig.id === "vulnerability_index") {
    // For vulnerability index show component breakdowns
    tooltipContent += `
      <div class="tooltip-row">
        <span class="tooltip-label">Vulnerability Score:</span>
        <span class="tooltip-value">${formattedValue}</span>
      </div>
      <div style="margin-top:5px;font-size:11px;">Component values:</div>
    `;

    // Add federal workers component
    const fedWorkers = feature.properties.fed_workers_per_100k;
    if (fedWorkers) {
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Federal Workers:</span>
          <span class="tooltip-value">${fedWorkers.toLocaleString()} per 100k</span>
        </div>
      `;
    }

    // Add unemployment component
    const unemployment = feature.properties.unemployment_rate;
    if (unemployment) {
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Unemployment:</span>
          <span class="tooltip-value">${unemployment.toFixed(1)}%</span>
        </div>
      `;
    }

    // Add income component
    const income = feature.properties.median_income;
    if (income) {
      tooltipContent += `
        <div class="tooltip-row">
          <span class="tooltip-label">Median Income:</span>
          <span class="tooltip-value">${income.toLocaleString()}</span>
        </div>
      `;
    }
  } else {
    // Standard tooltip for other steps
    tooltipContent += `
      <div class="tooltip-row">
        <span class="tooltip-label">${stepConfig.title}:</span>
        <span class="tooltip-value">${formattedValue}</span>
      </div>
    `;
  }

  tooltipContent += `</div>`;

  // Show tooltip
  elements.tooltip.style.display = "block";
  elements.tooltip.style.left = `${event.pageX + 10}px`;
  elements.tooltip.style.top = `${event.pageY + 10}px`;
  elements.tooltip.innerHTML = tooltipContent;
}

// Handle leave events
function handleLeave() {
  // Return to normal styling
  if (event && event.currentTarget) {
    d3.select(event.currentTarget)
      .attr("stroke-width", 0.5)
      .attr("stroke", "#fff");
  }

  // Hide tooltip
  elements.tooltip.style.display = "none";
}

// Handle window resize
function handleResize() {
  state.dimensions = setDimensions(elements.svg);

  if (state.mapInitialized) {
    renderCurrentStep();
  }
}

// Set SVG dimensions
function setDimensions(svg) {
  const width = window.innerWidth > 800 ? 800 : window.innerWidth - 40;
  const height = width * 0.625; // 8:5 aspect ratio

  if (svg) {
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
  }

  return { width, height };
}

// Create tooltip element
function createTooltip() {
  const tooltip = document.createElement("div");
  tooltip.id = "tooltip";
  tooltip.className = "tooltip";
  tooltip.style.position = "absolute";
  tooltip.style.display = "none";
  tooltip.style.backgroundColor = "white";
  tooltip.style.border = "1px solid #ddd";
  tooltip.style.borderRadius = "4px";
  tooltip.style.padding = "10px";
  tooltip.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
  tooltip.style.zIndex = "1000";
  tooltip.style.pointerEvents = "none";
  document.body.appendChild(tooltip);
  return tooltip;
}

// Create loading message element
function createLoadingMessage() {
  const message = document.createElement("div");
  message.textContent = "Loading map data...";
  message.style.position = "absolute";
  message.style.top = "50%";
  message.style.left = "50%";
  message.style.transform = "translate(-50%, -50%)";
  message.style.background = "rgba(255, 255, 255, 0.8)";
  message.style.padding = "10px 20px";
  message.style.borderRadius = "4px";
  message.style.zIndex = "100";
  message.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  return message;
}

// Show loading message
function showLoading(message) {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message || "Loading...";
    elements.loadingMessage.style.display = "block";
  }
}

// Hide loading message
function hideLoading() {
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = "none";
  }
}

// Show error message
function showError(message) {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message;
    elements.loadingMessage.style.backgroundColor = "rgba(255, 200, 200, 0.9)";
    elements.loadingMessage.style.display = "block";
  }
}

// Debounce function for resize events
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
