let paused = 0,
	firstDay = 1,
	lastDay = 365,
	dateSelected = false;

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

	// map needs to be slightly larger than container to hide edges of smoke filter
	// (specific to the smoke filter on this map, not true for all maps)
	const mapCanvas = d3.select("#map");
	mapCanvas.attr("width", containerWidth + 100);

	// constants for map width/height
	const mapWidth = +mapCanvas.attr("width"),
		mapHeight = +mapCanvas.attr("height");

	// chart should be 50px smaller than container to accomodate controls
	const chartCanvas = d3.select("#bar-chart");
	chartCanvas.attr("width", containerWidth - 50);

	// constants for chart width/height
	const chartCanvasWidth = +chartCanvas.attr("width"),
		chartCanvasHeight = +chartCanvas.attr("height");

	// add margins to chart
	const chartMargin = { top: 40, right: 65, bottom: 20, left: 30 },
		chartWidth = chartCanvasWidth - chartMargin.left - chartMargin.right,
		chartHeight = chartCanvasHeight - chartMargin.top - chartMargin.bottom;

	// smaller canvas for bar chart to create margin effect
	const chart = chartCanvas.append("svg")
		.attr("width", chartWidth + chartMargin.left + chartMargin.right)
		.attr("height", chartHeight + chartMargin.top + chartMargin.bottom)
		.append("g")
		.attr("id", "bar-chart-canvas")
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
	const smokeContainer = mapCanvas.append("svg")
		.attr("id", "smoke");
	const smoke = smokeContainer.append("g");

	// add map contents
	addBaseMap(mapWidth, mapHeight, defs, map, water, labels, roads, fires, smoke);

	createBarChart(chartHeight, chartWidth, chart);

	await waitforme(1000);
	animation(firstDay, firstDay, lastDay);
};

