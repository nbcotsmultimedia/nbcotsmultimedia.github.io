const detectSafari = () => {
	let userAgentString = navigator.userAgent;

	// Detect Chrome 
	let chromeAgent =
		userAgentString.indexOf("Chrome") > -1;

	// Detect Safari 
	let safariAgent =
		userAgentString.indexOf("Safari") > -1;

	// Discard Safari since it also matches Chrome 
	if ((chromeAgent) && (safariAgent))
		safariAgent = false;

	return safariAgent;
};

let seasons = [[2022, 2023], [2021, 2022]],
	paused = 0,
	firstDay = (seasons[0][0] * 1000) + 275,
	lastDay = (seasons[0][1] * 1000) + 120,
	stopAnimation = false,
	mobile = window.innerWidth <= 768,
	safari = detectSafari(),
	numFires = 7050 + 13794,
	numSmokePlumes = 493 + 549;

function init() {
	createMap();
};

// create D3 map
async function createMap() {
	// map container and chart conatiner resposive to window size
	const mapContainer = d3.select("#map-container");
	let containerWidth = mapContainer.node().closest('div').offsetWidth;
	const chartContainer = d3.select("#bar-chart-container");
	// NOTE: when setting width/height for svg elements, use attr()
	// when setting width/height for html elements, use style()
	mapContainer.style("width", containerWidth + "px");
	chartContainer.style("width", containerWidth + "px")

	const mapHeight = mobile ? 300 : 500;

	// map needs to be slightly larger than container to hide edges of smoke filter
	// (specific to the smoke filter on this map, not true for all maps)
	const mapCanvas = d3.select("#map");
	mapCanvas.attr("width", containerWidth + 100)
		.attr("height", mapHeight);

	// constants for map width/height
	const mapWidth = +mapCanvas.attr("width");

	// chart should be 50px smaller than container to accomodate controls
	const chartCanvas = d3.select("#bar-chart");
	chartCanvas.attr("width", mobile ? containerWidth - 35 : containerWidth - 50);

	// constants for chart width/height
	const chartCanvasWidth = +chartCanvas.attr("width"),
		chartCanvasHeight = +chartCanvas.attr("height");

	// add margins to chart
	const chartMargin = mobile ? { top: 20, right: 30, bottom: 20, left: 10 }
		: { top: 40, right: 65, bottom: 20, left: 30 },
		chartWidth = chartCanvasWidth - chartMargin.left - chartMargin.right,
		chartHeight = chartCanvasHeight - chartMargin.top - chartMargin.bottom;

	chartCanvas.append("svg")
		.attr("width", chartWidth + chartMargin.left + chartMargin.right)
		.attr("height", chartHeight + chartMargin.top + chartMargin.bottom)
		.append("g")
		.attr("id", `bar-chart-canvas`)
		.attr("class", "bar-chart")
		.attr("chartWidth", chartWidth)
		.attr("chartHeight", chartHeight)
		.attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

	mapCanvas.append("rect")
		.attr("fill", "#d4ebf2")
		.attr("width", mapWidth)
		.attr("height", mapHeight);
	// defs for filters
	const defs = mapCanvas.append("defs");
	// add canvases for different map elements
	const map = mapCanvas.append("g");
	const water = mapCanvas.append("g");
	const labels = mapCanvas.append("g");
	const roads = mapCanvas.append("g");
	const fires = mapCanvas.append("g");
	let smoke,
		smokeContainer;
	if (safari) {
		smokeContainer = mapContainer.append("div")
			.attr("id", "smoke-container")
			.style("width", containerWidth + "px")
			.append("svg")
			.attr("id", "smoke-canvas")
			.attr("width", containerWidth + 100)
			.attr("height", mapHeight);
		smoke = smokeContainer.append("g");
	} else {
		smokeContainer = mapCanvas.append("svg")
			.attr("id", "smoke");
		smoke = smokeContainer.append("g");
	}

	// add map contents
	addBaseMap(mapWidth, mapHeight, defs, map, water, labels, roads, fires, smoke);

	addYearTabs();

	createBarChart(seasons[0]);

	awaitContentLoad();
};

