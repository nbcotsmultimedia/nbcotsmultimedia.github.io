var ds;
var totalEntries;
var noRepeatData;
var config;
const markerList = [];
const map = L.map('map', { preferCanvas: true }).setView([32.7767, -96.7970], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);
const myRenderer = L.canvas({ padding: 0.5 });
const clusters = new L.MarkerClusterGroup({ showCoverageOnHover: false });
let markers;
let mapClustered = true;
let maxCrashes = 0;

// event handler for marker click
const handleMarkerClick = (e, marker) => {
	map.setView([marker.lat, marker.long]);
};

const marker = row => {
	const fillColor = row.repeat === "TRUE" ? "#770737" : row.fatal === "TRUE" ? "red" : "orange";
	const radius = row.repeat === "TRUE" ? row.num_crashes < 5 ? 8 : 14 : 6;
	const strokeWeight = row.repeat === "TRUE" ? 0 : 0.5;
	L.circleMarker([row.lat, row.long], {
		renderer: myRenderer,
		weight: strokeWeight,
		radius: radius,
		color: "white",
		fillColor: fillColor,
		fillOpacity: 0.75
	}).bindPopup(row.tooltip).on('click', e => handleMarkerClick(e, row)).addTo(markers);
}

// fucntion to add markers + makeshift clusters to the map 
const addMarkers = data => {
	markers = L.layerGroup().addTo(map);
	for (let i = 0; i < data.length; i++) {
		const row = data[i];
		marker(row);
	}
	mapClustered = false;
};

// fucntion to style clusters
const styleClusters = () => {
	const clusters = $(".marker-cluster div");
	for (let i = 0; i < clusters.length; i++) {
		const thisCluster = clusters[i];
		const span = thisCluster.children[0];
		const numMarkers = parseInt(span.innerHTML);
		const className = numMarkers < 5000 ? numMarkers < 2000 ? numMarkers < 500 ? numMarkers < 200 ? numMarkers < 50 ? "xsmall" : "small" : "medium" : "medium-large" : "large" : "xlarge";
		thisCluster.classList.add(className + "-cluster");
		span.classList.add(className + "-label");
	}
};

// function to add clusters only
const addClusters = data => {

	for (let i = 0; i < data.length; i++) {
		clusters.addLayer(L.circleMarker([data[i].lat, data[i].long], { 
			renderer: myRenderer, 
			fillOpacity: 0,
			weight: 0
		 }));
	}
	map.addLayer(clusters);
	mapClustered = true;
};

function init() {
	//console.log("ready");

	config = buildConfig();
	loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vShLzLujzc3Mdk3lC6XjrOkWXOKvpeWBHnnHV3E35dwr_35MVzoGg8VYY7txatxizUmoHPepbbCKwCA/pub?output=csv', 'no repeats');
	setTimeout(loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vQofM7Oeic99e_sVEXBe_ask_Xku0Y8GZAEeUw-YWvf41-H4IwzaF2Rwm-PE69xx8RDQRzcqBybrKdw/pub?output=csv', 'with repeats'), 50);
};

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
};


function loadData(url, dataset) {

	Papa.parse(url, {
		download: true,
		header: true,
		config,
		complete: function (results) {
			//console.log("Finished:", results.data);
			if (dataset === "no repeats") {
				noRepeatData = results.data;
			} else {
				withRepeatsData = results.data;
				parseData();
			}
		}
	});
};

function parseData() {
	addClusters(withRepeatsData);
	styleClusters();
	//addMarkers(noRepeatData);

};

map.on('zoom', () => {
	const zoomLevel = map.getZoom();
	if (mapClustered) {
		if (zoomLevel > 8) {
			clusters.clearLayers();
			addMarkers(noRepeatData);
		} else {
			setTimeout(styleClusters, 50);
		}
	} else if (zoomLevel <= 8) {
		map.removeLayer(markers);
		addClusters(withRepeatsData);
		setTimeout(styleClusters, 50);
	} 
});

// setTimeout(styleClusters, 50);


$(document).ready(function () {
	init();
});
