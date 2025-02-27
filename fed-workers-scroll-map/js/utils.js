// utils.js - Utility functions for data processing and calculations

const utils = {
  // Set SVG dimensions based on viewport
  setDimensions: function (svg) {
    const width = window.innerWidth > 800 ? 800 : window.innerWidth - 40;
    const height = width * 0.625; // Keep aspect ratio of 8:5

    if (svg) {
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
    }

    return { width, height };
  },

  // Calculate quantile breaks for data classification
  calculateQuantileBreaks: function (data, numClasses) {
    if (!data || data.length < numClasses) {
      console.warn(
        `Not enough data points (${
          data?.length || 0
        }) for ${numClasses} classes. Using min-max range instead.`
      );

      // Fallback to min-max range if not enough data
      if (!data || data.length === 0) {
        return Array.from(
          { length: numClasses },
          (_, i) => (i + 1) * (100 / numClasses)
        );
      }

      const min = Math.min(...data);
      const max = Math.max(...data);

      return Array.from(
        { length: numClasses },
        (_, i) => min + ((max - min) * (i + 1)) / numClasses
      );
    }

    // Sort the data
    const sortedData = [...data].sort((a, b) => a - b);

    // Calculate quantiles
    const breaks = [];
    for (let i = 1; i < numClasses; i++) {
      const index = Math.floor(sortedData.length * (i / numClasses));
      breaks.push(sortedData[index]);
    }

    // Add the max value
    breaks.push(sortedData[sortedData.length - 1]);

    return breaks;
  },

  // Clean outliers for better visualization
  cleanOutliers: function (data, outlierMultiplier = 2.5) {
    if (!data || data.length < 4) return data;

    // Calculate quartiles
    const sortedData = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedData.length / 4);
    const q3Index = Math.floor((sortedData.length * 3) / 4);
    const q1 = sortedData[q1Index];
    const q3 = sortedData[q3Index];
    const iqr = q3 - q1;

    // Set boundaries
    const upper = q3 + outlierMultiplier * iqr;
    const lower = q1 - outlierMultiplier * iqr;

    // Filter extreme outliers for better color scaling
    return data.filter((d) => d >= lower && d <= upper);
  },

  // Identify outliers using IQR method
  identifyOutliers: function (data) {
    if (!data || data.length < 4) {
      return {
        upperBound: Infinity,
        lowerBound: -Infinity,
        isOutlier: () => false,
        isHighOutlier: () => false,
        isLowOutlier: () => false,
      };
    }

    const sortedData = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedData.length * 0.25);
    const q3Index = Math.floor(sortedData.length * 0.75);
    const q1 = sortedData[q1Index];
    const q3 = sortedData[q3Index];
    const iqr = q3 - q1;

    const upperBound = q3 + 1.5 * iqr;
    const lowerBound = q1 - 1.5 * iqr;

    return {
      upperBound,
      lowerBound,
      isOutlier: (value) => value > upperBound || value < lowerBound,
      isHighOutlier: (value) => value > upperBound,
      isLowOutlier: (value) => value < lowerBound,
    };
  },

  // Calculate percentile thresholds
  calculatePercentileThresholds: function (data, percentile = 0.05) {
    if (!data || data.length === 0) return { top: Infinity, bottom: -Infinity };

    const sortedAscending = [...data].sort((a, b) => a - b);
    const sortedDescending = [...data].sort((a, b) => b - a);

    const bottomIndex = Math.floor(data.length * percentile);
    const topIndex = Math.floor(data.length * percentile);

    return {
      top: sortedDescending[topIndex],
      bottom: sortedAscending[bottomIndex],
    };
  },

  // Extract statistics from a dataset
  calculateStatistics: function (data) {
    if (!data || data.length === 0) {
      return {
        min: 0,
        max: 100,
        mean: 50,
        median: 50,
        count: 0,
      };
    }

    const sortedData = [...data].sort((a, b) => a - b);

    return {
      min: sortedData[0],
      max: sortedData[sortedData.length - 1],
      mean: data.reduce((sum, val) => sum + val, 0) / data.length,
      median: sortedData[Math.floor(sortedData.length / 2)],
      count: data.length,
    };
  },

  // FIPS code utilities
  fips: {
    // Extract state FIPS from county FIPS
    getStateFips: function (countyFips) {
      return countyFips.substring(0, 2);
    },

    // Get state name from FIPS code
    getStateName: function (fipsCode) {
      return config.stateFips[fipsCode] || "Unknown";
    },
  },

  // DOM element creation helpers
  dom: {
    createTooltip: function () {
      const tooltip = document.createElement("div");
      tooltip.id = "tooltip";
      tooltip.className = "tooltip";
      document.body.appendChild(tooltip);
      return tooltip;
    },

    createLoadingMessage: function () {
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
      message.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
      return message;
    },
  },
};
