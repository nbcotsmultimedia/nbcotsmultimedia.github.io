// drugDetails.js

// Constants
const STATUS_INFO = {
  resolved: { class: "resolved", label: "Available" },
  "no shortage reported": { class: "resolved", label: "No Shortage" },
  shortage: { class: "shortage", label: "Shortage" },
  discontinued: { class: "discontinued", label: "Discontinued" },
  // Add any other possible statuses here
  unknown: { class: "unknown", label: "Unknown Status" },
};

// Main Function
window.displayDrugDetails = function (drugs) {
  console.log("Displaying drug details for:", drugs);
  const resultsContainer = document.getElementById("results-container");
  if (resultsContainer) {
    resultsContainer.innerHTML = createDrugResultHTML(drugs);
    addAccordionEventListeners();
  } else {
    console.error("Results container not found in the DOM");
  }
  xtalk.signalIframe();
};

// HTML Generation Functions

/**
 * Creates the HTML for the shortage details of a drug
 * @param {Object} drug - The drug object
 * @returns {string} HTML string for shortage details
 */
function createShortageDetailsHTML(drug) {
  const reportedDate = new Date(drug.shortageReportedDate);
  const updateDate = new Date(drug.shortageUpdateDate);
  const currentDate = new Date();

  let timelineEvents = [
    { date: reportedDate, status: "Shortage", label: "Shortage reported" },
  ];

  const lowerStatus = drug.shortageStatus.toLowerCase();

  switch (lowerStatus) {
    case "resolved":
      timelineEvents.push(
        { date: updateDate, status: "Resolved", label: "Shortage resolved" },
        { date: currentDate, status: "Resolved", label: "Drug available" }
      );
      break;
    case "current":
      timelineEvents.push({
        date: currentDate,
        status: "Shortage",
        label: "Shortage ongoing",
      });
      break;
    case "discontinued":
      timelineEvents.push(
        {
          date: updateDate,
          status: "Discontinued",
          label: "Drug discontinued",
        },
        { date: currentDate, status: "Discontinued", label: "Drug unavailable" }
      );
      break;
  }

  timelineEvents.sort((a, b) => a.date - b.date);
  timelineEvents[timelineEvents.length - 1].isCurrent = true;

  const timelineHeight = 300;
  const timelineHTML = timelineEvents
    .map((event, index) => {
      const topPosition =
        (index / (timelineEvents.length - 1)) * timelineHeight;
      return createTimelineItem(event, index, timelineEvents, topPosition);
    })
    .join("");

  let additionalInfo = "";
  if (
    drug.shortageReason ||
    drug.relatedShortageInfo ||
    drug.resolvedShortageInfo
  ) {
    additionalInfo = `
      <div class="spacer" style="height: 0.5rem;"></div>
      <div class="shortage-info">
        ${
          drug.shortageReason
            ? `<p class="shortage-reason"><span class="label">Shortage reason: </span>${drug.shortageReason}</p>`
            : ""
        }
        ${
          drug.relatedShortageInfo
            ? `<p class="related-info"><span class="label">Related information: </span>${drug.relatedShortageInfo}</p>`
            : ""
        }
        ${
          drug.resolvedShortageInfo
            ? `<p class="resolved-info"><span class="label">Resolved shortage information: </span>${drug.resolvedShortageInfo}</p>`
            : ""
        }
      </div>
    `;
  }

  return `
    <div class="timeline-container">
      <ol class="timeline timeline-wrapper" style="height: ${timelineHeight}px;">
        ${timelineHTML}
      </ol>
    </div>
    ${additionalInfo}
  `;
}

/**
 * Creates a timeline item for the shortage details
 * @param {Object} event - The timeline event
 * @param {number} index - The index of the event
 * @param {Array} timelineEvents - All timeline events
 * @param {number} topPosition - The top position for the item
 * @returns {string} HTML string for the timeline item
 */
function createTimelineItem2(event, index, timelineEvents, topPosition) {
  const status = event.status.toLowerCase();
  const statusInfo = STATUS_INFO[status] || STATUS_INFO.unknown;

  return `
    <div class="timeline-item" style="top: ${topPosition}px">
      <div class="timeline-item-icon ${event.isCurrent ? "current" : ""}">
        <div class="current-status-circle ${statusInfo.class}"></div>
      </div>
      <div class="timeline-item-content">
        <div class="timeline-item-date">${event.date.toLocaleDateString()}</div>
        <div class="timeline-item-label">${event.label}</div>
      </div>
    </div>
  `;
}

