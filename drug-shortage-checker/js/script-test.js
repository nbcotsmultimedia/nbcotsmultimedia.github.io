// drugDetails.js

// Main function to display drug details
window.displayDrugDetails = function (drugs) {
  console.log("Displaying drug details for:", drugs);
  const resultsContainer = document.getElementById("results-container");
  if (resultsContainer) {
    resultsContainer.innerHTML = DrugResultHTML.create(drugs);
    addAccordionEventListeners();
  } else {
    console.error("Results container not found in the DOM");
  }
};

// Drug Result HTML Generation
const DrugResultHTML = {
  create: function (drugs) {
    if (!drugs || drugs.length === 0) {
      return "<p>No drug information available.</p>";
    }

    const genericName = drugs[0].genericName || "Unknown Generic Name";
    const category = drugs[0].therapeuticCategory || "Unknown Category";

    // Group drugs by manufacturer and brand name
    const groupedDrugs = this.groupDrugsByManufacturerAndBrand(drugs);

    return `
      <div class="drug-result">
        <h2>${genericName}</h2>
        <p class="drug-category">
          <span class="label">Used for:</span>
          <span class="value">${category}</span>
        </p>
        ${Object.values(groupedDrugs).map(this.createBrandInfoHTML).join("")}
      </div>
    `;
  },

  groupDrugsByManufacturerAndBrand: function (drugs) {
    return drugs.reduce((acc, drug) => {
      const key = `${drug.manufacturerName}-${drug.brandName}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(drug);
      return acc;
    }, {});
  },

  createBrandInfoHTML: function (drugGroup) {
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
          ${DrugResultHTML.createDosageItemsHTML(drug)}
        </div>
      </div>
    `;
  },

  createDosageItemsHTML: function (drug) {
    return `
      <div class="dosage-item">
        <div class="dosage-summary" data-index="0">
          <div class="icon-route-wrapper">
            <svg class="icon-route">
              <use xlink:href="#${IconUtils.getRouteIcon(drug.route)}"></use>
            </svg>
          </div>
          <span class="dosage-value">${drug.dosage}</span>
          <span class="availability ${StatusUtils.getStatusClass(
            drug.shortageStatus
          )}">
            ${StatusUtils.getStatusLabel(drug.shortageStatus)}
          </span>
          <span class="spacer"></span>
          <span class="expand-icon">${IconUtils.createSVGIcon("down")}</span>
        </div>
        <div class="shortage-details" style="display: none;">
          ${ShortageDetailsHTML.create(drug)}
        </div>
      </div>
    `;
  },
};

// Shortage Details HTML Generation
const ShortageDetailsHTML = {
  create: function (drug) {
    if (!drug || typeof drug !== "object") {
      console.error("Invalid drug object provided");
      return "";
    }

    console.log("Creating shortage details HTML for drug:", drug);

    const TIMELINE_HEIGHT = 300;
    const timelineEvents = this.createTimelineEvents(drug);
    const timelineHTML = this.generateTimelineHTML(
      timelineEvents,
      TIMELINE_HEIGHT
    );
    const shortageInfoHTML = this.generateShortageInfoHTML(drug);

    return `
      <div class="timeline-container">
        ${timelineHTML}
      </div>
      <div class="shortage-info">
        ${shortageInfoHTML}
      </div>
    `;
  },

  createTimelineEvents: function (drug) {
    const shortageReportedDate = new Date(drug.shortageReportedDate);
    const shortageUpdateDate = new Date(drug.shortageUpdateDate);
    const currentDate = new Date();

    let timelineEvents = [
      {
        date: shortageReportedDate,
        status: "Shortage",
        label: "Shortage reported",
      },
    ];

    switch (drug.shortageStatus.toLowerCase()) {
      case "resolved":
        timelineEvents.push(
          {
            date: shortageUpdateDate,
            status: "Resolved",
            label: "Shortage resolved",
          },
          { date: currentDate, status: "Resolved", label: "Drug available" }
        );
        break;
      case "current":
        timelineEvents.push(
          {
            date: shortageUpdateDate,
            status: "Shortage",
            label: "Shortage confirmed",
          },
          { date: currentDate, status: "Current", label: "Shortage ongoing" }
        );
        break;
      case "discontinued":
        timelineEvents.push({
          date: shortageUpdateDate,
          status: "Discontinued",
          label: "Drug discontinued",
        });
        break;
    }

    return timelineEvents.sort((a, b) => a.date - b.date);
  },

  generateTimelineHTML: function (timelineEvents, timelineHeight) {
    const timelineItems = timelineEvents
      .map((event, index) => {
        const topPosition = calculateTopPosition(
          index,
          timelineEvents.length,
          timelineHeight
        );
        return createTimelineItem(event, index, timelineEvents, topPosition);
      })
      .join("");

    return `
    <ol class="timeline" style="height: ${timelineHeight}px;">
      ${timelineItems}
    </ol>
  `;
  },

  generateShortageInfoHTML: function (drug) {
    const shortageReasonHTML = drug.shortageReason
      ? `<p class="shortage-reason"><span class="label">Shortage reason: </span>${drug.shortageReason}</p>`
      : "";

    const relatedInfoHTML = drug.relatedShortageInfo
      ? `<p class="related-info"><span class="label">Related information: </span>${drug.relatedShortageInfo}</p>`
      : "";

    const resolvedInfoHTML = drug.resolvedShortageInfo
      ? `<p class="resolved-info"><span class="label">Resolved shortage information: </span>${drug.resolvedShortageInfo}</p>`
      : "";

    return shortageReasonHTML + relatedInfoHTML + resolvedInfoHTML;
  },
};

// Utility functions
const IconUtils = {
  getRouteIcon: function (route) {
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
  },

  createSVGIcon: function (direction) {
    return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="${
        direction === "down" ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"
      }"></path>
    </svg>
  `;
  },
};

const StatusUtils = {
  getStatusClass: function (shortageStatus) {
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
  },

  getStatusLabel: function (shortageStatus) {
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
  },
};

const DateUtils = {
  formatDate: function (date) {
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  },

  formatDuration: function (days) {
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
  },
};

// Accordion functionality
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
    expandIcon.innerHTML = IconUtils.createSVGIcon("up");
  } else {
    shortageDetails.style.display = "none";
    expandIcon.innerHTML = IconUtils.createSVGIcon("down");
  }
}

// Initialization and setup
const DrugDetailsApp = {
  init: function () {
    console.log("Initializing Drug Details Application");
    this.setupEventListeners();
    // Remove loadInitialData call if it's not needed
  },

  setupEventListeners: function () {
    window.addEventListener("resize", this.handleResize.bind(this));
    document.addEventListener(
      "DOMContentLoaded",
      this.onDOMContentLoaded.bind(this)
    );
  },

  handleResize: function () {
    console.log("Window resized");
    // Implement any resize logic here, e.g., redrawing the timeline
  },

  onDOMContentLoaded: function () {
    console.log("DOM fully loaded");
    // Perform any actions that require the DOM to be fully loaded
    addAccordionEventListeners();
  },
};

// Initialize the application
(function () {
  DrugDetailsApp.init();
})();
