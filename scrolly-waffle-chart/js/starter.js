let mobile = window.innerWidth <= 768,
	squareFactor = 100,
	svg = d3.select("#crime-reports-grid"),
	lastSquare,
	numSquares,
	squareWidth,
	squareMargin,
	captions,
	slidePrimaryCats,
	slideSecondaryCats,
	numSlides,
	colors;

const loadColors = () => {
	d3.csv('./data/color-key.csv').then(data => {
		colors = data;
	});
};

const rowsAndCols = numSquares => {
	let cols = Math.ceil(Math.sqrt(numSquares));
	let rows = Math.ceil(numSquares / cols);
	return [rows, cols];
};

const setSvgWidth = () => {
	const svgContainer = svg.node().closest('div')
	const svgWidth = (svgContainer.offsetWidth)
	svg.attr('width', svgWidth);
};

const addSquare = (row, squareHeight, squareMargin, xPos, yPos, attrs, fillColor, className) => {
	const newSquare = row.append("rect");
	newSquare.attr("fill", fillColor)
		.attr("class", className)
		.attr("width", squareWidth)
		.attr("height", squareHeight)
		.attr("margin-bottom", squareMargin)
		.attr("x", xPos)
		.attr("y", yPos)
		.data(attrs);
};

const addRows = numRows => {
	for (let i = 0; i < numRows; i++) {
		svg.append("g")
			.attr("id", `row-${i}`);
	}
};

const setSvgHeight = (numCols, numRows) => {
	// resize svg based on square size and number of rows
	const containerWidth = svg.node().getBoundingClientRect()["width"];
	const rowHeight = containerWidth / numCols;
	squareWidth = rowHeight * 0.8;
	squareMargin = rowHeight * 0.2;
	const svgHeight = rowHeight * numRows;
	svg.attr('height', svgHeight);
};

const attrToName = attr => {
	let name = attr.replace(/-/g, " ");
	name = name.charAt(0).toUpperCase() + name.slice(1);
	return name;
}

const nameToAttr = name => {
	const attr = name.toLowerCase().replace(/ /g, "-");
	return attr
};

const getDataAttributes = row => {
	const attrs = {}
	const cols = Object.keys(row);
	for (let i = 0; i < cols.length; i++) {
		const col = cols[i];
		if (row[col] !== "") {
			attrs[col] = nameToAttr(row[col])
		}
	}
	return [attrs];
};

const addSquares = (data, numCols) => {
	let lastSquareHeight = 1;
	let currentRow = 0;
	let squaresInRow = 0;
	// add a square to each row
	for (let i = 0; i < data.length; i++) {
		const dataRow = data[i];
		const dataCount = dataRow["count"] / squareFactor;
		const lastRemainder = 1 - lastSquareHeight;
		const numSquares = Math.ceil(dataCount - lastRemainder) + Math.ceil((dataCount + lastRemainder) % 1);
		let remainder = dataCount % 1;
		for (let j = 0; j < numSquares; j++) {
			const rowSvg = d3.select(`#row-${currentRow}`);
			const yPos = currentRow * (squareWidth + squareMargin);
			const xPos = squaresInRow * (squareWidth + squareMargin);
			const attributes = getDataAttributes(dataRow);
			if (j === 0 && lastSquareHeight < 1) {
				addSquare(rowSvg, squareWidth * (1 - lastSquareHeight) + 0.75, squareMargin, xPos, yPos + (squareWidth * lastSquareHeight) - 0.75, attributes, '#1a72ee', 'square');
				remainder = (remainder + lastSquareHeight) % 1;
				squaresInRow++;
			} else if (j === numSquares - 1 && remainder !== 0) {
				addSquare(rowSvg, squareWidth * remainder, squareMargin, xPos, yPos, attributes, '#1a72ee', 'square');
				lastSquareHeight = remainder;
			} else {
				addSquare(rowSvg, squareWidth, squareMargin, xPos, yPos, attributes, '#1a72ee', 'square');
				squaresInRow++;
				if (j === numSquares - 1) {
					lastSquareHeight = 1;
				}
			}
			if (squaresInRow === numCols) {
				squaresInRow = 0;
				currentRow++;
			}
		}
	}

};

