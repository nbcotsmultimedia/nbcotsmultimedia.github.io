// dataService.js - Data loading and processing

import config, { CACHE_CONFIG } from "./config.js";
import { getCountyMatchKeys } from "./utils.js";

// #region - Cache Management

/**
 * In-memory cache for data
 */
const dataCache = {
  states: null,
  counties: null,
  vulnerabilityData: null,
  ruralFedData: null,
  reservationData: null,
  distressedData: null,

  // Raw data for processing
  statesRaw: null,
  countiesRaw: null,
};

/**
 * Initialize cache and check for version changes
 */
export function initializeCache() {
  try {
    // Check if cache version matches current version
    const cachedVersion = localStorage.getItem(CACHE_CONFIG.keys.cacheVersion);

    // If version mismatch or no version, clear cache
    if (!cachedVersion || cachedVersion !== CACHE_CONFIG.version) {
      console.log("Cache version mismatch, clearing cache");
      clearDataCache();
      localStorage.setItem(
        CACHE_CONFIG.keys.cacheVersion,
        CACHE_CONFIG.version
      );
    } else {
      // Check if cache is too old
      const lastUpdated = localStorage.getItem(CACHE_CONFIG.keys.lastUpdated);
      if (
        lastUpdated &&
        Date.now() - parseInt(lastUpdated) > CACHE_CONFIG.maxAge
      ) {
        console.log("Cache expired, clearing");
        clearDataCache();
      } else {
        // Load cached data into memory
        loadCachedData();
      }
    }
  } catch (e) {
    console.warn("Error initializing cache:", e);
    // If any error in cache handling, clear it to be safe
    try {
      clearDataCache();
    } catch (clearError) {
      console.error("Failed to clear cache:", clearError);
    }
  }
}

/**
 * Clear all cached data
 */