// function to add florida map + other map contents
const addBaseMap = (width, height, defs, map, water, labels, roads, fires, smoke) => {
	d3.json("data/florida_boundary.geojson").then(function (data) {
		const zoom = mobile ? 12000 : 23000;
		const rotation = mobile ? [79.5 + 50 / 60, -25.3 - 65 / 60] : [79.5 + 65 / 60, -25.3 - 65 / 60];
		// create projection for translating coordinates, according to florida data
		const projection = d3.geoTransverseMercator()
			.rotate(rotation)
			.fitExtent([[20, 20], [width - 20, height - 20]], data)
			.scale(zoom);
		// read florida data and add
		map.selectAll("path")
			.data(data.features)
			.join("path")
			.attr("fill", "#fffaf3")
			.attr("d", d3.geoPath()
				.projection(projection)
			);

		d3.json("data/florida_water.json").then(function (data) {
			// add water
			water.selectAll("path")
				.data(data.features)
				.join("path")
				.attr("fill", "#d4ebf2")
				.attr("d", d3.geoPath()
					.projection(projection)
				);

			d3.json("data/florida_state_roads.json").then(function (data) {
				// add roads
				roads.selectAll("path")
					.data(data.features)
					.join("path")
					.attr("fill", "#fffaf3")
					.attr("stroke", "#ffe5c0")
					.attr("stroke-width", 1)
					.attr("d", d3.geoPath()
						.projection(projection)
					);

				// add smoke filter
				if (!safari) {
					addSmokeFiler(defs);
				}

				seasons.map(season => drawSmokeAndFire(fires, smoke, projection, season));
			});
		});
	});
};

// returns smoke color for given density
const smokeColor = density => {
	let color = "";
	switch (density) {
		case "Light":
			color = "#9a9a9a";
			break;
		case "Medium":
			color = "#4f4f4f";
			break;
		case "Heavy":
			color = "#292929";
			break;
		default:
			break;
	}
	return color;
}

// function to add smoke filter
const addSmokeFiler = defs => {
	// add filter element to defs
	const smokeFilter = defs.append("filter")
		.attr("id", "smoke-filter");
	// add turbulence to filter
	const turbulence = smokeFilter.append("feTurbulence")
		.attr("id", "turbulence")
		.attr("type", "fractalNoise")
		.attr("baseFrequency", 0.03)
		.attr("numOctaves", 20);
	// add displacement map to filter
	smokeFilter.append("feDisplacementMap")
		.attr("in", "SourceGraphic")
		.attr("scale", 30);

	// variables/ function for turbulence movement
	let frames = 1;
	let rad = Math.PI / 180;
	let bfx, bfy;

	function freqAnimation() {
		frames += .2

		bfx = 0.03;
		bfy = 0.03;

		bfx += 0.005 * Math.cos(frames * rad);
		bfy += 0.005 * Math.sin(frames * rad);

		bf = bfx.toString() + " " + bfy.toString();
		turbulence.attr("baseFrequency", bf);

		window.requestAnimationFrame(freqAnimation);
	}

	window.requestAnimationFrame(freqAnimation);
};

const drawSmokeAndFire = (fires, smoke, projection, years) => {
	drawFire(fires, projection, years);
	drawSmoke(smoke, projection, years);
}

const drawFire = (fires, projection, years) => {
	// read fire and smoke data and add to map
	d3.json(`data/1001${years[0]}_0430${years[1]}_fires.geojson`).then(function (data) {

		fires.selectAll("path")
			.data(data.features)
			.join("circle")
			.attr("cx", d => projection(d.geometry.coordinates)[0])
			.attr("cy", d => projection(d.geometry.coordinates)[1])
			.attr("r", 3)
			.attr("class", "fire hide-content")
			.attr("fill", "#fc5200");
	});
};

