// visualization.js - Functions for rendering the map and legends

const visualization = {
  // This function will be called after Jenks breaks are calculated
  // Add this function for dynamic category assignment with 6 breaks
  assignVulnerabilityCategoryDynamic: function (index, jenksBreaks) {
    if (index === null || index === undefined) return "No Data";

    // Sort breaks in ascending order
    const breaks = jenksBreaks.slice().sort((a, b) => a - b);

    if (index < breaks[0]) return "Very Low";
    if (index < breaks[1]) return "Low";
    if (index < breaks[2]) return "Moderate-Low";
    if (index < breaks[3]) return "Moderate-High";
    if (index < breaks[4]) return "High";
    return "Very High";
  },

  // Get fill color for a feature based on step type and data
  getFillColor: function (feature, step, colorScale) {
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
      const value = feature.properties[fieldName];

      // Check for missing or invalid data
      if (
        value === undefined ||
        value === null ||
        isNaN(value) ||
        value === "N/A"
      ) {
        return "#cccccc"; // Gray fill color for counties/states with no data
      }

      return colorScale(value);
    }
  },

  // Render the main map visualization
  // This is the fixed renderMap function with corrected variable scope
  renderMap: function (
    svg,
    mapData,
    dimensions,
    stepIndex,
    statistics,
    onHover,
    onLeave
  ) {
    // Clear SVG
    const svgElement = d3.select(svg);
    svgElement.selectAll("*").remove();

    // Get current step
    const step = config.steps[stepIndex];
    const isStateLevel = step.isStateLevel === true;

    // Determine which data to use based on step
    let features = isStateLevel ? dataManager.stateData : mapData;

    // If at state level, we'll exclude DC from normal rendering and add it separately
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
        console.log(
          "Extracted DC data for custom rendering:",
          dcData.properties
        );
      }
    }

    // Set up projection and path generator
    const projection = d3
      .geoAlbersUsa()
      .fitSize([dimensions.width, dimensions.height], {
        type: "FeatureCollection",
        features: features,
      });

    const path = d3.geoPath().projection(projection);

    // Create color scale
    const colorScale = this.createColorScale(stepIndex, statistics);
    const outlierInfo = statistics.outliers;

    // Draw states or counties
    const countyPaths = svgElement
      .selectAll(isStateLevel ? "path.state" : "path.county")
      .data(features)
      .join("path")
      .attr("class", isStateLevel ? "state" : "county")
      .attr("d", path)
      .attr("fill", (d) => this.getFillColor(d, step, colorScale))
      .attr("stroke", config.colors.regularStroke)
      .attr("stroke-width", isStateLevel ? 1 : 0.5)
      .on("mouseover", function (event, d) {
        onHover(event, d, step, outlierInfo);
      })
      .on("mouseout", function () {
        onLeave();
      });

    // Apply vulnerable counties highlighting if needed (AFTER drawing the counties)
    if (step.highlightVulnerable && !isStateLevel) {
      // Create a special color scheme for vulnerable counties
      const vulnerableColor = "#de2d26"; // Red for vulnerable counties
      const baseColor = "#cfe8ff"; // Light blue for non-vulnerable counties

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

      // First draw all counties with base color and reduced opacity
      countyPaths
        .attr("fill", baseColor)
        .attr("opacity", 0.15) // Very faded for non-vulnerable
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.25);

      // Then highlight vulnerable counties
      countyPaths
        .filter(vulnerableCriteria)
        .attr("fill", vulnerableColor)
        .attr("opacity", 0.9) // Nearly opaque for vulnerable counties
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 1);

      // Use our special vulnerable counties legend
      this.createVulnerableLegend(svgElement, dimensions, step);

      // Skip the regular legend creation by returning early
      return;
    }

    // If highlighting specific counties for narrative examples
    if (
      step.highlightCounties &&
      step.highlightCounties.length > 0 &&
      !isStateLevel
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

    // If showing counties, also add state boundaries for context
    if (!isStateLevel) {
      svgElement
        .selectAll("path.state-outline")
        .data(dataManager.stateData)
        .join("path")
        .attr("class", "state-outline")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.5)
        .attr("pointer-events", "none"); // Prevent state outlines from interfering with hover events
    }

    // If state level and we have DC data, add custom DC representation
    else if (dcData) {
      // Get the bounding box of the entire map to help position DC
      const bounds = path.bounds({
        type: "FeatureCollection",
        features: features,
      });

      // Find the easternmost states to determine where the Atlantic coast is
      const eastCoastStates = [
        "Maine",
        "New Hampshire",
        "Massachusetts",
        "Rhode Island",
        "Connecticut",
        "New York",
        "New Jersey",
        "Delaware",
        "Maryland",
        "Virginia",
        "North Carolina",
        "South Carolina",
        "Georgia",
        "Florida",
      ];

      let eastmostX = -Infinity;
      let midY = 0;
      let stateCount = 0;

      // Find the average vertical position and rightmost edge of east coast states
      eastCoastStates.forEach((stateName) => {
        const state = features.find((s) => s.properties.name === stateName);
        if (state) {
          const stateBounds = path.bounds(state);
          // Track the rightmost (eastmost) point
          eastmostX = Math.max(eastmostX, stateBounds[1][0]);
          // Track the vertical midpoint for averaging
          midY += (stateBounds[0][1] + stateBounds[1][1]) / 2;
          stateCount++;
        }
      });

      // Calculate a good Y position (middle of east coast states)
      midY = stateCount > 0 ? midY / stateCount : dimensions.height / 2;

      // Position DC square params
      let dcX, dcY, squareSize;

      // Calculate how much space we have to work with
      const mapWidth = dimensions.width;
      const rightMargin = mapWidth - eastmostX;

      // If config has DC square settings, use them
      if (config.dcSquare && config.dcSquare.relativePosition) {
        // Position based on percentage of map dimensions
        dcX = dimensions.width * config.dcSquare.relativePosition.x;
        dcY = dimensions.height * config.dcSquare.relativePosition.y;

        // Size based on map width
        squareSize = dimensions.width * (config.dcSquare.sizeRatio || 0.02);
      } else {
        // Position DC square 30% of the way between the coast and the edge
        const rightEdgeMargin = mapWidth - eastmostX;
        dcX = eastmostX + rightEdgeMargin * 0.3; // 30% of available space

        // Make sure we're not too close to the edge
        const safetyMargin = 40; // Ensure at least 40px from the right edge
        if (dcX + safetyMargin > mapWidth) {
          // If too close to edge, reposition
          dcX = mapWidth - safetyMargin;
        }

        // Try to align with Maryland/Virginia vertically
        const mdData = features.find(
          (state) => state.properties.name === "Maryland"
        );
        const vaData = features.find(
          (state) => state.properties.name === "Virginia"
        );

        if (mdData) {
          const mdCentroid = path.centroid(mdData);
          dcY = mdCentroid[1];
        } else if (vaData) {
          const vaCentroid = path.centroid(vaData);
          dcY = vaCentroid[1];
        } else {
          // Fallback to the middle of the east coast
          dcY = midY;
        }

        // Size should be noticeable but not too large
        squareSize = Math.max(12, dimensions.width / 45);
      }

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
        .attr("fill", this.getFillColor(dcData, step, colorScale))
        .attr("stroke", "#000") // Darker stroke to make it more visible
        .attr("stroke-width", 1)
        .on("mouseover", function (event) {
          onHover(event, dcData, step, outlierInfo);
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

      // Optional connecting line to Maryland
      const mdData = features.find(
        (state) => state.properties.name === "Maryland"
      );
      if (mdData) {
        const mdCentroid = path.centroid(mdData);
        // Only draw line if we're not too far from Maryland
        const distance = Math.sqrt(
          Math.pow(dcX - mdCentroid[0], 2) + Math.pow(dcY - mdCentroid[1], 2)
        );

        // Only add connection line if not too far
        if (distance < dimensions.width / 4) {
          dcGroup
            .append("line")
            .attr("x1", dcX)
            .attr("y1", dcY)
            .attr("x2", mdCentroid[0])
            .attr("y2", mdCentroid[1])
            .attr("stroke", "#666")
            .attr("stroke-width", 0.5)
            .attr("stroke-dasharray", "2,2")
            .attr("pointer-events", "none");
        }
      }

      console.log(
        "Added custom DC square at",
        dcX,
        dcY,
        "with map width",
        mapWidth
      );
    }

    // Create legend
    this.createLegend(svgElement, dimensions, stepIndex, statistics);
  },

  // Update createLegend function to use category-style legend for all maps
  // conditionally show the description
  createLegend: function (svgElement, dimensions, stepIndex, statistics) {
    // Legend dimensions and position
    const legendWidth = 260;
    const legendHeight = 20;
    const legendX = dimensions.width - legendWidth - 20;
    const legendY = dimensions.height - 70;

    const step = config.steps[stepIndex];

    // Create legend container
    const legend = svgElement
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    // Get the proper breaks and colors based on step
    let breaks, colors, maxValue;

    // Look for predefined breaks in config first
    if (config.scales && config.scales[step.id]) {
      const scaleConfig = config.scales[step.id];

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
      (config.categoryNames && config.categoryNames[step.id]) ||
      this.getDefaultCategoryNames(breaks ? breaks.length + 1 : 6);

    // Only show description for vulnerability_index step
    const showDescription = step.id === "vulnerability_index";
    const description = showDescription
      ? "Based on federal employment, unemployment rate, and median income"
      : null;

    // Use category style legend for all maps
    this.createCategoryStyleLegend(
      legend,
      legendWidth,
      legendHeight,
      breaks,
      colors,
      categoryNames,
      step.title || "Federal Workforce Data",
      description
    );
  },

  // Create a special binary legend for vulnerable counties
  createVulnerableLegend: function (svgElement, dimensions, step) {
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
      .style("fill", "#cfe8ff") // Light blue for non-vulnerable
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
      .text("Low Vulnerability");

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
  },

  // Helper function to generate default category names based on number of breaks
  getDefaultCategoryNames: function (numCategories) {
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
  },

  createBreaksLegend: function (
    legend,
    legendWidth,
    legendHeight,
    breaks,
    colors,
    maxValue,
    showEndLabel = false
  ) {
    // Safety checks for input parameters
    if (!breaks || !Array.isArray(breaks) || breaks.length === 0) {
      console.warn("No breaks provided for legend, using default values");
      breaks = [0, 25, 50, 75, 100];
    }

    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      console.warn("No colors provided for legend, using default values");
      colors = [
        "#f7fbff",
        "#deebf7",
        "#c6dbef",
        "#9ecae1",
        "#6baed6",
        "#3182bd",
      ];
    }

    if (maxValue === undefined || maxValue === null || isNaN(maxValue)) {
      maxValue = Math.max(...breaks) * 1.1 || 100;
      console.warn(`No maxValue provided for legend, using ${maxValue}`);
    }

    // Create a copy of breaks to avoid modifying the original
    let legendBreaks = [...breaks].sort((a, b) => a - b);

    // Ensure we have at least one break point
    if (legendBreaks.length === 0) {
      legendBreaks = [0, 50, 100];
    }

    // Ensure we have 0 as the first break if needed
    if (legendBreaks[0] > 0) {
      legendBreaks = [0, ...legendBreaks];
    }

    // Create background for better visibility
    legend
      .append("rect")
      .attr("x", -10)
      .attr("y", -20)
      .attr("width", legendWidth + 20)
      .attr("height", legendHeight + 35)
      .attr("fill", "rgba(255, 255, 255, 0.85)")
      .attr("rx", 4)
      .attr("ry", 4);

    // Add legend title in a more prominent style
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -5)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Vulnerability Index");

    // Create color blocks with category labels
    const categoryNames = ["Very Low", "Low", "Moderate", "High", "Very High"];

    // Create blocks for each color range (ensure we don't exceed colors array)
    const numSegments = Math.min(colors.length, legendBreaks.length);
    for (let i = 0; i < numSegments; i++) {
      // Get current break value safely
      const startValue = i < legendBreaks.length ? legendBreaks[i] : 0;

      // Get next break value safely, or use maxValue for the last segment
      const endValue =
        i < legendBreaks.length - 1 ? legendBreaks[i + 1] : maxValue;

      // Calculate width and position
      const segmentWidth = Math.max(
        0,
        (legendWidth / maxValue) * (endValue - startValue)
      );
      const segmentX = (legendWidth / maxValue) * startValue;

      // Only add the segment if it has positive width
      if (segmentWidth > 0) {
        legend
          .append("rect")
          .attr("x", segmentX)
          .attr("y", 0)
          .attr("width", segmentWidth)
          .attr("height", legendHeight)
          .style("fill", i < colors.length ? colors[i] : "#cccccc")
          .style("stroke", "#555")
          .style("stroke-width", 0.5);
      }
    }

    // Add tick marks and formatted value labels for break points
    for (let i = 0; i < legendBreaks.length; i++) {
      const value = legendBreaks[i];
      const position = (value / maxValue) * legendWidth;

      // Add tick mark
      legend
        .append("line")
        .attr("x1", position)
        .attr("x2", position)
        .attr("y1", legendHeight)
        .attr("y2", legendHeight + 4)
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

      // Format the number more clearly
      const formattedValue = value >= 10 ? value.toFixed(0) : value.toFixed(1);

      // Add label
      legend
        .append("text")
        .attr("x", position)
        .attr("y", legendHeight + 16)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(formattedValue);
    }

    // Add category labels (if we have fewer than 6 categories)
    if (numSegments <= 6) {
      for (let i = 0; i < numSegments - 1; i++) {
        // Calculate midpoint of segment for label
        const startValue = i < legendBreaks.length ? legendBreaks[i] : 0;
        const endValue =
          i + 1 < legendBreaks.length ? legendBreaks[i + 1] : maxValue;
        const midpoint = ((startValue + endValue) / 2 / maxValue) * legendWidth;

        // Use category name if available, otherwise use index
        const categoryName =
          i < categoryNames.length ? categoryNames[i] : `Class ${i + 1}`;

        legend
          .append("text")
          .attr("x", midpoint)
          .attr("y", legendHeight - 5)
          .attr("text-anchor", "middle")
          .style("font-size", "8px")
          .style("fill", "#000")
          .text(categoryName);
      }

      // Add the last category label
      const lastIndex = numSegments - 1;
      const lastStart =
        lastIndex < legendBreaks.length ? legendBreaks[lastIndex] : 0;
      const lastMidpoint =
        ((lastStart + maxValue) / 2 / maxValue) * legendWidth;

      legend
        .append("text")
        .attr("x", lastMidpoint)
        .attr("y", legendHeight - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "8px")
        .style("fill", "#000")
        .text(
          lastIndex < categoryNames.length
            ? categoryNames[lastIndex]
            : `Class ${lastIndex + 1}`
        );
    }
  },

  // This creates a legend with discrete color blocks for each category
  createCategoryStyleLegend: function (
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
  },

  // Also replace the createColorScale function
  createColorScale: function (stepIndex, statistics) {
    const step = config.steps[stepIndex];

    // Safety check for statistics
    if (!statistics) {
      console.warn("No statistics provided for color scale");
      statistics = {
        breaks: [0, 25, 50, 75, 100],
        quantileBreaks: [0, 25, 50, 75, 100],
      };
    }

    // Get scale configuration from config or fallback to statistics
    let breaks, colors;

    try {
      // Try to get configuration from config
      if (config.scales && config.scales[step.id]) {
        const scaleConfig = config.scales[step.id];

        // Determine breaks to use
        if (
          scaleConfig.useJenks &&
          statistics.breaks &&
          statistics.breaks.length > 0
        ) {
          breaks = statistics.breaks;
          // console.log(`Using Jenks breaks for ${step.id}:`, breaks);
        } else if (scaleConfig.breaks && scaleConfig.breaks.length > 0) {
          breaks = scaleConfig.breaks;
          // console.log(`Using fixed breaks for ${step.id}:`, breaks);
        } else if (statistics.breaks && statistics.breaks.length > 0) {
          breaks = statistics.breaks;
          // console.log(`Using statistics breaks for ${step.id}:`, breaks);
        } else if (
          statistics.quantileBreaks &&
          statistics.quantileBreaks.length > 0
        ) {
          breaks = statistics.quantileBreaks;
          // console.log(`Using quantile breaks for ${step.id}:`, breaks);
        } else {
          breaks = [0, 25, 50, 75, 100];
          console.warn(
            `No valid breaks found for ${step.id}, using defaults:`,
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
        console.log(`No scale config for ${step.id}, using statistics`);
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
  },

  // Create category legend
  createCategoryLegend: function (legend, legendWidth, legendHeight) {
    // Updated category information - now with 5 categories including "Very High"
    const categories = ["Very Low", "Low", "Moderate", "High", "Very High"];

    // Calculate segment width and spacing
    const segmentWidth = 35;
    const spacing = 10;
    const totalWidth = categories.length * (segmentWidth + spacing) - spacing;
    const startX = (legendWidth - totalWidth) / 2; // Center the legend

    // Create color blocks for each category
    categories.forEach((category, i) => {
      const x = startX + i * (segmentWidth + spacing);

      // Color block
      legend
        .append("rect")
        .attr("x", x)
        .attr("y", 0)
        .attr("width", segmentWidth)
        .attr("height", legendHeight)
        .style("fill", config.colors.vulnerabilityCategory[category]);

      // Category label
      legend
        .append("text")
        .attr("x", x + segmentWidth / 2)
        .attr("y", legendHeight + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .text(category);
    });

    // Add "No Data" category
    const noDataX = startX + categories.length * (segmentWidth + spacing);

    legend
      .append("rect")
      .attr("x", noDataX)
      .attr("y", 0)
      .attr("width", segmentWidth)
      .attr("height", legendHeight)
      .style("fill", "#cccccc")
      .style("stroke", "#999")
      .style("stroke-width", 0.5);

    legend
      .append("text")
      .attr("x", noDataX + segmentWidth / 2)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .text("No Data");
  },

  // Helper function to get sample data for analysis
  getSampleData: function (mapData, dataField) {
    if (!mapData) return [];

    // Extract values from the map data
    return mapData
      .map((d) => d.properties[dataField])
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          !isNaN(value) &&
          value !== "N/A" &&
          value !== 0
      );
  },
};

window.visualization = visualization;
