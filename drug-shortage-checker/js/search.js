// search.js

//#region - GLOBAL VARIABLES AND INITIALIZATION

let drugData = [];
let selectedIndex = -1;

document.addEventListener("DOMContentLoaded", initializeSearch);

//#endregion

//#region - INITIALIZATION FUNCTIONS

function initializeSearch() {
  const searchInput = document.getElementById("search-input");
  const clearButton = document.getElementById("clear-search");
  const autocompleteResults = document.getElementById("autocomplete-results");
  const spotIllustration = document.getElementById("spotIllustration");

  if (searchInput && clearButton && autocompleteResults && spotIllustration) {
    searchInput.spellcheck = false;
    setupEventListeners(
      searchInput,
      clearButton,
      autocompleteResults,
      spotIllustration
    );
  } else {
    console.error("Required elements not found in the DOM");
  }

  signalIframeResize();
}

// Set up event listeners for search functionality
function setupEventListeners(
  searchInput,
  clearButton,
  autocompleteResults,
  spotIllustration
) {
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  searchInput.addEventListener("focus", showAllResults);
  searchInput.addEventListener("click", showAllResults);
  searchInput.addEventListener("keydown", handleKeydown);
  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      autocompleteResults.innerHTML = "";
    }, 200);
  });

  clearButton.addEventListener("click", () => {
    clearSearch();
    spotIllustration.style.display = "block";
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#search-section")) {
      autocompleteResults.innerHTML = "";
    }
  });

  searchInput.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

// Initialize the search with drug data
function initSearch(data) {
  drugData = data;
}

//#endregion

//#region - SEARCH HANDLING

// Handle the search input event
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  const clearButton = document.getElementById("clear-search");
  const autocompleteResults = document.getElementById("autocomplete-results");

  clearButton.style.display = searchTerm ? "block" : "none";

  if (searchTerm.length === 0) {
    showAllResults();
    return;
  }

  const matchingDrugs = drugData.filter(
    (drug) =>
      drug.genericName.toLowerCase().includes(searchTerm) ||
      drug.brandName.toLowerCase().includes(searchTerm) ||
      drug.manufacturerName.toLowerCase().includes(searchTerm) ||
      drug.therapeuticCategory.toLowerCase().includes(searchTerm)
  );

  if (matchingDrugs.length === 0) {
    displayNoResultsMessage();
    autocompleteResults.innerHTML = "";
    return;
  }

  const groupedDrugs = groupDrugsByGenericName(matchingDrugs);
  displayAutocompleteResults(groupedDrugs, searchTerm);
}

// Show all results when the search input is focused or clicked
function showAllResults() {
  const groupedDrugs = groupDrugsByGenericName(drugData);
  displayAutocompleteResults(groupedDrugs, "");
}

//#endregion

//#region - DATA PROCESSING

// Group drugs by their generic name
function groupDrugsByGenericName(drugs) {
  return drugs.reduce((acc, drug) => {
    if (!acc[drug.genericName]) {
      acc[drug.genericName] = [];
    }
    acc[drug.genericName].push(drug);
    return acc;
  }, {});
}

//#endregion

//#region - DISPLAY FUNCTIONS

// Display autocomplete results
function displayAutocompleteResults(groupedDrugs, searchTerm) {
  const autocompleteResults = document.getElementById("autocomplete-results");
  autocompleteResults.innerHTML = "";
  selectedIndex = -1;

  Object.entries(groupedDrugs).forEach(([genericName, drugs], index) => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";
    div.innerHTML = `
      <div class="icon-route-wrapper">
        <svg class="icon-route">
          <use xlink:href="#${getRouteIcon(drugs[0].route)}"></use>
        </svg>
      </div>
      <span class="drug-name">${highlightMatch(genericName, searchTerm)}</span>
    `;
    if (drugs[0].brandName && drugs[0].brandName !== genericName) {
      div.innerHTML += `&nbsp;<span class="brand-name"> (${highlightMatch(
        drugs[0].brandName,
        searchTerm
      )})</span>`;
      signalIframeResize();
    }

    div.addEventListener("mousedown", (event) => {
      event.preventDefault();
      selectDrug(genericName, drugs);
    });

    div.addEventListener("mouseover", () => {
      selectedIndex = index;
      updateSelectedItem();
    });

    autocompleteResults.appendChild(div);
  });
  signalIframeResize(); // Call crosstalk
}

