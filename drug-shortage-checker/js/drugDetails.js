// drugDetails.js

// Main function to display drug details
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

// Function to create shortage details HTML
function createShortageDetailsHTML(drug) {
  console.log("Creating shortage details HTML for drug:", drug);

  const reportedDate = new Date(drug.shortageReportedDate);
  const updateDate = new Date(drug.shortageUpdateDate);
  const currentDate = new Date();

  // Create and sort timeline events
  let timelineEvents = [
    { date: reportedDate, status: "Shortage", label: "Shortage reported" },
  ];

  // Determine the correct labels based on the status
  if (drug.shortageStatus.toLowerCase() === "resolved") {
    timelineEvents.push({
      date: updateDate,
      status: "Resolved",
      label: "Shortage resolved",
    });
    timelineEvents.push({
      date: currentDate,
      status: "Available",
      label: "Drug available",
    });
  } else if (
    drug.shortageStatus.toLowerCase() === "shortage" ||
    drug.shortageStatus.toLowerCase() === "current"
  ) {
    timelineEvents.push({
      date: updateDate,
      status: "Shortage",
      label: "Last updated",
    });
    timelineEvents.push({
      date: currentDate,
      status: "Current",
      label: "Shortage ongoing",
    });
  } else if (drug.shortageStatus.toLowerCase() === "discontinued") {
    timelineEvents.push({
      date: updateDate,
      status: "Discontinued",
      label: "Drug discontinued",
    });
  }

  console.log("Timeline events before sorting:", timelineEvents);

  // Sort events chronologically
  timelineEvents.sort((a, b) => a.date - b.date);

  console.log("Sorted timeline events:", timelineEvents);

  // Generate timeline HTML
  const timelineHeight = 300; // Adjust this value as needed

  // Calculate top position for each event
  const timelineHTML = timelineEvents
    .map((event, index) => {
      const topPosition = calculateTopPosition(
        index,
        timelineEvents.length,
        timelineHeight
      );
      return createTimelineItem(event, index, timelineEvents, topPosition);
    })
    .join("");

  console.log("Generated timeline HTML:", timelineHTML);

  return `
    <div class="timeline-container">
      <ol class="timeline" style="height: ${timelineHeight}px;">
        ${timelineHTML}
      </ol>
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

function calculateTopPosition(index, totalEvents, timelineHeight) {
  return (index / (totalEvents - 1)) * timelineHeight;
}

function createTimelineItem(event, index, timelineEvents, topPosition) {
  const isLast = index === timelineEvents.length - 1;
  const isCurrent = event.status.toLowerCase() === "current";

  const icon = getStatusIconSVG(event.status, isCurrent);

  return `
    <li class="timeline-item ${isLast ? "end" : ""} ${
    isCurrent ? "current" : ""
  }" style="top: ${topPosition}px;">
      ${icon}
      <div class="timeline-item-description">
        <p class="date">${formatDate(event.date)}</p>
        <p class="event">${event.label}</p>
      </div>
    </li>
  `;
}
// tktk

function createTimelineDurations(events, timelineHeight) {
  if (events.length < 2) return "";

  const durations = [];
  for (let i = 0; i < events.length - 2; i++) {
    const duration = calculateDuration(events[i].date, events[i + 1].date);
    const position =
      (calculatePosition(
        events[i].date,
        events[0].date,
        events[events.length - 2].date,
        timelineHeight - 100
      ) +
        calculatePosition(
          events[i + 1].date,
          events[0].date,
          events[events.length - 2].date,
          timelineHeight - 100
        )) /
      2;
    durations.push(`
      <div class="timeline-duration" style="top: ${position}px;">
        ${formatDuration(duration)}
      </div>
    `);
  }

  // We're no longer adding a duration for the last two events

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
    `Generating status icon for status: ${status}, isCurrent: ${isCurrent}, iconClass: ${iconClass}`
  );

  if (isCurrent) {
    return `
      <div class="timeline-item-icon ${iconClass} current">
        <div class="current-status-circle"></div>
      </div>
    `;
  }

  const svgContent = {
    shortage: "<svg ...></svg>",
    available: "<svg ...></svg>",
    discontinued: "<svg ...></svg>",
  };

  const svg = svgContent[iconClass] || "";
  console.log(`SVG content for ${iconClass}:`, svg);

  return `
    <div class="timeline-item-icon ${iconClass}">
      <svg viewBox="0 0 512 512" class="icon icon-timeline">
        ${svg}
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
    case "resolved":
      return "available";
    case "current":
      return "shortage";
    case "discontinued":
      return "discontinue";
    default:
      return "unknown";
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
