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

// Function to fetch data using Papa.parse
function loadData() {
    Papa.parse(
        'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778', {
            download: true,
            header: true,
            config,
            complete: function (results) {
                //console.log("Finished:", results.data);
                allData = results.data;
                parseData();
            },
        }
    );
}

// Format date in AP style
function formatDate(eventDate) {
    // Logic for formatting the date
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

// Function to create cards from parsed data
function parseData() {
    // Sorting the data by date
    allData.sort(function (a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    var currentDate = new Date();
    var eventDate; // Declare eventDate outside the loop
    var time; // Declare time outside the loop
    var info; // Declare info outside the loop

    // Helper function to group array of objects by a specified key
    function groupBy(arr, key) {
        return arr.reduce(function (acc, obj) {
            var groupKey = obj[key];
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(obj);
            return acc;
        }, {});
    }

    // Create a new variable groupedData with events grouped by id
    var groupedData = groupBy(allData, 'event_id');

    // Loop through each grouped event
    for (var eventId in groupedData) {
        if (groupedData.hasOwnProperty(eventId)) {
            var eventGroup = groupedData[eventId];

            // Creating a single card for the entire event group
            var combinedCard = $("<div class='event-card'></div>");

            // Collecting names and images for all candidates in the event group
            var candidateNames = [];
            var candidateImages = [];

            // Loop through each candidate in the event group
            eventGroup.forEach(function (eventData) {
                var dateParts = eventData.date.split('/');
                eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

                // Check if eventDate is a valid date
                if (isNaN(eventDate.getTime())) {
                    console.error("Invalid date for entry with event_id " + eventId + ": " + eventData.date);
                    return; // Log a warning and move to the next entry
                }

                var timeData = eventData.time.split(' ');
                time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");

                info = $("<div class='info'></div>");
                info.append(
                    // Type of event
                    "<p class='type'>" + eventData.event_type + "</p>",
                    // Address container
                    '<div class="address-container">' +
                        // Icon
                        '<div class="left-content">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#939393" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' +
                        '</div>' +
                        // Address
                        '<div class="right-content">' +
                            '<p class="address">' +
                                eventData.address_line_1 + "<br>" +
                                eventData.address_line_2 + "<br>" +
                                eventData.city + ", " +
                                eventData.state + " " +
                                eventData.zip + "</p>" +
                        '</div>' +
                    '</div>',
                    // Description
                    "<p class='description'>" + eventData.description + "</p>"
                );

                // Collect candidate names and images
                candidateNames.push(eventData.candidate + " (" + eventData.party[0] + ")");
                candidateImages.push({
                    img: eventData.img,
                    party: eventData.party[0]
                });
            });

            // Creating a sub-card for each candidate
            var subCard = $("<div class='sub-card'></div>");

            // Customizing the sub-card content based on eventData
            if (eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
                subCard.addClass('past-event');
            }

            // Only take up to 3 candidates
            var uniqueCandidateNames = Array.from(new Set(candidateNames)).slice(0, 3).join(', ');
            var remainingCandidates = candidateNames.length - 3;

            // Create a container for candidate images
            var imageContainer = $("<div class='image-container'></div>");

            // Loop through each candidate and create image elements
            for (var i = 0; i < Math.min(candidateImages.length, 3); i++) {
                var imgData = candidateImages[i];
                var imgElement = $("<img src='" + imgData.img + "' class='img-fluid' party='" + imgData.party + "' />");
                imageContainer.append(imgElement);
            }

            // Add a small circle icon showing +(number of additional candidates)
            if (remainingCandidates > 0) {
                var plusIcon = $("<div class='plus-icon'>" + "+" + remainingCandidates + "</div>");

                // Attach a click event to toggle visibility
                plusIcon.click(function () {
                    // Toggle visibility of additional candidates
                    $(this).siblings('.img-fluid:hidden').toggle();
                });

                imageContainer.append(plusIcon);
            }

            subCard.append(
                time,
                info,
                $("<div class='image-container-wrapper'></div>").append(imageContainer)
                );

            combinedCard.append(
                "<p class='name'>" + uniqueCandidateNames + "</p>",
                subCard
                );

            // Append the combined card to the content area
            $("#content").append(combinedCard);
        }
    }
}

// Document ready function to initiate the process when the DOM is ready
$(document).ready(function () {
    init();
});