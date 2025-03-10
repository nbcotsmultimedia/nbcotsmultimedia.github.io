// main.js - Main application code and visualization handling

// #region - Configuration and state management

// Imports
import config, { CACHE_CONFIG } from "./config.js";

// Caching
const dataCache = {
  states: null,
  counties: null,
  vulnerabilityData: null,
  clusterData: null,
};

// Application state
let state = {
  currentStep: 0,
  mapInitialized: false,
  dimensions: null,
  data: {
    counties: null,
    states: null,
  },
};

// DOM elements
let elements = {
  mapContainer: null,
  description: null,
  svg: null,
  tooltip: null,
  loadingMessage: null,
  sectionsContainer: null,
  progressContainer: null,
  progressBar: null,
  stepIndicators: null,
  stickyContainer: null,
  intersectionObserver: null,
};

// Helper function for debouncing
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Special handler for scroll events (debounced)
 */
function hideTooltipOnScroll() {
  if (elements.tooltip) {
    elements.tooltip.classList.remove("visible");
    elements.tooltip.style.display = "none";
  }
}

// A simple USA outline path for quick initial rendering
function getUSOutline() {
  // This is a simplified outline of the USA for quick rendering
  return "M234.5,53.7L233.1,53.5L231.3,53.1L224.3,52.2L222.7,51.9L219.6,51.2L217.9,50.9L218.5,50L219.8,49.2L220.6,49.3L221.5,49.2L220.9,48.5L218.8,48.6L217.6,48.1L217,46.8L215.2,45.9L214,45.3L210.5,44.5L208.5,43.2L207.7,43.2L206.5,41.9L207.3,41.3L205.1,39.5L204.4,37.9L205.9,37.1L207.2,36.3L207.4,34.6L208.9,34L210.1,32.5L211.3,32.5L212.7,33.7L214.7,33.5L217.4,32.2L217.7,30.5L215.6,29.3L214.7,27.3L213.1,24.4L211.9,23.6L211.9,22.3L216.2,22.3L217.9,24.6L218.3,24.7L219.7,25.7L221.1,26L224.3,24.2L225.1,24L226.2,25.1L226.7,26.8L227.9,28.1L232,29.2L234.1,30.9L234.8,32.2L235.2,33.2L235.4,34.4L236.7,36.2L237.9,37L239.1,38.4L239.5,39.1L240.1,40.3L241.2,41.2L243.9,44.7L244.8,45.3L245.9,45.2L246.7,45.9L248.3,45.9L249.1,47.6L249.2,49L250.1,49.9L250.9,49.9L252.1,51.3L252.9,51.9L252.6,53.1L252.6,53.7L251.2,54.9L250.6,55.7L250.5,57.3L249.4,58.2L248.7,58.2L246.9,56.2L245.6,56L243.2,56.8L241.9,57.1L239.9,57.5L237.5,57.6L237.2,57.3L235.9,57.4L233.8,58.1L232.2,56.7L232.2,55.4L233.1,54L234.5,53.7ZM283.5,469.9L226.7,437.2L226.7,415.5L226.7,409.1L228.1,407.2L229.2,406.6L230.7,406.3L231.9,405.3L232.6,404.1L233.8,404.1L241.9,400.7L257,391.8L259.3,390.2L263.8,386.2L268.5,384.3L270.5,382.1L275,380.7L279.3,376.9L284.3,375.5L284.3,378.8L284.3,380.4L287.7,380.4L287.7,382.1L287.7,384.9L294.4,384.9L294.4,385.4L294.4,387.1L296.1,387.1L296.1,401L296.1,450.1L296.1,465.7L283.5,469.9ZM303.9,465.7L303.9,460.7L302.2,462.4L302.2,464L303.9,465.7ZM309.8,382.1L309.8,380.4L309.8,375.5L313.2,375.5L313.2,378.8L312.1,380.4L309.8,382.1Z";
}

// #endregion

// #region - Initialize cache

