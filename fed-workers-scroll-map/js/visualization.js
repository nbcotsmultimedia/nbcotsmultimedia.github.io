// visualization.js - Functions for rendering the map and legends

// This script creates an interactive choropleth map showing federal employment and vulnerability data across U.S. counties

import config from "./config.js";

// Export the functions directly instead of within an object
export function renderMap({
  svg,
  data,
  dimensions,
  stepConfig,
  statistics,
  onHover,
  onLeave,
}) {
  // Clear the SVG element first
  const svgElement = d3.select(svg);

  // Store references to elements that need event listener cleanup
  const oldElements = svgElement.selectAll("path.county, path.state").nodes();

  // Remove event listeners before removing elements
  oldElements.forEach((el) => {
    el.removeEventListener("mouseover", null);
    el.removeEventListener("mouseout", null);
  });

  // Now clear everything
  svgElement.selectAll("*").remove();

  // Get the current visualization step
  const step = stepConfig;
  const isStateLevel = step.isStateLevel === true;

  // Determine which data to use based on step
  let features = data;

  // If at state level, exclude DC from normal rendering and add it separately
  let dcData = null;
  if (isStateLevel) {
    // Find and remove DC from the features to prevent default rendering
    dcData = features.find(
      (state) => state.properties.name === "District of Columbia"
    );

    // Filter out DC from the features array
    if (dcData) {
      features = features.filter(
        (state) => state.properties.name !== "District of Columbia"
      );
      console.log("Extracted DC data for custom rendering:", dcData.properties);
    }
  }

  // Set up map projection and create a path generator to draw
  const projection = d3
    .geoAlbersUsa()
    .fitSize([dimensions.width, dimensions.height], {
      type: "FeatureCollection",
      features: features,
    });

  // Draw either states or counties
  const path = d3.geoPath().projection(projection);

  // Create color scale
  const colorScale = createColorScale(step.id, statistics);

  // Safely access outliers property
  const outlierInfo =
    statistics && statistics.outliers ? statistics.outliers : null;

  // For spotlight mode, we need to handle the visualization differently
  if (step.spotlightMode) {
    renderSpotlightMode(
      svgElement,
      features,
      path,
      step,
      dimensions,
      onHover,
      onLeave
    );
    return;
  }

  // Draw states or counties
  const countyPaths = svgElement
    .selectAll(isStateLevel ? "path.state" : "path.county")
    .data(features)
    .join("path")
    .attr("class", isStateLevel ? "state" : "county")
    .attr("d", path)
    .attr("fill", (d) => getFillColor(d, step, colorScale))
    .attr("stroke", config.colors.regularStroke)
    .attr("stroke-width", isStateLevel ? 1 : 0.5)
    .on("mouseover", function (event, d) {
      onHover(event, d, step, outlierInfo);
    })
    .on("mouseout", function () {
      onLeave();
    });

  // Apply highlights or special treatments based on step settings
  if (step.highlightVulnerable && !isStateLevel) {
    _highlightVulnerableCounties(
      countyPaths,
      features,
      svgElement,
      dimensions,
      step
    );
    // Skip the regular legend creation by returning early
    return;
  }

  // Handle county highlights for narrative examples
  if (
    step.highlightCounties &&
    step.highlightCounties.length > 0 &&
    !isStateLevel
  ) {
    _handleCountyHighlights(countyPaths, features, svgElement, path, step);
  }

  // If showing counties, also add state boundaries for context
  if (!isStateLevel) {
    _addStateBoundaries(svgElement, path);
  }
  // If state level and we have DC data, add custom DC representation
  else if (dcData) {
    _addCustomDCRepresentation(
      svgElement,
      features,
      dcData,
      path,
      dimensions,
      step,
      colorScale,
      onHover,
      onLeave
    );
  }

  // Call the appropriate legend creation function
  createLegend(svgElement, dimensions, step.id, statistics);
}

