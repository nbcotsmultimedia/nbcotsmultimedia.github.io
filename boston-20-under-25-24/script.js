//#region CONFIG
// Add configuration object for app settings
const CONFIG = {
  DEBOUNCE_DELAY: 150,
  CSV_URL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIhSbmNVLpdAYB1kHZC1aFWy5k9DptA0EErXyL7IMsTtjLVq7ikWvrPTcfdVwsai6qaARiVOQdCs0j/pub?gid=0&single=true&output=csv",
  SORT_OPTIONS: {
    RANK: "rank",
    NAME: "name-last",
    BIRTHDATE: "birthdate",
  },
};

// Add loading state handling
const setLoading = (isLoading) => {
  const container = document.getElementById("card-container");
  container.style.opacity = isLoading ? "0.5" : "1";
  // Could add loading spinner here
};
//#endregion

//#region STATE
// Stores application data and DOM element references
const state = {
  allData: null, // Raw data from CSV
  sortedAndFilteredData: null, // Current filtered/sorted data
  cardContainer: document.getElementById("card-container"),
  controls: {
    sort: document.getElementById("sort"),
    filter: document.getElementById("filter"),
    sortMobile: document.getElementById("sort-mobile"),
    filterButtons: document.querySelectorAll(".team-filter"),
  },
};
//#endregion

//#region UTILITIES
// Prevents a function from being called too frequently
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    // Clear existing timeout
    clearTimeout(timeout);
    // Set new timeout
    timeout = setTimeout(() => {
      clearTimeout(timeout);
      func(...args);
    }, wait);
  };
}
//#endregion

//#region FILTER GENERATION

// Dynamically generates team filter options from data
function generateTeamFilters() {
  // Get unique teams from data
  const teams = [...new Set(state.allData.map((player) => player.team))].sort();

  // Added this block for desktop filter
  const desktopFilter = state.controls.filter;
  if (desktopFilter) {
    desktopFilter.innerHTML = `
      <option value="all">All teams</option>
      ${teams
        .map(
          (team) => `
        <option value="${team}">${team}</option>
      `
        )
        .join("")}
    `;
  }

  // Generate filter buttons
  const mobileFilterContainer = document.getElementById(
    "filter-buttons-container"
  );
  if (mobileFilterContainer) {
    mobileFilterContainer.innerHTML = `
      <button class="team-filter selected" data-value="all">All Teams</button>
      ${teams
        .map(
          (team) => `
        <button class="team-filter" data-value="${team}">${team}</button>
      `
        )
        .join("")}
    `;
    // Update the filter buttons in state after regenerating
    state.controls.filterButtons = document.querySelectorAll(".team-filter");
  }
}

//#endregion

//#region CARD CREATION

// Creates a single player card element
function createCard(player) {
  const card = document.createElement("div");
  card.className = "card";

  // Calculate fan rating bar width
  const fanRatingWidth = `${player["rating"]}%`;

  // Build card HTML
  card.innerHTML = `
    <img src="${player["player-img"]}" 
         alt="${player["name-first"]} ${player["name-last"]}"
         loading="lazy">
    <div class="content">
      <div class="top-section">
        <div class="rank">${player["rank"]}</div>
        <div class="details">
          <div class="name-first">${player["name-first"]}</div>
          <div class="name-last">${player["name-last"]}</div>
          <div class="team-position">${player["team"]} | ${player["position"]}</div>
        </div>
      </div>
      <div class="info">
        <div class="additional-info">
          <div class="fan-rating"><strong>Fan rating:</strong> ${player["rating"]}</div>
          <div class="fan-rating-bar">
            <div class="progress" style="width: ${fanRatingWidth}"></div>
          </div>
          <div class="turns-25"><strong>Turns 25:</strong> ${player["birth-date"]}</div>
        </div>
        <div class="blurb-section">
          <p class="blurb">${player["blurb"]}</p>
        </div>
      </div>
      <div class="link">
        <a href="${player["link-to-more"]}" target="_blank" rel="noopener">
          More on ${player["name-first"]} ${player["name-last"]}
        </a>
      </div>
    </div>
  `;

  return card;
}

