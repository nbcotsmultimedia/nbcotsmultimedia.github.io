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
        'https://docs.google.com/spreadsheets/d/1TtoR-QwRWs7avrZqvAmIfx7BL-cXisMndbR5lgbLGO8/export?format=csv&gid=1672632778', {
          download: true,
          header: true,
          config,
          complete: function (results) {
            allData = results.data;
            parseData();
          }
        }
      );      

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

    // Helper function to group array of objects by a specified key
    function groupBy(arr, key) {
        return arr.reduce(function (acc, obj) {
            var groupKey = obj[key];
            acc[groupKey] = acc[groupKey] || [];
            acc[groupKey].push(obj);
            return acc;
        }, {});
    }

    var groupedData = groupBy(allData, 'event_id');

    for (var eventId in groupedData) {
        if (groupedData.hasOwnProperty(eventId)) {
            var eventGroup = groupedData[eventId];

            // Create cards for each candidate in the event group
            eventGroup.forEach(function (eventData) {
                var dateParts = eventData.date.split('/');
                var eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

                // Check if eventDate is a valid date
                if (isNaN(eventDate.getTime())) {
                    console.error("Invalid date for entry with event_id " + eventId + ": " + eventData.date);
                    return;  // Skip invalid date and move to the next entry
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

                // Existing code to create cards (similar to your current implementation)
                var card = $("<div class='event-card'></div");

                // Customize the card content based on eventData
                card.append("<p>Candidate: " + eventData.candidate + "</p>");
                card.append("<p>Party: " + eventData.party + "</p>");
                card.append("<img src='" + eventData.img + "' alt='" + eventData.candidate + "' class='img-fluid' />");
                // ... (continue with other candidate-specific information)

                // Append the card to the currentDay
                currentDay.append(card);
            });
        }
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
