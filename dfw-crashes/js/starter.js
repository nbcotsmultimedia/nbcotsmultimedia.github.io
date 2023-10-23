var ds;
var totalEntries;
var noRepeatData;
var config;
const markerList = [];
const map = L.map('map', { preferCanvas: true, zoomControl: false }).setView([32.7767, -96.7970], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);
const myRenderer = L.canvas({ padding: 0.5 });
const clusters = new L.MarkerClusterGroup({ showCoverageOnHover: false });
const legendItems = {
	"fatal": {
		"color": "red",
		"size": "10px",
		"label": "Fatal crash"
	},
	"si": {
		"color": "orange",
		"size": "10px",
		"label": "Serious injury crash"
	},
	"cluster": {
		"color": "#770737",
		"size": "15px",
		"label": "Multiple crashes"
	}
}
let markers;
let mapClustered = true;
let maxCrashes = 0;

// event handler for marker click
const handleMarkerClick = marker => {
	map.setView([marker.lat, marker.long]);
};

const marker = row => {
	const fillColor = row.repeat === "TRUE" ? "#770737" : row.fatal === "TRUE" ? "red" : "orange";
	const radius = row.repeat === "TRUE" ? row.num_crashes < 5 ? 8 : 14 : 6;
	const strokeWeight = row.repeat === "TRUE" ? 0 : 0.5;
	console.log(row.tooltip);
	const marker = L.circleMarker([row.lat, row.long], {
		renderer: myRenderer,
		weight: strokeWeight,
		radius: radius,
		color: "white",
		fillColor: fillColor,
		fillOpacity: 0.75,
		repeat: row.repeat,
		num_crashes: row.num_crashes
	}).bindPopup(row.tooltip).on('click', e => handleMarkerClick(row));
	marker.addTo(markers);
	markerList.push(marker);
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
	loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vQofM7Oeic99e_sVEXBe_ask_Xku0Y8GZAEeUw-YWvf41-H4IwzaF2Rwm-PE69xx8RDQRzcqBybrKdw/pub?output=csv', 'no repeats');
	loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vQofM7Oeic99e_sVEXBe_ask_Xku0Y8GZAEeUw-YWvf41-H4IwzaF2Rwm-PE69xx8RDQRzcqBybrKdw/pub?output=csv', 'with repeats');

	fillLegend(legendItems);
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
				if (noRepeatData) {
					L.control.zoom().addTo(map);
				}
			} else {
				withRepeatsData = results.data;
				parseData();
			}
		}
	});
};

function parseData() {
	const zoomLevel = map.getZoom();
	if (zoomLevel <= 8) {
		addClusters(withRepeatsData);
		styleClusters();
	} else {
		addMarkers(noRepeatData);
		styleMarkerOnZoom(zoomLevel);
	}

};

const styleMarkerOnZoom = zoomLevel => {
	let markerRadius;
	let smallClusterRadius;
	let bigClusterRadius;
	switch (zoomLevel) {
		case 9:
			markerRadius = 2;
			smallClusterRadius = 3;
			bigClusterRadius = 5;
			break;
		case 10:
			markerRadius = 3;
			smallClusterRadius = 4;
			bigClusterRadius = 6;
			break;
		case 11:
			markerRadius = 4;
			smallClusterRadius = 5;
			bigClusterRadius = 7;
			break;
		case 12:
			markerRadius = 5;
			smallClusterRadius = 6;
			bigClusterRadius = 8;
			break;
		case 13:
			markerRadius = 6;
			smallClusterRadius = 7;
			bigClusterRadius = 10;
			break;
		case 14:
			markerRadius = 6;
			smallClusterRadius = 7;
			bigClusterRadius = 10;
			break;
		case 15:
			markerRadius = 7;
			smallClusterRadius = 8;
			bigClusterRadius = 11;
			break;
		case 16:
			markerRadius = 7;
			smallClusterRadius = 8;
			bigClusterRadius = 11;
			break;
		case 17:
			markerRadius = 8;
			smallClusterRadius = 9;
			bigClusterRadius = 12;
			break;
		case 18:
			markerRadius = 8;
			smallClusterRadius = 9;
			bigClusterRadius = 12;
			break;
		case 19:
			markerRadius = 10;
			smallClusterRadius = 10;
			bigClusterRadius = 13;
			break;

	}
	
	const strokeWeight = markerRadius > 2 ? 0.5 : 0.25;
	const setMarkerRadius = marker => {
		if (marker.options.repeat === "TRUE") {
			if (marker.options.num_crashes < 5) {
				marker.setRadius(smallClusterRadius);
			} else {
				console.log(bigClusterRadius);
				marker.setRadius(bigClusterRadius);
			}
		} else {
			marker.setRadius(markerRadius);
			marker.options.weight = strokeWeight;
		}
	}
	markerList.map(marker => setMarkerRadius(marker));
}

map.on('zoom', () => {
	const zoomLevel = map.getZoom();
	if (mapClustered) {
		if (zoomLevel > 8) {
			clusters.clearLayers();
			addMarkers(noRepeatData);
			styleMarkerOnZoom(zoomLevel);
		} else {
			setTimeout(styleClusters, 50);
		}
	} else {
		if (zoomLevel <= 8) {
			map.removeLayer(markers);
			addClusters(withRepeatsData);
			setTimeout(styleClusters, 50);
		} else {
			styleMarkerOnZoom(zoomLevel);
		}
	}
});

const fillLegend = legendItems => {
	const legendItemKeys =  Object.keys(legendItems);
	let innerHtml = '';
	for (let i = 0; i < legendItemKeys.length; i++) {
		const thisLegendItem = legendItems[legendItemKeys[i]]
		const itemHtml = `<div class="legend-item"><div class="legend-icon" `
		+ `style="background-color:${thisLegendItem.color};height:${thisLegendItem.size};width:${thisLegendItem.size}"></div><p class="legend-label">${thisLegendItem.label}</p></div>`
		innerHtml += itemHtml;
	}
	$('#legend').html(innerHtml);
	console.log(innerHtml);
}

// setTimeout(styleClusters, 50);


$(document).ready(function () {
	init();
});