const drawSmoke = (smoke, projection, years) => {
	d3.json(`data/1001${years[0]}_0430${years[1]}_smoke.json`).then(function (data) {

		smoke.selectAll("g")
			.data(data.features)
			.join("path")
			// color by density
			.attr("fill", d => smokeColor(d.properties.Density))
			.attr("d", d3.geoPath()
				.projection(projection)
			)
			.attr("class", "smoke-plume hide-content");
	});
};

const showToday = dayNumber => {
	showFire(dayNumber);
	showSmoke(dayNumber);
	showText(dayNumber);
};

const hideOtherDays = dayNumber => {
	hideFire(dayNumber);
	hideSmoke(dayNumber);
	hideText(dayNumber);
}

const cleanFireDate = data => {
	return parseInt(data.properties.YearDay.toString());
};

const cleanSmokeDate = data => {
	return parseInt(data.properties.Start.toString().split(" ")[0]);
};

const cleanTextData = data => { 
	return parseInt(data.year_day);
}

const showFire = dayNumber => {
	toggleShapeVisibility('fire', dayNumber, cleanFireDate, "equals", "show-content");
};

const showSmoke = dayNumber => {
	toggleShapeVisibility('smoke-plume', dayNumber, cleanSmokeDate, "equals", "show-content");
};

const showText = dayNumber => {
	toggleShapeVisibility('bar-label', dayNumber, cleanTextData, "equals", "show-text");
};

const hideFire = dayNumber => {
	toggleShapeVisibility('fire', dayNumber, cleanFireDate, "notEquals", "hide-content");
};

const hideSmoke = dayNumber => {
	toggleShapeVisibility('smoke-plume', dayNumber, cleanSmokeDate, "notEquals", "hide-content");
};

const hideText = dayNumber => {
	toggleShapeVisibility('bar-label', dayNumber, cleanTextData, "notEquals", "hide-text");
};

const filterShapes = (shapeClass, dayNumber, dateFunction, operator) => {
	const shapes = d3.selectAll(`.${shapeClass}`);
	const selectedShapes = operator === "equals" ? shapes.filter(shape => dateFunction(shape) === dayNumber)
		: shapes.filter(shape => dateFunction(shape) !== dayNumber);
	return selectedShapes;
}

const toggleShapeVisibility = (shapeClass, dayNumber, dateFunction, operator, classToAdd) => {
	const selectedShapes = filterShapes(shapeClass, dayNumber, dateFunction, operator);
	selectedShapes.attr("class", `${shapeClass} ${classToAdd}`);
};

function waitforme(ms) {
	return new Promise(resolve => {
		setTimeout(() => { resolve('') }, ms);
	})
}

const animation = async (firstDay, startDay, endDay) => {
	const dayDuration = safari ? 1000 : 550;
	await waitforme(600);
	if (safari) {
		await waitforme(600);
	}
	for (let i = startDay; i <= endDay; i++) {
		if (stopAnimation) {
			stopAnimation = false;
			break;
		}
		if (i === startDay - 1) {
			await waitforme(1000);
		} else {
			let dayNumber = i;
			showToday(dayNumber);
			hideOtherDays(dayNumber);
			highlightBar(dayNumber);
			await waitforme(dayDuration);
			if (paused == 1) await pauser();
			if (i === endDay) {
				i = firstDay - 1;
				pauseAnimation();
				await pauser();
			}
		}
		if (i === (seasons[0][0] * 1000) + 365) {
			i = seasons[0][1] * 1000;
		}
	}
	hideOtherDays(10000);
};

const addYearTabs = () => {
	const buttonContainer = d3.select('#year-button-container');
	let innerHtml = '';
	for (let i = 0; i < seasons.length; i++) {
		const thisSeason = seasons[i];
		let classes = "year-button";
		if (i === 0) {
			classes += " selected-year";
		}
		const button = `<button id="season-${thisSeason[0]}" class="${classes}" onclick="changeYear(event)">${thisSeason[0]}-${thisSeason[1]}</button>`
		innerHtml += button;
	}
	buttonContainer.html(innerHtml);
};

