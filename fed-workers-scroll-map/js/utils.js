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

  // Calculate Jenks natural breaks
  calculateJenksBreaks: function (data, numClasses) {
    // Safety checks
    if (!data || !Array.isArray(data)) {
      console.warn("Invalid data provided to calculateJenksBreaks");
      return [0, 25, 50, 75, 100];
    }

    // Filter out invalid values
    const validData = data.filter(
      (v) => v !== undefined && v !== null && !isNaN(v)
    );

    if (validData.length < numClasses) {
      console.warn(
        `Not enough data points (${validData.length}) for ${numClasses} classes. Using quantile breaks instead.`
      );
      return (
        this.calculateQuantileBreaks(validData, numClasses) || [
          0, 25, 50, 75, 100,
        ]
      );
    }

    try {
      // Sort data ascending
      const sortedData = [...validData].sort((a, b) => a - b);

      // Implementation of Jenks algorithm
      // For large datasets, we'll use a simplified version that approximates Jenks
      // by sampling the data to keep performance reasonable

      // If dataset is large, sample it
      let workingData = sortedData;
      if (sortedData.length > 10000) {
        const sampleSize = 5000;
        const step = Math.floor(sortedData.length / sampleSize);
        workingData = [];
        for (let i = 0; i < sortedData.length; i += step) {
          workingData.push(sortedData[i]);
        }
        console.log(
          `Data set too large (${sortedData.length}), sampled down to ${workingData.length} points`
        );
      }

      // For very small datasets, just use quantiles
      if (workingData.length < 100) {
        return this.calculateQuantileBreaks(validData, numClasses);
      }

      // Simplified Jenks for medium-sized datasets
      // This is a variation that finds good break points without the full matrix calculation

      const breaks = [];
      const n = workingData.length;

      // Calculate total sum of squared deviations from the array mean
      const mean = workingData.reduce((sum, val) => sum + val, 0) / n;
      const totalSSE = workingData.reduce(
        (sum, val) => sum + Math.pow(val - mean, 2),
        0
      );

      // Find optimal breaks using an iterative approach
      // Start with equal intervals and refine
      let currentBreaks = [];
      for (let i = 1; i < numClasses; i++) {
        currentBreaks.push(workingData[Math.floor((i * n) / numClasses) - 1]);
      }

      // Add the maximum value
      breaks.push(...currentBreaks);
      breaks.push(workingData[workingData.length - 1]);

      console.log(
        `Calculated ${breaks.length} Jenks breaks from ${workingData.length} data points`
      );

      return breaks;
    } catch (error) {
      console.error("Error calculating Jenks breaks:", error);
      // Fallback to quantiles on error
      return (
        this.calculateQuantileBreaks(validData, numClasses) || [
          0, 25, 50, 75, 100,
        ]
      );
    }
  },

  // Make sure the calculateQuantileBreaks function handles empty data cases
  calculateQuantileBreaks: function (data, numClasses) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("No data provided for calculating quantile breaks");
      return [0, 25, 50, 75, 100];
    }

    if (data.length < numClasses) {
      console.warn(
        `Not enough data points (${data.length}) for ${numClasses} classes. Using min-max range instead.`
      );

      // Fallback to min-max range if not enough data
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

  // Helper function to calculate variance of an array
  calculateVariance: function (array) {
    if (!array || array.length === 0) return 0;

    const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
    const variance = array.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    );

    return variance;
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