// function to add florida map + other map contents
const addBaseMap = (width, height, defs, map, water, labels, roads, fires, smoke) => {
	d3.json("data/florida_boundary.geojson").then(function (data) {
		// create projection for translating coordinates, according to florida data
		const projection = d3.geoTransverseMercator()
			.rotate([79.5 + 65 / 60, -25.3 - 65 / 60])
			.fitExtent([[20, 20], [width - 20, height - 20]], data)
			.scale(23000);
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
				addSmokeFiler(defs);

				drawSmokeAndFire(smoke, fires, projection);
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

const drawSmokeAndFire = (smoke, fires, projection) => {
	// read fire and smoke data and add to map
	d3.json(`data/2022_fires.geojson`).then(function (data) {
		const firePoints = d3.selectAll(".fire");
		if (firePoints._groups.length > 0) {
			firePoints.remove();
		}

		fires.selectAll("path")
			.data(data.features)
			.join("circle")
			.attr("cx", d => projection(d.geometry.coordinates)[0])
			.attr("cy", d => projection(d.geometry.coordinates)[1])
			.attr("r", 3)
			.attr("class", "fire hide-content")
			.attr("fill", "#fc5200");

		d3.json(`data/2022_smoke.json`).then(function (data) {
			const smokePlumes = d3.selectAll(".smoke-plumes");
			if (smokePlumes._groups.length > 0) {
				smokePlumes.remove();
			}

			smoke.selectAll("path")
				.data(data.features)
				.join("path")
				// color by density
				.attr("fill", d => smokeColor(d.properties.Density))
				.attr("d", d3.geoPath()
					.projection(projection)
				)
				.attr("class", "smoke-plume hide-content");
		});
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
	return parseInt(data.properties.YearDay.toString().slice(-3));
};

const cleanSmokeDate = data => {
	return parseInt(data.properties.Start.toString().split(" ")[0].slice(-3));
};

const cleanTextData = data => {
	return parseInt(data.year_day.slice(-3));
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
	await waitforme(600);
	for (let i = startDay; i <= endDay; i++) {
		if (dateSelected) {
			dateSelected = false;
			break;
		}
		if (i === startDay - 1) {
			await waitforme(1000);
		} else {
			let dayNumber = i;
			showToday(dayNumber);
			hideOtherDays(dayNumber);
			highlightBar(dayNumber);
			await waitforme(550);
			if (paused == 1) await pauser();
			if (i === endDay) {
				i = firstDay - 1;
				pauseAnimation();
				await pauser();
			}
		}
	}
}


const createBarChart = (height, width, svg) => {
	d3.csv("./data/2022_fire_count.csv").then(function (data) {
		let maxVal = 0;
		data.map(row => {
			const val = row.fire_count;
			maxVal = Math.max(maxVal, val);
		});
		const firsts = data.filter(row => row.date.slice(-2) === '01');
		data.map(row => { row.date = d3.timeParse("%Y-%m-%d")(row.date) });
		const tickDates = firsts.map(row => row.date);

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
		
		addYLines(x, y, data.map(d => d.fire_count), width);

		// Bars
		svg.selectAll("mybar")
			.data(data)
			.join("rect")
			.attr("x", d => x(d.date))
			.attr("y", d => y(d.fire_count))
			.attr("width", x.bandwidth())
			.attr("height", d => height - y(d.fire_count))
			.attr("fill", "#ffc1a4")
			.attr("class", "bar");

		svg.selectAll("label")
			.data(data)
			.join("text")
			.text(d => d3.timeFormat("%b %d")(d.date))
			.attr("dy", "-1.5em")
			.attr("dx", x.bandwidth()/2)
			.attr("x", d => x(d.date))
			.attr("y", d => y(d.fire_count))
			.attr("class", "bar-label hide-content")
			.attr("fill", "#fc5200")
			.attr("text-anchor", "middle");

		svg.selectAll("label")
			.data(data)
			.join("text")
			.text(d => d.fire_count + " fires")
			.attr("dy", "-0.5em")
			.attr("dx", x.bandwidth()/2)
			.attr("x", d => x(d.date))
			.attr("y", d => y(d.fire_count))
			.attr("text-anchor", "middle")
			.attr("fill", "#fc5200")
			.attr("class", "bar-label hide-content");

		d3.selectAll(".tick")
			.attr("onclick", "selectMonth(event)");

	})
};

const addYLines = (xScale, yScale, yVals, width) => {
	let maxY = 0;
	yVals.map(yVal => maxY = Math.max(maxY, yVal));
	const maxLine = Math.ceil(maxY/100)*100;
	console.log(maxLine)
	const canvas = d3.select("#bar-chart-canvas");
	j = 0;
	for (let i = 0; i <= maxLine; i += 100) {
		canvas.append("rect")
			.attr("width", width)
			.attr("height", "0.45px")
			.attr("fill", "#cfcfcf")
			.attr("y", yScale(i))
			.attr("x", xScale(0));
		if (i%200 === 0) {
			canvas.append("text")
				.text(i === maxLine ? `${i} fires` : i.toString())
				.attr("class", "y-label")
				.attr("fill", "#a9a9a9")
				.attr("y", yScale(i) + 3)
				.attr("x", width + 8);
		}
	}
}

const selectMonth = e => {
	const selectedDate = e.target.__data__;
	const bars = d3.selectAll(".bar");
	const selectedBar = bars.filter(d => d.date === selectedDate);
	console.log(selectedBar.data()[0])
	const selectedDay = parseInt(selectedBar.data()[0].year_day.toString().slice(-3));
	highlightBar(selectedDay);
	animation(firstDay, selectedDay, lastDay);
	dateSelected = true;
	paused = 0;

	document.getElementById("pl")
		.setAttribute("disabled", "true")

	document.getElementById("pa")
		.removeAttribute("disabled")
};

const highlightBar = dayNumber => {
	const bars = d3.selectAll(".bar");
	const selectedBar = bars.filter(d => parseInt(d.year_day.slice(-3)) === dayNumber);
	const otherBars = bars.filter(d => parseInt(d.year_day.slice(-3)) !== dayNumber);
	selectedBar.attr("fill", "#fc5200");
	otherBars.attr("fill", "#ffc1a4");
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

			d3.selectAll('.bar')
				.style("cursor", "pointer");

			paused = 0;
			resolve("resolved");
		}
		document.getElementById("pl")
			.addEventListener("click", playbuttonclick)
	})
};

const pauseAnimation = () => {
	paused = 1;

	document.getElementById("pa")
		.setAttribute("disabled", "true")

	document.getElementById("pl")
		.removeAttribute("disabled")
}


$(document).ready(function () {
	init();
});