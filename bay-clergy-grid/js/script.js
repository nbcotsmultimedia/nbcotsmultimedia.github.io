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
  
	data.forEach((accuser, index) => createCard(accuser, index, gridContainer));
  }

function createCard(accuser, index, container) {
    const card = document.createElement('div');
    card.className = 'accuser-card';
    card.innerHTML = `
        <img src="${accuser.img}" alt="${accuser.name}" class="img-fluid">
        <div class="overlay">
            <p>ACCUSER</p>
            <p>${accuser.name}</p>
        </div>
        <div class="more-info" style="display: none;">
            <p class="accused">ACCUSED<br />${accuser.clergyMemberAccused}</p>
            <p>${accuser.assignment}</p>
            <p class="location-date">${accuser.locationOfAccusation} <span class="right-aligned">${accuser.dateOfAccusation}</span></p>
            <p class="nature">${accuser.natureOfAccusation}</p>
        </div>
    `;
    card.setAttribute('data-id', `card-${index}`);
    card.addEventListener('click', () => toggleVisibility(card));
    container.appendChild(card);
}

function toggleVisibility(card) {
    const moreInfo = card.querySelector('.more-info');
    const overlay = card.querySelector('.overlay');
    const isVisible = moreInfo.style.visibility === "visible";
    overlay.style.visibility = isVisible ? "visible" : "hidden";
    moreInfo.style.visibility = isVisible ? "hidden" : "visible";
    moreInfo.style.display = isVisible ? "none" : "block";
}