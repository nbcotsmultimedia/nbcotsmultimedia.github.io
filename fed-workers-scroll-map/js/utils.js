// utils.js - Utility functions for the visualization

// #region - Performance Utilities

// Create a debounced version of a function
export function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Create a throttled version of a function
export function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Create a requestAnimationFrame-based version of a function
export function rafify(func) {
  let ticking = false;
  return function (...args) {
    if (!ticking) {
      requestAnimationFrame(() => {
        func.apply(this, args);
        ticking = false;
      });
    }
    ticking = true;
  };
}

// #endregion

// #region - DOM Utilities

// Create a DOM element with attributes and properties
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "className") {
      element.className = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else if (key === "dataset" && typeof value === "object") {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });

  // Add children
  if (children) {
    if (typeof children === "string") {
      element.textContent = children;
    } else if (children instanceof Node) {
      element.appendChild(children);
    } else if (Array.isArray(children)) {
      children.forEach((child) => {
        if (child) {
          if (typeof child === "string") {
            element.appendChild(document.createTextNode(child));
          } else {
            element.appendChild(child);
          }
        }
      });
    }
  }

  return element;
}

// Show loading message element
export function showLoading(element, message = "Loading...") {
  if (element) {
    element.textContent = message;
    element.style.display = "block";
  }
}

// Hide loading message element
export function hideLoading(element) {
  if (element) {
    element.style.display = "none";
  }
}

// Show error message
export function showError(element, message) {
  if (element) {
    element.textContent = message;
    element.style.backgroundColor = "rgba(255, 200, 200, 0.9)";
    element.style.display = "block";
  }
}

// Create a loading message element
export function createLoadingMessage() {
  return createElement("div", {
    className: "loading-message",
    textContent: "Loading map data...",
  });
}

// #endregion

// #region - Data Helpers

// Helper function for county name matching with better special case handling
export function getCountyMatchKeys(countyName, stateName) {
  const keys = [
    `${countyName} County, ${stateName}`,
    `${countyName}, ${stateName}`,
  ];

  // Add special cases for Alaska
  if (stateName === "Alaska") {
    keys.push(`${countyName} Borough, ${stateName}`);
    keys.push(`${countyName} Census Area, ${stateName}`);
    keys.push(`${countyName} Municipality, ${stateName}`);
    keys.push(`${countyName} City and Borough, ${stateName}`);
  }

  // Add special case for Louisiana
  if (stateName === "Louisiana") {
    keys.push(`${countyName} Parish, ${stateName}`);
  }

  // Handle other special cases
  if (stateName === "Virginia") {
    keys.push(`${countyName} city, ${stateName}`);
    keys.push(`${countyName} City, ${stateName}`);
  }

  // Look for specific known problematic counties and add their alternate names
  if (countyName === "Fairfax" && stateName === "Virginia") {
    keys.push("Fairfax County");
    keys.push("Fairfax city, Virginia");
  }

  if (countyName === "Richmond" && stateName === "Virginia") {
    keys.push("Richmond city, Virginia");
  }

  if (countyName === "Valdez-Cordova" && stateName === "Alaska") {
    keys.push("Valdez-Cordova Census Area, Alaska");
    keys.push("Chugach Census Area, Alaska");
    keys.push("Copper River Census Area, Alaska");
  }

  if (countyName === "Petersburg" && stateName === "Alaska") {
    keys.push("Petersburg Census Area, Alaska");
    keys.push("Petersburg Borough, Alaska");
  }

  if (countyName === "Accomack" && stateName === "Virginia") {
    keys.push("Accomack County, Virginia");
    keys.push("Accomac County, Virginia"); // Alternate spelling
  }

  // Doña Ana, NM
  if (countyName === "Doña Ana" && stateName === "New Mexico") {
    keys.push("Dona Ana County, New Mexico"); // Without the ñ
    keys.push("Dona Ana, New Mexico"); // Without the ñ
    keys.push("Doña Ana County, New Mexico"); // With the ñ
  }

  // Add simple name as fallback
  keys.push(countyName);

  return keys;
}

