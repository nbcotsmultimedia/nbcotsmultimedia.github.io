var ds;
var totalEntries;
var allData;
var config;
const markerList = [];
const map = L.map('map', { preferCanvas: true }).setView([37.89000,-122.4], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);
const myRenderer = L.canvas({ padding: 0.5 });
const clusters = new L.MarkerClusterGroup({ showCoverageOnHover: false });

// event handler for marker click
const handleMarkerClick = marker => {
	map.setView([marker.lat, marker.long]);
};

// fucntion to style clusters
const styleClusters = () => {
	const clusters = $(".marker-cluster div");
	console.log(clusters.length)
	for (let i = 0; i < clusters.length; i++) {
		const thisCluster = clusters[i];
		const span = thisCluster.children[0];
		const numMarkers = parseInt(span.innerHTML);
		const className = numMarkers < 900 ? numMarkers < 500 ? numMarkers < 100 ? numMarkers < 50 ? numMarkers < 15 ? "xsmall" : "small" : "medium" : "medium-large" : "large" : "xlarge";
		thisCluster.classList.add(className + "-cluster");
		span.classList.add(className + "-label");
	}
};

// function to add clusters only
const addClusters = data => {

	for (let i = 0; i < data.length; i++) {
		clusters.addLayer(L.circleMarker([data[i].lat, data[i].long], {
			renderer: myRenderer,
			fillOpacity: 0.75,
			fillColor: '#FF2400',
			weight: 0,
			radius: 5
		})
		.bindPopup(`
		<b>Status: </b> ${data[i].status}
		<br/><b>Impacted customers: </b> ${data[i].num_impacted}
		<br/><b>Start: </b> ${data[i].start_date}
		<br/><b>Estimated end: </b>${data[i].restore_date}
		<br/><b>Cause: </b> ${data[i].cause ? data[i].cause : 'Not available'}`)
		.openPopup());
	}
	map.addLayer(clusters);
	mapClustered = true;
};

function init() {

	config = buildConfig();
	loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vTgO5AqpXk9A-3ZSjGO4seRemZKRrtu8DKuoEqfSI1YBwW9FKD48wpxVG62H4HETAxtZUuO58rWY-W7/pub?gid=0&single=true&output=csv');

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
			allData = results.data;
			parseData();
		}
	});
};

function parseData() {
	addClusters(allData);
	styleClusters();
};

map.on('zoomend', () => {
	setTimeout(styleClusters, 100);
})


$(document).ready(function () {
	init();
});
