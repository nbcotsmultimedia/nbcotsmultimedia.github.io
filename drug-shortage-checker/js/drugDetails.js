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
            <p class="manufacturer">${
              drug.manufacturer || "Unknown Manufacturer"
            }</p>
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
                <span class="dosage-icon">💉</span>
                <span class="dosage-value">${dosage.value}</span>
                <span class="availability ${dosage.status.toLowerCase()}">${
        dosage.status
      }</span>
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

function createShortageDetailsHTML(dosage) {
  const hasShortageInfo =
    dosage.reportedDate || dosage.shortageReason || dosage.relatedInfo;

  if (!hasShortageInfo) {
    return "<p>No shortage information available for this dosage.</p>";
  }

  let timelineHTML = "";
  if (dosage.reportedDate) {
    const reportedDate = new Date(dosage.reportedDate);
    const resolvedDate = dosage.resolvedDate
      ? new Date(dosage.resolvedDate)
      : null;
    const currentDate = new Date();
    const duration =
      Math.ceil((resolvedDate || currentDate) - reportedDate) /
      (1000 * 60 * 60 * 24);

    timelineHTML = `
            <div class="timeline">
                <div class="timeline-item">
                    <span class="timeline-icon shortage"></span>
                    <div class="timeline-content">
                        <p class="date">${formatDate(dosage.reportedDate)}</p>
                        <p class="event">Shortage reported</p>
                    </div>
                </div>
                <div class="timeline-duration">${duration} days</div>
                ${
                  resolvedDate
                    ? `
                    <div class="timeline-item">
                        <span class="timeline-icon resolved"></span>
                        <div class="timeline-content">
                            <p class="date">${formatDate(
                              dosage.resolvedDate
                            )}</p>
                            <p class="event">Shortage resolved</p>
                        </div>
                    </div>
                `
                    : `
                    <div class="timeline-item">
                        <span class="timeline-icon ongoing"></span>
                        <div class="timeline-content">
                            <p class="date">${formatDate(currentDate)}</p>
                            <p class="event">Shortage ongoing</p>
                        </div>
                    </div>
                `
                }
            </div>
        `;
  }

  return `
        ${timelineHTML}
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
        <span class="dosage-icon">&#x2706;</span>
        <span class="dosage-value">${dosage.value}</span>
        <span class="availability ${dosage.status.toLowerCase()}">${
        dosage.status
      }</span>
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

function createShortageDetailsHTML(dosage) {
  const hasShortageInfo =
    dosage.reportedDate || dosage.shortageReason || dosage.relatedInfo;

  if (!hasShortageInfo) {
    return "<p>No shortage information available for this dosage.</p>";
  }

  let timelineHTML = "";
  if (dosage.reportedDate) {
    timelineHTML = `
      <div class="timeline">
        <div class="timeline-item">
          <span class="timeline-icon shortage"></span>
          <div class="timeline-content">
            <p class="date">${formatDate(dosage.reportedDate)}</p>
            <p class="event">Shortage reported</p>
          </div>
        </div>
        ${
          dosage.resolvedDate
            ? `
          <div class="timeline-duration">${calculateDuration(
            dosage.reportedDate,
            dosage.resolvedDate
          )} days</div>
          <div class="timeline-item">
            <span class="timeline-icon resolved"></span>
            <div class="timeline-content">
              <p class="date">${formatDate(dosage.resolvedDate)}</p>
              <p class="event">Shortage resolved</p>
            </div>
          </div>
        `
            : `
          <div class="timeline-duration">${calculateDuration(
            dosage.reportedDate,
            null
          )} days</div>
          <div class="timeline-item">
            <span class="timeline-icon ongoing"></span>
            <div class="timeline-content">
              <p class="date">Ongoing</p>
              <p class="event">Shortage ongoing</p>
            </div>
          </div>
        `
        }
      </div>
    `;
  }

  return `
    ${timelineHTML}
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
    ${
      dosage.status.toLowerCase() !== "shortage"
        ? `<p><strong>Current Status:</strong> ${dosage.status}</p>`
        : ""
    }
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
    expandIcon.textContent = "▲";
  } else {
    shortageDetails.style.display = "none";
    expandIcon.textContent = "▼";
  }
}

function formatDate(dateString) {
  if (!dateString) return "Unknown Date";
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

function calculateDuration(startDate, endDate) {
  if (!startDate) return "Unknown duration";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
