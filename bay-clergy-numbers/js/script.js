// Configuration and global variables
let globalData = {
  bishops: [],
  priests: [],
  dioceses: []
};

// URLs to the CSV data
const urls = {
  bishopsURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRpj2MSEl5MwfD1f49Wgnnwo1_1gS9E5_6zEVGG3xPExaNPfqeAZoZBkycAWWIhBvtubhqb1BS9lFUy/pub?gid=509356210&single=true&output=csv',
  priestsURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRpj2MSEl5MwfD1f49Wgnnwo1_1gS9E5_6zEVGG3xPExaNPfqeAZoZBkycAWWIhBvtubhqb1BS9lFUy/pub?gid=1753742719&single=true&output=csv',
  diocesesURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRpj2MSEl5MwfD1f49Wgnnwo1_1gS9E5_6zEVGG3xPExaNPfqeAZoZBkycAWWIhBvtubhqb1BS9lFUy/pub?gid=1147167947&single=true&output=csv'
};

// Function to load data from a single URL
function loadCSVData(url, callback) {
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: results => {
      callback(results.data);
    },
    error: error => console.error('Error while fetching and parsing CSV:', error)
  });
}

// Create waffle chart //

class WaffleChartGenerator {
  constructor(data, containerId, totalSquares) {
    // Store the provided parameters
    this.data = data;
    this.containerId = containerId;
    this.totalSquares = totalSquares;

    // Default properties
    this.aspectRatio = 4 / 2;
    this.gapSize = 1;
    this.margin = { top: 10, right: 10, bottom: 10, left: 10 };
    this.totalValue = this.data.reduce((total, item) => total + item.lawsuits, 0);

    // Initialize the chart
    this.initializeChart();
  }

  getColor(position) {
    const colorMap = {
      "Priest": "#ff7f0e",
      "Religious brother": "#2ca02c",
      "Unknown or other": "#9467bd",
      "Nun": "#1f77b4"
    };
    return colorMap[position] || "gray";
  }

