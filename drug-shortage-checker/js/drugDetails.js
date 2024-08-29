// drugDetails.js

const MIN_SEGMENT_HEIGHT = 50; // Minimum height in pixels for a timeline segment

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

  const timelineHeight = calculateTimelineHeight(
    reportedDate,
    isResolved ? resolvedDate : currentDate
  );

  return `
    <div class="timeline-container" style="height: ${timelineHeight}px;">
      <ol class="timeline">
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
      ${createTimelineDurations(timelineEvents, isResolved, timelineHeight)}
    </div>
    ${
      dosage.shortageReason
        ? `<p class="shortage-reason">Shortage reason: ${dosage.shortageReason}</p>`
        : ""
    }
    ${
      dosage.relatedInfo
        ? `<p class="related-info">Related information: ${dosage.relatedInfo}</p>`
        : ""
    }
  `;
}

function createTimelineItem(event, index, allEvents, isResolved, totalHeight) {
  const isLast = index === allEvents.length - 1;
  const position = isLast ? "end" : index === 0 ? "start" : "";
  let style;

  if (isResolved && isLast) {
    style = `top: calc(100% + 20px);`; // Place the current status below the timeline
  } else {
    const topPosition = calculateSegmentPosition(
      event.date,
      allEvents[0].date,
      allEvents[allEvents.length - 2].date,
      totalHeight
    );
    style = `top: ${topPosition}px;`;
  }

  return `
    <li class="timeline-item ${position}" style="${style}">
      ${getStatusIconSVG(event.status, isLast)}
      <div class="timeline-item-description">
        <span class="date">${formatDate(event.date)}</span>
        <span class="event">${event.label}</span>
      </div>
    </li>
  `;
}

function createTimelineDurations(events, isResolved, totalHeight) {
  let durations = "";
  const lastEventIndex = events.length - (isResolved ? 2 : 1);

  for (let i = 0; i < lastEventIndex; i++) {
    const duration = calculateDuration(events[i].date, events[i + 1].date);
    const topPosition = calculateSegmentPosition(
      events[i].date,
      events[0].date,
      events[lastEventIndex].date,
      totalHeight
    );
    const nextTopPosition = calculateSegmentPosition(
      events[i + 1].date,
      events[0].date,
      events[lastEventIndex].date,
      totalHeight
    );
    const segmentHeight = nextTopPosition - topPosition;

    if (segmentHeight >= MIN_SEGMENT_HEIGHT) {
      durations += `
        <div class="timeline-duration" style="top: ${
          topPosition + segmentHeight / 2
        }px;">
          ${formatDuration(duration)}
        </div>
      `;
    }
  }

  const totalDuration = calculateDuration(
    events[0].date,
    events[events.length - 1].date
  );
  durations += `
    <div class="timeline-duration total-duration">
      Total duration: ${formatDuration(totalDuration)}
    </div>
  `;

  return durations;
}

function calculateTimelineHeight(startDate, endDate) {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  return Math.max(days * 2, MIN_SEGMENT_HEIGHT * 2, 100); // Ensure at least two segments can fit
}

function calculateSegmentPosition(date, startDate, endDate, totalHeight) {
  const total = endDate - startDate;
  const current = date - startDate;
  const rawPosition = (current / total) * totalHeight;

  // Ensure minimum segment height
  return Math.min(rawPosition, totalHeight - MIN_SEGMENT_HEIGHT);
}

// tktk

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
  if (status === "available" || status === "resolved") return "available";
  if (status === "shortage" || status === "current") return "shortage";
  if (status === "to be discontinued") return "discontinue";
  return "";
}

function getStatusLabel(status) {
  status = status.toLowerCase();
  if (status === "available" || status === "resolved") return "AVAILABLE";
  if (status === "shortage" || status === "current") return "SHORTAGE";
  if (status === "to be discontinued") return "TO BE DISCONTINUED";
  return status.toUpperCase();
}

function calculatePosition(date, startDate, endDate) {
  const total = endDate - startDate;
  const current = date - startDate;
  return (current / total) * 100;
}

function calculateDuration(startDate, endDate) {
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
}

function getStatusIconSVG(status, isCurrent = false) {
  const iconClass = status.toLowerCase();
  console.log(
    `Generating status icon for status: ${status}, isCurrent: ${isCurrent}`
  );

  if (isCurrent) {
    return `<div class="timeline-item-icon current ${iconClass}"></div>`;
  }

  const svgContent = {
    shortage:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5z"/><path d="M11 10h2v5h-2zm0 6h2v2h-2z"/></svg>',
    resolved:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
    current:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  };

  return `
    <div class="timeline-item-icon ${iconClass}">
      <svg viewBox="0 0 24 24" class="icon icon-timeline">
        ${svgContent[iconClass] || svgContent.current}
      </svg>
    </div>
  `;
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
