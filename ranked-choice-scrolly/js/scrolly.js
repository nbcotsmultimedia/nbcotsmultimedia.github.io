let outerContainer,
	mobile = window.innerWidth <= 600, // is graphic displayed on a mobile device?
	chartWidth = 600,
	svg,
	margin,
	width,
	height; // chart should be full screen width on mobile, half screen (not over 600px) on desktop


// colors and labels for "your candidate" circles in different slides as 
const yourCandidateColors = ["", "", "#fe9643", "#fe9643", "#fe9643", "#e77688", "#e77688", "#e77688", "#95b85a", "#95b85a", "#95b85a", "#95b85a"];
const yourCandidateLabel = ["", "", "first choice", "first choice", "first choice", "second choice", "second choice", "second choice", "third choice", "third choice", "third choice", "third choice", "third choice"];

// votes for each candidate on each slide
const rounds = [
	"",
	"",
	{
		"Your candidate": 2,
		"Candidate 1": 44,
		"Candidate 2": 22,
		"Candidate 3": 10,
		"Candidate 4": 7,
		"Candidate 5": 6,
		"Candidate 6": 5,
		"Candidate 7": 3,
		"Candidate 8": 1,
	},
	"",
	{
		"Your candidate": 2,
		"Candidate 1": 44,
		"Candidate 2": 22,
		"Candidate 3": 10,
		"Candidate 4": 7,
		"Candidate 5": 6,
		"Candidate 6": 5,
		"Candidate 7": 4,
		"Invisible votes": 1
		// need to add "invisible votes" that don't display in the chart, since there are parent circles for each candidate, but some candidates are eliminated
	},
	{
		"Your candidate": 7,
		"Candidate 1": 44,
		"Candidate 2": 22,
		"Candidate 3": 10,
		"Candidate 4": 8,
		"Candidate 6": 5,
		"Candidate 7": 4,
		"Invisible votes": 2
	},
	{
		"Your candidate": 8,
		"Candidate 1": 44,
		"Candidate 2": 22,
		"Candidate 3": 10,
		"Candidate 4": 9,
		"Candidate 6": 7,
		"Invisible votes": 3
	},
	{
		"Your candidate": 8,
		"Candidate 1": 47,
		"Candidate 2": 26,
		"Candidate 3": 10,
		"Candidate 4": 9,
		"Invisible votes": 4
	},
	{
		"Your candidate": 29,
		"Candidate 1": 51,
		"Candidate 3": 11,
		"Candidate 4": 9,
		"Invisible votes": 5
	},
	{
		"Your candidate": 29,
		"Candidate 1": 53,
		"Candidate 4": 18,
		"Invisible votes": 7
	},
	{
		"Your candidate": 40,
		"Candidate 1": 60,
		"Invisible votes": 7
	},
	{
		"Your candidate": 60,
		"Candidate 1": 40,
		"Invisible votes": 7
	},
	{
		"Candidate 1": 40,
		"Candidate 2": 60,
		"Invisible votes": 7
	},
];

// set data to 99 generic votes, 1 "your vote" and 9 invisible votes (these will be parent circles for candidates in the next slide)
const setInitialData = () => {
	let children = Array(1).fill().map(item => ({ name: `Your vote`, value: 1 }));
	children = children.concat(Array(99).fill().map(item => ({ name: `Generic vote`, value: 1 })));
	let invisibleVotes = Array(9).fill().map(item => ({ name: "Invisible vote", value: 1 }));
	// set data to outer layer with list of 109 votes as children
	allData = { name: "outer layer", children: [{ name: "all votes", children: children }].concat(invisibleVotes) };
};

// determine fill color of circles in chart, based on their value/ parent value
const fillColor = (d, step) => {
	let fillColor;
	if (d.data["name"] === "Your vote") {
		fillColor = "#8865c1"; // make "your vote" a different color
	} else if (d.data["name"] === "Your candidate" || d.parent.data["name"] === "Your candidate") {
		// color circles for "your candidate" based on color assigned to current scrollytelling step
		fillColor = yourCandidateColors[step];
	} else if (step === 0) {
		fillColor = "#71c0ad"; // color all other circles turquoise for first scrollyetlling step
	} else {
		fillColor = "#79919c"; // color all other circles gray for remaining steps
	}
	return fillColor;
};

