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
                allData = results.data;
                parseData();
            },
        }
    );
}

// Format date in AP style
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

// Function to create cards from parsed data
function parseData() {
    allData.sort(function(a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    var currentDate = new Date();
    var eventDate;
    var time;
    var info;

    function groupBy(arr, key) {
        return arr.reduce(function(acc, obj) {
            var groupKey = obj[key];
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(obj);
            return acc;
        }, {});
    }

    var groupedData = groupBy(allData, 'event_id');

    // Format candidate names for top of card
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

    // Call the updateImages function when resizing
    function updateImages() {
        // Clear existing content before adding new content
        $("#content").empty();

        for (var eventId in groupedData) {
            if (groupedData.hasOwnProperty(eventId)) {
                var eventGroup = groupedData[eventId];
                var combinedCard = $("<div class='event-card'></div>");
                var candidateNames = [];
                var candidateImages = [];

                eventGroup.forEach(function (eventData) {
                    var dateParts = eventData.date.split('/');
                    eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

                    if (isNaN(eventDate.getTime())) {
                        console.error("Invalid date for entry with event_id " + eventId + ": " + eventData.date);
                        return;
                    }

                    var timeData = eventData.time.split(' ');
                    time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");

                    info = $("<div class='info'></div>");
                    info.append(
                        "<p class='type'>" + eventData.event_type + "</p>",
                        '<div class="address-container">' +
                        '<div class="left-content">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#939393" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' +
                        '</div>' +
                        '<div class="right-content">' +
                        '<p class="address">' +
                        eventData.address_line_1 + "<br>" +
                        eventData.address_line_2 + "<br>" +
                        eventData.city + ", " +
                        eventData.state + " " +
                        eventData.zip + "</p>" +
                        '</div>' +
                        '</div>',
                        "<p class='description'>" + eventData.description + "</p>"
                    );

                    candidateNames.push(eventData.candidate + " (" + eventData.party[0] + ")");
                    candidateImages.push({
                        img: eventData.img,
                        party: eventData.party[0]
                    });

                });

                var subCard = $("<div class='sub-card'></div>");

                if (eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
                    subCard.addClass('past-event');
                }

                // Candidate name list
                var candidateNameText = formatCandidateNames(candidateNames);

                var imageContainer = $("<div class='image-container'></div>");

                for (var i = 0; i < Math.min(candidateImages.length, (window.innerWidth >= 501) ? 3 : 1); i++) {
                    var imgData = candidateImages[i];
                    var imgElement = $(
                        "<img src='" +
                        imgData.img +
                        "' class='img-fluid visible' party='" +
                        imgData.party +
                        "' />"
                    );
                    imageContainer.append(imgElement);
                }

                var remainingCandidates = Math.max(candidateImages.length - (window.innerWidth >= 501 ? 3 : 1), 0);

                if (remainingCandidates > 0) {
                    // Dynamically adjust the position of the plus-icon
                    var plusIcon = $("<div class='plus-icon'>" + "+" + remainingCandidates + "</div>");
                    imageContainer.append(plusIcon);

                    var lastImage = imageContainer.find('img:last');

                    if (lastImage.length > 0) {
                        var iconPosition = calculateIconPosition();
                        
                        plusIcon.css({
                            position: 'absolute',
                            bottom: iconPosition.bottom,
                            right: iconPosition.right,
                        });
                    }
                }

                subCard.append(
                    time,
                    info,
                    $("<div class='image-container-wrapper'></div>").append(imageContainer)
                );

                combinedCard.append(
                    "<p class='name'>" +
                    candidateNameText +
                    "</p>",
                    subCard
                );

                $("#content").append(combinedCard);
            }
        }
    }

    // Function to calculate icon position based on viewport width
    function calculateIconPosition() {
        var iconPosition = {
            bottom: 25,
            right: 25
        };

        if (window.innerWidth < 501) {
            // Adjust bottom and right values for mobile view
            iconPosition.bottom = 412;
            iconPosition.right = 10;
        }

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