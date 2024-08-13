let ds,
	totalEntries,
	allData,
	cities,
	geoJsonLayer,
	cityLayer,
	config,
	mobile = window.innerWidth < 550,
	sidebar = $('#sidebar'),
	sidebarContent = $('#sidebar-content');
const map = L.map('map').setView([33.0169285, -116.8460104], 9);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);

const search = e => {
	const val = e.target.value;
	const response = $("#response");
	let newSidebarTop = "150px";
	try {
		const feature = allData["features"].filter(feature => feature.properties.ZIP === parseInt(val))[0];
		selectZipCode(e, feature);
		response.html("");
		newSidebarTop = mobile ? "500px" : "150px";
	} catch {
		response.html("We couldn't find that zip code. Please enter a valid San Diego County zip code.");
		newSidebarTop = mobile ? "560px" : "190px";
	}
	$('#sidebar').css("top", newSidebarTop);
};

const colors = {
	"No data": [null, '#adadad'],
	"Low": [0.25, '#F2C85B'],
	"Low-Moderate": [0.5, '#FBA465'],
	"Moderate-High": [0.75, '#F86E51'],
	"High": [0.9, '#EE3E38'],
	"High-Top10%": [1, '#D1193E'],
};

const handleMarkerClick = marker => {
	map.flyTo([marker.lat, marker.long], 10);
};