// Render the map in spotlight mode for the vulnerable counties step
// Fix for Extreme Dependency counties detection
function renderSpotlightMode(
  svgElement,
  features,
  path,
  step,
  dimensions,
  onHover,
  onLeave
) {
  console.log("Rendering spotlight mode for category:", step.spotlightCategory);

  // Get the appropriate vulnerability colors based on the vulnerabilityIndex values
  const colorScale = createColorScale(
    "vulnerability_index",
    window.dataManager.getStatisticsForStep(2)
  );

  // Clear the SVG first to avoid overlapping elements
  svgElement.selectAll(".spotlight-element").remove();

  // Create a group for the base map
  const baseMapGroup = svgElement
    .append("g")
    .attr("class", "base-counties spotlight-element")
    .style("opacity", 0); // Start with 0 opacity for transition

  // First create all the base counties (non-highlighted)
  baseMapGroup
    .selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("fill", (d) => {
      // Use vulnerability index value to determine appropriate color
      return d.properties.vulnerabilityIndex
        ? colorScale(d.properties.vulnerabilityIndex)
        : config.colors.spotlight.default;
    })
    .attr("stroke", config.colors.regularStroke)
    .attr("stroke-width", 0.3)
    .style("opacity", 0.15); // Reduced opacity for non-spotlight counties

  // Then apply the transition
  baseMapGroup.transition().duration(800).style("opacity", 1); // Fade in

  // Add state boundaries for context
  _addStateBoundaries(svgElement, path);

  // Create a group for annotations
  const annotationGroup = svgElement
    .append("g")
    .attr("class", "spotlight-annotations spotlight-element");

  // Determine the spotlight category based on the step
  const spotlightCategory = step.spotlightCategory;
  if (!spotlightCategory) {
    console.warn("No spotlight category defined in step config");
    return;
  }

  // Set color and title based on category
  let categoryColor, categoryTitle, categoryDescription;

  if (spotlightCategory === "triple_threat") {
    categoryColor = config.colors.spotlight.tripleThreat || "#a50f15";
    categoryTitle = "Triple Threat Areas";
    categoryDescription =
      "Communities facing high unemployment, low income, and federal dependency";
  } else if (spotlightCategory === "extreme_dependency") {
    categoryColor = config.colors.spotlight.extremeDependency || "#de2d26";
    categoryTitle = "Extreme Federal Dependency";
    categoryDescription =
      "Communities with exceptionally high federal employment";
  } else if (spotlightCategory === "tribal_rural") {
    categoryColor = config.colors.spotlight.tribalRural || "#fb6a4a";
    categoryTitle = "Tribal & Rural Communities";
    categoryDescription =
      "Areas with limited economic opportunities outside federal employment";
  } else {
    categoryColor = config.colors.spotlight.highlight || "#de2d26";
    categoryTitle = "Featured Counties";
    categoryDescription = "Counties highlighted for analysis";
  }

  // Add an info box to explain the spotlight category
  const infoBox = svgElement
    .append("g")
    .attr("class", "spotlight-info-box spotlight-element")
    .attr("transform", `translate(30, 40)`)
    .style("opacity", 0); // Start with 0 opacity for transition

  // Create the info box content
  infoBox
    .append("rect")
    .attr("width", 260)
    .attr("height", 45)
    .attr("fill", "rgba(255, 255, 255, 0.95)")
    .attr("stroke", categoryColor)
    .attr("stroke-width", 2)
    .attr("rx", 5)
    .attr("ry", 5);

  infoBox
    .append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", categoryColor)
    .text(categoryTitle);

  infoBox
    .append("text")
    .attr("x", 10)
    .attr("y", 36)
    .attr("font-size", "11px")
    .attr("fill", "#555")
    .text(categoryDescription);

  // Then apply the transition
  infoBox.transition().duration(600).delay(300).style("opacity", 1); // Fade in

  // Get counties based on the spotlight category
  let categoryCounties = [];

  // Manually define the FIPS codes for each category based on the config
  const spotlightFipsCodes = {
    triple_threat: ["21237"], // Wolfe County, Kentucky
    extreme_dependency: ["15005", "51091", "35006", "32009"], // Kalawao County, Hawaii and others
    tribal_rural: [
      "46121",
      "46135",
      "04017",
      "35045",
      "02270",
      "30031",
      "38085",
    ],
  };

  // Get the FIPS codes for the current category
  const fipsCodes = spotlightFipsCodes[spotlightCategory] || [];

  // If we have FIPS codes, use them to find counties
  if (fipsCodes.length > 0) {
    categoryCounties = features.filter((county) =>
      fipsCodes.includes(county.id)
    );
    console.log(
      `Found ${categoryCounties.length} counties using hardcoded FIPS codes for spotlight: ${spotlightCategory}`
    );
    console.log("FIPS codes used:", fipsCodes);
    // Log information about each found county
    categoryCounties.forEach((county) => {
      console.log(
        `Found county: ${county.properties.name}, ${county.properties.stateName}, FIPS: ${county.id}`
      );
    });
  }

  // Try to get counties from spotlight configuration as fallback
  if (
    categoryCounties.length === 0 &&
    step.spotlights &&
    step.spotlights.length > 0
  ) {
    const spotlight = step.spotlights[0];

    if (spotlight.countyFips) {
      const configFipsCodes = Array.isArray(spotlight.countyFips)
        ? spotlight.countyFips
        : [spotlight.countyFips];

      categoryCounties = features.filter((county) =>
        configFipsCodes.includes(county.id)
      );
      console.log(
        `Found ${categoryCounties.length} counties using config FIPS codes for spotlight: ${spotlightCategory}`
      );
      console.log("Config FIPS codes:", configFipsCodes);
    }
  }

  // If we still don't have counties, use metric-based criteria as last resort
  if (categoryCounties.length === 0) {
    if (spotlightCategory === "triple_threat") {
      // For triple_threat: High unemployment + low income + federal dependency
      categoryCounties = features.filter((county) => {
        const props = county.properties;
        return (
          (props.unemployment_rate > 15 ||
            props.unemployment_vulnerability > 75) &&
          (props.median_income < 30000 || props.income_vulnerability > 75) &&
          props.fed_workers_per_100k > 2500
        );
      });
    } else if (spotlightCategory === "extreme_dependency") {
      // For extreme_dependency: Very high percentage of federal workers
      categoryCounties = features.filter((county) => {
        const props = county.properties;
        return props.fed_workers_per_100k > 8000 || props.pct_federal > 8;
      });
    } else if (spotlightCategory === "tribal_rural") {
      // For tribal_rural: Known tribal areas or high vulnerability + rural
      categoryCounties = features.filter((county) => {
        const props = county.properties;
        return (
          props.vulnerabilityIndex > 25 && props.fed_workers_per_100k > 3000
        );
      });
    }

    console.log(
      `Found ${categoryCounties.length} counties using metric-based criteria for spotlight: ${spotlightCategory}`
    );
  }

  console.log(
    `Total: Found ${categoryCounties.length} counties matching spotlight category: ${spotlightCategory}`
  );

  // Create a highlighted counties group
  const highlightGroup = svgElement
    .append("g")
    .attr("class", `spotlight-category-${spotlightCategory} spotlight-element`)
    .style("opacity", 0); // Start with 0 opacity for transition

  if (categoryCounties.length > 0) {
    // Render the highlighted counties
    const highlightPaths = highlightGroup
      .selectAll("path")
      .data(categoryCounties)
      .join("path")
      .attr("d", path)
      .attr("fill", categoryColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .style("opacity", 0.85);

    // Apply the transition
    highlightGroup.transition().duration(800).delay(400).style("opacity", 1); // Fade in

    // Add properties and event handlers for highlighted counties
    highlightPaths.nodes().forEach((node, i) => {
      const dataItem = categoryCounties[i];

      // Add spotlight properties to the feature for tooltips
      dataItem.properties.isSpotlighted = true;
      dataItem.properties.spotlightCategory = spotlightCategory;
      dataItem.properties.spotlightTitle = categoryTitle;

      d3.select(node)
        .on("mouseover", function (event) {
          // Highlight this county
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5)
            .style("opacity", 1);

          onHover(event, dataItem, step, null);
        })
        .on("mouseout", function () {
          // Reset styling
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.8)
            .style("opacity", 0.85);

          onLeave();
        });
    });

    // For tribal communities, add state labels
    if (spotlightCategory === "tribal_rural" && categoryCounties.length > 0) {
      // Group counties by state
      const stateGroups = {};
      categoryCounties.forEach((county) => {
        const state = county.properties.stateName;
        if (!stateGroups[state]) {
          stateGroups[state] = [];
        }
        stateGroups[state].push(county);
      });

      // Add labels for each state group
      const labelsGroup = annotationGroup
        .append("g")
        .attr("class", "state-labels")
        .style("opacity", 0); // Start hidden

      Object.entries(stateGroups).forEach(([state, counties]) => {
        // Find average centroid for counties in this state
        let sumX = 0,
          sumY = 0;
        counties.forEach((county) => {
          const centroid = path.centroid(county);
          if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
            sumX += centroid[0];
            sumY += centroid[1];
          }
        });

        const avgX = sumX / counties.length;
        const avgY = sumY / counties.length;

        if (!isNaN(avgX) && !isNaN(avgY)) {
          // Add label background
          labelsGroup
            .append("rect")
            .attr("x", avgX - 25)
            .attr("y", avgY - 20)
            .attr("width", state.length * 6 + 10)
            .attr("height", 20)
            .attr("fill", "rgba(255,255,255,0.9)")
            .attr("stroke", categoryColor)
            .attr("stroke-width", 1)
            .attr("rx", 4)
            .attr("ry", 4);

          // Add state name
          labelsGroup
            .append("text")
            .attr("x", avgX)
            .attr("y", avgY - 6)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr("fill", "#000")
            .text(state);
        }
      });

      // Apply the transition
      labelsGroup.transition().duration(600).delay(800).style("opacity", 1); // Fade in
    }
    // For single focus categories, highlight a main example
    else if (
      (spotlightCategory === "triple_threat" ||
        spotlightCategory === "extreme_dependency") &&
      categoryCounties.length > 0
    ) {
      // For these categories, select the main example county
      let mainCounty;

      if (spotlightCategory === "triple_threat") {
        // Use Wolfe County, Kentucky if available (FIPS 21237), otherwise use the first one
        mainCounty =
          categoryCounties.find((county) => county.id === "21237") ||
          categoryCounties[0];
      } else if (spotlightCategory === "extreme_dependency") {
        // Use Kalawao County, Hawaii if available (FIPS 15005), otherwise use the first one
        mainCounty =
          categoryCounties.find((county) => county.id === "15005") ||
          categoryCounties[0];
      }

      // If we have a main example, highlight it
      if (mainCounty) {
        // Add a pulsing highlight
        const pulseHighlight = svgElement
          .append("path")
          .datum(mainCounty)
          .attr("class", "county-pulse spotlight-element")
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "#fff")
          .attr("stroke-width", 3)
          .style("opacity", 0);

        // Create pulsing animation
        pulseHighlight
          .transition()
          .duration(1000)
          .style("opacity", 0.8)
          .transition()
          .duration(1000)
          .style("opacity", 0)
          .on("end", function repeat() {
            d3.select(this)
              .transition()
              .duration(1000)
              .style("opacity", 0.8)
              .transition()
              .duration(1000)
              .style("opacity", 0)
              .on("end", repeat);
          });

        // Add a label for the main example
        const centroid = path.centroid(mainCounty);
        if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
          const labelGroup = annotationGroup
            .append("g")
            .attr("class", "county-label-group")
            .style("opacity", 0); // Start hidden

          // Add circle marker
          labelGroup
            .append("circle")
            .attr("cx", centroid[0])
            .attr("cy", centroid[1])
            .attr("r", 4)
            .attr("fill", "#fff")
            .attr("stroke", "#000")
            .attr("stroke-width", 1);

          // Background for county name
          const nameWidth = mainCounty.properties.name.length * 6.5 + 4;
          labelGroup
            .append("rect")
            .attr("x", centroid[0] + 6 - 2)
            .attr("y", centroid[1] - 12)
            .attr("width", nameWidth)
            .attr("height", 18)
            .attr("fill", "white")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5);

          // County name
          labelGroup
            .append("text")
            .attr("x", centroid[0] + 6)
            .attr("y", centroid[1] + 1)
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr("fill", "#000")
            .text(mainCounty.properties.name);

          // Show key metric - use appropriate format for each category
          let metricText;
          if (spotlightCategory === "triple_threat") {
            const unemploymentRate = mainCounty.properties.unemployment_rate;
            metricText = unemploymentRate
              ? `${unemploymentRate.toFixed(1)}% unemployment`
              : "High unemployment";
          } else {
            const fedWorkers = mainCounty.properties.fed_workers_per_100k;
            metricText = fedWorkers
              ? `${(fedWorkers / 1000).toFixed(1)}% federal jobs`
              : "High federal employment";
          }

          // Background for metric
          const metricWidth = metricText.length * 5.5 + 4;
          labelGroup
            .append("rect")
            .attr("x", centroid[0] + 6 - 2)
            .attr("y", centroid[1] + 5)
            .attr("width", metricWidth)
            .attr("height", 16)
            .attr("fill", categoryColor)
            .attr("rx", 3)
            .attr("ry", 3);

          // Metric text
          labelGroup
            .append("text")
            .attr("x", centroid[0] + 6)
            .attr("y", centroid[1] + 16)
            .attr("font-size", "9px")
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .text(metricText);

          // Fade in the label
          labelGroup.transition().duration(600).delay(1000).style("opacity", 1);
        }
      }
    }
  } else {
    // If no counties found, show a message
    const noDataMessage = svgElement
      .append("g")
      .attr("class", "no-data-message spotlight-element")
      .attr(
        "transform",
        `translate(${dimensions.width / 2}, ${dimensions.height / 2})`
      )
      .style("opacity", 0);

    noDataMessage
      .append("rect")
      .attr("x", -150)
      .attr("y", -30)
      .attr("width", 300)
      .attr("height", 60)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("stroke", "#999")
      .attr("stroke-width", 1);

    noDataMessage
      .append("text")
      .attr("x", 0)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(`No ${categoryTitle} counties found`);

    noDataMessage
      .append("text")
      .attr("x", 0)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Please check your data and configuration");

    noDataMessage.transition().duration(600).delay(500).style("opacity", 1);
  }

  // Create a simplified legend for this visualization
  createSimplifiedSpotlightLegend(
    svgElement,
    dimensions,
    step,
    categoryTitle,
    categoryColor
  );
}

