// events.js

import { validateZipCode, validateForm } from "./validation.js";
import { ErrorHandler } from "./errors.js";
import CONFIG from "./config.js";
import {
  calculateAffordabilityThresholds,
  calculateHousingAffordability,
} from "./calculations.js";
import {
  performGeospatialAnalysis,
  displayGeospatialResults,
} from "./spatial.js";
import { getFormData, displayAffordabilityResults } from "./utils.js";

export const setupEventListeners = (housingData) => {
  setupZipCodeEvents(housingData);
  setupFormEvents(housingData);
  setupDebugDefaults();
};

const setupZipCodeEvents = (housingData) => {
  const zipInput = document.getElementById("zipCode");
  const zipList = document.getElementById("zipCodeList");
  const zipValidation = document.getElementById("zipValidation");
  const calculateButton = document.getElementById("calculateButton");

  zipInput.addEventListener("input", (e) => {
    const value = e.target.value;
    zipList.innerHTML = "";

    if (housingData && value.length > 0) {
      const matches = housingData
        .filter((data) => data.zip.startsWith(value))
        .slice(0, CONFIG.validation.zipCode.maxSuggestions);

      matches.forEach((data) => {
        const option = document.createElement("option");
        option.value = data.zip;
        zipList.appendChild(option);
      });
    }

    const result = validateZipCode(value, housingData);
    zipValidation.textContent = result.message;
    zipValidation.className = result.isValid ? "success" : "error";
    calculateButton.disabled = !result.isValid;

    if (result.isValid) {
      setTimeout(() => {
        zipValidation.textContent = "";
        zipValidation.className = "";
      }, CONFIG.validation.zipCode.refreshInterval);
    }
  });
};

const setupFormEvents = (housingData) => {
  const form = document.getElementById("affordabilityForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const resultsDiv = document.getElementById("resultsMessage");
    resultsDiv.innerHTML = "";

    try {
      const formData = await getFormData();
      validateForm(formData, housingData);

      const thresholds = calculateAffordabilityThresholds(
        formData.annualIncome / 12,
        formData.monthlyExpenses
      );

      // Calculate main affordability results
      const results = calculateHousingAffordability(
        housingData,
        formData.zipCode,
        formData.annualIncome,
        formData.downPayment,
        formData.monthlyExpenses,
        formData.mortgageTerm,
        thresholds
      );

      // Display main results
      displayAffordabilityResults(results);

      // Perform and display geospatial analysis
      const geospatialResults = performGeospatialAnalysis(
        housingData,
        formData.zipCode,
        results.interestRate,
        formData.downPayment,
        formData.mortgageTerm,
        thresholds
      );

      displayGeospatialResults(geospatialResults);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  });
};

const setupDebugDefaults = () => {
  if (CONFIG.debug?.formDefaults) {
    Object.entries(CONFIG.debug.formDefaults).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
      }
    });
  }
};