// Initialize cache and check for version changes
function initializeCache() {
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

// Clear all cached data
function clearDataCache() {
  // Clear in-memory cache
  dataCache.states = null;
  dataCache.counties = null;
  dataCache.vulnerabilityData = null;
  dataCache.ruralFedData = null;
  dataCache.reservationData = null;
  dataCache.distressedData = null;

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

function optimizeInitialLoading() {
  // Check if we're at the initial step
  if (state.currentStep === 0 && !state.initialMapShown) {
    const svgElement = d3.select(elements.svg);
    const mapGroup = svgElement
      .append("g")
      .attr("class", "map-group")
      .attr("transform", `translate(0, ${state.dimensions.topPadding})`);

    // First show a simple outline of the United States while data loads
    mapGroup
      .append("path")
      .attr("class", "usa-outline")
      .attr("d", getUSOutline()) // This function should return a simple USA outline path
      .attr("fill", "#f0f0f0")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);

    // Show loading text
    mapGroup
      .append("text")
      .attr("x", state.dimensions.width / 2)
      .attr("y", state.dimensions.height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .text("Loading map data...");

    // Mark that we've shown the initial map
    state.initialMapShown = true;

    return true;
  }

  return false;
}

// Load cached data from localStorage into memory
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

// Save fetched data to cache
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

// Modified fetch function with caching
async function fetchWithCache(url, dataType) {
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

// #endregion

// #region - Initialization and setup

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

// App initialization with deferred loading
function initializeApp() {
  console.log("Initializing application...");

  // Initialize cache system first
  initializeCache();

  // Get essential DOM elements
  elements.mapContainer = document.getElementById("map-container");
  elements.description = document.getElementById("description");
  elements.svg = document.getElementById("map-svg");

  // Create loading message (immediate visual feedback)
  elements.loadingMessage = createLoadingMessage();
  elements.svg.parentNode.appendChild(elements.loadingMessage);

  // Set up sticky map container
  setupStickyMap();

  // Set initial dimensions
  state.dimensions = setDimensionsWithPadding(elements.svg);

  // Stage 1: Initial load of just state outlines for immediate display
  try {
    showLoading("Loading map data...");

    // First, try to load from cache for immediate display
    if (dataCache.states) {
      // We have cached states, show them immediately
      console.log("Using cached states for immediate display");
      state.data = {
        states: dataCache.states,
        counties: [],
      };
      state.mapInitialized = true;
      renderCurrentStep();

      // If we also have counties cached, show them next
      if (dataCache.counties) {
        setTimeout(() => {
          state.data.counties = dataCache.counties;
          renderCurrentStep();
        }, 100);
      }
    }

    // Start progressive loading of all data
    loadDataProgressive().then(() => {
      // Mark map as fully initialized
      state.mapInitialized = true;
      hideLoading();

      // Defer non-essential initializations
      setTimeout(() => {
        // Initialize scrollytelling after map is visible
        initializeScrollytelling();

        // Check if URL has a hash to navigate to specific step
        checkInitialHash();

        // Set up event listeners with better performance
        window.addEventListener("resize", debounce(handleResize, 200), {
          passive: true,
        });

        console.log("Application fully initialized");
      }, 500); // Delay to ensure main content is visible first
    });
  } catch (error) {
    console.error("Error initializing application:", error);
    showError("Error loading map data. Please try refreshing the page.");
  }
}

// Set up sticky map container for scrollytelling
function setupStickyMap() {
  // Check if we already have a sticky container in the HTML
  const existingStickyContainer = document.querySelector(".sticky-container");

  if (
    existingStickyContainer &&
    existingStickyContainer.contains(elements.mapContainer)
  ) {
    // Already set up correctly in HTML
    elements.stickyContainer = existingStickyContainer;
    console.log("Using existing sticky container from HTML");
    return;
  }

  // Create a container for the sticky map if needed
  const stickyContainer =
    existingStickyContainer || document.createElement("div");
  stickyContainer.className = "sticky-container";

  // Get the parent of the map container
  const parent = elements.mapContainer.parentNode;

  // Only move things around if we're creating a new structure
  if (!existingStickyContainer) {
    // Move the map container into the sticky container
    parent.insertBefore(stickyContainer, elements.mapContainer);
    stickyContainer.appendChild(elements.mapContainer);
  }

  // Store reference
  elements.stickyContainer = stickyContainer;

  // Add additional padding to leave more room for legend
  elements.mapContainer.style.paddingTop = "40px";

  console.log("Sticky container set up:", stickyContainer);
}

// Handle window resize
function handleResize() {
  state.dimensions = setDimensionsWithPadding(elements.svg);

  if (state.mapInitialized) {
    renderCurrentStep();
  }
}

// #endregion

// #region - UI/DOM utilities

// Special handler specifically for wheel events (mouse scroll)
function hideTooltipOnWheel() {
  // For wheel events, always hide tooltip immediately
  if (elements.tooltip) {
    elements.tooltip.style.display = "none";
  }
}

// Add scroll, resize, and wheel handlers to hide tooltip
function setupTooltipDismissHandlers() {
  // These events should hide the tooltip
  const events = ["scroll", "resize", "wheel"];

  events.forEach((eventType) => {
    window.addEventListener(eventType, hideTooltipOnScroll, { passive: true });
  });

  // Also hide tooltip when user starts to interact with the keyboard
  window.addEventListener("keydown", hideTooltipOnScroll);

  // Add touch event handlers for mobile
  window.addEventListener("touchstart", hideTooltipOnScroll, { passive: true });
}

// Create loading message element
function createLoadingMessage() {
  const message = document.createElement("div");
  message.textContent = "Loading map data...";
  message.className = "loading-message";
  return message;
}

// Show loading message
function showLoading(message) {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message || "Loading...";
    elements.loadingMessage.style.display = "block";
  }
}

/**
 * Hide loading message
 */
function hideLoading() {
  if (elements.loadingMessage) {
    elements.loadingMessage.style.display = "none";
  }
}

/**
 * Show error message
 * @param {string} message - The error message to display
 */
function showError(message) {
  if (elements.loadingMessage) {
    elements.loadingMessage.textContent = message;
    elements.loadingMessage.style.backgroundColor = "rgba(255, 200, 200, 0.9)";
    elements.loadingMessage.style.display = "block";
  }
}

// #endregion

// #region - Data loading and processing

// Load all necessary data
async function loadData() {
  try {
    // Load county data
    const countiesResponse = await fetch(config.urls.countiesGeoJSON);
    const countiesData = await countiesResponse.json();

    // Load state data
    const statesResponse = await fetch(config.urls.statesGeoJSON);
    const statesData = await statesResponse.json();

    // Load data from CSV
    const dataResponse = await fetch(config.urls.dataSheet);
    const csvText = await dataResponse.text();

    // Parse CSV
    const parsedData = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    // Load additional data for the vulnerability clusters
    const ruralFedResponse = await fetch(config.urls.ruralFederalDependentData);
    const ruralFedText = await ruralFedResponse.text();
    const ruralFedData = Papa.parse(ruralFedText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const reservationResponse = await fetch(
      config.urls.nativeAmericanReservationData
    );
    const reservationText = await reservationResponse.text();
    const reservationData = Papa.parse(reservationText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    const distressedResponse = await fetch(
      config.urls.economicallyDistressedData
    );
    const distressedText = await distressedResponse.text();
    const distressedData = Papa.parse(distressedText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    // Process the data
    state.data = processData(
      countiesData,
      statesData,
      parsedData,
      ruralFedData,
      reservationData,
      distressedData
    );

    return state.data;
  } catch (error) {
    console.error("Error loading data:", error);
    throw new Error("Failed to load map data");
  }
}

// Add a more aggressive preloading strategy:
function preloadDataForAdjacentSteps() {
  const currentStep = state.currentStep;
  const nextStep = Math.min(currentStep + 1, config.steps.length - 1);
  const prevStep = Math.max(currentStep - 1, 0);

  // Preload data needed for adjacent steps
  [prevStep, nextStep].forEach((stepIndex) => {
    const stepConfig = config.steps[stepIndex];
    if (stepConfig.isSpotlightView && !dataCache.ruralFedData) {
      loadClusterData().then((data) => {
        // Cache but don't render yet
        dataCache.ruralFedData = data.ruralFedData;
        dataCache.reservationData = data.reservationData;
        dataCache.distressedData = data.distressedData;
      });
    }
  });
}

// Enhance already loaded county data with cluster information
function enhanceDataWithClusters(clusterData) {
  if (!state.data || !state.data.counties || !clusterData) {
    console.warn("Cannot enhance data: missing required data");
    return;
  }

  console.log("Enhancing county data with cluster information");

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

  // Enhance each county with cluster data
  state.data.counties.forEach((county) => {
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
      }
    }

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

// Staged loading approach with caching
async function loadDataProgressive() {
  try {
    // Check if we have complete cached data
    if (dataCache.states && dataCache.counties && dataCache.vulnerabilityData) {
      console.log("Using cached data");

      // Construct state from cache
      state.data = {
        states: dataCache.states,
        counties: dataCache.counties,
      };

      hideLoading();
      renderCurrentStep();

      // Still load cluster data in the background if not cached
      if (!dataCache.ruralFedData) {
        loadClusterData().then((clusterData) => {
          enhanceDataWithClusters(clusterData);
          renderCurrentStep();
        });
      }

      return state.data;
    }

    // Step 1: Load basic map structure first
    showLoading("Loading base map...");

    // Check if we have cached states data
    let statesData;
    if (dataCache.states) {
      statesData = dataCache.states;
      console.log("Using cached states data");
    } else {
      const statesResponse = await fetch(config.urls.statesGeoJSON);
      statesData = await statesResponse.json();
      // Cache the raw state geodata
      dataCache.statesRaw = statesData;
    }

    // Process and display basic state map right away
    const processedStates = processStateData(statesData);
    dataCache.states = processedStates; // Cache processed states

    state.data = { states: processedStates, counties: [] };
    hideLoading();
    renderCurrentStep(); // Show initial state map

    // Step 2: Load county data and main dataset in parallel
    showLoading("Loading detailed data...");

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
          return parsedData;
        });
    }

    // Wait for both to complete
    const [countiesData, parsedData] = await Promise.all([
      countiesPromise,
      dataPromise,
    ]);

    hideLoading();

    // Process combined data now that we have both
    const processedData = processData(
      countiesData,
      dataCache.statesRaw,
      parsedData
    );
    state.data = processedData;

    // Cache the processed counties
    dataCache.counties = processedData.counties;

    // Render with the basic data
    renderCurrentStep();

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
          enhanceDataWithClusters(clusterData);
          renderCurrentStep();
        });
      }, 100);
    }

    return state.data;
  } catch (error) {
    console.error("Error loading data:", error);
    hideLoading();
    showError("Failed to load map data. Please try refreshing the page.");
    throw new Error("Failed to load map data");
  }
}

// Load additional data only when needed based on current view
function loadDataForCurrentStep() {
  const currentStep = config.steps[state.currentStep];

  // Only load cluster data if we're on a spotlight view
  if (currentStep.isSpotlightView && !dataCache.ruralFedData) {
    console.log("Loading cluster data for spotlight view");
    loadClusterData().then((clusterData) => {
      enhanceDataWithClusters(clusterData);
      renderCurrentStep();
    });
  }
}

// Load cluster-specific data
async function loadClusterData() {
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

// Process state data for initial display
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

// Enhanced data processing function to handle special counties
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
    counties: processedCounties,
    states: states.map((state) => {
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
    }),
  };
}

// Helper function for county name matching with better special case handling
function getCountyMatchKeys(countyName, stateName) {
  const keys = [
    `${countyName} County, ${stateName}`,
    `${countyName}, ${stateName}`,
  ];

  // Add special cases for Alaska
  if (stateName === "Alaska") {
    keys.push(`${countyName} Borough, ${stateName}`);
    keys.push(`${countyName} Census Area, ${stateName}`);
    keys.push(`${countyName} Municipality, ${stateName}`);
    keys.push(`${countyName} City and Borough, ${stateName}`);
  }

  // Add special case for Louisiana
  if (stateName === "Louisiana") {
    keys.push(`${countyName} Parish, ${stateName}`);
  }

  // Handle other special cases
  if (stateName === "Virginia") {
    keys.push(`${countyName} city, ${stateName}`);
    keys.push(`${countyName} City, ${stateName}`);
  }

  // Look for specific known problematic counties and add their alternate names
  if (countyName === "Fairfax" && stateName === "Virginia") {
    keys.push("Fairfax County");
    keys.push("Fairfax city, Virginia");
  }

  if (countyName === "Richmond" && stateName === "Virginia") {
    keys.push("Richmond city, Virginia");
  }

  if (countyName === "Valdez-Cordova" && stateName === "Alaska") {
    keys.push("Valdez-Cordova Census Area, Alaska");
    keys.push("Chugach Census Area, Alaska");
    keys.push("Copper River Census Area, Alaska");
  }

  if (countyName === "Petersburg" && stateName === "Alaska") {
    keys.push("Petersburg Census Area, Alaska");
    keys.push("Petersburg Borough, Alaska");
  }

  if (countyName === "Accomack" && stateName === "Virginia") {
    keys.push("Accomack County, Virginia");
    keys.push("Accomac County, Virginia"); // Alternate spelling
  }

  // Doña Ana, NM
  if (countyName === "Doña Ana" && stateName === "New Mexico") {
    keys.push("Dona Ana County, New Mexico"); // Without the ñ
    keys.push("Dona Ana, New Mexico"); // Without the ñ
    keys.push("Doña Ana County, New Mexico"); // With the ñ
  }

  // Add simple name as fallback
  keys.push(countyName);

  return keys;
}