// #region - Enhanced Data Formatting Utilities

/**
 * Format value based on data field type
 * @param {any} value - Value to format
 * @param {string} fieldName - Name of the data field
 * @return {string} - Formatted value
 */
export function formatValue(value, fieldName) {
  // Handle undefined, null or NaN values
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "N/A";
  }

  // Format based on field type
  if (fieldName === "median_income") {
    return formatCurrency(value);
  } else if (fieldName === "unemployment_rate") {
    return formatPercentage(value);
  } else if (
    fieldName === "fed_workers_per_100k" ||
    fieldName === "state_fed_workers_per_100k"
  ) {
    return formatFederalWorkers(value);
  } else if (fieldName.includes("vulnerability")) {
    return formatScore(value);
  } else if (fieldName.includes("percent") || fieldName.includes("pct")) {
    return formatPercentage(value);
  } else if (fieldName.includes("count") || fieldName.includes("facilities")) {
    return formatCount(value);
  }

  // Default number formatting for other numeric fields
  if (typeof value === "number") {
    return value.toLocaleString();
  }

  // Return as is for non-numeric fields
  return value;
}

/**
 * Format federal workers count with appropriate suffix
 * @param {number} value - Federal workers count
 * @return {string} - Formatted value
 */
function formatFederalWorkers(value) {
  if (value >= 1000) {
    // Format as K for thousands with one decimal point
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toLocaleString();
}

/**
 * Format percentage values with consistent decimal places
 * @param {number} value - Percentage value
 * @return {string} - Formatted percentage
 */
function formatPercentage(value) {
  // Always show one decimal place for percentages
  return value.toFixed(1) + "%";
}

/**
 * Format currency values consistently
 * @param {number} value - Currency value
 * @return {string} - Formatted currency
 */
function formatCurrency(value) {
  // Format as currency with no decimal places
  return (
    "$" +
    value.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })
  );
}

/**
 * Format vulnerability scores consistently
 * @param {number} value - Score value
 * @return {string} - Formatted score
 */
function formatScore(value) {
  // Format score with one decimal place
  return value.toFixed(1);
}

/**
 * Format count values consistently
 * @param {number} value - Count value
 * @return {string} - Formatted count
 */
function formatCount(value) {
  // Format as integer
  return Math.round(value).toLocaleString();
}

/**
 * Get state abbreviation from full state name
 * @param {string} stateName - Full state name
 * @return {string} - State abbreviation
 */
export function getStateAbbreviation(stateName) {
  const stateAbbreviations = {
    Alabama: "AL",
    Alaska: "AK",
    Arizona: "AZ",
    Arkansas: "AR",
    California: "CA",
    Colorado: "CO",
    Connecticut: "CT",
    Delaware: "DE",
    Florida: "FL",
    Georgia: "GA",
    Hawaii: "HI",
    Idaho: "ID",
    Illinois: "IL",
    Indiana: "IN",
    Iowa: "IA",
    Kansas: "KS",
    Kentucky: "KY",
    Louisiana: "LA",
    Maine: "ME",
    Maryland: "MD",
    Massachusetts: "MA",
    Michigan: "MI",
    Minnesota: "MN",
    Mississippi: "MS",
    Missouri: "MO",
    Montana: "MT",
    Nebraska: "NE",
    Nevada: "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    Ohio: "OH",
    Oklahoma: "OK",
    Oregon: "OR",
    Pennsylvania: "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    Tennessee: "TN",
    Texas: "TX",
    Utah: "UT",
    Vermont: "VT",
    Virginia: "VA",
    Washington: "WA",
    "West Virginia": "WV",
    Wisconsin: "WI",
    Wyoming: "WY",
    "District of Columbia": "DC",
    Unknown: "??",
  };

  return stateAbbreviations[stateName] || stateName;
}

