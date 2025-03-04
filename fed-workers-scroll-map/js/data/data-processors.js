// data-processors.js - Functions for data processing and matching
import { normalizeString } from "../utils/normalization.js";
import {
  calculateVulnerabilityIndex,
  updateVulnerabilityCategories,
  identifyVulnerableCounties,
} from "./vulnerability-analysis.js";

/**
 * Process and merge county, state, and vulnerability data
 * @param {Object} rawData - Object containing raw data sources
 * @param {Object} utils - Utility functions
 * @param {Object} config - Configuration object
 * @returns {Object} Processed data ready for visualization
 */
export function processData(rawData, utils, config) {
  console.log("Processing and merging data...");

  // Create lookup for vulnerability data
  const vulnerabilityByCounty = createVulnerabilityLookup(
    rawData.vulnerability
  );

  // Merge county GeoJSON with vulnerability data
  const mapData = rawData.counties.map((county) => {
    // Get state name from FIPS code
    const countyFips = county.id;
    const stateFipsCode = utils.fips.getStateFips(countyFips);
    const stateName = utils.fips.getStateName(stateFipsCode);
    const countyName = county.properties.name;

    const vulnerabilityInfo = findCountyData(
      countyName,
      stateName,
      vulnerabilityByCounty
    );

    // Set special flag to distinguish 0 from no data
    if (vulnerabilityInfo.category === "No Data") {
      vulnerabilityInfo.dataAvailable = false;
    } else {
      vulnerabilityInfo.dataAvailable = true;
      // Ensure numeric values are actually 0 when they're 0
      vulnerabilityInfo.fed_workers_per_100k =
        vulnerabilityInfo.fed_workers_per_100k || 0;
      // Do the same for other numeric fields
    }

    // Return merged data
    return {
      ...county,
      properties: {
        ...county.properties,
        ...vulnerabilityInfo,
        stateName: stateName,
        fed_workers_per_100k: vulnerabilityInfo.fed_workers_per_100k,
        fedDependency: vulnerabilityInfo.fedDependency,
        vulnerabilityIndex: vulnerabilityInfo.vulnerabilityIndex,
        category: vulnerabilityInfo.category,
      },
    };
  });

  // Calculate vulnerability index with preliminary categories
  calculateVulnerabilityIndex(mapData);

  // Calculate data statistics for counties
  const statistics = calculateDataStatistics(mapData, utils, config);

  // Update categories based on calculated breaks
  updateVulnerabilityCategories(mapData, statistics.vulnerability.breaks);

  // Calculate state aggregates
  const stateData = calculateStateAggregates(
    mapData,
    rawData.states,
    utils,
    config
  );

  // Add this line after state data is created
  statistics.state_federal_workers = calculateStateStatistics(
    stateData,
    utils,
    config
  );

  // Identify vulnerable counties
  const vulnerableCountyIds = identifyVulnerableCounties(
    mapData,
    config.vulnerability
  );

  // Process facilities data (if available)
  const facilitiesData = processFacilitiesData(rawData.facilities);

  // Process spotlight data for vulnerable counties step
  const spotlightData = processSpotlightData(
    config.steps,
    rawData.vulnerableCounties
  );

  console.log("Data processing complete:", {
    counties: mapData.length,
    states: stateData.length,
    facilities: facilitiesData ? facilitiesData.length : 0,
    spotlights: spotlightData ? spotlightData.length : 0,
    vulnerableCounties: vulnerableCountyIds.length,
  });

  return {
    mapData,
    stateData,
    facilitiesData,
    spotlightData,
    statistics,
    vulnerableCountyIds,
  };
}

/**
 * Create lookup for vulnerability data by county name
 * @param {Array} vulnerabilityData - Raw vulnerability data from CSV
 * @returns {Object} Lookup object with county names as keys
 */