// #endregion

// #region - Map rendering core

// Render the current step
function renderCurrentStep() {
  if (!state.mapInitialized) {
    console.warn("Cannot render map: not initialized");
    return;
  }

  // Get the current step configuration
  const currentStepConfig = config.steps[state.currentStep];
  const isStateLevel = currentStepConfig.isStateLevel === true;
  const isSpotlightView = currentStepConfig.isSpotlightView === true;

  // Prepare SVG for rendering
  const svgElement = d3.select(elements.svg);

  // Clear any existing legends first (fix for overlapping legends)
  svgElement.selectAll("g.legend").remove();

  // Don't clear the SVG immediately - keep old content until new content is ready
  const oldMapGroup = svgElement.select("g.map-group");
  const hasExistingMap = !oldMapGroup.empty();

  // Create a new group with a unique class for the new map view
  const newGroupClass = `map-group-${Date.now()}`;
  const newMapGroup = svgElement
    .append("g")
    .attr("class", `map-group ${newGroupClass}`)
    .attr("transform", `translate(0, ${state.dimensions.topPadding})`)
    .style("opacity", 0); // Start invisible

  // Set up map projection
  const projection = d3
    .geoAlbersUsa()
    .scale(state.dimensions.width * 1.3)
    .translate([state.dimensions.width * 0.49, state.dimensions.height * 0.5]);

  const path = d3.geoPath().projection(projection);

  // Determine which data to use
  const features = isStateLevel ? state.data.states : state.data.counties;

  // Check if we have loaded data yet - if not, show loading state
  if (!features || features.length === 0) {
    renderLoadingState(svgElement, state.dimensions);
    return;
  }

  // Render in the new group
  if (isSpotlightView) {
    // Special spotlight view rendering
    renderSpotlightView(
      svgElement,
      features,
      path,
      currentStepConfig,
      newMapGroup
    );
  } else {
    // Standard view rendering
    renderMapInNewGroup(newMapGroup, features, path, currentStepConfig);
  }

  // Add legend after map (with proper placement)
  createSimpleLegend(svgElement, state.dimensions, currentStepConfig);

  // Fade in the new content and remove old content
  newMapGroup
    .transition()
    .duration(400)
    .style("opacity", 1)
    .on("end", function () {
      // After new content is fully visible, remove the old content
      if (hasExistingMap) {
        oldMapGroup.remove();
      }

      // Rename the new group to the standard name after transition
      newMapGroup.classed(newGroupClass, false);
    });
}

// Render a simple loading state for the map
function renderLoadingState(svgElement, dimensions) {
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  // Add text indicator
  svgElement
    .append("text")
    .attr("x", centerX)
    .attr("y", centerY)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .text("Loading map data...");

  // Simple outline of United States for context
  if (typeof window.usOutline !== "undefined") {
    svgElement
      .append("path")
      .attr("d", window.usOutline)
      .attr("fill", "#f0f0f0")
      .attr("stroke", "#ccc");
  }
}

// Render map in batches for better performance with large datasets
function renderMapInBatches(svgElement, features, path, currentStepConfig) {
  const isStateLevel = currentStepConfig.isStateLevel === true;
  const colorScale = createColorScale(currentStepConfig);
  const mapGroup = svgElement.select("g.map-group");

  // Create all paths efficiently - use a join pattern
  mapGroup
    .selectAll(isStateLevel ? "path.state" : "path.county")
    .data(features)
    .join("path")
    .attr("class", isStateLevel ? "state" : "county")
    .attr("d", path)
    .attr("fill", (d) => getFillColor(d, currentStepConfig, colorScale))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", isStateLevel ? 0.5 : 0.2)
    .attr("opacity", 0) // Start invisible for a fade-in effect
    .on("mouseover", function (event, d) {
      handleHover(event, d, currentStepConfig);
    })
    .on("mouseout", function (event) {
      handleLeave(event);
    })
    .transition() // Animate fade-in
    .duration(400)
    .attr("opacity", currentStepConfig.isComponent ? 0.85 : 1);

  // If showing counties, add state boundaries for context
  if (!isStateLevel && state.data.states) {
    mapGroup
      .selectAll("path.state-outline")
      .data(state.data.states)
      .join("path")
      .attr("class", "state-outline")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.5)
      .attr("pointer-events", "none");
  }

  // Add legend
  createSimpleLegend(svgElement, state.dimensions, currentStepConfig);
}

function renderImprovedMap(svgElement, features, path, currentStepConfig) {
  const isStateLevel = currentStepConfig.isStateLevel === true;
  const colorScale = createColorScale(currentStepConfig);
  const mapGroup = svgElement.select("g.map-group");

  // Use D3's join pattern for better performance
  const selection = mapGroup
    .selectAll(isStateLevel ? "path.state" : "path.county")
    .data(features)
    .join("path")
    .attr("class", isStateLevel ? "state" : "county")
    .attr("d", path)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", isStateLevel ? 0.5 : 0.2)
    .attr("opacity", 0) // Start invisible for fade-in
    .on("mouseover", function (event, d) {
      handleHover(event, d, currentStepConfig);
    })
    .on("mouseout", function (event) {
      handleLeave(event);
    });

  // Fade in with color
  selection
    .transition()
    .duration(300)
    .attr("fill", (d) => getFillColor(d, currentStepConfig, colorScale))
    .attr("opacity", currentStepConfig.isComponent ? 0.85 : 1);

  // If showing counties, add state boundaries for context
  if (!isStateLevel && state.data.states) {
    mapGroup
      .selectAll("path.state-outline")
      .data(state.data.states)
      .join("path")
      .attr("class", "state-outline")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0)
      .transition()
      .duration(400)
      .attr("stroke-opacity", 0.5);
  }

  // Add legend
  createSimpleLegend(svgElement, state.dimensions, currentStepConfig);
}

// New function to render map in a specific group for transitions
function renderMapInNewGroup(mapGroup, features, path, currentStepConfig) {
  const isStateLevel = currentStepConfig.isStateLevel === true;
  const colorScale = createColorScale(currentStepConfig);

  // Draw features (states or counties)
  mapGroup
    .selectAll(isStateLevel ? "path.state" : "path.county")
    .data(features)
    .join("path")
    .attr("class", isStateLevel ? "state" : "county")
    .attr("d", path)
    .attr("fill", (d) => getFillColor(d, currentStepConfig, colorScale))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", isStateLevel ? 0.5 : 0.2)
    .attr("opacity", currentStepConfig.isComponent ? 0.85 : 1)
    .on("mouseover", function (event, d) {
      handleHover(event, d, currentStepConfig);
    })
    .on("mouseout", function (event) {
      handleLeave(event);
    });

  // If showing counties, add state boundaries for context
  if (!isStateLevel && state.data.states) {
    mapGroup
      .selectAll("path.state-outline")
      .data(state.data.states)
      .join("path")
      .attr("class", "state-outline")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.5)
      .attr("pointer-events", "none");
  }
}

// Optimize tooltip creation - create only on first interaction
function createTooltip() {
  // Check if tooltip already exists
  let tooltip = document.getElementById("tooltip");

  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tooltip";
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);

    // Use passive event listener for better performance
    window.addEventListener("scroll", hideTooltipOnScroll, { passive: true });
  }

  return tooltip;
}

// Defer tooltip initialization until needed
function getTooltip() {
  if (!elements.tooltip) {
    elements.tooltip = createTooltip();
    setupTooltipDismissHandlers();
  }
  return elements.tooltip;
}