const changeYear = e => {
	selectTab(e);
	const yearRange = e.target.textContent;
	const years = yearRange.split("-");
	stopAnimation = true;
	firstDay = (years[0] * 1000) + 275;
	lastDay = (years[1] * 1000) + 120;
	switchChart(years);
	hideOtherDays(1000000);
	if (paused === 1) {
		document.getElementById('pl').click();
	}
	waitforme(6000);
	animation(firstDay, firstDay, lastDay);
};

const selectTab = e => {
	const selectedTabId = e.target.id;
	const tabs = d3.selectAll('.year-button').nodes();
	tabs.map(tab => updateSelectedStatus(tab, selectedTabId));
}

const updateSelectedStatus = (tab, selectedTabId) => {
	if (tab.id === selectedTabId) {
		tab.classList.add("selected-year");
	} else {
		tab.classList.remove("selected-year");
	}
};

const createBarChart = years => {
	let canvas = d3.select('#bar-chart-canvas'),
		height = +canvas.attr("chartHeight"),
		width = +canvas.attr("chartWidth"),
		svg = canvas.append("g")
			.attr("id", "disposable-chart")
			.attr("class", "hide-content");
	d3.csv(`./data/1001${years[0]}_0430${years[1]}_fire_count.csv`).then(function (data) {
		let maxVal = 0;
		data.map(row => {
			const val = row.fire_count;
			maxVal = Math.max(maxVal, val);
		});
		const firsts = data.filter(row => row.date.slice(-2) === '01');
		let mobileFirsts = firsts.filter((element, index) => { return index % 2 === 0; });
		data.map(row => { row.date = d3.timeParse("%Y-%m-%d")(row.date) });
		const tickDates = mobile ? mobileFirsts.map(row => row.date) : firsts.map(row => row.date);

		// X axis
		const x = d3.scaleBand()
			.range([0, width])
			.domain(data.map(d => d.date))
			.padding(0.05);
		svg.append("g")
			.attr("transform", `translate(0, ${height})`)
			.call(d3.axisBottom(x).tickValues(tickDates).tickFormat(d3.timeFormat("%b")).tickSize(0));
		// Add Y axis
		const y = d3.scaleLinear()
			.domain([0, maxVal])
			.range([height, 0]);

		addYLines(x, y, data.map(d => d.fire_count), width, svg);

		// Bars
		svg.selectAll("mybar")
			.data(data)
			.join("rect")
			.attr("x", d => x(d.date))
			.attr("y", d => y(d.fire_count))
			.attr("width", x.bandwidth())
			.attr("height", d => height - y(d.fire_count))
			.attr("fill", "#ffb898")
			.attr("class", "bar");

		svg.selectAll("label")
			.data(data)
			.join("text")
			.text(d => d3.timeFormat("%b %d")(d.date))
			.attr("dy", "-1.5em")
			.attr("dx", x.bandwidth() / 2)
			.attr("x", d => x(d.date))
			.attr("y", d => y(d.fire_count))
			.attr("class", "bar-label hide-content")
			.attr("fill", "#fc5200")
			.attr("text-anchor", d => textAnchor(d));

		svg.selectAll("label")
			.data(data)
			.join("text")
			.text(d => d.fire_count === 1 ? d.fire_count + " fire" : d.fire_count + " fires")
			.attr("dy", "-0.5em")
			.attr("dx", x.bandwidth() / 2)
			.attr("x", d => x(d.date))
			.attr("y", d => y(d.fire_count))
			.attr("text-anchor", d => textAnchor(d))
			.attr("fill", "#fc5200")
			.attr("class", "bar-label hide-content");

		d3.selectAll(".tick")
			.attr("onclick", "selectMonth(event)");
		
		svg.attr("class", "show-content-full");
	})
};

const switchChart = years => {
	const chart = d3.select('#disposable-chart');
	chart.attr("class", "hide-content");
	chart.remove();
	createBarChart(years);
};

