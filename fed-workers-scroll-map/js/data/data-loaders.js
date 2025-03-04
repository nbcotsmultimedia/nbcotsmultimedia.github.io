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
 * Fetch federal facilities data from CSV and filter to only include US locations
 * @returns {Promise<Array>} Array of federal facilities data records
 */
export async function fetchFacilitiesData() {
  console.log("Fetching federal facilities data...");
  try {
    const response = await fetch(config.urls.federalFacilities);

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
      console.warn(
        "Facilities CSV parsing had some errors:",
        parseResult.errors
      );
    }

    const parsedData = parseResult.data;

    // Validate parsed data
    if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("Failed to parse federal facilities data from CSV");
    }

    console.log("Raw facilities data count:", parsedData.length);

    // Process facilities data to add coordinates
    const processedFacilities = parsedData
      .map((facility) => {
        // Check all possible column names for coordinates
        const latitudeOptions = [
          facility.Latitude,
          facility.latitude,
          facility.LATITUDE,
          facility.lat,
          facility.LAT,
        ];

        const longitudeOptions = [
          facility.Longitude,
          facility.longitude,
          facility.LONGITUDE,
          facility.lon,
          facility.lng,
          facility.LON,
          facility.LNG,
        ];

        // Find first non-null value
        const latitude = latitudeOptions.find(
          (val) => val !== undefined && val !== null
        );
        const longitude = longitudeOptions.find(
          (val) => val !== undefined && val !== null
        );

        // Rest of your processing code...

        return {
          name: name,
          type: type,
          // Rest of the properties...
        };
      })
      .filter((facility) => {
        // Your filtering code for valid coordinates and US locations
        // ...
      });

    console.log(
      `Processed ${processedFacilities.length} federal facilities (after filtering for US locations)`
    );

    // ============= ADD SAMPLING CODE HERE =============
    // Take a smaller representative sample (e.g., every 50th facility)
    const samplingRate = 50; // Adjust this number to control how many facilities are displayed
    const sampledFacilities = processedFacilities.filter(
      (_, index) => index % samplingRate === 0
    );
    console.log(
      `Sampling ${sampledFacilities.length} facilities from ${processedFacilities.length} total (1/${samplingRate})`
    );

    if (sampledFacilities.length === 0) {
      console.log("No facilities found after sampling. Check sampling rate.");
    } else {
      console.log(
        "Sample processed facility after sampling:",
        sampledFacilities[0]
      );
    }

    // Return the sampled facilities instead of all of them
    return sampledFacilities;
    // ============= END SAMPLING CODE =============

    // Original return statement (comment this out)
    // return processedFacilities;
  } catch (error) {
    console.error(`Failed to fetch federal facilities data: ${error.message}`);
    return []; // Return empty array if facilities data fails to load
  }
}

/**
 * Fetch vulnerable counties spotlight data from CSV
 * @returns {Promise<Array>} Array of vulnerable counties data records
 */
export async function fetchVulnerableCountiesData() {
  console.log("Fetching vulnerable counties data...");
  try {
    const response = await fetch(config.urls.vulnerableCounties);

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
      console.warn(
        "Vulnerable counties CSV parsing had some errors:",
        parseResult.errors
      );
    }

    const parsedData = parseResult.data;

    // Validate parsed data
    if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("Failed to parse vulnerable counties data from CSV");
    }

    console.log(`Parsed ${parsedData.length} vulnerable counties records`);
    return parsedData;
  } catch (error) {
    console.error(`Failed to fetch vulnerable counties data: ${error.message}`);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Load all data sources in parallel
 * @returns {Promise<Object>} Object containing all loaded data
 */
// In data-loaders.js
export async function loadAllData() {
  try {
    console.log("Starting to fetch map data...");

    // Load essential data first for faster initial render
    const [counties, states] = await Promise.all([
      fetchCountiesData(),
      fetchStatesData(),
    ]);

    // Then load supplementary data
    const [vulnerabilityData, vulnerableCountiesData] = await Promise.all([
      fetchVulnerabilityData(),
      fetchVulnerableCountiesData().catch((error) => {
        console.warn("Failed to load vulnerable counties data:", error);
        return [];
      }),
    ]);

    return {
      counties,
      states,
      vulnerability: vulnerabilityData,
      vulnerableCounties: vulnerableCountiesData,
    };
  } catch (error) {
    console.error("Error loading data:", error);
    throw new Error(`Failed to load map data: ${error.message}`);
  }
}