// Optimize tooltip positioning with less reflow
function positionTooltip(event, content) {
  const tooltip = getTooltip();

  // Clear previous arrow classes
  tooltip.classList.remove(
    "right-arrow",
    "left-arrow",
    "top-arrow",
    "bottom-arrow",
    "visible"
  );

  // Set content first so we can measure accurate dimensions
  tooltip.innerHTML = content;

  // Ensure tooltip is visible for measuring but not displayed yet
  tooltip.style.cssText = "display: block; opacity: 0; position: absolute;";

  // Get tooltip dimensions after content is set
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;

  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate cursor position relative to viewport
  const cursorX = event.clientX;
  const cursorY = event.clientY;

  // Calculate available space in each direction
  const spaceRight = viewportWidth - cursorX - 15;
  const spaceLeft = cursorX - 15;
  const spaceBelow = viewportHeight - cursorY - 15;
  const spaceAbove = cursorY - 15;

  // Determine position and set coordinates in one operation
  let position, styleText;

  if (spaceRight >= tooltipWidth) {
    position = "right";
    styleText = `left: ${event.pageX + 15}px; top: ${Math.max(
      window.scrollY + 10,
      event.pageY - tooltipHeight / 2
    )}px;`;
  } else if (spaceLeft >= tooltipWidth) {
    position = "left";
    styleText = `left: ${event.pageX - tooltipWidth - 15}px; top: ${Math.max(
      window.scrollY + 10,
      event.pageY - tooltipHeight / 2
    )}px;`;
  } else if (spaceBelow >= tooltipHeight) {
    position = "top";
    const left = Math.max(
      window.scrollX + 10,
      Math.min(
        event.pageX - tooltipWidth / 2,
        window.scrollX + viewportWidth - tooltipWidth - 10
      )
    );
    styleText = `left: ${left}px; top: ${event.pageY + 15}px;`;
  } else {
    position = "bottom";
    const left = Math.max(
      window.scrollX + 10,
      Math.min(
        event.pageX - tooltipWidth / 2,
        window.scrollX + viewportWidth - tooltipWidth - 10
      )
    );
    styleText = `left: ${left}px; top: ${event.pageY - tooltipHeight - 15}px;`;
  }

  // Apply all styles at once to minimize reflow
  styleText += "display: block; opacity: 1;";
  tooltip.style.cssText = styleText;

  // Add arrow class based on position
  tooltip.classList.add(`${position}-arrow`, "visible");
}

// Create a color scale
function createColorScale(stepConfig) {
  const colorSet = stepConfig.colorSet || "blues";
  const colors = config.colors[colorSet] || config.colors.federal;

  // Use quantile scale for simplicity
  const domain = stepConfig.breaks || [1000, 2500, 5000, 7500, 10000];

  return d3.scaleThreshold().domain(domain).range(colors);
}

// Enhanced getFillColor function with debugging for missing data
function getFillColor(feature, stepConfig, colorScale) {
  const fieldName = stepConfig.dataField;
  let value = feature.properties[fieldName];

  // If we need to invert the scale (for median income where lower is worse)
  if (stepConfig.invertScale) {
    // Invert the color scale
    const colors = config.colors[stepConfig.colorSet];
    const normalizedValue = 1 - value / 150000; // Arbitrary max
    const colorIndex = Math.min(
      Math.floor(normalizedValue * colors.length),
      colors.length - 1
    );
    return colors[colorIndex];
  }

  return colorScale(value);
}

// #endregion

// #region - Specialized visualization renderers

// Render layered components to create a trivariate choropleth
function renderLayeredComponents(
  svgElement,
  features,
  path,
  currentStepConfig
) {
  // Get all the components we need to display
  const steps = config.steps;
  const currentIndex = steps.indexOf(currentStepConfig);

  // First, add a base white/light gray layer
  svgElement
    .select("g.map-group")
    .selectAll("path.base-layer")
    .data(features)
    .join("path")
    .attr("class", "base-layer")
    .attr("d", path)
    .attr("fill", "#f8f8f8") // Very light gray
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.1); // Very thin stroke for base layer

  // Add state boundaries for context
  svgElement
    .select("g.map-group")
    .selectAll("path.state-outline")
    .data(state.data.states)
    .join("path")
    .attr("class", "state-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#666")
    .attr("stroke-width", 0.5) // Reduced from 1
    .attr("stroke-opacity", 0.5)
    .attr("pointer-events", "none");

  // Get components to display based on current step
  let componentsToDisplay = [];

  // For the federal workers component, just show that one
  if (currentStepConfig.id === "federal_workers_component") {
    componentsToDisplay = [currentStepConfig];
  }
  // For unemployment, show federal + unemployment
  else if (currentStepConfig.id === "unemployment_component") {
    componentsToDisplay = [
      steps.find((s) => s.id === "federal_workers_component"),
      currentStepConfig,
    ];
  }
  // For income, show all three
  else if (currentStepConfig.id === "income_component") {
    componentsToDisplay = [
      steps.find((s) => s.id === "federal_workers_component"),
      steps.find((s) => s.id === "unemployment_component"),
      currentStepConfig,
    ];
  }
  // For vulnerability preview, show all three in full opacity
  else if (currentStepConfig.id === "vulnerability_preview") {
    componentsToDisplay = [
      steps.find((s) => s.id === "federal_workers_component"),
      steps.find((s) => s.id === "unemployment_component"),
      steps.find((s) => s.id === "income_component"),
    ];
  }

  // Create a layered visualization
  componentsToDisplay.forEach((component, index) => {
    // Create color scale for this component
    const colorScale = createColorScale(component);

    // Set opacity and blend mode based on component
    let opacity = 0.7; // Semi-transparent
    let blendMode = "multiply"; // Use multiply for blending colors

    // For vulnerability preview, increase opacity
    if (currentStepConfig.id === "vulnerability_preview") {
      opacity = 0.8;
    }

    // Adjust blend mode for different color combinations
    if (
      component.colorSet === "magenta" ||
      component.colorSet === "cyan" ||
      component.colorSet === "yellow"
    ) {
      blendMode = "multiply"; // Better for CMY color mixing
    }

    // Create a group for this layer
    const layerGroup = svgElement
      .select("g.map-group")
      .append("g")
      .attr("class", `layer-${component.id}`);

    // Draw this component layer
    layerGroup
      .selectAll("path.component")
      .data(features)
      .join("path")
      .attr("class", `component ${component.id}`)
      .attr("d", path)
      .attr("fill", (d) => getFillColor(d, component, colorScale))
      .attr("stroke", "none") // No stroke for better blending
      .style("mix-blend-mode", blendMode)
      .attr("opacity", opacity)
      .on("mouseover", function (event, d) {
        // Highlight on hover
        d3.select(this).attr("stroke", "#000").attr("stroke-width", 0.3); // Thinner stroke on hover
        handleLayeredHover(event, d, componentsToDisplay);
      })
      .on("mouseout", function (event) {
        // Remove highlight
        d3.select(this).attr("stroke", "none");
        handleLeave(event);
      });
  });

  // Add outlines for counties after all layers
  svgElement
    .selectAll("path.county-outline")
    .data(features)
    .join("path")
    .attr("class", "county-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.2) // Reduced from 0.5
    .attr("pointer-events", "none"); // Pass through events to layers below
}

// Render previous components with lower opacity
function renderPreviousComponents(
  svgElement,
  features,
  path,
  dimensions,
  currentStep
) {
  // Find previous component steps
  const steps = config.steps;
  const currentIndex = steps.indexOf(currentStep);
  const previousComponents = steps
    .slice(0, currentIndex)
    .filter((step) => step.isComponent);

  // Create a group for previous components
  const prevGroup = svgElement
    .append("g")
    .attr("class", "previous-components")
    .style("opacity", 0.5);

  // Render each previous component with reduced size
  previousComponents.forEach((component, i) => {
    // Calculate position for the smaller component map
    const mapWidth = dimensions.width * 0.3; // 30% of full width
    const mapHeight = dimensions.height * 0.3;
    const xPos = 20; // Left padding
    const yPos = dimensions.height - mapHeight - 20 - i * (mapHeight + 10); // Bottom up

    // Create a group for this component
    const componentGroup = prevGroup
      .append("g")
      .attr("class", `component-${component.id}`)
      .attr("transform", `translate(${xPos}, ${yPos})`);

    // Add background
    componentGroup
      .append("rect")
      .attr("width", mapWidth)
      .attr("height", mapHeight)
      .attr("fill", "#f9f9f9")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1)
      .attr("rx", 3)
      .attr("ry", 3);

    // Create a smaller projection for this component
    const smallProjection = d3
      .geoAlbersUsa()
      .scale(mapWidth * 1.3)
      .translate([mapWidth * 0.49, mapHeight * 0.5]);

    const smallPath = d3.geoPath().projection(smallProjection);

    // Create color scale for this component
    const colorScale = createColorScale(component);

    // Draw the component map
    componentGroup
      .selectAll("path.mini-county")
      .data(features)
      .join("path")
      .attr("class", "mini-county")
      .attr("d", smallPath)
      .attr("fill", (d) => getFillColor(d, component, colorScale))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.2);

    // Add component title
    componentGroup
      .append("text")
      .attr("x", mapWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text(`${component.title}`);
  });
}