export function createVulnerabilityLookup(vulnerabilityData) {
  const vulnerabilityByCounty = {};

  vulnerabilityData.forEach((row) => {
    if (!row.NAME) return;

    // Log a sample of raw data to see column names
    if (vulnerabilityByCounty.sampleLogged !== true) {
      console.log("Sample vulnerability data row:", row);
      vulnerabilityByCounty.sampleLogged = true;
    }

    // Process data fields - ensure we map all possible variations of column names
    const countyData = {
      // Core vulnerability metrics - map using both the old and new property names
      fedDependency: row.fed_dependency || row.pct_federal || 0,
      pct_federal: row.pct_federal || row.fed_dependency || 0,
      vulnerabilityIndex: row.vulnerability_index || 0,
      category: row.vulnerability_category || "Unknown",

      // Additional data for tooltips - ensure we map from correct column names in CSV
      federal_workers: row.federal_workers,
      total_workers: row.total_workers,
      fed_workers_per_100k: row.fed_workers_per_100k,
      unemployment_rate: row.unemployment_rate,
      median_income: row.median_income,
      income_vulnerability: row.income_vulnerability,
      unemployment_vulnerability: row.unemployment_vulnerability,
      metro_area: row.metro_area,
      region: row.region,
    };

    // Store with county name as key
    vulnerabilityByCounty[row.NAME] = countyData;

    // Create additional keys for better matching
    const nameParts = row.NAME.split(", ");
    if (nameParts.length === 2) {
      const countyName = nameParts[0].replace(" County", "");
      const stateName = nameParts[1];

      // Store additional formats
      vulnerabilityByCounty[`${countyName}, ${stateName}`] = countyData;
      vulnerabilityByCounty[countyName] = countyData;
    }
  });

  return vulnerabilityByCounty;
}

/**
 * Find vulnerability data for a county using multiple name formats
 * @param {string} countyName - County name
 * @param {string} stateName - State name
 * @param {Object} vulnerabilityByCounty - Lookup object
 * @returns {Object} County vulnerability data
 */
export function findCountyData(countyName, stateName, vulnerabilityByCounty) {
  // Prepare formats array with standard formats
  const formats = [
    `${countyName} County, ${stateName}`,
    `${countyName}, ${stateName}`,
    countyName,
  ];

  // Special case: Alaska boroughs and census areas
  if (stateName === "Alaska") {
    formats.push(`${countyName} Borough, ${stateName}`);
    formats.push(`${countyName} Census Area, ${stateName}`);
    formats.push(`${countyName} Municipality, ${stateName}`);

    // Special cases for specific Alaska regions
    if (countyName === "Juneau") {
      formats.push("Juneau City and Borough, Alaska");
    }
    if (countyName === "Sitka") {
      formats.push("Sitka City and Borough, Alaska");
    }
    if (countyName === "Wrangell") {
      formats.push("Wrangell City and Borough, Alaska");
    }
    if (countyName === "Yakutat") {
      formats.push("Yakutat City and Borough, Alaska");
    }
    if (countyName === "Anchorage") {
      formats.push("Anchorage Municipality, Alaska");
      formats.push("Municipality of Anchorage, Alaska");
    }

    // Special case for Valdez-Cordova which is now Chugach Census Area
    if (countyName === "Valdez-Cordova") {
      formats.push("Chugach Census Area, Alaska");
      formats.push("Copper River Census Area, Alaska"); // Another possible name
    }
  }

  // Special case: Louisiana parishes
  if (stateName === "Louisiana") {
    formats.push(`${countyName} Parish, ${stateName}`);
  }

  // Special case: Virginia independent cities
  if (stateName === "Virginia") {
    formats.push(`City of ${countyName}, ${stateName}`);

    // For Virginia cities that might be listed without "City" in the name
    if (!countyName.includes("City")) {
      formats.push(`${countyName} City, ${stateName}`);
    }
  }

  // Handle accent mark differences
  if (countyName === "Doña Ana" && stateName === "New Mexico") {
    formats.push("Dona Ana County, New Mexico");
    formats.push("Dona Ana, New Mexico");
    formats.push("Doña Ana County, New Mexico");
  }

  // Check each format
  for (const format of formats) {
    if (vulnerabilityByCounty[format]) {
      const data = vulnerabilityByCounty[format];

      // Extra debug logging for zero values
      if (data.fed_workers_per_100k === 0) {
        console.log(`Found county with exactly 0 fed workers: ${format}`);
      }

      return data;
    }
  }

  // Custom mapping for specific problematic counties
  const customMapping = {
    "Valdez-Cordova, Alaska": "Chugach Census Area, Alaska",
    "Doña Ana, New Mexico": "Dona Ana County, New Mexico",
  };

  const lookupKey = `${countyName}, ${stateName}`;
  if (
    customMapping[lookupKey] &&
    vulnerabilityByCounty[customMapping[lookupKey]]
  ) {
    console.log(
      `Using custom mapping for ${lookupKey} => ${customMapping[lookupKey]}`
    );
    return vulnerabilityByCounty[customMapping[lookupKey]];
  }

  // Try a fuzzy match for difficult cases by removing diacritical marks and spaces
  const normalizedName = normalizeString(countyName);

  const fuzzyMatches = Object.keys(vulnerabilityByCounty).filter((key) => {
    if (key.includes(stateName)) {
      const keyParts = key.split(", ");
      if (keyParts.length === 2) {
        const normalizedKey = normalizeString(keyParts[0]);
        // Check if names are similar
        return (
          normalizedKey === normalizedName ||
          normalizedKey.includes(normalizedName) ||
          normalizedName.includes(normalizedKey)
        );
      }
    }
    return false;
  });

  if (fuzzyMatches.length > 0) {
    const match = fuzzyMatches[0];
    console.log(
      `Fuzzy match found for ${countyName}, ${stateName} => ${match}`
    );
    return vulnerabilityByCounty[match];
  }

  // Debug: Log missing counties
  console.log(`No match found for: ${countyName}, ${stateName}`);

  // Fallback to default values if no match
  return {
    fedDependency: null,
    vulnerabilityIndex: null,
    category: "No Data",
    fed_workers_per_100k: null,
    federal_workers: null,
    total_workers: null,
    unemployment_rate: null,
    median_income: null,
    income_vulnerability: null,
    unemployment_vulnerability: null,
  };
}

