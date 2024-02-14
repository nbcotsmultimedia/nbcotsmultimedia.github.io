// Configuration and global variables
let globalData;
let activeCard = null; // Globally track the active card

const googleSheetCSVURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRcgsrKaBpkNRe2mxvHVF3t5FsepLD9_ZrpdLJcJ236tyHX28uXbBuPDFkljyosiHbYEBpMMa1VuOe/pub?gid=0&single=true&output=csv';
const gridContainer = document.getElementById('accusersGrid');
const modal = document.getElementById('myModal');
const modalBody = document.getElementById('modalBody');
const closeButton = document.querySelector('.close');

// When DOM content loaded, call init
document.addEventListener('DOMContentLoaded', init);

// Event listener to close the modal when clicking outside of it
document.body.addEventListener('click', closeOutsideModal);

// Load accuser data from csv, set up event listeners, and attach resize event
function init() {
    // console.log("DOMContentLoaded event fired")
	loadAccusersData(googleSheetCSVURL);
	updateEventListeners(); // Set initial event listeners based on current viewport width
	window.addEventListener('resize', debounce(updateEventListeners, 250)); // Debounce the resize event
	closeButton.addEventListener('click', closeModal);
}

// Debounce function to limit the rate at which a function can fire
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this,
			args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

// Function to refresh page on resize past breakpoint (prevent duplication of 'more info' displays)
(function() {
	var widthThreshold = 768; // Set this to your mobile/desktop breakpoint
	var wasBelowThreshold = window.innerWidth < widthThreshold;

	window.addEventListener('resize', function() {
		var isBelowThreshold = window.innerWidth < widthThreshold;
		if (isBelowThreshold !== wasBelowThreshold) {
			window.location.reload(); // Refresh the page
			wasBelowThreshold = isBelowThreshold; // Update the threshold flag
		}
	});
})();

// Dynamically add or remove event listeners based on viewport width
function updateEventListeners() {
    // Remove all current event listeners to avoid duplicates
    gridContainer.removeEventListener('click', handleClick);
    gridContainer.removeEventListener('click', handleDesktopClick);

    const isMobileView = window.matchMedia('(max-width: 768px)').matches;

    // Add the appropriate event listener based on the viewport width
    if (isMobileView) {
        gridContainer.addEventListener('click', handleClick);
    } else {
        gridContainer.addEventListener('click', handleDesktopClick);
    }
}

// Click event handlers
// Mobile
function handleClick(event) {
    console.log("Clicked on accuser card")

    const target = event.target.closest('.accuser-card');
    if (target) {
        const accuser = getAccuserInfo(target);
        openModal(accuser);
        event.stopPropagation(); // Stop event propagation to prevent triggering other click handlers
    }
}

// Desktop
function handleDesktopClick(event) {
    const target = event.target.closest('.accuser-card');
    if (target) {
        // Check if the target is already the active card
        if (activeCard === target) {
            // If it's the active card, toggle its visibility
            toggleVisibility(target);
            activeCard = null; // Reset activeCard since it's toggled
        } else {
            // If there's a different active card, hide its more-info
            if (activeCard) {
                toggleVisibility(activeCard, false);
            }
            // Show the more-info of the new active card
            toggleVisibility(target, true);
            // Update the activeCard reference to the new card
            activeCard = target;
        }
        event.preventDefault(); // Prevent the default action (e.g., following a link)
        event.stopPropagation(); // Stop event propagation to prevent triggering other click handlers
    }
}