// Render the combined component preview
function renderComponentPreview(svgElement, features, path, dimensions) {
  // Get all components
  const components = config.steps.filter((step) => step.isComponent);

  // Set up map for the combined view
  svgElement
    .select("g.map-group")
    .selectAll("path.county")
    .data(features)
    .join("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", (d) => calculateCombinedColor(d, components))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      // Custom hover for combined view
      handleCombinedHover(event, d, components);
    });
  // Remove highlight
  d3.select(this).attr("stroke", "none");

  // Add state boundaries
  svgElement
    .select("g.map-group")
    .selectAll("path.state-outline")
    .data(state.data.states)
    .join("path")
    .attr("class", "state-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#666")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.5)
    .attr("pointer-events", "none");
}

// Modified renderSpotlightView to work with a specific group
function renderSpotlightView(svgElement, features, path, stepConfig, mapGroup) {
  // If no specific group is provided, use the main map group
  if (!mapGroup) {
    mapGroup = svgElement.select("g.map-group");
  }

  // Create color scale for vulnerability index (base layer)
  const colorScale = createColorScale({
    dataField: "vulnerabilityIndex",
    colorSet: "vulnerability",
    breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
  });

  // Get the fields to use for this spotlight
  const spotlightField = stepConfig.spotlightField;
  const salientField = stepConfig.salientField;

  // Draw the base vulnerability map with reduced opacity for non-spotlight counties
  mapGroup
    .selectAll("path.county")
    .data(features)
    .join("path")
    .attr("class", (d) => {
      let classes = "county";
      if (d.properties[spotlightField]) classes += " spotlight";
      if (d.properties[salientField]) classes += " salient";
      return classes;
    })
    .attr("d", path)
    .attr("fill", (d) =>
      getFillColor(d, { dataField: "vulnerabilityIndex" }, colorScale)
    )
    .attr("stroke", (d) => (d.properties[salientField] ? "#000" : "#ffffff"))
    .attr("stroke-width", (d) => (d.properties[salientField] ? 1.5 : 0.2))
    .attr("opacity", (d) => {
      // Full opacity for spotlight counties, reduced for others
      if (d.properties[spotlightField]) return 1.0;
      return 0.3; // Dimmed for non-spotlight counties
    })
    .on("mouseover", function (event, d) {
      handleSpotlightHover(event, d, stepConfig);
    })
    .on("mouseout", function (event) {
      handleLeave(event);
    });

  // Add state boundaries for context
  mapGroup
    .selectAll("path.state-outline")
    .data(state.data.states)
    .join("path")
    .attr("class", "state-outline")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#666")
    .attr("stroke-width", 0.5)
    .attr("stroke-opacity", 0.5)
    .attr("pointer-events", "none");
}

// #endregion

// #region - UI components, legend

// Function to get the appropriate legend title based on the step
function getLegendTitle(stepConfig) {
  // Map of step IDs to custom legend titles
  const legendTitles = {
    state_federal_workers: "Federal workers per capita",
    federal_workers: "Federal workers per capita",
    vulnerability_index: "Vulnerability to cuts",
    rural_federal_dependent: "Vulnerability to cuts",
    native_american_reservation: "Vulnerability to cuts",
    economically_distressed: "Vulnerability to cuts",
  };

  // Return the custom title if it exists, otherwise use the step title
  return legendTitles[stepConfig.id] || stepConfig.title;
}

// Format large numbers for display
function formatLegendValue(value, stepConfig) {
  // For federal workers per capita
  if (stepConfig.id.includes("federal_workers")) {
    // Format as K
    if (value >= 1000) {
      return Math.round(value / 1000) + "K";
    }
    return value;
  }

  // For vulnerability index or other metrics
  return value;
}

// Updated createSimpleLegend function with top center positioning and better spacing
function createSimpleLegend(svgElement, dimensions, stepConfig) {
  // Define legend dimensions
  const legendWidth = 400; // Wider to accommodate the blocks
  const legendHeight = 10;

  // Position at top center with more space to prevent cut-off
  const legendX = (dimensions.width - legendWidth) / 2; // Center horizontally
  const legendY = 30; // Increased vertical position to prevent cut-off
  const titleOffset = 20; // Increased space between title and color blocks

  // Create legend container directly on the SVG, not in the map group
  const legend = svgElement
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  // Add legend title at the top center with more space
  legend
    .append("text")
    .attr("x", legendWidth / 2) // Center the title
    .attr("y", -titleOffset) // Position above the color blocks with more space
    .attr("class", "legend-title")
    .text(getLegendTitle(stepConfig));

  // Get colors from config
  const colorSet = stepConfig.colorSet || "blues";
  const colors = config.colors[colorSet] || config.colors.federal;

  // Get breaks from the step configuration
  const breaks = stepConfig.breaks || [1000, 2500, 5000, 7500, 10000];

  // Create color blocks (5 blocks)
  const numCategories = 5;
  const segmentWidth = legendWidth / numCategories;

  // Determine if this is a federal workers legend or vulnerability legend
  const isFederalWorkersLegend = stepConfig.id.includes("federal_workers");

  for (let i = 0; i < numCategories; i++) {
    const x = i * segmentWidth;

    // Draw the color block
    legend
      .append("rect")
      .attr("x", x)
      .attr("y", 0)
      .attr("width", segmentWidth)
      .attr("height", legendHeight)
      .attr("class", "legend-block")
      .style("fill", colors[i + 1]); // Skip the lightest color
  }

  // Add labels based on the legend type
  if (isFederalWorkersLegend) {
    // For federal workers, add numeric values at equal intervals
    // Add the "0" label at the start
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 15)
      .attr("class", "legend-value")
      .text("0");

    // Add middle breaks (2K, 3K, 4K)
    for (let i = 0; i < breaks.length - 1; i++) {
      legend
        .append("text")
        .attr("x", (i + 1) * segmentWidth)
        .attr("y", legendHeight + 15)
        .attr("class", "legend-value")
        .text(formatLegendValue(breaks[i], stepConfig));
    }

    // Add the end label with "+"
    legend
      .append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 15)
      .attr("class", "legend-value")
      .text(formatLegendValue(breaks[breaks.length - 1], stepConfig) + "+");
  } else {
    // For vulnerability, just add "Low" and "High" labels at the ends
    legend
      .append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 15)
      .attr("class", "legend-label")
      .text("Low");

    legend
      .append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 15)
      .attr("class", "legend-label")
      .text("High");
  }
}

// This function should be called once when you're setting up the SVG
function setDimensionsWithPadding(svg) {
  const width = window.innerWidth > 800 ? 800 : window.innerWidth - 40;
  const height = width * 0.625; // 8:5 aspect ratio

  // Add more top padding for legend
  const topPadding = 90; // Increased from 70 to 90 for more legend space

  if (svg) {
    svg.setAttribute("width", width);
    svg.setAttribute("height", height + topPadding);

    // Create a group for the map with a transform to move it down
    const mapGroup = d3.select(svg).select("g.map-group");
    if (mapGroup.empty()) {
      // If the group doesn't exist, create it
      d3.select(svg)
        .append("g")
        .attr("class", "map-group")
        .attr("transform", `translate(0, ${topPadding})`);
    } else {
      // If it already exists, just update the transform
      mapGroup.attr("transform", `translate(0, ${topPadding})`);
    }
  }

  return { width, height, topPadding };
}

// Add component weight indicator
function addComponentWeightIndicator(svgElement, dimensions, component) {
  // Create a weight indicator at the top right
  const weight = component.componentWeight * 100;
  const xPos = dimensions.width - 150;
  const yPos = 30;

  // Add background
  const weightIndicator = svgElement
    .append("g")
    .attr("class", "weight-indicator")
    .attr("transform", `translate(${xPos}, ${yPos})`);

  // Add background
  weightIndicator
    .append("rect")
    .attr("width", 140)
    .attr("height", 40)
    .attr("fill", "rgba(255, 255, 255, 0.8)")
    .attr("stroke", "#ccc")
    .attr("rx", 5)
    .attr("ry", 5);

  // Add title
  weightIndicator
    .append("text")
    .attr("x", 70)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text("Weight in Vulnerability Index");

  // Add weight percentage
  weightIndicator
    .append("text")
    .attr("x", 70)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(`${weight}%`);
}

// Calculate a combined color based on all components
function calculateCombinedColor(feature, components) {
  // Get normalized scores for each component
  let totalScore = 0;
  let totalWeight = 0;

  components.forEach((component) => {
    const value = feature.properties[component.dataField];
    if (value !== undefined && value !== null) {
      // Calculate normalized score (0-1)
      let normalizedScore;
      if (component.invertScale) {
        // For inverted scales (like income where lower is worse)
        const max = component.breaks[component.breaks.length - 1];
        normalizedScore = 1 - Math.min(1, value / max);
      } else {
        const max = component.breaks[component.breaks.length - 1];
        normalizedScore = Math.min(1, value / max);
      }

      // Add to weighted total
      totalScore += normalizedScore * component.componentWeight;
      totalWeight += component.componentWeight;
    }
  });

  // Safety check for edge cases
  if (totalWeight === 0) return "#cccccc";

  // Get final score (0-1)
  const finalScore = totalScore / totalWeight;

  // Return color from vulnerability color scale
  return d3.interpolateReds(finalScore);
}

