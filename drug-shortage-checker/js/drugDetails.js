// drugDetails.js

//#region - MAIN DISPLAY FUNCTION

// Main function to display drug details
window.displayDrugDetails = function (drugs) {
  // Log the drug details to the console
  console.log("Displaying drug details for:", drugs);

  // Find the HTML element with the UD 'results-container'
  const resultsContainer = document.getElementById("results-container");

  // If found, set the inner HTML of this container using createDrugResultHTML(drugs)
  if (resultsContainer) {
    resultsContainer.innerHTML = createDrugResultHTML(drugs);
    setTimeout(() => {
      // Set up event listeners
      addAccordionEventListeners();
      // Resize the iframe
      signalIframeResize();
    }, 0);
  } else {
    console.error("Results container not found in the DOM");
  }
};

//#endregion

//#region - DRUG RESULT HTML GENERATION

// Create the main drug result HTML
function createDrugResultHTML(drugs) {
  if (!drugs || drugs.length === 0) {
    return "<p>No drug information available.</p>";
  }

  const genericName = drugs[0].genericName || "Unknown Generic Name";
  const category = drugs[0].therapeuticCategory || "Unknown Category";
  const groupedDrugs = groupDrugsByManufacturerAndBrand(drugs);

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

// Helper function to group drugs by manufacturer and brand
function groupDrugsByManufacturerAndBrand(drugs) {
  return drugs.reduce((acc, drug) => {
    const key = `${drug.manufacturerName}-${drug.brandName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(drug);
    return acc;
  }, {});
}

//#endregion

// #region - GENERATE BRAND INFO HTML

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

//#endregion

//#region - GENERATE DOSAGE INFO HTML

function createDosageItemsHTML(drug) {
  const { statusClass, statusLabel } = getStatusInfo(drug.shortageStatus);

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

function getStatusInfo(shortageStatus) {
  const status = shortageStatus.toLowerCase();
  switch (status) {
    case "resolved":
    case "no shortage reported":
      return {
        statusClass: "resolved",
        statusLabel: status === "resolved" ? "Available" : "No Shortage",
      };
    case "current":
      return { statusClass: "shortage", statusLabel: "Shortage" };
    case "discontinued":
      return { statusClass: "discontinued", statusLabel: "Discontinued" };
    default:
      console.warn(`Unknown shortage status: ${shortageStatus}`);
      return { statusClass: "unknown", statusLabel: "Unknown Status" };
  }
}

// #endregion

//#region - SHORTAGE DETAILS HTML

function createShortageDetailsHTML(drug) {
  const timelineEvents = TimelineUtils.generateTimelineEvents(drug);
  const timelineHTML = TimelineUtils.generateTimelineHTML(timelineEvents);
  const additionalInfo = createAdditionalInfoHTML(drug);

  return `
    <div class="timeline-container">
      ${timelineHTML}
    </div>
    <div class="additional-info">
      ${additionalInfo}
    </div>
  `;
}

function createAdditionalInfoHTML(drug) {
  if (
    !drug.shortageReason &&
    !drug.relatedShortageInfo &&
    !drug.resolvedShortageInfo
  ) {
    console.log("No additional drug information available.");
    return "";
  }

  return `
    <div class="spacer" style="height: 0.5rem;"></div>
    <div class="shortage-info">
      ${
        drug.shortageReason
          ? `<p><span class="label">Shortage reason:</span> ${drug.shortageReason}</p>`
          : ""
      }
      ${
        drug.relatedShortageInfo
          ? `<p><span class="label">Related shortage information:</span> ${drug.relatedShortageInfo}</p>`
          : ""
      }
      ${
        drug.resolvedShortageInfo
          ? `<p><span class="label">Resolved shortage information:</span> ${drug.resolvedShortageInfo}</p>`
          : ""
      }
    </div>
  `;
}

//#endregion

//#region UTILITY FUNCTIONS

// Create an arrow icon to expand/collapse accordion
function createSVGIcon(direction) {
  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="${
        direction === "down" ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"
      }"></path>
    </svg>
  `;
}

// Set up click event listeners for all dosage summary elements
function addAccordionEventListeners() {
  const summaries = document.querySelectorAll(".dosage-summary");
  summaries.forEach((summary) => {
    summary.addEventListener("click", toggleAccordion);
  });
}

function toggleAccordion(event) {
  const dosageItem = event.currentTarget.closest(".dosage-item");
  const shortageDetails = dosageItem.querySelector(".shortage-details");
  const expandIcon = dosageItem.querySelector(".expand-icon");

  shortageDetails.style.display =
    shortageDetails.style.display === "none" ? "block" : "none";
  expandIcon.innerHTML = createSVGIcon(
    shortageDetails.style.display === "none" ? "down" : "up"
  );

  setTimeout(signalIframeResize, 0);
}

// Handle the expanding and collapsing of the accordion when a dosage summary is clicked
function toggleAccordion(event) {
  const dosageItem = event.currentTarget.closest(".dosage-item");
  const shortageDetails = dosageItem.querySelector(".shortage-details");
  const expandIcon = dosageItem.querySelector(".expand-icon");

  shortageDetails.style.display =
    shortageDetails.style.display === "none" ? "block" : "none";
  expandIcon.innerHTML = createSVGIcon(
    shortageDetails.style.display === "none" ? "down" : "up"
  );

  setTimeout(signalIframeResize, 0);
}

//#endregion

//#region GLOBAL EXPORTS

window.DrugDetails = {
  displayDrugDetails,
  createShortageDetailsHTML,
  createBrandInfoHTML,
};

//#endregion
