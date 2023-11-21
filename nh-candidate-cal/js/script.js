var ds;
var totalEntries;
var allData;
var config;
var selectedCandidate = null;

function init() {
    config = buildConfig();
    loadData();
    setupCandidateDropdown();
}

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

function loadData() {
    Papa.parse(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTLf6vvDf-XgnXtguWKz4ayW5P5BCyihNjNpO_axRNLHvaJJUnWS3_TQ0GKcTDBAPPhB0yufGWLX5WE/pub?gid=0&single=true&output=csv',
        {
            download: true,
            header: true,
            config,
            complete: function (results) {
                allData = results.data;
                parseData(allData); // Pass allData to parseData function
            },
        }
    );
}

function setupCandidateDropdown() {
    $("#candidate-dropdown").on("change", function () {
        selectedCandidate = $(this).val();
        filterAndRenderEvents();
    });
}

function filterAndRenderEvents() {
    var filteredEvents = allData.filter(function (event) {
        return selectedCandidate === null || event.candidate === selectedCandidate;
    });

    console.log("Filtered Events:", filteredEvents); // Log filtered events to the console

    $("#content").empty();
    parseData(filteredEvents);
}

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

function parseData(events) {
    events.sort(function (a, b) {
        var dateA = new Date(a.date);
        var dateB = new Date(b.date);
        return dateA - dateB;
    });

    var $len = events.length;
    totalEntries = $len;

    var currentDay;
    var currentWeek = null;
    var weekStartDate = null;
    var weekEndDate = null;
    var currentWeekHeader;

    var currentDate = new Date();

    for (var i = 0; i < totalEntries; i++) {
        var dateParts = events[i].date.split('/');
        var eventDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);

        // ... (rest of your existing parseData function)

        var card = $("<div class='event-card'></div");

        // ... (rest of your existing parseData function)

        currentDay.append(card);
    }

    if (currentWeek) {
        if (currentWeekHeader) {
            $("#content").append(currentWeekHeader);
        }
        $("#content").append(currentWeek);
    }
}

$(document).ready(function () {
    init();
});