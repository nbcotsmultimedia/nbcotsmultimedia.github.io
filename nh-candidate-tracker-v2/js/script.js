// Constant
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778';

// Global variable
let allData;

// When doc is ready, run loadData function
function init() {
    loadData();
}

// Fetch and load data, then run parseData function
function loadData() {
    Papa.parse(
        SPREADSHEET_URL,
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

// Organize and format data
function parseData() {
    
    // Sort allData by date
    allData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const currentDate = new Date();

    // Group data by a specified key
    function groupBy(arr, key) {
        return arr.reduce((acc, obj) => {
            const groupKey = obj[key];
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(obj);
            return acc;
        }, {});
    }

    // Create variable groupedData that groups allData by event_id
    const groupedData = groupBy(allData, 'event_id');

    // Format multiple candidate names as a string
    function formatCandidateNames(candidateNames) {
        return candidateNames.length > 1
            ? candidateNames.slice(0, -1).join(', ') + ', and ' + candidateNames.slice(-1)
            : candidateNames[0];
    }

    // Update images based on grouped data
    function updateImages() {

        // Empty content in the #content element
        $("#content").empty();

        // Iterate through each event in the groupedData object
        for (const eventId in groupedData) {
            if (groupedData.hasOwnProperty(eventId)) {

                // Retrieve the event group associated with the current eventId
                const eventGroup = groupedData[eventId];
                // Declare combinedCard variable to contain various elements in the group
                const combinedCard = $("<div class='event-card'></div>");
                // Initialize empty arrays to store candidate information
                const candidateNames = [];
                const candidateImages = [];
                // Declare imageContainer variable to contain images
                const imageContainer = $("<div class='image-container'></div>");
                // Declare the 'time' and 'info' variables
                let time, info;

                // Process each event in the group
                eventGroup.forEach(function (eventData) {

                    // Declare dateParts variable to extract date into
                    const dateParts = eventData.date.split('/');
                    const eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

                    if (isNaN(eventDate.getTime())) {
                        console.error("Invalid date for entry with event_id " + eventId + ": " + eventData.date);
                        return;
                    }

                    // Declare isPastEvent if the current event is in the past
                    const isPastEvent = eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0);

                    // Declare timeData
                    const timeData = eventData.time.split(' ');
                    time = $(
                        "<div class='time'><p class='time-text'>" +
                        timeData[0] +
                        "</p><p class='am-pm'>" +
                        timeData[1] +
                        "</p></div>"
                        );

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

                    // If event is in the past, add class past-event (reduce opacity)
                    if (isPastEvent) {
                        combinedCard.addClass('past-event');
                    }

                    candidateNames.push(eventData.candidate + " (" + eventData.party[0] + ")");
                    candidateImages.push({
                        img: eventData.img,
                        party: eventData.party[0]
                    });
                });

                // Create subCard element to contain time, info, and imageContainer
                const subCard = $("<div class='sub-card'></div>");

                // Create candidateNameText to contain formatted candidate names
                const candidateNameText = formatCandidateNames(candidateNames);

                // Iterate through candidate images and add them to container
                for (let i = 0; i < Math.min(candidateImages.length, getMaxImages()); i++) {
                    const imgData = candidateImages[i];
                    const imgElement = $(
                        "<img src='" +
                        imgData.img +
                        "' class='img-fluid visible' party='" + // Add party border
                        imgData.party +
                        "' />"
                    );
                    imageContainer.append(imgElement);
                }

                // Calculate remaining candidates beyond max (determined by viewport)
                const remainingCandidates = Math.max(candidateImages.length - getMaxImages(), 0);

                // If remaining candidates are greater than zero, display plus icon
                if (remainingCandidates > 0) {
                    const plusIcon = $(
                        "<div class='plus-icon'>" +
                        "+" +
                        remainingCandidates +
                        "</div>"
                        );
                    imageContainer.append(plusIcon);

                    // Retrieve the last visible image
                    const lastImage = imageContainer.find('img:last');

                    if (lastImage.length > 0) {
                        // Calculate the position for the plus icon
                        const iconPosition = calculateIconPosition(imageContainer, subCard);
                        // Set CSS properties for the plus icon to position it absolutely
                        plusIcon.css({
                            position: 'absolute',
                            bottom: iconPosition.bottom,
                            right: iconPosition.right,
                        });
                    }
                }

                // Appendtime, info, and imageContainer to the subCard
                subCard.append(
                    time,
                    info,
                    imageContainer
                );

                // Append candidate name string and subCard to the combinedCard
                combinedCard.append(
                    "<p class='name'>" +
                    candidateNameText +
                    "</p>",
                    subCard
                );

                // Append the combinedCard to the DOM
                $("#content").append(combinedCard);
            }
        }
    }

    // Calculate where plus icon will sit
    function calculateIconPosition(imageContainer, subCard) {

        // Initialize the iconPosition object with initial position
        const iconPosition = { bottom: 205, right: 0 };

        // Get the last image element in imageContainer
        const lastImage = imageContainer.find('img:last');

        // If at least one last image exists, execute the block
        if (lastImage.length > 0) {

            // Get the position of the subCard element (top and left relative to parent)
            const eventCardPosition = subCard.position();

            // Calculate the number of currently visible images
            const numVisibleImages = imageContainer.find('img:visible').length;
            
            // Set the horizontal position of icon
            iconPosition.right =
                eventCardPosition.left + 75 // add 75px
                + subCard.width();

            // If there is more than one visible image
            if (numVisibleImages > 1) {
                // Adjust the right property of iconPosition by subtracting 30 for each additional visible image beyond the first one
                iconPosition.right -= 30 * (numVisibleImages - 1);
            }
        }

        // Return the calculated iconPosition object
        return iconPosition;
    }

    // When the document is fully loaded and ready, call updateImages
    $(document).ready(updateImages);

    // Whenever the user resizes the window, call updateImages
    window.addEventListener('resize', updateImages);

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

}

// Event listener
$(document).ready(init);