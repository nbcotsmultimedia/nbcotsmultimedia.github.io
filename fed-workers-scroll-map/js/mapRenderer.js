// mapRenderer.js - Map visualization and rendering

import config from "./config.js";
import {
  debounce,
  formatValue,
  getStateAbbreviation,
  getUSOutline,
  setDimensionsWithPadding,
} from "./utils.js";

// #region - Core Rendering

/**
 * Render a simple loading state for the map
 * @param {d3.Selection} svgElement - D3 selection of SVG element
 * @param {Object} dimensions - Dimensions object
 */
export function renderLoadingState(svgElement, dimensions) {
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  // Add text indicator
  svgElement
    .append("text")
    .attr("x", centerX)
    .attr("y", centerY)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .text("Loading map data...");

  // Simple outline of United States for context
  svgElement
    .append("path")
    .attr("d", getUSOutline())
    .attr("fill", "#f0f0f0")
    .attr("stroke", "#ccc");
}

/**
 * Render the current step of the visualization
 * @param {Object} state - Application state
 * @param {Object} data - Data to render
 * @param {d3.Selection} svgElement - D3 selection of SVG element
 * @param {Object} dimensions - Dimensions object
 * @param {Object} tooltipHandlers - Tooltip event handlers
 */
export function renderCurrentStep(
  state,
  data,
  svgElement,
  dimensions,
  tooltipHandlers
) {
  if (!state.mapInitialized) {
    console.warn("Cannot render map: not initialized");
    return;
  }

  // Get the current step configuration
  const currentStepConfig = config.steps[state.currentStep];
  const isStateLevel = currentStepConfig.isStateLevel === true;
  const isSpotlightView = currentStepConfig.isSpotlightView === true;

  // Create a unique ID for this render to prevent conflicts
  const renderId = Date.now();
  state.currentRenderId = renderId;

  // 1. First create the new group but keep it hidden
  const newGroupClass = `map-group-${renderId}`;
  const newMapGroup = svgElement
    .append("g")
    .attr("class", `map-group ${newGroupClass}`)
    .attr("transform", `translate(0, ${dimensions.topPadding})`)
    .style("opacity", 0) // Start invisible
    .style("pointer-events", "none"); // Disable interactions during transition

  // Tell the style loader to prepare for this transition
  if (window.styleLoader && window.styleLoader.prepareForTransition) {
    window.styleLoader.prepareForTransition(newMapGroup.node());
  }

  // 2. Use optimized projection
  const projection = createOptimizedProjection(dimensions);
  const path = d3.geoPath().projection(projection);

  // 3. Determine which data to use
  const features = isStateLevel ? data.states : data.counties;

  // Check if we have loaded data yet - if not, show loading state
  if (!features || features.length === 0) {
    renderLoadingState(svgElement, dimensions);
    return;
  }

  // 4. Prepare for transition - pre-render the new content while hidden
  if (isSpotlightView) {
    renderSpotlightView(
      svgElement,
      features,
      path,
      currentStepConfig,
      newMapGroup,
      tooltipHandlers
    );
  } else {
    renderMapInNewGroup(
      newMapGroup,
      features,
      path,
      currentStepConfig,
      tooltipHandlers
    );
  }

  // 5. Render legend in its own container
  createLegend(dimensions, currentStepConfig);

  // 6. Find old map groups to transition out
  const oldMapGroups = svgElement.selectAll(
    "g.map-group:not(." + newGroupClass + ")"
  );

  // 7. Position sources below the map
  const mapContainer = document.getElementById("map-container");
  const sourcesElement = mapContainer.querySelector(".map-sources");
  if (sourcesElement) {
    const mapBounds = svgElement.node().getBBox();
    const totalHeight = mapBounds.y + mapBounds.height;
    sourcesElement.style.top = `${totalHeight + 20}px`;
  }

  // 8. Ensure step title container is properly positioned
  ensureStepTitleContainerPosition();

  // 9. Use nextFrame to ensure DOM is ready for transitions
  if (window.styleLoader && window.styleLoader.nextFrame) {
    window.styleLoader.nextFrame(() => {
      // 10. First fade out old content
      if (!oldMapGroups.empty()) {
        oldMapGroups
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style("opacity", 0)
          .on("end", function () {
            // 11. Remove this specific old group when its transition is complete
            d3.select(this).remove();
          });
      }

      // 12. Wait for a brief moment to stagger the transitions
      setTimeout(() => {
        // 13. Now fade in the new content
        newMapGroup
          .transition()
          .duration(500)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("pointer-events", "auto") // Re-enable interactions
          .on("end", function () {
            // 14. Rename the group after transition is complete
            newMapGroup.classed(newGroupClass, false);

            // 15. Notify that transition is complete
            newMapGroup.node().classList.add("transition-complete");
          });
      }, 150); // Small delay between transitions
    });
  } else {
    // Fallback to the original transition approach if styleLoader is not available
    newMapGroup
      .transition()
      .duration(500)
      .ease(d3.easeCubicOut)
      .style("opacity", 1)
      .on("end", function () {
        if (!oldMapGroups.empty()) {
          oldMapGroups
            .transition()
            .duration(200)
            .style("opacity", 0)
            .on("end", function () {
              d3.select(this).remove();
            });
        }
        newMapGroup.classed(newGroupClass, false);
      });
  }
}