  initializeChart() {
    const containerElement = document.getElementById(this.containerId);
    const containerWidth = containerElement.clientWidth;
    this.containerWidth = containerWidth;

    const desiredNumberOfColumns = 54;
    this.squareSize = Math.floor((containerWidth - (desiredNumberOfColumns - 1) * this.gapSize) / desiredNumberOfColumns);
    this.numberOfRows = Math.ceil(this.totalSquares / desiredNumberOfColumns);
    this.containerHeight = this.numberOfRows * (this.squareSize + this.gapSize) + this.margin.top + this.margin.bottom;

    d3.select(`#${this.containerId}`).selectAll('svg').remove();

    const svg = d3.select(`#${this.containerId}`)
      .append("svg")
      .attr("viewBox", `0 0 ${containerWidth + this.margin.left + this.margin.right} ${this.containerHeight}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("display", "block")
      .style("margin", "auto");

    this.drawChart(svg, this.squareSize, desiredNumberOfColumns);
  }

  drawChart(svg, squareSize, numCols) {
    let currentRow = 0, currentCol = 0, filledSquares = 0;
    const totalValue = this.totalValue;
    const totalSquares = this.totalSquares;
    const margin = this.margin;

    this.data.forEach(item => {
      if (!isNaN(item.lawsuits)) {
        const itemSquares = totalValue !== 0 ? Math.round(item.lawsuits / totalValue * totalSquares) : 0;
        for (let i = 0; i < itemSquares && filledSquares < totalSquares; i++) {
          const x = (currentCol * (squareSize + this.gapSize)) + margin.left;
          const y = (currentRow * (squareSize + this.gapSize)) + margin.top;

          svg.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", squareSize - this.gapSize)
            .attr("height", squareSize - this.gapSize)
            .attr("fill", this.getColor(item.position));

          currentRow++;
          if (currentRow >= Math.ceil(totalSquares / numCols)) {
            currentRow = 0;
            currentCol++;
          }
          filledSquares++;
        }
      }
    });
  }
}


// Define and initialize the waffleData variable
const waffleData = [
  { position: "Priest", lawsuits: 1267 },
  { position: "Religious brother", lawsuits: 139 },
  { position: "Unknown or other", lawsuits: 169 },
  { position: "Nun", lawsuits: 22 }
];

// Sort waffleData by lawsuits in descending order, ensure "Unknown or other" is last
waffleData.sort((a, b) => {
  return a.position === "Unknown or other" ? 1 :
    b.position === "Unknown or other" ? -1 :
    b.lawsuits - a.lawsuits;
});

// Total number of sqquares in chart
const totalSquares = 1597;

// Instantiate the class WaffleChartGenerator
const waffleChart = new WaffleChartGenerator(waffleData, 'waffle-chart-container', totalSquares);

// Declare global reference to the chart instance
let waffleChartInstance;

// Set event listener that fires init waffle chart on load
document.addEventListener('DOMContentLoaded', () => {
  // Correct the containerId according to your actual container's ID
  initWaffleChart('waffle-chart-container');
});

// Function to initialize a waffle chart instance within the specified HTML element
function initWaffleChart(containerId) {
  
  // Check if an element with the provided containerId exists in the DOM
  if (!document.getElementById(containerId)) {
    // If not, log error
    console.error(`Element with ID '${containerId}' not found.`);
    return;
  }

  // Initialize waffleChartInstance with the provided containerId, using the WaffleChartGenerator constructor
  waffleChartInstance = new WaffleChartGenerator(
    waffleData,
    containerId,
    totalSquares
    );

}

window.addEventListener('resize', () => {
  // Get the new container width based on the resized window
  const containerElement = document.getElementById(waffleChart.containerId);
  const newContainerWidth = containerElement.clientWidth;

  // Clear the SVG to redraw
  d3.select(`#${waffleChart.containerId}`).selectAll("*").remove();

  // Update the waffle chart with the new width
  waffleChart.containerWidth = newContainerWidth;
  waffleChart.initializeChart();

  // Since the initializeChart method re-creates the SVG, we need to select it again
  const svg = d3.select(`#${waffleChart.containerId}`).select("svg");

});

// End create waffle chart //

// Function to add bishops to the bishop-section
function addBishops(bishops) {

  const bishopsList = document.getElementById('bishops-list');
  bishopsList.className = 'row'; // Add the 'row' class to the container
  bishops.forEach(bishop => {
    const bishopDiv = document.createElement('div');
    bishopDiv.className = 'bishop col';
    bishopDiv.innerHTML = `
      <div class="image-container">
        <div class="image-wrapper">
          <img src="${bishop.img}" alt="Photo of ${bishop.bishopName}" class="img-fluid">
        </div>
        <h3 class="img-caption">${bishop.bishopName}</h3>
        <p class="img-sub-caption">${bishop.diocese}</p>
      </div>`;
    bishopsList.appendChild(bishopDiv);
  });

}

// Function to add priests to the bishop-section
function addPriests(priests) {
  const container = document.getElementById('priests-list');
  let row; // Declare a variable for the row outside the loop

  priests.forEach((priest, index) => {
    // For every third priest, create a new row
    if (index % 3 === 0) {
      row = document.createElement('div');
      row.className = 'row';
      container.appendChild(row); // Append the new row to the container
    }

    const priestDiv = document.createElement('div');
    priestDiv.className = 'col'; // Using 'col' will divide the space equally among columns within a row
    priestDiv.innerHTML = `
      <div class="image-container-priest">
        <div class="image-wrapper-priest">
          <img src="${priest.img}" alt="Photo of ${priest.priestName}" class="img-fluid">
        </div>
        <h3 class="img-caption">${priest.priestName}</h3>
        <p class="img-sub-caption">${priest.diocese}</p>
        <p class="img-sub-sub-caption">${priest.newAccusations} new accusations</p>
      </div>`;

    row.appendChild(priestDiv); // Append the priestDiv to the current row
  });
}

// Function to add dioceses to the diocese-section
function addDioceses(dioceses) {
  const diocesesList = document.getElementById('dioceses-list');
  diocesesList.className = 'row'; // Add the 'row' class to the container
  dioceses.forEach(diocese => {
    const dioceseDiv = document.createElement('div');
    dioceseDiv.className = 'diocese col';
    dioceseDiv.innerHTML = `
      <div class="arms-container">
        <img src="${diocese.img}" alt="Emblem of ${diocese.diocese}" class="img-fluid">
        <h3 class="img-caption">${diocese.diocese}</h3>
      </div>`;
    diocesesList.appendChild(dioceseDiv);
  });
}

// Modify the loadAllData function to call these new functions
function loadAllData() {
  console.log("loadAllData function called");
  let loadedCount = 0;
  Object.keys(urls).forEach(key => {
    loadCSVData(urls[key], data => {
      globalData[key.replace('URL', '')] = data;
      loadedCount++;
      // Check if all data is loaded
      if (loadedCount === Object.keys(urls).length) {
        // console.log('All data loaded');
        // Call the functions to add the data to the page
        addBishops(globalData.bishops);
        addPriests(globalData.priests);
        addDioceses(globalData.dioceses);
      }
    });
  });
}

// Call loadAllData when the page content is fully loaded
document.addEventListener('DOMContentLoaded', loadAllData);