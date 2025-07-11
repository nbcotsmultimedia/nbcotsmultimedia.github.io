let alertNums = [100, 107, 109, 118, 119, 121, 123, 126, 128, 129, 130, 132, 139, 140, 142, 148, 149, 152, 154, 163, 164, 166, 269, 272],
	alertShapes = [],
	shapeOnMap = "",
	idx = 0;
const map = L.map('map', { preferCanvas: true }).setView([30.007141806017398, -99.37252781422389], 9);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
	attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);

function init() {
	loadData();
	setTimeout(() => {
		updateCounter();
		updateMessage();
		addShapeToMap();
	}, 300);
};

const loadData = () => {
	for (let i = 0; i < alertNums.length; i++) {
		fetch(`data/alert_${alertNums[i]}.geojson`).then(response => {
			return response.json()
		}).then(data => {
			alertShapes.push(data);
		});
	};
};

const updateCounter = () => {
	let counterHTML = `${idx + 1} of ${alertNums.length}`;
	$("#counter")
		.html(counterHTML);
};

const updateMessage = () => {
	let alertInfo = alertShapes[idx]["features"][0]["properties"];
	let alertHTML = alertInfo["headline"];


	$("#alert-desc")
		.removeClass("show")
		.addClass("hide")
	setTimeout(() => {
		$("#alert-desc")
			.html(alertHTML);
		$("#alert-desc")
			.removeClass("hide")
			.addClass("show");
	}, 500);
};

const addShapeToMap = () => {
	shapeOnMap != "" && map.removeLayer(shapeOnMap);
	setTimeout(() => {
		shapeOnMap = new L.LayerGroup();
		shapeOnMap.addTo(map);
		const features = alertShapes[idx]["features"];
		for (let i = 0; i < features.length; i++) {
			const feature = features[i];
			const coords = feature["geometry"]["coordinates"][0][0].map(coord => [coord[1], coord[0]])
			L.polygon(coords, {
				color: "#FF4433",
				weight: 1,
				opacity: 1,
				fill: true,
				fillColor: "#FF4433",
				fillOpacity: 0.5
			}).addTo(shapeOnMap);
		}
	}, 300);
};

const decIdx = () => {
	if (idx > 0) {
		idx -= 1;
		updateCounter();
		updateMessage();
		addShapeToMap();
	}
	if (idx === 0) {
		$("#prev-btn")
			.addClass("disabled")
	}
	if (idx === alertShapes.length - 2) {
		$("#next-btn")
			.removeClass("disabled")
	}
};

const incIdx = () => {
	if (idx < alertShapes.length - 1) {
		idx += 1;
		updateCounter();
		updateMessage();
		addShapeToMap();
	};
	if (idx === 1) {
		$("#prev-btn")
			.removeClass("disabled");
	}
	if (idx === alertShapes.length - 1) {
		$("#next-btn")
			.addClass("disabled");
	}
};

$(document).ready(function () {
	init();
});
