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
    $(window).on('resize', debounce(function() {
        updateImages(groupedData); // Make sure to pass groupedData
    }, 250));
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
    updateImages(groupedData); // Call updateImages to handle the initial display and positioning
}

// Update images based on grouped data
function updateImages(gData) {
    $("#content").empty(); // Empty the content
    const maxImages = getMaxImages(); // Get the max number of images for the current viewport

    for (const eventId in gData) {
        if (gData.hasOwnProperty(eventId)) {
            const eventGroup = gData[eventId];
            const combinedCard = $("<div class='event-card'></div>");
            const candidateNames = eventGroup.map(eventData => eventData.candidate + " (" + eventData.party[0] + ")");
            const candidateImages = eventGroup.map(eventData => ({ img: eventData.img, party: eventData.party[0] }));
            const imageContainer = $("<div class='image-container'></div>");
            let time, info;

            eventGroup.forEach(function (eventData) {
                const dateParts = eventData.date.split('/');
                const eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
                if (isNaN(eventDate.getTime())) {
                    console.error("Invalid date for entry with event_id " + eventId + ": " + eventData.date);
                    return;
                }
                const isPastEvent = eventDate.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
                const timeData = eventData.time.split(' ');
                time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");
                info = $("<div class='info'></div>").append(
                    "<p class='type'>" + eventData.event_type + "</p>",
                    '<p class="address">' + eventData.address_line_1 + "<br>" + eventData.address_line_2 + "<br>" + eventData.city + ", " + eventData.state + " " + eventData.zip + "</p>",
                    "<p class='description'>" + eventData.description + "</p>"
                );

                if (isPastEvent) {
                    combinedCard.addClass('past-event');
                }
            });

            const subCard = $("<div class='sub-card'></div>");
            const candidateNameText = formatCandidateNames(candidateNames);

            candidateImages.forEach((imgData, index) => {
                const imgElement = $("<img>", {
                    src: imgData.img,
                    class: 'img-fluid' + (index < maxImages ? ' visible' : ''),
                    'party': imgData.party
                });
                imageContainer.append(imgElement);
            });

            const remainingCandidates = candidateImages.length - maxImages;
            if (remainingCandidates > 0) {
                const plusIcon = $("<div class='plus-icon'>+" + remainingCandidates + "</div>");
                imageContainer.append(plusIcon);
            }

            subCard.append(time, info, imageContainer);
            combinedCard.append($("<p>", { class: 'name', text: candidateNameText }), subCard);
            $("#content").append(combinedCard);
        }
    }
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

// Display a certain number of images depending on viewport
function getMaxImages() {
    if (window.innerWidth >= 800) {
        return 3; // For wide screens, show up to 3 images
    } else if (window.innerWidth >= 600) {
        return 2; // For medium screens, show up to 2 images
    } else {
        return 1; // For small screens, show only 1 image
    }
}

// Debounce function to limit the rate at which a function can fire.
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

// Group data by a specified key
function groupBy(arr, key) {
    return arr.reduce((acc, obj) => {
        const groupKey = obj[key];
        acc[groupKey] = acc[groupKey] || [];
        acc[groupKey].push(obj);
        return acc;
    }, {});
}

// Calculate where plus icon will sit
function calculateIconPosition(imageContainer) {
    const lastVisibleImage = imageContainer.find('img.visible:last');
    if (lastVisibleImage.length > 0) {
        const plusIcon = imageContainer.find('.plus-icon');
        const iconWidth = plusIcon.outerWidth();
        const iconHeight = plusIcon.outerHeight();
        const imagePosition = lastVisibleImage.position();
        const rightAdjustment = 20; // You can adjust this value
        const rightPosition = imagePosition.left + lastVisibleImage.outerWidth(false) - iconWidth + rightAdjustment;
        const bottomAdjustment = 30; // You can adjust this value
        const bottomPosition = imagePosition.top + lastVisibleImage.outerHeight(false) - iconHeight + bottomAdjustment;
        return { bottom: bottomPosition, right: rightPosition };
    } else {
        console.log('Using default position');
        return { bottom: 0, right: 0 };
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
    // Your logic to format candidate names
}
