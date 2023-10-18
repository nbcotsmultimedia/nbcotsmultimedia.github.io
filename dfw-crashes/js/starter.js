var ds;
var totalEntries;
var allData;
var config;
const markerList = [];

const map = L.map('map', { scrollWheelZoom: false }).setView([32.7767, -96.7970], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);

// event handler for marker click
const handleMarkerClick = (e, marker) => {
	map.setView([marker.lat, marker.long],15);
};

// create a marker and add to marker list
const marker = markerData => {
	const lat = markerData.lat;
	const long = markerData.long;
	const id = markerData.crash_id;
	const fatal = markerData.fatal;
	// create custom marker
	var markerIcon = L.icon({
		iconUrl: fatal === "TRUE" ? 'images/fatal-marker.png' : 'images/injury-marker.png',
		iconSize: [26, 39.83],
		iconAnchor: [13, 16.5],
	});

	const marker = L.marker([lat, long], { title: id, icon: markerIcon });
	marker.on('click', e => handleMarkerClick(e, markerData));

	markerList.push(marker);

	return marker;
};

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


function init() {
	//console.log("ready");

	config = buildConfig();
	loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vQofM7Oeic99e_sVEXBe_ask_Xku0Y8GZAEeUw-YWvf41-H4IwzaF2Rwm-PE69xx8RDQRzcqBybrKdw/pub?output=csv');

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


function loadData(url) {

	Papa.parse(url, {
		download: true,
		header: true,
		config,
		complete: function (results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			parseData();

		}
	});
};

function parseData() {
	var $len = allData.length;
	totalEntries = $len;

	var markers = new L.MarkerClusterGroup();

	for (let i = 0; i < totalEntries; i++) {
		markers.addLayer(marker(allData[i]));
	}
	map.addLayer(markers);

	styleClusters();
};

map.on('zoom', () => {
	setTimeout(styleClusters, 50);
});



$(document).ready(function () {
	init();
});