/**
 * Create a simplified legend focused only on the specific spotlight category
 */
function createSimplifiedSpotlightLegend(
  svgElement,
  dimensions,
  step,
  categoryTitle,
  categoryColor
) {
  // Legend dimensions and position
  const legendWidth = 220;
  const legendHeight = 70;
  const legendX = dimensions.width - legendWidth - 20;
  const legendY = dimensions.height - 90;

  // Create legend container
  const legend = svgElement
    .append("g")
    .attr("class", "legend spotlight-legend spotlight-element")
    .attr("transform", `translate(${legendX}, ${legendY})`)
    .style("opacity", 0);

  // Background panel
  legend
    .append("rect")
    .attr("x", -10)
    .attr("y", -20)
    .attr("width", legendWidth + 20)
    .attr("height", legendHeight + 30)
    .attr("fill", "rgba(255, 255, 255, 0.92)")
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5)
    .attr("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.1))");

  // Add title
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -5)
    .style("font-size", "13px")
    .style("font-weight", "bold")
    .text("Spotlight Focus");

  // Add category title
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", 15)
    .style("font-size", "12px")
    .style("fill", categoryColor)
    .style("font-weight", "bold")
    .text(categoryTitle);

  // Add color sample
  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 25)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", categoryColor)
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5);

  // Add description based on category
  let description = "";
  if (step.spotlightCategory === "triple_threat") {
    description =
      "Counties with high unemployment, low income, and federal dependency";
  } else if (step.spotlightCategory === "extreme_dependency") {
    description = "Counties with extremely high federal employment";
  } else if (step.spotlightCategory === "tribal_rural") {
    description =
      "Tribal territories and rural areas with limited non-federal opportunities";
  }

  legend
    .append("text")
    .attr("x", 25)
    .attr("y", 35)
    .attr("width", legendWidth - 25)
    .style("font-size", "10px")
    .style("fill", "#333")
    .text(description);

  // Add data source note
  legend
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", legendHeight)
    .attr("text-anchor", "middle")
    .style("font-size", "8px")
    .style("fill", "#777")
    .text("Data: Federal employment, Census, and economic data");

  // Fade in the legend
  legend.transition().duration(800).delay(800).style("opacity", 1);
}

