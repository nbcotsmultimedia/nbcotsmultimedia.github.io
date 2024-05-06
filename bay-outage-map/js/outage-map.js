let ds;
let config;
let data = {};
const markerList = [];
const map = L.map('map', { preferCanvas: true }).setView([37.89000, -122.4], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);
const myRenderer = L.canvas({ padding: 0.5 });
const clusters = new L.MarkerClusterGroup({ showCoverageOnHover: false }).addTo(map);
const markers = L.featureGroup().addTo(map);
// event handler for marker click
const handleMarkerClick = marker => {
	map.setView([marker.lat, marker.long]);
};
const legendItems = {
	"pge": {
		"color": "#FF2400",
		"size": "10px",
		"label": "PG&E"
	},
	"other": {
		"color": "#00b1ff",
		"size": "10px",
		"label": "Other utility company"
	}
}

// function to fill out pop up info for specific outage
const popUpInfo = outage => {
	const info = `<b>Status: </b> ${outage.status}
		<br/><b>Impacted customers: </b> ${outage.num_impacted}
		<br/><b>Start: </b> ${outage.start_date}
		<br/><b>Estimated end: </b>${outage.restore_date}
		<br/><b>Cause: </b> ${outage.cause ? outage.cause : 'Not available'}`;
	return info;
};

// function to add a legend
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
};

// function to create a marker and add to marker layer
const marker = outage => {
	const marker = L.circleMarker([outage.lat, outage.long], {
		renderer: myRenderer,
		radius: 5,
		weight: 0.5,
		color: "white",
		fillColor: "#00b1ff",
		fillOpacity: 0.85,
	}).bindPopup(popUpInfo(outage)).on('click', e => handleMarkerClick(outage));
	marker.addTo(markers);
	markerList.push(marker);
}

// fucntion to add markers + makeshift clusters to the map 
const addMarkers = data => {
	for (let i = 0; i < data.length; i++) {
		const outage = data[i];
		marker(outage);
	}
};

// fucntion to style clusters
const styleClusters = () => {
	const clusters = $(".marker-cluster div");
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
		const outage = data[i];
		clusters.addLayer(L.circleMarker([outage.lat, outage.long], {
			renderer: myRenderer,
			fillOpacity: 0.75,
			fillColor: '#FF2400',
			weight: 0,
			radius: 5
		}).bindPopup(popUpInfo(outage)).openPopup());
	}
};

function init() {
	config = buildConfig();
	const urls = {
		'pge': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgO5AqpXk9A-3ZSjGO4seRemZKRrtu8DKuoEqfSI1YBwW9FKD48wpxVG62H4HETAxtZUuO58rWY-W7/pub?gid=0&single=true&output=csv',
		'other': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgO5AqpXk9A-3ZSjGO4seRemZKRrtu8DKuoEqfSI1YBwW9FKD48wpxVG62H4HETAxtZUuO58rWY-W7/pub?gid=1574149924&single=true&output=csv'
	}
	loadData(urls);
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


function loadData(urls) {
	const tabs = Object.keys(urls);
	for (let i = 0; i < tabs.length; i++) {
		const tab = tabs[i];
		const url = urls[tab];
		Papa.parse(url, {
			download: true,
			header: true,
			config,
			complete: function (results) {
				data[tab] = results.data;
				parseData();
			}
		});
	}
};

function parseData() {
	const pgeData = data['pge'];
	const otherData = data['other'];
	addClusters(pgeData);
	styleClusters();
	if (otherData.length > 0) {
		addMarkers(otherData);
		fillLegend(legendItems);
	}
};

map.on('zoomend', () => {
	setTimeout(styleClusters, 100);
})


$(document).ready(function () {
	init();
});
