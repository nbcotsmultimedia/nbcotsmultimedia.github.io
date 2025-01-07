// script.js

// Import necessary modules
import CONFIG from "./config.js";
import {
  generateBufferZone,
  isValidCoordinates,
  calculateDistance,
  getHexagonCentroids,
  mapZipCodesToHexagons,
  identifyAffordableOrStretchedHexagons,
  calculateCentroidIndex,
  generateH3Hexagons,
} from "./spatial.js";
import {
  calculateMonthlyMortgagePayment,
  calculateAffordabilityThresholds,
  getInterestRate,
  calculateBackEndDTI,
  determineAffordabilityCategory,
  calculateHousingAffordability,
} from "./calculations.js";
import { ErrorHandler, ErrorTypes } from "./errors.js";
import { validateForm, validateZipCode } from "./validation.js";
import { setupEventListeners } from "./events.js";
import { LoadingManager } from "./loading.js";
import { CacheManager } from "./cache.js";

// Create empty housingData variable
let housingData;

// Fetch and parse data from Google Sheet
async function loadDataFromGoogleSheet() {
  LoadingManager.setLoading(true);

  try {
    const results = await new Promise((resolve, reject) => {
      Papa.parse(CONFIG.dataSource.url, {
        ...CONFIG.dataSource.parseOptions,
        complete: resolve,
        error: reject,
      });
    });

    housingData = results.data;
    return housingData;
  } catch (error) {
    ErrorHandler.throw(
      ErrorTypes.DATA_LOADING,
      "Failed to load housing data",
      error
    );
  } finally {
    LoadingManager.setLoading(false);
  }
}

// Initialize the application when the DOM loads
document.addEventListener("DOMContentLoaded", async () => {
  try {
    CacheManager.cleanup(); // Clean old cache entries
    const data = await loadDataFromGoogleSheet();
    setupEventListeners(data);
  } catch (error) {
    ErrorHandler.handle(error);
  }
});
