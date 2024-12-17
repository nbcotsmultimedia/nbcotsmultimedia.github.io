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

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vQjDcDHaXQYiT_KcvUQj2_4nxvssSpY6PJ5exGJN4SiKDHF2eR95XantbZOH5kOKHkznikaletChJ30/pub?gid=1776281408&single=true&output=csv', {
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
	var $len = allData.length;
	totalEntries = $len;

	//TO ACCESS DATA
	//console.log(allData[0].col_name_from_csv);
	for (var i=0; i<totalEntries; i++) {
		$("#allHighs").append("<div class='th'><a href='" + allData[i].Link + "' target='_blank'><img src='" + allData[i].Thumb + "' class='img-fluid' /></a></div>" +
								"<div class='info'><a href='" + allData[i].Link + "' target='_blank'><h4>" + allData[i].Title + "</h4></a>" + 
								"<p>" + allData[i].Desc + "</p>" +
								"<p><strong>What we did</strong><br>" + allData[i].Contribution + "</p></div><hr>");
	}

}



$(document).ready(function(){
	init();
});
