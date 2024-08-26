// search.js

let drugData = [];
let selectedIndex = -1;

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("search-input");
  const clearButton = document.getElementById("clear-search");
  const autocompleteResults = document.getElementById("autocomplete-results");

  if (searchInput && clearButton && autocompleteResults) {
    setupEventListeners(searchInput, clearButton, autocompleteResults);
  } else {
    console.error("Required elements not found in the DOM");
  }
});

function setupEventListeners(searchInput, clearButton, autocompleteResults) {
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  searchInput.addEventListener("focus", showAllResults);
  searchInput.addEventListener("click", showAllResults);
  searchInput.addEventListener("keydown", handleKeydown);
  searchInput.addEventListener("blur", function () {
    setTimeout(() => {
      autocompleteResults.innerHTML = "";
    }, 200);
  });

  clearButton.addEventListener("click", clearSearch);

  document.addEventListener("click", function (event) {
    if (!event.target.closest("#search-section")) {
      autocompleteResults.innerHTML = "";
    }
  });

  searchInput.addEventListener("click", function (event) {
    event.stopPropagation();
  });
}

function initSearch(data) {
  drugData = data;
}

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
      drug.brandName.toLowerCase().includes(searchTerm)
  );

  if (matchingDrugs.length === 0) {
    displayNoResultsMessage();
    autocompleteResults.innerHTML = "";
    return;
  }

  const groupedDrugs = groupDrugsByGenericName(matchingDrugs);
  displayAutocompleteResults(groupedDrugs, searchTerm);
}

function showAllResults() {
  const groupedDrugs = groupDrugsByGenericName(drugData);
  displayAutocompleteResults(groupedDrugs, "");
}

function groupDrugsByGenericName(drugs) {
  return drugs.reduce((acc, drug) => {
    if (!acc[drug.genericName]) {
      acc[drug.genericName] = [];
    }
    acc[drug.genericName].push(drug);
    return acc;
  }, {});
}

function displayAutocompleteResults(groupedDrugs, searchTerm) {
  const autocompleteResults = document.getElementById("autocomplete-results");
  autocompleteResults.innerHTML = "";
  selectedIndex = -1;

  Object.entries(groupedDrugs).forEach(([genericName, drugs], index) => {
    const div = document.createElement("div");
    div.className = "autocomplete-item";
    div.innerHTML = `
      ${getRouteIconSVG(drugs[0].route)}
      <span class="drug-name">${highlightMatch(genericName, searchTerm)}</span>
    `;
    if (drugs[0].brandName && drugs[0].brandName !== genericName) {
      div.innerHTML += `<span class="brand-name">(${highlightMatch(
        drugs[0].brandName,
        searchTerm
      )})</span>`;
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
      console.log(`No specific icon for route: ${route}, using default`);
      return "icon-other";
  }
}

function getRouteIconSVG(route) {
  const iconId = getRouteIcon(route);
  console.log(`Generating icon SVG for route: ${route}, iconId: ${iconId}`);
  return `<img src="assets/images/icons-route/${iconId}.svg" alt="${route} icon" class="icon icon-route">`;
}

function selectDrug(genericName, drugs) {
  const searchInput = document.getElementById("search-input");
  const autocompleteResults = document.getElementById("autocomplete-results");
  const clearButton = document.getElementById("clear-search");

  searchInput.value = genericName;
  autocompleteResults.innerHTML = "";
  clearButton.style.display = "block";
  if (typeof window.displayDrugDetails === "function") {
    window.displayDrugDetails(drugs);
  } else {
    console.error("displayDrugDetails function not found");
  }
}

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

function clearSearch() {
  const searchInput = document.getElementById("search-input");
  const clearButton = document.getElementById("clear-search");
  const autocompleteResults = document.getElementById("autocomplete-results");
  const resultsContainer = document.getElementById("results-container");

  searchInput.value = "";
  clearButton.style.display = "none";
  autocompleteResults.innerHTML = "";
  if (resultsContainer) {
    resultsContainer.innerHTML = "";
  }
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function highlightMatch(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function displayNoResultsMessage() {
  const resultsContainer = document.getElementById("results-container");
  resultsContainer.innerHTML = `
    <div class="no-results">
      <h2>No matching records found.</h2>
      <p>This drug does not appear in the shortage database.</p>
    </div>
  `;
}

window.initSearch = initSearch;