const stepTitleContainer = document.querySelector(".step-title-container");
if (stepTitleContainer) {
  // Make sure it's a direct child of map-container
  const mapContainer = document.getElementById("map-container");
  if (mapContainer && stepTitleContainer.parentElement !== mapContainer) {
    mapContainer.appendChild(stepTitleContainer);
  }

  // Ensure it has proper z-index and visibility
  stepTitleContainer.style.zIndex = "200";
  stepTitleContainer.style.visibility = "visible";
  stepTitleContainer.style.display = "flex";
}

/**
 * Render map in a specific group for transitions
 * @param {d3.Selection} mapGroup - D3 selection of map group
 * @param {Array} features - Features to render
 * @param {d3.GeoPath} path - D3 geo path for rendering
 * @param {Object} currentStepConfig - Current step configuration
 * @param {Object} tooltipHandlers - Tooltip event handlers
 */
function renderMapInNewGroup(
  mapGroup,
  features,
  path,
  currentStepConfig,
  tooltipHandlers
) {
  const isStateLevel = currentStepConfig.isStateLevel === true;
  const colorScale = createColorScale(currentStepConfig);

  // Use enter-update-exit pattern for smoother transitions
  const selection = mapGroup
    .selectAll(isStateLevel ? "path.state" : "path.county")
    .data(features);

  // Enter new elements with starting style
  const enter = selection
    .enter()
    .append("path")
    .attr("class", isStateLevel ? "state" : "county")
    .attr("d", path)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", isStateLevel ? 0.5 : 0.2)
    .attr("opacity", 0)
    .attr("fill", (d) => getFillColor(d, currentStepConfig, colorScale))
    .on("mouseover", function (event, d) {
      tooltipHandlers.handleHover(event, d, currentStepConfig);
    })
    .on("mouseout", function (event) {
      tooltipHandlers.handleLeave(event);
    });

  // Merge and transition
  enter
    .merge(selection)
    .transition()
    .duration(750)
    .attr("d", path) // Ensure path is updated
    .attr("fill", (d) => getFillColor(d, currentStepConfig, colorScale))
    .attr("opacity", currentStepConfig.isComponent ? 0.85 : 1);

  // Exit with fade out
  selection.exit().transition().duration(300).attr("opacity", 0).remove();

  // If showing counties, add state boundaries for context
  if (!isStateLevel && window.stateData) {
    const stateLines = mapGroup
      .selectAll("path.state-outline")
      .data(window.stateData);

    stateLines
      .enter()
      .append("path")
      .attr("class", "state-outline")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0)
      .attr("pointer-events", "none")
      .merge(stateLines)
      .transition()
      .duration(500)
      .attr("stroke-opacity", 0.5);

    stateLines
      .exit()
      .transition()
      .duration(300)
      .attr("stroke-opacity", 0)
      .remove();
  }
}

/**
 * Render layered components to create a trivariate choropleth
 * @param {d3.Selection} svgElement - D3 selection of SVG element
 * @param {Array} features - Features to render
 * @param {d3.GeoPath} path - D3 geo path for rendering
 * @param {Object} currentStepConfig - Current step configuration
 * @param {Object} tooltipHandlers - Tooltip event handlers
 */