function init() {
	config = buildConfig();
	loadData();
	fillLegend();
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

const fillLegend = () => {
	let legendContent = '';
	const legendLabels = Object.keys(colors);
	const numRows = mobile ? 2 : 1;
	const numPerRow = Math.max(legendLabels.length / numRows);
	let currentIdx = 0;
	for (let i = 0; i < numRows; i++) {
		legendContent += `<div style="margin-top:${5 * i}px; display:flex;">`
		for (let j = 0; j < numPerRow; j++) {
			try {
				const label = legendLabels[currentIdx];
				legendContent += `<b style="border-right:18px solid ${colors[label][1]};opacity:0.8;height:18px;margin-right:3px;margin-top:1px;"></b><p style="margin-right: 10px;">${label}</p>`;
				currentIdx++;
			} catch {
				console.log("Legend error");
			}
		}
		legendContent += "</div>"
	}
	$('#legend').html(legendContent);
}

const zipCodeOpacity = feature => {
	$(".leaflet-interactive").css('opacity', 0.35);
	$(`.feature-${feature.properties.ZIP}`).css('opacity', 0.8);
};

const selectZipCode = (e, feature) => {
	showZipCode(e, feature);
	let viewCoords = Object.values(geoJsonLayer._layers).filter(layer => layer.feature === feature)[0].getBounds().getCenter();
	viewCoords = mobile ? [viewCoords["lat"] - 0.25, viewCoords["lng"]] : [viewCoords["lat"], viewCoords["lng"] + 0.25];
	map.setView(viewCoords);
	zipCodeOpacity(feature);
	showSidebar(feature);
};

const showSidebar = feature => {
	let sidebarVisible = sidebar.css('display') === 'block';
	let dataAvailable = feature.properties.OVERALL_RANK !== null;
	let featureData = dataAvailable ? `<h1 class="tooltip-header">${feature.properties.ZIP}</h1>`+
	`<div class="sidebar-item"><i class="fa-solid fa-truck-medical"></i><div><h2 class="tooltip-subhed">Historical Heat and Health Burden</h2><p class="tooltip-text">${feature.properties.HHB_RANK}</p></div></div>`+
	`<div class="sidebar-item"><i class="fa-solid fa-heart-pulse bigger"></i><div><h2 class="tooltip-subhed">Sensitivity</h2><p class="tooltip-text">${feature.properties.F_SEN_COUNT}</p></div></div>`+
	`<div class="sidebar-item"><i class="fa-solid fa-person-cane biggest"></i><div><h2 class="tooltip-subhed">Sociodemographic</h2><p class="tooltip-text">${feature.properties.SOCIODEM_RANK}</p></div></div>`+
	`<div class="sidebar-item"><i class="fa-solid fa-tree-city"></i><div><h2 class="tooltip-subhed">Natural and Built Environment</h2><p class="tooltip-text">${feature.properties.NBE_RANK}</p></div></div>` :
		`<h1 class="tooltip-header">${feature.properties.ZIP}</h1><p class="tooltip-text">Data not available for this zip code.</p>`;

	if (sidebarVisible) {
		sidebarContent.removeClass('show-content');
		sidebarContent.addClass('hide-content');
		setTimeout(() => {
			sidebarContent.html(featureData);
			sidebarContent.removeClass('hide-content');
			sidebarContent.addClass('show-content');
		}, 250);
	} else {
		sidebarContent.html(featureData);
		if (mobile) {
			sidebar.show("slide", { direction: "down" }, 1000);
		} else {
			sidebar.show("slide", { direction: "right" }, 1000);
		}
	}
};

const uniformZipCodeOpacity = () => {
	$(".leaflet-interactive").css('opacity', 0.8);
};

const unSelectZipCode = () => {
	uniformZipCodeOpacity();
	hideSidebar();
};

const hideSidebar = () => {
	if (mobile) {
		sidebar.hide("slide", { direction: "down" }, 1000);
	} else {
		sidebar.hide("slide", { direction: "right" }, 1000);
	}
};

const showZipCode = (e, feature) => {
	e.target.openPopup();
	zipCodeOpacity(feature);
};

const showZipCodeOnMouseover = (e, feature) => {
	if (sidebar.css("display") === "none") {
		e.target.openPopup();
	}
};

const hideZipCode = e => {
	if (sidebar.css("display") === "none") {
		uniformZipCodeOpacity();
		Object.values(e.target._layers).map(layer => layer.closePopup());
	}
}

function loadData() {
	d3.json("./data/sd-hhi-map.json").then(data => {
		allData = data;
		function getColor(d) {
			const legendLabels = Object.keys(colors);
			for (let i = 0; i < legendLabels.length; i++) {
				const thisColor = colors[legendLabels[i]];
				if (d === thisColor[0] | d < thisColor[0]) {
					return thisColor[1]
				}
			}
		};
		function style(feature) {
			return {
				fillColor: getColor(feature.properties.OVERALL_RANK),
				weight: 0.5,
				opacity: 1,
				color: '#444444',
				fillOpacity: 1,
				className: 'feature-' + feature.properties.ZIP
			};
		};
		geoJsonLayer = L.geoJson(allData, {
			onEachFeature: function (feature, layer) {
				layer.on({
					click: (event) => selectZipCode(event, feature),
					mouseover: (event) => showZipCodeOnMouseover(event, feature),
				});
				layer.bindPopup(feature.properties.ZIP.toString(), { direction: "center", closeButton: false });
			},
			style: style
		}).addTo(map);

		geoJsonLayer.on('mouseout', event => hideZipCode(event));
	});

	d3.json("./data/sd-major-cities.geojson").then(data => {
		cityLayer = L.geoJSON(null, {
			pointToLayer: function (feature, latlng) {
				let popClass = feature.properties.POP_CLASS;
				let cName = popClass >= 10 ? "major-city" : popClass > 7 ? "big-city" : "city"; 
				label = String(feature.properties.NAME); 
				return new L.CircleMarker(latlng, {
					radius: 1,
				}).bindTooltip(label, { permanent: true, direction: "center", className: "my-labels "+cName}).openTooltip();
			},
		});
		cities = data['features'];
		let topCities = cities.filter(d => d.properties.POP_CLASS >= 8);
		cityLayer.addData(topCities);
		map.addLayer(cityLayer);
	});
};

map.on('zoom', () => {
	zoomLevel = map.getZoom();
	console.log(zoomLevel);
	let includeCities;
	cityLayer.clearLayers();
	if (zoomLevel <= 9) {
		includeCities = cities.filter(d => d.properties.POP_CLASS >= 8);
	} else if (zoomLevel == 10) {
		includeCities = cities.filter(d => d.properties.POP_CLASS >= 7);
	} else {
		includeCities = cities;
	}
	cityLayer.addData(includeCities);
});

$(document).ready(function () {
	init();
});