const manageLegend = slideNum => {
	const legendSvg = d3.select(`#legend`);
	const squareSize = squareWidth + squareMargin;
	if (slideNum === 0) {
		addSquare(legendSvg, squareWidth, squareMargin, 0, 0, {}, '#1a72ee', 'legend-square');
		legendSvg.attr("height", mobile ? 35 : 75)
		legendSvg.append("text")
			.text("= 100 reports")
			.style("font-size", "16px")
			.style("fill", "#ffffff")
			.attr("x", squareSize)
			.attr("y", squareSize/2);
	} else if (slideNum === numSlides - 1) {
		const slideCats = slidePrimaryCats[slideNum];
		const svgWidth = parseInt(legendSvg.style("width"));
		const legendItemWidth = mobile ? squareSize + 150 : squareSize + 200;
		const itemsPerRow = mobile ? Math.floor(svgWidth / legendItemWidth) : 1;
		const numCats = slideCats.length;
		const legendRows = Math.ceil(numCats / itemsPerRow);
		legendSvg.attr("height", legendRows*squareSize+25);
		let legendSquares = 0;
		for (let i = 0; i < legendRows; i++) {
			const row = legendSvg.append("g")
				.attr("id", `legend-row-${i}`);
			for (let j = 0; j < itemsPerRow; j++) {
				if (legendSquares < numCats) {
					const catName = slideCats[legendSquares];
					let catLabel = attrToName(catName);
					const catColor = colors.filter(row => row["category"] === catName)[0]["color"];
					addSquare(row, squareWidth, squareMargin, legendItemWidth * j, squareSize * i, [{"label": catName}], catColor, 'legend-square');
					legendSvg.append("text")
						.text(catLabel)
						.style("font-size", "16px")
						.style("fill", "#ffffff")
						.attr("x", legendItemWidth * j + squareSize)
						.attr("y", squareSize * i + squareSize/1.5);
					legendSquares++
				} else {
					break;
				}
			}
		}
	} else {
		legendSvg.html("");
	}
};

const squareHasAttr = (data, val) => {
	let result = false;
	if (data) {
		if (Object.values(data).includes(val)) {
			result = true;
		}
	}
	return result;
};

const changeSquareColors = slideNum => {
	const primaries = slidePrimaryCats[slideNum];
	const secondaries = slideSecondaryCats[slideNum];
	if (primaries.length > 0) {
		for (let i = 0; i < primaries.length; i++) {
			const valToChange = primaries[i];
			const color = colors.filter(row => row["category"] === valToChange)[0]["color"]
			d3.selectAll(`.square`)
				.filter(d => squareHasAttr(d, valToChange))
				.style("opacity", 1)
				.attr("fill", color);
		}
	}
	if (secondaries.length > 0) {
		for (let i = 0; i < secondaries.length; i++) {
			const valToChange = secondaries[i];
			d3.selectAll(`.square`)
				.filter(d => squareHasAttr(d, valToChange))
				.style("opacity", 0.5);
		}
	}
};

