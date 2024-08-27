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

function createDrugResultHTML(drugs) {
  if (!drugs || drugs.length === 0) {
    return "<p>No drug information available.</p>";
  }
  const genericName = drugs[0].genericName || "Unknown Generic Name";
  const category = drugs[0].category || "Unknown Category";

  return `
    <div class="drug-result">
      <h2>${genericName}</h2>
      <p class="drug-category">${category}</p>
      ${drugs.map(createBrandInfoHTML).join("")}
    </div>
  `;
}

function createBrandInfoHTML(drug) {
  return `
    <div class="brand-info">
      <h3>${drug.brandName || "Unknown Brand"}</h3>
      <p class="manufacturer">${drug.manufacturer || "Unknown Manufacturer"}</p>
      <div class="dosages">
        ${createDosageItemsHTML(drug)}
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
        <span class="expand-icon">▼</span>
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

function getStatusIcon(status) {
  console.log(`Getting icon for status: ${status}`);
  const iconId =
    status.toLowerCase() === "current" ? "shortage" : status.toLowerCase();
  console.log(`Resolved icon ID: ${iconId}`);
  return iconId;
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
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496.2 550" id="icon-shortage"><path d="M389.27,178.63c-2.9-3.94-3.15-6.46-.16-10.48,34.41-46.25,68.62-92.64,102.88-139,1.37-1.85,2.62-3.79,4.21-6.1-2.43-.64-4-1.17-5.61-1.46-45.74-8.01-91.59-7.24-137.36-.86-35.43,4.94-70.72,10.94-106.07,16.44-41.24,6.42-82.57,8.89-124.13,3.09-22.35-3.12-44.17-8.34-65.37-16.03v-2.31C57.66,9.82,47.84,0,35.73,0h-13.8C9.82,0,0,9.82,0,21.93v506.14c0,12.11,9.82,21.93,21.93,21.93h13.8c12.11,0,21.93-9.82,21.93-21.93v-201.39c.41.12.82.24,1.22.37,27.43,9.06,55.51,15.18,84.2,18.47,38.27,4.4,76.35,2.02,114.27-3.8,44.84-6.88,89.53-14.93,134.5-20.71,20.36-2.62,41.29-1.51,61.94-1.05,13.75.31,27.46,2.48,41.75,3.87-1.06-1.55-1.86-2.78-2.72-3.96-34.48-47.11-68.91-94.26-103.55-141.25Z"/></svg>',
    resolved:
      '<svg id="icon-resolved" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 456.7"><path d="M550,59.32c.15,14.71-4.49,27.45-13.44,39-46.75,60.31-93.36,120.71-140.07,181.05-40.18,51.91-80.31,103.86-120.69,155.61-20.7,26.52-62.54,29.16-86.57,5.7-13.6-13.29-25.2-28.39-37.63-42.75-17.67-20.44-35.17-41.03-52.74-61.56-19.47-22.76-38.92-45.54-58.41-68.29-8.54-9.97-17.03-19.98-25.75-29.78-22.14-24.89-18.89-65.5,7.2-86.18,11.09-8.8,23.63-13.94,36.85-13.28,22.1-.4,37.67,9.38,50.72,24.82,23.21,27.48,46.72,54.71,70.12,82.03,14.36,16.77,28.73,33.54,43.08,50.33,4.45,5.21,4.73,5.2,9.05-.38,31.77-41.03,63.54-82.06,95.31-123.09,37.81-48.85,75.73-97.61,113.36-146.58C453.31,9.14,469.85-.13,491.12,0c32.57.2,58.55,26.75,58.88,59.32Z"/></svg>',
    discontinued:
      '<svg id="icon-discontinued" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 550 550.04"><path d="M550,274.85c0,152.33-122.93,275.21-275.28,275.19C123.34,550.02-.35,426.14,0,274.91.36,123.24,123.65.04,275.1,0c151.55-.04,274.91,123.3,274.9,274.85ZM159.62,106.9c94.68,94.72,189.18,189.26,283.59,283.71,50.34-67.05,53.98-180.33-21.13-257.79-76.62-79.01-192.31-77.76-262.46-25.92ZM107.46,158.76c-55.14,75.19-53.11,197.66,36.05,272.9,85.51,72.15,196.32,52.88,247.27,10.63-94.3-94.37-188.67-188.8-283.32-283.53Z"/></svg>',
  };

  return `
    <div class="timeline-item-icon ${iconClass}">
      <svg viewBox="0 0 24 24" class="icon icon-timeline">
        ${svgContent[iconClass] || ""}
      </svg>
    </div>
  `;
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

function createShortageDetailsHTML(dosage) {
  console.log("Creating shortage details HTML for dosage:", dosage);
  const hasShortageInfo =
    dosage.reportedDate || dosage.shortageReason || dosage.relatedInfo;
  console.log("Has shortage info:", hasShortageInfo);

  if (!hasShortageInfo) {
    return "<p>No shortage information available for this dosage.</p>";
  }

  const reportedDate = new Date(dosage.reportedDate);
  const currentDate = new Date();
  const duration = Math.ceil(
    (currentDate - reportedDate) / (1000 * 60 * 60 * 24)
  );

  return `
    <ol class="timeline">
      <li class="timeline-item">
        ${getStatusIconSVG("shortage")}
        <div class="timeline-item-description">
          <span class="date">${formatDate(dosage.reportedDate)}</span>
          <span class="event">Shortage reported</span>
          <span class="timeline-duration">${formatDuration(duration)}</span>
        </div>
      </li>
      <li class="timeline-item">
        ${getStatusIconSVG("shortage", true)}
        <div class="timeline-item-description">
          <span class="date">${formatDate(currentDate)}</span>
          <span class="event">Shortage ongoing</span>
        </div>
      </li>
    </ol>
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

function formatDate(dateString) {
  if (!dateString) return "Unknown Date";
  const options = { year: "numeric", month: "numeric", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
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

function createSVGIcon(direction) {
  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="${
        direction === "down" ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"
      }"></path>
    </svg>
  `;
}
