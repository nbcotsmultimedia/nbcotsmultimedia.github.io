// loading.js

import CONFIG from "./config.js";

export const LoadingManager = {
  elements: {
    calculateButton: document.getElementById("calculateButton"),
    zipInput: document.getElementById("zipCode"),
    form: document.getElementById("affordabilityForm"),
    loadingSpinner: document.getElementById("loadingSpinner"),
    resultsSection: document.getElementById("resultsMessage"),
  },

  setLoading(isLoading, component = "all") {
    switch (component) {
      case "form":
        this.setFormLoading(isLoading);
        break;
      case "results":
        this.setResultsLoading(isLoading);
        break;
      case "all":
        this.setFormLoading(isLoading);
        this.setResultsLoading(isLoading);
        break;
    }
  },

  setFormLoading(isLoading) {
    const { calculateButton, zipInput, form } = this.elements;

    calculateButton.disabled = isLoading;
    calculateButton.innerHTML = isLoading
      ? CONFIG.uiState.loadingText
      : CONFIG.uiState.defaultButtonText;
    calculateButton.classList.toggle(CONFIG.uiState.loadingClass, isLoading);

    zipInput.disabled = isLoading;
    form.classList.toggle(CONFIG.uiState.loadingClass, isLoading);
  },

  setResultsLoading(isLoading) {
    const { loadingSpinner, resultsSection } = this.elements;

    if (loadingSpinner) {
      loadingSpinner.style.display = isLoading ? "block" : "none";
    }

    if (resultsSection) {
      resultsSection.classList.toggle("loading", isLoading);
    }
  },

  showLoadingIndicator(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add(CONFIG.uiState.loadingClass);
    }
  },

  hideLoadingIndicator(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove(CONFIG.uiState.loadingClass);
    }
  },
};
