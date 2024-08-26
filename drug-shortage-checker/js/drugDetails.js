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
        ${getRouteIconSVG(drug.route)}
        <span class="dosage-value">${dosage.value}</span>
        <span class="availability ${getStatusClass(
          dosage.status
        )}">${getStatusLabel(dosage.status)}</span>
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

function getRouteIconSVG(route) {
  const iconId = getRouteIcon(route);
  console.log(`Inserting icon for route: ${route}, iconId: ${iconId}`);
  const iconHTML = `<img src="assets/images/icons-route/${iconId.replace(
    "icon-",
    ""
  )}.svg" alt="${route} icon" class="icon icon-route">`;
  console.log("Icon HTML:", iconHTML);
  return iconHTML;
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
    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-icon">${getStatusIconSVG("shortage")}</div>
        <div class="timeline-content">
          <p class="date">${formatDate(dosage.reportedDate)}</p>
          <p class="event">Shortage reported</p>
        </div>
      </div>
      <p class="timeline-duration">${formatDuration(duration)}</p>
      <div class="timeline-item">
        <div class="timeline-icon">${getStatusIconSVG("current")}</div>
        <div class="timeline-content">
          <p class="date">${formatDate(currentDate)}</p>
          <p class="event">Shortage ongoing</p>
        </div>
      </div>
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
  console.log("Generated timeline HTML:", timelineHtml);
  return timelineHtml;
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

function getStatusIconSVG(status) {
  const iconId = getStatusIcon(status);
  console.log(
    `Generating status icon SVG for status: ${status}, iconId: ${iconId}`
  );
  return `
    <div class="icon-wrapper timeline-icon">
      <div class="icon-circle"></div>
      <img src="assets/images/icons-timeline/${iconId}.svg" 
           alt="${status} icon" 
           class="icon icon-timeline icon-${iconId}"
           onerror="this.onerror=null; this.src='assets/images/icons-timeline/other.svg';">
    </div>
  `;
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
