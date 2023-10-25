var ds;
var totalEntries;
var allData;
var config;

function init() {
	//console.log("ready");

	config = buildConfig();
	loadData();

}

function buildConfig() {
	return {
		delimiter: "",	// auto-detect
		newline: "",	// auto-detect
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
		delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]
	};
}

function loadData() {

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vTLf6vvDf-XgnXtguWKz4ayW5P5BCyihNjNpO_axRNLHvaJJUnWS3_TQ0GKcTDBAPPhB0yufGWLX5WE/pub?gid=0&single=true&output=csv', {
		download: true,
    	header: true,
		config,
		complete: function(results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			parseData();

		}
	});

}

// A List of this Week's Events //

function parseData() {
    // Sort the data by event date in ascending order
    allData.sort(function (a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    var $len = allData.length;
    totalEntries = $len;

    // Create a variable to track the current day
    var currentDay;

    // Get the current date
    var currentDate = new Date();

    // Calculate the start and end dates of the current week
    var currentWeekStartDate = new Date(currentDate);
    currentWeekStartDate.setHours(0, 0, 0, 0);
    currentWeekStartDate.setDate(currentDate.getDate() - currentDate.getDay());
    var currentWeekEndDate = new Date(currentWeekStartDate);
    currentWeekEndDate.setDate(currentWeekStartDate.getDate() + 6);

    // Create a loop to go through each event in 'allData'
    for (var i = 0; i < totalEntries; i++) {
        // Parse the event date using the JS 'Date' object to check for a new day
        var eventDate = new Date(allData[i].date);

        // Check if the event date is within the current week
        if (eventDate >= currentWeekStartDate && eventDate <= currentWeekEndDate) {
            // Extract the day of the week from 'eventDate' using 'toLocaleString'
            var dayOfWeek = eventDate.toLocaleString('en-us', { weekday: 'long' });

            // Check if the current day is a new day. When a new day is encountered...
            if (!currentDay || dayOfWeek !== currentDay.data('day')) {
                // Create a new div in the HTML called 'day-container'
                currentDay = $('<div class="day-container"></div>');

                // Store the current day ('dayOfWeek') as an attribute named 'day' in 'currentDay'
                currentDay.data('day', dayOfWeek);

                // Generate a heading for the day by combining 'dayOfWeek' and day of the month from 'eventDate'
                // Append it to the 'currentDay' container
                currentDay.append("<h2>" + dayOfWeek + " " + eventDate.getDate() + "</h2>");

                // Append the 'currentDay' container to the main 'content' container
                $("#content").append(currentDay);
            }

            // Make the cards //

            // Create a card div for each event using jQuery, give each card class 'event-card'
            var card = $("<div class='event-card'></div>");

            // Within the card, create sections

            // Create time section
            var timeData = allData[i].time.split(' ');
            var time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");

            // Create info section (Candidate name, event type, and address)
            var info = $("<div class='info'></div>");
            info.append(
                "<p class='name'>" + allData[i].candidate + " (" + allData[i].party[0] + ")" + "</p>",
                "<p class='type'>" + allData[i].event_type + "</p>",
                // Create and append a new div for the map-pin icon and address block
                '<div class="address-container">' +
                    '<div class="left-content">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#939393" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' +
                    '</div>' +
                    '<div class="right-content">' +
                        '<p class="address">' +
                            allData[i].address_line_1 + "<br>" +
                            allData[i].address_line_2 + "<br>" +
                            allData[i].city + ", " +
                            allData[i].state + " " +
                            allData[i].zip + "</p>" +
                    '</div>' +
                '</div>',
                "<p class='description'>" + allData[i].description + "</p>"
            );

            // Create image section (Candidate portrait)
            var imageContainer = $("<div class='image-container'></div");
            var image = $("<img src='" + allData[i].img + "' class='img-fluid' party='" + allData[i].party + "' />");

            var currentTime = new Date(); // Create a Date object for the current time

            // Check if the event's date is in the past (before the current date) or if it's today and the event time is in the past
            if (eventDate < currentDate || (eventDate.toDateString() === currentDate.toDateString() && eventDate.getTime() < currentTime.getTime())) {
                // If the event is in the past:
                // Reduce the opacity of the card
                card.addClass('past-event');
            }

            // Append time, info, and imageContainer to the card element
            card.append(time, info, imageContainer);

            // Append the image to the image container
            imageContainer.append(image);

            // Append the card to the current day container, grouping all events in by day
            currentDay.append(card);
        }
    }
}

// Update the 'This Week' header
function updateThisWeekHeader() {
    const thisWeekHeader = document.getElementById('thisWeekHeader');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); // Start of the current week
    const lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6); // End of the current week
    const startDateString = (firstDay.getMonth() + 1) + '/' + firstDay.getDate();
    const endDateString = (lastDay.getMonth() + 1) + '/' + lastDay.getDate();
    thisWeekHeader.textContent = 'This Week: ' + startDateString + ' - ' + endDateString;
}

// Call the function to update the header when the page loads
updateThisWeekHeader();

$(document).ready(function(){
	init();
});