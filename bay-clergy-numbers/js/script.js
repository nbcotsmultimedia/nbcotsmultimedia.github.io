// Create global object to hold data retrieved from CSV files, each property = empty array
let globalData = {
  bishops: [],
  priests: [],
  dioceses: []
};

// Create object with URLs to the CSV files
const urls = {
  bishopsURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRpj2MSEl5MwfD1f49Wgnnwo1_1gS9E5_6zEVGG3xPExaNPfqeAZoZBkycAWWIhBvtubhqb1BS9lFUy/pub?gid=509356210&single=true&output=csv',
  priestsURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRpj2MSEl5MwfD1f49Wgnnwo1_1gS9E5_6zEVGG3xPExaNPfqeAZoZBkycAWWIhBvtubhqb1BS9lFUy/pub?gid=1753742719&single=true&output=csv',
  diocesesURL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRpj2MSEl5MwfD1f49Wgnnwo1_1gS9E5_6zEVGG3xPExaNPfqeAZoZBkycAWWIhBvtubhqb1BS9lFUy/pub?gid=1147167947&single=true&output=csv'
};

// Function to load data from a single URL using Papa Parse
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

// Function to load all data from the CSVs in the urls object
function loadAllData() {

  let loadedCount = 0;

  Object.keys(urls).forEach(key => {

    // Call loadCSVData function, passing in URL and a callback function
    loadCSVData(urls[key], data => {

      globalData[key.replace('URL', '')] = data;
      // Keep track of how many files have been loaded using the loadedCount variable
      loadedCount++;

      // Check if all data is loaded
      if (loadedCount === Object.keys(urls).length) {

        // Call each function to add the data to the page by updating the corresponding property in the globalData object
        // addBishops(globalData.bishops);
        addPriests(globalData.priests);
        addDioceses(globalData.dioceses);

      }

    });
  });

}

/////////////////// WAFFLE CHART ///////////////////

// Generate a waffle chart
class WaffleChartGenerator {

  constructor(data, containerId, totalSquares) {

    // Initial setup = store the provided parameters
    this.data = data;
    this.containerId = containerId;
    this.totalSquares = totalSquares;

    // Map colors to data positions
    this.colorMap = {
      "Priest": "#6929c4",
      "Religious brother": "#009d9a",
      "Nun": "#ee538b",
      "Unknown or other": "#00539a"
    };

    // Set default configuration properties
    this.aspectRatio = 4 / 2; // Aspect ratio
    this.gapSize = .4; // Size of gap between squares in the chart
    this.totalValue = this.data.reduce((total, item) => total + item.lawsuits, 0); // Total num lawsuits calculated from the data

    // Initialize the chart creation process
    this.initializeChart();

  }

  // Function to map a data point's position to a color
  getColor(position) {

    // Return the color for the given position, or gray if not found
    return this.colorMap[position] || "gray";

  }

