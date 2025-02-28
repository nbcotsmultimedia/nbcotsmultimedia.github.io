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
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("Invalid data provided to calculateJenksBreaks");
      return [0, 25, 50, 75, 100];
    }

    // Filter out invalid values
    const validData = data.filter(
      (v) => v !== undefined && v !== null && !isNaN(v)
    );

    if (validData.length === 0) {
      console.warn("No valid data points for Jenks breaks calculation");
      return [0, 25, 50, 75, 100];
    }

    // If we don't have enough data points for the requested number of classes,
    // fall back to quantile breaks
    if (validData.length < numClasses) {
      console.warn(
        `Not enough data points (${validData.length}) for ${numClasses} classes. Using quantile breaks instead.`
      );
      return this.calculateQuantileBreaks(validData, numClasses);
    }

    try {
      // Sort data ascending (create a copy to avoid modifying original data)
      const sortedData = [...validData].sort((a, b) => a - b);

      // For very small datasets, use quantiles
      if (sortedData.length < 100) {
        return this.calculateQuantileBreaks(validData, numClasses);
      }

      // Sample the data if it's too large
      let workingData = sortedData;
      const maxSampleSize = 5000;

      if (sortedData.length > maxSampleSize) {
        // Use stratified sampling for better representation
        workingData = this.stratifiedSample(sortedData, maxSampleSize);
        console.log(
          `Large dataset (${sortedData.length} points) sampled to ${workingData.length} points for Jenks calculation`
        );
      }

      // Use simplified Fisher-Jenks algorithm for medium to large datasets
      const breaks = this.fisherJenks(workingData, numClasses);

      // Ensure we always include the maximum value
      if (breaks[breaks.length - 1] < sortedData[sortedData.length - 1]) {
        breaks[breaks.length - 1] = sortedData[sortedData.length - 1];
      }

      return breaks;
    } catch (error) {
      console.error("Error calculating Jenks breaks:", error);
      // Fallback to quantiles on error
      return this.calculateQuantileBreaks(validData, numClasses);
    }
  },

  // Helper function for stratified sampling
  stratifiedSample: function (sortedData, sampleSize) {
    const result = [];
    const n = sortedData.length;

    // Ensure we include min and max values
    result.push(sortedData[0]);

    // Add stratified samples
    const step = (n - 2) / (sampleSize - 2);
    for (let i = 1; i < sampleSize - 1; i++) {
      const index = Math.min(Math.floor(i * step), n - 2);
      result.push(sortedData[index]);
    }

    // Add the maximum value
    result.push(sortedData[n - 1]);

    return result;
  },

  // Simplified Fisher-Jenks algorithm
  fisherJenks: function (data, numClasses) {
    const n = data.length;

    // Special case: if numClasses >= n, each value gets its own class
    if (numClasses >= n) {
      return [...data];
    }

    // Calculate breaks using simplified approach
    const breaks = [];
    const step = n / numClasses;

    for (let i = 1; i < numClasses; i++) {
      const index = Math.floor(i * step);
      breaks.push(data[index]);
    }

    // Add the maximum value
    breaks.push(data[n - 1]);

    return breaks;
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

    // Get state abbreviation from FIPS code
    getStateAbbr: function (fipsCode) {
      // Map of state FIPS codes to abbreviations
      const stateAbbrMap = {
        "01": "AL",
        "02": "AK",
        "04": "AZ",
        "05": "AR",
        "06": "CA",
        "08": "CO",
        "09": "CT",
        10: "DE",
        11: "DC",
        12: "FL",
        13: "GA",
        15: "HI",
        16: "ID",
        17: "IL",
        18: "IN",
        19: "IA",
        20: "KS",
        21: "KY",
        22: "LA",
        23: "ME",
        24: "MD",
        25: "MA",
        26: "MI",
        27: "MN",
        28: "MS",
        29: "MO",
        30: "MT",
        31: "NE",
        32: "NV",
        33: "NH",
        34: "NJ",
        35: "NM",
        36: "NY",
        37: "NC",
        38: "ND",
        39: "OH",
        40: "OK",
        41: "OR",
        42: "PA",
        44: "RI",
        45: "SC",
        46: "SD",
        47: "TN",
        48: "TX",
        49: "UT",
        50: "VT",
        51: "VA",
        53: "WA",
        54: "WV",
        55: "WI",
        56: "WY",
        60: "AS",
        66: "GU",
        69: "MP",
        72: "PR",
        78: "VI",
      };

      return stateAbbrMap[fipsCode] || "Unknown";
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
