// config.js - Configuration settings for the county map visualization

const config = {
  // Step configuration
  steps: [
    {
      id: "federal_workers",
      title: "Federal workers per 100,000 across U.S. counties",
      dataField: "fed_workers_per_100k",
      colorScheme: "blues",
      colorScaleType: "diverging", // centered around median
    },
    {
      id: "vulnerability_index",
      title: "Vulnerability index across U.S. counties",
      dataField: "vulnerabilityIndex",
      colorScheme: "reds",
      colorScaleType: "sequential",
    },
    // New step for vulnerability categories (categorical)
    {
      id: "vulnerability_category",
      title: "Vulnerability Categories",
      dataField: "category",
    },
  ],

  // Visual configuration
  // Colors for color scale
  colors: {
    regularStroke: "#ffffff", // County outlines
    federal: [
      "#ffffcc", // Light yellow
      "#addfb7", // Light green
      "#4ebac2", // Teal
      "#328ebb", // Blue green
      "#2961aa", // Med navy
      "#253494", // Dark navy
    ],
    vulnerability: [
      "#fee5d975", // Lightest pink/salmon
      "#fcbba175", // Light salmon
      "#fc927275", // Medium salmon
      "#fb6a4a", // Salmon/light red
      "#de2d26", // Medium red
      "#a50f15", // Dark red
    ],
    // Vulnerability categories
    vulnerabilityCategory: {
      "Very Low": "gray", // Lightest red from your existing palette
      Low: "blue",
      Moderate: "green",
      High: "purple", // Darkest red from your existing palette
      // "No Data": "#cccccc", // Assuming this is your default gray, adjust as needed
    },
  },

  // Data classification configuration
  classification: {
    numBreaks: 5, // Number of breaks for color classes
    outlierMultiplier: 3, // For IQR-based outlier detection
    percentileThreshold: 0.05, // For top/bottom percentile identification
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
