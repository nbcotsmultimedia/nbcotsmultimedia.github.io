// errors.js

import CONFIG from "./config.js";

class ApplicationError extends Error {
  constructor(type, message, originalError = null) {
    super(message || CONFIG.errors[type]);
    this.name = "ApplicationError";
    this.type = type;
    this.originalError = originalError;
  }
}

export const ErrorTypes = {
  INVALID_ZIP: "INVALID_ZIP",
  DATA_LOADING: "DATA_LOADING",
  CALCULATION: "CALCULATION",
  GEOSPATIAL: "GEOSPATIAL",
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
};

export const ErrorHandler = {
  handle(error, elementId = "resultsMessage") {
    console.error("[Error Handler]:", error);

    const errorMessage =
      error instanceof ApplicationError
        ? error.message
        : CONFIG.errors.VALIDATION;

    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="error">${errorMessage}</div>`;
      setTimeout(() => {
        errorDiv.querySelector(".error")?.classList.add("fade-out");
      }, 5000);
    }

    // Additional handling based on error type
    if (error instanceof ApplicationError) {
      switch (error.type) {
        case ErrorTypes.NETWORK:
          this.handleNetworkError(error);
          break;
        case ErrorTypes.DATA_LOADING:
          this.handleDataError(error);
          break;
        default:
          break;
      }
    }
  },

  handleNetworkError(error) {
    // Reset loading states
    const loadingElements = document.querySelectorAll(".is-loading");
    loadingElements.forEach((el) => el.classList.remove("is-loading"));
  },

  handleDataError(error) {
    // Clear cached data and reset UI
    localStorage.removeItem("housingData");
    document.getElementById("zipCodeList").innerHTML = "";
  },

  throw(type, message = "", originalError = null) {
    throw new ApplicationError(type, message, originalError);
  },
};
