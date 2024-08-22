// search.js

let drugData = [];
let selectedIndex = -1;

function initSearch(data) {
  drugData = data;
  const searchInput = document.getElementById("search-input");
  const autocompleteResults = document.getElementById("autocomplete-results");

  if (searchInput && autocompleteResults) {
    searchInput.addEventListener("input", debounce(handleSearch, 300));
    searchInput.addEventListener("focus", showAllResults);
    searchInput.addEventListener("keydown", handleKeydown);

    // Use mousedown instead of click to prevent focus issues
    document.addEventListener("mousedown", (event) => {
      if (!event.target.closest("#search-section")) {
        autocompleteResults.innerHTML = "";
      }
    });

    // Prevent the dropdown from closing immediately after focusing
    searchInput.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  } else {
    console.error("Search input or autocomplete results container not found");
  }
}

function showAllResults() {
  const groupedDrugs = groupDrugsByGenericName(drugData);
  displayAutocompleteResults(groupedDrugs, "");
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  const autocompleteResults = document.getElementById("autocomplete-results");

  if (searchTerm.length === 0) {
    showAllResults();
    return;
  }

  const matchingDrugs = drugData.filter(
    (drug) =>
      drug.genericName.toLowerCase().includes(searchTerm) ||
      drug.brandName.toLowerCase().includes(searchTerm)
  );

  const groupedDrugs = groupDrugsByGenericName(matchingDrugs);
  displayAutocompleteResults(groupedDrugs, searchTerm);
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
    div.innerHTML = `${highlightMatch(genericName, searchTerm)}`;
    if (drugs[0].brandName && drugs[0].brandName !== genericName) {
      div.innerHTML += ` (${highlightMatch(drugs[0].brandName, searchTerm)})`;
    }

    div.addEventListener("mousedown", (event) => {
      event.preventDefault();
      document.getElementById("search-input").value = genericName;
      autocompleteResults.innerHTML = "";
      displayDrugDetails(drugs);
    });

    div.addEventListener("mouseover", () => {
      selectedIndex = index;
      updateSelectedItem();
    });

    autocompleteResults.appendChild(div);
  });
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
        items[selectedIndex].click();
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

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function highlightMatch(text, searchTerm) {
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

window.initSearch = initSearch;