/**
 * Format agency data for tooltip display
 * @param {Object|string} agencyData - Raw agency data (object or string)
 * @return {string} - Formatted agency data
 */
export function formatAgencyData(agencyData) {
  // If the data is already a string, return it
  if (typeof agencyData === "string") {
    return agencyData;
  }

  // If it's an object with agency counts, format it nicely
  if (agencyData && typeof agencyData === "object") {
    return Object.entries(agencyData)
      .map(([agency, count]) => `${agency} (${count})`)
      .join(", ");
  }

  return "Data not available";
}

/**
 * Format facility type data for tooltip display
 * @param {Object|string} facilityData - Raw facility data (object or string)
 * @return {string} - Formatted facility data
 */
export function formatFacilityData(facilityData) {
  // If the data is already a string, return it
  if (typeof facilityData === "string") {
    return facilityData;
  }

  // If it's an object with facility type counts, format it nicely
  if (facilityData && typeof facilityData === "object") {
    return Object.entries(facilityData)
      .map(([type, count]) => `${type} (${count})`)
      .join(", ");
  }

  return "Data not available";
}

// #endregion

// A simple USA outline path for quick initial rendering
export function getUSOutline() {
  // This is a simplified outline of the USA for quick rendering
  return "M234.5,53.7L233.1,53.5L231.3,53.1L224.3,52.2L222.7,51.9L219.6,51.2L217.9,50.9L218.5,50L219.8,49.2L220.6,49.3L221.5,49.2L220.9,48.5L218.8,48.6L217.6,48.1L217,46.8L215.2,45.9L214,45.3L210.5,44.5L208.5,43.2L207.7,43.2L206.5,41.9L207.3,41.3L205.1,39.5L204.4,37.9L205.9,37.1L207.2,36.3L207.4,34.6L208.9,34L210.1,32.5L211.3,32.5L212.7,33.7L214.7,33.5L217.4,32.2L217.7,30.5L215.6,29.3L214.7,27.3L213.1,24.4L211.9,23.6L211.9,22.3L216.2,22.3L217.9,24.6L218.3,24.7L219.7,25.7L221.1,26L224.3,24.2L225.1,24L226.2,25.1L226.7,26.8L227.9,28.1L232,29.2L234.1,30.9L234.8,32.2L235.2,33.2L235.4,34.4L236.7,36.2L237.9,37L239.1,38.4L239.5,39.1L240.1,40.3L241.2,41.2L243.9,44.7L244.8,45.3L245.9,45.2L246.7,45.9L248.3,45.9L249.1,47.6L249.2,49L250.1,49.9L250.9,49.9L252.1,51.3L252.9,51.9L252.6,53.1L252.6,53.7L251.2,54.9L250.6,55.7L250.5,57.3L249.4,58.2L248.7,58.2L246.9,56.2L245.6,56L243.2,56.8L241.9,57.1L239.9,57.5L237.5,57.6L237.2,57.3L235.9,57.4L233.8,58.1L232.2,56.7L232.2,55.4L233.1,54L234.5,53.7ZM283.5,469.9L226.7,437.2L226.7,415.5L226.7,409.1L228.1,407.2L229.2,406.6L230.7,406.3L231.9,405.3L232.6,404.1L233.8,404.1L241.9,400.7L257,391.8L259.3,390.2L263.8,386.2L268.5,384.3L270.5,382.1L275,380.7L279.3,376.9L284.3,375.5L284.3,378.8L284.3,380.4L287.7,380.4L287.7,382.1L287.7,384.9L294.4,384.9L294.4,385.4L294.4,387.1L296.1,387.1L296.1,401L296.1,450.1L296.1,465.7L283.5,469.9ZM303.9,465.7L303.9,460.7L302.2,462.4L302.2,464L303.9,465.7ZM309.8,382.1L309.8,380.4L309.8,375.5L313.2,375.5L313.2,378.8L312.1,380.4L309.8,382.1Z";
}

// #endregion

// #region - Animation Utilities

