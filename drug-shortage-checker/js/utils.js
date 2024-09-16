// utils.js

//#region - CONSTANTS

// Constants for different drug status types and their corresponding CSS classes and labels
const STATUS_INFO = {
  resolved: { class: "resolved", label: "Available" },
  "no shortage reported": { class: "resolved", label: "No Shortage" },
  shortage: { class: "shortage", label: "Shortage" },
  discontinued: { class: "discontinued", label: "Discontinued" },
  // Add any other possible statuses here
  unknown: { class: "unknown", label: "Unknown Status" },
};

//#endregion

//#region - DATE AND DURATION FUNCTIONS

// Format a date string to MM/DD/YYYY format
/**
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Format a duration in days to a human-readable string (i.e., '2 days')
/**
 * @param {number} days - The number of days
 * @returns {string} Formatted duration string
 */
function formatDuration(days) {
  if (days < 30) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    return `${years} year${years !== 1 ? "s" : ""}${
      remainingMonths > 0
        ? ` ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
        : ""
    }`;
  }
}

// Calculate the duration between two dates and format it
/**
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {string|null} Formatted duration string or null if no duration should be shown
 */
function calculateDuration(startDate, endDate) {
  // Calculate the number of days between start and end date
  const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Don't show duration if the two dates are the same
  if (
    days === 0 ||
    (endDate.getTime() === new Date().setHours(0, 0, 0, 0) &&
      ["Shortage resolved", "Drug available", "Drug discontinued"].includes(
        endDate.label
      ))
  ) {
    return null;
  }

  // Otherwise, format using formatDuration()
  return formatDuration(days);
}

//#endregion

//#region - UI HELPER FUNCTIONS

// Get the appropriate icon for a given route of administration
/**
 * @param {string} route - The route of administration
 * @returns {string} The icon identifier
 */
function getRouteIcon(route) {
  const routeIcons = {
    // Inhaler
    inhalation: "icon-inhaler",
    // Pill
    oral: "icon-pill",
    tablet: "icon-pill",
    pill: "icon-pill",
    capsule: "icon-pill",
    // Syringe
    injection: "icon-syringe",
    injectable: "icon-syringe",
    // Other
    other: "icon-other",
  };

  const normalizedRoute = route.toLowerCase().trim();

  // Check for exact matches
  if (routeIcons.hasOwnProperty(normalizedRoute)) {
    return routeIcons[normalizedRoute];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(routeIcons)) {
    if (normalizedRoute.includes(key)) {
      return value;
    }
  }

  // If no match is found, return the default icon without logging a warning
  return "icon-other";
}

// Highlight matched text within a string
/**
 * @param {string} text - The text to search within
 * @param {string} searchTerm - The term to highlight
 * @returns {string} Text with highlighted matches
 */
function highlightMatch(text, searchTerm) {
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

//#endregion

//#region - PERFORMANCE OPTIMIZATION

// Debounce function to optimize performance
/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * @param {Function} func - The original function to debounce
 * @param {number} delay - The number of milliseconds to wait before executing the function
 * @returns {Function} The debounced function
 */
function debounce(func, delay) {
  // Declare a variable 'timeoutId' to keep track of the timeout
  let timeoutId;

  // Return a new function that clears any existing timeout and sets a new timeout
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

//#endregion

//#region - STRING MANIPULATION

// Escape special characters in a string (for use in a RegExp)
/**
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

//#endregion

//#region - CROSS-DOMAIN COMMUNICATION

// Signal the parent iframe to resize
/**
 * @global
 */
window.signalIframeResize = function () {
  if (
    window.parent !== window &&
    typeof xtalk !== "undefined" &&
    xtalk.signalIframe
  ) {
    try {
      xtalk.signalIframe();
    } catch (error) {
      console.warn("Error calling xtalk.signalIframe:", error);
    }
  } else {
    console.log(
      "Page is not in an iframe or xtalk is not available. Skipping iframe resize signal."
    );
  }
};

//#endregion

//#region - GLOBAL EXPORTS

// Export all functions as a single object
window.Utils = {
  STATUS_INFO,
  formatDate,
  formatDuration,
  calculateDuration,
  getRouteIcon,
  highlightMatch,
  debounce,
  escapeRegExp,
  signalIframeResize,
};

//#endregion
