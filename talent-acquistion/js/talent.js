var ds;
var totalEntries;
var allStations = [];
var allData = [];
var map;
var config;


function init() {
	config = buildConfig();
	loadStations();

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

function makeMap() {

}

function loadStations() {

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vS4RSlYqnMqwQpuByUCbAdnkd0wm3OT8qbU0KQjAtJEHB-oSNwBBdZ4zDRhnTXbcijN_qae6r-2gNht/pub?gid=508340913&single=true&output=csv', {
		download: true,
    	header: true,
		config,
		complete: function(results) {
			//console.log("Finished Stations:", results.data);
			allStations = results.data;
			loadTalent();

		}
	});
}

function loadTalent() {

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vS4RSlYqnMqwQpuByUCbAdnkd0wm3OT8qbU0KQjAtJEHB-oSNwBBdZ4zDRhnTXbcijN_qae6r-2gNht/pub?gid=0&single=true&output=csv', {
		download: true,
    	header: true,
		config,
		complete: function(results) {
			console.log("Finished Talent:", results.data);
			allData = results.data;
			parseStations();

		}
	});
}

function parseStations() {
	var $len = allStations.length;
	totalEntries = $len;

	//GET ALL MARKERS
	var allMarkers = [];
	var allCoords = [];
	for (var i=0; i<$len; i++) {
		allMarkers.push(allStations[i].CallLetters);
		allCoords.push(allStations[i].LatLong);
	}
	//console.log(allCoords);

	//GET COUNT OF MARKERS
	var markers = {};
	var coords = {}
    //allMarkers.forEach(function(x) { markers[x] = (markers[x] || 0)+1; });
	allMarkers.forEach(function(x) { markers[x] = ""; });
	allCoords.forEach(function(x) { coords[x] = (coords[x] || 0)+1; });
	//console.log(markers['north']);
	//console.log(coords[0]);


	//MAP stuff
	map = L.map('map', {
						center: [39.18984, -100.7716789],
						zoom: 4,
						minZoom: 4,
						maxZoom: 18
	 });

	// Adding Voyager Basemap
	L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png', {
	 maxZoom: 18
	}).addTo(map);

	// Adding Voyager Labels
	L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png', {
	 maxZoom: 18,
	 zIndex: 10
	}).addTo(map);



	var createLabelIcon = function(labelClass,labelText){
	  return L.divIcon({
	    className: labelClass,
	    html: labelText,
			iconSize: 24
	  })
	}

	var myFeatureGroup = L.featureGroup().addTo(map).on("click", groupClick);
	var marker, cid;

	//TEST LABEL
	//marker = L.marker(new L.LatLng(38.897405, -77.036589), {icon:createLabelIcon("buildingLabel","TEST LABEL")}).addTo(map);


	//TEST LOCATION
	//marker = L.marker(new L.LatLng(38.898308, -77.036565), {icon:createLabelIcon("textLabelclass",markers['unknown'])}).addTo(map).addTo(myFeatureGroup);
	//marker.cid = "unknown";

	//CREATE MARKERS
	for (var j=0; j<totalEntries; j++) {
		marker = L.marker(new L.LatLng(allStations[j].Latitude, allStations[j].Longitude), {icon:createLabelIcon("textLabelclass",markers[allStations[j].CallLetters])}).addTo(map).addTo(myFeatureGroup);
		marker.cid = allStations[j].CallLetters;
	}
	

	function groupClick(event) {
  		//console.log("Clicked on marker " + event.layer.cid);
		//console.log("Clicked on marker");
		displayTalent(event.layer.cid);
	}

	/*var circle = L.circle([38.897513, -77.036562], {
  	color: 'red',
  	fillColor: '#f03',
  	fillOpacity: 0.5,
  	radius: 10,
		icon:createLabelIcon("textLabelclass", "a place")
	}).addTo(map);*/

}

function displayTalent(which) {
	//console.log(which);
	$("#talent").html("<table id=\"allTalent\" class=\"display\" style=\"width:100%\"><thead><tr><th>Name</th><th>Title</th><th>LinkedIn</th><th>Employer</th><th>Smart Recuiters</th></tr></thead></table>");
	

	for (var i=0; i<allData.length; i++) {
		
		if (allData[i].Station == which) {
			//console.log(allData[i].Station)
			
			$("#allTalent tr:last").after("<tr><td>" +  allData[i].Name + "</td>" + 
											  "<td>" +  allData[i].Title + "</td>" +
											  "<td><a href='" +  allData[i].LinkedIn + "' target='_blank'>Link</a></td>" +
											  "<td>" +  allData[i].Station + "</td>" +
											  "<td><a href='" +  allData[i].SmartRecruiters + "' target='_blank'>Link</a></td></tr>");
			
		}
	}

	//new DataTable('#allTalent');
	new DataTable('#allTalent', {
		info: false,
		ordering: false,
		paging: false,
		search: false
	});

	

}




$(document).ready(function(){
	init();
});