// Get fill color for a feature based on step type and data
export function getFillColor(feature, step, colorScale) {
  const isStateLevel = step.isStateLevel === true;
  const fieldName = step.dataField;

  if (step.id === "vulnerability_category") {
    const category = feature.properties.category;

    // Check for missing data
    if (!category || category === "No Data" || category === "Unknown") {
      return "#cccccc"; // Default gray for no data
    }

    // Clean up category name and get color
    const cleanCategory = category.trim();
    const color = config.colors.vulnerabilityCategory[cleanCategory];

    return color || "#cccccc"; // Return color or fallback to gray
  } else {
    // Handle numeric values
    let value = feature.properties[fieldName];

    // Check for missing or invalid data
    if (
      value === undefined ||
      value === null ||
      isNaN(value) ||
      value === "N/A"
    ) {
      return "#cccccc"; // Gray fill color for counties/states with no data
    }

    // Convert state-level data to the right scale for the color mapping
    if (isStateLevel && step.id === "state_federal_workers") {
      // Convert from per 100,000 to percentage (divide by 1000)
      value = value / 1000;
    }

    return colorScale(value);
  }
}

// Assign categories to vulnerability scores based on statistical breaks
export function assignVulnerabilityCategoryDynamic(index, jenksBreaks) {
  if (index === null || index === undefined) return "No Data";

  // Sort breaks in ascending order
  const breaks = jenksBreaks.slice().sort((a, b) => a - b);

  if (index < breaks[0]) return "Very Low";
  if (index < breaks[1]) return "Low";
  if (index < breaks[2]) return "Moderate-Low";
  if (index < breaks[3]) return "Moderate-High";
  if (index < breaks[4]) return "High";
  return "Very High";
}

