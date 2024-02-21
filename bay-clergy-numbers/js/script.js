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

// Define and initialize the waffleData variable
const waffleData = [
  { position: "Bishop", lawsuits: 4 },
  { position: "Deacon", lawsuits: 4 },
  { position: "Lay", lawsuits: 54 },
  { position: "Nun", lawsuits: 22 },
  { position: "Priest", lawsuits: 1267 },
  { position: "Religious brother", lawsuits: 139 },
  { position: "Seminarian", lawsuits: 2 },
  { position: "Unknown", lawsuits: 105 }
];

// Sort waffleData by lawsuits in descending order
waffleData.sort((a, b) => b.lawsuits - a.lawsuits);

// Function to get the index of a position
function getPositionIndex(position) {
  const positionOrder = {
    "Bishop": 0,
    "Deacon": 1,
    "Lay": 2,
    "Nun": 3,
    "Priest": 4,
    "Religious brother": 5,
    "Seminarian": 6,
    "Unknown": 7
  };
  return positionOrder[position];
}

// Function to generate the waffle chart
function WaffleChart(data, width, height, containerId) {

  // Calculate the total value of all data points
  const totalValue = data.reduce((acc, d) => acc + d.lawsuits, 0);

  // Define the number of rows and columns for the waffle chart
  const numRows = Math.ceil(Math.sqrt(totalValue)); // Adjusted to keep it as a square
  const numCols = Math.ceil(totalValue / numRows);

  // Calculate the size of each square
  const squareSize = Math.min(width / numCols, height / numRows);

  // Calculate the total number of squares based on the width and height
  const totalSquares = numRows * numCols;

  // Sort the data by position
  data.sort((a, b) => {
    return getPositionIndex(a.position) - getPositionIndex(b.position);
  });

  // Select the container element
  const container = d3.select(`#${containerId}`);

  // Append an SVG element to the container
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Initialize variables for tracking the current row and column
  let currentRow = 0;
  let currentCol = 0;

  // Iterate over the data to draw the waffle chart
  data.forEach(d => {
    // Calculate the number of squares for the current data point
    const numSquares = Math.round(d.lawsuits / totalValue * totalSquares);

    // Draw the squares for the current data point
    for (let i = 0; i < numSquares; i++) {
      // Calculate the position of the current square
      const x = currentCol * squareSize;
      const y = currentRow * squareSize;

      // Append a rectangle representing the square to the SVG
      svg.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", getColor(d.position));

      // Move to the next column
      currentCol++;

      // If we reach the end of a row, move to the next row
      if (currentCol >= numCols) {
        currentCol = 0;
        currentRow++;
      }
    }
  });

  // Function to assign color based on position
  function getColor(position) {
    // Map each position to a color
    const colorMap = {
      "Bishop": "blue",
      "Deacon": "green",
      "Lay": "red",
      "Nun": "orange",
      "Priest": "purple",
      "Religious brother": "yellow",
      "Seminarian": "pink",
      "Unknown": "cyan"
    };
    // Return the color based on the position
    return colorMap[position];
  }

  // Return the SVG element
  return svg;
}

// Call the WaffleChart function to generate the chart
const containerId = 'waffle-chart-container';
const width = 800; // Increased width for better visibility
const height = 300; // Height of the chart
WaffleChart(waffleData, width, height, containerId);

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