function renderLayeredComponents(
  svgElement,
  features,
  path,
  currentStepConfig,
  tooltipHandlers
) {
  // Get all the components we need to display
  const steps = config.steps;
  const currentIndex = steps.indexOf(currentStepConfig);

  // First, add a base white/light gray layer
  svgElement
    .select("g.map-group")
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
    .select("g.map-group")
    .selectAll("path.state-outline")
    .data(window.stateData || [])
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
      .select("g.map-group")
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
        tooltipHandlers.handleLayeredHover(event, d, componentsToDisplay);
      })
      .on("mouseout", function (event) {
        // Remove highlight
        d3.select(this).attr("stroke", "none");
        tooltipHandlers.handleLeave(event);
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

/**
 * Render spotlight view for specific county clusters
 * @param {d3.Selection} svgElement - D3 selection of SVG element
 * @param {Array} features - Features to render
 * @param {d3.GeoPath} path - D3 geo path for rendering
 * @param {Object} stepConfig - Step configuration
 * @param {d3.Selection} mapGroup - D3 selection of map group
 * @param {Object} tooltipHandlers - Tooltip event handlers
 */
function renderSpotlightView(
  svgElement,
  features,
  path,
  stepConfig,
  mapGroup,
  tooltipHandlers
) {
  // If no specific group is provided, use the main map group
  if (!mapGroup) {
    mapGroup = svgElement.select("g.map-group");
  }

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
  mapGroup
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
      tooltipHandlers.handleSpotlightHover(event, d, stepConfig);
    })
    .on("mouseout", function (event) {
      tooltipHandlers.handleLeave(event);
    });

  // Add this to the renderSpotlightView function
  console.log("Rendering spotlight view:", stepConfig);
  console.log("Spotlight field:", spotlightField);
  console.log("Salient field:", salientField);
  console.log("Sample data:", features[0].properties);
}

/**
 * Adjust map projection to ensure Alaska is fully visible
 * @param {Object} dimensions - Map dimensions
 * @return {d3.geoProjection} - Adjusted projection
 */
/**
 * Adjust map projection to ensure Alaska is fully visible and optimized for screen size
 * @param {Object} dimensions - Map dimensions
 * @return {d3.geoProjection} - Adjusted projection
 */
function createOptimizedProjection(dimensions) {
  // Get the current viewport width
  const viewportWidth = window.innerWidth;

  // Adjust scale factor based on screen size AND aspect ratio
  const isMobile = viewportWidth < 480;
  const scaleFactor = isMobile ? 1.4 : 1.15; // Increased scale for mobile for better visibility

  // Create base Albers USA projection
  const projection = d3
    .geoAlbersUsa()
    .scale(dimensions.width * scaleFactor)
    .translate([
      dimensions.width * 0.49, // Centered horizontally
      dimensions.height * (isMobile ? 0.42 : 0.45), // Adjusted vertical position for mobile
    ]);

  return projection;
}

/**
 * Ensure the step title container is in the right position based on viewport size
 * This should be called during rendering and on window resize
 */
// Update this function in mapRenderer.js

/**
 * Ensure the step title container is in the right position based on viewport size
 * This should be called during rendering and on window resize
 */
export function ensureStepTitleContainerPosition() {
  const stepTitleContainer = document.querySelector(".step-title-container");
  const mapContainer = document.getElementById("map-container");
  const mapSvg = document.getElementById("map-svg");

  if (!stepTitleContainer || !mapContainer) {
    console.warn("Cannot position step title container: elements not found");
    return;
  }

  // Check if we're on mobile viewport
  const isMobile = window.innerWidth <= 480;

  if (isMobile) {
    // Apply mobile class for styling
    stepTitleContainer.classList.add("mobile");
    stepTitleContainer.classList.remove("desktop");

    // Find map SVG to position title container right after it
    if (mapSvg) {
      // First remove the title container from its current position
      if (stepTitleContainer.parentElement) {
        stepTitleContainer.parentElement.removeChild(stepTitleContainer);
      }

      // Insert it immediately after the map SVG with no extra space
      if (mapSvg.nextSibling) {
        mapContainer.insertBefore(stepTitleContainer, mapSvg.nextSibling);
      } else {
        mapContainer.appendChild(stepTitleContainer);
      }
    }
  } else {
    // Add desktop class and remove mobile class
    stepTitleContainer.classList.remove("mobile");
    stepTitleContainer.classList.add("desktop");

    // Desktop positioning unchanged
    if (stepTitleContainer.parentElement !== mapContainer) {
      mapContainer.appendChild(stepTitleContainer);
    }
  }
}

