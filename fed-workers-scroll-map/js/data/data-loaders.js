// data-loaders.js - Functions for loading data from different sources

import config from "../config.js";

/**
 * Fetch county boundaries from GeoJSON
 * @returns {Promise<Array>} Array of county features
 */
export async function fetchCountiesData() {
  console.log("Fetching US counties data...");
  try {
    const response = await fetch(config.urls.countiesGeoJSON);

    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} - ${response.statusText}`
      );
    }

    const usCounties = await response.json();

    // Validate the data structure
    if (!usCounties || !usCounties.objects || !usCounties.objects.counties) {
      throw new Error("Invalid counties GeoJSON format");
    }

    // Extract features from topojson
    const counties = topojson.feature(
      usCounties,
      usCounties.objects.counties
    ).features;

    console.log(`Extracted ${counties.length} county features`);
    return counties;
  } catch (error) {
    console.error(`Failed to fetch county data: ${error.message}`);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Fetch state boundaries from GeoJSON
 * @returns {Promise<Array>} Array of state features
 */
export async function fetchStatesData() {
  console.log("Fetching US states data...");
  try {
    const response = await fetch(config.urls.statesGeoJSON);

    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} - ${response.statusText}`
      );
    }

    const usStates = await response.json();

    // Validate the data structure
    if (!usStates || !usStates.objects || !usStates.objects.states) {
      throw new Error("Invalid states GeoJSON format");
    }

    // Extract features from topojson
    const states = topojson.feature(usStates, usStates.objects.states).features;

    console.log(`Extracted ${states.length} state features`);
    return states;
  } catch (error) {
    console.error(`Failed to fetch states data: ${error.message}`);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Fetch vulnerability data from CSV
 * @returns {Promise<Array>} Array of vulnerability data records
 */
export async function fetchVulnerabilityData() {
  console.log("Fetching vulnerability data...");
  try {
    const response = await fetch(config.urls.dataSheet);

    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} - ${response.statusText}`
      );
    }

    const csvText = await response.text();

    // Validate CSV data
    if (!csvText || csvText.trim().length === 0) {
      throw new Error("Empty or invalid CSV data received");
    }

    // Parse CSV
    const parseResult = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    // Check for parse errors
    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn("CSV parsing had some errors:", parseResult.errors);
    }

    const parsedData = parseResult.data;

    // Validate parsed data
    if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("Failed to parse vulnerability data from CSV");
    }

    console.log(`Parsed ${parsedData.length} vulnerability data records`);
    return parsedData;
  } catch (error) {
    console.error(`Failed to fetch vulnerability data: ${error.message}`);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Load all data sources in parallel
 * @returns {Promise<Object>} Object containing all loaded data
 */
export async function loadAllData() {
  try {
    console.log("Starting to fetch map data...");

    // Load data in parallel for efficiency
    const [counties, states, vulnerabilityData] = await Promise.all([
      fetchCountiesData(),
      fetchStatesData(),
      fetchVulnerabilityData(),
    ]).catch((error) => {
      throw new Error(`Failed to load data in parallel: ${error.message}`);
    });

    // Return raw data for further processing
    return {
      counties,
      states,
      vulnerability: vulnerabilityData,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    throw new Error(`Failed to load map data: ${error.message}`);
  }
}
