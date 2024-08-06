let ds,
	totalEntries,
	allData,
	config,
	mobile = window.innerWidth < 550,
	sidebar = $('#sidebar'),
	sidebarContent = $('#sidebar-content');
const map = L.map('map').setView([33.0169285, -116.8460104], 9);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);

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
	const numRows  = mobile ? 2 : 1;
	const numPerRow = Math.max(legendLabels.length / numRows);
	let currentIdx = 0;
	for (let i = 0; i < numRows; i++) {
		legendContent += `<div style="margin-top:${5*i}px; display:flex;">`
		for (let j = 0; j < numPerRow; j++) {
			try {
				const label = legendLabels[currentIdx];
				legendContent += `<b style="border-right:18px solid ${colors[label][1]};opacity:0.85;height:18px;margin-right:3px;margin-top:3px;"></b><p style="margin-right: 10px;">${label}</p>`;
				currentIdx++;
			} catch {
				console.log("Legend error");
			}
		}
		legendContent += "</div>"
	}
	$('#legend').html(legendContent);
}

const selectZipCode = (e, feature) => {
	const viewCoords = mobile ? [e.latlng["lat"]-0.25, e.latlng["lng"]] : [e.latlng["lat"], e.latlng["lng"]];
	map.setView(viewCoords);
	$(".leaflet-interactive").css('opacity', 0.5);
	$(`#feature-${feature.properties.ZIP}`).css('opacity', 0.85);
	console.log($(`#feature-${feature.properties.ZIP}`).css('opacity'))
	showSidebar(feature);
}

const showSidebar = feature => {
	let sidebarVisible = sidebar.css('display') === 'block';
	let dataAvailable = feature.properties.OVERALL_RANK !== null;
	let featureData =  dataAvailable ? `<h1 class="tooltip-header">${feature.properties.ZIP}</h1><h2 class="tooltip-subhed">Historical Heat and Health Burden</h2><p class="tooltip-text">${feature.properties.HHB_RANK}</p><h2 class="tooltip-subhed">Sensitivity</h2><p class="tooltip-text">${feature.properties.F_SEN_COUNT}</p><h2 class="tooltip-subhed">Sociodemographic</h2><p class="tooltip-text">${feature.properties.SOCIODEM_RANK}</p><h2 class="tooltip-subhed">Natural and Built Environment</h2><p class="tooltip-text">${feature.properties.NBE_RANK}</p>` : 
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

const unSelectZipCode = () => {
	$(".leaflet-interactive").css('opacity', 0.85);
	hideSidebar();
};

const hideSidebar = () => {
	if (mobile) {
		sidebar.hide("slide", { direction: "down" }, 1000);
	} else {
		sidebar.hide("slide", { direction: "right" }, 1000);
	}
};

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
				color: '#a9a9a9',
				fillOpacity: 1
			};
		};
		const geoJsonLayer = L.geoJson(allData, {
			onEachFeature: function (feature, layer) {
				layer.on({
					click: (event) => selectZipCode(event, feature)
				});
			},
			style: style
		}).addTo(map);

		geoJsonLayer.eachLayer(function (layer) {
			layer._path.id = 'feature-' + layer.feature.properties.ZIP;
		});
	});
};

$(document).ready(function () {
	init();
});
