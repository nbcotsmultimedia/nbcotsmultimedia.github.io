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
      ]).catch((error) => {
        throw new Error(`Failed to load data in parallel: ${error.message}`);
      });

      // Store raw data
      this.rawData.counties = counties;
      this.rawData.states = states;
      this.rawData.vulnerability = vulnerabilityData;

      // Process and merge data
      this.processData();

      return this.mapData;
    } catch (error) {
      console.error("Error loading data:", error);
      throw new Error(`Failed to load map data: ${error.message}`);
    }
  },

  // Fetch county boundaries from GeoJSON
  fetchCountiesData: async function () {
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
  },

  // Fetch state boundaries
  fetchStatesData: async function () {
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
      const states = topojson.feature(
        usStates,
        usStates.objects.states
      ).features;

      console.log(`Extracted ${states.length} state features`);
      return states;
    } catch (error) {
      console.error(`Failed to fetch states data: ${error.message}`);
      throw error; // Re-throw to be handled by the caller
    }
  },

  // Fetch vulnerability data from CSV
  fetchVulnerabilityData: async function () {
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
      if (
        !parsedData ||
        !Array.isArray(parsedData) ||
        parsedData.length === 0
      ) {
        throw new Error("Failed to parse vulnerability data from CSV");
      }

      console.log(`Parsed ${parsedData.length} vulnerability data records`);
      return parsedData;
    } catch (error) {
      console.error(`Failed to fetch vulnerability data: ${error.message}`);
      throw error; // Re-throw to be handled by the caller
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

  // Calculate state-level aggregation of federal worker data
  calculateStateAggregates: function () {
    console.log("Calculating state-level aggregates...");

    // Group counties by state
    const stateGroups = {};
    this.mapData.forEach((county) => {
      const props = county.properties;
      const stateName = props.stateName;

      if (!stateGroups[stateName]) {
        stateGroups[stateName] = [];
      }

      stateGroups[stateName].push(props);
    });

    // Special case for DC (since it's a single "county")
    const dcCounty = this.mapData.find(
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
    this.stateData = this.rawData.states.map((state) => {
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
    const stateValues = this.stateData
      .map((d) => d.properties.state_fed_workers_per_100k)
      .filter((v) => v !== undefined && v !== null && !isNaN(v) && v > 0);

    this.statistics.state_federal_workers = {
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

    console.log(
      "State federal workers statistics:",
      this.statistics.state_federal_workers
    );

    return this.stateData;
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

    // Calculate vulnerability index with preliminary categories
    this.calculateVulnerabilityIndex(this.mapData);

    // Extract and calculate statistics (including Jenks breaks)
    this.calculateDataStatistics();

    // Update categories based on calculated breaks
    this.updateVulnerabilityCategories(this.mapData);

    // After calculating county-level data, calculate state aggregates
    this.calculateStateAggregates();

    console.log(
      `Processed ${this.mapData.length} counties and ${this.stateData.length} states`
    );

    // Add this to the end of the processData function in data-manager.js

    // Identify vulnerable counties
    this.vulnerableCountyIds = this.identifyVulnerableCounties();

    // Find narrative examples
    this.narrativeExamples = this.findNarrativeExamples();

    // Update the config with actual county IDs for narrative examples
    if (this.narrativeExamples.remoteVulnerable.length > 0) {
      const stepIndex = config.steps.findIndex(
        (s) => s.id === "narrative_example_1"
      );
      if (stepIndex >= 0) {
        config.steps[stepIndex].highlightCounties =
          this.narrativeExamples.remoteVulnerable;
      }
    }

    console.log("Vulnerability analysis complete:", {
      vulnerableCounties: this.vulnerableCountyIds.length,
      remoteExamples: this.narrativeExamples.remoteVulnerable,
      resilientExamples: this.narrativeExamples.resilient,
      disproportionateExamples: this.narrativeExamples.disproportionate,
    });
  },

  // Create lookup for vulnerability data by county name
  createVulnerabilityLookup: function () {
    const vulnerabilityByCounty = {};

    this.rawData.vulnerability.forEach((row) => {
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
  },

  // Find vulnerability data for a county using multiple name formats
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

  // calculateVulnerabilityIndex function
  // Calculate vulnerability index for counties
  calculateVulnerabilityIndex: function (counties) {
    // Check if counties array exists and has elements
    if (!counties || counties.length === 0) {
      console.error("No counties data available");
      return counties;
    }

    // Define safe property accessor with multiple fallback properties
    const getPropertySafe = (county, propNames, alternateNames = []) => {
      // Try the primary property names
      for (const name of propNames) {
        const value = county.properties[name];
        if (value !== undefined && value !== null) {
          const numValue =
            typeof value === "string" ? parseFloat(value) : value;
          if (!isNaN(numValue)) return numValue;
        }
      }

      // If not found, try alternate property names
      for (const name of alternateNames) {
        const value = county.properties[name];
        if (value !== undefined && value !== null) {
          const numValue =
            typeof value === "string" ? parseFloat(value) : value;
          if (!isNaN(numValue)) return numValue;
        }
      }

      return null;
    };

    // Filter counties with valid data for all factors
    const validCounties = counties.filter((county) => {
      // Try multiple property name variations for each metric
      const pctFederal = getPropertySafe(
        county,
        ["pct_federal"],
        ["fedDependency", "fed_dependency", "federal_pct", "fedWorkersPct"]
      );

      const unemploymentRate = getPropertySafe(
        county,
        ["unemployment_rate"],
        ["unemploymentRate", "unemp_rate", "unemployment"]
      );

      const medianIncome = getPropertySafe(
        county,
        ["median_income"],
        ["medianIncome", "median_household_income", "income"]
      );

      return (
        pctFederal !== null &&
        unemploymentRate !== null &&
        medianIncome !== null
      );
    });

    console.log(
      `Found ${validCounties.length} counties with valid data for vulnerability calculation`
    );

    if (validCounties.length === 0) {
      console.error(
        "No counties with valid data for vulnerability calculation!"
      );
      return counties;
    }

    // Calculate min/max values for normalization
    const minMax = {
      pct_federal: {
        min: Math.min(
          ...validCounties.map((c) =>
            getPropertySafe(
              c,
              ["pct_federal"],
              ["fedDependency", "fed_dependency"]
            )
          )
        ),
        max: Math.max(
          ...validCounties.map((c) =>
            getPropertySafe(
              c,
              ["pct_federal"],
              ["fedDependency", "fed_dependency"]
            )
          )
        ),
      },
      unemployment_rate: {
        min: Math.min(
          ...validCounties.map((c) =>
            getPropertySafe(c, ["unemployment_rate"], ["unemploymentRate"])
          )
        ),
        max: Math.max(
          ...validCounties.map((c) =>
            getPropertySafe(c, ["unemployment_rate"], ["unemploymentRate"])
          )
        ),
      },
      median_income: {
        min: Math.min(
          ...validCounties.map((c) =>
            getPropertySafe(c, ["median_income"], ["medianIncome"])
          )
        ),
        max: Math.max(
          ...validCounties.map((c) =>
            getPropertySafe(c, ["median_income"], ["medianIncome"])
          )
        ),
      },
    };

    // Normalize values to 0-1 scale (utility functions)
    const normalize = (value, min, max) => {
      if (max === min) return 0.5;
      return (value - min) / (max - min);
    };

    const inverseNormalize = (value, min, max) => {
      return 1 - normalize(value, min, max);
    };

    // Apply the vulnerability calculation to each county
    let calculatedCount = 0;

    counties.forEach((county) => {
      const props = county.properties;

      // Get values using safe access with fallbacks
      const pctFederal = getPropertySafe(
        county,
        ["pct_federal"],
        ["fedDependency", "fed_dependency", "federal_pct"]
      );

      const unemploymentRate = getPropertySafe(
        county,
        ["unemployment_rate"],
        ["unemploymentRate", "unemp_rate"]
      );

      const medianIncome = getPropertySafe(
        county,
        ["median_income"],
        ["medianIncome", "income"]
      );

      // Skip counties with invalid data
      if (
        pctFederal === null ||
        unemploymentRate === null ||
        medianIncome === null
      ) {
        props.vulnerabilityIndex = null;
        props.category = "No Data";
        return;
      }

      // Component 1: Federal dependency (higher % = higher vulnerability)
      const fedDependencyScore = normalize(
        pctFederal,
        minMax.pct_federal.min,
        minMax.pct_federal.max
      );

      // Component 2: Unemployment vulnerability (higher unemployment = higher vulnerability)
      const unemploymentScore = normalize(
        unemploymentRate,
        minMax.unemployment_rate.min,
        minMax.unemployment_rate.max
      );

      // Component 3: Income vulnerability (lower income = higher vulnerability)
      const incomeScore = inverseNormalize(
        medianIncome,
        minMax.median_income.min,
        minMax.median_income.max
      );

      // Calculate weighted vulnerability score (0-100 scale)
      props.vulnerabilityIndex = Number(
        (
          (0.5 * fedDependencyScore +
            0.3 * unemploymentScore +
            0.2 * incomeScore) *
          100
        ).toFixed(2)
      );

      // Store component scores for tooltips
      props.fed_dependency = Number((fedDependencyScore * 100).toFixed(2));
      props.unemployment_vulnerability = Number(
        (unemploymentScore * 100).toFixed(2)
      );
      props.income_vulnerability = Number((incomeScore * 100).toFixed(2));

      // Assign vulnerability category
      props.category = this.assignVulnerabilityCategory(
        props.vulnerabilityIndex
      );
      calculatedCount++;
    });

    console.log(
      `Vulnerability index calculated for ${calculatedCount} counties`
    );
    return counties;
  },

  // Update the category assignment to match our new breaks
  assignVulnerabilityCategory: function (index) {
    if (index === null || index === undefined) return "No Data";

    if (index < 17.8) return "Very Low";
    if (index < 20.0) return "Low";
    if (index < 26.2) return "Moderate";
    if (index < 30.1) return "High";
    return "Very High";
  },

  // Add this to dataManager in data-manager.js

  // Identify counties that are vulnerable to federal job cuts
  identifyVulnerableCounties: function () {
    if (!this.mapData) return [];

    console.log("Identifying vulnerable counties...");

    // Use the threshold values from config
    const fedThreshold = config.vulnerability.highFederalThreshold || 5000;
    const vulnThreshold = config.vulnerability.highVulnerabilityThreshold || 40;

    // Filter counties that meet both criteria
    const vulnerableCounties = this.mapData.filter((county) => {
      const fedWorkers = county.properties.fed_workers_per_100k || 0;
      const vulnerabilityScore = county.properties.vulnerabilityIndex || 0;

      return fedWorkers >= fedThreshold && vulnerabilityScore >= vulnThreshold;
    });

    console.log(`Found ${vulnerableCounties.length} vulnerable counties`);

    // Add a flag to these counties' properties
    vulnerableCounties.forEach((county) => {
      county.properties.isVulnerable = true;
    });

    // Return county ids for easy lookup
    return vulnerableCounties.map((county) => county.id);
  },

  // Find interesting narrative examples based on your criteria
  findNarrativeExamples: function () {
    if (!this.mapData) return {};

    // 1. Remote county with high vulnerability
    const remoteVulnerableCounties = this.mapData.filter((county) => {
      // Define "remote" as not in the east coast states
      const eastCoastStates = [
        "MD",
        "VA",
        "DE",
        "NJ",
        "NY",
        "CT",
        "RI",
        "MA",
        "NH",
        "ME",
        "NC",
        "SC",
        "GA",
        "FL",
      ];
      const stateAbbr = utils.fips.getStateAbbr(county.id.substring(0, 2));
      const isRemote = !eastCoastStates.includes(stateAbbr);

      // High vulnerability criteria
      const vulnerabilityScore = county.properties.vulnerabilityIndex || 0;
      const isHighlyVulnerable =
        vulnerabilityScore >= config.vulnerability.highVulnerabilityThreshold;

      return isRemote && isHighlyVulnerable;
    });

    // 2. Resilient county (high federal employment but low vulnerability)
    const resilientCounties = this.mapData.filter((county) => {
      const fedWorkers = county.properties.fed_workers_per_100k || 0;
      const vulnerabilityScore = county.properties.vulnerabilityIndex || 0;

      return (
        fedWorkers >= config.vulnerability.highFederalThreshold &&
        vulnerabilityScore < 30
      ); // Low vulnerability threshold
    });

    // 3. Disproportionately vulnerable county
    const disproportionateCounties = this.mapData.filter((county) => {
      const fedWorkers = county.properties.fed_workers_per_100k || 0;
      const vulnerabilityScore = county.properties.vulnerabilityIndex || 0;

      // Moderate federal employment but high vulnerability
      return (
        fedWorkers >= 2000 &&
        fedWorkers < 5000 &&
        vulnerabilityScore >= config.vulnerability.highVulnerabilityThreshold
      );
    });

    // Return a selection of examples (first 3 of each type)
    return {
      remoteVulnerable: remoteVulnerableCounties.slice(0, 3).map((c) => c.id),
      resilient: resilientCounties.slice(0, 3).map((c) => c.id),
      disproportionate: disproportionateCounties.slice(0, 3).map((c) => c.id),
    };
  },

  // Helper function to normalize values to a 0-100 scale
  normalizeValue: function (value, min, max) {
    // Handle edge case: if min and max are the same, return 50
    if (min === max) return 50;

    // Normalize to 0-100 scale
    return ((value - min) / (max - min)) * 100;
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

  // Calculate Jenks breaks for both federal workers and vulnerability scores
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
    };

    this.statistics.vulnerability = {
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
    };

    // Log the calculated breaks for debugging
    console.log(
      "Federal workers breaks (Jenks):",
      this.statistics.federal_workers.breaks
    );
    console.log(
      "Vulnerability breaks (Jenks):",
      this.statistics.vulnerability.breaks
    );
    console.log(
      "Vulnerability breaks (Quantiles):",
      this.statistics.vulnerability.quantileBreaks
    );

    console.log("Calculated statistics for datasets");
  },

  // Get statistics for the current step
  getStatisticsForStep: function (stepIndex) {
    const step = config.steps[stepIndex];

    // Return appropriate statistics based on step ID
    if (step.id === "state_federal_workers") {
      return this.statistics.state_federal_workers;
    } else if (step.id === "federal_workers") {
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

  // Assign categories based on calculated Jenks breaks
  updateVulnerabilityCategories: function (counties) {
    console.log("Updating vulnerability categories based on Jenks breaks...");

    // Get the calculated breaks from statistics
    const jenksBreaks = this.statistics.vulnerability.breaks;

    if (!jenksBreaks || jenksBreaks.length < 4) {
      console.warn("Insufficient breaks to update categories");
      return;
    }

    // Log the breaks we'll use for category assignment
    console.log(
      "Using Jenks breaks for vulnerability categories:",
      jenksBreaks
    );

    // Update each county's category based on the Jenks breaks
    let categoryCounts = {
      "Very Low": 0,
      Low: 0,
      Moderate: 0,
      High: 0,
      "Very High": 0,
      "No Data": 0,
    };

    counties.forEach((county) => {
      if (county.properties.vulnerabilityIndex !== null) {
        county.properties.category = this.assignVulnerabilityCategoryDynamic(
          county.properties.vulnerabilityIndex,
          jenksBreaks
        );
        categoryCounts[county.properties.category]++;
      } else {
        county.properties.category = "No Data";
        categoryCounts["No Data"]++;
      }
    });

    console.log(
      "Updated vulnerability categories distribution:",
      categoryCounts
    );
  },

  // Dynamic category assignment
  assignVulnerabilityCategoryDynamic: function (index, jenksBreaks) {
    if (index === null || index === undefined) return "No Data";

    // Sort breaks in ascending order
    const breaks = jenksBreaks.slice().sort((a, b) => a - b);

    if (index < breaks[0]) return "Very Low";
    if (index < breaks[1]) return "Low";
    if (index < breaks[2]) return "Moderate";
    if (index < breaks[3]) return "High";
    return "Very High";
  },
};
