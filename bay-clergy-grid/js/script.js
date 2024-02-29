// Configuration and global variables
let globalData;
let activeCard = null; // Globally track the active card
let mouseY = 0;


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
        <p class="accused-name">${accuser.clergyMemberAccused}</p>
        <p class="assignment">${accuser.assignment}</p>
        <div class="location-date">
            <p class="location">${accuser.locationOfAccusation}</p>
            <p class="date">${accuser.dateOfAccusation}</p>
        </div>
        <div class='line'></div>
        <p class="nature">${accuser.natureOfAccusation}</p>
        <div class="footer"></div>
    `;
    
    // Count the number of characters in the location
    const locationText = accuser.locationOfAccusation;
    const locationCharacterCount = locationText.length;

    // Determine if the location should be stacked
    const isLocationStacked = locationCharacterCount > 13;

    // Apply the classes accordingly
    if (isLocationStacked) {
        moreInfo.querySelector('.location-date').classList.add('location-stacked');
    } else {
        moreInfo.querySelector('.location-date').classList.add('location-side-by-side');
        moreInfo.querySelector('.date').classList.add('right-aligned');
    }

    // Append image, overlay, more info
    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(moreInfo);

    // Check if moreInfo data is available and create a read more link
    if (accuser.moreInfo && accuser.moreInfo.trim() !== "") {
        const readMoreContainer = document.createElement('div');
        readMoreContainer.className = 'read-more-container right-aligned'; // Add both classes for styling and alignment

        const readMoreLink = document.createElement('a');
        readMoreLink.href = accuser.moreInfo; // Set the href attribute to the moreInfo URL
        readMoreLink.textContent = 'Read more'; // Text to display
        readMoreLink.target = '_blank'; // Open in a new tab
        readMoreLink.className = 'read-more-link'; // Optional: add a class for additional styling

        readMoreLink.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        readMoreContainer.appendChild(readMoreLink); // Append the read more link to the container
        moreInfo.appendChild(readMoreContainer); // Append the container to the moreInfo div
    }

    // Check if defrocked or deceased; if so, append footer
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

    // Set id for card
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

    $(".accuser-card").click(function(){
        // console.log($(this))
        mouseY = $(this).position().top;
        

        if (mouseY > 1400) {
            // mouseY -= 1000;
        }

        console.log(mouseY);
    })

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

    // Add defrocked or deceased footnotes if applicable
    const footer = document.createElement('div');
    footer.className = 'footer';
    if (accuser.isDefrocked === "yes") {
        const footnote1 = document.createElement('p');
        footnote1.className = 'footnote';
        footnote1.textContent = '**Defrocked';
        footer.appendChild(footnote1);
    }
    if (accuser.isDeceased === "yes") {
        const footnote2 = document.createElement('p');
        footnote2.className = 'footnote';
        footnote2.textContent = '*Deceased';
        footer.appendChild(footnote2);
    }

    // Append the footer to the modal body if it has any child nodes (footnotes)
    if (footer.hasChildNodes()) {
        modalBody.appendChild(footer);
    }

    // Check if moreInfo URL is available and add a "Read more" link
    if (accuser.moreInfo && accuser.moreInfo.trim() !== "") {
        modalBody.innerHTML += `
            <p class="modal-read-more"><a href="${accuser.moreInfo}" target="_blank">Read more</a></p>
        `;
    }

    // Create arrow container with arrows inside it
    const arrowsContainer = document.createElement('div');
    arrowsContainer.className = 'arrows-container';
    arrowsContainer.innerHTML = `
        <div id="arrowLeft" class="arrow left-arrow" alt="Previous"></div>
        <div id="arrowRight" class="arrow right-arrow" alt="Next"></div>
    `;

    // Append the arrow container to the modal body
    modalBody.appendChild(arrowsContainer);

    // Attach event listeners to the arrows within the arrowsContainer
    const arrowLeftButton = arrowsContainer.querySelector('#arrowLeft');
    const arrowRightButton = arrowsContainer.querySelector('#arrowRight');

    arrowLeftButton.addEventListener('click', () => navigateAccuser(-1));
    arrowRightButton.addEventListener('click', () => navigateAccuser(1));

    // Make sure you have the index of the accuser here
    const accuserIndex = globalData.findIndex((a) => a.name === accuser.name);
    modalBody.querySelector('#accuserImage').setAttribute('data-index', accuserIndex);

    // Set image number
    const imageNumber = accuser.id;

    // Construct the image path with the image number
    const imagePath = `images/landscape-${String(imageNumber).padStart(2, '0')}.png`;

    // Set the image source to the new path
    modalBody.querySelector('#accuserImage').src = imagePath;

    // Display the modal
    modal.style.display = 'block';

    $(".modal-content").css("top",mouseY);
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
    // console.log("Modal is being closed");
    modal.style.display = 'none';
}

// Close the modal when clicking outside of it
function closeOutsideModal(event) {
    // console.log("Clicked outside modal");
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
        // overlay.style.visibility = isVisible ? 'visible' : 'hidden';
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