function createTimelineItem(event, index, timelineEvents, topPosition) {
  let durationText = "";

  if (event.status === "Resolved" || event.status === "Discontinued") {
    const previousEvent = timelineEvents.find((e) => e.status === "Shortage");
    if (previousEvent) {
      const duration = Math.round(
        (event.date - previousEvent.date) / (1000 * 60 * 60 * 24)
      );
      durationText = `${duration} days`;
    }
  } else if (event.status === "Shortage" && event.isCurrent) {
    const duration = Math.round(
      (new Date() - event.date) / (1000 * 60 * 60 * 24)
    );
    durationText = `${duration} days ongoing`;
  }

  return `
    <div class="timeline-item" style="top: ${topPosition}px">
      <div class="timeline-item-icon ${event.isCurrent ? "current" : ""}">
        <div class="current-status-circle ${event.status.toLowerCase()}"></div>
      </div>
      <div class="timeline-item-content">
        <div class="timeline-item-date">${event.date.toLocaleDateString()}</div>
        <div class="timeline-item-label">${event.label}</div>
        ${
          durationText ? `<div class="duration-text">${durationText}</div>` : ""
        }
      </div>
    </div>
  `;
}

/**
 * Generates the SVG icon for a given status
 * @param {string} status - The status
 * @param {boolean} isCurrent - Whether the status is current
 * @returns {string} HTML string for the status icon
 */
function getStatusIconSVG(status, isCurrent) {
  // Save status variable
  const iconClass = status.toLowerCase();

  if (isCurrent) {
    return `
      <div class="timeline-item-icon current">
        <div class="current-status-circle ${iconClass}"></div>
      </div>
    `;
  }

  // Define SVG content for different statuses
  const svgContent = {
    // Exclaimation point icon
    shortage:
      '<path d="M7.005 3.1a1 1 0 1 1 1.99 0l-.388 6.35a.61.61 0 0 1-1.214 0zM7 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0"/>',
    // Check mark icon
    resolved:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
      '<path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>' +
      "</svg>",
    // Crossed circle icon
    discontinued:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
      '<path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>',
  };

  // Final return statement for non-current items
  return `
    <div class="timeline-item-icon ${iconClass}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        ${svgContent[iconClass] || svgContent.shortage}
      </svg>
    </div>
  `;
}

/**
 * Creates the main drug result HTML
 * @param {Array} drugs - Array of drug objects
 * @returns {string} HTML string for the drug result
 */
