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
  console.log("Rendering map with data:", {
    dataLength: data ? data.length : 0,
    dimensionsValid: dimensions != null,
    stepConfig: stepConfig ? stepConfig.id : null,
    statisticsValid: statistics != null,
  });

  // Clear the SVG element
  const svgElement = d3.select(svg);
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

// Get fill color for a feature based on step type and data
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

    // Log the value for debugging
    console.log(
      `Color value for ${feature.properties.name}: ${value} (field: ${fieldName})`
    );

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
      console.log(`Adjusted value for ${feature.properties.name}: ${value}`);
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