// Function to help you check for issues
export function fixTitleDisplay() {
  // This can be called from the console to force-recreate the title container if needed
  const mapContainer = document.getElementById("map-container");
  if (!mapContainer) {
    console.error("Map container not found");
    return;
  }

  let stepTitleContainer = document.querySelector(".step-title-container");

  // If the container doesn't exist, create it
  if (!stepTitleContainer) {
    console.log("Creating missing step title container");
    stepTitleContainer = document.createElement("div");
    stepTitleContainer.className = "step-title-container";

    // Add the title and description elements
    const titleElement = document.createElement("h2");
    titleElement.className = "current-step-title";
    titleElement.textContent = "Step Title";

    const descriptionElement = document.createElement("p");
    descriptionElement.className = "current-step-description";
    descriptionElement.textContent = "Step description goes here.";

    stepTitleContainer.appendChild(titleElement);
    stepTitleContainer.appendChild(descriptionElement);

    // Add it to the map container
    mapContainer.appendChild(stepTitleContainer);
  }

  // Force mobile styling
  if (window.innerWidth <= 480) {
    stepTitleContainer.style.display = "flex";
    stepTitleContainer.style.visibility = "visible";
    stepTitleContainer.style.opacity = "1";
    stepTitleContainer.style.zIndex = "200";
    stepTitleContainer.style.position = "relative";
    stepTitleContainer.style.top = "auto";
    stepTitleContainer.style.left = "0";
    stepTitleContainer.style.right = "0";
    stepTitleContainer.style.maxWidth = "100%";
    stepTitleContainer.style.margin = "10px 5px 0";
    stepTitleContainer.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
    stepTitleContainer.style.padding = "8px";
    stepTitleContainer.style.borderTop = "1px solid rgba(0, 0, 0, 0.1)";
  }

  console.log("Title container styling fixed. Current state:", {
    exists: !!stepTitleContainer,
    styles: {
      display: stepTitleContainer.style.display,
      position: stepTitleContainer.style.position,
      visibility: stepTitleContainer.style.visibility,
      opacity: stepTitleContainer.style.opacity,
      zIndex: stepTitleContainer.style.zIndex,
    },
    content: {
      title: stepTitleContainer.querySelector(".current-step-title")
        ?.textContent,
      description: stepTitleContainer.querySelector(".current-step-description")
        ?.textContent,
    },
  });

  return "Title display fix attempted";
}

/**
 * Initialize the SVG for map rendering with optimized dimensions
 * @param {HTMLElement} svg - SVG element
 * @return {Object} dimensions - Width, height, and padding values
 */
// Update this function in mapRenderer.js
// Update the initializeMapSvg function in mapRenderer.js

export function initializeMapSvg(svg) {
  // Get the current viewport width
  const viewportWidth = window.innerWidth;

  // Adjust width calculation for mobile
  const width = viewportWidth > 1000 ? 1000 : viewportWidth - 20;

  // Use consistent aspect ratios that match CSS values
  const aspectRatio = viewportWidth < 480 ? 0.5 : 3 / 4;
  const height = width * aspectRatio;

  // Reduce padding values for mobile to minimize extra space
  const topPadding = viewportWidth < 480 ? 20 : 40; // Reduced from 50 to 20
  const bottomPadding = viewportWidth < 480 ? 5 : 40; // Reduced from 20 to 5

  if (svg) {
    // Set dimensions with more compact spacing
    svg.setAttribute("width", width);
    svg.setAttribute("height", height + topPadding + bottomPadding);
    svg.setAttribute(
      "viewBox",
      `0 0 ${width} ${height + topPadding + bottomPadding}`
    );

    // Create or update group for the map
    const mapGroup = d3.select(svg).select("g.map-group");
    if (mapGroup.empty()) {
      d3.select(svg)
        .append("g")
        .attr("class", "map-group")
        .attr("transform", `translate(0, ${topPadding})`);
    } else {
      mapGroup.attr("transform", `translate(0, ${topPadding})`);
    }
  }

  return {
    width,
    height,
    topPadding,
    bottomPadding,
    optimizedHeight: height + bottomPadding,
  };
}

// #endregion

// #region - Color and Legend

/**
 * Create a color scale
 * @param {Object} stepConfig - Step configuration
 * @return {d3.ScaleThreshold} - D3 scale
 */
function createColorScale(stepConfig) {
  const colorSet = stepConfig.colorSet || "blues";
  const colors = config.colors[colorSet] || config.colors.federal;

  // Use threshold scale
  const domain = stepConfig.breaks || [1000, 2500, 5000, 7500, 10000];

  return d3.scaleThreshold().domain(domain).range(colors);
}

/**
 * Get fill color for a feature
 * @param {Object} feature - Feature to color
 * @param {Object} stepConfig - Step configuration
 * @param {d3.ScaleThreshold} colorScale - D3 color scale
 * @return {string} - Fill color
 */
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

