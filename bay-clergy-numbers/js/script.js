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

// Declare class (blueprint) for generating waffle chart
class WaffleChartGenerator {

  // Takes three parameters that specify what kind of values the constructor expects to receive
  constructor(data, containerId, totalSquares) {

    // Store the data used to generate the waffle chart
    this.data = data;

    // Store the ID of the HTML container element where the chart will be rendered
    this.containerId = containerId;

    // Define the aspect ratio of the chart
    this.aspectRatio = 4 / 2;

    // Define the gap size between waffle chart squares
    this.gapSize = 3;

    // Define margins for the chart
    this.margin = { top: 10, right: 10, bottom: 10, left: 10 };

    // Store the total number of squares in the waffle chart
    this.totalSquares = totalSquares;

    // Calculate the total value by summing up the lawsuits of each item in the data array
    this.totalValue = this.data.reduce((total, item) => total + item.lawsuits, 0);

    // Call the initializeChart method to set up the chart
    this.initializeChart();

  }
  
  // Define getColor method within the chart generator class
  getColor(position) {

    // Create object colorMap to map each position to its corresponding color
    const colorMap = {
      "Priest": "#ff7f0e",
      "Religious brother": "#2ca02c",
      "Unknown or other": "#9467bd",
      "Nun": "#1f77b4"
    };

    // Default color to gray if position not found
    return colorMap[position] || "gray"; 
  
  }

  initializeChart() {
    
    // Get HTML element for the container
    const containerElement = document.getElementById(this.containerId);
    
    // Get width of container element
    const containerWidth = containerElement.clientWidth;

    // Set desired number of columns for the chart
    const desiredNumberOfColumns = 40;

    // Calculate size of each square based on total number of squares and desired number of columns
    const squareSize = Math.floor((containerWidth - (desiredNumberOfColumns - 1) * this.gapSize) / desiredNumberOfColumns); // Adjust square size considering gaps
    
    // Calculate number of rows needed based on total number of squares and desired number of columns
    const numberOfRows = Math.ceil(this.totalSquares / desiredNumberOfColumns);

    // Calculate the total height of the waffle chart grid including margins
    const containerHeight = numberOfRows * (squareSize + this.gapSize) + this.margin.top + this.margin.bottom;

    // Remove any existing SVG elements within the container to avoid duplication
    d3.select(`#${this.containerId}`).selectAll('svg').remove();
    
    // Create a new SVG element within the container and set its attributes and styles
    const svg =
      // Select the HTML element
      d3.select(`#${this.containerId}`)
        // Append svg
        .append("svg")
        // Set viewBox attribute that defines the position and dimensions of the content of the svg viewport
        .attr(
          "viewBox",
          `0 0 ${
            containerWidth + this.margin.left + this.margin.right
          } ${
            containerHeight
          }`)
        // Determine how the svg should scale
        .attr("preserveAspectRatio", "xMinYMin meet")
        // Set CSS property width to full width of container
        .style("width", "100%")
        // Adjust height automatically
        .style("height", "auto")
        // Display on own line
        .style("display", "block")
        // Center the svg horizontally
        .style("margin", "auto");

    // Call the drawChart method to render the waffle chart within the SVG element
    this.drawChart(svg, squareSize, desiredNumberOfColumns);
  }

  // Generate the chart within the svg container
  drawChart(svg, squareSize, numCols) {
    
    // Initialize three variables
    let currentRow = 0, // current row position
      currentCol = 0, // current column position
      filledSquares = 0; // count total filled squares

    // totalValue stores the sum of all lawsuit values in the dataset, representing the total number of lawsuits
    const totalValue = this.totalValue;

    // Access totalSquares (total number of squares in the chart) from the class instance
    const totalSquares = this.totalSquares;

    // Initialize the margin object
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    // Iterate over each item in the data set 'this.data'
    this.data.forEach(item => {

      // Check if lawsuits property is valid number
      if (!isNaN(item.lawsuits)) {

        // Calculate number of squares to draw for current item
        const itemSquares = totalValue !== 0 ? Math.round(item.lawsuits / totalValue * totalSquares) : 0;

        // Iterate over each square to be drawn for current item
        for (let i = 0; i < itemSquares && filledSquares < totalSquares; i++) {
          
          // Calculate x and y coordinates for the top-left corner of the current square
          const x = (currentCol * (squareSize + this.gapSize)) + margin.left;
          const y = (currentRow * (squareSize + this.gapSize)) + margin.top;
          
          // Append a rectangle element to the svg container, representing an individual square of the waffle chart
          svg.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", squareSize - this.gapSize)
            .attr("height", squareSize - this.gapSize)
            .attr("fill", this.getColor(item.position))
            .attr("stroke-width", this.gapSize)
            .attr("transform", `rotate(45, ${x}, ${y}) translate(-${squareSize / 2}, -${squareSize / 2})`);
          
          // Update the curent column and row indices
          currentCol++;

          // If the current column exceeds the specified number of columns (numCols), reset to 0 and increment the row index
          if (currentCol >= numCols) {
            currentCol = 0;
            currentRow++;
          }

          // Increment the count of filled squares
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

// Sort waffleData by lawsuits in descending order
// Ensure "Unknown or other" is last
waffleData.sort((a, b) => {
  return a.position === "Unknown or other" ? 1 :
    b.position === "Unknown or other" ? -1 :
    b.lawsuits - a.lawsuits;
});

// Total number of sqquares in chart
const totalSquares = 1597;

// Instantiate the class WaffleChartGenerator
const waffleChart = new WaffleChartGenerator(
  waffleData, // data for the waffle chart
  'waffle-chart-container', // id of the container element in html
  totalSquares // total number of squares in the chart
  );

// Declare global reference to the chart instance
let waffleChartInstance;

// Event listener that fires on load
document.addEventListener('DOMContentLoaded', () => {
  // Correct the containerId according to your actual container's ID
  initWaffleChart('waffle-chart-container');
});

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

// When the window is resized, the provided arrow function is executed
window.addEventListener('resize', () => {

  // Check if waffleChartInstance exists
  if (waffleChartInstance) {
    // Re-initializes the waffle chart with the updated dimensions of the container element
    initWaffleChart(waffleChartInstance.containerId);
  }

});

// /////////////////////////////////////////////////////// //

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
});

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
