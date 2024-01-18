var ds;
var totalEntries;
var noRepeatData;
var config;
const markerList = [];
const map = L.map('map', { preferCanvas: true, zoomControl: false }).setView(coords, zoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);
const myRenderer = L.canvas({ padding: 0.5 });
const clusters = new L.MarkerClusterGroup({ showCoverageOnHover: false });
let legendItems = [
	{
		"color": "#e81416",
		"size": "10px",
		"label": "Fatal injury",
		"severity": 'FATAL INJURY'
	},
	{
		"color": "#ffa500",
		"size": "10px",
		"label": "Suspected serious injury",
		"severity": 'SUSPECTED SERIOUS INJURY'
	},
	{
		"color": "#70369d",
		"size": "10px",
		"label": "Other injury/ Not injured",
		"severity": 'OTHER INJURY'
	},
	{
		"color": "#79c314",
		"size": "10px",
		"label": "Suspected minor injury",
		"severity": 'SUSPECTED MINOR INJURY'
	},
	{
		"color": "#008000",
		"size": "10px",
		"label": "Possible injury",
		"severity": 'POSSIBLE INJURY'
	}, 
	{
		"color": "#487de7",
		"size": "10px",
		"label": "Not injured",
		"severity": 'NOT INJURED'
	}, 
	{
		"color": "#70369d",
		"size": "10px",
		"label": "Unknown injury",
		"severity": 'UNKNOWN'
	},
	{
		"color": "#FF69B4",
		"size": "15px",
		"label": "Multiple crashes",
		"severity": ''
	}
];
if (categories.length > 0) {
	legendItems = legendItems.filter(item => categories.includes(item.severity) || item.severity === '')
}
let markers;
let texts;
let mapClustered = true;
let maxCrashes = 0;
let zoomLevel;

// event handler for marker click
const handleMarkerClick = marker => {
	map.setView([marker.lat, marker.long]);
};

const marker = row => {
	console.log(row.severity)
	console.log(legendItems.find(legendItem => legendItem.severity === row.severity))
	const fillColor = row.repeat === "TRUE" ? "#FF69B4" : legendItems.find(legendItem => legendItem.severity === row.severity).color;
	const radius = row.repeat === "TRUE" ? row.num_crashes < 5 ? 8 : 14 : 6;
	const strokeWeight = row.repeat === "TRUE" ? 0 : 0.5;
	const marker = L.circleMarker([row.lat, row.long], {
		renderer: myRenderer,
		weight: strokeWeight,
		radius: radius,
		color: "white",
		fillColor: fillColor,
		fillOpacity: 0.9,
		repeat: row.repeat,
		num_crashes: row.num_crashes
	}).bindPopup(row.tooltip).on('click', e => handleMarkerClick(row));
	marker.addTo(markers);
	markerList.push(marker);
	if (row.repeat === "TRUE") {
		text(row);
	}
}

const text = row => {
	const text = L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'cluster-label',
		renderer: myRenderer,
    })
    .setContent(row.num_crashes.toString())
    .setLatLng([row.lat, row.long]);
    text.addTo(texts);
}

// fucntion to add markers + makeshift clusters to the map 
const addMarkers = data => {
	markers = L.layerGroup().addTo(map);
	texts = L.layerGroup().addTo(map);
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
	loadData(sheets[0], 'with repeats');
	loadData(sheets[1], 'no repeats');

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
			if (dataset === "no repeats") {
				noRepeatData = results.data;
				if (noRepeatData) {
					L.control.zoom().addTo(map);
				}
				if (zoom > 10) {
					parseData();
				}
			} else {
				withRepeatsData = results.data;
				if (zoom <= 10) {
					parseData();
				}
			}
		}
	});
};

function parseData() {
	zoomLevel = map.getZoom();
	if (zoomLevel < 12) {
		addClusters(withRepeatsData);
		styleClusters();
	} else {
		addMarkers(noRepeatData);
		styleMarkerOnZoom();
	}

};


const styleMarkerOnZoom = () => {
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
				marker.setRadius(bigClusterRadius);
			}
		} else {
			marker.setRadius(markerRadius);
			marker.options.weight = strokeWeight;
		}
	}
	markerList.map(marker => setMarkerRadius(marker));
	if (zoomLevel < 17) {
		$('.cluster-label').css('display', 'none');
	} else {
		$('.cluster-label').css('display', 'block');
	}
}

map.on('zoom', () => {
	zoomLevel = map.getZoom();
	if (mapClustered) {
		if (zoomLevel >= 12) {
			clusters.clearLayers();
			addMarkers(noRepeatData);
			styleMarkerOnZoom();
		} else {
			setTimeout(styleClusters, 50);
		}
	} else {
		if (zoomLevel < 12) {
			map.removeLayer(markers);
			addClusters(withRepeatsData);
			setTimeout(styleClusters, 50);
		} else {
			styleMarkerOnZoom();
		}
	}
});


const fillLegend = legendItems => {
	let innerHtml = '';
	for (let i = 0; i < legendItems.length; i++) {
		const thisLegendItem = legendItems[i]
		const itemHtml = `<div class="legend-item"><div class="legend-icon" `
		+ `style="background-color:${thisLegendItem.color};height:${thisLegendItem.size};width:${thisLegendItem.size}"></div><p class="legend-label">${thisLegendItem.label}</p></div>`
		innerHtml += itemHtml;
	}
	$('#legend').html(innerHtml);
}


$(document).ready(function () {
	init();
});
