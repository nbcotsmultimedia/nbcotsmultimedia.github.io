var ds;
var totalEntries;
var allData;
var config;

// Function to initialize the process
function init() {
    // Build configuration settings
    config = buildConfig();
    // Load data using Papa.parse
    loadData();
}

// Function to set up configuration for Papa.parse
function buildConfig() {
    return {
        delimiter: "", // auto-detect
        newline: "", // auto-detect
        quoteChar: '"',
        escapeChar: '"',
        header: false,
        transformHeader: undefined,
        dynamicTyping: false,
        preview: 0,
        encoding: "",
        worker: false,
        comments: false,
        step: undefined,
        complete: undefined,
        error: undefined,
        download: false,
        downloadRequestHeaders: undefined,
        downloadRequestBody: undefined,
        skipEmptyLines: false,
        chunk: undefined,
        chunkSize: undefined,
        fastMode: undefined,
        beforeFirstChunk: undefined,
        withCredentials: undefined,
        transform: undefined,
        delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
    };
}

// Function to format dates in AP style
function formatDate(eventDate) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    return dayNames[eventDate.getDay()] + ', ' + monthNames[eventDate.getMonth()] + ' ' + eventDate.getDate();
}

// Function to fetch data using Papa.parse library
function loadData() {
    Papa.parse(
        // First parameter is the CSV file's URL
        'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778',
        
        // Second parameter is an options object with settings for parsing
        {
            download: true,
            header: true,
            config,
            complete: function (results) {
                allData = results.data; // asign results to global variable allData
                parseData();
            },
        }
    );
}

// Function to create cards from parsed data
function parseData() {

    // Sort allData by date
    allData.sort(function(a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    // Initialize variables to be used later
    var currentDate = new Date();
    var eventDate;
    var time;
    var info;

    // Define a function to group data by a specified key
    function groupBy(arr, key) {
        return arr.reduce(function(acc, obj) {
            var groupKey = obj[key];
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(obj);
            return acc;
        }, {});
    }

    // Group data using 'event_id'
    var groupedData = groupBy(allData, 'event_id');

    // Define a function to format candidate names
    function formatCandidateNames(candidateNames) {
        if (candidateNames.length > 1) {
            // If there are multiple candidates, add "and" before the last name
            var lastCandidate = candidateNames.pop(); // Remove the last element
            return candidateNames.join(', ') + ', and ' + lastCandidate;
        } else {
            // If there's only one candidate, return it as is
            return candidateNames[0];
        }
    }

    // Define the updateImages function
    function updateImages() {

        // Clear existing content before adding new content
        $("#content").empty();

        // Iterate through groupedData
        for (var eventId in groupedData) {
            if (groupedData.hasOwnProperty(eventId)) {
                // Get the array of events associated with the current eventId
                var eventGroup = groupedData[eventId];

                // Create a container for the combined card
                var combinedCard = $("<div class='event-card'></div>");

                // Initialize arrays to store candidate names and images
                var candidateNames = [];
                var candidateImages = [];

                // Iterate through eventGroup
                eventGroup.forEach(function (eventData) {
                    var dateParts = eventData.date.split('/');
                    eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

                    // Check for valid date
                    if (isNaN(eventDate.getTime())) {
                        console.error("Invalid date for entry with event_id " + eventId + ": " + eventData.date);
                        return;
                    }

                    // Extract time information from data
                    var timeData = eventData.time.split(' ');
                    time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");

                    // Create info element
                    info = $("<div class='info'></div>");

                    // Append information to info element
                    info.append(
                        // Event type
                        "<p class='type'>" + eventData.event_type + "</p>",
                        '<div class="right-content">' +
                            // Address
                            '<p class="address">' +
                            eventData.address_line_1 + "<br>" +
                            eventData.address_line_2 + "<br>" +
                            eventData.city + ", " +
                            eventData.state + " " +
                            eventData.zip + "</p>" +
                        '</div>' +
                        // Description
                        "<p class='description'>" + eventData.description + "</p>"
                    );

                    // Push candidate names to arrays
                    candidateNames.push(eventData.candidate + " (" + eventData.party[0] + ")");
                    candidateImages.push({
                        img: eventData.img,
                        party: eventData.party[0]
                    });

                });

                // Create subCard element
                var subCard = $("<div class='sub-card'></div>");

                // Check if the event is in the past, if so add class past-event
                if (eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
                    subCard.addClass('past-event');
                }

                // Get formatted candidate names
                var candidateNameText = formatCandidateNames(candidateNames);

                // Create image container
                var imageContainer = $("<div class='image-container'></div>");

                // Iterate through candidateImages
                for (var i = 0; i < Math.min(candidateImages.length, getMaxImages()); i++) {
                    // Get data for the current candidate's image
                    var imgData = candidateImages[i];
                    // Create an img HTML element with the candidate's image src + add border
                    var imgElement = $(
                        "<img src='" +
                        imgData.img +
                        "' class='img-fluid visible' party='" +
                        imgData.party +
                        "' />"
                    );

                    // Append the created img element to the imageContainer
                    imageContainer.append(imgElement);
                }

                // Define function to calculate the maximum number of images based on viewport width
                function getMaxImages() {
                    if (window.innerWidth >= 501) {
                        return 3;
                    } else {
                        return 1;
                    }
                }

                // Calculate remaining candidates
                var remainingCandidates = Math.max(candidateImages.length - (window.innerWidth >= 501 ? 3 : 1), 0);

                // Check for remaining candidates
                if (remainingCandidates > 0) {

                    // Dynamically adjust the position of the plus-icon
                    var plusIcon = $("<div class='plus-icon'>" + "+" + remainingCandidates + "</div>");
                    imageContainer.append(plusIcon);

                    var lastImage = imageContainer.find('img:last');

                    // Calculate icon position
                    if (lastImage.length > 0) {
                        var iconPosition = calculateIconPosition();
                        
                        plusIcon.css({
                            position: 'absolute',
                            bottom: iconPosition.bottom,
                            right: iconPosition.right,
                        });
                    }
                }

                // Append time div, info div, and image container subCard
                subCard.append(
                    time,
                    info,
                    $("<div class='image-container-wrapper'></div>").append(imageContainer)
                );

                // Append candidate names and subCard to combinedCard
                combinedCard.append(
                    "<p class='name'>" +
                    candidateNameText +
                    "</p>",
                    subCard
                );

                // Append combinedCard to HTML content
                $("#content").append(combinedCard);
            }
        }
    }

    // Define function to calculate icon position based on viewport width
    function calculateIconPosition() {
        var iconPosition = {
            bottom: 25,
            right: 25
        };

        // Adjust bottom and right positions of icon for mobile view
        if (window.innerWidth < 501) {
            iconPosition.bottom = 412;
            iconPosition.right = 10;
        }

        // Return icon position
        return iconPosition;
    }

    // Call the updateImages function when the DOM is ready
    $(document).ready(updateImages);

    // Call the updateImages function when resizing
    window.addEventListener('resize', updateImages);
}

// Document ready function to initiate the process when the DOM is ready
$(document).ready(function () {
    init();
});