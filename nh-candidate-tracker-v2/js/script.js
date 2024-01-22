// Constants
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778';

// Global variables
let allData;
let groupedData;

// When document is ready, run the init function
$(document).ready(init);

// Initialize the application
function init() {
    loadData();
    $(window).on('resize', debounce(updateImages, 250));
}

// Fetch and load data, then run parseData function
function loadData() {
    Papa.parse(SPREADSHEET_URL, {
        download: true,
        header: true,
        complete: function (results) {
            allData = results.data;
            parseData();
        },
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
    $("#content").empty();
    const maxImages = getMaxImages();

    for (const eventId in groupedData) {
        if (groupedData.hasOwnProperty(eventId)) {
            const eventGroup = groupedData[eventId];
            const combinedCard = $("<div class='event-card'></div>");
            const candidateNames = eventGroup.map(eventData => eventData.candidate + " (" + eventData.party[0] + ")");
            const candidateImages = eventGroup.map(eventData => ({
                src: eventData.img,
                party: eventData.party[0]
            }));
            const imageContainer = $("<div class='image-container'></div>");

            const firstEvent = eventGroup[0];
            const timeData = firstEvent.time.split(' ');
            const time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");
            const info = $("<div class='info'></div>").append(
                "<p class='type'>" + firstEvent.event_type + "</p>",
                '<p class="address">' +
                firstEvent.address_line_1 + "<br>" +
                firstEvent.address_line_2 + "<br>" +
                firstEvent.city + ", " +
                firstEvent.state + " " +
                firstEvent.zip + "</p>",
                "<p class='description'>" + firstEvent.description + "</p>"
            );

            candidateImages.forEach((imgData, index) => {
                const imgElement = $("<img>", {
                    src: imgData.src,
                    class: 'img-fluid visible ' + getPartyClass(imgData.party),
                    'party': imgData.party
                });
                if (index < maxImages) {
                    imageContainer.append(imgElement);
                }
            });

            const remainingCandidates = candidateImages.length - maxImages;
            if (remainingCandidates > 0) {
                const plusIcon = $("<div class='plus-icon'>+" + remainingCandidates + "</div>");
                imageContainer.append(plusIcon);
            }

            const subCard = $("<div class='sub-card'></div>").append(time, info, imageContainer);
            const candidateNameText = formatCandidateNames(candidateNames);
            combinedCard.append($("<p class='name'>" + candidateNameText + "</p>"), subCard);
            $("#content").append(combinedCard);

            if (remainingCandidates > 0) {
                const iconPosition = calculateIconPosition(imageContainer);
                imageContainer.find('.plus-icon').css({
                    'position': 'absolute',
                    'bottom' : '30px',
                    'right' : '19px'
                    // 'bottom': iconPosition.bottom + 'px',
                    // 'right': iconPosition.right + 'px'
                });
            }
        }
    }
}

// Get the appropriate CSS class based on the party
function getPartyClass(party) {
    const partyClassMap = {
        'R': 'republican',
        'D': 'democrat',
        // Add more mappings as needed
    };
    return partyClassMap[party] || 'other-party'; // Default class for parties not listed
}

function calculateIconPosition(imageContainer) {
    const lastVisibleImage = imageContainer.find('img.visible:last');
    
    if (lastVisibleImage.length > 0) {
        // Get the position of the last image relative to the image container
        const imagePosition = lastVisibleImage.position();
        
        // Use the outer dimensions of the image including margin
        const imageWidth = lastVisibleImage.outerWidth(true);
        const imageHeight = lastVisibleImage.outerHeight(true);

        // Adjust this value to move the icon to the left
        const rightOffset = -10; // Decrease this number to move the icon further to the left

        // Calculate the right and bottom positions for the plus icon
        const rightPosition = imageContainer.width() - imagePosition.left - imageWidth + rightOffset;
        const bottomPosition = imageContainer.height() - imagePosition.top - imageHeight + rightOffset; // Adjust if necessary

        // Adjust the calculated positions if they are less than zero
        const adjustedRightPosition = rightPosition > 0 ? rightPosition : 0;
        const adjustedBottomPosition = bottomPosition > 0 ? bottomPosition : 0;

        // Log the calculated positions
        console.log(`Calculated position - Right: ${adjustedRightPosition}, Bottom: ${adjustedBottomPosition}`);

        return {
            right: adjustedRightPosition,
            bottom: adjustedBottomPosition
        };
    } else {
        // Fallback position if no images are visible
        console.log('No visible images to position the plus icon against.');
        return {
            right: 10, // Default right position if no images are visible
            bottom: 10 // Default bottom position if no images are visible
        };
    }
}


// Display a certain number of images depending on viewport
function getMaxImages() {
    if (window.innerWidth >= 800) {
        return 3;
    } else if (window.innerWidth >= 600) {
        return 2;
    } else {
        return 1;
    }
}

// Format multiple candidate names as a string
function formatCandidateNames(candidateNames) {
    return candidateNames.length > 1
        ? candidateNames.slice(0, -1).join(', ') + ', and ' + candidateNames.slice(-1)
        : candidateNames[0];
}

// Debounce function to limit the rate at which a function can fire
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
}
