let globalData;
let currentlyVisibleInfo = null; // Define it outside any function

// Utility function to calculate cells per row
function getCellsPerRow() {
    const gridContainerWidth = document.getElementById('accusersGrid').offsetWidth;
    const cardWidth = 200; // Adjust this based on your actual card width
    return Math.floor(gridContainerWidth / cardWidth);
}

// Check if cell is an orphan
function isOrphan(index, total, cellsPerRow) {
	const rows = Math.ceil(total / cellsPerRow);
	const fullRows = Math.floor(total / cellsPerRow);
	const itemsInLastRow = total % cellsPerRow;
  
	// An orphan cell is one that's in the last row when that row isn't full
	const inLastRow = index >= (fullRows * cellsPerRow);
	return inLastRow && itemsInLastRow === 1;
  }

function adjustOrphanCells(data) {
    // Ensure this function is defined before the first call in createGrid
    const cellsPerRow = getCellsPerRow();
    const cells = document.querySelectorAll('.accuser-card');
    cells.forEach((cell, index) => {
        const moreInfo = cell.querySelector('.more-info');
        if (isOrphan(index, data.length, cellsPerRow)) {
            // Apply specific adjustments
            moreInfo.style.minHeight = '500px';
            moreInfo.style.overflowY = 'auto';
        } else {
            // Reset adjustments if not an orphan
            moreInfo.style.minHeight = '';
            moreInfo.style.overflowY = '';
        }
    });
}

function init() {
	// console.log("ready");
	loadAccusersData(googleSheetCSVURL);
}

// Store sheet URL
const googleSheetCSVURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRcgsrKaBpkNRe2mxvHVF3t5FsepLD9_ZrpdLJcJ236tyHX28uXbBuPDFkljyosiHbYEBpMMa1VuOe/pub?gid=0&single=true&output=csv';

// Load data
function loadAccusersData(url) {
	Papa.parse(url, {
	  download: true,
	  header: true,
	  skipEmptyLines: true,
	  complete: function(results) {
		globalData = results.data // Store the loaded data globally
		createGrid(globalData); // Create the grid using global data
	  },
	  error: function(error) {
		console.error('Error while fetching and parsing CSV:', error);
	  }
	});
  }

// Create grid
function createGrid(data) {
	// console.log(data);
	const gridContainer = document.getElementById('accusersGrid');
	gridContainer.innerHTML = ''; // Clear existing content
  
	data.forEach((accuser, index) => {
	  // Create the card container
	  const card = document.createElement('div');
	  card.className = 'accuser-card';
  
	  // Add the image
	  const image = document.createElement('img');
	  image.src = accuser.img;
	  image.alt = accuser.name;
	  image.className = 'img-fluid';
	  card.appendChild(image);
  
	  // Create the overlay div
	  const overlay = document.createElement('div');
	  overlay.className = 'overlay';
  
	  // Add "ACCUSER" text
	  const accuserLabel = document.createElement('p');
	  accuserLabel.textContent = 'ACCUSER';
	  overlay.appendChild(accuserLabel);
	  
	  // Add accuser's name
	  const accuserName = document.createElement('p');
	  accuserName.textContent = accuser.name;
	  overlay.appendChild(accuserName);
	  
	  // Append the overlay to the card
	  card.appendChild(overlay);

	  // Additional information div
	  const moreInfo = document.createElement('div');
      moreInfo.className = 'more-info';
      moreInfo.style.display = 'none'; // Hidden by default
      
	  // Formatting the additional information
	  moreInfo.innerHTML = `
      <p class="accused">ACCUSED<br />${accuser.clergyMemberAccused}</p>
      <p>${accuser.assignment}</p>
      <p class="location-date">
        ${accuser.locationOfAccusation} 
        <span class="right-aligned">${accuser.dateOfAccusation}</span>
      </p>
      <p class="nature">${accuser.natureOfAccusation}</p>
    `;

      card.appendChild(moreInfo);

	  // Assign an identifier to each card
	  card.setAttribute('data-id', `card-${index}`);

	  // Adjusted Click event to toggle visibility and handle multiple clicks
	  card.addEventListener('click', function() {
		// Check if this card's moreInfo is currently shown
		const isThisInfoVisible = currentlyVisibleInfo === moreInfo;
  
		// Hide previously shown moreInfo if any
		if (currentlyVisibleInfo && currentlyVisibleInfo !== moreInfo) {
		  currentlyVisibleInfo.style.display = 'none';
		  const prevCardOverlay = currentlyVisibleInfo.parentNode.querySelector('.overlay');
		  const prevCardImage = currentlyVisibleInfo.parentNode.querySelector('img');
		  if (prevCardOverlay) prevCardOverlay.style.display = 'flex';
		  if (prevCardImage) prevCardImage.style.display = 'block';
		}
  
		// Toggle this card's moreInfo based on its current state
		if (isThisInfoVisible) {
		  overlay.style.display = 'flex';
		  image.style.display = 'block';
		  moreInfo.style.display = 'none';
		  currentlyVisibleInfo = null;
		} else {
		  overlay.style.display = 'none';
		  image.style.display = 'none';
		  moreInfo.style.display = 'block';
		  currentlyVisibleInfo = moreInfo;
		}

		const cellsPerRow = getCellsPerRow();

		if (isOrphan(index, data.length, cellsPerRow)) { // Assuming you know cellsPerRow
			// Apply specific adjustments to the card or moreInfo
			// This might involve setting a max height, adjusting alignment, etc.
			moreInfo.style.minHeight = '500px'; // Example adjustment
			moreInfo.style.overflowY = 'auto'; // Allow scrolling within moreInfo
		  }

		// Check isOrphan function
		// console.log(index, data.length, cellsPerRow, isOrphan(index, data.length, cellsPerRow));

	  });

	  // Append the card to the grid container
	  gridContainer.appendChild(card);

	});

	// After the grid is fully created:
	adjustOrphanCells(data);
  }

window.addEventListener('resize', function() {
	adjustOrphanCells(globalData);
  });

// Call init when the document is ready
document.addEventListener('DOMContentLoaded', function() {
	init();
  });
  