/**
 * Calculate statistics for federal workers and vulnerability data
 * @param {Array} counties - Array of county data objects
 * @param {Object} utils - Utility functions
 * @param {Object} config - Configuration object
 * @returns {Object} Calculated statistics
 */
export function calculateDataStatistics(counties, utils, config) {
  // Extract values
  const fedWorkersValues = counties
    .map((d) => d.properties.fed_workers_per_100k)
    .filter((v) => v !== undefined && v !== null && !isNaN(v) && v > 0);

  const vulnerabilityValues = counties
    .map((d) => d.properties.vulnerabilityIndex)
    .filter((v) => v !== undefined && v !== null && !isNaN(v) && v >= 0);

  // Calculate basic statistics
  return {
    federal_workers: {
      // Basic statistics
      ...utils.calculateStatistics(fedWorkersValues),

      // Data classification - now using Jenks natural breaks
      breaks: utils.calculateJenksBreaks(
        fedWorkersValues,
        config.classification.numBreaks
      ),

      // Also include quantile breaks for reference
      quantileBreaks: utils.calculateQuantileBreaks(
        fedWorkersValues,
        config.classification.numBreaks
      ),

      // Cleaned data (without extreme outliers)
      cleaned: utils.cleanOutliers(
        fedWorkersValues,
        config.classification.outlierMultiplier
      ),

      // Outlier information
      outliers: utils.identifyOutliers(fedWorkersValues),

      // Percentile thresholds
      percentiles: utils.calculatePercentileThresholds(
        fedWorkersValues,
        config.classification.percentileThreshold
      ),
    },
    vulnerability: {
      // Basic statistics
      ...utils.calculateStatistics(vulnerabilityValues),

      // Data classification - now using Jenks natural breaks
      breaks: utils.calculateJenksBreaks(
        vulnerabilityValues,
        config.classification.numBreaks
      ),

      // Also include quantile breaks for reference
      quantileBreaks: utils.calculateQuantileBreaks(
        vulnerabilityValues,
        config.classification.numBreaks
      ),

      // Cleaned data (without extreme outliers)
      cleaned: utils.cleanOutliers(
        vulnerabilityValues,
        config.classification.outlierMultiplier
      ),

      // Outlier information
      outliers: utils.identifyOutliers(vulnerabilityValues),

      // Percentile thresholds
      percentiles: utils.calculatePercentileThresholds(
        vulnerabilityValues,
        config.classification.percentileThreshold
      ),
    },
  };
}

/**
 * Calculate state-level aggregation of federal worker data
 * @param {Array} counties - Array of processed county data
 * @param {Array} statesGeoJSON - State GeoJSON features
 * @param {Object} utils - Utility functions
 * @param {Object} config - Configuration object
 * @returns {Array} State data with aggregated metrics
 */
