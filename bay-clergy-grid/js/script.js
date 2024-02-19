// Configuration and global variables
let globalData;
let activeCard = null; // Globally track the active card

const googleSheetCSVURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRcgsrKaBpkNRe2mxvHVF3t5FsepLD9_ZrpdLJcJ236tyHX28uXbBuPDFkljyosiHbYEBpMMa1VuOe/pub?gid=0&single=true&output=csv';
const gridContainer = document.getElementById('accusersGrid');
const modal = document.getElementById('myModal');
const modalBody = document.getElementById('modalBody');
const closeButton = document.querySelector('.close');
const arrowLeft = document.getElementById('arrowLeft');
const arrowRight = document.getElementById('arrowRight');

// Dynamically add or remove event listeners based on viewport width
function updateEventListeners() {
    gridContainer.removeEventListener('click', handleClick);
    gridContainer.removeEventListener('click', handleDesktopClick);

    const isMobileView = window.matchMedia('(max-width: 768px)').matches;

    if (isMobileView) {
        gridContainer.addEventListener('click', handleClick);
    } else {
        gridContainer.addEventListener('click', handleDesktopClick);
    }
}

// Function to refresh page on resize past breakpoint
(function() {
    var widthThreshold = 768;
    var wasBelowThreshold = window.innerWidth < widthThreshold;

    window.addEventListener('resize', function() {
        var isBelowThreshold = window.innerWidth < widthThreshold;
        if (isBelowThreshold !== wasBelowThreshold) {
            window.location.reload();
            wasBelowThreshold = isBelowThreshold;
        }
    });
})();

// When DOM content loaded, call init
document.addEventListener('DOMContentLoaded', init);

// Initialize function
function init() {
    arrowLeft.addEventListener('click', () => navigateAccuser(-1));
    arrowRight.addEventListener('click', () => navigateAccuser(1));

    loadAccusersData(googleSheetCSVURL);
    updateEventListeners();
    window.addEventListener('resize', debounce(updateEventListeners, 250));
    closeButton.addEventListener('click', closeModal);
    document.body.addEventListener('click', closeOutsideModal);
}

// Click event handlers
function handleClick(event) {
    const target = event.target.closest('.accuser-card');
    if (target) {
        const accuser = getAccuserInfo(target);
        openModal(accuser);
        event.stopPropagation();
    }
    console.log('Card clicked in mobile view');
}

function handleDesktopClick(event) {
    const target = event.target.closest('.accuser-card');
    if (target) {
        if (activeCard === target) {
            toggleVisibility(target);
            activeCard = null;
        } else {
            if (activeCard) {
                toggleVisibility(activeCard, false);
            }
            toggleVisibility(target, true);
            activeCard = target;
        }
        event.preventDefault();
        event.stopPropagation();
    }
    console.log('Card clicked in desktop view');
}

// Dynamically create HTML for each accuser card
function createCard(accuser, index) {
    const card = document.createElement('div');
    card.className = 'accuser-card';

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
    moreInfo.style.display = 'none';
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

    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(moreInfo);

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

    card.setAttribute('data-id', `card-${index}`);

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
            document.dispatchEvent(new Event('gridLoaded'));
        },
        error: error => console.error('Error while fetching and parsing CSV:', error)
    });
}

// Generate the grid layout by iterating over the accuser data
function createGrid(data) {
    gridContainer.innerHTML = '';
    data.forEach((accuser, index) => {
        const card = createCard(accuser, index);
        gridContainer.appendChild(card);
    });
    xtalk.signalIframe();
}

// MODAL
// Populate the modal with accuser info and display it
function openModal(accuser) {
    // Set the content of the modal body with information from the accuser
    modalBody.innerHTML = `
        <p class="accuser-head">ACCUSER</p>
        <p class="accuser-name">${accuser.name}</p>
        <img id="accuserImage" src="${accuser.img}" alt="${accuser.name}" class="img-fluid">
        <p class="accused-head">ACCUSED</p>
        <p class="accused-name">${accuser.clergyMemberAccused}</p>
        <p class="assignment">${accuser.assignment}</p>
        <p class="location-date">${accuser.locationOfAccusation} <span class="right-aligned">${accuser.dateOfAccusation}</span></p>
        <p class="nature">${accuser.natureOfAccusation}</p>
    `;
    
    // Create arrow buttons
    const arrowLeft = document.createElement('div');
    arrowLeft.id = 'arrowLeft';
    arrowLeft.alt = 'Previous';
    arrowLeft.className = 'arrow left-arrow';

    const arrowRight = document.createElement('div');
    arrowRight.id = 'arrowRight';
    arrowRight.alt = 'Next';
    arrowRight.className = 'arrow right-arrow';

    // Make sure you have the index of the accuser here
    const accuserIndex = globalData.findIndex((a) => a.name === accuser.name);
    modalBody.querySelector('#accuserImage').setAttribute('data-index', accuserIndex);

    // Assuming accuser has an id or index that matches the image number
    // If your accuser object has an 'id' property that matches the image number
    const imageNumber = accuser.id; // Replace 'id' with the correct property if different

    // Construct the image path with the image number
    const imagePath = `images/landscape-${String(imageNumber).padStart(2, '0')}.png`;

    // Set the image source to the new path
    modalBody.querySelector('#accuserImage').src = imagePath;

    // When clicked, these arrows trigger the 'navigateAccuser' function

    arrowLeft.addEventListener('click', () => navigateAccuser(-1)); // Navigate to previous accuser
    arrowRight.addEventListener('click', () => navigateAccuser(1)); // Navigate to next accuser
    
    // Append arrow buttons to modal body
    modalBody.appendChild(arrowLeft);
    modalBody.appendChild(arrowRight);

    // Display the modal
    modal.style.display = 'block';
}

// Function to navigate through accusers
function navigateAccuser(direction) {
    const currentImageIndex = parseInt(modalBody.querySelector('#accuserImage').getAttribute('data-index'));
    let nextIndex = currentImageIndex + direction;

    if (nextIndex < 0) {
        nextIndex = globalData.length - 1;
    } else if (nextIndex >= globalData.length) {
        nextIndex = 0;
    }

    const nextAccuser = globalData[nextIndex];

    if (nextAccuser) {
        modalBody.querySelector('#accuserImage').src = nextAccuser.img;
        modalBody.querySelector('#accuserImage').setAttribute('data-index', nextIndex);
        openModal(nextAccuser);
    } else {
        console.error('Next accuser not found.');
    }
}

// Close the modal
function closeModal() {
    console.log("Modal is being closed");
    modal.style.display = 'none';
}

// Close the modal when clicking outside of it
function closeOutsideModal(event) {
    console.log("Clicked outside modal");
    if (event.target == modal) {
        closeModal();
    }
}

// Toggle the visibility of the more-info section of a card
function toggleVisibility(card, show = null) {
    const moreInfo = card.querySelector('.more-info');
    const overlay = card.querySelector('.overlay');
    if (moreInfo && overlay) {
        const isVisible = show !== null ? show : moreInfo.style.visibility !== 'visible';
        overlay.style.visibility = isVisible ? 'visible' : 'hidden';
        moreInfo.style.visibility = isVisible ? 'visible' : 'hidden';
        moreInfo.style.display = isVisible ? 'block' : 'none';
    }
}

// Extract relevant info about an accuser from a clicked card element
function getAccuserInfo(element) {
    const index = parseInt(element.getAttribute('data-id').split('-')[1]);
    const accuser = globalData[index];
    if (!accuser) {
        console.error("Accuser data not found for index:", index);
        return null;
    }
    return accuser;
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
