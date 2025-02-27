// data-manager.js - Functions for loading and processing data

const dataManager = {
  // Primary data structures
  rawData: {
    counties: null, // Raw GeoJSON features
    states: null, // Raw state GeoJSON features
    vulnerability: null, // Raw vulnerability data from CSV
  },

  // Processed map data ready for visualization
  mapData: null,

  // Data statistics for each metric
  statistics: {
    federal_workers: null,
    vulnerability: null,
  },

  // Load all necessary data
  loadAllData: async function () {
    try {
      console.log("Starting to fetch map data...");

      // Load data in parallel for efficiency
      const [counties, states, vulnerabilityData] = await Promise.all([
        this.fetchCountiesData(),
        this.fetchStatesData(),
        this.fetchVulnerabilityData(),
      ]);

      // Store raw data
      this.rawData.counties = counties;
      this.rawData.states = states;
      this.rawData.vulnerability = vulnerabilityData;

      // Process and merge data
      this.processData();

      return this.mapData;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  },

  // Fetch county boundaries from GeoJSON
  fetchCountiesData: async function () {
    console.log("Fetching US counties data...");
    const response = await fetch(config.urls.countiesGeoJSON);
    const usCounties = await response.json();

    // Extract features from topojson
    const counties = topojson.feature(
      usCounties,
      usCounties.objects.counties
    ).features;

    console.log(`Extracted ${counties.length} county features`);
    return counties;
  },

  // Fetch state boundaries
  fetchStatesData: async function () {
    console.log("Fetching US states data...");
    const response = await fetch(config.urls.statesGeoJSON);
    const usStates = await response.json();

    // Extract features from topojson
    const states = topojson.feature(usStates, usStates.objects.states).features;

    console.log(`Extracted ${states.length} state features`);
    return states;
  },

  // Fetch vulnerability data from CSV
  fetchVulnerabilityData: async function () {
    console.log("Fetching vulnerability data...");
    const response = await fetch(config.urls.dataSheet);
    const csvText = await response.text();

    // Parse CSV
    const parsedData = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    }).data;

    console.log(`Parsed ${parsedData.length} vulnerability data records`);
    return parsedData;
  },

  // Process and merge data
  processData: function () {
    console.log("Processing and merging data...");

    // Create lookup for vulnerability data
    const vulnerabilityByCounty = this.createVulnerabilityLookup();

    // Merge county GeoJSON with vulnerability data
    this.mapData = this.rawData.counties.map((county) => {
      // Get state name from FIPS code
      const countyFips = county.id;
      const stateFipsCode = utils.fips.getStateFips(countyFips);
      const stateName = utils.fips.getStateName(stateFipsCode);
      const countyName = county.properties.name;

      // In your data processing
      const vulnerabilityInfo = this.findCountyData(
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

    console.log(`Processed ${this.mapData.length} counties`);

    // Extract and calculate statistics
    this.calculateDataStatistics();

    // At the end of the processData function in data-manager.js, add:
    // This will print detailed information about counties with N/A vs zero values
    const debugAnalysis = {
      zeroValueCounties: this.mapData
        .filter((c) => c.properties.fed_workers_per_100k === 0)
        .map((c) => `${c.properties.name}, ${c.properties.stateName}`)
        .slice(0, 5),
      nullValueCounties: this.mapData
        .filter((c) => c.properties.fed_workers_per_100k === null)
        .map((c) => `${c.properties.name}, ${c.properties.stateName}`)
        .slice(0, 5),
      undefinedValueCounties: this.mapData
        .filter((c) => c.properties.fed_workers_per_100k === undefined)
        .map((c) => `${c.properties.name}, ${c.properties.stateName}`)
        .slice(0, 5),
    };

    console.log("Debug Analysis:", debugAnalysis);
  },

  // Create lookup for vulnerability data by county name
  createVulnerabilityLookup: function () {
    const vulnerabilityByCounty = {};

    this.rawData.vulnerability.forEach((row) => {
      if (!row.NAME) return;

      // Process data fields
      const countyData = {
        // Core vulnerability metrics
        fedDependency: row.fed_dependency || 0,
        vulnerabilityIndex: row.vulnerability_index || 0,
        category: row.vulnerability_category || "Unknown",

        // Additional data for tooltips
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
  },

  // Find vulnerability data for a county using multiple name formats
  // Revised findCountyData function with special cases for accent marks and name differences
  findCountyData: function (countyName, stateName, vulnerabilityByCounty) {
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
    const normalizedName = this.normalizeString(countyName);

    const fuzzyMatches = Object.keys(vulnerabilityByCounty).filter((key) => {
      if (key.includes(stateName)) {
        const keyParts = key.split(", ");
        if (keyParts.length === 2) {
          const normalizedKey = this.normalizeString(keyParts[0]);
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
  },

  // Helper function to normalize strings for fuzzy matching
  normalizeString: function (str) {
    if (!str) return "";
    // Remove diacritical marks, convert to lowercase, and remove spaces
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "");
  },

  // Helper function to normalize strings for fuzzy matching
  normalizeString: function (str) {
    // Remove diacritical marks
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "");
  },

  // Calculate statistics for the datasets
  calculateDataStatistics: function () {
    // Extract values
    const fedWorkersValues = this.mapData
      .map((d) => d.properties.fed_workers_per_100k)
      .filter((v) => v !== undefined && v !== null && !isNaN(v) && v > 0);

    const vulnerabilityValues = this.mapData
      .map((d) => d.properties.vulnerabilityIndex)
      .filter((v) => v !== undefined && v !== null && !isNaN(v) && v >= 0);

    // Calculate basic statistics
    this.statistics.federal_workers = {
      // Basic statistics
      ...utils.calculateStatistics(fedWorkersValues),

      // Data classification
      breaks: utils.calculateQuantileBreaks(
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
    };

    this.statistics.vulnerability = {
      // Basic statistics
      ...utils.calculateStatistics(vulnerabilityValues),

      // Data classification
      breaks: utils.calculateQuantileBreaks(
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
    };

    console.log("Calculated statistics for datasets");
  },

  // Get statistics for the current step
  getStatisticsForStep: function (stepIndex) {
    const step = config.steps[stepIndex];
    // Return appropriate statistics based on step ID
    if (step.id === "federal_workers") {
      return this.statistics.federal_workers;
    } else if (step.id === "vulnerability_category") {
      // For categorical data, we could return dummy statistics or the regular vulnerability ones
      // This depends on how your code uses these statistics
      return {
        min: 0,
        max: 100,
        mean: 50,
        median: 50,
        count: 0,
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
    } else {
      return this.statistics.vulnerability;
    }
  },
};
