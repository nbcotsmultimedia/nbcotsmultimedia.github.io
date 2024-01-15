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

	Papa.parse(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTLf6vvDf-XgnXtguWKz4ayW5P5BCyihNjNpO_axRNLHvaJJUnWS3_TQ0GKcTDBAPPhB0yufGWLX5WE/pub?gid=1672632778&single=true&output=csv', {
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

// Format date in AP style
function formatDate(eventDate) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return dayNames[eventDate.getDay()] + ', ' + monthNames[eventDate.getMonth()] + ' ' + eventDate.getDate();
}
// Create cards
function parseData() {
    allData.sort(function (a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    var $len = allData.length;
    totalEntries = $len;

    var currentDay;
    var currentWeek = null;
    var weekStartDate = null;
    var weekEndDate = null;
    var currentWeekHeader;

    var currentDate = new Date();

    for (var i = 0; i < totalEntries; i++) {
        var dateParts = allData[i].date.split('/');
        var eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

        // Check if eventDate is a valid date
        if (isNaN(eventDate.getTime())) {
            console.error("Invalid date for entry at index " + i + ": " + allData[i].date);
            continue;  // Skip invalid date and move to the next entry
        }

        // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
        var dayOfWeek = eventDate.getDay();

        if (!currentWeek || !weekStartDate || !weekEndDate || eventDate > weekEndDate) {
            if (currentWeek) {
                if (currentWeekHeader) {
                    $("#content").append(currentWeekHeader);
                }
                $("#content").append(currentWeek);
            }

            weekStartDate = new Date(eventDate);
            weekStartDate.setDate(eventDate.getDate() - eventDate.getDay());

            weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekStartDate.getDate() + 6);

            currentWeekHeader = $('<h1 class="custom-header">' + formatDate(weekStartDate) + ' - ' + formatDate(weekEndDate) + '</h1>');
            currentWeek = $('<div class="week-container"></div>');
        }

        if (!currentDay || dayOfWeek !== currentDay.data('day')) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            currentDay = $('<div class="day-container"></div');
            currentDay.data('day', dayOfWeek);
            currentDay.append("<h2>" + dayNames[dayOfWeek] + " " + eventDate.getDate() + "</h2");
            currentWeek.append(currentDay);
        }

        var card = $("<div class='event-card'></div");

        if (eventDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
            card.addClass('past-event');
        }

        var timeData = allData[i].time.split(' ');
        var time = $("<div class='time'><p class='time-text'>" + timeData[0] + "</p><p class='am-pm'>" + timeData[1] + "</p></div>");

        var info = $("<div class='info'></div>");
        info.append(
            "<p class='name'>" + allData[i].candidate + " (" + allData[i].party[0] + ")" + "</p>",
            "<p class='type'>" + allData[i].event_type + "</p>",
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

        var imageContainer = $("<div class='image-container'></div>");
        var image = $("<img src='" + allData[i].img + "' class='img-fluid' party='" + allData[i].party + "' />");

        card.append(time, info, imageContainer);
        imageContainer.append(image);
        currentDay.append(card);
    }

    if (currentWeek) {
        if (currentWeekHeader) {
            $("#content").append(currentWeekHeader);
        }
        $("#content").append(currentWeek);
    }

    xtalk.signalIframe();
}

$(document).ready(function(){
	init();
});
