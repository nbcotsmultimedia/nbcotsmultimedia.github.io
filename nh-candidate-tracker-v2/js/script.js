// CONSTANTS

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778';

// UTILITY FUNCTIONS

// Group an array of rows by event key
function groupBy(arr, key) {
    return arr.reduce((acc, obj) => {
        (acc[obj[key]] = acc[obj[key]] || []).push(obj);
        return acc;
    }, {});
}
// Determine max num of candidate images to display
function getMaxImages() {
    return window.innerWidth >= 800 ? 3 : window.innerWidth >= 600 ? 2 : 1;
}
// Format multiple candidate names as a string
function formatCandidateNames(candidateNames) {
    if (candidateNames.length > 1) {
        if (candidateNames.length === 2) {
            // Join with " and " if there are exactly two candidates
            return candidateNames.join(' and ');
        } else {
            // Join with commas and "and" for more than two candidates
            return `${candidateNames.slice(0, -1).join(', ')}, and ${candidateNames.slice(-1)}`;
        }
    }
    return candidateNames[0]; // Return the single name if there's only one candidate
}
// Get the appropriate CSS class based on the party
function getPartyClass(party) {
    const partyClassMap = {
        'R': 'republican',
        'D': 'democrat',
        'I': 'independent'
        // Add more mappings as needed
    };
    return partyClassMap[party] || 'other-party'; // Default class for parties not listed
}
// Debounce function to limit the rate at which a function can fire
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
}

// DATA PROCESSING

// Organize and format data
function parseData() {
    allData.sort((a, b) => new Date(a.date) - new Date(b.date));
    groupedData = groupBy(allData, 'event_id');
    updateImages();
}

// DOM MANIPULATION AND EVENT HANDLING

// Update images based on grouped data
function updateImages() {
    const $content = $("#content");
    $content.empty(); // Empty content element
    const maxImages = getMaxImages(); // Store max # of candidate images to show based on viewport

    Object.entries(groupedData).forEach(([eventId, eventGroup]) => {
        const combinedCard = createEventCard(eventGroup, maxImages);
        $content.append(combinedCard);
    });

    // Find the last visible image in each imageContainer
    $(".image-container").each(function() {
        const $lastImg = $(this).find('img.visible:last');
        if ($lastImg.length) {
            const $plusIcon = $(this).find('.plus-icon');
            positionPlusIcon($plusIcon, $lastImg);
        }
    });
}
// Create event card
function createEventCard(eventGroup, maxImages) {
    const combinedCard = $("<div class='event-card'></div>");
    const candidateNames = eventGroup.map(eventData => `${eventData.candidate} (${eventData.party[0]})`);
    const candidateImages = eventGroup.map(eventData => ({
        src: eventData.img,
        party: eventData.party[0]
    }));

    const imageContainer = createImageContainer(candidateImages, maxImages);
    const subCard = createSubCard(eventGroup[0], imageContainer);
    combinedCard.append($("<p class='name'>" + formatCandidateNames(candidateNames) + "</p>"), subCard);

    // After images have been appended
    const lastImage = imageContainer.find('img.visible:last');
    if (lastImage.length) {
        const lastImgPosition = lastImage.position();
    }

    return combinedCard;
}
// Create sub card
function createSubCard(firstEvent, imageContainer) {
    const timeData = firstEvent.time.split(' ');
    const time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");
    const info = $("<div class='info'></div>").append(
        "<p class='type'>" + firstEvent.event_type + "</p>",
        `<p class="address">${firstEvent.address_line_1}<br>${firstEvent.address_line_2}<br>${firstEvent.city}, ${firstEvent.state} ${firstEvent.zip}</p>`,
        "<p class='description'>" + firstEvent.description + "</p>"
    );

    return $("<div class='sub-card'></div>").append(time, info, imageContainer);
}
// Create image container
function createImageContainer(candidateImages, maxImages) {
    const imageContainer = $("<div class='image-container'></div>");

    candidateImages.forEach((imgData, index) => {
        if (index < maxImages) {
            const imgElement = $("<img>", {
                src: imgData.src,
                class: 'img-fluid visible ' + getPartyClass(imgData.party),
                'party': imgData.party
            });
            imageContainer.append(imgElement);
        }
    });

    const remainingCandidates = candidateImages.length - maxImages;
    if (remainingCandidates > 0) {
        const plusIcon = $("<div class='plus-icon'>+" + remainingCandidates + "</div>");
        imageContainer.append(plusIcon);
    }

    return imageContainer;
}
// Position the plus icon
function positionPlusIcon($plusIcon, $lastImg) {
    // Get the position of the last image relative to the document
    const imgOffset = $lastImg.offset();
    const imgWidth = $lastImg.outerWidth();
    const imgHeight = $lastImg.outerHeight();

    // Determine the desired position for the plus icon
    const translateX = 45; // The desired right position
    const translateY = 40; // The desired bottom position

    // Apply the calculated translation to the plus icon
    $plusIcon.css({
        'transform': `translate(${translateX}px, ${translateY}px)`,
        'transform-origin': 'top left' // Ensure the transform is relative to the top-left of the plus icon
    });
}
// Update the plus icon on resize
function updatePlusIconPositions() {
    $(".image-container").each(function() {
        const $lastImg = $(this).find('img.visible:last');
        const $plusIcon = $(this).find('.plus-icon');
        if ($lastImg.length && $plusIcon.length) {
            positionPlusIcon($plusIcon, $lastImg);
        }
    });
}

// DATA LOADING

// Fetch and load data, then run parseData function
function loadData() {
    Papa.parse(SPREADSHEET_URL, {
        download: true,
        header: true,
        complete: results => {
            allData = results.data;
            allData.sort((a, b) => new Date(a.date) - new Date(b.date));
            groupedData = groupBy(allData, 'event_id');
            updateImages();
        },
        error: error => {
            // Improved error handling for user interface
            displayError('Error loading data');
            console.error('Error loading data:', error);
        }
    });
}

// INITIALIZATION

// Initialize the application
$(document).ready(() => {
    loadData();
    $(window).on('resize', debounce(updateImages, 250));
});

// Make sure images are loaded before positioning the plus icon
$(document).on('load', 'img.img-fluid.visible', function() {
    positionPlusIcon($(this).closest('.image-container').find('.plus-icon'), $(this));
});











