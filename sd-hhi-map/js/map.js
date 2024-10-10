let allData,
	cities,
	geoJsonLayer,
	cityLayer,
	mobile = window.innerWidth < 450,
	viewFactor = 0.25,
	sidebar = $('#sidebar'),
	sidebarContent = $('#sidebar-content'),
	sidebarOpen = false;
// set map view to SD county
const map = L.map('map').setView([32.85, -116.8460104], 9);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
	maxZoom:12,
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);
// legend values from CDC
const colors = {
	"Low": [0.25, '#F2C85B'],
	"Low-Moderate": [0.5, '#FBA465'],
	"Moderate-High": [0.75, '#F86E51'],
	"High": [0.9, '#EE3E38'],
	"High-Top10%": [1, '#D1193E'],
};

// find zipcode when entered into search bar, or return zip code not found message
const search = e => {
	const val = e.target.value;
	const response = $("#response");
	let newSidebarTop = "150px";
	try {
		const feature = allData["features"].filter(feature => feature.properties.ZCTA5CE10 == parseInt(val))[0];
		selectZipCode(e, feature);
		response.html("");
		newSidebarTop = mobile ? "500px" : "150px";
	} catch(e) {
		console.log(e);
		response.html("We couldn't find that zip code. Please enter a valid San Diego County zip code.");
		newSidebarTop = mobile ? "560px" : "190px";
	}
	// need to adjust sidebar margin to size of header content
	$('#sidebar').css("top", newSidebarTop);
	xtalk.signalIframe();
};

// show greater or fewer city labels when zooming in/out
map.on('zoom', () => {
	zoomLevel = map.getZoom();
	console.log(zoomLevel);
	let includeCities;
	cityLayer.clearLayers();
	if (zoomLevel <= 9) {
		viewFactor = 0.25
		includeCities = cities.filter(d => d.properties.POP_CLASS >= 8);
	} else if (zoomLevel == 10) {
		viewFactor = 0.10;
		includeCities = cities.filter(d => d.properties.POP_CLASS >= 7);
	} else {
		viewFactor = 0.05;
		includeCities = cities;
	}
	cityLayer.addData(includeCities);
});

// set all zip codes to full opacity, so no one zip code looks selected
const setAllZipCodeOpacity = () => {
	$(".leaflet-interactive").css('opacity', 0.8);
};

// hide sidebar
const hideSidebar = () => {
	sidebarOpen = false;
	// slide sidebar out of view
	if (mobile) {
		sidebar.hide("slide", { direction: "down" }, 1000);
	} else {
		sidebar.hide("slide", { direction: "right" }, 1000);
	}
};

// un-select the selected zip code
const unSelectZipCode = () => {
	setAllZipCodeOpacity();
	hideSidebar();
};

// when no zipcode is selected, show zip codes in a tooltip when mouse hovers over zip code area
const showZipCodeOnMouseover = (layer, feature) => {
	if (!sidebarOpen) {
		// this seems to be the least glitchy way to deal with the tooltips
		layer.bindTooltip(feature.properties.ZCTA5CE10.toString(), { direction: "center", closeButton: false });
	} 
};

// set sidebar content to given zip code's info, then show sidebar
const showSidebar = feature => {
	// not all zipcodes have data
	const dataAvailable = feature.properties.OVERALL_RANK !== null;
	const noDataMessage = `<h1 class="tooltip-header">${feature.properties.ZCTA5CE10}</h1><p class="tooltip-text">Data not available for this zip code.</p>`;
	const dataInfo = `<h1 class="tooltip-header">${feature.properties.ZCTA5CE10}</h1>`+
	`<div class="sidebar-item"><i class="fa-solid fa-truck-medical"></i><div><h2 class="tooltip-subhed">Historical Heat and Health Burden</h2><p class="tooltip-text">${feature.properties.HHB_RANK}</p></div></div>`+
	`<div class="sidebar-item"><i class="fa-solid fa-heart-pulse bigger"></i><div><h2 class="tooltip-subhed">Sensitivity</h2><p class="tooltip-text">${feature.properties.F_SEN_COUNT}</p></div></div>`+
	`<div class="sidebar-item"><i class="fa-solid fa-person-cane biggest"></i><div><h2 class="tooltip-subhed">Sociodemographic</h2><p class="tooltip-text">${feature.properties.SOCIODEM_RANK}</p></div></div>`+
	`<div class="sidebar-item"><i class="fa-solid fa-tree-city"></i><div><h2 class="tooltip-subhed">Natural and Built Environment</h2><p class="tooltip-text">${feature.properties.NBE_RANK}</p></div></div>`;
	const zipCodeInfo = dataAvailable ? dataInfo : noDataMessage;

	if (sidebarOpen) {
		// if sidebar is already open, fade old info out and new info in
		sidebarContent.removeClass('show-content');
		sidebarContent.addClass('hide-content');
		setTimeout(() => {
			sidebarContent.html(zipCodeInfo);
			sidebarContent.removeClass('hide-content');
			sidebarContent.addClass('show-content');
		}, 250);
	} else {
		sidebarOpen = true;
		sidebarContent.html(zipCodeInfo);
		// if sidebar is not open, slide into view
		if (mobile) {
			sidebar.show("slide", { direction: "down" }, 1000);
		} else {
			sidebar.show("slide", { direction: "right" }, 1000);
		}
	}
};