// determine fill opacity of circles in chart, based on their value/ parent value
const fillOpacity = (d, step) => {
	let opacity;
	if (step === 0) {
		// first step in scrollytelling
		if (d.data["name"] === "Invisible vote") {
			opacity = 0; // hide invisible votes
		} else if (d.parent.data["name"] === "outer layer") {
			opacity = 0.5; // set outer layer opacity to 50%
		} else {
			opacity = 1; // set non-invisible votes opacity to 100%
		}
	} else if ((d.parent.data["name"] === "outer layer") || (d.data["name"] === "Invisible votes") || (d.parent.data["name"] === "Invisible votes")) {
		// all other steps in scrollytelling
		opacity = 0; // hide outer-most layer that encompasses all candidates, as well as invisible votes
	} else if (d.parent.data["name"] === "candidates") {
		// all other steps in scrollytelling
		opacity = 0.5; // set candidate circles opacity to 50%
	} else {
		// all other steps in scrollytelling
		opacity = 1; // set non-invisible votes opacity to 100%
	}
	return opacity;
};

// determine stroke color for circles in chart, based on their value/ parent value
const strokeColor = (d, step) => {
	let strokeColor;
	if (d.data["name"] === "Your vote") {
		strokeColor = "#3d3d3d"; // dark outline for your vote
	} else if (d.data["name"] === "Your candidate") {
		strokeColor = yourCandidateColors[step]; // stroke color based on circle color for your candidate
	} else if (step === 0) {
		strokeColor = "#71c0ad"; // turquoise outline for first slide
	} else {
		strokeColor = "#6b7691"; // gray outline for all other instances
	};
	return strokeColor;
};

// determine stroke width for circles in chart, based on whether we want them to have an outline or not
const strokeWidth = (d, step) => {
	let strokeWidth;
	if (step !== 0 && d.children && d.children.length > 50 || step < 2 && d.data["name"] === "Your vote") {
		// if circle is for winning candidate, or circle is for your vote in the first two slides
		strokeWidth = 1; // show outline
	} else if (d.data["name"] === "Invisible votes" || d.data["name"] === "Invisible vote" || d.data["name"] === "Your vote" || d.data["name"] === "Generic vote" || (step > 1 && d.parent.data["name"] === "outer layer")) {
		strokeWidth = 0; // don't show outline for individual votes, unless your vote on first slide
	} else {
		strokeWidth = 0.75; // small outline for candidate circles
	}
	return strokeWidth;
};

// determine ID for circles in chart, based on value/parent value
const circleId = (d, step) => {
	let circleId;
	if (d.data["name"] === "Your vote") {
		circleId = "your-vote"; // "your vote" should have it's own ID so it can be accessed later
	} else if (step !== 0 && d.children && d.children.length > 50) {
		circleId = "winner"; // any winning candidate circles should have an ID so they can be accessed later
	} else {
		circleId = ""; // other circles don't really need IDs
	}
	return circleId;
};

// function to sort circles in chart so that "your vote" will always be in the same place
const sortCircles = (a, b) => {
	if (a.data.name === "Your vote" || a.data.name === "Your candidate") {
		return -1;
	} else if (b.data.name === "Your vote" || b.data.name === "Your candidate") {
		return 1;
	} else {
		return b.value - a.value;
	}
};

