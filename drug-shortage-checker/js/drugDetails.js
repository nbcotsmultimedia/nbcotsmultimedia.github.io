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

function createShortageDetailsHTML(dosage) {
  console.log("Creating shortage details HTML for dosage:", dosage);

  const reportedDate = new Date(dosage.reportedDate);
  const resolvedDate = dosage.resolvedDate
    ? new Date(dosage.resolvedDate)
    : null;
  const currentDate = new Date();

  const isResolved = resolvedDate && dosage.status.toLowerCase() === "resolved";

  const timelineEvents = [
    { date: reportedDate, status: "shortage", label: "Shortage reported" },
    ...(isResolved
      ? [{ date: resolvedDate, status: "resolved", label: "Shortage resolved" }]
      : []),
    {
      date: currentDate,
      status: dosage.status.toLowerCase(),
      label: getStatusLabel(dosage.status),
    },
  ];

  const shortageDuration = calculateDuration(
    reportedDate,
    isResolved ? resolvedDate : currentDate
  );

  // Set a maximum height for the timeline
  const maxTimelineHeight = 302; // in pixels
  // Set a minimum height for very short durations
  const minTimelineHeight = 90; // in pixels
  // Calculate the timeline height based on the shortage duration
  let timelineHeight = Math.min(shortageDuration * 3, maxTimelineHeight);
  timelineHeight = Math.max(timelineHeight, minTimelineHeight);

  return `
    <div class="timeline-container">
      <ol class="timeline" style="height: ${timelineHeight}px;">
        ${timelineEvents
          .map((event, index) =>
            createTimelineItem(
              event,
              index,
              timelineEvents,
              isResolved,
              timelineHeight
            )
          )
          .join("")}
      </ol>
      ${createTimelineDurations(timelineEvents, timelineHeight)}
    </div>
    <div class="shortage-info">
      ${
        dosage.shortageReason
          ? `<p class="shortage-reason"><span class="label">Shortage reason: </span>${dosage.shortageReason}</p>`
          : ""
      }
      ${
        dosage.relatedInfo
          ? `<p class="related-info"><span class="label">Related information: </span>${dosage.relatedInfo}</p>`
          : ""
      }
    </div>
  `;
}

function createTimelineItem(
  event,
  index,
  allEvents,
  isResolved,
  timelineHeight
) {
  const isLast = index === allEvents.length - 1;
  const position = isLast ? "end" : index === 0 ? "start" : "middle";
  const statusClass = event.status.toLowerCase();
  const currentClass = isLast ? "current" : "";

  const itemPosition = calculatePosition(
    event.date,
    allEvents[0].date,
    allEvents[allEvents.length - 1].date,
    timelineHeight
  );

  return `
    <li class="timeline-item ${position} ${statusClass} ${currentClass}" style="top: ${itemPosition}px;">
      ${getStatusIconSVG(event.status, isLast)}
      <div class="timeline-item-description">
        <span class="date">${formatDate(event.date)}</span>
        <span class="event">${event.label}</span>
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

function getStatusLabel(status) {
  status = status.toLowerCase();
  switch (status) {
    case "available":
    case "resolved":
      return "Drug available";
    case "shortage":
    case "current":
      return "Shortage ongoing";
    case "tobediscontinued":
      return "To be discontinued";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
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
  const category = drugs[0].category || "Unknown Category";

  // Group drugs by manufacturer
  const groupedDrugs = drugs.reduce((acc, drug) => {
    const key = `${drug.manufacturer}-${drug.brandName}`;
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
          drug.manufacturer || "Unknown Manufacturer"
        }</span>
      </p>
      <div class="dosages">
        ${drugGroup.map(createDosageItemsHTML).join("")}
      </div>
    </div>
  `;
}

function createDosageItemsHTML(drug) {
  const dosages =
    Array.isArray(drug.dosages) && drug.dosages.length > 0
      ? drug.dosages
      : [
          {
            value: drug.dosage || "Unknown Dosage",
            status: drug.status || "Unknown Status",
            reportedDate: drug.reportedDate,
            resolvedDate: drug.resolvedDate,
            shortageReason: drug.shortageReason,
            relatedInfo: drug.relatedInfo,
          },
        ];

  return dosages
    .map(
      (dosage, index) => `
    <div class="dosage-item">
      <div class="dosage-summary" data-index="${index}">
        <div class="icon-route-wrapper">
          <svg class="icon-route">
            <use xlink:href="#${getRouteIcon(drug.route)}"></use>
          </svg>
        </div>
        <span class="dosage-value">${dosage.value}</span>
        <span class="availability ${getStatusClass(
          dosage.status
        )}">${getStatusLabel(dosage.status)}</span>
        <span class="spacer"></span>
        <span class="expand-icon">${createSVGIcon("down")}</span>
      </div>
      <div class="shortage-details" style="display: none;">
        ${createShortageDetailsHTML(dosage)}
      </div>
    </div>
  `
    )
    .join("");
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

function getStatusClass(status) {
  status = status.toLowerCase();
  switch (status) {
    case "available":
    case "resolved":
      return "available";
    case "shortage":
    case "current":
      return "shortage";
    case "tobediscontinued":
      return "discontinue";
    default:
      return "shortage"; // Default to shortage for unknown statuses
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
