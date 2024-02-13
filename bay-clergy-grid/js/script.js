// Configuration and global variables
let globalData;

const googleSheetCSVURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRcgsrKaBpkNRe2mxvHVF3t5FsepLD9_ZrpdLJcJ236tyHX28uXbBuPDFkljyosiHbYEBpMMa1VuOe/pub?gid=0&single=true&output=csv';

document.addEventListener('DOMContentLoaded', init);

function init() {
    loadAccusersData(googleSheetCSVURL);

	// Check if the device is a touchscreen device
    const isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    const gridContainer = document.getElementById('accusersGrid');
    if (isTouchDevice) {
        // For touchscreen devices, add touchstart event listener
        gridContainer.addEventListener('touchstart', handleTouchStart);
    } else {
        // For non-touchscreen devices (e.g., desktop), add click event listener
        gridContainer.addEventListener('click', handleClick);
    }
}

function handleTouchStart(event) {
	event.stopPropagation();
    const target = event.target.closest('.accuser-card');
    if (target) {
        const accuser = getAccuserInfo(target);
        openModal(accuser);
    }
}

function handleClick(event) {
	event.stopPropagation();
    const target = event.target.closest('.accuser-card');
    if (target) {
        const accuser = getAccuserInfo(target);
        openModal(accuser);
    }
}

function getAccuserInfo(element) {
    // Retrieve accuser information from the clicked card element
    const accuser = {
        name: element.querySelector('p').innerText,
        // Add other properties as needed
    };
    return accuser;
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
        const card = createCard(accuser, index, gridContainer);
        // Add the event listener to open the modal
        card.addEventListener('click', function () {
            openModal(accuser);
        });
        gridContainer.appendChild(card);
    });
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
	return card;
}

function openModal(accuser) {
    const modal = document.getElementById('myModal');
    const modalBody = document.getElementById('modalBody');

    // Set the content inside the modal
    modalBody.innerHTML = `
        <p class="accused">ACCUSED<br />${accuser.clergyMemberAccused}</p>
        <p>${accuser.assignment}</p>
        <p class="location-date">${accuser.locationOfAccusation} <span class="right-aligned">${accuser.dateOfAccusation}</span></p>
        <p class="nature">${accuser.natureOfAccusation}</p>
    `;

    // Show the modal
    modal.style.display = 'block';
}

// Get the element that closes the modal
const closeButton = document.querySelector('.close');

// When the user clicks on (x), close the modal
closeButton.onclick = function () {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    const modal = document.getElementById('myModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

function toggleVisibility(card) {
    const moreInfo = card.querySelector('.more-info');
    const overlay = card.querySelector('.overlay');
    if (moreInfo && overlay) {
        const isVisible = moreInfo.style.visibility === "visible";
        overlay.style.visibility = isVisible ? "visible" : "hidden";
        moreInfo.style.visibility = isVisible ? "hidden" : "visible";
        moreInfo.style.display = isVisible ? "none" : "block";
    }
}
