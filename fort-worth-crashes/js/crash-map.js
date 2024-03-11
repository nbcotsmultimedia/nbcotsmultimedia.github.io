let ds;
let totalEntries;
let allNoRepeatData,
	allWithRepeatsData;
let currentNoRepeatData,
	currentWithRepeatsData
let config;
const markerList = [];
const map = L.map('map', { preferCanvas: true, zoomControl: false }).setView(coords, zoom);
const filterValues = {};

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
		"severity": 'Fatal Injury',
		"id": "fatal"
	},
	{
		"color": "#ffa500",
		"size": "10px",
		"label": "Suspected serious injury",
		"severity": 'Suspected Serious Injury',
		"id": "serious"
	},
	{
		"color": "#70369d",
		"size": "10px",
		"label": "Other injury/ Not injured",
		"severity": 'OTHER INJURY',
		"id": "other"
	},
	{
		"color": "#79c314",
		"size": "10px",
		"label": "Suspected minor injury",
		"severity": 'Suspected Minor Injury',
		"id": "minor"
	},
	{
		"color": "#008000",
		"size": "10px",
		"label": "Possible injury",
		"severity": 'Possible Injury',
		"id": "possible"
	}, 
	{
		"color": "#487de7",
		"size": "10px",
		"label": "Not injured",
		"severity": 'Not Injured',
		"id": "not-injured"
	}, 
	{
		"color": "#70369d",
		"size": "10px",
		"label": "Unknown injury",
		"severity": 'Unknown',
		"id": "unknown"
	},
	{
		"color": "#FF69B4",
		"size": "15px",
		"label": "Multiple crashes",
		"severity": '',
		"id": ""
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
	const fillColor = row.repeat === "TRUE" ? "#FF69B4" : legendItems.find(legendItem => legendItem.severity === row["Crash Severity"]).color;
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
	$(marker).addClass("single-marker");
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

	if ($('#filter-legend').length > 0) {
		fillFilter(legendItems);
	} else {
		fillLegend(legendItems);
	}
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
				allNoRepeatData = results.data;
				currentNoRepeatData = allNoRepeatData;
				if (allNoRepeatData) {
					L.control.zoom().addTo(map);
					$('.form-check-input').removeAttr("disabled");
				}
				if (zoom > 10) {
					parseData(allNoRepeatData, "noRepeats");
				}
			} else {
				allWithRepeatsData = results.data;
				currentWithRepeatsData = allWithRepeatsData;
				if (zoom <= 10) {
					parseData(allWithRepeatsData, "withRepeats");
				}
			}
		}
	});
};

function parseData(data, dataType) {
	zoomLevel = map.getZoom();
	if (zoomLevel >= 10 && dataType === "withRepeats") {
		addClusters(data);
		styleClusters();
	} else if (dataType === "noRepeats") {
		addMarkers(data);
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
	if (zoomLevel < 16) {
		$('.cluster-label').css('display', 'none');
	} else {
		$('.cluster-label').css('display', 'block');
	}
}

map.on('zoom', () => {
	zoomLevel = map.getZoom();
	if (mapClustered) {
		if (zoomLevel >= 10) {
			clusters.clearLayers();
			addMarkers(currentNoRepeatData);
			styleMarkerOnZoom();
		} else {
			setTimeout(styleClusters, 50);
		}
	} else {
		if (zoomLevel < 10) {
			map.removeLayer(markers);
			addClusters(currentWithRepeatsData);
			setTimeout(styleClusters, 50);
		} else {
			styleMarkerOnZoom();
		}
	}
});


const fillLegend = legendItems => {
	const legend = $('#legend');
	let innerHtml = legend.html();
	for (let i = 0; i < legendItems.length; i++) {
		const thisLegendItem = legendItems[i]
		const itemHtml = `<div class="legend-item"><div class="legend-icon" `
		+ `style="background-color:${thisLegendItem.color};height:${thisLegendItem.size};width:${thisLegendItem.size}"></div><p class="legend-label">${thisLegendItem.label}</p></div>`
		innerHtml += itemHtml;
	}
	legend.html(innerHtml);
};

const fillFilter = legendItems => {
	const filterContainer = $('#filter-legend');
	if (filterContainer.length > 0) {
		let innerHtml = filterContainer.html();
		for (let i = 0; i < legendItems.length; i++) {
			const thisLegendItem = legendItems[i];
			if (thisLegendItem.id.length > 0) {
				filterValues[thisLegendItem.severity] = true;
				const itemHtml = `<div class="form-check form-switch">
					<input class="form-check-input" onchange="filterInjuryTypes(event, '${thisLegendItem.color}')" type="checkbox" checked id="${thisLegendItem.id}" value="${thisLegendItem.severity}" style="background-color:${thisLegendItem.color};border-color:${thisLegendItem.color};" disabled>
					<label class="form-check-label" for="${thisLegendItem.id}"><p>${thisLegendItem.label}</p></label>
				</div>`
				innerHtml += itemHtml;
			}
		}
		filterContainer.html(innerHtml);
	}
};

const filterInjuryTypes = (e, color) => {
	const val = e.target.value;
	filterValues[val] = !filterValues[val];
	let exclude = {...filterValues};
	exclude = Object.keys(exclude).filter(key => !exclude[key]);
	currentNoRepeatData = [...allNoRepeatData].filter(row => !exclude.includes(row.severity));
	currentWithRepeatsData = [...allWithRepeatsData].filter(row => !exclude.includes(row.severity));
	zoomLevel = map.getZoom();
	if (mapClustered) {
		clusters.clearLayers();
		addClusters(currentWithRepeatsData);
		setTimeout(styleClusters, 50);
	} else {
		map.removeLayer(markers);
		addMarkers(currentNoRepeatData);
		setTimeout(styleMarkerOnZoom, 50);
	}
	$(e.target).css("background-color", filterValues[val] ? color : "#ffffff");
};


$(document).ready(function () {
	init();
});