// Build a D3 scale to map data values to colors
export function createColorScale(stepId, statistics) {
  const step = config.steps.find((s) => s.id === stepId) || config.steps[0];

  // Safety check for statistics
  if (!statistics) {
    console.warn("No statistics provided for color scale");
    statistics = {
      breaks: [0, 25, 50, 75, 100],
      quantileBreaks: [0, 25, 50, 75, 100],
      outliers: {
        upperBound: 100,
        lowerBound: 0,
      },
      min: 0,
      max: 100,
    };
  }

  // Get scale configuration from config or fallback to statistics
  let breaks, colors;

  try {
    // Try to get configuration from config
    if (config.scales && config.scales[stepId]) {
      const scaleConfig = config.scales[stepId];

      // Determine breaks to use
      if (
        scaleConfig.useJenks &&
        statistics.breaks &&
        statistics.breaks.length > 0
      ) {
        breaks = statistics.breaks;
      } else if (scaleConfig.breaks && scaleConfig.breaks.length > 0) {
        breaks = scaleConfig.breaks;
      } else if (statistics.breaks && statistics.breaks.length > 0) {
        breaks = statistics.breaks;
      } else if (
        statistics.quantileBreaks &&
        statistics.quantileBreaks.length > 0
      ) {
        breaks = statistics.quantileBreaks;
      } else {
        breaks = [0, 25, 50, 75, 100];
        console.warn(
          `No valid breaks found for ${stepId}, using defaults:`,
          breaks
        );
      }

      // Get colors
      if (scaleConfig.colorSet && config.colors[scaleConfig.colorSet]) {
        colors = config.colors[scaleConfig.colorSet];
      } else {
        colors = config.colors.vulnerability || [
          "#f7fbff",
          "#deebf7",
          "#c6dbef",
          "#9ecae1",
          "#6baed6",
          "#3182bd",
        ];
      }
    }
    // Fallback to statistics
    else {
      console.log(`No scale config for ${stepId}, using statistics`);
      if (statistics.breaks && statistics.breaks.length > 0) {
        breaks = statistics.breaks;
      } else if (
        statistics.quantileBreaks &&
        statistics.quantileBreaks.length > 0
      ) {
        breaks = statistics.quantileBreaks;
      } else {
        breaks = [0, 25, 50, 75, 100];
      }

      colors = config.colors[step.colorSet || "vulnerability"] || [
        "#f7fbff",
        "#deebf7",
        "#c6dbef",
        "#9ecae1",
        "#6baed6",
        "#3182bd",
      ];
    }

    // Final safety check for breaks
    if (!breaks || !Array.isArray(breaks) || breaks.length === 0) {
      console.warn(
        "Breaks is still not a valid array after all attempts, using defaults"
      );
      breaks = [0, 25, 50, 75, 100];
    }

    // Final safety check for colors
    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      console.warn("Colors is not a valid array, using defaults");
      colors = [
        "#f7fbff",
        "#deebf7",
        "#c6dbef",
        "#9ecae1",
        "#6baed6",
        "#3182bd",
      ];
    }

    // Create the color scale
    return d3.scaleThreshold().domain(breaks).range(colors);
  } catch (error) {
    console.error("Error creating color scale:", error);
    // Return a default color scale on error
    return d3
      .scaleThreshold()
      .domain([0, 25, 50, 75, 100])
      .range([
        "#f7fbff",
        "#deebf7",
        "#c6dbef",
        "#9ecae1",
        "#6baed6",
        "#3182bd",
      ]);
  }
}