export function calculateStateAggregates(
  counties,
  statesGeoJSON,
  utils,
  config
) {
  console.log("Calculating state-level aggregates...");

  // Group counties by state
  const stateGroups = {};
  counties.forEach((county) => {
    const props = county.properties;
    const stateName = props.stateName;

    if (!stateGroups[stateName]) {
      stateGroups[stateName] = [];
    }

    stateGroups[stateName].push(props);
  });

  // Special case for DC (since it's a single "county")
  const dcCounty = counties.find(
    (county) =>
      county.properties.stateName === "District of Columbia" ||
      county.properties.name === "District of Columbia"
  );

  if (dcCounty && !stateGroups["District of Columbia"]) {
    stateGroups["District of Columbia"] = [dcCounty.properties];
  }

  // Calculate aggregates for each state
  const stateData = {};
  Object.keys(stateGroups).forEach((stateName) => {
    const counties = stateGroups[stateName];

    // Calculate weighted average for federal workers per 100k
    let totalWorkers = 0;
    let totalFedWorkers = 0;
    let totalPopulation = 0;

    counties.forEach((county) => {
      if (county.federal_workers && county.total_workers) {
        totalFedWorkers += county.federal_workers || 0;
        totalWorkers += county.total_workers || 0;
      }
    });

    // Calculate state-level metrics
    const fedWorkersPercent =
      totalWorkers > 0 ? (totalFedWorkers / totalWorkers) * 100 : 0;
    const fedWorkersPer100k =
      totalWorkers > 0 ? (totalFedWorkers / totalWorkers) * 100000 : 0;

    // Store the result
    stateData[stateName] = {
      fed_workers_per_100k: fedWorkersPer100k,
      federal_workers: totalFedWorkers,
      total_workers: totalWorkers,
      pct_federal: fedWorkersPercent,
    };
  });

  // Merge into state GeoJSON features
  const stateDataWithGeo = statesGeoJSON.map((state) => {
    const stateName = state.properties.name;

    return {
      ...state,
      properties: {
        ...state.properties,
        ...(stateData[stateName] || {}),
        stateName: stateName,
        state_fed_workers_per_100k: stateData[stateName]
          ? stateData[stateName].fed_workers_per_100k
          : null,
      },
    };
  });

  console.log("Completed state-level aggregation");

  // Calculate statistics for state data
  const stateValues = stateDataWithGeo
    .map((d) => d.properties.state_fed_workers_per_100k)
    .filter((v) => v !== undefined && v !== null && !isNaN(v) && v > 0);

  const stateStatistics = {
    // Basic statistics
    ...utils.calculateStatistics(stateValues),

    // Data classification
    breaks: utils.calculateJenksBreaks(
      stateValues,
      config.classification.numBreaks
    ),

    // Quantile breaks for reference
    quantileBreaks: utils.calculateQuantileBreaks(
      stateValues,
      config.classification.numBreaks
    ),

    // Other statistics
    cleaned: utils.cleanOutliers(
      stateValues,
      config.classification.outlierMultiplier
    ),
    outliers: utils.identifyOutliers(stateValues),
    percentiles: utils.calculatePercentileThresholds(
      stateValues,
      config.classification.percentileThreshold
    ),
  };

  console.log("State federal workers statistics:", stateStatistics);

  return stateDataWithGeo;
}

/**
 * Calculate state-level statistics
 * @param {Array} stateData - Array of state objects
 * @param {Object} utils - Utility functions
 * @param {Object} config - Configuration object
 * @returns {Object} State statistics object
 */
export function calculateStateStatistics(stateData, utils, config) {
  const stateFederalWorkersValues = stateData
    .map((state) => state.properties.pct_federal)
    .filter((v) => v !== undefined && v !== null && !isNaN(v) && v > 0);

  return {
    // Basic statistics
    ...utils.calculateStatistics(stateFederalWorkersValues),

    // Data classification
    breaks: utils.calculateJenksBreaks(
      stateFederalWorkersValues,
      config.classification.numBreaks
    ),

    // Quantile breaks for reference
    quantileBreaks: utils.calculateQuantileBreaks(
      stateFederalWorkersValues,
      config.classification.numBreaks
    ),

    // Other statistics
    cleaned: utils.cleanOutliers(
      stateFederalWorkersValues,
      config.classification.outlierMultiplier
    ),
    outliers: utils.identifyOutliers(stateFederalWorkersValues),
    percentiles: utils.calculatePercentileThresholds(
      stateFederalWorkersValues,
      config.classification.percentileThreshold
    ),
  };
}

/**
 * Process federal facilities data
 * @param {Array} facilitiesData - Raw facilities data from CSV
 * @returns {Array} - Processed facilities data
 */
