// config.js - Configuration settings for the county map visualization

const config = {
  // Urls for data sources
  urls: {
    countiesGeoJSON:
      "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
    statesGeoJSON: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    dataSheet:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=0&single=true&output=csv",
    vulnerableCounties:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUMJpmtcUCBBKkeU-DfCoSjW1t7Y_tQGSDGjw7oZ3C1rOPPLd2sICVpYoS8CVEXTsFl71OfrMozurU/pub?gid=451832244&single=true&output=csv",
  },

  // Step configuration
  steps: [
    // Step 1: Federal workers per 100k, by state
    {
      id: "state_federal_workers",
      title: "Federal Workers per 100,000 by State",
      description:
        "While D.C. leads with over 10% federal employment, states like Alaska, Maryland and Hawaii show surprising concentrations far from the capital.",
      transitionText:
        "Let's look closer to see how these patterns emerge at the county level.",
      dataField: "state_fed_workers_per_100k",
      colorScheme: "blues",
      colorSet: "federal",
      isStateLevel: true, // Add this flag to indicate state-level visualization
    },
    // Step 2: Federal workers per 100k, by county
    {
      id: "federal_workers",
      title: "Federal Workers per 100,000 across U.S. counties",
      description:
        "Federal employment isn't evenly distributed even within states.",
      transitionText:
        "What makes some communities more dependent on federal jobs than others?",
      dataField: "fed_workers_per_100k",
      colorScheme: "blues",
      colorSet: "federal",
    },
    // Step 3: Vulnerability score by county
    {
      id: "vulnerability_index",
      title: "Vulnerability Index across U.S. counties",
      description:
        "Vulnerability to federal cuts isn't just about how many federal workers live there. Some areas with moderate federal employment face higher vulnerability due to economic factors.",
      transitionText: "Now let's focus on the most vulnerable counties.",
      dataField: "vulnerabilityIndex",
      colorScheme: "reds",
      colorSet: "vulnerability",
    },
    // Step 4: Spotlight on vulnerable communities
    {
      id: "vulnerable_counties",
      title: "Communities Most Vulnerable to Federal Job Cuts",
      description:
        "These representative communities illustrate different vulnerability patterns across the country.",
      dataField: "vulnerabilityIndex",
      colorScheme: "reds",
      colorSet: "vulnerability",
      spotlightMode: true,
      spotlights: [
        {
          id: "triple_threat",
          countyFips: "21237", // Wolfe County, Kentucky
          title: "Triple threat",
          description:
            "For communities like Wolfe County, federal job cuts would remove some of the only stable, well-paying employment opportunities in an area already struggling with high unemployment and low incomes.",
          stats: [
            "14.8% of jobs are federal",
            "Unemployment already at 27% (over 5x the national average)",
            "Median income of just $24,349 (less than 10% of the national average)",
          ],
        },
        {
          id: "extreme_dependency",
          countyFips: "15005", // Kalawao County, Hawaii
          title: "Extreme dependency",
          description:
            "While Kalawao County currently enjoys full employment, its extreme dependence on federal jobs means cuts could transform it from one of the most stable employment markets to one of the most vulnerable almost overnight.",
          stats: [
            "38.7% of all jobs are federal (11x the national average)",
            "Currently has low unemployment (0%)",
            "A 20% reduction in federal workforce would directly eliminate nearly 8% of all jobs",
          ],
        },
        {
          id: "tribal_rural",
          // Array of county FIPS for tribal areas
          countyFips: [
            "46121",
            "46135",
            "04017",
            "35045",
            "02270",
            "30031",
            "38085",
          ],
          title: "Tribal communities and rural areas",
          description:
            "In tribal areas and rural communities, federal employment often represents one of the few sources of stable, career-path jobs. Cuts would disproportionately impact areas already facing limited economic opportunities.",
        },
      ],
    },
  ],

  // Color scale configurations
  scales: {
    state_federal_workers: {
      useJenks: true,
      colorSet: "federal",
      breaks: [2400, 3000, 3600, 4200, 5000, 10000], // Use values that match your data range
      maxValue: 11000,
      showEndLabel: true,
    },
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
    vulnerable_counties: {
      useJenks: true,
      colorSet: "vulnerability", // Use vulnerability color scheme for the spotlight
      maxValue: 65.0,
      showEndLabel: true,
    },
    // Scale for narrative example 1 (triple threat)
    narrative_example_1: {
      useJenks: true,
      colorSet: "federal",
      maxValue: 15000,
      showEndLabel: true,
    },
    // Scale for narrative example 2 (extreme dependency)
    narrative_example_2: {
      useJenks: true,
      colorSet: "federal",
      maxValue: 15000,
      showEndLabel: true,
    },
    // Scale for narrative example 3 (tribal and rural areas)
    narrative_example_3: {
      useJenks: true,
      colorSet: "federal",
      maxValue: 15000,
      showEndLabel: true,
    },
  },

  // Colors for color scale
  colors: {
    regularStroke: "#ffffff", // County outlines
    highlightStroke: "#000000", // Highlighted county outlines

    // Color palettes for different data types
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

    // Category-specific colors using the vulnerability palette
    vulnerabilityCategory: {
      "Very Low": "#fff5f0", // Lightest pink
      Low: "#fee0d2", // Light pink
      "Moderate-Low": "#fcbba1", // Light salmon
      "Moderate-High": "#fc9272", // Medium salmon
      High: "#fb6a4a", // Salmon/light red
      "Very High": "#a50f15", // Dark red
    },

    // Spotlight highlight colors
    spotlight: {
      default: "rgba(200, 200, 200, 0.3)", // Faded background for non-spotlighted counties
      highlight: "#de2d26", // Highlighting for spotlighted counties
      tripleThreat: "#a50f15",
      extremeDependency: "#de2d26",
      tribalRural: "#fb6a4a",
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

  // Vulnerability thresholds
  vulnerability: {
    highFederalThreshold: 2500, // Fed workers per 100k
    highVulnerabilityThreshold: 20, // Vulnerability score
  },
};

export default config;