// initialize chart for first scrollytelling step
const makeChart = (stepData, step) => {
	console.log("margin, width, height", margin, width, height)
	// set up d3 packing to given size parameters, sort circles so largest are at the center
	const pack = data => d3.pack()
		.size([width, height])
		.padding(10)
		(d3.hierarchy(data)
			.sum(d => d.value)
			.sort((a, b) => sortCircles(a, b)));
	const root = pack(stepData);

	// add circles to svg
	// color your vote and your candidate differently from other candidates, color based on scrollytelling step
	svg.append("g")
		.selectAll("circle")
		.data(root.descendants().slice(1))
		.join("circle")
		.attr("class", "vote-circle")
		.attr("fill", d => fillColor(d, step))
		.attr("fill-opacity", d => fillOpacity(d, step))
		.attr("stroke", d => strokeColor(d, step))
		.attr("stroke-width", d => strokeWidth(d, step))
		.attr("id", d => circleId(d, step))
		.attr("r", d => d.r)
		.attr("cx", d => d.x)
		.attr("cy", d => d.y);
};

// update chart on subsequent scrollytelling steps
const updateChart = (stepData, step) => {
	// set up d3 packing to given size parameters, sort circles so largest are at the center
	const pack = data => d3.pack()
		.size([width, height])
		.padding(10)
		(d3.hierarchy(data)
			.sum(d => d.value)
			.sort((a, b) => sortCircles(a, b)));
	const root = pack(stepData);

	// change chart data based on current step
	// style according to colors for current step
	d3.selectAll(".vote-circle")
		.data(root.descendants().slice(1))
		.transition()
		.delay((d, i) => i * 5)
		.duration(800)
		.attr("fill", d => fillColor(d, step))
		.attr("fill-opacity", d => fillOpacity(d, step))
		.attr("stroke", d => strokeColor(d, step))
		.attr("stroke-width", d => strokeWidth(d, step))
		.attr("id", d => circleId(d, step))
		.attr("r", d => d.r)
		.attr("cx", d => d.x)
		.attr("cy", d => d.y);
};

// remove "Winner!" label from chart
const removeWinnerLabel = () => {
	d3.select("#ranked-choice-winner")
		.remove();
};

// add "Winner!" label to circles when they have more than 50 votes
const addWinnerLabel = step => {
	// label moves around between scrollytelling steps, so best to just remove/re-add
	removeWinnerLabel();

	// get coordinates/size of winner circle, so label can be placed relative to that circle
	const winner = d3.select("#winner");
	const winnerRadius = winner.attr("r");
	const winnerX = winner.attr("cx");
	const winnerY = winner.attr("cy") - winnerRadius;

	// set up annotation w/ text, coordinates and colors
	const annotations = [
		{
			note: {
				label: "Winner!"
			},
			x: winnerX,
			y: winnerY,
			dy: mobile ? -20 : -30,
			dx: mobile ? -10 : -20,
			color: step === 11 ? "#95b85a" : "#79919c"
		}
	]

	// add annotation to chart
	const makeAnnotations = d3.annotation()
		.annotations(annotations)
	svg.append("g")
		.attr("id", "ranked-choice-winner")
		.call(makeAnnotations)
};

// remove legend
const removeLegend = () => {
	d3.select("#ranked-choice-legend")
		.remove();
};

// add legend that includes "your candidate" (relevant for slides 2 through 10)
const addYourCandidateLegend = step => {
	// remove old legend if there is one
	removeLegend();

	// need to wait for step to update before we use it for legend colors/labels
	setTimeout(() => {
		// add legend container
		const legend = svg.append("g")
			.attr("id", "ranked-choice-legend");

		// add circle for "your candidate"
		legend.append("circle")
			.attr("cx", 10)
			.attr("cy", mobile ? -10 : -15)
			.attr("r", 8)
			.attr("fill", yourCandidateColors[step])
			.attr("fill-opacity", 0.5)
			.attr("stroke", yourCandidateColors[step])
			.attr("stroke-width", 0.75);

		// add label for "your candidate"
		legend.append("text")
			.attr("x", 20)
			.attr("y", mobile ? -5 : -10)
			.attr("fill", "#3d3d3d")
			.style("font-size", "13px")
			.text(`Your ${yourCandidateLabel[Math.min(step, yourCandidateLabel.length - 1)]}`);

		// add circle for "other candidates"
		legend.append("circle")
			.attr("cx", 160)
			.attr("cy", mobile ? -10 : -15)
			.attr("r", 8)
			.attr("fill", "#79919c")
			.attr("fill-opacity", 0.5)
			.attr("stroke", "#79919c")
			.attr("stroke-width", 0.75);

		// add label for "other candidates"
		legend.append("text")
			.attr("x", 170)
			.attr("y", mobile ? -5 : -10)
			.attr("fill", "#3d3d3d")
			.style("font-size", "13px")
			.text("Other candidates");
	}, 150)
};