/**
 * Get appropriate legend title
 * @param {Object} stepConfig - Step configuration
 * @return {string} - Legend title
 */
function getLegendTitle(stepConfig) {
  // Map of step IDs to custom legend titles
  const legendTitles = {
    state_federal_workers: "Federal workers per capita",
    federal_workers: "Federal workers per capita",
    vulnerability_index: "Vulnerability to cuts",
    rural_federal_dependent: "Vulnerability to cuts",
    native_american_reservation: "Vulnerability to cuts",
    economically_distressed: "Vulnerability to cuts",
  };

  // Return the custom title if it exists, otherwise use the step title
  return legendTitles[stepConfig.id] || stepConfig.title;
}

/**
 * Format large numbers for legend display
 * @param {number} value - Value to format
 * @param {Object} stepConfig - Step configuration
 * @return {string} - Formatted value
 */
function formatLegendValue(value, stepConfig) {
  // For federal workers per capita
  if (stepConfig.id.includes("federal_workers")) {
    // Format as K
    if (value >= 1000) {
      return Math.round(value / 1000) + "K";
    }
    return value;
  }

  // For vulnerability index or other metrics
  return value;
}

/**
 * Create a legend in a dedicated container
 * @param {Object} dimensions - Dimensions object
 * @param {Object} stepConfig - Step configuration
 */
