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

function parseData() {
    // Sort the data by event date in ascending order
    allData.sort(function (a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    var $len = allData.length;
    totalEntries = $len;

    // Create a variable to track the current day and week
    var currentDay;
    var currentWeek;

    // Get the current date
    var currentDate = new Date();

    // Calculate the end of the current week (Sunday)
    var endOfWeek = new Date(currentDate);
    endOfWeek.setDate(currentDate.getDate() + (7 - currentDate.getDay())); // Set to the end of the current week


    // Create a loop to go through each event in 'allData'
    for (var i = 0; i < totalEntries; i++) {
        // Parse the event date using the MM/DD/YYYY format
        var dateParts = allData[i].date.split('/');
        var eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

        // Make the cards //
        // Create a card div for each event using jQuery, give each card class 'event-card'
        var card = $("<div class='event-card'></div>");

        // Check if the event date is in the past and apply the 'past-event' class
        if (eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
            card.addClass('past-event');
			}

        // Fix of past-event error
        if (eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {}

        // Check if the event date is in a new week
        if (eventDate > endOfWeek) {
            // Create a new week heading
            currentWeek = $('<div class="week-container"></div>');
            currentWeek.append('<h1 id="thisWeekHeader" class="custom-header">' + formatDate(eventDate) + '</h1>');

            // Append the 'currentWeek' container to the main 'content' container
            $("#content").append(currentWeek);
        }

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

        // Append time, info, and imageContainer to the card element
        card.append(time, info, imageContainer);

        // Append the image to the image container
        imageContainer.append(image);

        // Append the card to the current day container, grouping all events by day
        currentDay.append(card);
    }

    xtalk.signalIframe();
}

// Update the 'This Week' header in AP style
function updateThisWeekHeader() {
    const thisWeekHeader = document.getElementById('thisWeekHeader');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()); // Start of the current week
    const lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6); // End of the current week
    const startDateString = formatDate(firstDay);
    const endDateString = formatDate(lastDay);
    thisWeekHeader.textContent = startDateString + ' - ' + endDateString;
}

// Format date in AP style
function formatDate(date) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return dayNames[date.getDay()] + ', ' + monthNames[date.getMonth()] + ' ' + date.getDate();
}

// Call the function to update the header when the page loads
updateThisWeekHeader();

$(document).ready(function(){
	init();
});
