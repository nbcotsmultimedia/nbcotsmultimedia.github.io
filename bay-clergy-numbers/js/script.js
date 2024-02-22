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

// /////////////////////////////////////////////////////// //

// Define and initialize the waffleData variable
const waffleData = [
  { position: "Priest", lawsuits: 1267 },
  { position: "Religious brother", lawsuits: 139 },
  { position: "Unknown or other", lawsuits: 169 },
  { position: "Nun", lawsuits: 22 }
];

// Sort waffleData by lawsuits in descending order, but ensure "Unknown or other" is last
waffleData.sort((a, b) => {
  // Check if one of the positions is "Unknown or other"
  if (a.position === "Unknown or other") return 1; // Always sort "Unknown or other" to be last
  if (b.position === "Unknown or other") return -1; // Always sort "Unknown or other" to be last
  
  // Otherwise, sort by lawsuits in descending order
  return b.lawsuits - a.lawsuits;
});

// Build waffle chart
class WaffleChartGenerator {
  constructor(data, containerId) {
    this.data = data;
    this.containerId = containerId;
    this.aspectRatio = 4 / 2;
    this.gapSize = 3; // Define the size of the gap between shapes

    // Only proceed if the container exists
    const containerElement = document.getElementById(this.containerId);
    if (containerElement) {
      this.initializeChart();
    } else {
      console.error(`Element with ID '${this.containerId}' not found.`);
    }
  }

  initializeChart() {

    // Get container dimensions
    const containerElement = document.getElementById(this.containerId);
    const containerWidth = containerElement.clientWidth;
  
    // Desired configuration for fewer diamonds per row and a taller chart
    const desiredNumberOfColumns = 40; // Adjust as needed
    let squareSize = containerWidth / desiredNumberOfColumns; // Size based on fewer columns
  
    // Calculate total value and squares
    const totalValue = this.data.reduce((acc, item) => acc + item.lawsuits, 0);
    const totalSquares = Math.ceil(totalValue * (4 / 3)); // Adjust the ratio if needed
  
    // Calculate the number of rows needed and adjust container height accordingly
    const numberOfRows = Math.ceil(totalSquares / desiredNumberOfColumns);
    const containerHeight = numberOfRows * squareSize; // Adjusted container height

    this.totalValue = this.data.reduce((acc, item) => acc + item.lawsuits, 0);
  
    // Clear any existing SVG from container
    d3.select(`#${this.containerId}`).selectAll('svg').remove();
  
    // Append a new SVG to the container with adjusted dimensions
    const svg = d3.select(`#${this.containerId}`).append("svg")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto");
  
    // Proceed with chart generation using the adjusted dimensions
    // Remember to adjust the drawChart call if it's dependent on the older calculations
    this.drawChart(svg, totalSquares, squareSize, desiredNumberOfColumns);
  }

  drawChart(svg, totalSquares, squareSize, numCols) {
    let currentRow = 0, currentCol = 0, filledSquares = 0;

    // This value based on data/calculations
    const totalValue = this.totalValue;

    // Calculate the space required for each diamond including gaps
    let diamondWidthWithGap = squareSize + this.gapSize;
    let diamondHeightWithGap = squareSize + this.gapSize;

    this.data.forEach(item => {
      const itemSquares = Math.round(item.lawsuits / totalValue * totalSquares);

      for (let i = 0; i < itemSquares && filledSquares < totalSquares; i++) {
        
        // Calculate the x and y coordinates for each diamond based on the current row and column
        const x = currentCol * diamondWidthWithGap;
        const y = currentRow * diamondHeightWithGap;

        // Append a square (used as a diamond through rotation)
        svg.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", squareSize - this.gapSize)
          .attr("height", squareSize - this.gapSize)
          .attr("fill", this.getColor(item.position))
          // .attr("stroke", "black")
          .attr("stroke-width", this.gapSize)
          .attr("transform", `rotate(45, ${x + squareSize / 2}, ${y + squareSize / 2})`);

        // Update row and column indices
        currentCol++;
        if (currentCol >= numCols) {
          currentCol = 0;
          currentRow++;
        }

        filledSquares++;
      }

      console.log(`Drawing square: Position ${item.position}, Squares to draw: ${itemSquares}`);

    });
  }

  getColor(position) {
    const colorMap = {
      "Nun": "#D77A6D",
      "Priest": "#2464DF",
      "Religious brother": "#1BC0D9",
      "Unknown or other": "#333A73"
    };
    return colorMap[position] || "#999"; // Default color if position not found
  }

  createLegend() {
    // Remove any existing legend and then create a new one
    d3.select(`#${this.containerId} .legend-container`).remove();

    const legendContainer = d3.select(`#${this.containerId}`).append("div")
      .attr("class", "legend-container");

    this.data.forEach(item => {
      const legendItem = legendContainer.append("div")
        .attr("class", "legend-item");

      legendItem.append("div")
        .attr("class", "legend-color")
        .style("background-color", this.getColor(item.position));

      legendItem.append("span") // Use span for text instead of text
        .text(item.position);
    });
  }
}

// Usage
const waffleChart = new WaffleChartGenerator(waffleData, 'waffle-chart-container');

let waffleChartInstance; // Global reference to the chart instance

document.addEventListener('DOMContentLoaded', () => {
  // Correct the containerId according to your actual container's ID
  initWaffleChart('waffle-chart-container');
});

function initWaffleChart(containerId) {
  // This ensures we're using the right container ID and only creating one instance
  if (!document.getElementById(containerId)) {
    console.error(`Element with ID '${containerId}' not found.`);
    return;
  }
  waffleChartInstance = new WaffleChartGenerator(waffleData, containerId);
}

window.addEventListener('resize', () => {
  if (waffleChartInstance) {
    // Ideally, WaffleChartGenerator should have a method to properly handle resizing.
    // For now, we'll just re-initialize it.
    initWaffleChart(waffleChartInstance.containerId);
  }
});

// /////////////////////////////////////////////////////// //

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
});

// Adjust your event listener for resize
window.addEventListener('resize', handleResize);

// Function to add bishops to the bishop-section
function addBishops(bishops) {
    const bishopsList = document.getElementById('bishops-list');
    bishopsList.className = 'row'; // Add the 'row' class to the container
    bishops.forEach(bishop => {
      const bishopDiv = document.createElement('div');
      bishopDiv.className = 'bishop';
      bishopDiv.className = 'col'; // Using 'col' will divide the space equally among columns
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
        <div class="image-container">
          <div class="image-wrapper">
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
      dioceseDiv.className = 'diocese';
      dioceseDiv.className = 'col'; // Using 'col' will divide the space equally among columns
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
    let loadedCount = 0;
    Object.keys(urls).forEach(key => {
      loadCSVData(urls[key], data => {
        globalData[key.replace('URL', '')] = data;
        loadedCount++;
        // Check if all data is loaded
        if (loadedCount === Object.keys(urls).length) {
          console.log('All data loaded');
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

