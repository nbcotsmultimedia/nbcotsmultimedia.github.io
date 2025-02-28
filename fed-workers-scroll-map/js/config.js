// config.js - Configuration settings for the county map visualization

const config = {
  // Step configuration
  steps: [
    // Step 1: Federal workers per 100k, by state
    {
      id: "state_federal_workers",
      title: "Federal Workers per 100,000 by State",
      dataField: "state_fed_workers_per_100k",
      colorScheme: "blues",
      colorSet: "federal",
      isStateLevel: true, // Add this flag to indicate state-level visualization
    },
    // Step 2: Federal workers per 100k, by county
    {
      id: "federal_workers",
      title: "Federal workers per 100,000 across U.S. counties",
      dataField: "fed_workers_per_100k",
      colorScheme: "blues",
      colorSet: "federal",
    },
    // Step 3: Vulnerability score by county
    {
      id: "vulnerability_index",
      title: "Vulnerability index across U.S. counties",
      dataField: "vulnerabilityIndex",
      colorScheme: "reds",
      colorSet: "vulnerability",
    },
    // New step for vulnerability categories (categorical)
    // {
    //   id: "vulnerability_category",
    //   title: "Vulnerability Categories",
    //   dataField: "category",
    // },
  ],

  // Color scale configurations
  scales: {
    federal_workers: {
      // breaks: [1000, 2500, 5000, 7500, 10000],
      useJenks: true,
      colorSet: "federal",
      maxValue: 15000,
      showEndLabel: true,
    },
    vulnerability_index: {
      // breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
      useJenks: true,
      colorSet: "vulnerability",
      maxValue: 65.0, // Maximum vulnerability score from analysis
    },
  },

  // Colors for color scale
  colors: {
    regularStroke: "#ffffff", // County outlines
    federal: [
      // "#ffffcc", // Light yellow
      // "#addfb7", // Light green
      // "#4ebac2", // Teal
      // "#328ebb", // Blue green
      // "#2961aa", // Med navy
      // "#253494", // Dark navy
      "#f7fbff", // Lightest blue (almost white)
      "#deebf7", // Very light blue
      "#c6dbef", // Light blue
      "#9ecae1", // Medium light blue
      "#6baed6", // Medium blue
      "#3182bd", // Medium dark blue
      "#08519c", // Dark blue
    ],
    vulnerability: [
      "#fff5f0", // Lightest pink (almost white)
      "#fee0d2", // Very light salmon
      "#fcbba1", // Light salmon
      "#fc9272", // Medium salmon
      "#fb6a4a", // Salmon/light red
      "#de2d26", // Medium red
      "#a50f15", // Dark red
    ],
    // Updated vulnerability categories to match natural breaks
    vulnerabilityCategory: {
      "Very Low": "#fff5f0", // Lightest pink
      Low: "#fee0d2", // Light pink
      "Moderate-Low": "#fcbba1", // Light salmon
      "Moderate-High": "#fc9272", // Medium salmon
      High: "#fb6a4a", // Salmon/light red
      "Very High": "#a50f15", // Dark red
    },
  },

  // Classification configuration - change to use Jenks natural breaks
  classification: {
    method: "jenks", // Changed from implicit 'quantile' to explicit 'jenks'
    numBreaks: 6, // Number of breaks for color classes
    outlierMultiplier: 3, // For IQR-based outlier detection
    percentileThreshold: 0.05, // For top/bottom percentile identification
  },

  // Add category names configuration to config.js
  categoryNames: {
    federal_workers: [
      "Very Low",
      "Low",
      "Moderate",
      "High",
      "Very High",
      "Extremely High",
    ],
    vulnerability_index: [
      "Very Low",
      "Low",
      "Moderate-Low",
      "Moderate-High",
      "High",
      "Very High",
    ],
    vulnerability_category: [
      "Very Low",
      "Low",
      "Moderate",
      "High",
      "Very High",
    ],
  },

  // Add descriptions for each map type
  descriptions: {
    federal_workers: "Federal workers per 100,000 population",
    vulnerability_index:
      "Based on federal employment, unemployment rate, and median income",
    vulnerability_category: "Vulnerability categories by county",
  },

  // URL and data sources
  urls: {
    countiesGeoJSON:
      "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
    statesGeoJSON: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    dataSheet:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=0&single=true&output=csv",
  },

  // FIPS code mapping
  stateFips: {
    "01": "Alabama",
    "02": "Alaska",
    "04": "Arizona",
    "05": "Arkansas",
    "06": "California",
    "08": "Colorado",
    "09": "Connecticut",
    10: "Delaware",
    11: "District of Columbia",
    12: "Florida",
    13: "Georgia",
    15: "Hawaii",
    16: "Idaho",
    17: "Illinois",
    18: "Indiana",
    19: "Iowa",
    20: "Kansas",
    21: "Kentucky",
    22: "Louisiana",
    23: "Maine",
    24: "Maryland",
    25: "Massachusetts",
    26: "Michigan",
    27: "Minnesota",
    28: "Mississippi",
    29: "Missouri",
    30: "Montana",
    31: "Nebraska",
    32: "Nevada",
    33: "New Hampshire",
    34: "New Jersey",
    35: "New Mexico",
    36: "New York",
    37: "North Carolina",
    38: "North Dakota",
    39: "Ohio",
    40: "Oklahoma",
    41: "Oregon",
    42: "Pennsylvania",
    44: "Rhode Island",
    45: "South Carolina",
    46: "South Dakota",
    47: "Tennessee",
    48: "Texas",
    49: "Utah",
    50: "Vermont",
    51: "Virginia",
    53: "Washington",
    54: "West Virginia",
    55: "Wisconsin",
    56: "Wyoming",
    60: "American Samoa",
    66: "Guam",
    69: "Northern Mariana Islands",
    72: "Puerto Rico",
    78: "Virgin Islands",
  },
};
