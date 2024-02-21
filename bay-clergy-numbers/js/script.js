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
  

  