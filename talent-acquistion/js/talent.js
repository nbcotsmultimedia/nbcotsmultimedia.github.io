var ds;
var totalEntries;
var allStations = [];
var allData = [];
var map;
var config;

var hearstIcon;

function init() {
	config = buildConfig();

	hearstIcon = L.icon({
		iconUrl: 'images/hearst.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	abcIcon = L.icon({
		iconUrl: 'images/abc.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	cbsIcon = L.icon({
		iconUrl: 'images/cbs.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	tegnaIcon = L.icon({
		iconUrl: 'images/tegna.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	pbsIcon = L.icon({
		iconUrl: 'images/pbs.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	nexstarIcon = L.icon({
		iconUrl: 'images/nexstar.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	foxIcon = L.icon({
		iconUrl: 'images/fox.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	sinclairIcon = L.icon({
		iconUrl: 'images/sinclair.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	coxIcon = L.icon({
		iconUrl: 'images/cox.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	sunbeamIcon = L.icon({
		iconUrl: 'images/sunbeam.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});
	defaultIcon = L.icon({
		iconUrl: 'images/default.png',
		iconSize:     [18, 18], // size of the icon
		iconAnchor:   [0, 0] // point of the icon which will correspond to marker's location
	});


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

	var myFeatureGroup = L.featureGroup().addTo(map).on("click", groupClick).on("mouseover", groupOver);
	var marker, cid;

	//TEST LABEL
	//marker = L.marker(new L.LatLng(38.897405, -77.036589), {icon:createLabelIcon("buildingLabel","TEST LABEL")}).addTo(map);


	//TEST LOCATION
	//marker = L.marker(new L.LatLng(38.898308, -77.036565), {icon:createLabelIcon("textLabelclass",markers['unknown'])}).addTo(map).addTo(myFeatureGroup);
	//marker.cid = "unknown";

	var icon;

	//CREATE MARKERS
	for (var j=0; j<totalEntries; j++) {
		switch (allStations[j].Owner) {
			case "Hearst":
				icon = hearstIcon;
				break;
			case "CBS":
				icon = cbsIcon;
				break;
			case "ABC":
				icon = abcIcon;
				break;
			case "PBS":
				icon = pbsIcon;
				break;
			case "Nexstar":
				icon = nexstarIcon;
				break;
			case "Tegna":
				icon = tegnaIcon;
				break;
			case "Fox":
				icon = foxIcon;
				break;
			case "Sinclair":
				icon = sinclairIcon;
				break;
			case "Sunbeam":
				icon = sunbeamIcon;
				break;
			case "Cox":
				icon = coxIcon;
				break;
			default:
				//something
				icon = defaultIcon;
		}

		//marker = L.marker(new L.LatLng(allStations[j].Latitude, allStations[j].Longitude), {icon:createLabelIcon("textLabelclass",markers[allStations[j].CallLetters])}).addTo(map).addTo(myFeatureGroup);
		marker = L.marker(new L.LatLng(allStations[j].Latitude, allStations[j].Longitude), { icon: icon  }).addTo(map).addTo(myFeatureGroup);
		//marker = L.circleMarker(new L.LatLng(allStations[j].Latitude, allStations[j].Longitude), { radius: 7, color: 'white', weight: 2, fillOpacity: .66, fillColor: 'red', title: 'XXXX' }).addTo(map).addTo(myFeatureGroup);
		marker.cid = allStations[j].CallLetters;
		marker.cid2 = j;
	}

	
	function groupClick(event) {
  		//console.log("Clicked on marker " + event.layer.cid);
		//console.log("Clicked on marker");
		displayTalent(event.layer.cid, event.layer.cid2);
	}
	function groupOver(event) {
		
	  console.log("over");
  	}	

	/*var circle = L.circle([38.897513, -77.036562], {
  	color: 'red',
  	fillColor: '#f03',
  	fillOpacity: 0.5,
  	radius: 10,
		icon:createLabelIcon("textLabelclass", "a place")
	}).addTo(map);*/

}

function displayTalent(which, myindex) {
	//console.log(which + " // " + myindex);
	$("#talent").html("<table id=\"allTalent\" class=\"display\" style=\"width:100%\"><thead><tr><th>Name</th><th>Title</th><th>Employers</th><th>Contract</th><th>Smart Recuiters</th><th>Notes</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table>");
	
	//$("#currentSel").html("<h4>Current selection: " + which + " (" + "Hearst" + ")</h4>")
	$("#currentSel").html("<h5>Current selection: " + which + "</h5><p>Alternate name: "  + allStations[myindex].AltCall + "<br/>Owner: " + allStations[myindex].Owner + "</p>");

	for (var i=0; i<allData.length; i++) {
		
		if (allData[i].Station == which) {
			//console.log(allData[i].Station)

			var srlink = "NA";
			if (allData[i].SmartRecruiters != "NA") {
				srlink = "<a href='" +  allData[i].SmartRecruiters + "' target='_blank'>Link</a>";
			}
			
			$("#allTalent tr:last").after("<tr><td><a href='" + allData[i].LinkedIn + "' target='_blank'>" +  allData[i].Name + "</a></td>" + 
											  "<td>" +  allData[i].Title + "</td>" +
											  "<td>" +  allData[i].Station + "</td>" +
											  "<td>" +  allData[i].ContractDate + "</td>" +
											 
											  "<td>" + srlink +"</td>" +
		  									  "<td>" + allData[i].Notes +"</td></tr>");
			
		}
	}

	//new DataTable('#allTalent');
	new DataTable('#allTalent', {
		info: false,
		searching: false,
		paging: false,
		stripe: true,
		order: [[1, 'asc']]
	});

	

}




$(document).ready(function(){
	init();
});
