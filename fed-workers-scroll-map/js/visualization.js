// visualization.js - Functions for rendering the map and legends

const visualization = {
  // Create color scale for the current step
  createColorScale: function (stepIndex, statistics, mapData) {
    const step = config.steps[stepIndex];
    const stats = statistics;

    if (step.id === "federal_workers") {
      // Custom breaks for federal workers
      const customBreaks = [1000, 2500, 5000, 7500, 10000];

      return d3
        .scaleThreshold()
        .domain(customBreaks)
        .range(config.colors.federal);
    } else {
      // Create sequential scale for vulnerability index (unchanged)
      return d3
        .scaleThreshold()
        .domain(stats.breaks)
        .range(config.colors.vulnerability);
    }
  },

  // Render the main map visualization
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

    // Get current step and statistics
    const step = config.steps[stepIndex];
    const stats = statistics;

    // Create color scale
    let colorScale;

    if (step.id === "federal_workers") {
      // Custom breaks for federal workers
      const customBreaks = [1000, 2500, 5000, 7500, 10000];

      colorScale = d3
        .scaleThreshold()
        .domain(customBreaks)
        .range(config.colors.federal);
    } else if (step.id === "vulnerability_index") {
      // Custom breaks for vulnerability index
      const customBreaks = [5, 15, 30, 50, 70];

      colorScale = d3
        .scaleThreshold()
        .domain(customBreaks)
        .range(config.colors.vulnerability);
    } else {
      // Create sequential scale for other steps (fallback)
      colorScale = d3
        .scaleThreshold()
        .domain(stats.breaks)
        .range(config.colors.vulnerability);
    }

    // Debug color scale calculations
    this.debugColorScale(stepIndex, stats, mapData);

    // Get thresholds for patterns and highlights
    const outlierInfo = stats.outliers;
    const topThreshold = stats.percentiles.top;
    const bottomThreshold = stats.percentiles.bottom;

    // Draw counties
    svgElement
      .selectAll("path.county")
      .data(mapData)
      .join("path")
      .attr("class", "county")
      .attr("d", path)
      .attr("fill", (d) => {
        // If we're on the vulnerability category step
        if (step.id === "vulnerability_category") {
          const category = d.properties.category;

          // More permissive check - only consider truly missing data as "No Data"
          if (!category || category === "No Data" || category === "Unknown") {
            return "#cccccc"; // Default gray for no data
          }

          // Clean up category name for lookup to handle any formatting inconsistencies
          const cleanCategory = category.trim();

          // Look up color, with fallback
          const color = config.colors.vulnerabilityCategory[cleanCategory];
          if (!color) {
            console.warn(`No color defined for category: "${cleanCategory}"`);
            return "#cccccc"; // Fallback to gray
          }

          return color;
        } else {
          // Your existing code for numeric values
          const value = d.properties[step.dataField];

          // Make sure we're explicitly checking for null, undefined, NaN, and "N/A" string
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
      })
      .attr("stroke", config.colors.regularStroke)
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        onHover(event, d, step, outlierInfo);
      })
      .on("mouseout", function () {
        onLeave();
      });

    // Create legend
    this.createLegend(svgElement, dimensions, step, stats, colorScale);

    console.log("Map rendering complete");
  },

  // Create legend for the current visualization
  createLegend: function (svgElement, dimensions, step, stats) {
    // Legend dimensions and position
    const legendWidth = 220;
    const legendHeight = 20;
    const legendX = dimensions.width - legendWidth - 20;
    const legendY = dimensions.height - 70;

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

    if (step.id === "federal_workers") {
      this.createFederalWorkersLegend(legend, legendWidth, legendHeight, stats);
    } else if (step.id === "vulnerability_category") {
      this.createVulnerabilityCategoryLegend(legend, legendWidth, legendHeight);
    } else if (step.id === "vulnerability_index") {
      // Use custom breaks for vulnerability index
      const customBreaks = [5, 15, 30, 50, 70];
      this.createCustomVulnerabilityLegend(
        legend,
        legendWidth,
        legendHeight,
        customBreaks
      );
    } else {
      // Regular vulnerability index legend (numeric)
      this.createVulnerabilityLegend(legend, legendWidth, legendHeight, stats);
    }
  },

  // Create legend specifically for federal workers visualization
  createFederalWorkersLegend: function (
    legend,
    legendWidth,
    legendHeight,
    stats
  ) {
    // Custom breaks for federal workers
    const customBreaks = [1000, 2500, 5000, 7500, 10000];
    // Add min value at the beginning for drawing purposes
    const allBreaks = [0].concat(customBreaks);
    // Add max value at the end for drawing purposes
    const maxValue = 15000; // Using a higher value for visualization

    // Create blocks for each color range
    for (let i = 0; i < config.colors.federal.length; i++) {
      const startValue = allBreaks[i];
      const endValue = i === allBreaks.length - 1 ? maxValue : allBreaks[i + 1];
      const segmentWidth = (legendWidth / maxValue) * (endValue - startValue);
      const segmentX = (legendWidth / maxValue) * startValue;

      legend
        .append("rect")
        .attr("x", segmentX)
        .attr("y", 0)
        .attr("width", segmentWidth)
        .attr("height", legendHeight)
        .style("fill", config.colors.federal[i]);
    }

    // Add tick marks and labels for all break points
    for (let i = 0; i < allBreaks.length; i++) {
      const value = allBreaks[i];
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

      // Add label for all breaks (since these are meaningful round numbers)
      legend
        .append("text")
        .attr("x", position)
        .attr("y", legendHeight + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .text(value === 0 ? "0" : value.toLocaleString());
    }

    // Add one more tick mark for the "10,000+" label
    const position =
      (customBreaks[customBreaks.length - 1] / maxValue) * legendWidth;

    legend
      .append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "end")
      .style("font-size", "9px")
      .text("10,000+");
  },

  // Create legend specifically for vulnerability visualization
  createVulnerabilityLegend: function (
    legend,
    legendWidth,
    legendHeight,
    stats
  ) {
    // Create sequential color scale for vulnerability index
    for (let i = 0; i < stats.breaks.length; i++) {
      const startValue = i === 0 ? 0 : stats.breaks[i - 1];
      const endValue = stats.breaks[i];
      const segmentWidth = (legendWidth / stats.max) * (endValue - startValue);
      const segmentX = (legendWidth / stats.max) * startValue;

      legend
        .append("rect")
        .attr("x", segmentX)
        .attr("y", 0)
        .attr("width", segmentWidth)
        .attr("height", legendHeight)
        .style(
          "fill",
          config.colors.vulnerability[i % config.colors.vulnerability.length]
        );
    }

    // Add tick marks and labels
    for (let i = 0; i < stats.breaks.length; i++) {
      const value = stats.breaks[i];
      const position = (value / stats.max) * legendWidth;

      // Add tick mark
      legend
        .append("line")
        .attr("x1", position)
        .attr("x2", position)
        .attr("y1", legendHeight)
        .attr("y2", legendHeight + 5)
        .attr("stroke", "#000")
        .attr("stroke-width", 1);

      // Only add labels for some thresholds to avoid overcrowding
      if (i % 2 === 0 || i === stats.breaks.length - 1) {
        legend
          .append("text")
          .attr("x", position)
          .attr("y", legendHeight + 15)
          .attr("text-anchor", "middle")
          .style("font-size", "9px")
          .text(Math.round(value));
      }
    }
  },

  createCustomVulnerabilityLegend: function (
    legend,
    legendWidth,
    legendHeight,
    customBreaks
  ) {
    // Add 0 at the beginning for better visualization
    const allBreaks = [0].concat(customBreaks);
    // Use the max break as the max value
    const maxValue = customBreaks[customBreaks.length - 1] * 1.2; // Add 20% for visual spacing

    // Create blocks for each color range
    for (let i = 0; i < config.colors.vulnerability.length; i++) {
      const startValue = allBreaks[i];
      const endValue = i === allBreaks.length - 1 ? maxValue : allBreaks[i + 1];
      const segmentWidth = (legendWidth / maxValue) * (endValue - startValue);
      const segmentX = (legendWidth / maxValue) * startValue;

      legend
        .append("rect")
        .attr("x", segmentX)
        .attr("y", 0)
        .attr("width", segmentWidth)
        .attr("height", legendHeight)
        .style("fill", config.colors.vulnerability[i]);
    }

    // Add tick marks and labels for all break points
    for (let i = 0; i < allBreaks.length; i++) {
      const value = allBreaks[i];
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

      // Add label
      legend
        .append("text")
        .attr("x", position)
        .attr("y", legendHeight + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .text(value.toString());
    }

    // Add "70+" label at the end
    legend
      .append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "end")
      .style("font-size", "9px")
      .text("70+");
  },

  // Create legend specifically for vulnerability categories
  createVulnerabilityCategoryLegend: function (
    legend,
    legendWidth,
    legendHeight
  ) {
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

    // Add "No Data" category if needed
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

  // Add this function to your visualization object
  debugColorScale: function (stepIndex, statistics, mapData) {
    const step = config.steps[stepIndex];
    const stats = statistics;

    console.log("======= COLOR SCALE DEBUG INFO =======");
    console.log(`Step: ${step.id}`);
    console.log(`Data field: ${step.dataField}`);

    // Log data statistics
    console.log("\nData Statistics:");
    console.log(`Min: ${stats.min}`);
    console.log(`Max: ${stats.max}`);
    console.log(`Median: ${stats.median}`);
    console.log(`Mean: ${stats.mean}`);

    if (step.id === "federal_workers") {
      console.log("\nFederal Workers Color Scale:");
      console.log(`Number of colors in array: ${config.colors.federal.length}`);
      console.log(`Colors: ${JSON.stringify(config.colors.federal)}`);

      // Custom breaks for federal workers
      const customBreaks = [1000, 2500, 5000, 7500, 10000];

      console.log("\nUsing Custom Break Points:");
      customBreaks.forEach((breakPoint, i) => {
        console.log(`Break ${i + 1}: ${breakPoint.toFixed(0)}`);
      });

      console.log("\nColor Mapping:");
      console.log(`Values < ${customBreaks[0]}: ${config.colors.federal[0]}`);

      for (let i = 0; i < customBreaks.length - 1; i++) {
        console.log(
          `Values >= ${customBreaks[i]} and < ${customBreaks[i + 1]}: ${
            config.colors.federal[i + 1]
          }`
        );
      }

      console.log(
        `Values >= ${customBreaks[customBreaks.length - 1]}: ${
          config.colors.federal[config.colors.federal.length - 1]
        }`
      );

      // Only attempt data distribution calculation if mapData is provided
      if (mapData && mapData.length > 0) {
        // Calculate data distribution across buckets
        const bucketCounts = Array(config.colors.federal.length).fill(0);
        const sampleData = this.getSampleData(mapData, step.dataField);

        sampleData.forEach((value) => {
          if (value < customBreaks[0]) {
            bucketCounts[0]++;
          } else if (value >= customBreaks[customBreaks.length - 1]) {
            bucketCounts[bucketCounts.length - 1]++;
          } else {
            for (let i = 0; i < customBreaks.length - 1; i++) {
              if (value >= customBreaks[i] && value < customBreaks[i + 1]) {
                bucketCounts[i + 1]++;
                break;
              }
            }
          }
        });

        console.log("\nData Distribution:");
        const totalCount = sampleData.length;
        bucketCounts.forEach((count, i) => {
          const percentage = ((count / totalCount) * 100).toFixed(2);
          console.log(
            `Color ${i + 1} (${
              config.colors.federal[i]
            }): ${count} values (${percentage}%)`
          );
        });
      } else {
        console.log(
          "\nData Distribution: Cannot calculate (mapData not available)"
        );
      }
    } else {
      // Vulnerability index debugging code (unchanged)
      console.log("\nVulnerability Index Color Scale:");
      console.log(`Number of colors: ${config.colors.vulnerability.length}`);
      console.log(`Colors: ${JSON.stringify(config.colors.vulnerability)}`);
      console.log(`Breaks: ${JSON.stringify(stats.breaks)}`);

      console.log("\nColor Mapping:");
      console.log(
        `Values < ${stats.breaks[0]}: ${config.colors.vulnerability[0]}`
      );

      for (let i = 0; i < stats.breaks.length - 1; i++) {
        console.log(
          `Values >= ${stats.breaks[i]} and < ${stats.breaks[i + 1]}: ${
            config.colors.vulnerability[i + 1]
          }`
        );
      }

      console.log(
        `Values >= ${stats.breaks[stats.breaks.length - 1]}: ${
          config.colors.vulnerability[config.colors.vulnerability.length - 1]
        }`
      );
    }

    console.log("======= END DEBUG INFO =======");
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