// Main legend coordinator
export function createLegend(svgElement, dimensions, stepId, statistics) {
  // Legend dimensions and position
  const legendWidth = 260;
  const legendHeight = 20;
  const legendX = dimensions.width - legendWidth - 20;
  const legendY = dimensions.height - 70;

  const step = config.steps.find((s) => s.id === stepId) || config.steps[0];

  // Create legend container
  const legend = svgElement
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  // Get the proper breaks and colors based on step
  let breaks, colors, maxValue;

  // Look for predefined breaks in config first
  if (config.scales && config.scales[stepId]) {
    const scaleConfig = config.scales[stepId];

    // Use the statistics breaks if we're using Jenks
    if (scaleConfig.useJenks && statistics && statistics.breaks) {
      breaks = statistics.breaks;
    }
    // Otherwise use config breaks if available
    else if (scaleConfig.breaks) {
      breaks = scaleConfig.breaks;
    }

    colors = config.colors[scaleConfig.colorSet];
    maxValue = scaleConfig.maxValue;
  }
  // If no config, fall back to statistics
  else if (statistics) {
    breaks = statistics.breaks;
    colors = config.colors[step.colorSet || "vulnerability"];
    maxValue = statistics.max * 1.1;
  }

  // Get category names from config or use defaults
  const categoryNames =
    (config.categoryNames && config.categoryNames[stepId]) ||
    getDefaultCategoryNames(breaks ? breaks.length + 1 : 6);

  // Only show description for vulnerability_index step
  const showDescription = stepId === "vulnerability_index";
  const description = showDescription
    ? "Based on federal employment, unemployment rate, and median income"
    : null;

  // Use category style legend for all maps
  createCategoryStyleLegend(
    legend,
    legendWidth,
    legendHeight,
    breaks,
    colors,
    categoryNames,
    step.title || "Federal Workforce Data",
    description
  );
}

// Create a special binary legend for highlighting vulnerable counties
function createVulnerableLegend(svgElement, dimensions, step) {
  // Legend dimensions and position
  const legendWidth = 260;
  const legendHeight = 20;
  const legendX = dimensions.width - legendWidth - 20;
  const legendY = dimensions.height - 70;

  // Create legend container
  const legend = svgElement
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  // Create background panel
  legend
    .append("rect")
    .attr("x", -10)
    .attr("y", -20)
    .attr("width", legendWidth + 20)
    .attr("height", legendHeight + 45)
    .attr("fill", "rgba(255, 255, 255, 0.85)")
    .attr("rx", 4)
    .attr("ry", 4);

  // Add legend title
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -5)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Federal Job Cut Vulnerability");

  // Create two category blocks: Vulnerable and Not Vulnerable
  // Not Vulnerable category
  legend
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", legendWidth / 2 - 5)
    .attr("height", legendHeight)
    .style("fill", "#cccccc") // Gray for non-vulnerable
    .style("opacity", 0.3) // Match the opacity used in the map
    .style("stroke", "#555")
    .style("stroke-width", 0.5);

  // Vulnerable category
  legend
    .append("rect")
    .attr("x", legendWidth / 2 + 5)
    .attr("y", 0)
    .attr("width", legendWidth / 2 - 5)
    .attr("height", legendHeight)
    .style("fill", "#de2d26") // Red for vulnerable
    .style("opacity", 0.9) // Match the opacity used in the map
    .style("stroke", "#555")
    .style("stroke-width", 0.5);

  // Add category labels
  legend
    .append("text")
    .attr("x", legendWidth / 4)
    .attr("y", legendHeight - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "9px")
    .style("font-weight", "bold")
    .style("fill", "#000")
    .text("Lower Vulnerability");

  legend
    .append("text")
    .attr("x", (legendWidth * 3) / 4)
    .attr("y", legendHeight - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "9px")
    .style("font-weight", "bold")
    .style("fill", "#fff") // White text for better contrast on red
    .text("High Vulnerability");

  // Add explanation text
  legend
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", legendHeight + 15)
    .attr("text-anchor", "middle")
    .style("font-size", "8px")
    .text(
      `Federal workers ≥ ${config.vulnerability.highFederalThreshold} per 100k and high economic vulnerability`
    );
}

