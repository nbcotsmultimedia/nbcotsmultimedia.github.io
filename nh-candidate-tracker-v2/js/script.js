// Constants
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778';

// Global variables - try to minimize or encapsulate within modules in the future
let allData = [];
let groupedData = {};

// Use jQuery to run when document is ready
$(document).ready(() => {
    init();
});

// Initialize the application
function init() {
    loadData();
    // Cache the window selector
    const $window = $(window);
    $window.on('resize', debounce(updateImages, 250));
}

// Position the plus icon relative to the last image
function positionPlusIcon($plusIcon, $lastImg) {
    // Get the last image's position
    const imgOffset = $lastImg.offset();
    const imgWidth = $lastImg.width();
    const imgHeight = $lastImg.height();

    // Calculate positions for the plus icon
    const iconSize = $plusIcon.outerWidth();
    const iconOffset = iconSize / 2; // Half the size of the icon for overlap

    // The right position should be the offset from the left of the document to the last image,
    // plus the width of the image, minus half of the icon's width (for the desired overlap).
    const rightPosition = imgOffset.left + imgWidth - iconOffset;

    // Similarly, calculate the bottom position
    const bottomPosition = imgOffset.top + imgHeight - iconOffset;

    // Apply the calculated positions to the plus icon using CSS 'transform' for better performance
    // and to avoid conflicts with other CSS properties like 'right' and 'bottom'.
    $plusIcon.css('transform', 'translate(' + rightPosition + 'px, ' + bottomPosition + 'px)');
}

// Update the window load and resize event handler
$(window).on('load resize', function() {
    updateImages(); // This will also call positionPlusIcon for each image container
});

// Fetch and load data, then run parseData function
function loadData() {
    Papa.parse(SPREADSHEET_URL, {
        download: true,
        header: true,
        complete: results => {
            allData = results.data;
            parseData();
        },
        // Add basic error handling
        error: error => {
            console.error('Error loading data:', error);
        }
    });
}

// Organize and format data
function parseData() {
    allData.sort((a, b) => new Date(a.date) - new Date(b.date));
    groupedData = groupBy(allData, 'event_id');
    updateImages();
}

// Group data by a specified key
function groupBy(arr, key) {
    return arr.reduce((acc, obj) => {
        const groupKey = obj[key];
        acc[groupKey] = acc[groupKey] || [];
        acc[groupKey].push(obj);
        return acc;
    }, {});
}

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

// Bind the position update to the window load event as well
$(window).on('load', updateImages);

// Refactored function to create event card
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
        console.log('Last Image Position:', lastImgPosition);
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

// Display a certain number of images depending on viewport
function getMaxImages() {
    const width = window.innerWidth;
    if (width >= 800) {
        return 3;
    } else if (width >= 600) {
        return 2;
    }
    return 1;
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