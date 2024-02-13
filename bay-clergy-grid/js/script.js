let currentlyVisibleInfo = null; // Define it outside any function

function init() {
	// console.log("ready");
	loadAccusersData(googleSheetCSVURL);
}

// Store sheet URL
const googleSheetCSVURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRcgsrKaBpkNRe2mxvHVF3t5FsepLD9_ZrpdLJcJ236tyHX28uXbBuPDFkljyosiHbYEBpMMa1VuOe/pub?gid=0&single=true&output=csv';

function loadAccusersData(url) {
	Papa.parse(url, {
	  download: true,
	  header: true,
	  skipEmptyLines: true,
	  complete: function(results) {
		// Now that you have your data, you can call a function to process this data
		createGrid(results.data);
	  },
	  error: function(error) {
		// Handle errors if necessary
		console.error('Error while fetching and parsing CSV:', error);
	  }
	});
  }

  function createGrid(data, index) {
	const gridContainer = document.getElementById('accusersGrid');
	gridContainer.innerHTML = ''; // Clear existing content
  
	data.forEach(accuser => {
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
	  });

	  // Append the card to the grid container
	  gridContainer.appendChild(card);
	});
  }  

// Using jQuery to call init when the document is ready
$(document).ready(function(){
	init();
});