// #endregion

// #region - Tooltip and interaction handlers

// Separate tooltip content generation for better code organization
function generateTooltipContent(feature, stepConfig) {
  // Generate tooltip content based on feature and step config
  // Implementation depends on your specific tooltip needs

  // Reuse existing tooltip content generation...
  const name = feature.properties.name;
  const stateName = feature.properties.stateName || "Unknown";
  const stateAbbr = getStateAbbreviation(stateName);
  const vulnerabilityIndex = feature.properties.vulnerabilityIndex;
  const fedWorkers = feature.properties.fed_workers_per_100k;
  const unemployment = feature.properties.unemployment_rate;
  const income = feature.properties.median_income;

  let tooltipContent = "";

  // Only use the special style for vulnerability-related maps
  if (
    stepConfig.id === "vulnerability_index" ||
    stepConfig.isSpotlightView ||
    stepConfig.showVulnerability
  ) {
    // Use the cleaned up modern style
    tooltipContent = `
      <div class="tooltip-modern">
        <h2>${name}, ${stateAbbr}</h2>
        
        <div class="tooltip-score">
          <h1>${
            vulnerabilityIndex ? vulnerabilityIndex.toFixed(1) : "N/A"
          }<span class="score-scale">/100</span></h1>
          <p>Vulnerability score</p>
          <div class="score-bar">
            <div class="score-indicator" style="left: ${
              vulnerabilityIndex ? vulnerabilityIndex : 0
            }%;"></div>
          </div>
        </div>
        
        <div class="tooltip-metrics">
          <div class="metric-row">
            <span class="metric-label">FEDERAL WORKERS</span>
            <span class="metric-value">${formatValue(
              fedWorkers,
              "fed_workers_per_100k"
            )}</span>
          </div>
          <div class="metric-sub">per capita</div>
          
          <div class="metric-row">
            <span class="metric-label">UNEMPLOYMENT</span>
            <span class="metric-value">${
              unemployment ? unemployment.toFixed(1) + "%" : "N/A"
            }</span>
          </div>
          
          <div class="metric-row" style="margin-bottom: 0;">
            <span class="metric-label">MEDIAN INCOME</span>
            <span class="metric-value">${
              income ? "$" + income.toLocaleString() : "N/A"
            }</span>
          </div>
        </div>
      </div>`;
  } else {
    // For non-vulnerability maps, use a simpler tooltip
    tooltipContent = `
      <div class="tooltip-simple">
        <div class="tooltip-header">
          <strong>${name}, ${stateAbbr}</strong>
        </div>
        <div class="tooltip-data">
          <div class="tooltip-row">
            <span class="tooltip-label">${stepConfig.title}:</span>
            <span class="tooltip-value">${formatValue(
              feature.properties[stepConfig.dataField],
              stepConfig.dataField
            )}</span>
          </div>
        </div>
      </div>`;
  }

  return tooltipContent;
}

// Modified hover handler to initialize tooltip on first use
function handleHover(event, feature, stepConfig) {
  // Initialize tooltip if this is first interaction
  initializeTooltipOnDemand();

  // Continue with normal hover handling
  d3.select(event.currentTarget)
    .attr("stroke-width", stepConfig.isStateLevel ? 2 : 1.5)
    .attr("stroke", "#000");

  // Get tooltip content
  const tooltipContent = generateTooltipContent(feature, stepConfig);

  // Show tooltip
  positionTooltip(event, tooltipContent);
}

// Helper function to format values based on field type with better rounding
function formatValue(value, fieldName) {
  if (value === null || value === undefined) return "N/A";

  if (fieldName === "median_income") {
    return "$" + value.toLocaleString();
  } else if (fieldName === "unemployment_rate") {
    return value.toFixed(1) + "%";
  } else if (
    fieldName === "fed_workers_per_100k" ||
    fieldName === "state_fed_workers_per_100k"
  ) {
    // Format with K notation for thousands
    if (value >= 1000) {
      return (Math.round(value / 100) / 10).toFixed(1) + "K";
    } else {
      return value.toLocaleString();
    }
  } else {
    return value.toLocaleString();
  }
}

// Helper function to convert state names to abbreviations
function getStateAbbreviation(stateName) {
  const stateAbbreviations = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
    "District of Columbia": "DC",
    Unknown: "??",
  };

  return stateAbbreviations[stateName] || stateName;
}

// Handle hover for layered view
function handleLayeredHover(event, feature, components) {
  // Build tooltip content
  let tooltipContent = `
    <div class="tooltip-header">
      <strong>${feature.properties.name}, ${
    feature.properties.stateName || ""
  }</strong>
    </div>
    <div class="tooltip-data">
      <div style="font-weight:bold;margin-bottom:5px;">Component Values:</div>
  `;

  // Add each component
  components.forEach((component) => {
    const fieldName = component.dataField;
    const value = feature.properties[fieldName];

    // Format the value based on the field
    let formattedValue = "N/A";
    if (value !== null && value !== undefined) {
      if (fieldName === "median_income") {
        formattedValue = `${value.toLocaleString()}`;
      } else if (fieldName === "unemployment_rate") {
        formattedValue = `${value.toFixed(1)}%`;
      } else if (fieldName === "fed_workers_per_100k") {
        formattedValue = value.toLocaleString() + " per 100k";
      } else {
        formattedValue = value.toLocaleString();
      }
    }

    // Get component color for the label
    const colorSet = component.colorSet || "blues";
    const colors = config.colors[colorSet] || config.colors.federal;
    const color = colors[colors.length - 2]; // Use a dark color from the set

    // Add component row
    tooltipContent += `
      <div class="tooltip-row">
        <span class="tooltip-label" style="color:${color};font-weight:bold;">${
      component.title.split(" (")[0]
    }:</span>
        <span class="tooltip-value">${formattedValue}</span>
      </div>
    `;
  });

  // Add vulnerability score if available
  if (feature.properties.vulnerabilityIndex) {
    tooltipContent += `
      <div class="tooltip-row" style="margin-top:8px;border-top:1px solid #eee;padding-top:4px;">
        <span class="tooltip-label">Vulnerability Score:</span>
        <span class="tooltip-value">${feature.properties.vulnerabilityIndex.toFixed(
          1
        )}</span>
      </div>
    `;
  }

  tooltipContent += `</div>`;

  // Show tooltip
  positionTooltip(event, tooltipContent);
}

// Handle hover for combined view
function handleCombinedHover(event, feature, components) {
  // Highlight the hovered feature
  d3.select(event.currentTarget)
    .attr("stroke-width", 1.5)
    .attr("stroke", "#000");

  // Calculate component scores
  const scores = components.map((component) => {
    const value = feature.properties[component.dataField];
    let score = "N/A";
    let normalizedScore = 0;

    if (value !== undefined && value !== null) {
      // Format the value appropriately
      if (component.dataField === "median_income") {
        score = `${value.toLocaleString()}`;
      } else if (component.dataField === "unemployment_rate") {
        score = `${value.toFixed(1)}%`;
      } else {
        score = value.toLocaleString();
      }

      // Calculate normalized score
      const max = component.breaks[component.breaks.length - 1];
      normalizedScore = component.invertScale
        ? 1 - Math.min(1, value / max)
        : Math.min(1, value / max);
    }

    // Calculate contribution to final score
    const contribution = normalizedScore * component.componentWeight;

    return {
      title: component.title.split(" (")[0], // Remove the weight part
      score,
      normalizedScore,
      weight: component.componentWeight,
      contribution,
    };
  });

  // Calculate total vulnerability score
  const totalScore = scores.reduce((sum, s) => sum + s.contribution, 0);
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

  // Create tooltip content
  let tooltipContent = `
    <div class="tooltip-header">
      <strong>${feature.properties.name}, ${
    feature.properties.stateName || ""
  }</strong>
    </div>
    <div class="tooltip-data">
      <div style="font-weight:bold;margin-bottom:5px;">Component Scores:</div>
  `;

  // Add each component
  scores.forEach((score) => {
    tooltipContent += `
      <div class="tooltip-row">
        <span class="tooltip-label">${score.title} (${(
      score.weight * 100
    ).toFixed(0)}%):</span>
        <span class="tooltip-value">${score.score}</span>
      </div>
    `;
  });

  // Add final vulnerability score
  tooltipContent += `
      <div class="tooltip-row" style="margin-top:10px;font-weight:bold;border-top:1px solid #eee;padding-top:5px;">
        <span class="tooltip-label">Vulnerability Score:</span>
        <span class="tooltip-value">${finalScore.toFixed(1)}</span>
      </div>
    </div>
  `;

  // Show tooltip
  positionTooltip(event, tooltipContent);
}