// Create a legend with discrete color blocks for each category
function createCategoryStyleLegend(
  legend,
  legendWidth,
  legendHeight,
  breaks,
  colors,
  categoryNames,
  title = "Federal Workforce Vulnerability",
  description = "Based on federal employment, unemployment rate, and median income"
) {
  // Safety check for breaks and colors
  if (!breaks || breaks.length === 0) {
    console.warn("No breaks provided for category legend");
    return;
  }

  if (!colors || colors.length < breaks.length) {
    console.warn("Insufficient colors for category legend");
    return;
  }

  // Create background panel
  legend
    .append("rect")
    .attr("x", -10)
    .attr("y", -20)
    .attr("width", legendWidth + 20)
    .attr("height", legendHeight + 45)
    .attr("fill", "rgba(255, 255, 255, 0.85)")
    .attr("rx", 4)
    .attr("ry", 4);

  // Add legend title
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -5)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(title);

  // Calculate segment width - make it fixed for category style
  const numCategories = Math.min(breaks.length + 1, colors.length);
  const segmentWidth = legendWidth / numCategories;

  // Create color blocks and labels for each category
  for (let i = 0; i < numCategories; i++) {
    const x = i * segmentWidth;

    // Draw the color block
    legend
      .append("rect")
      .attr("x", x)
      .attr("y", 0)
      .attr("width", segmentWidth)
      .attr("height", legendHeight)
      .style("fill", colors[i])
      .style("stroke", "#555")
      .style("stroke-width", 0.5);

    // Add category name above
    const categoryName =
      i < categoryNames.length ? categoryNames[i] : `Class ${i + 1}`;
    legend
      .append("text")
      .attr("x", x + segmentWidth / 2)
      .attr("y", legendHeight - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .style("font-weight", "bold")
      .style("fill", "#000")
      .text(categoryName);

    // Format and add break value
    let labelText;
    if (i === 0) {
      labelText = `< ${breaks[0].toFixed(1)}`;
    } else if (i === numCategories - 1) {
      labelText = `> ${breaks[numCategories - 2].toFixed(1)}`;
    } else {
      labelText = `${breaks[i - 1].toFixed(1)} - ${breaks[i].toFixed(1)}`;
    }

    // Add value range below
    // Add value range below
    legend
      .append("text")
      .attr("x", x + segmentWidth / 2)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "8px")
      .text(labelText);
  }

  // Optionally add explanation of the index
  if (description) {
    legend
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", legendHeight + 30)
      .attr("text-anchor", "middle")
      .style("font-size", "8px")
      .style("font-style", "italic")
      .text(description);
  }
}

// Generate category names based on number of data breaks
function getDefaultCategoryNames(numCategories) {
  if (numCategories === 6) {
    return [
      "Very Low",
      "Low",
      "Moderate-Low",
      "Moderate-High",
      "High",
      "Very High",
    ];
  } else if (numCategories === 5) {
    return ["Very Low", "Low", "Moderate", "High", "Very High"];
  } else {
    // Generate generic names for other numbers of categories
    const categoryNames = [];
    for (let i = 0; i < numCategories; i++) {
      if (i === 0) {
        categoryNames.push("Very Low");
      } else if (i === numCategories - 1) {
        categoryNames.push("Very High");
      } else if (numCategories <= 4) {
        categoryNames.push(["Low", "High"][i - 1]);
      } else {
        categoryNames.push(["Low", "Moderate", "High"][Math.min(i - 1, 2)]);
      }
    }
    return categoryNames;
  }
}