// Efficiently renders all player cards to the container
function renderCards(players) {
  // Use fragment for better performance
  const fragment = document.createDocumentFragment();
  players.forEach((player) => fragment.appendChild(createCard(player)));

  // Clear and update container
  state.cardContainer.innerHTML = "";
  state.cardContainer.appendChild(fragment);
}
//#endregion

//#region DATA HANDLING
// Sorts data with caching for better performance
const sortData = (() => {
  const cache = new Map();

  return (data, sortBy) => {
    // Check cache first
    const cacheKey = `${sortBy}-${data.length}`;
    if (cache.has(cacheKey)) return [...cache.get(cacheKey)];

    // Sort data based on selected criteria
    let sorted;
    switch (sortBy) {
      case "name-last":
        sorted = [...data].sort((a, b) =>
          a["name-last"].localeCompare(b["name-last"])
        );
        break;
      case "rank":
        sorted = [...data].sort((a, b) => a["rank"] - b["rank"]);
        break;
      case "birthdate":
        sorted = [...data].sort(
          (a, b) => new Date(a["birth-date"]) - new Date(b["birth-date"])
        );
        break;
      default:
        sorted = data;
    }

    // Save to cache and return
    cache.set(cacheKey, sorted);
    return [...sorted];
  };
})();

// Filters player data by team
function filterData(data, filter) {
  return filter === "all"
    ? data
    : data.filter((player) => player["team"] === filter);
}

// Updates the display with new sorting/filtering
const updateDisplay = debounce((sortBy, filterBy) => {
  // Apply filter then sort
  state.sortedAndFilteredData = sortData(
    filterData(state.allData, filterBy),
    sortBy
  );
  // Render updated data
  renderCards(state.sortedAndFilteredData);
}, 150);
//#endregion

//#region EVENT HANDLING
// Sets up all event listeners for the application
function setupEventListeners() {
  // Desktop sorting
  state.controls.sort?.addEventListener("change", (e) => {
    const currentFilter = state.controls.filter?.value || "all";
    updateDisplay(e.target.value, currentFilter);
  });

  // Desktop filtering
  state.controls.filter?.addEventListener("change", (e) => {
    const currentSort = state.controls.sort?.value || "rank";
    updateDisplay(currentSort, e.target.value);
  });

  // Mobile sorting
  state.controls.sortMobile?.addEventListener("change", (e) =>
    updateDisplay(
      e.target.value,
      document.querySelector(".team-filter.selected")?.dataset.value || "all"
    )
  );

  // Mobile filter buttons
  document
    .getElementById("filter-buttons-container")
    ?.addEventListener("click", (e) => {
      if (e.target.classList.contains("team-filter")) {
        // Update button states
        state.controls.filterButtons.forEach((btn) =>
          btn.classList.toggle("selected", btn === e.target)
        );
        // Update display
        updateDisplay(
          state.controls.sortMobile?.value || "rank",
          e.target.dataset.value
        );
      }
    });
}
//#endregion

//#region DATA INITIALIZATION
// Fetches and sets up initial data

async function initializeData() {
  try {
    setLoading(true);
    const response = await fetch(CONFIG.CSV_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvData = await response.text();

    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("CSV parsing warnings:", results.errors);
        }
        state.allData = results.data;
        state.sortedAndFilteredData = [...state.allData];
        generateTeamFilters();
        updateDisplay(CONFIG.SORT_OPTIONS.RANK, "all");
        setupEventListeners();
      },
      error: (error) => handleError(error, "CSV Parsing"),
    });
  } catch (error) {
    handleError(error, "Data Fetching");
  } finally {
    setLoading(false);
  }
}

// Add data validation
function validatePlayerData(player) {
  const requiredFields = ["name-first", "name-last", "team", "rank", "rating"];
  return requiredFields.every((field) => player[field] != null);
}

//#endregion

//#region APP INITIALIZATION
// Start the application
initializeData();
//#endregion
