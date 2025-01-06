const CONFIG = {
  // Data source
  dataSource: {
    url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsekIX9YqbqesymI-CT1Yw_B9Iq_BZMNFpNhncYNDwETZLNPCYJ8ivED1m8TvIURG3OzAeWraCloFb/pub?gid=476752314&single=true&output=csv",
    parseOptions: {
      download: true,
      header: true,
      skipEmptyLines: true,
    },
  },

  // Spatial analysis settings
  spatial: {
    h3: {
      defaultResolution: 6,
      ringCount: 3, // k value for h3.gridDisk
    },
    buffer: {
      radius: 5,
      units: "miles",
    },
  },

  // Affordability thresholds (as decimal)
  dti: {
    affordable: 0.28,
    stretch: 0.36,
    aggressive: 0.43,
  },

  // Error messages
  errors: {
    INVALID_ZIP: "Invalid ZIP code provided",
    DATA_LOADING: "Error loading housing data",
    CALCULATION: "Error in affordability calculation",
    GEOSPATIAL: "Error in geospatial analysis",
    NETWORK: "Network error occurred",
    VALIDATION: "Validation error",
  },

  // Cache settings
  cache: {
    maxAge: 3600000, // 1 hour in milliseconds
  },

  // Debug defaults
  debug: {
    formDefaults: {
      zipCode: "78745",
      income: "75000",
      downPayment: "10000",
      monthlyExpenses: "600",
      mortgageTerm: "30",
    },
  },

  // Validation rules
  validation: {
    zipCode: {
      maxSuggestions: 10,
      refreshInterval: 5000, // 5 seconds for validation message
    },
    geospatial: {
      logDetails: false, // Toggle for console logging
    },
  },

  // User interface state
  uiState: {
    loadingText: "Loading...",
    defaultButtonText: "Calculate",
    loadingClass: "is-loading",
  },
};

export default CONFIG;
