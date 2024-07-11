let ds,
	totalEntries,
	allData,
	mapData,
	config,
	usBounds,
	sports = [],
	mobile = window.innerWidth < 768,
	filterVals = {
		"location_type": [],
		"sport": []
	};
const markerList = [];
const map = L.map('map', { preferCanvas: true }).setView([42.2423649, -100.8093025], 3);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);
const clusters = new L.MarkerClusterGroup({
	showCoverageOnHover: false
});
const sidebar = L.control.sidebar('sidebar', {
    position: 'right'
});
map.addControl(sidebar);

const search = e => {
	sidebar.hide();
	const val = e.target.value;
	$('#search-loader').css("visibility", "visible");
	$.getJSON('https://nominatim.openstreetmap.org/search.php?q=' + val + '&format=jsonv2&countrycodes=US,CA,PR,VI', function(res) {
		const response = $("#response");
		if (res.length > 0) {
			response.html("")
			xtalk.signalIframe();
			let maxImportance = Math.max(...res.map(r => r.importance))
			const topRes = res.filter(r => r.importance === maxImportance)[0];
			map.flyTo([topRes.lat, topRes.lon], 10);
		} else {
			response.html("We couldn't find that address, please try another.<br/>Note: It may be helpful to type out the full address, town name or school name.");
			xtalk.signalIframe();
		}
		$('#search-loader').css("visibility", "hidden");
	});
};

const addFilters = locationTypes => {
	const filterContainer = $('#legend');
	let innerHtml = filterContainer.html();
	for (let i = 0; i < locationTypes.length; i++) {
		const locationType = locationTypes[i];
		const id = locationType.replace(/\s+/g, '-').toLowerCase();
		filterVals["location_type"].push(locationType);
		const itemHtml = `<div class="form-check form-switch legend-item">
					<input role="switch" onchange="updateLocationTypes(event)" class="form-check-input" type="checkbox" checked id="${id}" value="${locationType}" style="background-color:rgba(221, 87, 70, 0.8);border-color:rgb(221, 87, 70);">
					<label class="form-check-label" for="${id}"><p>${locationType}</p></label>
				</div>`
		innerHtml += itemHtml;
	}
	filterContainer.html(innerHtml);
};

const updateLocationTypes = e => {
	const val = e.target.value;
	const displayed = filterVals["location_type"];
	const displayVal = !displayed.includes(val);
	if (displayVal) {
		filterVals["location_type"].push(val);
	} else {
		filterVals["location_type"] = displayed.filter(el => el != val);
	}
	filterData();
	$(e.target).css("background-color",  displayVal ? 'rgba(221, 87, 70, 0.8)' : "#ffffff");
};


const filterData = () => {
	mapData = allData.filter(datum => datum.location_type.split(", ").some(r=> filterVals["location_type"].includes(r)) && filterVals["sport"].includes(datum.sport));
	clusters.clearLayers();
	addClusters(mapData);
	setTimeout(styleClusters, 50);
};

const buildSportsList = () => {
	for (let i = 0; i < allData.length; i++) {
		const datum = allData[i];
		const sport = datum.sport;
		if (!sports.includes(sport)) {
			sports.push(sport)
			filterVals["sport"].push(sport);
		}
	}
};

const addSelect = () => {
	buildSportsList();
	sports = sports.sort();
	const select = $('#select');
	let selectOptions = '<option selected>All sports</option>';
	for (let i = 0; i < sports.length; i++) {
		const sport = sports[i];
		selectOptions += `<option value="${sport}">${sport}</option>`
	}
	select.html(selectOptions);
};

const filterSports = e => {
	const val = e.target.value;
	if (val === "All sports") {
		filterVals["sport"] = sports;
	} else {
		filterVals["sport"] = [val];
	}
	filterData();
}

// event handler for marker click
const handleMarkerClick = point => {
	const header = `<h1 class="location-name">${point.location_name}</h1>`;
	sidebar.setContent(header + point.tooltip);
	sidebar.show();
};

// fucntion to style clusters
const styleClusters = () => {
	const clusters = $(".marker-cluster div");
	for (let i = 0; i < clusters.length; i++) {
		const thisCluster = clusters[i];
		const span = thisCluster.children[0];
		const numMarkers = parseInt(span.innerHTML);
		const className = numMarkers < 900 ? numMarkers < 400 ? numMarkers < 200 ? numMarkers < 50 ? numMarkers < 15 ? "xsmall" : "small" : "medium" : "medium-large" : "large" : "xlarge";
		thisCluster.classList.add(className + "-cluster");
		span.classList.add(className + "-label");
	}
};

// function to add clusters only
const addClusters = data => {
	texts = L.layerGroup().addTo(map);
	for (let i = 0; i < data.length; i++) {
		const athlete = data[i];
		const customCircleMarker = L.CircleMarker.extend({
			options: { 
			   data: athlete
			}
		});
		var popup = L.popup().setContent(athlete.tooltip);
		clusters.addLayer(new customCircleMarker([athlete.lat, athlete.long], {
			data: athlete,
			fillOpacity: 0.85,
			fillColor: 'rgba(221, 87, 70, 0.8)',
			color:  'rgb(221, 87, 70)',
			weight: 0.5,
			radius: mobile ? 6 : 5
		}).on("click", () => handleMarkerClick(athlete)));
	}
	map.addLayer(clusters);
	mapClustered = true;
};

map.on('zoom', () => {
	const zoomLevel = map.getZoom();
	if (zoomLevel === 18) {
		$('.cluster-label').css("display", "block");
	} else {
		$('.cluster-label').css("display", "none");
	}
	
});

function init() {
	config = buildConfig();
	loadData('https://docs.google.com/spreadsheets/d/e/2PACX-1vRtdU3ka48OpMBBepDVI7GIdpbpfLNLplzBnVWcIqNIvFtly4rzpeZoiOHjzntW0EqLd1Ed2FGVWc6m/pub?gid=1697127437&single=true&output=csv');
	xtalk.signalIframe();
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
	mapData = [...allData];
	addClusters(mapData);
	styleClusters();
	addFilters(["Hometown", "School", "Current residence"]);
	$('.cluster-label').css("display", "none");
	addSelect();
	$('#loading').css("display", "none");
};

map.on('zoomend', () => {
	setTimeout(styleClusters, 100);
})

clusters.on('spiderfied', function (a) {
	const childMarkers = a.cluster.getAllChildMarkers();
	let sideBarContent = `<h1 class="location-name">${childMarkers[0].options.data.location_name}</h1>`;
	childMarkers.map(marker => sideBarContent += marker.options.data.tooltip);
	sidebar.setContent(sideBarContent);
	sidebar.show();
});

$(document).ready(function () {
	init();
});