// Specially highlights counties meeting vulnerability criteria
function _highlightVulnerableCounties(
  countyPaths,
  features,
  svgElement,
  dimensions,
  step
) {
  // Create a special color scheme for vulnerable counties
  const vulnerableColor = "#de2d26"; // Red for vulnerable counties

  // Compute how many counties meet the vulnerability criteria
  const vulnerableCriteria = (d) => {
    const fedWorkers = d.properties.fed_workers_per_100k || 0;
    const vulnerabilityScore = d.properties.vulnerabilityIndex || 0;
    return (
      fedWorkers >= config.vulnerability.highFederalThreshold &&
      vulnerabilityScore >= config.vulnerability.highVulnerabilityThreshold
    );
  };

  const vulnerableCounties = features.filter(vulnerableCriteria);
  console.log(
    `Found ${vulnerableCounties.length} vulnerable counties meeting criteria`
  );

  // Make all counties gray with low opacity
  countyPaths
    .attr("fill", "#cccccc")
    .attr("opacity", 0.5) // Very faded gray for non-vulnerable counties
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.25);

  // Then highlight vulnerable counties
  countyPaths
    .filter(vulnerableCriteria)
    .attr("fill", vulnerableColor)
    .attr("opacity", 0.9) // Nearly opaque for vulnerable counties
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.25)
    .attr("stroke-opacity", 1);

  // Use our special vulnerable counties legend
  createVulnerableLegend(svgElement, dimensions, step);
}

// Handles highlighting specific counties for narrative examples, adding labels
function _handleCountyHighlights(
  countyPaths,
  features,
  svgElement,
  path,
  step
) {
  // First fade all counties slightly
  countyPaths.attr("opacity", 0.5);

  // Then highlight specific counties
  countyPaths
    .filter((d) => step.highlightCounties.includes(d.id))
    .attr("opacity", 1)
    .attr("stroke", "#ff0000") // Red outline
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "none");

  // Add labels for highlighted counties
  step.highlightCounties.forEach((countyId) => {
    const county = features.find((f) => f.id === countyId);
    if (county) {
      const centroid = path.centroid(county);

      // Add label background
      svgElement
        .append("rect")
        .attr("x", centroid[0] - 40)
        .attr("y", centroid[1] - 30)
        .attr("width", 80)
        .attr("height", 20)
        .attr("fill", "white")
        .attr("opacity", 0.8)
        .attr("rx", 3);

      // Add county name
      svgElement
        .append("text")
        .attr("x", centroid[0])
        .attr("y", centroid[1] - 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .text(county.properties.name);
    }
  });
}

// Adds state outlines as context for county-level maps
function _addStateBoundaries(svgElement, path) {
  try {
    // This function requires access to dataManager which is not available in this scope
    // Need to pass stateData from app.js instead
    if (window.dataManager && window.dataManager.stateData) {
      const stateData = window.dataManager.stateData;

      // Ensure we have valid state data
      if (Array.isArray(stateData) && stateData.length > 0) {
        svgElement
          .selectAll("path.state-outline")
          .data(stateData)
          .join("path")
          .attr("class", "state-outline")
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "#666")
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.5)
          .attr("pointer-events", "none"); // Prevent state outlines from interfering with hover events
      } else {
        console.warn("State data is empty or invalid");
      }
    } else {
      console.warn("No state data available for boundaries");
    }
  } catch (error) {
    console.error("Error adding state boundaries:", error);
  }
}

// Adds a special representation for Washington DC since it's too small to see on state-level maps
function _addCustomDCRepresentation(
  svgElement,
  features,
  dcData,
  path,
  dimensions,
  step,
  colorScale,
  onHover,
  onLeave
) {
  console.log("Starting DC representation with features:", features.length);
  console.log("DC Data:", dcData);
  console.log("Dimensions:", dimensions);

  // Force reliable default positions regardless of calculations
  const dcX = dimensions.width * 0.8; // 80% from left
  const dcY = dimensions.height * 0.4; // 40% from top
  const squareSize = Math.max(15, dimensions.width / 40);

  console.log("Using fixed DC position:", { dcX, dcY, squareSize });

  // Define a group for DC element and label
  const dcGroup = svgElement.append("g").attr("class", "dc-representation");

  // Draw the DC square
  dcGroup
    .append("rect")
    .attr("class", "dc-square state")
    .attr("x", dcX)
    .attr("y", dcY - squareSize / 2) // Center vertically
    .attr("width", squareSize)
    .attr("height", squareSize)
    .attr("fill", getFillColor(dcData, step, colorScale))
    .attr("stroke", "#000") // Darker stroke to make it more visible
    .attr("stroke-width", 1)
    .on("mouseover", function (event) {
      onHover(event, dcData, step, null);
    })
    .on("mouseout", function () {
      onLeave();
    });

  // Add a label for DC
  dcGroup
    .append("text")
    .attr("x", dcX + squareSize / 2)
    .attr("y", dcY + squareSize / 2 + 12) // Position below the square
    .attr("text-anchor", "middle")
    .attr("font-size", "9px")
    .attr("font-weight", "bold")
    .text("DC");

  console.log(
    "Added custom DC square at",
    dcX,
    dcY,
    "with map width",
    dimensions.width
  );
}