function displayNoResultsMessage() {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = `
    <div class="no-results">
      <h2>No matching records found.</h2>
      <p>This drug does not appear in the shortage database.</p>
    </div>
  `;
  signalIframeResize();
}

//#endregion

// #region UTILITY FUNCTIONS

// Clear the search input and results, show the illustration
function clearSearch() {
  const searchInput = document.getElementById("search-input");
  const clearButton = document.getElementById("clear-search");
  const autocompleteResults = document.getElementById("autocomplete-results");
  const resultsContainer = document.getElementById("results-container");
  const illustrationContainer = document.getElementById(
    "illustrationContainer"
  );
  const spotIllustration = document.getElementById("spotIllustration");

  searchInput.value = "";
  clearButton.style.display = "none";
  autocompleteResults.innerHTML = "";
  if (resultsContainer) {
    resultsContainer.innerHTML = "";
  }

  // Smoothly expand the illustration container
  const naturalHeight = spotIllustration.offsetHeight;
  illustrationContainer.style.height = `${naturalHeight}px`;

  // After transition, set height to auto to allow for potential changes in image size
  setTimeout(() => {
    illustrationContainer.style.height = "auto";
    signalIframeResize(); // Call crosstalk after expansion
  }, 300); // This should match the transition duration in CSS

  signalIframeResize(); // Call crosstalk immediately when clearing
}

// Handle keydown events for navigation in autocomplete results
/**
 * @param {Event} event - The keydown event
 */
function handleKeydown(event) {
  const autocompleteResults = document.getElementById("autocomplete-results");
  const items = autocompleteResults.getElementsByClassName("autocomplete-item");

  switch (event.key) {
    case "ArrowDown":
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelectedItem();
      event.preventDefault();
      break;
    case "ArrowUp":
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelectedItem();
      event.preventDefault();
      break;
    case "Enter":
      if (selectedIndex > -1 && items[selectedIndex]) {
        items[selectedIndex].dispatchEvent(new Event("mousedown"));
      }
      break;
    case "Escape":
      autocompleteResults.innerHTML = "";
      selectedIndex = -1;
      break;
  }
}

// Called when a user selects a drug from the autocomplete results
/**
 * @param {string} genericName - The generic name of the selected drug
 * @param {Array} drugs - Array of drug objects for the selected generic name
 */
// Update the selectDrug function
function selectDrug(genericName, drugs) {
  const searchInput = document.getElementById("search-input");
  const autocompleteResults = document.getElementById("autocomplete-results");
  const clearButton = document.getElementById("clear-search");
  const illustrationContainer = document.getElementById(
    "illustrationContainer"
  );

  searchInput.value = genericName;
  autocompleteResults.innerHTML = "";
  clearButton.style.display = "block";

  // Smoothly collapse the illustration container
  const currentHeight = illustrationContainer.offsetHeight;
  illustrationContainer.style.height = `${currentHeight}px`;
  setTimeout(() => {
    illustrationContainer.style.height = "0";
    signalIframeResize(); // Call crosstalk after collapse
  }, 10);

  signalIframeResize(); // Call crosstalk immediately when selecting a drug

  if (typeof window.displayDrugDetails === "function") {
    window.displayDrugDetails(drugs);
  } else {
    console.error("displayDrugDetails function not found");
  }
}

// Update visually the selected item in the autocomplete results
function updateSelectedItem() {
  const items = document.getElementsByClassName("autocomplete-item");
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle("selected", i === selectedIndex);
  }

  const selectedItem = items[selectedIndex];
  if (selectedItem) {
    selectedItem.scrollIntoView({ block: "nearest" });
  }
}

// Highlight matching parts of the text in search results
function highlightMatch(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

//#endregion

//#region - GLOBAL EXPORTS

// Make initSearch function available globally
window.initSearch = initSearch;

//#endregion
