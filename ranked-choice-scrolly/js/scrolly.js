let mobile = window.innerWidth <= 768, // is graphic displayed on a mobile device?
	chartWidth = mobile ? window.innerWidth : Math.min((window.innerWidth / 2), 600); // chart should be full screen width on mobile, half screen (not over 600px) on desktop

const margin = { top: 40, right: 0, bottom: 10, left: 20 }, // chart margins (need extra left margin bc of invisible circles in first slide)
	width = chartWidth - margin.left - margin.right, // svg width
	height = chartWidth - margin.top - margin.bottom; // svg height

// define svg to hold chart, set width, height, margins
const svg = d3.select("#ranked-choice-chart")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);


// colors and labels for "your candidate" circles in different slides as 
const yourCandidateColors = ["", "", "#fe9643", "#fe9643", "#fe9643", "#e77688", "#e77688", "#95b85a", "#95b85a"];
/*const yourCandidateColors = ["", "", "#FE7743", "#FE7743", "#e77691", "#e77691", "#9FC87E", "#9FC87E"];*/
const yourCandidateLabel = ["", "", "first choice","first choice", "first choice", "second choice", "second choice", "third choice"]

// votes for each candidate on each slide
const rounds = [
	"",
	"",
	{	
		"Your candidate": 2,
		"Candidate 1": 44,
		"Candidate 2": 22,
		"Candidate 3": 10,
		"Candidate 4": 8,
		"Candidate 5": 5,
		"Candidate 6": 4,
		"Candidate 7": 3,
		"Candidate 8": 2,
	},
	"",
	"",
	{
		"Your candidate": 4,
		"Candidate 1": 45,
		"Candidate 2": 23,
		"Candidate 3": 12,
		"Candidate 4": 11,
		"Candidate 5": 5,
		"Invisible votes": 2 
		// need to add "invisible votes" that don't display in the chart, since there are parent circles for each candidate, but some candidates are eliminated
	},
	"",
	{
		"Your candidate": 24,
		"Candidate 1": 46,
		"Candidate 3": 13,
		"Candidate 4": 12,
		"Candidate 5": 5,
		"Invisible votes": 3
	},
	{
		"Your candidate": 25,
		"Candidate 1": 48,
		"Candidate 3": 13,
		"Candidate 4": 14,
		"Invisible votes": 4
	},
	{
		"Your candidate": 29,
		"Candidate 1": 53,
		"Candidate 4": 18,
		"Invisible votes": 5
	},
	{
		"Your candidate": 53,
		"Candidate 1": 29,
		"Candidate 4": 18,
		"Invisible votes": 5
	},
	{
		"Candidate 1": 29,
		"Candidate 2": 53,
		"Candidate 4": 18,
		"Invisible votes": 5
	},
];

// set data to 99 generic votes, 1 "your vote" and 9 invisible votes (these will be parent circles for candidates in the next slide)
const setInitialData = () => {
	//let children = Array(24).fill().map(item => ({ name: `Generic vote`, value: 1 }));
	//children = children.concat(Array(1).fill().map(item => ({ name: `Your vote`, value: 1 })));
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
		fillColor = yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)];
	} else if (step === 0) {
		/*fillColor = "#71C0BB"*/
		fillColor = "#71c0ad"; // color all other circles turquoise for first scrollyetlling step
	} else {
		/*fillColor = "#6b7691"*/
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
		strokeColor = yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)]; // stroke color based on circle color for your candidate
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
		.duration(500)
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
			color: step === 10 ? "#95b85a" : "#79919c"
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
			.attr("cx", mobile ? 10 : 10)
			.attr("cy", mobile ? -10 : -20)
			.attr("r", 8)
			.attr("fill", yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)])
			.attr("fill-opacity", 0.5)
			.attr("stroke", yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)])
			.attr("stroke-width", 0.75);

		// add label for "your candidate"
		legend.append("text")
			.attr("x", mobile ? 20 : 20)
			.attr("y", mobile ? -5 : -15)
			.attr("fill", "#3d3d3d")
			.style("font-size", "13px")
			.text(`Your ${yourCandidateLabel[Math.min(step, yourCandidateLabel.length - 1)]}`);

		// add circle for "other candidates"
		legend.append("circle")
			.attr("cx", mobile ? 160 : 160)
			.attr("cy", mobile ? -10 : -20)
			.attr("r", 8)
			.attr("fill", "#79919c")
			.attr("fill-opacity", 0.5)
			.attr("stroke", "#79919c")
			.attr("stroke-width", 0.75);

		// add label for "other candidates"
		legend.append("text")
			.attr("x", mobile ? 170 : 170)
			.attr("y", mobile ? -5 : -15)
			.attr("fill", "#3d3d3d")
			.style("font-size", "13px")
			.text("Other candidates");
	}, 150)
};

// add legend with only "other candidates" (relevant for step 11)
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
				.attr("cy", -20)
				.attr("r", 8)
				.attr("fill", "#79919c")
				.attr("fill-opacity", 0.5)
				.attr("stroke", "#79919c")
				.attr("stroke-width", 0.75);

			// add "other candidates" label
			legend.append("text")
				.attr("x", 20)
				.attr("y", -15)
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
	let coords = [x - (radius*2/3), y - (radius*2/3)];
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


			if (slideNum !== 1 && slideNum !== 3 && slideNum !== 4 && slideNum !== 6) {
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
			if (slideNum === 2 || slideNum === 5 || slideNum === 7) {
				addYourCandidateLegend();
			}

			// remove "Winner!" label if scrolling backwards before step 9
			if (slideNum === 8) {
				removeWinnerLabel();
			}

			// add "Winner!" annotation for steps 9 through 11
			if (slideNum >= 9) {
				setTimeout(() => addWinnerLabel(slideNum), 500);
			}

			// add legend for step 11
			if (slideNum === 11) {
				addOtherCandidatesLegend();
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
	// wait for data to load
	setTimeout(() => {
		// create chart
		makeChart(allData, 0);
		// initailize scrollytelling
		scrollytelling();
	}, 200);
};

// when document loads, initialize page
$(document).ready(function () {
	init();
});