// Handle hover events for spotlight views
function handleSpotlightHover(event, feature, stepConfig) {
  // Highlight the hovered feature
  d3.select(event.currentTarget).attr("stroke-width", 2).attr("stroke", "#000");

  // Get basic data
  const name = feature.properties.name;
  const stateName = feature.properties.stateName || "Unknown";
  const stateAbbr = getStateAbbreviation(stateName);
  const vulnerabilityScore = feature.properties.vulnerabilityIndex;
  const fedWorkers = feature.properties.fed_workers_per_100k;
  const unemployment = feature.properties.unemployment_rate;
  const income = feature.properties.median_income;
  const facilityCount = feature.properties.facility_count || 0;

  // Use the updated modern tooltip style matching the image
  let tooltipContent = `
  <div class="tooltip-modern">
    <h2>${name}, ${stateAbbr}</h2>
    
    <div class="tooltip-score">
      <h1>${
        vulnerabilityScore ? vulnerabilityScore.toFixed(1) : "N/A"
      }<span class="score-scale">/100</span></h1>
      <p>Vulnerability score</p>
      <div class="score-bar">
        <div class="score-indicator" style="left: ${
          vulnerabilityScore ? vulnerabilityScore : 0
        }%;"></div>
      </div>
    </div>
    
    <div class="tooltip-metrics">
      <div class="metric-row">
        <span class="metric-label">Federal workers</span>
        <span class="metric-value">${formatValue(
          fedWorkers,
          "fed_workers_per_100k"
        )}</span>
      </div>
      <div class="metric-sub">per capita</div>
      
      <!-- REMOVE THESE TWO BLOCKS FOR RESERVATION COUNTIES -->
      <!-- Don't include reservation score and native american percentage -->
      
      <div class="metric-row">
        <span class="metric-label">Unemployment</span>
        <span class="metric-value">${
          unemployment ? unemployment.toFixed(1) + "%" : "N/A"
        }</span>
      </div>
      
      <div class="metric-row">
        <span class="metric-label">Median Income</span>
        <span class="metric-value">${
          income ? "$" + income.toLocaleString() : "N/A"
        }</span>
      </div>
    </div>`;

  // Add facilities section if data is available
  if (facilityCount > 0) {
    tooltipContent += `
    <div class="tooltip-facilities">
      <h3>${facilityCount} federal facilities</h3>`;

    // Add additional facility details if available
    if (feature.properties.top_federal_agencies) {
      tooltipContent += `
      <div class="facility-row">
        <span class="facility-label">TOP AGENCIES</span>
        <p class="facility-value">${
          feature.properties.top_federal_agencies || "Data not available"
        }</p>
      </div>`;
    }

    if (feature.properties.federal_facility_types) {
      tooltipContent += `
      <div class="facility-row">
        <span class="facility-label">KEY FACILITIES</span>
        <p class="facility-value">${
          feature.properties.federal_facility_types || "Data not available"
        }</p>
      </div>`;
    }

    tooltipContent += `</div>`;
  }

  // Close the tooltip
  tooltipContent += `</div>`;

  // Show tooltip
  positionTooltip(event, tooltipContent);
}

// Helper function to truncate long text
function truncateText(text, maxLength) {
  if (!text) return "Data not available";
  return text.length > maxLength
    ? text.substring(0, maxLength - 3) + "..."
    : text;
}

// Handle leave events
function handleLeave(event) {
  // Return to normal styling
  if (event && event.currentTarget) {
    d3.select(event.currentTarget)
      .attr("stroke-width", 0.5)
      .attr("stroke", "#fff");
  }

  // Hide tooltip
  elements.tooltip.style.display = "none";
}

// #endregion

// #region - Scrollytelling functionality

// Lazy-load scrollytelling sections only when needed
function initializeScrollytelling() {
  console.log("Initializing scrollytelling...");

  // Only create sections container if it doesn't exist
  if (!elements.sectionsContainer) {
    let sectionsContainer = document.querySelector(".sections");

    if (!sectionsContainer) {
      sectionsContainer = document.createElement("div");
      sectionsContainer.className = "sections";

      // Insert after the sticky container
      elements.stickyContainer.parentNode.insertBefore(
        sectionsContainer,
        elements.stickyContainer.nextSibling
      );
    }

    // Store reference to sections container
    elements.sectionsContainer = sectionsContainer;
  }

  // Always create ALL scroll sections
  lazyCreateScrollSections();

  // Create progress indicator if it doesn't exist already
  if (!document.querySelector(".progress-indicator")) {
    createProgressIndicator();
  }

  // Set up scroll event listener with better performance options
  window.addEventListener("scroll", debounce(handleScroll, 100), {
    passive: true,
  });

  // Use IntersectionObserver if available (much better performance)
  if ("IntersectionObserver" in window) {
    setupIntersectionObserver();
  }

  // Log the current sections for debugging
  console.log(
    "Created " +
      document.querySelectorAll(".scroll-section").length +
      " sections"
  );
  console.log("Total steps in config: " + config.steps.length);

  // Set initial state based on current scroll position
  setTimeout(() => {
    handleScroll();
  }, 200);
}

function ensureSpotlightSectionsVisibility() {
  // Get all sections
  const sections = document.querySelectorAll(".scroll-section");

  // Loop through each section
  sections.forEach((section) => {
    const stepIndex = parseInt(section.dataset.step, 10);
    const stepConfig = config.steps[stepIndex];

    // If this is a spotlight section, ensure it has proper styling
    if (stepConfig && stepConfig.isSpotlightView) {
      // Make sure spotlight sections have clear visibility
      section.style.minHeight = "100vh";
      section.style.position = "relative";
      section.style.zIndex = "2";

      // Add a special class for spotlight sections
      section.classList.add("spotlight-section");

      console.log(`Enhanced spotlight section: ${stepConfig.title}`);
    }
  });
}

// Lazy-create scroll sections - only create the ones near the viewport initially
// Improved lazyCreateScrollSections function to ensure all sections are created
function lazyCreateScrollSections() {
  const sectionsContainer = elements.sectionsContainer;

  // Clear any existing sections first
  while (sectionsContainer.firstChild) {
    sectionsContainer.removeChild(sectionsContainer.firstChild);
  }

  console.log(
    "Creating scroll sections for all steps including spotlight views"
  );

  // Create all sections at once - safer approach to ensure scroll works
  for (let i = 0; i < config.steps.length; i++) {
    // Always create full section for ALL steps
    createScrollSection(i, sectionsContainer);
  }

  // Add spacer at the bottom
  const spacer = document.createElement("div");
  spacer.className = "section-spacer";
  spacer.style.height = "50vh";
  sectionsContainer.appendChild(spacer);

  // Make sure all spotlight sections have proper height and visibility
  ensureSpotlightSectionsVisibility();
}

// Create a single scroll section
function createScrollSection(index, container) {
  const step = config.steps[index];

  const section = document.createElement("div");
  section.className = "scroll-section";
  section.id = `section-${index}`;
  section.dataset.step = index;
  section.dataset.loaded = "true";

  // Add content to the section
  const content = document.createElement("div");
  content.className = "section-content";

  // Add title
  const title = document.createElement("h3");
  title.textContent = step.title;
  content.appendChild(title);

  // Add description
  if (step.description) {
    const description = document.createElement("p");
    description.textContent = step.description;
    content.appendChild(description);
  }

  // Add any additional info from the step configuration
  if (step.additionalInfo) {
    const additionalInfo = document.createElement("div");
    additionalInfo.className = "additional-info";
    additionalInfo.innerHTML = step.additionalInfo;
    content.appendChild(additionalInfo);
  }

  section.appendChild(content);
  container.appendChild(section);
}

// Create a placeholder for a scroll section (for lazy loading)
function createScrollSectionPlaceholder(index, container) {
  const section = document.createElement("div");
  section.className = "scroll-section placeholder";
  section.id = `section-${index}`;
  section.dataset.step = index;
  section.dataset.loaded = "false";

  // Set the height to match a regular section to maintain scroll position
  section.style.height = "100vh";

  container.appendChild(section);
}