function processFacilitiesData(facilitiesData) {
  if (
    !facilitiesData ||
    !Array.isArray(facilitiesData) ||
    facilitiesData.length === 0
  ) {
    console.warn("No facilities data available");
    return [];
  }

  // Filter out entries with invalid coordinates
  const validFacilities = facilitiesData.filter((facility) => {
    return (
      facility.latitude &&
      facility.longitude &&
      !isNaN(facility.latitude) &&
      !isNaN(facility.longitude)
    );
  });

  console.log(`Processed ${validFacilities.length} valid federal facilities`);
  return validFacilities;
}

/**
 * Process spotlight data for vulnerable counties visualization
 * @param {Array} steps - Configuration steps
 * @param {Array} vulnerableCountiesData - Raw vulnerable counties data
 * @returns {Array} - Processed spotlight data
 */
// In data-processors.js, update the processSpotlightData function:
function processSpotlightData(steps, vulnerableCountiesData) {
  console.log("Processing spotlight data...");

  // Find the vulnerable_counties step
  const vulnerableStep = steps.find(
    (step) => step.id === "vulnerable_counties"
  );
  if (!vulnerableStep || !vulnerableStep.spotlights) {
    console.warn("No spotlight configuration found");
    return [];
  }

  // If no vulnerable counties data provided, just return the configuration
  if (
    !vulnerableCountiesData ||
    !Array.isArray(vulnerableCountiesData) ||
    vulnerableCountiesData.length === 0
  ) {
    console.warn(
      "No vulnerable counties data available, using config defaults"
    );
    return vulnerableStep.spotlights;
  }

  console.log(
    "Vulnerable counties data sample:",
    vulnerableCountiesData.slice(0, 2)
  );

  // Check what fields we have in the data
  if (vulnerableCountiesData.length > 0) {
    console.log(
      "Vulnerable counties fields:",
      Object.keys(vulnerableCountiesData[0])
    );
  }

  // Get a map of county/state to FIPS code
  const countyFipsMap = {};

  // Create spotlight categories based on your CSV structure
  const spotlightCategories = {
    triple_threat: [],
    extreme_dependency: [],
    tribal_rural: [],
  };

  // Process the counties and sort them into spotlight categories
  vulnerableCountiesData.forEach((county) => {
    // Determine which category this county belongs to
    // This depends on the structure of your CSV
    const spotlight = county.spotlight || "";
    const category = county.category || "";

    if (spotlight.toLowerCase().includes("triple threat")) {
      spotlightCategories.triple_threat.push(county);
    } else if (spotlight.toLowerCase().includes("extreme")) {
      spotlightCategories.extreme_dependency.push(county);
    } else if (
      spotlight.toLowerCase().includes("tribal") ||
      spotlight.toLowerCase().includes("rural")
    ) {
      spotlightCategories.tribal_rural.push(county);
    }
  });

  console.log("Spotlight categories count:", {
    triple_threat: spotlightCategories.triple_threat.length,
    extreme_dependency: spotlightCategories.extreme_dependency.length,
    tribal_rural: spotlightCategories.tribal_rural.length,
  });

  // Enhance the spotlights with our data
  const enhancedSpotlights = vulnerableStep.spotlights.map((spotlight) => {
    // Get the corresponding category of counties
    let categoryCounties = [];

    if (spotlight.id === "triple_threat") {
      categoryCounties = spotlightCategories.triple_threat;
    } else if (spotlight.id === "extreme_dependency") {
      categoryCounties = spotlightCategories.extreme_dependency;
    } else if (spotlight.id === "tribal_rural") {
      categoryCounties = spotlightCategories.tribal_rural;
    }

    // If we have data, enhance the spotlight
    if (categoryCounties.length > 0) {
      // For single-county spotlights, we can use the first county as an example
      const exampleCounty = categoryCounties[0];

      // Create stats from our data
      const stats = [
        `${exampleCounty.pct_federal.toFixed(1)}% of jobs are federal`,
        `Unemployment rate: ${exampleCounty.unemployment_rate.toFixed(1)}%`,
        `Median income: $${exampleCounty.median_income.toLocaleString()}`,
      ];

      // Merge the config with our data
      return {
        ...spotlight,
        countyData: categoryCounties, // Store all the counties in this category
        // Only override description and stats if not already provided in config
        description:
          spotlight.description ||
          `${categoryCounties.length} counties identified in this category`,
        stats: spotlight.stats || stats,
      };
    }

    // If no matching data, return the original config
    return spotlight;
  });

  console.log("Enhanced spotlights:", enhancedSpotlights);
  return enhancedSpotlights;
}
