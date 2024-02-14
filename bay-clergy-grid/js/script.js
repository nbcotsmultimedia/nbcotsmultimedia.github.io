// Configuration and global variables
let globalData;
let activeCard = null; // Globally track the active card

const googleSheetCSVURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRcgsrKaBpkNRe2mxvHVF3t5FsepLD9_ZrpdLJcJ236tyHX28uXbBuPDFkljyosiHbYEBpMMa1VuOe/pub?gid=0&single=true&output=csv';
const gridContainer = document.getElementById('accusersGrid');
const modal = document.getElementById('myModal');
const modalName = document.getElementById('modal-accuser-name');
const modalBody = document.getElementById('modalBody');
const closeButton = document.querySelector('.close');

// Event listeners
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadAccusersData(googleSheetCSVURL);
    updateEventListeners(); // Set initial event listeners based on current viewport width
    window.addEventListener('resize', debounce(updateEventListeners, 250)); // Debounce the resize event
    closeButton.addEventListener('click', closeModal);
}

// Debounce function to limit the rate at which a function can fire.
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
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

function handleClick(event) {
    const target = event.target.closest('.accuser-card');
    if (target) {
        event.stopPropagation(); // Stop propagation here to prevent desktop handler from firing
        const accuser = getAccuserInfo(target);
        openModal(accuser);
    }
}

function handleDesktopClick(event) {
    const target = event.target.closest('.accuser-card');
    if (target) {
        // Check if the target is already the active card
        if (activeCard === target) {
            // If it's the active card, toggle its visibility
            toggleVisibility(target);
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
        event.preventDefault();
        event.stopPropagation();
    }
}

function createCard(accuser, index) {
    const card = document.createElement('div');
    card.className = 'accuser-card';
    
    let innerHTML = `
        <img src="${accuser.img}" alt="${accuser.name}" class="img-fluid">
        <div class="overlay">
            <p class="accuser-head">ACCUSER</p>
            <p class="accuser-name">${accuser.name}</p>
        </div>
        <div class="more-info" style="display: none;">
            <p class="accused-head">ACCUSED</p>
            <br />
            <p class="accused-name">${accuser.clergyMemberAccused}</p>
            <p class="assignment">${accuser.assignment}</p>
            <p class="location-date">${accuser.locationOfAccusation} <span class="right-aligned">${accuser.dateOfAccusation}</span></p>
            <div class='line'></div>
            <p class="nature">${accuser.natureOfAccusation}</p>
            <div class="footer">`; // Opening div tag for footer
            
            // Add footnote if accused is defrocked or deceased
            if (accuser.isDefrocked === "yes") {
                innerHTML += '<p class="footnote">**Defrocked</p>';
            }
            if (accuser.isDeceased === "yes") {
                innerHTML += '<p class="footnote">*Deceased</p>';
            }
            
    innerHTML += `</div></div>`; // Closing div tags for footer and more-info
    
    card.innerHTML = innerHTML;
    card.setAttribute('data-id', `card-${index}`);
    
    return card;
}


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

function createGrid(data) {
    gridContainer.innerHTML = ''; // Clear existing content
    data.forEach((accuser, index) => {
        const card = createCard(accuser, index);
        gridContainer.appendChild(card);
    });
}

function openModal(accuser) {
    console.log('Opening modal for:', accuser);
    // modalName.textContent = accuser.name;
    modalBody.innerHTML = `
        <p class="accused">ACCUSED<br />${accuser.clergyMemberAccused}</p>
        <p class="assignment">${accuser.assignment}</p>
        <p class="location">${accuser.locationOfAccusation}</p>
        <p class="date">${accuser.dateOfAccusation}</p>
        <p class="nature">${accuser.natureOfAccusation}</p>
    `;
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

function closeOutsideModal(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

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

function getAccuserInfo(element) {
    // Retrieve accuser information from the clicked card element
    const name = element.querySelector('.accuser-name').textContent;
    const clergyMemberAccused = element.querySelector('.accused').textContent.split('ACCUSED')[1].trim();
    const assignment = element.querySelector('.assignment').textContent;
    const locationOfAccusation = element.querySelector('.location-date').childNodes[0].textContent.trim();
    const dateOfAccusation = element.querySelector('.right-aligned').textContent;
    const natureOfAccusation = element.querySelector('.nature')?.textContent.trim();

    // Construct the accuser object
    const accuser = {
        name,
        clergyMemberAccused,
        assignment,
        locationOfAccusation,
        dateOfAccusation,
        natureOfAccusation
    };
    return accuser;
}

