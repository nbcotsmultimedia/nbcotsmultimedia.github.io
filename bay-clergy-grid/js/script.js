// Configuration and global variables
let globalData;

const googleSheetCSVURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRcgsrKaBpkNRe2mxvHVF3t5FsepLD9_ZrpdLJcJ236tyHX28uXbBuPDFkljyosiHbYEBpMMa1VuOe/pub?gid=0&single=true&output=csv';

document.addEventListener('DOMContentLoaded', init);

function init() {
	loadAccusersData(googleSheetCSVURL);
}

function loadAccusersData(url) {
	Papa.parse(url, {
	  download: true,
	  header: true,
	  skipEmptyLines: true,
	  complete: results => {
		globalData = results.data;
		createGrid(globalData);
	  },
	  error: error => console.error('Error while fetching and parsing CSV:', error)
	});
  }

function createGrid(data) {
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

	  // Click event
	  card.addEventListener('click', function() {
		if (moreInfo.style.visibility === "hidden" || moreInfo.style.visibility === "") {
			overlay.style.visibility = "hidden"; // Hide overlay but keep its space
			moreInfo.style.visibility = "visible"; // Show more info
			moreInfo.style.display = "block"; // Ensure it's block for visibility
		} else {
			overlay.style.visibility = "visible"; // Show overlay
			moreInfo.style.visibility = "hidden"; // Hide more info
		}
	});

	  // Append the card to the grid container
	  gridContainer.appendChild(card);

	});

  }

// Call init when the document is ready
document.addEventListener('DOMContentLoaded', function() {
	init();
  });
  