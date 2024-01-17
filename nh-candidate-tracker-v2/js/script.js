// Declare global variable(s)
var allData;

// Define function to initialize the process
function init() {
    loadData();
}

// Define function to fetch and load data using Papa.parse
function loadData() {
    Papa.parse(
        'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778',
        {
            download: true,
            header: true,
            complete: function (results) {
                allData = results.data;
                parseData();
            },
        }
    );
}

// Function to organize and format data
function parseData() {
    allData.sort((a, b) => new Date(a.date) - new Date(b.date));

    var currentDate = new Date();

    function groupBy(arr, key) {
        return arr.reduce((acc, obj) => {
            var groupKey = obj[key];
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(obj);
            return acc;
        }, {});
    }

    var groupedData = groupBy(allData, 'event_id');

    function formatCandidateNames(candidateNames) {
        return candidateNames.length > 1
            ? candidateNames.slice(0, -1).join(', ') + ', and ' + candidateNames.slice(-1)
            : candidateNames[0];
    }

    // Define function to update UI
    function updateImages() {
        $("#content").empty();
    
        for (var eventId in groupedData) {
            if (groupedData.hasOwnProperty(eventId)) {
                var eventGroup = groupedData[eventId];
                var combinedCard = $("<div class='event-card'></div>");
                var candidateNames = [];
                var candidateImages = [];
    
                var eventDate, time, info; // Declare the 'info' variable here

                // Declare imageContainer outside the loop
                var imageContainer = $("<div class='image-container'></div>");
    
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
                        '<p class="address">' +
                        eventData.address_line_1 + "<br>" +
                        eventData.address_line_2 + "<br>" +
                        eventData.city + ", " +
                        eventData.state + " " +
                        eventData.zip + "</p>" +
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
                    combinedCard.addClass('past-event');
                }
    
                var candidateNameText = formatCandidateNames(candidateNames);
    
                // Add images to container
                for (var i = 0; i < Math.min(candidateImages.length, getMaxImages()); i++) {
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

                // Calculate remaining candidates beyond max (determined by viewport)
                var remainingCandidates = Math.max(candidateImages.length - getMaxImages(), 0);

                // If remaining candidates are greater than zero, display plus icon
                if (remainingCandidates > 0) {
                    var plusIcon = $("<div class='plus-icon'>" + "+" + remainingCandidates + "</div>");
                    imageContainer.append(plusIcon);

                    // Position plus icon based on the last image's position
                    var lastImage = imageContainer.find('img:last');

                    if (lastImage.length > 0) {
                        var lastImagePosition = lastImage.position();
                        var iconPosition = calculateIconPosition();

                        plusIcon.css({
                            position: 'absolute',
                            bottom: iconPosition.bottom,
                            right: iconPosition.right,
                        });
                    }
                }
    
                // Append elements to the DOM
                subCard.append(
                    time,
                    info,
                    $("<div class='image-container'></div>").append(imageContainer)
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

    // Define function to pull a certain number of images depending on viewport
    function getMaxImages() {
        if (window.innerWidth >= 800) {
            return 3;
        } else if (window.innerWidth >= 600) {
            return 2;
        } else {
            return 1;
        }
    }
    
    // Define function to calculate where plus icon will sit
    function calculateIconPosition() {
        var iconPosition = { bottom: 200, right: 95 };
        if (window.innerWidth < 501) {
            var eventCard = subCard.closest('.event-card');
            if (eventCard.length > 0) {
                var eventCardPosition = eventCard.position();
                iconPosition.bottom = eventCardPosition.bottom;
                iconPosition.right = eventCardPosition.right;
            }
        }
        return iconPosition;
    }

    $(document).ready(updateImages);
    window.addEventListener('resize', updateImages);
}

$(document).ready(init);