export function clearDataCache() {
  // Clear in-memory cache
  Object.keys(dataCache).forEach((key) => {
    dataCache[key] = null;
  });

  // Clear localStorage cache (only our keys)
  Object.values(CACHE_CONFIG.keys).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove cache item: ${key}`, e);
    }
  });

  // Update last cleared timestamp
  try {
    localStorage.setItem(CACHE_CONFIG.keys.lastUpdated, Date.now().toString());
  } catch (e) {
    console.warn("Failed to update last updated timestamp", e);
  }
}

/**
 * Load cached data from localStorage into memory
 */
function loadCachedData() {
  console.log("Loading data from cache");
  try {
    // Load states geodata
    const cachedStatesGeo = localStorage.getItem(CACHE_CONFIG.keys.statesGeo);
    if (cachedStatesGeo) {
      dataCache.statesRaw = JSON.parse(cachedStatesGeo);
      console.log("Loaded states geodata from cache");
    }

    // Load counties geodata
    const cachedCountiesGeo = localStorage.getItem(
      CACHE_CONFIG.keys.countiesGeo
    );
    if (cachedCountiesGeo) {
      dataCache.countiesRaw = JSON.parse(cachedCountiesGeo);
      console.log("Loaded counties geodata from cache");
    }

    // Load vulnerability data
    const cachedVulnerabilityData = localStorage.getItem(
      CACHE_CONFIG.keys.vulnerabilityData
    );
    if (cachedVulnerabilityData) {
      dataCache.vulnerabilityData = JSON.parse(cachedVulnerabilityData);
      console.log("Loaded vulnerability data from cache");
    }

    // Load cluster data
    const cachedRuralFedData = localStorage.getItem(
      CACHE_CONFIG.keys.ruralFedData
    );
    if (cachedRuralFedData) {
      dataCache.ruralFedData = JSON.parse(cachedRuralFedData);
    }

    const cachedReservationData = localStorage.getItem(
      CACHE_CONFIG.keys.reservationData
    );
    if (cachedReservationData) {
      dataCache.reservationData = JSON.parse(cachedReservationData);
    }

    const cachedDistressedData = localStorage.getItem(
      CACHE_CONFIG.keys.distressedData
    );
    if (cachedDistressedData) {
      dataCache.distressedData = JSON.parse(cachedDistressedData);
    }
  } catch (e) {
    console.warn("Error loading cached data:", e);
    // If error loading cache, start fresh
    clearDataCache();
  }
}

/**
 * Save fetched data to cache
 * @param {string} dataType - Type of data (key in CACHE_CONFIG.keys)
 * @param {*} data - Data to cache
 */
function saveFetchedDataToCache(dataType, data) {
  try {
    const cacheKey = CACHE_CONFIG.keys[dataType];
    if (!cacheKey) {
      console.warn(`Unknown data type for caching: ${dataType}`);
      return;
    }

    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(CACHE_CONFIG.keys.lastUpdated, Date.now().toString());
    console.log(`Cached ${dataType} data`);
  } catch (e) {
    // Handle potential quota errors
    if (e.name === "QuotaExceededError" || e.message.includes("quota")) {
      console.warn("localStorage quota exceeded, clearing cache to make space");
      clearDataCache();
      // Try one more time after clearing
      try {
        localStorage.setItem(CACHE_CONFIG.keys[dataType], JSON.stringify(data));
      } catch (retryError) {
        console.error("Failed to cache data even after clearing:", retryError);
      }
    } else {
      console.warn(`Error caching ${dataType} data:`, e);
    }
  }
}

// #endregion

// #region - Data Fetching

/**
 * Modified fetch function with caching
 * @param {string} url - URL to fetch
 * @param {string} dataType - Data type for caching
 * @return {Promise<*>} - Fetched data
 */
export async function fetchWithCache(url, dataType) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data;
    if (url.endsWith(".json")) {
      data = await response.json();
    } else if (url.endsWith(".csv") || url.includes("output=csv")) {
      const text = await response.text();
      // Store raw CSV text
      data = text;
    } else {
      data = await response.text();
    }

    // Cache the fetched data
    if (dataType) {
      saveFetchedDataToCache(dataType, data);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Progressive data loading strategy
 * @param {Function} onUpdate - Callback for each data update
 * @return {Promise<Object>} - Loaded data
 */
export async function loadDataProgressive(onUpdate) {
  try {
    // Check if we have complete cached data
    if (dataCache.states && dataCache.counties && dataCache.vulnerabilityData) {
      console.log("Using cached data");

      // Construct state from cache
      const data = {
        states: dataCache.states,
        counties: dataCache.counties,
      };

      // Notify of data update
      if (onUpdate) onUpdate(data);

      // Still load cluster data in the background if not cached
      if (!dataCache.ruralFedData) {
        loadClusterData().then((clusterData) => {
          enhanceDataWithClusters(data, clusterData);
          if (onUpdate) onUpdate(data);
        });
      }

      // After your data is initially loaded, force cluster data to load
      console.log(
        "Forcing cluster data load to ensure spotlight functionality"
      );
      const clusterData = await loadClusterData();
      enhanceDataWithClusters(processedData || state.data, clusterData);

      // Update the data again after enhancement
      if (onUpdate) onUpdate(processedData);

      return data;
    }

    // Step 1: Load basic map structure first
    let statesData;
    if (dataCache.states) {
      statesData = dataCache.states;
      console.log("Using cached states data");
    } else {
      if (dataCache.statesRaw) {
        statesData = dataCache.statesRaw;
      } else {
        const statesResponse = await fetch(config.urls.statesGeoJSON);
        statesData = await statesResponse.json();
        // Cache the raw state geodata
        dataCache.statesRaw = statesData;
        saveFetchedDataToCache("statesGeo", statesData);
      }
    }

    // Process and display basic state map right away
    const processedStates = processStateData(statesData);
    dataCache.states = processedStates; // Cache processed states

    const initialData = { states: processedStates, counties: [] };
    if (onUpdate) onUpdate(initialData);

    // Step 2: Load county data and main dataset in parallel
    let countiesPromise, dataPromise;

    // Use cached county data if available
    if (dataCache.countiesRaw) {
      console.log("Using cached counties geodata");
      countiesPromise = Promise.resolve(dataCache.countiesRaw);
    } else {
      countiesPromise = fetch(config.urls.countiesGeoJSON)
        .then((response) => response.json())
        .then((data) => {
          dataCache.countiesRaw = data; // Cache raw county geodata
          saveFetchedDataToCache("countiesGeo", data);
          return data;
        });
    }

    // Use cached vulnerability data if available
    if (dataCache.vulnerabilityData) {
      console.log("Using cached vulnerability data");
      dataPromise = Promise.resolve(dataCache.vulnerabilityData);
    } else {
      dataPromise = fetch(config.urls.dataSheet)
        .then((response) => response.text())
        .then((csvText) => {
          const parsedData = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          }).data;

          dataCache.vulnerabilityData = parsedData; // Cache parsed data
          saveFetchedDataToCache("vulnerabilityData", parsedData);
          return parsedData;
        });
    }

    // Wait for both to complete
    const [countiesData, parsedData] = await Promise.all([
      countiesPromise,
      dataPromise,
    ]);

    // Process combined data now that we have both
    const processedData = processData(
      countiesData,
      dataCache.statesRaw,
      parsedData
    );

    // Cache the processed counties
    dataCache.counties = processedData.counties;

    // Notify of data update
    if (onUpdate) onUpdate(processedData);

    // Step 3: Load additional cluster data in the background
    if (!dataCache.ruralFedData) {
      console.log("Loading cluster data in background");

      // Use setTimeout to ensure the UI remains responsive
      setTimeout(() => {
        loadClusterData().then((clusterData) => {
          // Cache cluster data
          dataCache.ruralFedData = clusterData.ruralFedData;
          dataCache.reservationData = clusterData.reservationData;
          dataCache.distressedData = clusterData.distressedData;

          // Enhance already rendered map with cluster data
          enhanceDataWithClusters(processedData, clusterData);

          // Notify of data update
          if (onUpdate) onUpdate(processedData);
        });
      }, 100);
    }

    return processedData;
  } catch (error) {
    console.error("Error loading data:", error);
    throw new Error("Failed to load map data");
  }
}

/**
 * Load cluster-specific data
 * @return {Promise<Object>} Cluster data
 */
export async function loadClusterData() {
  try {
    // Check cache first
    if (
      dataCache.ruralFedData &&
      dataCache.reservationData &&
      dataCache.distressedData
    ) {
      return {
        ruralFedData: dataCache.ruralFedData,
        reservationData: dataCache.reservationData,
        distressedData: dataCache.distressedData,
      };
    }

    // Load all three datasets in parallel
    const [ruralFedText, reservationText, distressedText] = await Promise.all([
      fetch(config.urls.ruralFederalDependentData).then((res) => res.text()),
      fetch(config.urls.nativeAmericanReservationData).then((res) =>
        res.text()
      ),
      fetch(config.urls.economicallyDistressedData).then((res) => res.text()),
    ]);

    // Parse all datasets
    const ruralFedData = Papa.parse(ruralFedText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const reservationData = Papa.parse(reservationText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const distressedData = Papa.parse(distressedText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    // Cache the results
    dataCache.ruralFedData = ruralFedData;
    dataCache.reservationData = reservationData;
    dataCache.distressedData = distressedData;

    // Save to localStorage cache
    saveFetchedDataToCache("ruralFedData", ruralFedData);
    saveFetchedDataToCache("reservationData", reservationData);
    saveFetchedDataToCache("distressedData", distressedData);

    // Return all data
    return {
      ruralFedData,
      reservationData,
      distressedData,
    };
  } catch (error) {
    console.error("Error loading cluster data:", error);
    // Return empty datasets to prevent errors
    return {
      ruralFedData: [],
      reservationData: [],
      distressedData: [],
    };
  }
}

/**
 * Preload data for upcoming sections
 * @param {number} currentStep - Current step index
 */
export function preloadDataForNextSteps(currentStep) {
  // Look ahead up to 2 steps
  const nextSteps = [
    Math.min(currentStep + 1, config.steps.length - 1),
    Math.min(currentStep + 2, config.steps.length - 1),
  ];

  // Preload data for upcoming steps - but don't render yet
  nextSteps.forEach((stepIndex) => {
    if (stepIndex !== currentStep) {
      const stepConfig = config.steps[stepIndex];

      // Check if it's a special view requiring different data
      if (stepConfig.isSpotlightView && !dataCache.ruralFedData) {
        // Use a low priority fetch to avoid competing with current rendering
        setTimeout(() => {
          loadClusterData().then((data) => {
            // Just cache the data, don't enhance yet
            dataCache.ruralFedData = data.ruralFedData;
            dataCache.reservationData = data.reservationData;
            dataCache.distressedData = data.distressedData;
          });
        }, 500);
      }
    }
  });
}

// #endregion

// #region - Data Processing

/**
 * Process state data for initial display
 * @param {Object} statesData - Raw states geodata
 * @return {Array} - Processed state features
 */
function processStateData(statesData) {
  // Extract features from topojson
  const states = topojson.feature(
    statesData,
    statesData.objects.states
  ).features;

  // Add basic properties
  return states.map((state) => {
    const stateFips = state.id;
    const stateName = config.stateFips[stateFips] || "Unknown";

    return {
      ...state,
      properties: {
        ...state.properties,
        stateName,
        state_fed_workers_per_100k: null, // Will be populated later
      },
    };
  });
}

/**
 * Enhance data with cluster information
 * @param {Object} data - The data object containing counties
 * @param {Object} clusterData - The cluster data to apply
 */
export function enhanceDataWithClusters(data, clusterData) {
  if (!data || !data.counties || !clusterData) {
    console.warn("Cannot enhance data: missing required data", {
      hasData: !!data,
      hasCounties: !!(data && data.counties),
      countiesLength: data && data.counties ? data.counties.length : 0,
      hasClusterData: !!clusterData,
    });
    return;
  }

  // Log county array
  // console.log(`County array available: ${data.counties.length} counties`);

  // console.log("Enhancing county data with cluster information", {
  //   countiesCount: data.counties.length,
  //   ruralDataCount: clusterData.ruralFedData?.length || 0,
  //   reservationDataCount: clusterData.reservationData?.length || 0,
  //   distressedDataCount: clusterData.distressedData?.length || 0,
  // });

  // Add a check for sample data from each cluster type
  // if (clusterData.ruralFedData?.length) {
  //   console.log("Sample rural data:", clusterData.ruralFedData[0]);
  // }

  // console.log("Enhancing county data with cluster information");

  // Create lookup tables for each cluster type
  const ruralLookup = {};
  const reservationLookup = {};
  const distressedLookup = {};

  // Build lookup objects from cluster data
  if (clusterData.ruralFedData && Array.isArray(clusterData.ruralFedData)) {
    clusterData.ruralFedData.forEach((row) => {
      if (row.NAME) ruralLookup[row.NAME] = row;
    });
  }

  if (
    clusterData.reservationData &&
    Array.isArray(clusterData.reservationData)
  ) {
    clusterData.reservationData.forEach((row) => {
      if (row.NAME) reservationLookup[row.NAME] = row;
    });
  }

  if (clusterData.distressedData && Array.isArray(clusterData.distressedData)) {
    clusterData.distressedData.forEach((row) => {
      if (row.NAME) distressedLookup[row.NAME] = row;
    });
  }

  // Add a counter to track how many counties were enhanced
  let enhancedCountRural = 0;
  let enhancedCountReservation = 0;
  let enhancedCountDistressed = 0;

  // Enhance each county with cluster data
  data.counties.forEach((county) => {
    const countyName = county.properties.name;
    const stateName = county.properties.stateName;

    // Get possible matching keys
    const possibleKeys = getCountyMatchKeys(countyName, stateName);

    // Look for matches in each cluster
    for (const key of possibleKeys) {
      // Check for rural federal dependent data
      if (ruralLookup[key]) {
        Object.assign(county.properties, {
          is_rural_federal_dependent: true,
          rural_fed_score: ruralLookup[key].rural_fed_score || 0,
          rural_fed_salient_example:
            ruralLookup[key].salient_example === true ||
            ruralLookup[key].salient_example === "True",
          facility_count: ruralLookup[key].facility_count,
          top_federal_agencies: ruralLookup[key].top_federal_agencies,
          federal_facility_types: ruralLookup[key].federal_facility_types,
          top_federal_installations: ruralLookup[key].top_federal_installations,
          federal_facilities_summary:
            ruralLookup[key].federal_facilities_summary,
        });
        enhancedCountRural++;
      }

      // Check for reservation data
      if (reservationLookup[key]) {
        Object.assign(county.properties, {
          is_native_american_reservation: true,
          reservation_score: reservationLookup[key].reservation_score || 0,
          reservation_salient_example:
            reservationLookup[key].salient_example === true ||
            reservationLookup[key].salient_example === "True",
          native_american_pct: reservationLookup[key].native_american_pct,
        });
        enhancedCountReservation++;
      }

      // Check for distressed data
      if (distressedLookup[key]) {
        Object.assign(county.properties, {
          is_economically_distressed: true,
          distress_score: distressedLookup[key].distress_score || 0,
          distress_salient_example:
            distressedLookup[key].salient_example === true ||
            distressedLookup[key].salient_example === "True",
        });
        enhancedCountDistressed++;
      }
    }

    // After the loop that enhances counties:
    // console.log(`Enhanced ${enhancedCountRural} counties with rural data`);
    // console.log(
    //   `Enhanced ${enhancedCountReservation} counties with reservation data`
    // );
    // console.log(
    //   `Enhanced ${enhancedCountDistressed} counties with distressed data`
    // );

    // Track counties in multiple clusters
    const clusterCount = [
      county.properties.is_rural_federal_dependent,
      county.properties.is_native_american_reservation,
      county.properties.is_economically_distressed,
    ].filter(Boolean).length;

    // Determine the cluster type for the combined view
    let clusterType = "none";
    if (clusterCount > 1) {
      clusterType = "multiple";
    } else if (county.properties.is_rural_federal_dependent) {
      clusterType = "rural";
    } else if (county.properties.is_native_american_reservation) {
      clusterType = "reservation";
    } else if (county.properties.is_economically_distressed) {
      clusterType = "distressed";
    }

    // Add combined properties
    county.properties.combined_cluster_type = clusterType;
    county.properties.in_multiple_clusters = clusterCount > 1;
    county.properties.cluster_count = clusterCount;
  });

  console.log("Cluster data enhancement complete");
}

/**
 * Process data for counties and states
 * @param {Object} countiesData - Raw counties geodata
 * @param {Object} statesData - Raw states geodata
 * @param {Array} vulnerabilityData - Vulnerability data
 * @param {Array} ruralFedData - Rural federal data
 * @param {Array} reservationData - Native American reservation data
 * @param {Array} distressedData - Economically distressed data
 * @return {Object} - Processed data
 */
function processData(
  countiesData,
  statesData,
  vulnerabilityData,
  ruralFedData = [],
  reservationData = [],
  distressedData = []
) {
  // Extract county features from topojson
  const counties = topojson.feature(
    countiesData,
    countiesData.objects.counties
  ).features;

  // Extract state features from topojson
  const states = topojson.feature(
    statesData,
    statesData.objects.states
  ).features;

  // Create lookup for vulnerability data
  const vulnerabilityByCounty = {};
  const missingCounties = [];

  vulnerabilityData.forEach((row) => {
    if (!row.NAME) return;

    vulnerabilityByCounty[row.NAME] = {
      fedDependency: row.fed_dependency || row.pct_federal || 0,
      vulnerabilityIndex: row.vulnerability_index || 0,
      fed_workers_per_100k: row.fed_workers_per_100k,
      unemployment_rate: row.unemployment_rate,
      median_income: row.median_income,
      state_fed_workers_per_100k: row.state_fed_workers_per_100k,
    };
  });

  // Create lookups for the cluster data
  const ruralFedByCounty = {};
  ruralFedData.forEach((row) => {
    if (!row.NAME) return;
    ruralFedByCounty[row.NAME] = {
      is_rural_federal_dependent: true,
      rural_fed_score: row.rural_fed_score || 0,
      rural_fed_salient_example:
        row.salient_example === true || row.salient_example === "True",
      // Add the new federal facility fields
      facility_count: row.facility_count,
      top_federal_agencies: row.top_federal_agencies,
      federal_facility_types: row.federal_facility_types,
      top_federal_installations: row.top_federal_installations,
      federal_facilities_summary: row.federal_facilities_summary,
      // Include additional data fields
      pct_federal: row.pct_federal,
      total_workers: row.total_workers,
    };
  });

  const reservationByCounty = {};
  reservationData.forEach((row) => {
    if (!row.NAME) return;
    reservationByCounty[row.NAME] = {
      is_native_american_reservation: true,
      reservation_score: row.reservation_score || 0,
      reservation_salient_example:
        row.salient_example === true || row.salient_example === "True",
      // Add the new federal facility fields
      facility_count: row.facility_count,
      top_federal_agencies: row.top_federal_agencies,
      federal_facility_types: row.federal_facility_types,
      top_federal_installations: row.top_federal_installations,
      federal_facilities_summary: row.federal_facilities_summary,
      // Include additional data fields
      pct_federal: row.pct_federal,
      total_workers: row.total_workers,
      native_american_pct: row.native_american_pct,
    };
  });

  const distressedByCounty = {};
  distressedData.forEach((row) => {
    if (!row.NAME) return;
    distressedByCounty[row.NAME] = {
      is_economically_distressed: true,
      distress_score: row.distress_score || 0,
      distress_salient_example:
        row.salient_example === true || row.salient_example === "True",
      // Add the new federal facility fields
      facility_count: row.facility_count,
      top_federal_agencies: row.top_federal_agencies,
      federal_facility_types: row.federal_facility_types,
      top_federal_installations: row.top_federal_installations,
      federal_facilities_summary: row.federal_facilities_summary,
      // Include additional data fields
      pct_federal: row.pct_federal,
      total_workers: row.total_workers,
    };
  });

  // Create a state-level aggregation for counties that are missing data
  const stateAverages = {};

  // Merge county data with vulnerability and cluster data
  const processedCounties = counties.map((county) => {
    const countyFips = county.id;
    const stateFipsCode = countyFips.substring(0, 2);
    const stateName = config.stateFips[stateFipsCode] || "Unknown";
    const countyName = county.properties.name;

    // Find vulnerability data for this county using enhanced matching
    let vulnerabilityInfo = {};
    let ruralFedInfo = {};
    let reservationInfo = {};
    let distressedInfo = {};

    const possibleKeys = getCountyMatchKeys(countyName, stateName);

    // Find vulnerability data
    let matchFound = false;
    for (const key of possibleKeys) {
      if (vulnerabilityByCounty[key]) {
        vulnerabilityInfo = vulnerabilityByCounty[key];
        matchFound = true;
        break;
      }
    }

    // Find rural federal dependent data
    for (const key of possibleKeys) {
      if (ruralFedByCounty[key]) {
        ruralFedInfo = ruralFedByCounty[key];
        break;
      }
    }

    // Find reservation data
    for (const key of possibleKeys) {
      if (reservationByCounty[key]) {
        reservationInfo = reservationByCounty[key];
        break;
      }
    }

    // Find distressed data
    for (const key of possibleKeys) {
      if (distressedByCounty[key]) {
        distressedInfo = distressedByCounty[key];
        break;
      }
    }

    // Track counties in multiple clusters
    const clusterCount = [
      ruralFedInfo.is_rural_federal_dependent,
      reservationInfo.is_native_american_reservation,
      distressedInfo.is_economically_distressed,
    ].filter(Boolean).length;

    // Determine the cluster type for the combined view
    let clusterType = "none";
    if (clusterCount > 1) {
      clusterType = "multiple";
    } else if (ruralFedInfo.is_rural_federal_dependent) {
      clusterType = "rural";
    } else if (reservationInfo.is_native_american_reservation) {
      clusterType = "reservation";
    } else if (distressedInfo.is_economically_distressed) {
      clusterType = "distressed";
    }

    // If no match found, track for debugging
    if (!matchFound) {
      missingCounties.push({
        fips: countyFips,
        name: countyName,
        state: stateName,
        checkedKeys: possibleKeys,
      });

      // Collect data for state averages as fallback
      if (!stateAverages[stateFipsCode]) {
        stateAverages[stateFipsCode] = {
          totalFedWorkers: 0,
          totalUnemployment: 0,
          totalIncome: 0,
          countFedWorkers: 0,
          countUnemployment: 0,
          countIncome: 0,
        };
      }
    } else {
      // Contribute to state averages if we have this data
      if (!stateAverages[stateFipsCode]) {
        stateAverages[stateFipsCode] = {
          totalFedWorkers: 0,
          totalUnemployment: 0,
          totalIncome: 0,
          countFedWorkers: 0,
          countUnemployment: 0,
          countIncome: 0,
        };
      }

      if (vulnerabilityInfo.fed_workers_per_100k) {
        stateAverages[stateFipsCode].totalFedWorkers +=
          vulnerabilityInfo.fed_workers_per_100k;
        stateAverages[stateFipsCode].countFedWorkers++;
      }

      if (vulnerabilityInfo.unemployment_rate) {
        stateAverages[stateFipsCode].totalUnemployment +=
          vulnerabilityInfo.unemployment_rate;
        stateAverages[stateFipsCode].countUnemployment++;
      }

      if (vulnerabilityInfo.median_income) {
        stateAverages[stateFipsCode].totalIncome +=
          vulnerabilityInfo.median_income;
        stateAverages[stateFipsCode].countIncome++;
      }
    }

    return {
      ...county,
      properties: {
        ...county.properties,
        ...vulnerabilityInfo,
        ...ruralFedInfo,
        ...reservationInfo,
        ...distressedInfo,
        stateName,
        combined_cluster_type: clusterType,
        in_multiple_clusters: clusterCount > 1,
        cluster_count: clusterCount,
        fed_workers_per_100k: vulnerabilityInfo.fed_workers_per_100k || null,
        vulnerabilityIndex: vulnerabilityInfo.vulnerabilityIndex || null,
      },
    };
  });

  // Calculate state averages
  Object.keys(stateAverages).forEach((stateFips) => {
    const data = stateAverages[stateFips];
    stateAverages[stateFips].avgFedWorkers =
      data.countFedWorkers > 0
        ? data.totalFedWorkers / data.countFedWorkers
        : null;
    stateAverages[stateFips].avgUnemployment =
      data.countUnemployment > 0
        ? data.totalUnemployment / data.countUnemployment
        : null;
    stateAverages[stateFips].avgIncome =
      data.countIncome > 0 ? data.totalIncome / data.countIncome : null;
  });

  // Second pass - fill in missing data with state averages
  const filledCounties = processedCounties.map((county) => {
    const stateFips = county.id.substring(0, 2);
    const countyName = county.properties.name;
    const stateName = county.properties.stateName;
    const stateAvg = stateAverages[stateFips] || {};

    // Check if county is missing data and state average is available
    if (
      county.properties.fed_workers_per_100k === null &&
      stateAvg.avgFedWorkers
    ) {
      county.properties.fed_workers_per_100k = stateAvg.avgFedWorkers;
    }

    if (
      county.properties.unemployment_rate === null &&
      stateAvg.avgUnemployment
    ) {
      county.properties.unemployment_rate = stateAvg.avgUnemployment;
    }

    if (county.properties.median_income === null && stateAvg.avgIncome) {
      county.properties.median_income = stateAvg.avgIncome;
    }

    // Calculate vulnerability index if missing but components are available
    if (
      county.properties.vulnerabilityIndex === null &&
      county.properties.fed_workers_per_100k !== null
    ) {
      // Get component weights from config
      const fedWeight =
        config.steps.find((s) => s.id === "federal_workers_component")
          ?.componentWeight || 0.5;
      const unemploymentWeight =
        config.steps.find((s) => s.id === "unemployment_component")
          ?.componentWeight || 0.3;
      const incomeWeight =
        config.steps.find((s) => s.id === "income_component")
          ?.componentWeight || 0.2;

      // Normalize component values
      const fedMax =
        config.steps.find((s) => s.id === "federal_workers_component")
          ?.breaks?.[4] || 10000;
      const unemploymentMax =
        config.steps.find((s) => s.id === "unemployment_component")
          ?.breaks?.[4] || 15;
      const incomeMax =
        config.steps.find((s) => s.id === "income_component")?.breaks?.[4] ||
        90000;

      // Add safety checks to prevent NaN
      const normalizedFed = Math.min(
        1,
        isNaN(county.properties.fed_workers_per_100k)
          ? 0
          : county.properties.fed_workers_per_100k / fedMax
      );

      // Use available unemployment data or default to average
      let normalizedUnemployment = 0;
      if (
        county.properties.unemployment_rate !== null &&
        !isNaN(county.properties.unemployment_rate)
      ) {
        normalizedUnemployment = Math.min(
          1,
          county.properties.unemployment_rate / unemploymentMax
        );
      } else if (stateAvg.avgUnemployment) {
        normalizedUnemployment = Math.min(
          1,
          stateAvg.avgUnemployment / unemploymentMax
        );
      }

      // Use available income data or default to average
      let normalizedIncome = 0;
      if (
        county.properties.median_income !== null &&
        !isNaN(county.properties.median_income)
      ) {
        normalizedIncome =
          1 - Math.min(1, county.properties.median_income / incomeMax);
      } else if (stateAvg.avgIncome) {
        normalizedIncome = 1 - Math.min(1, stateAvg.avgIncome / incomeMax);
      }

      // Calculate weighted score with safety check
      const score =
        (normalizedFed * fedWeight +
          normalizedUnemployment * unemploymentWeight +
          normalizedIncome * incomeWeight) *
        100;

      // Ensure the score is not NaN
      county.properties.vulnerabilityIndex = isNaN(score) ? 0 : score;
    }

    // Special handling for Doña Ana County, New Mexico
    if (countyName === "Doña Ana" && stateName === "New Mexico") {
      // Check if there's still an issue with the vulnerability index
      if (
        county.properties.vulnerabilityIndex === null ||
        isNaN(county.properties.vulnerabilityIndex)
      ) {
        // Calculate simpler vulnerability index based just on federal workers
        if (county.properties.fed_workers_per_100k) {
          const fedMax = 10000;
          const normalizedFed = Math.min(
            1,
            county.properties.fed_workers_per_100k / fedMax
          );
          county.properties.vulnerabilityIndex = normalizedFed * 100;
        } else {
          // Fallback value
          county.properties.vulnerabilityIndex = 50;
        }
      }
    }

    return county;
  });

  // Fix any remaining NaN values
  filledCounties.forEach((county) => {
    if (isNaN(county.properties.vulnerabilityIndex)) {
      county.properties.vulnerabilityIndex = 0;
    }
    if (isNaN(county.properties.fed_workers_per_100k)) {
      county.properties.fed_workers_per_100k = null;
    }
    if (isNaN(county.properties.unemployment_rate)) {
      county.properties.unemployment_rate = null;
    }
    if (isNaN(county.properties.median_income)) {
      county.properties.median_income = null;
    }
  });

  // Process state data
  const processedStates = states.map((state) => {
    const stateFips = state.id;
    const stateName = config.stateFips[stateFips] || "Unknown";
    const stateAvg = stateAverages[stateFips] || {};

    return {
      ...state,
      properties: {
        ...state.properties,
        stateName,
        state_fed_workers_per_100k: stateAvg.avgFedWorkers || null,
      },
    };
  });

  // Return the processed data
  return {
    counties: filledCounties,
    states: processedStates,
  };
}

// #endregion

// Export dataCache for testing/debugging purposes
export const getCacheState = () => ({ ...dataCache });

// Export main data processing functions for use in other modules
export default {
  initializeCache,
  loadDataProgressive,
  loadClusterData,
  enhanceDataWithClusters,
  preloadDataForNextSteps,
  fetchWithCache,
  clearDataCache,
};