// add legend with only "other candidates" (relevant for step 12)
const addOtherCandidatesLegend = step => {
	// for last slide, we just want "other candidates" in the legend
	// remove legend if there is one
	removeLegend();

	// wait for step to load
	setTimeout(() => {
		// add legend container
		const legend = svg.append("g")
			.attr("id", "ranked-choice-legend");

		// add "other candidates" circle
		legend.append("circle")
			.attr("cx", 10)
			.attr("cy", mobile ? -10 : -15)
			.attr("r", 8)
			.attr("fill", "#79919c")
			.attr("fill-opacity", 0.5)
			.attr("stroke", "#79919c")
			.attr("stroke-width", 0.75);

		// add "other candidates" label
		legend.append("text")
			.attr("x", 20)
			.attr("y", mobile ? -5 : -10)
			.attr("fill", "#3d3d3d")
			.style("font-size", "13px")
			.text("Other candidates");
	}, 150)
};

// generate a list of votes for a given candidate
const voteList = (candidate, votes) => {
	if (candidate === "Your candidate") {
		// if this is "your candidate," need to add one "your vote"
		let voteList = [{ name: `Your vote`, value: 1 }];
		// then add generic votes
		voteList = voteList.concat(Array(votes[candidate] - 1).fill().map(item => ({ name: `Generic vote`, value: 1 })));
		return voteList;
	} else {
		// if it's any other candidate, just add generic votes
		return Array(votes[candidate]).fill().map(item => ({ name: `Generic vote`, value: 1 }));
	}
};

// format data point for a given candidate, with candidate name and respective votes
const candidateVotes = (candidate, votes) => {
	// generate candidate vot list
	const candidateChildren = voteList(candidate, votes);
	return { name: candidate, children: candidateChildren };
};

// generate data for a given scrollytelling step, so that each candidate has a list of votes and your candidate is differentiated
const stepData = step => {
	const votes = rounds[step]; // get votes for this step
	const candidates = Object.keys(votes); // get candidate names for this step
	// generate data
	let newData = {};
	newData = { name: "outer layer", children: [{ name: "candidates", children: candidates.map(candidate => candidateVotes(candidate, votes)) }] };
	return newData;
};

// coordinates for "your vote" annotation
const annotationCoords = (x, y, radius) => {
	let coords = [x - (radius * 2 / 3), y - (radius * 2 / 3)];
	return coords;
};

// x and y offset for "your vote" annotation
const annotationOffset = (x, y) => {
	let offset = [];
	let xOffset = mobile ? -chartWidth / 4.25 : -chartWidth / 3.5;
	let yOffset = mobile ? -chartWidth / 3 : -chartWidth / 3.5;
	offset = [xOffset, yOffset];
	return offset;
};

// remove "Your vote annotation"
const removeYourVoteAnnotation = () => {
	d3.select("#ranked-choice-annotation")
		.remove();
};

// add "Your vote" annotation to chart
const addYourVoteAnnotation = () => {
	// if it already exists, remove it
	d3.select("#ranked-choice-annotation")
		.remove();

	// get "your vote" circle dimensions/coordinates to position annotation accordingly
	const vote = d3.select("#your-vote");
	const voteRadius = parseFloat(vote.attr("r"));
	const voteX = parseFloat(vote.attr("cx"));
	const voteY = parseFloat(vote.attr("cy"));
	// calculate annotation coordinates
	const coords = annotationCoords(voteX, voteY, voteRadius);
	const annotationX = coords[0];
	const annotationY = coords[1];
	// calculate annotation offset 
	const offset = annotationOffset(voteX, voteY);
	const offsetX = offset[0];
	const offsetY = offset[1];

	// set up annotation with text, coordinates, offset and color
	const annotations = [
		{
			note: {
				label: "Your vote"
			},
			x: annotationX,
			y: annotationY,
			dy: offsetY,
			dx: offsetX,
			color: "#3d3d3d"
		}
	];

	// add annotation to chart
	const makeAnnotations = d3.annotation()
		.annotations(annotations);
	svg.append("g")
		.attr("id", "ranked-choice-annotation")
		.call(makeAnnotations);
};