// Find this function in mapRenderer.js and replace it with this updated version
export function createLegend(dimensions, stepConfig) {
  // Get the current viewport width
  const viewportWidth = window.innerWidth;

  // Calculate legend width dynamically based on container width
  const legendContainerWidth =
    document.getElementById("legend-container")?.offsetWidth ||
    (viewportWidth < 480 ? viewportWidth - 20 : 400);

  const legendWidth = Math.min(
    legendContainerWidth - 20,
    viewportWidth < 480 ? viewportWidth - 30 : 400
  );

  // Adjust legend element heights and spacing
  const legendHeight = viewportWidth < 480 ? 8 : 10;
  const titleHeight = 20; // Height allocation for title
  const labelHeight = 20; // Height allocation for labels
  const verticalPadding = 15; // Padding between elements

  // Calculate total SVG height needed
  const totalSvgHeight =
    titleHeight + verticalPadding + legendHeight + labelHeight + 5;

  // Find or create legend container
  let legendContainer = document.getElementById("legend-container");

  if (!legendContainer) {
    // Create container if it doesn't exist
    legendContainer = document.createElement("div");
    legendContainer.id = "legend-container";
    legendContainer.className = "legend-container";

    // Insert it before the map-container
    const mapContainer = document.getElementById("map-container");
    if (mapContainer && mapContainer.parentNode) {
      mapContainer.parentNode.insertBefore(legendContainer, mapContainer);
    } else {
      // Fallback if map container not found
      const stickyContainer = document.querySelector(".sticky-container");
      if (stickyContainer) {
        stickyContainer.appendChild(legendContainer);
      } else {
        console.warn("Could not find .sticky-container for legend");
        return; // Exit if we can't find a proper parent
      }
    }
  }

  // Clear any existing content
  legendContainer.innerHTML = "";

  // Create SVG element for legend with responsive sizing
  const legendSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  // Horizontal padding based on screen size
  const horizontalPadding = viewportWidth < 480 ? 5 : 10;

  // Set SVG attributes with proper height to accommodate all elements
  legendSvg.setAttribute("width", legendWidth + horizontalPadding * 2);
  legendSvg.setAttribute("height", totalSvgHeight);
  legendSvg.setAttribute(
    "viewBox",
    `0 0 ${legendWidth + horizontalPadding * 2} ${totalSvgHeight}`
  );

  legendSvg.classList.add("legend-svg");

  legendContainer.appendChild(legendSvg);

  // Apply translation to center the legend content with padding
  const legendGroup = d3
    .select(legendSvg)
    .append("g")
    .attr("transform", `translate(${horizontalPadding}, 0)`);

  // Add legend title at the top center with adjusted position
  legendGroup
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", titleHeight - 5) // Positioned within title area
    .attr("text-anchor", "middle")
    .attr("class", "legend-title")
    .attr("font-weight", "bold")
    .attr("font-size", viewportWidth < 480 ? "12px" : "14px")
    .text(getLegendTitle(stepConfig));

  // Get colors from config
  const colorSet = stepConfig.colorSet || "blues";
  const colors = config.colors[colorSet] || config.colors.federal;

  // Get breaks from the step configuration
  const breaks = stepConfig.breaks || [1000, 2500, 5000, 7500, 10000];

  // Create color blocks (5 blocks)
  const numCategories = 5;
  const segmentWidth = legendWidth / numCategories;

  // Determine if this is a federal workers legend or vulnerability legend
  const isFederalWorkersLegend = stepConfig.id.includes("federal_workers");

  // Position the legend blocks below the title with proper spacing
  const blocksY = titleHeight + verticalPadding;

  for (let i = 0; i < numCategories; i++) {
    const x = i * segmentWidth;

    // Draw the color block
    legendGroup
      .append("rect")
      .attr("x", x)
      .attr("y", blocksY)
      .attr("width", segmentWidth)
      .attr("height", legendHeight)
      .attr("class", "legend-block")
      .style("fill", colors[i + 1]); // Skip the lightest color

    // Add marker line at each break point (NEW!)
    // if (i > 0) {
    //   legendGroup
    //     .append("line")
    //     .attr("x1", x)
    //     .attr("y1", blocksY - 2)
    //     .attr("x2", x)
    //     .attr("y2", blocksY + legendHeight + 2)
    //     .attr("stroke", "#666")
    //     .attr("stroke-width", 1);
    // }
  }

  // Position labels below the blocks with enough space
  const labelsY = blocksY + legendHeight + 15;

  // Add labels based on the legend type
  if (isFederalWorkersLegend) {
    // For federal workers, optimize mobile values (NEW!)
    const mobileBreaks =
      viewportWidth < 480
        ? [1000, 2500, 5000, 7500, 10000] // Better mobile values
        : breaks;

    // Add the "0" label at the start with padding
    legendGroup
      .append("text")
      .attr("x", 5) // Add 5px padding from left edge
      .attr("y", labelsY)
      .attr("text-anchor", "start")
      .attr("class", "legend-value")
      .attr("font-size", viewportWidth < 480 ? "10px" : "12px")
      .text("0");

    // Add all break points on mobile (NEW!)
    for (let i = 0; i < numCategories; i++) {
      if (i > 0) {
        // Skip the first one (0) as it's already added
        legendGroup
          .append("text")
          .attr("x", i * segmentWidth)
          .attr("y", labelsY)
          .attr("text-anchor", "middle")
          .attr("class", "legend-value")
          .attr("font-size", viewportWidth < 480 ? "10px" : "12px")
          .text(formatLegendValue(mobileBreaks[i - 1], stepConfig));
      }
    }

    // Add the end label with "+" and padding
    legendGroup
      .append("text")
      .attr("x", legendWidth - 5) // Subtract 5px padding from right edge
      .attr("y", labelsY)
      .attr("text-anchor", "end")
      .attr("class", "legend-value")
      .attr("font-size", viewportWidth < 480 ? "10px" : "12px")
      .text(
        formatLegendValue(mobileBreaks[mobileBreaks.length - 1], stepConfig) +
          "+"
      );
  } else {
    // For vulnerability, just add "Low" and "High" labels at the ends with padding
    legendGroup
      .append("text")
      .attr("x", 5) // Add 5px padding from left edge
      .attr("y", labelsY)
      .attr("text-anchor", "start")
      .attr("class", "legend-label")
      .attr("font-size", viewportWidth < 480 ? "10px" : "12px")
      .text("Low");

    legendGroup
      .append("text")
      .attr("x", legendWidth - 5) // Subtract 5px padding from right edge
      .attr("y", labelsY)
      .attr("text-anchor", "end")
      .attr("class", "legend-label")
      .attr("font-size", viewportWidth < 480 ? "10px" : "12px")
      .text("High");
  }

  // Make a window resize handler to recreate legend when window size changes
  const debounceResize = debounce(() => {
    createLegend(dimensions, stepConfig);
  }, 250);

  // Remove any previous resize listeners before adding a new one
  window.removeEventListener("resize", debounceResize);
  window.addEventListener("resize", debounceResize);
}

// #endregion

// Call it once on initial load to make sure it's positioned correctly:
document.addEventListener("DOMContentLoaded", () => {
  // Wait a moment for the DOM to fully load
  setTimeout(ensureStepTitleContainerPosition, 100);
});

// Export a public API for the renderer
export default {
  initializeMapSvg,
  renderCurrentStep,
  renderLoadingState,
  createColorScale,
  getFillColor,
  renderSpotlightView,
  createLegend,
};