// Create progress indicator for navigation
function createProgressIndicator() {
  // Create container for progress indicator
  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-indicator";

  // Create progress bar
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressContainer.appendChild(progressBar);

  // Create step indicators
  const stepsContainer = document.createElement("div");
  stepsContainer.className = "step-indicators";

  config.steps.forEach((step, index) => {
    const stepIndicator = document.createElement("div");
    stepIndicator.className = "step-indicator";
    stepIndicator.dataset.step = index;

    // Add tooltip with step title
    const tooltip = document.createElement("span");
    tooltip.className = "step-tooltip";
    tooltip.textContent = step.title;
    stepIndicator.appendChild(tooltip);

    // Add click event to navigate to step
    stepIndicator.addEventListener("click", () => {
      navigateToSection(index);
    });

    stepsContainer.appendChild(stepIndicator);
  });

  progressContainer.appendChild(stepsContainer);
  document.body.appendChild(progressContainer);

  // Store references
  elements.progressContainer = progressContainer;
  elements.progressBar = progressBar;
  elements.stepIndicators = stepsContainer.querySelectorAll(".step-indicator");
}

// Set up observer to lazy-load sections as they approach viewport
function setupLazyLoadObserver() {
  // Create observer for placeholders
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // If placeholder is approaching viewport, replace with real content
        if (entry.isIntersecting && entry.target.dataset.loaded === "false") {
          const index = parseInt(entry.target.dataset.step, 10);
          const container = entry.target.parentNode;

          // Remove placeholder
          container.removeChild(entry.target);

          // Create actual section
          createScrollSection(index, container);

          // Insert at correct position
          const sections = container.querySelectorAll(".scroll-section");
          const sectionsArray = Array.from(sections);

          // Sort by index
          sectionsArray.sort((a, b) => {
            return parseInt(a.dataset.step, 10) - parseInt(b.dataset.step, 10);
          });

          // Reorder in DOM
          sectionsArray.forEach((section) => {
            container.appendChild(section);
          });
        }
      });
    },
    {
      rootMargin: "300px 0px", // Start loading when section is 300px from viewport
      threshold: 0,
    }
  );

  // Observe all placeholders
  document
    .querySelectorAll(".scroll-section.placeholder")
    .forEach((placeholder) => {
      observer.observe(placeholder);
    });
}

// Optimize section visibility detection with IntersectionObserver
function setupIntersectionObserver() {
  // First check if we already have sections to observe
  const sections = document.querySelectorAll(".scroll-section");
  if (sections.length === 0) {
    console.warn("No sections found to observe");
    return;
  }

  // Clean up existing observer if it exists
  if (elements.intersectionObserver) {
    elements.intersectionObserver.disconnect();
  }

  // Options for intersection observer - better threshold settings for spotlight sections
  const options = {
    root: null, // Use viewport as root
    rootMargin: "-15% 0px -15% 0px", // More centered detection
    threshold: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4], // More granular thresholds
  };

  console.log(
    "Setting up IntersectionObserver for " + sections.length + " sections"
  );

  // Create a new observer with better spotlight view detection
  const observer = new IntersectionObserver((entries) => {
    // Find the most visible section using intersection ratio as measure
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);

    if (visibleEntries.length > 0) {
      // Sort by visibility for more reliable detection
      const mostVisible = visibleEntries.sort(
        (a, b) => b.intersectionRatio - a.intersectionRatio
      )[0];

      // Update active class for sections
      sections.forEach((section) => {
        if (section === mostVisible.target) {
          section.classList.add("active");
        } else {
          section.classList.remove("active");
        }
      });

      // Update current step if changed
      const sectionIndex = parseInt(mostVisible.target.dataset.step, 10);
      if (sectionIndex !== state.currentStep) {
        // Log the step change
        console.log(
          `Changing from step ${state.currentStep} to ${sectionIndex}`
        );

        // Update state
        state.currentStep = sectionIndex;

        // Render only if we have data
        if (state.mapInitialized) {
          renderCurrentStep();
        }

        // Update progress indicator
        updateProgressIndicator(sectionIndex, config.steps.length);
      }
    }
  }, options);

  // Start observing all sections
  sections.forEach((section) => {
    observer.observe(section);
  });

  // Store observer for cleanup
  elements.intersectionObserver = observer;
}

// Handle scroll events (fallback for browsers without IntersectionObserver)
function handleScroll() {
  // Skip if we're using IntersectionObserver
  if (elements.intersectionObserver && "IntersectionObserver" in window) return;

  // Get all sections
  const sections = document.querySelectorAll(".scroll-section");
  if (sections.length === 0) {
    console.warn("No sections found for scroll handling");
    return;
  }

  // Find section closest to the middle of the viewport
  let currentSectionIndex = 0;
  let maxVisibility = 0;

  const viewportHeight = window.innerHeight;
  const viewportCenter = window.scrollY + viewportHeight / 2;

  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top + window.scrollY;
    const sectionBottom = sectionTop + rect.height;

    // Enhanced visibility calculation for spotlight sections
    let visibility;
    if (section.classList.contains("spotlight-section")) {
      // For spotlight sections, more weight to even partial visibility
      visibility = Math.min(
        1,
        (Math.min(viewportCenter + viewportHeight / 2, sectionBottom) -
          Math.max(viewportCenter - viewportHeight / 2, sectionTop)) /
          (viewportHeight * 0.7) // Lower threshold for spotlight sections
      );
    } else {
      // For regular sections, standard visibility
      const visibilityTop =
        Math.min(sectionBottom, viewportCenter) -
        Math.max(sectionTop, viewportCenter - viewportHeight / 2);
      const visibilityBottom =
        Math.min(sectionBottom, viewportCenter + viewportHeight / 2) -
        Math.max(sectionTop, viewportCenter);
      visibility = Math.max(
        0,
        (visibilityTop + visibilityBottom) / rect.height
      );
    }

    // Update active class based on visibility
    if (visibility > 0.25) {
      // Lower threshold for "active"
      section.classList.add("active");
    } else {
      section.classList.remove("active");
    }

    if (visibility > maxVisibility) {
      maxVisibility = visibility;
      currentSectionIndex = index;
    }
  });

  // Only update if the step has changed or isn't set
  if (currentSectionIndex !== state.currentStep) {
    console.log(`Scroll: transitioning to step ${currentSectionIndex}`);

    // Update state
    state.currentStep = currentSectionIndex;

    // Update map
    renderCurrentStep();

    // Update progress indicator
    updateProgressIndicator(currentSectionIndex, config.steps.length);
  }
}

// Defer tooltip creation until first interaction
let tooltipInitialized = false;

function initializeTooltipOnDemand() {
  if (!tooltipInitialized) {
    elements.tooltip = createTooltip();
    setupTooltipDismissHandlers();
    tooltipInitialized = true;
  }
}

/**
 * Update progress indicator
 * @param {number} currentStep - Index of current step
 * @param {number} totalSteps - Total number of steps
 */
function updateProgressIndicator(currentStep, totalSteps) {
  if (!elements.progressBar || !elements.stepIndicators) return;

  // Update progress bar
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  elements.progressBar.style.width = `${progressPercentage}%`;

  // Update step indicators
  elements.stepIndicators.forEach((indicator, index) => {
    indicator.classList.remove("active", "completed");

    if (index === currentStep) {
      indicator.classList.add("active");
    } else if (index < currentStep) {
      indicator.classList.add("completed");
    }
  });
}

/**
 * Navigate to a specific section
 * @param {number} sectionIndex - Index of the section to navigate to
 */
function navigateToSection(sectionIndex) {
  const section = document.querySelector(`#section-${sectionIndex}`);
  if (!section) {
    console.warn(`Section with index ${sectionIndex} not found`);
    return;
  }

  // Get the scroll position
  const rect = section.getBoundingClientRect();
  const scrollPosition = window.scrollY + rect.top - 100; // Offset for header

  // Remove active class from all sections
  document.querySelectorAll(".scroll-section").forEach((s) => {
    s.classList.remove("active");
  });

  // Add active class to target section (for immediate visual feedback)
  section.classList.add("active");

  // Scroll to section
  window.scrollTo({
    top: scrollPosition,
    behavior: "smooth",
  });

  // Update state immediately for better UX
  state.currentStep = sectionIndex;
  renderCurrentStep();
  updateProgressIndicator(sectionIndex, config.steps.length);
}

/**
 * Check if the page loaded with a hash tag and navigate there
 */
function checkInitialHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#section-")) {
    const stepIndex = parseInt(hash.replace("#section-", ""), 10);
    if (
      !isNaN(stepIndex) &&
      stepIndex >= 0 &&
      stepIndex < config.steps.length
    ) {
      // Wait for everything to be set up
      setTimeout(() => {
        navigateToSection(stepIndex);
      }, 500);
    }
  }
}

// #endregion
