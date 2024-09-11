// drugDetails.js

window.displayDrugDetails = function (drugs) {
  console.log("Displaying drug details for:", drugs);
  const resultsContainer = document.getElementById("results-container");
  if (resultsContainer) {
    resultsContainer.innerHTML = createDrugResultHTML(drugs);
    addAccordionEventListeners();
  } else {
    console.error("Results container not found in the DOM");
  }
};

function createShortageDetailsHTML(drug) {
  console.log("Creating shortage details HTML for drug:", drug);

  const reportedDate = new Date(drug.shortageReportedDate);
  const updateDate = new Date(drug.shortageUpdateDate);
  const currentDate = new Date();

  let timelineEvents = [
    { date: reportedDate, status: "shortage", label: "Shortage reported" },
    {
      date: updateDate,
      status: drug.shortageStatus.toLowerCase(),
      label: "Last updated",
    },
    {
      date: currentDate,
      status: drug.shortageStatus.toLowerCase(),
      label: "Current status",
    },
  ];

  // Remove duplicate dates, keeping the latest status
  timelineEvents = timelineEvents.reduce((acc, event) => {
    const existingEvent = acc.find(
      (e) => e.date.getTime() === event.date.getTime()
    );
    if (existingEvent) {
      existingEvent.status = event.status;
      existingEvent.label = event.label;
    } else {
      acc.push(event);
    }
    return acc;
  }, []);

  // Sort events chronologically
  timelineEvents.sort((a, b) => a.date - b.date);

  const shortageDuration = calculateDuration(reportedDate, currentDate);

  // Set a maximum height for the timeline
  const maxTimelineHeight = 302; // in pixels
  // Set a minimum height for very short durations
  const minTimelineHeight = 180; // Increased to accommodate static spacing
  // Calculate the timeline height based on the shortage duration
  let timelineHeight = Math.min(
    Math.max(shortageDuration * 3, minTimelineHeight),
    maxTimelineHeight
  );

  return `
    <div class="timeline-container">
      <ol class="timeline" style="height: ${timelineHeight}px;">
        ${timelineEvents
          .map((event, index) =>
            createTimelineItem(event, index, timelineEvents, timelineHeight)
          )
          .join("")}
      </ol>
      ${createTimelineDurations(timelineEvents, timelineHeight)}
    </div>
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

function createTimelineItem(event, index, allEvents, timelineHeight) {
  const totalEvents = allEvents.length;
  const isLast = index === totalEvents - 1;
  const isSecondToLast = index === totalEvents - 2;
  const isFirst = index === 0;

  // Skip middle items if status hasn't changed
  if (
    !isFirst &&
    !isLast &&
    !isSecondToLast &&
    event.status === allEvents[index - 1].status
  ) {
    return "";
  }

  // Determine position class
  const positionClass = isLast ? "end" : isFirst ? "start" : "middle";

  // Determine status class
  const statusClass = getStatusClass(event.status);

  // Determine if this is the current item
  const currentClass = isLast ? "current" : "";

  // Calculate item position
  let itemPosition;
  const bottomMargin = 60; // Space from bottom for last item
  const staticSpacing = 40; // Static spacing between last two items

  if (isLast) {
    itemPosition = timelineHeight - bottomMargin;
  } else if (isSecondToLast) {
    itemPosition = timelineHeight - bottomMargin - staticSpacing;
  } else if (isFirst) {
    itemPosition = 0;
  } else {
    const availableHeight = timelineHeight - bottomMargin - staticSpacing;
    itemPosition = calculatePosition(
      event.date,
      allEvents[0].date,
      allEvents[totalEvents - 2].date,
      availableHeight
    );
  }

  // Determine event text
  let eventText;
  if (isFirst) {
    eventText = "Shortage reported";
  } else if (isLast && event.status === "shortage") {
    eventText = "Shortage ongoing";
  } else {
    eventText = event.label || "Status update";
  }

  // Generate HTML
  return `
    <li class="timeline-item ${positionClass} ${statusClass} ${currentClass}" style="top: ${itemPosition}px;">
      ${getStatusIconSVG(event.status, isLast)}
      <div class="timeline-item-description">
        <span class="date">${formatDate(event.date)}</span>
        <span class="event">${eventText}</span>
      </div>
    </li>
  `;
}

function createTimelineDurations(events, timelineHeight) {
  if (events.length < 2) return "";

  const durations = [];
  for (let i = 0; i < events.length - 1; i++) {
    const duration = calculateDuration(events[i].date, events[i + 1].date);
    const position =
      (calculatePosition(
        events[i].date,
        events[0].date,
        events[events.length - 1].date,
        timelineHeight
      ) +
        calculatePosition(
          events[i + 1].date,
          events[0].date,
          events[events.length - 1].date,
          timelineHeight
        )) /
      2;
    durations.push(`
      <div class="timeline-duration" style="top: ${position}px;">
        ${formatDuration(duration)}
      </div>
    `);
  }

  return durations.join("");
}

function calculatePosition(date, startDate, endDate, totalHeight) {
  const total = endDate - startDate;
  const current = date - startDate;
  return (current / total) * totalHeight;
}

function getStatusIconSVG(status, isCurrent = false) {
  const iconClass = getStatusClass(status);
  console.log(
    `Generating status icon for status: ${status}, isCurrent: ${isCurrent}`
  );

  if (isCurrent) {
    return `
      <div class="timeline-item-icon ${iconClass} current">
        <div class="current-status-circle"></div>
      </div>
    `;
  }

  const svgContent = {
    shortage:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512"><path d="M96 64c0-17.7-14.3-32-32-32S32 46.3 32 64l0 256c0 17.7 14.3 32 32 32s32-14.3 32-32L96 64zM64 480a40 40 0 1 0 0-80 40 40 0 1 0 0 80z"/></svg>',
    available:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>',
    discontinue:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg>',
  };

  return `
    <div class="timeline-item-icon ${iconClass}">
      <svg viewBox="0 0 512 512" class="icon icon-timeline">
        ${svgContent[iconClass] || ""}
      </svg>
    </div>
  `;
}

function calculateDuration(startDate, endDate) {
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
}

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

function createBrandInfoHTML(drugGroup) {
  const drug = drugGroup[0]; // Take the first drug for brand and manufacturer info
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

function createDosageItemsHTML(drug) {
  return `
    <div class="dosage-item">
      <div class="dosage-summary" data-index="0">
        <div class="icon-route-wrapper">
          <svg class="icon-route">
            <use xlink:href="#${getRouteIcon(drug.route)}"></use>
          </svg>
        </div>
        <span class="dosage-value">${drug.dosage}</span>
        <span class="availability ${getStatusClass(
          drug.shortageStatus
        )}">${getStatusLabel(drug.shortageStatus)}</span>
        <span class="spacer"></span>
        <span class="expand-icon">${createSVGIcon("down")}</span>
      </div>
      <div class="shortage-details" style="display: none;">
        ${createShortageDetailsHTML(drug)}
      </div>
    </div>
  `;
}

function getRouteIcon(route) {
  switch (route.toLowerCase()) {
    case "inhalation":
      return "icon-inhaler";
    case "oral":
    case "tablet":
    case "capsule":
      return "icon-pill";
    case "injection":
    case "injectable":
      return "icon-syringe";
    default:
      console.warn(`Unknown route: ${route}, using default icon`);
      return "icon-other";
  }
}

function getStatusClass(shortageStatus) {
  switch (shortageStatus.toLowerCase()) {
    case "no shortage reported":
    case "resolved":
      return "available";
    case "shortage":
    case "current":
      return "shortage";
    case "discontinued":
      return "discontinue";
    default:
      return "unknown"; // Default class for unknown statuses
  }
}

function getStatusLabel(shortageStatus) {
  switch (shortageStatus.toLowerCase()) {
    case "no shortage reported":
      return "No Shortage";
    case "resolved":
      return "Resolved";
    case "shortage":
    case "current":
      return "Shortage";
    case "discontinued":
      return "Discontinued";
    default:
      return shortageStatus; // Return the original status if it doesn't match any known category
  }
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

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

function createSVGIcon(direction) {
  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="${
        direction === "down" ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"
      }"></path>
    </svg>
  `;
}

function addAccordionEventListeners() {
  const dosageSummaries = document.querySelectorAll(".dosage-summary");
  dosageSummaries.forEach((summary) => {
    summary.addEventListener("click", toggleAccordion);
  });
}

function toggleAccordion(event) {
  const dosageItem = event.currentTarget.closest(".dosage-item");
  const shortageDetails = dosageItem.querySelector(".shortage-details");
  const expandIcon = dosageItem.querySelector(".expand-icon");

  if (shortageDetails.style.display === "none") {
    shortageDetails.style.display = "block";
    expandIcon.innerHTML = createSVGIcon("up");
  } else {
    shortageDetails.style.display = "none";
    expandIcon.innerHTML = createSVGIcon("down");
  }
}
