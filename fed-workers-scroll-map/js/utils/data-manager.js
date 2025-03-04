// data-manager.js - Main data management module

import config from "../config.js";
import { loadAllData } from "../data/data-loaders.js";
import { processData } from "../data/data-processors.js";

/**
 * DataManager - Centralizes data operations for the application
 */
class DataManager {
  constructor(utils) {
    // Store utility functions
    this.utils = utils;

    // Primary data structures
    this.rawData = {
      counties: null,
      states: null,
      vulnerability: null,
      vulnerableCounties: null,
    };

    // Processed data
    this.mapData = null;
    this.stateData = null;
    this.spotlightData = null; // Added for spotlight counties
    this.statistics = null;
    this.vulnerableCountyIds = null;
  }

  /**
   * Load and process all data
   * @returns {Promise<Object>} - Processed data ready for visualization
   */
  async initialize() {
    try {
      console.log("Initializing DataManager...");

      // Step 1: Load all raw data
      this.rawData = await loadAllData();

      // Step 2: Process and analyze data
      const processedData = processData(this.rawData, this.utils, config);

      // Step 3: Store processed data
      this.mapData = processedData.mapData;
      this.stateData = processedData.stateData;
      this.spotlightData = processedData.spotlightData;
      this.statistics = processedData.statistics;
      this.vulnerableCountyIds = processedData.vulnerableCountyIds;

      console.log("DataManager initialization complete");

      // Make dataManager globally available for visualization.js
      window.dataManager = this;

      // Return processed map data for immediate use
      return {
        counties: this.mapData,
        states: this.stateData,
        spotlights: this.spotlightData,
        statistics: this.statistics,
      };
    } catch (error) {
      console.error("Error initializing DataManager:", error);
      throw error;
    }
  }

  /**
   * Get statistics for the specified step
   * @param {number} stepIndex - Index of the current visualization step
   * @returns {Object} - Statistics for the given step
   */
  getStatisticsForStep(stepIndex) {
    // Safety check for valid step index
    if (
      stepIndex === undefined ||
      stepIndex === null ||
      !config.steps[stepIndex]
    ) {
      console.warn(`Invalid step index: ${stepIndex}`);
      return this._getDefaultStatistics();
    }

    const step = config.steps[stepIndex];
    let stats = null;

    // Return appropriate statistics based on step ID
    if (step.id === "state_federal_workers") {
      stats = this.statistics && this.statistics.state_federal_workers;
    } else if (step.id === "federal_workers") {
      stats = this.statistics && this.statistics.federal_workers;
    } else if (step.id === "vulnerability_category") {
      // For categorical data, use custom statistics
      return {
        min: 0,
        max: 100,
        mean: 50,
        median: 50,
        count: this.mapData ? this.mapData.length : 0,
        breaks: [25, 50, 75, 100],
        outliers: {
          upperBound: Infinity,
          lowerBound: -Infinity,
        },
        percentiles: {
          top: 100,
          bottom: 0,
        },
      };
    } else if (step.id === "vulnerable_counties") {
      // For spotlight counties, use vulnerability statistics
      stats = this.statistics && this.statistics.vulnerability;
    } else {
      // Default to vulnerability statistics
      stats = this.statistics && this.statistics.vulnerability;
    }

    // If no valid statistics found, return default
    if (!stats) {
      console.warn(`No statistics found for step ${stepIndex} (${step.id})`);
      return this._getDefaultStatistics();
    }

    return stats;
  }

  /**
   * Generate default statistics object for fallback
   * @private
   * @returns {Object} - Default statistics object
   */
  _getDefaultStatistics() {
    return {
      min: 0,
      max: 100,
      mean: 50,
      median: 50,
      breaks: [20, 40, 60, 80, 100],
      quantileBreaks: [20, 40, 60, 80, 100],
      count: this.mapData ? this.mapData.length : 0,
      outliers: {
        upperBound: 100,
        lowerBound: 0,
      },
      percentiles: {
        top: 100,
        bottom: 0,
      },
    };
  }

  /**
   * Get all counties identified as vulnerable
   * @returns {Array} - Array of vulnerable county features
   */
  getVulnerableCounties() {
    if (!this.mapData || !this.vulnerableCountyIds) return [];

    return this.mapData.filter((county) =>
      this.vulnerableCountyIds.includes(county.id)
    );
  }

  /**
   * Get counties for a specific spotlight category
   * @param {string} spotlightId - ID of the spotlight category
   * @returns {Array} - Array of county features in this spotlight
   */
  getSpotlightCounties(spotlightId) {
    if (!this.mapData || !this.spotlightData) return [];

    const spotlight = this.spotlightData.find((s) => s.id === spotlightId);
    if (!spotlight) return [];

    // Get array of FIPS codes for this spotlight
    const fipsCodes = Array.isArray(spotlight.countyFips)
      ? spotlight.countyFips
      : [spotlight.countyFips];

    // Return counties with matching FIPS codes
    return this.mapData.filter((county) => fipsCodes.includes(county.id));
  }
}

export default DataManager;