const updateSelectedChart = (chart, years) => {
	const chartId = chart.id;
	const selectedChartId = `bar-chart-canvas-${years[0]}`;
	if (chartId === selectedChartId) {
		chart.classList.add("show-content-full");
		chart.classList.remove("hide-content");
	} else {
		chart.classList.add("hide-content");
		chart.classList.remove("show-content-full");
	}
};

const textAnchor = d => {
	const yearDay = cleanTextData(d);
	if (yearDay < ((seasons[0][0] * 1000) + 280)) {
		return "start";
	} else if (yearDay > ((seasons[0][1] * 1000) + 115)) {
		return "end";
	} else {
		return "middle";
	}
};

const addYLines = (xScale, yScale, yVals, width, canvas) => {
	let maxY = 0;
	yVals.map(yVal => maxY = Math.max(maxY, yVal));
	const maxLine = Math.ceil(maxY / 20) * 20;
	j = 0;
	for (let i = 0; i <= maxLine; i += 20) {
		canvas.append("rect")
			.attr("width", width)
			.attr("height", "0.45px")
			.attr("fill", "#767676")
			.attr("y", yScale(i))
			.attr("x", xScale(0));
		if (i % 40 === 0) {
			canvas.append("text")
				.text(i === maxLine && !mobile ? `${i} fires` : i.toString())
				.attr("class", "y-label")
				.attr("fill", "#767676")
				.attr("y", yScale(i) + 3)
				.attr("x", width + 8);
		}
	}
};

const selectMonth = e => {
	const selectedDate = e.currentTarget.__data__;
	const bars = d3.selectAll(".bar");
	const selectedBar = bars.filter(d => d.date === selectedDate);
	const selectedDay = parseInt(selectedBar.data()[0].year_day.toString());
	highlightBar(selectedDay);
	animation(firstDay, selectedDay, lastDay);
	stopAnimation = true;
	paused = 0;

	document.getElementById("pl")
		.setAttribute("disabled", "true");

	document.getElementById("pa")
		.removeAttribute("disabled");
};

const highlightBar = dayNumber => {
	const bars = d3.selectAll(".bar");
	const selectedBar = bars.filter(d => parseInt(d.year_day) === dayNumber);
	const otherBars = bars.filter(d => parseInt(d.year_day) !== dayNumber);
	selectedBar.attr("fill", "#fc5200");
	otherBars.attr("fill", "#ffb898");
	if (!mobile) {
		selectedBar.attr("stroke", "#0C0C0C")
			.attr("stroke-width", "1px");
		otherBars.attr("stroke", "none");
	}
};

const pauser = () => {
	return new Promise(resolve => {
		let playbuttonclick = function () {
			document.getElementById("pa")
				.removeAttribute("disabled")

			document.getElementById("pl")
				.setAttribute("disabled", "true")

			document.getElementById("pl")
				.removeEventListener("click",
					playbuttonclick);

			d3.selectAll(".tick")
				.style("cursor", "pointer")
				.attr("onclick", "selectMonth(event)");

			paused = 0;
			resolve("resolved");
		}
		document.getElementById("pl")
			.addEventListener("click", playbuttonclick);
			
	})
};

const pauseAnimation = () => {
	paused = 1;

	document.getElementById("pa")
		.setAttribute("disabled", "true");

	document.getElementById("pl")
		.removeAttribute("disabled");

	d3.selectAll(".tick")
		.attr("onclick", null)
		.style("cursor", "default");
};

const awaitContentLoad = async () => {
	while (true) {
		let numLoadedSmokePlumes = d3.selectAll(".smoke-plume").size();
		let numLoadedFires = d3.selectAll(".fire").size();
		await waitforme(1000);
		if (numLoadedFires === numFires && numLoadedSmokePlumes === numSmokePlumes) {
			break;
		}
	}
	animation(firstDay, firstDay, lastDay);
};


$(document).ready(function () {
	init();
});