// set up scrollytelling  
const scrollytelling = () => {
	// wait to make sure everything has loaded
	setTimeout(() => {
		// scrollama scroller
		const scroller = scrollama();
		scroller.setup({
			step: ".ranked-choice-slide", // each "step" is a div whose class is ".ranked-choice-slide"
			offset: 0.5 // when 50% of the div is visible, the step changes
		});

		// event handler for scrolling through a step
		const handleStepEnter = response => {
			const slideNum = response.index; // current "slide"/ "step"

			// at different steps, call different functions
			if (slideNum !== 1 && slideNum !== 3) {
				// for steps where the chart should change, generate new data and update chart
				const data = slideNum === 0 ? allData : stepData(slideNum);
				updateChart(data, slideNum);
			}

			// on first slide, remove legend if it exists and add "Your vote" annotation
			if (slideNum === 0) {
				setTimeout(() => addYourVoteAnnotation(), 600);
				removeLegend();
			}

			// remove legend when scrolling back to first chart
			if (slideNum === 1) {
				removeLegend();
			}

			// remove "Your vote" annotation after first chart
			if (slideNum === 2) {
				removeYourVoteAnnotation();
			}

			// add legend for charts on steps 2 through 10
			if (slideNum === 2 || slideNum === 5 || slideNum === 8) {
				addYourCandidateLegend(slideNum);
			}

			// remove "Winner!" label if scrolling backwards before step 9
			if (slideNum === 8) {
				removeWinnerLabel();
			}

			// add "Winner!" annotation for steps 10 through 12
			if (slideNum >= 10) {
				setTimeout(() => addWinnerLabel(slideNum), 800);
			}

			// add legend for step 12
			if (slideNum === 12) {
				addOtherCandidatesLegend(slideNum);
			}
		};

		// add event handler for step enter
		scroller.onStepEnter(handleStepEnter);
	}, 200);
};

// initialize page
function init() {
	// generate data for first chart
	setInitialData();
	setTimeout(() => {
		// set chart specifications based on parent div in wordpress
		outerContainer = d3.select("#outer-container");
		const outerContainerWidth = outerContainer.style("width") !== null ? parseFloat(outerContainer.style("width")) : window.innerWidth;
		chartWidth = mobile ? window.innerWidth : Math.min((outerContainerWidth / 2), 600);
		// define svg to hold chart, set width, height, margins
		margin = { top: 40, right: 0, bottom: 10, left: 20 }, // chart margins (need extra left margin bc of invisible circles in first slide)
		width = chartWidth - margin.left - margin.right, // svg width
		height = chartWidth - margin.top - margin.bottom; // svg height
		svg = d3.select("#ranked-choice-chart")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left}, ${margin.top})`);
		// set width of slide container based on parent div in wordpress
		d3.selectAll(".ranked-choice-slide")
			.attr("style", `margin-right: ${outerContainerWidth / 2}px; width: ${outerContainerWidth / 2}px`);
		d3.select("#ranked-choice-slide-container")
			.attr("style", `width: ${outerContainerWidth}px`);
		d3.select("#ranked-choice-chart-container")
			.attr("style", `width: ${outerContainerWidth/ 2}px`);
	}, 200);
	// wait for data to load
	setTimeout(() => {
		// create chart
		makeChart(allData, 0);
		// initailize scrollytelling
		scrollytelling();
	}, 350);
};

// when document loads, initialize page
$(document).ready(function () {
	init();
});