// center map on given zip code 
const panMapToZipCode = feature => {
	let viewCoords = Object.values(geoJsonLayer._layers).filter(layer => layer.feature === feature)[0].getBounds().getCenter();
	viewCoords = mobile ? [viewCoords["lat"] - viewFactor, viewCoords["lng"]] : [viewCoords["lat"], viewCoords["lng"] + viewFactor];
	map.setView(viewCoords);
};

// adjust opacities of zip code features to make one zip code looked "selected"
const setZipCodeOpacity = feature => {
	$(".leaflet-interactive").css('opacity', 0.35);
	$(`.feature-${feature.properties.ZCTA5CE10}`).css('opacity', 0.8);
};

// select zip code and show zip code info in sidebar
const selectZipCode = (e, feature) => {
	// when one zip code is selected, don't want to show tooltips of other zip codes on hover
	Object.values(geoJsonLayer._layers).map(layer => layer.unbindTooltip());
	setZipCodeOpacity(feature);
	panMapToZipCode(feature);
	showSidebar(feature);

};

// style geojson features for map
const style = feature => {
	return {
		fillColor: getColor(feature.properties.OVERALL_RANK),
		weight: 0.5,
		opacity: 1,
		color: '#444444',
		fillOpacity: 1,
		className: 'feature-' + feature.properties.ZCTA5CE10
	};
};

// color zip codes based on overall HHI rank
const getColor = overallRank => {
	const legendLabels = Object.keys(colors);
	for (let i = 0; i < legendLabels.length; i++) {
		const thisColor = colors[legendLabels[i]];
		if (overallRank === thisColor[0] | overallRank < thisColor[0]) {
			return thisColor[1];
		}
	}
};

// read data and add to map
function loadData() {
	// read zip code geojson data and add to map
	d3.json("./data/sd-zcta.geojson").then(data => {
		allData = data;
		// leaflet layer for zip codes
		geoJsonLayer = L.geoJson(allData, {
			onEachFeature: function (feature, layer) {
				layer.on({
					click: (event) => selectZipCode(event, feature),
					mouseover: () => showZipCodeOnMouseover(layer, feature)
				});
				layer.bindTooltip(feature.properties.ZCTA5CE10.toString(), { direction: "center", closeButton: false });
			},
			style: style
		}).addTo(map);
	});

	// read city labels data
	d3.json("./data/sd-major-cities.geojson").then(data => {
		cityLayer = L.geoJSON(null, {
			pointToLayer: function (feature, latlng) {
				const label = String(feature.properties.NAME); 
				// size city labels differently based on their population
				const popClass = feature.properties.POP_CLASS;
				const className = popClass >= 10 ? "major-city" : popClass > 7 ? "big-city" : "city"; 
				return new L.CircleMarker(latlng, {
					radius: 1,
				}).bindTooltip(label, { permanent: true, direction: "center", className: "my-labels "+className}).openTooltip();
			},
		});
		// at top zoom level, only want to show major cities
		cities = data['features'];
		const topCities = cities.filter(d => d.properties.POP_CLASS >= 8);
		cityLayer.addData(topCities);
		map.addLayer(cityLayer);
	});
};

// create legend based on legend values
const fillLegend = () => {
	let legendContent = '';
	const legendLabels = Object.keys(colors);
	const numRows = mobile ? 2 : 1;
	const numPerRow = Math.max(legendLabels.length / numRows);
	let currentIdx = 0;
	for (let i = 0; i < numRows; i++) {
		legendContent += `<div style="margin-top:${5 * i}px; display:flex;">`
		for (let j = 0; j < numPerRow; j++) {
			// need try catch in case there isn't an equal number of elements in each row
			try {
				const label = legendLabels[currentIdx];
				legendContent += `<b style="border-right:18px solid ${colors[label][1]};opacity:0.8;height:18px;margin-right:3px;margin-top:1px;"></b><p style="margin-right: 10px;">${label}</p>`;
				currentIdx++;
			} catch(e) {
				console.log(e);
			}
		}
		legendContent += "</div>"
	}
	$('#legend').html(legendContent);
};

// init function
function init() {
	fillLegend();
	loadData();
	xtalk.signalIframe();
};

$(document).ready(function () {
	init();
});