function createDrugResultHTML(drugs) {
  if (!drugs || drugs.length === 0) {
    return "<p>No drug information available.</p>";
  }

  const genericName = drugs[0].genericName || "Unknown Generic Name";
  const category = drugs[0].therapeuticCategory || "Unknown Category";

  // Group drugs by manufacturer and brand name
  const groupedDrugs = drugs.reduce((acc, drug) => {
    const key = `${drug.manufacturerName}-${drug.brandName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(drug);
    return acc;
  }, {});

  return `
    <div class="drug-result">
      <h2>${genericName}</h2>
      <p class="drug-category">
        <span class="label">Used for:</span>
        <span class="value">${category}</span>
      </p>
      ${Object.values(groupedDrugs).map(createBrandInfoHTML).join("")}
    </div>
  `;
}

/**
 * Creates the HTML for brand information
 * @param {Array} drugGroup - Group of drugs with the same brand and manufacturer
 * @returns {string} HTML string for brand information
 */
function createBrandInfoHTML(drugGroup) {
  const drug = drugGroup[0];
  return `
    <div class="brand-info">
      <h3>${drug.brandName || "Unknown Brand"}</h3>
      <p class="manufacturer">
        <span class="label">Manufactured by:</span>
        <span class="value">${
          drug.manufacturerName || "Unknown Manufacturer"
        }</span>
      </p>
      <p class="manufacturer">
        <span class="label">Contact:</span>
        <span class="value">${drug.manufacturerContact || "N/A"}</span>
      </p>
      <div class="dosages">
        ${createDosageItemsHTML(drug)}
      </div>
    </div>
  `;
}

/**
 * Creates the HTML for dosage items
 * @param {Object} drug - The drug object
 * @returns {string} HTML string for dosage items
 */
function createDosageItemsHTML(drug) {
  const status = drug.shortageStatus.toLowerCase();

  // Derive class and label directly from the status
  let statusClass, statusLabel;

  switch (status) {
    case "resolved":
    case "no shortage reported":
      statusClass = "resolved";
      statusLabel = status === "resolved" ? "Available" : "No Shortage";
      break;
    case "current":
      statusClass = "shortage";
      statusLabel = "Shortage";
      break;
    case "discontinued":
      statusClass = "discontinued";
      statusLabel = "Discontinued";
      break;
    default:
      statusClass = "unknown";
      statusLabel = "Unknown Status";
      console.warn(`Unknown shortage status: ${drug.shortageStatus}`);
  }

  return `
    <div class="dosage-item">
      <div class="dosage-summary" data-index="0">
        <div class="icon-route-wrapper">
          <svg class="icon-route">
            <use xlink:href="#${getRouteIcon(drug.route)}"></use>
          </svg>
        </div>
        <span class="dosage-value">${drug.dosage}</span>
        <span class="availability ${statusClass}">${statusLabel}</span>
        <span class="spacer"></span>
        <span class="expand-icon">${createSVGIcon("down")}</span>
      </div>
      <div class="shortage-details" style="display: none;">
        ${createShortageDetailsHTML(drug)}
      </div>
    </div>
  `;
}

// Utility Functions

/**
 * Gets the appropriate icon for a given route of administration
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

/**
 * Formats a duration in days to a human-readable string
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

/**
 * Creates an SVG icon for the expand/collapse functionality
 * @param {string} direction - The direction of the icon ("up" or "down")
 * @returns {string} SVG string for the icon
 */
function createSVGIcon(direction) {
  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="${
        direction === "down" ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"
      }"></path>
    </svg>
  `;
}

// Event Listeners

/**
 * Adds click event listeners to all dosage summary elements
 */
function addAccordionEventListeners() {
  document.querySelectorAll(".dosage-summary").forEach((summary) => {
    summary.addEventListener("click", toggleAccordion);
  });
}

/**
 * Toggles the visibility of shortage details when a dosage summary is clicked
 * @param {Event} event - The click event
 */
function toggleAccordion(event) {
  const dosageItem = event.currentTarget.closest(".dosage-item");
  const shortageDetails = dosageItem.querySelector(".shortage-details");
  const expandIcon = dosageItem.querySelector(".expand-icon");

  shortageDetails.style.display =
    shortageDetails.style.display === "none" ? "block" : "none";
  expandIcon.innerHTML = createSVGIcon(
    shortageDetails.style.display === "none" ? "down" : "up"
  );
}

/**
 * Creates a timeline item for the shortage details
 * @param {Object} event - The timeline event
 * @param {number} index - The index of the event
 * @param {Array} timelineEvents - All timeline events
 * @param {number} topPosition - The top position for the item
 * @returns {string} HTML string for the timeline item
 */
function createTimelineItem(event, index, timelineEvents, topPosition) {
  const isLast = index === timelineEvents.length - 1;
  const iconHtml = getStatusIconSVG(event.status, isLast);

  // Calculate duration line
  let durationLine = "";
  if (index < timelineEvents.length - 1) {
    const nextEvent = timelineEvents[index + 1];
    const duration = calculateDuration(event.date, nextEvent.date);
    if (duration) {
      const lineHeight = nextEvent.topPosition - topPosition - 20; // Adjust for icon size
      durationLine = `
        <div class="duration-line" style="height: ${lineHeight}px;">
          <span class="duration-text">${duration}</span>
        </div>
      `;
    }
  }

  console.log(`Creating timeline item:`, {
    event,
    index,
    isLast,
    topPosition,
    iconHtml,
    durationLine,
  });

  return `
    <li class="timeline-item ${
      isLast ? "current" : ""
    }" style="top: ${topPosition}px;">
      ${iconHtml}
      <div class="timeline-item-description">
        <p class="date">${event.date.toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        })}</p>
        <p class="event">${event.label}</p>
      </div>
      ${durationLine}
    </li>
  `;
}

/**
 * Calculates the duration between two dates and formats it
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {string|null} Formatted duration string or null if no duration should be shown
 */
function calculateDuration(startDate, endDate) {
  const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Don't show duration for certain cases
  if (
    days === 0 ||
    (endDate.getTime() === new Date().setHours(0, 0, 0, 0) &&
      ["Shortage resolved", "Drug available", "Drug discontinued"].includes(
        endDate.label
      ))
  ) {
    return null;
  }

  return formatDuration(days);
}
