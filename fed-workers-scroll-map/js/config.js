// config.js - Simplified configuration settings

const config = {
  // URLs for data sources
  urls: {
    countiesGeoJSON:
      "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
    statesGeoJSON: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    dataSheet:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=0&single=true&output=csv",
  },

  // Step configuration
  steps: [
    // Federal workers per 100k, by state
    {
      id: "state_federal_workers",
      title: "Federal Workers per 100,000 by State",
      // description:
      //   "Some states rely more heavily on federal employment than others. Washington D.C., Alaska, Maryland, and Hawaii show the highest concentration of federal workers.",
      dataField: "state_fed_workers_per_100k",
      colorSet: "blues",
      isStateLevel: true,
      breaks: [2400, 3000, 3600, 4200, 5000],
    },
    // Federal workers per 100k, by county
    {
      id: "federal_workers",
      title: "Federal Workers per 100,000 by County",
      // description:
      //   "Zooming in reveals significant variation even within states, with some counties showing much higher federal employment than their neighbors.",
      dataField: "fed_workers_per_100k",
      colorSet: "blues",
      breaks: [1000, 2500, 5000, 7500, 10000],
    },
    // Final vulnerability score by county
    {
      id: "vulnerability_index",
      title: "Vulnerability Index to Federal Job Cuts",
      // description:
      //   "The final vulnerability index shows areas most at risk from federal workforce reductions, based on federal employment (50%), unemployment (30%), and income (20%).",
      dataField: "vulnerabilityIndex",
      colorSet: "vulnerability",
      breaks: [17.8, 20.0, 26.2, 30.1, 40.0],
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

    // New Perceptually Optimized Scheme
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
