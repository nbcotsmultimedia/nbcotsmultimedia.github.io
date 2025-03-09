// config.js - Updated configuration settings

const DEV_MODE = true; // Set to false for production
const TOOLTIP_DEV_MODE = true; // Set to false for production

const config = {
  // URLs for data sources
  urls: {
    countiesGeoJSON:
      "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
    statesGeoJSON: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    dataSheet:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=0&single=true&output=csv",
    // New data sources for vulnerability clusters
    ruralFederalDependentData:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=175285704&single=true&output=csv",
    nativeAmericanReservationData:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=1801797509&single=true&output=csv",
    economicallyDistressedData:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=948951406&single=true&output=csv",
  },

  // Step configuration
  steps: [
    // Federal workers per 100k, by state
    {
      id: "state_federal_workers",
      title: "Federal workers by state",
      description:
        "Federal jobs aren't spread evenly across the country. D.C., Alaska, Maryland, and Hawaii have the most federal workers per capita.",
      dataField: "state_fed_workers_per_100k",
      colorSet: "blues",
      isStateLevel: true,
      breaks: [2400, 3000, 3600, 4200, 5000],
    },
    // Federal workers per 100k, by county
    {
      id: "federal_workers",
      title: "Federal workers by county",
      description:
        "Even within states, some counties depend much more on federal jobs than others.",
      dataField: "fed_workers_per_100k",
      colorSet: "blues",
      breaks: [1000, 2500, 5000, 7500, 10000],
    },
    // Original vulnerability score by county
    {
      id: "vulnerability_index",
      title: "Vulnerability to federal job cuts",
      description:
        "This map shows which places would be hit hardest by federal job cuts, based on how many federal workers they have, local unemployment, and income levels.",
      dataField: "vulnerabilityIndex",
      colorSet: "vulnerability",
      breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
    },

    // New steps for vulnerability clusters
    // Rural Federal-Dependent Communities spotlight
    {
      id: "rural_federal_dependent",
      title: "Rural federal-dependent communities",
      description:
        "Many rural counties (559 in total) rely heavily on federal jobs. With few other industries, cuts to federal employment would hit these areas hard.",
      dataField: "vulnerabilityIndex", // Keep using vulnerability index as base
      colorSet: "vulnerability",
      breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
      clusterType: "rural",
      isSpotlightView: true, // New property for spotlight view
      countiesCount: 559,
      federalWorkersCount: 881780,
      spotlightField: "is_rural_federal_dependent", // Field to identify cluster counties
      salientField: "rural_fed_salient_example", // Field to identify salient examples
      scoreField: "rural_fed_score", // Custom score field for tooltip info
    },
    // Native American Reservation Counties spotlight
    {
      id: "native_american_reservation",
      title: "Native American reservation counties",
      description:
        "These 204 counties with large Native American populations depend heavily on federal jobs. Many reservations have few other employment options.",
      dataField: "vulnerabilityIndex", // Keep using vulnerability index as base
      colorSet: "vulnerability",
      breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
      clusterType: "reservation",
      isSpotlightView: true,
      countiesCount: 204,
      federalWorkersCount: 138910,
      spotlightField: "is_native_american_reservation",
      salientField: "reservation_salient_example",
      scoreField: "reservation_score",
    },
    // Economically Distressed Areas spotlight
    {
      id: "economically_distressed",
      title: "Economically distressed areas",
      description:
        "These 132 counties already face high unemployment and low incomes. They're especially vulnerable because federal jobs are among the few stable employers.",
      dataField: "vulnerabilityIndex", // Keep using vulnerability index as base
      colorSet: "vulnerability",
      breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
      clusterType: "distressed",
      isSpotlightView: true,
      countiesCount: 132,
      federalWorkersCount: 50821,
      spotlightField: "is_economically_distressed",
      salientField: "distress_salient_example",
      scoreField: "distress_score",
    },
  ],

  // Colors for color scale
  colors: {
    // Original color palettes
    federal: [
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
    blues: [
      "#f7fbff", // Lightest blue (almost white)
      "#deebf7", // Very light blue
      "#c6dbef", // Light blue
      "#9ecae1", // Medium light blue
      "#6baed6", // Medium blue
      "#3182bd", // Medium dark blue
      "#08519c", // Dark blue
    ],

    // Perceptually Optimized Scheme for new clusters
    magenta: [
      "#fcf0ff", // Lightest magenta (almost white)
      "#f5d0f9", // Very light magenta
      "#eeaff2", // Light magenta
      "#e48be9", // Medium light magenta
      "#d265dc", // Medium magenta
      "#c13ec7", // Medium dark magenta
      "#9c0f9e", // Dark magenta
    ],
    cyan: [
      "#eafcff", // Lightest cyan (almost white)
      "#c5f1fa", // Very light cyan
      "#a0e6f5", // Light cyan
      "#6ed9ee", // Medium light cyan
      "#33c9e4", // Medium cyan
      "#0fb7d4", // Medium dark cyan
      "#0392ab", // Dark cyan
    ],
    yellow: [
      "#fffdf0", // Lightest yellow (almost white)
      "#fff9c2", // Very light bright yellow
      "#fff58f", // Light bright yellow
      "#ffee5c", // Medium light bright yellow
      "#ffe70a", // Bright yellow
      "#ffd000", // Medium bright yellow
      "#e6bc00", // Darkest bright yellow
    ],
    // Keep original color palettes for reference
    greens: [
      "#f7fcf5", // Lightest green (almost white)
      "#e5f5e0", // Very light green
      "#c7e9c0", // Light green
      "#a1d99b", // Medium light green
      "#74c476", // Medium green
      "#41ab5d", // Medium dark green
      "#238b45", // Dark green
    ],
    reds: [
      "#fff5f0", // Lightest red (almost white)
      "#fee0d2", // Very light red
      "#fcbba1", // Light red
      "#fc9272", // Medium light red
      "#fb6a4a", // Medium red
      "#ef3b2c", // Medium dark red
      "#cb181d", // Dark red
    ],

    // Specific colors for combined view
    clusterColors: {
      rural: "#41ab5d", // Green for rural federal-dependent
      reservation: "#0fb7d4", // Cyan for Native American reservation
      distressed: "#c13ec7", // Magenta for economically distressed
      multiple: "#ffd000", // Yellow for counties in multiple clusters
      none: "#f7f7f7", // Light gray for counties not in any cluster
    },
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
  },
};

export default config;
export { DEV_MODE, TOOLTIP_DEV_MODE };
