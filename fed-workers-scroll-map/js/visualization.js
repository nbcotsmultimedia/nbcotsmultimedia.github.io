// visualization.js - Functions for rendering the map and legends

const visualization = {
  // Create color scale for the current step
  createColorScale: function (stepIndex, statistics) {
    const step = config.steps[stepIndex];

    // Get scale configuration from config or fallback to statistics
    let breaks, colors;

    if (config.scales && config.scales[step.id]) {
      // Use predefined scales from config
      breaks = config.scales[step.id].breaks;
      colors = config.colors[config.scales[step.id].colorSet];
    } else {
      // Fallback to statistics-based breaks
      breaks = statistics.breaks;
      colors = config.colors[step.colorSet || "vulnerability"];
    }

    return d3.scaleThreshold().domain(breaks).range(colors);
  },

  // Get fill color for a feature based on step type and data
  getFillColor: function (feature, step, colorScale) {
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
      const value = feature.properties[step.dataField];

      // Check for missing or invalid data
      if (
        value === undefined ||
        value === null ||
        isNaN(value) ||
        value === "N/A"
      ) {
        return "#cccccc"; // Gray fill color for counties with no data
      }

      return colorScale(value);
    }
  },

  // Render the main map visualization
  renderMap: function (
    svg,
    mapData,
    dimensions,
    stepIndex,
    statistics,
    onHover,
    onLeave
  ) {
    console.log("Rendering map for step:", stepIndex);

    // Clear SVG
    const svgElement = d3.select(svg);
    svgElement.selectAll("*").remove();

    // Set up projection and path generator
    const projection = d3
      .geoAlbersUsa()
      .fitSize([dimensions.width, dimensions.height], {
        type: "FeatureCollection",
        features: mapData,
      });

    const path = d3.geoPath().projection(projection);

    // Get current step and create color scale
    const step = config.steps[stepIndex];
    const colorScale = this.createColorScale(stepIndex, statistics);
    const outlierInfo = statistics.outliers;

    // Draw counties
    svgElement
      .selectAll("path.county")
      .data(mapData)
      .join("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", (d) => this.getFillColor(d, step, colorScale))
      .attr("stroke", config.colors.regularStroke)
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        onHover(event, d, step, outlierInfo);
      })
      .on("mouseout", function () {
        onLeave();
      });

    // Create legend
    this.createLegend(svgElement, dimensions, stepIndex, statistics);

    console.log("Map rendering complete");
  },

  // Create legend for the current visualization
  createLegend: function (svgElement, dimensions, stepIndex, statistics) {
    // Legend dimensions and position
    const legendWidth = 220;
    const legendHeight = 20;
    const legendX = dimensions.width - legendWidth - 20;
    const legendY = dimensions.height - 70;

    const step = config.steps[stepIndex];

    // Create legend container
    const legend = svgElement
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    // Create title
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -10)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(step.title);

    // Select appropriate legend type based on step id
    if (step.id === "vulnerability_category") {
      this.createCategoryLegend(legend, legendWidth, legendHeight);
    } else {
      // Get scale configuration
      let breaks,
        colors,
        maxValue,
        showEndLabel = false;

      if (config.scales && config.scales[step.id]) {
        // Use configuration from config file
        const scaleConfig = config.scales[step.id];
        breaks = scaleConfig.breaks;
        colors = config.colors[scaleConfig.colorSet];
        maxValue = scaleConfig.maxValue || Math.max(...breaks) * 1.2;
        showEndLabel = scaleConfig.showEndLabel || false;
      } else {
        // Fallback to statistics
        breaks = statistics.breaks;
        colors = config.colors[step.colorSet || "vulnerability"];
        maxValue = statistics.max;
      }

      this.createBreaksLegend(
        legend,
        legendWidth,
        legendHeight,
        breaks,
        colors,
        maxValue,
        showEndLabel
      );
    }

    // This code has been replaced by the conditional logic above
  },

  // Generic function to create a breaks-based legend (used for both vulnerability and federal workers)
  createBreaksLegend: function (
    legend,
    legendWidth,
    legendHeight,
    breaks,
    colors,
    maxValue,
    showEndLabel = false
  ) {
    // Add min value at the beginning if not present
    if (breaks[0] !== 0) {
      breaks = [0].concat(breaks);
    }

    // Create blocks for each color range
    for (let i = 0; i < colors.length; i++) {
      const startValue = breaks[i];
      const endValue = i === breaks.length - 1 ? maxValue : breaks[i + 1];
      const segmentWidth = (legendWidth / maxValue) * (endValue - startValue);
      const segmentX = (legendWidth / maxValue) * startValue;

      legend
        .append("rect")
        .attr("x", segmentX)
        .attr("y", 0)
        .attr("width", segmentWidth)
        .attr("height", legendHeight)
        .style("fill", colors[i]);
    }

    // Add tick marks and labels for all break points
    for (let i = 0; i < breaks.length; i++) {
      const value = breaks[i];
      const position = (value / maxValue) * legendWidth;

      // Add tick mark
      legend
        .append("line")
        .attr("x1", position)
        .attr("x2", position)
        .attr("y1", legendHeight)
        .attr("y2", legendHeight + 5)
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

      // Add label (use toLocaleString for formatting if it's federal_workers, which has larger numbers)
      const isNumberLarge = value >= 1000;
      legend
        .append("text")
        .attr("x", position)
        .attr("y", legendHeight + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .text(isNumberLarge ? value.toLocaleString() : value.toString());
    }

    // Add end label if requested (e.g., "10,000+")
    if (showEndLabel) {
      legend
        .append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 15)
        .attr("text-anchor", "end")
        .style("font-size", "9px")
        .text(breaks[breaks.length - 1].toLocaleString() + "+");
    }
  },

  // Create legend specifically for vulnerability categories
  createCategoryLegend: function (legend, legendWidth, legendHeight) {
    // Category information
    const categories = ["Very low", "Low", "Moderate", "High"];

    // Calculate segment width and spacing
    const segmentWidth = 40;
    const spacing = 15;
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
        .style("font-size", "10px")
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
      .style("font-size", "10px")
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
