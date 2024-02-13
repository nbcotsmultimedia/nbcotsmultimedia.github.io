
function init() {
	console.log("ready");
	loadAccusersData(googleSheetCSVURL);
}

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

  function createGrid(data) {
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

	  // Append the card to the grid container
	  gridContainer.appendChild(card);
	});
  }  

// Using jQuery to call init when the document is ready
$(document).ready(function(){
	init();
});