  // Initialize the chart's SVG element and set the size based on container and data
  initializeChart() {

    // Set container element using its ID, and get its width
    const containerElement = document.getElementById(this.containerId);
    const containerWidth = containerElement.clientWidth;
    this.containerWidth = containerWidth;

    // Calculate the size of each square in the chart
    const desiredNumberOfColumns = 54;
    this.squareSize = Math.floor((containerWidth - (desiredNumberOfColumns - 1) * this.gapSize) / desiredNumberOfColumns);

    // Calculate the number of rows needed based on the total number of squares
    this.numberOfRows = Math.ceil(this.totalSquares / desiredNumberOfColumns);

    // Calculate the height of the container based on the number of rows and margins
    this.containerHeight = this.numberOfRows * (this.squareSize + this.gapSize);

    // Remove any existing SVG elements from the container
    d3.select(`#${this.containerId}`).selectAll('svg').remove();

    // Create a new svg element within the container with attributes and styles
    const svg = d3.select(`#${this.containerId}`)
      .append("svg")
      .attr("viewBox", `0 0 ${containerWidth} ${this.containerHeight}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("display", "block")
      .style("margin", "auto");

    // Draw the waffle chart squares
    this.drawChart(svg, this.squareSize, desiredNumberOfColumns);
  }

  // Draw the individual swuares for the waffle chart
  drawChart(svg, squareSize, numCols) {

    let currentRow = 0, currentCol = 0, filledSquares = 0;
    const totalValue = this.totalValue;
    const totalSquares = this.totalSquares;

    // Iterate over each data item and draw the corresponding number of squares
    this.data.forEach(item => {
      if (!isNaN(item.lawsuits)) {
        const itemSquares = totalValue !== 0 ? Math.round(item.lawsuits / totalValue * totalSquares) : 0;
        for (let i = 0; i < itemSquares && filledSquares < totalSquares; i++) {
          const x = (currentCol * (squareSize + this.gapSize)) ;
          const y = (currentRow * (squareSize + this.gapSize)) ;
    
          // Append a rectangle element for the item
          svg.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", squareSize - this.gapSize)
            .attr("height", squareSize - this.gapSize)
            .attr("fill", this.getColor(item.position));
    
          // Update hte row and column for the next square
          currentRow++;
          if (currentRow >= Math.ceil(totalSquares / numCols)) {
            currentRow = 0;
            currentCol++;
          }
          filledSquares++;
        }
      } else {
        // Log a message if lawsuits is not a number
        console.error('Invalid lawsuits value for item:', item);
      }

    });
    
    // After creating the squares, draw the legend
    this.drawLegend(svg);

  }

  // Draw the legend for the waffle chart
  drawLegend() {
    
    // Select legend-container in HTML
    const legendContainer = d3.select('#legend-container');

    // Clear previous legend items if any
    legendContainer.html('');
  
    // Create legend items for each data point
    const legendItems = legendContainer.selectAll(".legend-item")
      .data(this.data)
      .enter()
      .append("div")
      .attr("class", "legend-item")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-bottom", "5px"); // Space between legend items
  
    // Append a colored square for eawch legend item
    legendItems.append("div")
      .style("width", "14px") // Legend color box width
      .style("height", "14px") // Legend color box height
      .style("margin-right", "5px") // Space between color box and text
      .style("background-color", d => this.colorMap[d.position]);
  
      // Append text labels for each legend item
    legendItems.append("text")
      .text(d => d.position)
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

// Total number of squares in chart
const totalSquares = 1597;

// Instantiate the class WaffleChartGenerator
const waffleChart = new WaffleChartGenerator(waffleData, 'waffle-chart-container', totalSquares);

// Function to initialize a waffle chart instance within the specified HTML element
function initWaffleChart(containerId) {

  // Check if an element with the provided containerId exists in the DOM
  if (!document.getElementById(containerId)) {
    // If not, log error
    console.error(`Element with ID '${containerId}' not found.`);
    return;
  }

  // Initialize waffleChartInstance with the provided containerId, using the WaffleChartGenerator constructor
  waffleChartInstance = new WaffleChartGenerator(waffleData, containerId, totalSquares);

}

// Debounce function to limit the rate at which a function can fire.
function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

const handleResize = () => {
  // Get the new container width based on the resized window
  const containerElement = document.getElementById(waffleChart.containerId);
  const newContainerWidth = containerElement.clientWidth;

  // Clear the SVG to redraw
  d3.select(`#${waffleChart.containerId}`).selectAll("*").remove();

  // Update the waffle chart with the new width and recalculate the layout
  waffleChart.containerWidth = newContainerWidth;
  waffleChart.initializeChart(); // Assuming this method redraws the chart and the legend

  // Since the initializeChart method re-creates the SVG, you don't need to select it again unless you use it after this point.
};

// Declare global reference to the chart instance
let waffleChartInstance;

////////////////////////////////////////////////////////

// BISHOPS

// Function to add bishops to the bishop-section
// function addBishops(bishops) {

//   const bishopsList = document.getElementById('bishops-list');
//   bishopsList.className = 'row'; // Add the 'row' class to the container
//   bishops.forEach(bishop => {
//     const bishopDiv = document.createElement('div');
//     bishopDiv.className = 'bishop col';
//     bishopDiv.innerHTML = `
//       <div class="image-container">
//         <div class="image-wrapper">
//           <img src="${bishop.img}" alt="Photo of ${bishop.bishopName}" class="img-fluid">
//         </div>
//         <h3 class="img-caption">${bishop.bishopName}</h3>
//         <p class="img-sub-caption">${bishop.diocese}</p>
//       </div>`;
//     bishopsList.appendChild(bishopDiv);
//   });

// }

// PRIESTS

// Function to add priests to the priest-section
function addPriests(priests) {
  const container = document.getElementById('priests-list');
  
  // Create a single row outside the loop
  const row = document.createElement('div');
  row.className = 'row';
  container.appendChild(row); // Append the new row to the container

  priests.forEach((priest) => {
    const priestDiv = document.createElement('div');
    priestDiv.className = 'col';
    priestDiv.innerHTML = `
      <div class="image-container">
        <div class="image-wrapper">
          <img src="${priest.img}" alt="Photo of ${priest.priestName}" class="img-fluid">
        </div>
        <h3 class="img-caption">${priest.priestName}</h3>
        <p class="img-sub-caption">${priest.diocese}</p>
        <p class="img-sub-sub-caption">${priest.newAccusations} new accusations</p>
      </div>`;
  
    row.appendChild(priestDiv);
  });  
}

// DIOCESES

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
  xtalk.signalIframe();
}

/////////////////// Event Listeners ///////////////////

// Function to initialize event listeners
function initializeEventListeners() {

  // Add event listener to handle window resize event
  window.addEventListener('resize', debounce(handleResize));

}

// Call initializeEventListeners during initialization phase
document.addEventListener('DOMContentLoaded', () => {
  initWaffleChart('waffle-chart-container');
  loadAllData();
  initializeEventListeners();
});