const showTooltip = d => {
	const cats = slidePrimaryCats[numSlides-1];
	const cat = lowestLevelCat(d, cats)[1];
	const catName = attrToName(cat);
	d3.selectAll('#caption-7')
		.text(`${catName}: ${d["count"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
};

const lowestLevelCat = (d, cats) => {
	if (d) {
		for (let i = cats.length-1; i >= 0; i--) {
			const val = cats[i];
			if (Object.values(d).includes(val)) {
				const cat = Object.keys(d).find(key => d[key] === val);
				return [cat, val];
			}
		}
	}
};

const matchCat = (data, col, val) => {
	return data && data.hasOwnProperty(col) && data[col] === val;
};

const matchLegend = (data, val) => {
	console.log(data)
	return data && data["label"] === val;
};

const highlightSquare = lowLevelVal => {
	return colors.filter(row => row["category"] === lowLevelVal)[0]["color"];
};

const highlightLegend = (d, lowLevelVal) => {
	const squaresToHighlight = d3.selectAll(`.legend-square`).filter(d => matchLegend(d, lowLevelVal));
	const otherSquares = d3.selectAll(`.legend-square`).filter(d => !matchLegend(d, lowLevelVal));
	squaresToHighlight.attr("fill", d => highlightSquare(lowLevelVal))
		.style("opacity", 1);
	otherSquares.style("opacity", 0.5);
};

const highlightData = (d, lowLevelCat, lowLevelVal) => {
	const squaresToHighlight = d3.selectAll(`.square`).filter(d => matchCat(d, lowLevelCat, lowLevelVal));
	const otherSquares = d3.selectAll(`.square`).filter(d => !matchCat(d, lowLevelCat, lowLevelVal));
	squaresToHighlight.attr("fill", d => highlightSquare(lowLevelVal))
		.style("opacity", 1);
	otherSquares.style("opacity", 0.5);
};

const highlightSquares = d => {
	const cats = slidePrimaryCats[numSlides-1];
	const catInfo = lowestLevelCat(d, cats);
	const lowLevelCat = catInfo[0];
	const lowLevelVal = catInfo[1];
	highlightLegend(d, lowLevelVal);
	highlightData(d, lowLevelCat, lowLevelVal);
};

const highlightAll = () => {
	d3.selectAll(`.square`)
		.style("opacity", 1);
	d3.selectAll(`.legend-square`)
		.style("opacity", 1);
};

const interact = (e, d) => {
	highlightSquares(d);
	showTooltip(d);
};

const stopInteract = (e,d) => {
	highlightAll();
	d3.selectAll('#caption-7')
		.text('');
}

const addInteractivity = () => {
	d3.selectAll(`.square`)
		.on("mouseover", (e, d) => interact(e, d));
	svg.on("mouseleave", stopInteract);
};

const removeInteractivity = () => {
	d3.selectAll(`.square`)
		.on("mouseover", () => {});
	svg.on("mouseleave", () => {});
};

const changeSlide = slideNum => {
	changeSquareColors(slideNum);
	manageLegend(slideNum);
	if (slideNum === numSlides-1) {
		addInteractivity();
	} else {
		removeInteractivity();
	}
	setTimeout(function () { xtalk.signalIframe(); }, 800);
};

const createGrid = () => {
	d3.csv('./data/crime-results.csv').then(data => {
		// get total number of crime reports
		const totalReports = data.map(row => parseInt(row["count"])).reduce((sum, newNum) => sum + newNum, 0);
		// get number of squares for grid
		numSquares = Math.floor(totalReports / squareFactor);
		lastSquare = (totalReports % squareFactor) / squareFactor;
		// get number of rows and columns for grid
		const numRowsAndCols = rowsAndCols(numSquares);
		const numRows = numRowsAndCols[0];
		const numCols = numRowsAndCols[1];
		// set SVG dimensions according to number rows/cols
		setSvgWidth();
		setSvgHeight(numCols, numRows);
		// add grid content for initial slide
		addRows(numRows);
		addSquares(data, numRows, numCols);
	});
};

const addSlides = () => {
	d3.csv('./data/slide-info.csv').then(data => {
		captions = data.map(row => row["caption"]);
		slidePrimaryCats = data.map(row => row["primary"].split(", ").filter(cat => cat !== ""));
		slideSecondaryCats = data.map(row => row["secondary"].split(", ").filter(cat => cat !== ""));
		numSlides = data.length;

		const container = d3.select(`#slide-container`);
		for (let i = 0; i < numSlides; i++) {
			container.append("div")
				.attr("id", `slide-${i}`)
				.attr("class", "slide")
				.append("p")
				.html(captions[i])
				.attr("class", "caption")
				.attr("id", `caption-${i}`);
		}
	});

};

const scrollytelling = () => {
	// add invisible divs for scrollytelling
	addSlides();

	setTimeout(() => { // set up scrollama scroller
		const scroller = scrollama();
		scroller.setup({
			step: ".slide",
			offset: 0.5
		});

		// event handler for scrolling through a step (text section)
		const handleStepEnter = e => {
			const slideNum = e.index;
			changeSlide(slideNum);
		};
		scroller.onStepEnter(e => handleStepEnter(e));
	}, 200);
};

function init() {
	loadColors();
	setTimeout(() => { 
		createGrid();
		scrollytelling();
		setTimeout(function () { xtalk.signalIframe(); }, 1000);
	}, 200);
};

$(document).ready(function () {
	init();
});