// Set dimensions with padding for SVG
export function setDimensionsWithPadding(svg) {
  const width = window.innerWidth > 800 ? 800 : window.innerWidth - 40;
  const height = width * 0.625; // 8:5 aspect ratio

  // Add more top padding for legend
  const topPadding = 90; // Increased from 70 to 90 for more legend space

  if (svg) {
    svg.setAttribute("width", width);
    svg.setAttribute("height", height + topPadding);

    // Create a group for the map with a transform to move it down
    const mapGroup = d3.select(svg).select("g.map-group");
    if (mapGroup.empty()) {
      // If the group doesn't exist, create it
      d3.select(svg)
        .append("g")
        .attr("class", "map-group")
        .attr("transform", `translate(0, ${topPadding})`);
    } else {
      // If it already exists, just update the transform
      mapGroup.attr("transform", `translate(0, ${topPadding})`);
    }
  }

  return { width, height, topPadding };
}

// Add this function to utils.js

/**
 * Show a minimalist loading indicator on the map when data is loading
 * @param {HTMLElement} mapContainer - The map container element
 * @param {boolean} isLoading - Loading state
 */
export function showMapLoading(mapContainer, isLoading) {
  // Find or create the loading indicator
  let loadingIndicator = mapContainer.querySelector(".map-loading-indicator");

  if (!loadingIndicator && isLoading) {
    loadingIndicator = document.createElement("div");
    loadingIndicator.className = "map-loading-indicator";
    loadingIndicator.innerHTML = `
      <div class="map-loading-spinner"></div>
      <div class="map-loading-text">Updating map data...</div>
    `;
    mapContainer.appendChild(loadingIndicator);
  }

  // Add this CSS to your stylesheet
  /*
  .map-loading-indicator {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(255,255,255,0.9);
    border-radius: 4px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 5px rgba(0,0,0,0.1);
    z-index: 100;
    font-size: 14px;
    color: #666;
  }
  
  .map-loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.1);
    border-top-color: #666;
    border-radius: 50%;
    margin-right: 8px;
    animation: spin 0.8s linear infinite;
  }
  
  .map-loading-text {
    font-size: 14px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (max-width: 480px) {
    .map-loading-indicator {
      bottom: 10px;
      right: 10px;
      padding: 6px 10px;
      font-size: 12px;
    }
    
    .map-loading-spinner {
      width: 14px;
      height: 14px;
    }
  }
  */

  if (loadingIndicator) {
    if (isLoading) {
      loadingIndicator.style.display = "flex";

      // Auto-hide after a minimum time to prevent flashing
      setTimeout(() => {
        if (loadingIndicator && !isLoading) {
          loadingIndicator.style.display = "none";
        }
      }, 1000);
    } else {
      // Add fade-out animation
      loadingIndicator.style.opacity = "0";
      setTimeout(() => {
        if (loadingIndicator) {
          loadingIndicator.style.display = "none";
          loadingIndicator.style.opacity = "1";
        }
      }, 300);
    }
  }
}

// Use this in renderCurrentStep in main.js:

function renderCurrentStep() {
  if (!state.mapInitialized || !elements.svg) {
    console.warn("Cannot render map: not initialized");
    return;
  }

  // Show loading indicator when rendering starts
  showMapLoading(elements.mapContainer, true);

  // Update the step title
  updateStepTitle(state.currentStep);

  const svgElement = d3.select(elements.svg);

  // Delegate to the renderer, passing all necessary elements
  mapRenderer.renderCurrentStep(
    state,
    state.data,
    svgElement,
    state.dimensions,
    tooltipManager
  );

  // Update window location hash for easier sharing
  if (history.replaceState) {
    history.replaceState(null, null, `#section-${state.currentStep}`);
  }

  // Hide loading indicator when rendering completes
  // Slight delay to ensure map has time to render
  setTimeout(() => {
    showMapLoading(elements.mapContainer, false);
  }, 500);
}

// #endregion
