// In data-manager.js - modify to use existing import structure

import config from "../config.js";
import {
  loadAllData,
  fetchCountiesData,
  fetchStatesData,
  fetchVulnerabilityData,
  fetchVulnerableCountiesData,
} from "../data/data-loaders.js";
import { processData } from "../data/data-processors.js";

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
    this.spotlightData = null;
    this.statistics = null;
    this.vulnerableCountyIds = null;

    // Add cache for improved performance
    this.cache = {
      statistics: {},
      renderedData: {},
    };
  }

  /**
   * Load and process base map data only
   * @returns {Promise<Object>} - Basic processed data ready for initial render
   */
  async initializeBaseMap() {
    try {
      console.log("Initializing base map data...");

      // Step 1: Load only counties and states data
      const [counties, states] = await Promise.all([
        fetchCountiesData(),
        fetchStatesData(),
      ]);

      this.rawData.counties = counties;
      this.rawData.states = states;

      // Step 2: Do minimal processing for initial render
      const minimalProcessedData = {
        mapData: this.rawData.counties.map((county) => {
          // Get state name from FIPS code
          const countyFips = county.id;
          const stateFipsCode = this.utils.fips.getStateFips(countyFips);
          const stateName = this.utils.fips.getStateName(stateFipsCode);

          // Return with basic properties
          return {
            ...county,
            properties: {
              ...county.properties,
              stateName: stateName,
            },
          };
        }),
        stateData: this.rawData.states,
      };

      // Step 3: Store processed data
      this.mapData = minimalProcessedData.mapData;
      this.stateData = minimalProcessedData.stateData;

      // Make dataManager globally available for visualization.js
      window.dataManager = this;

      console.log("Base map initialization complete");

      // Return processed map data for immediate use
      return {
        counties: this.mapData,
        states: this.stateData,
      };
    } catch (error) {
      console.error("Error initializing base map:", error);
      throw error;
    }
  }

  /**
   * Load and process detailed data for all visualization features
   * @returns {Promise<Object>} - Complete processed data
   */
  async loadDetailData() {
    try {
      console.log("Loading detailed data...");

      // Load the remaining data
      const [vulnerabilityData, vulnerableCountiesData] = await Promise.all([
        fetchVulnerabilityData(),
        fetchVulnerableCountiesData().catch((error) => {
          console.warn("Failed to load vulnerable counties data:", error);
          return [];
        }),
      ]);

      // Update raw data
      this.rawData.vulnerability = vulnerabilityData;
      this.rawData.vulnerableCounties = vulnerableCountiesData;

      // Now process the full dataset
      const processedData = processData(this.rawData, this.utils, config);

      // Update with fully processed data
      this.mapData = processedData.mapData;
      this.stateData = processedData.stateData;
      this.spotlightData = processedData.spotlightData;
      this.statistics = processedData.statistics;
      this.vulnerableCountyIds = processedData.vulnerableCountyIds;

      console.log("Detailed data loading complete");

      // Signal that data has been updated
      window.dispatchEvent(new CustomEvent("dataUpdate"));

      return {
        counties: this.mapData,
        states: this.stateData,
        spotlights: this.spotlightData,
        statistics: this.statistics,
      };
    } catch (error) {
      console.error("Error loading detailed data:", error);
      return null;
    }
  }

  /**
   * Legacy initialize method - kept for compatibility
   * Uses the new two-phase loading approach internally
   */
  async initialize() {
    try {
      console.log("Initializing DataManager (legacy method)...");

      // First initialize base map
      await this.initializeBaseMap();

      // Then load detailed data
      const detailData = await this.loadDetailData();

      // Return combined data
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

  // Keep the rest of your methods the same
  getStatisticsForStep(stepIndexOrId) {
    // Check cache first for improved performance
    if (this.cache.statistics[stepIndexOrId]) {
      return this.cache.statistics[stepIndexOrId];
    }

    // Handle both numeric indices and string IDs
    let stepIndex = stepIndexOrId;
    let stepId = null;

    // If we were passed a string ID, find its index
    if (typeof stepIndexOrId === "string") {
      stepId = stepIndexOrId;
      stepIndex = config.steps.findIndex((step) => step.id === stepId);

      if (stepIndex === -1) {
        console.warn(`Invalid step ID: ${stepId}`);
        return this._getDefaultStatistics();
      }
    }

    // Get the step object
    const step = config.steps[stepIndex];
    if (!step) {
      console.warn(`Invalid step index: ${stepIndex}`);
      return this._getDefaultStatistics();
    }

    stepId = step.id; // Ensure we have the step ID

    let stats = null;

    // Return appropriate statistics based on step ID
    if (stepId === "state_federal_workers") {
      stats = this.statistics && this.statistics.state_federal_workers;
    } else if (stepId === "federal_workers") {
      stats = this.statistics && this.statistics.federal_workers;
    } else if (stepId === "unemployment_rate") {
      // Add unemployment statistics
      stats = this.statistics && this.statistics.unemployment_rate;
    } else if (stepId === "median_income") {
      // Add median income statistics
      stats = this.statistics && this.statistics.median_income;
    } else if (stepId === "vulnerability_category") {
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
    } else if (
      stepId === "vulnerable_counties" ||
      stepId === "trivariate_vulnerability"
    ) {
      // For spotlight counties, use vulnerability statistics
      stats = this.statistics && this.statistics.vulnerability;
    } else {
      // Default to vulnerability statistics
      stats = this.statistics && this.statistics.vulnerability;
    }

    // If no valid statistics found, return default
    if (!stats) {
      console.warn(`No statistics found for step ${stepIndex} (${stepId})`);
      return this._getDefaultStatistics();
    }

    // Cache result before returning
    this.cache.statistics[stepIndexOrId] = stats;
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