// Dynamically create HTML for each accuser card
function createCard(accuser, index) {
    // Create a new div element for the accuser card
    const card = document.createElement('div');
    card.className = 'accuser-card';

    // Create elements for image, overlay, and more-info sections
    const img = document.createElement('img');
    img.src = accuser.img;
    img.alt = accuser.name;
    img.className = 'img-fluid';

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
        <p class="accuser-head">ACCUSER</p>
        <p class="accuser-name">${accuser.name}</p>
    `;

    const moreInfo = document.createElement('div');
    moreInfo.className = 'more-info';
    moreInfo.style.display = 'none'; // Hide more-info section initially
    moreInfo.innerHTML = `
        <p class="accused-head">ACCUSED</p>
        <br />
        <p class="accused-name">${accuser.clergyMemberAccused}</p>
        <p class="assignment">${accuser.assignment}</p>
        <p class="location-date">${accuser.locationOfAccusation} <span class="right-aligned">${accuser.dateOfAccusation}</span></p>
        <div class='line'></div>
        <p class="nature">${accuser.natureOfAccusation}</p>
        <div class="footer"></div>
    `;

    // Append image and overlay to the card
    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(moreInfo);

    // Add footnote if accused is defrocked or deceased
    if (accuser.isDefrocked === "yes") {
        const footnote1 = document.createElement('p');
        footnote1.className = 'footnote';
        footnote1.textContent = '**Defrocked';
        moreInfo.querySelector('.footer').appendChild(footnote1);
    }
    if (accuser.isDeceased === "yes") {
        const footnote2 = document.createElement('p');
        footnote2.className = 'footnote';
        footnote2.textContent = '*Deceased';
        moreInfo.querySelector('.footer').appendChild(footnote2);
    }

    // Set a data attribute to store the index of the card
    card.setAttribute('data-id', `card-${index}`);

    // Return the constructed card element
    return card;
}

// Fetch accuser data from csv url using Papa Parse, call createGrid()
function loadAccusersData(url) {
	Papa.parse(url, {
		download: true,
		header: true,
		skipEmptyLines: true,
		complete: results => {
			globalData = results.data;
			createGrid(globalData);
			document.dispatchEvent(new Event('gridLoaded')); // Dispatch the custom event after grid creation
		},
		error: error => console.error('Error while fetching and parsing CSV:', error)
	});
}

// Generate the grid layout by iterating over the accuser data
function createGrid(data) {
	gridContainer.innerHTML = ''; // Clear existing content
	data.forEach((accuser, index) => {
		const card = createCard(accuser, index);
		gridContainer.appendChild(card);
	});
}

// Populate the modal with accuser info and display it
function openModal(accuser) {
    // Get the existing image element
    const accuserImage = document.getElementById('accuserImage');

    // Set the source attribute of the image element
    accuserImage.src = accuser.img;

    // Set the content of the modal body with information from the accuser
	modalBody.innerHTML = `
        <p class="accuser-head">ACCUSER</p>
        <p class="accuser-name">${accuser.name}</p>
        <img id="accuserImage" src="${accuser.img}" alt="${accuser.name}" class="img-fluid">
        <p class="accused-head">ACCUSED</p>
        <br />
        <p class="accused-name">${accuser.clergyMemberAccused}</p>
        <p class="assignment">${accuser.assignment}</p>
        <p class="location-date">${accuser.locationOfAccusation} <span class="right-aligned">${accuser.dateOfAccusation}</span></p>
        <p class="nature">${accuser.natureOfAccusation}</p>
    `;
	modal.style.display = 'block';
}

// Hide the modal
function closeModal() {
	modal.style.display = 'none';
}

// Hide the modal
function closeOutsideModal(event) {
    // Check if the clicked element is outside of the modal
	if (event.target == modal) {
		modal.style.display = 'none'; // Close the modal
	}
}

// Toggle the visibility of the more-info section of a card
function toggleVisibility(card) {
	const moreInfo = card.querySelector('.more-info');
	const overlay = card.querySelector('.overlay');
	if (moreInfo && overlay) {
		const isVisible = moreInfo.style.visibility === 'visible';
		overlay.style.visibility = isVisible ? 'visible' : 'hidden';
		moreInfo.style.visibility = isVisible ? 'hidden' : 'visible';
		moreInfo.style.display = isVisible ? 'none' : 'block';
	}
}

// Extract relevant info about an accuser from a clicked card element
function getAccuserInfo(element) {
    // Retrieve the index of the clicked card from its data-id attribute
    const index = parseInt(element.getAttribute('data-id').split('-')[1]);
    
    // Retrieve accuser information from the global data object
    const accuser = globalData[index];
    if (!accuser) {
        console.error("Accuser data not found for index:", index);
        return null;
    }

    return accuser;
}
