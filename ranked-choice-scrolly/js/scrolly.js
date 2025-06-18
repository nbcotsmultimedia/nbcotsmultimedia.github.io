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

// initialize chart for first scrollytelling step
const makeChart = (stepData, step) => {
	// set up d3 packing to given size parameters, sort circles so largest are at the center
	const pack = data => d3.pack()
		.size([width, height])
		.padding(10)
		(d3.hierarchy(data)
			.sum(d => d.value)
			.sort((a, b) => b.value - a.value));
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
			.sort((a, b) => b.value - a.value));
	const root = pack(stepData);

	console.log(root)

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

const addWinnerLabel = step => {
	d3.select("#ranked-choice-winner")
		.remove();
	const vote = d3.select("#winner");
	const voteRadius = vote.attr("r");
	const voteX = vote.attr("cx");
	const voteY = vote.attr("cy") - voteRadius;

	const annotations = [
		{
			note: {
				label: "Winner!"
			},
			x: voteX,
			y: voteY,
			dy: mobile ? -20 : -30,
			dx: mobile ? -10 : -20,
			color: step === 10 ? "#95b85a" : "#79919c"
		}
	]

	// Add annotation to the chart
	const makeAnnotations = d3.annotation()
		.annotations(annotations)
	svg.append("g")
		.attr("id", "ranked-choice-winner")
		.call(makeAnnotations)
};

const removeWinnerLabel = () => {
	d3.select("#ranked-choice-winner")
		.remove();
};

const addLegend = step => {
	if (step === 2 || step === 5 || step === 7) {
		d3.select("#ranked-choice-legend")
			.remove();

		setTimeout(() => {
			const legend = svg.append("g")
				.attr("id", "ranked-choice-legend");

			legend.append("circle")
				.attr("cx", mobile ? 10 : 10)
				.attr("cy", mobile ? -10 : -20)
				.attr("r", 12)
				.attr("fill", yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)])
				.attr("fill-opacity", 0.5)
				.attr("stroke", yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)])
				.attr("stroke-width", 0.75);

			legend.append("text")
				.attr("x", mobile ? 28 : 28)
				.attr("y", mobile ? -5 : -15)
				.attr("fill", "#3d3d3d")
				.style("font-size", "14px")
				.text(`Your ${yourCandidateLabel[Math.min(step, yourCandidateLabel.length - 1)]}`);

			legend.append("circle")
				.attr("cx", mobile ? 200 : 190)
				.attr("cy", mobile ? -10 : -20)
				.attr("r", 12)
				.attr("fill", "#79919c")
				.attr("fill-opacity", 0.5)
				.attr("stroke", "#79919c")
				.attr("stroke-width", 0.75);

			legend.append("text")
				.attr("x", mobile ? 218 : 208)
				.attr("y", mobile ? -5 : -15)
				.attr("fill", "#3d3d3d")
				.style("font-size", "14px")
				.text("Other candidates");
		}, 150)
	} else if (step === 2) {
		d3.select("#ranked-choice-legend")
			.remove();
	} else if (step === 11) {
		d3.select("#ranked-choice-legend")
			.remove();

		setTimeout(() => {
			const legend = svg.append("g")
				.attr("id", "ranked-choice-legend");

			legend.append("circle")
				.attr("cx", 10)
				.attr("cy", -20)
				.attr("r", 12)
				.attr("fill", "#79919c")
				.attr("fill-opacity", 0.5)
				.attr("stroke", "#79919c")
				.attr("stroke-width", 0.75);

			legend.append("text")
				.attr("x", 28)
				.attr("y", -15)
				.attr("fill", "#3d3d3d")
				.style("font-size", "14px")
				.text("Other candidates");
		}, 150)
	}
};

const removeLegend = () => {
	d3.select("#ranked-choice-legend")
			.remove();
};

const voteList = (candidate, votes) => {
	if (candidate === "Your candidate") {
		let voteList = [{ name: `Your vote`, value: 1 }];
		voteList = voteList.concat(Array(votes[candidate] - 1).fill().map(item => ({ name: `Generic vote`, value: 1 })));
		return voteList;
	} else {
		return Array(votes[candidate]).fill().map(item => ({ name: `Generic vote`, value: 1 }));
	}
};

const candidateVotes = (candidate, votes) => {
	const candidateChildren = voteList(candidate, votes);
	return { name: candidate, children: candidateChildren };
}

const stepData = step => {
	const votes = rounds[step - 1];
	const candidates = Object.keys(votes);
	let newData = {};
	newData = { name: "outer layer", children: [{ name: "candidates", children: candidates.map(candidate => candidateVotes(candidate, votes)) }] };
	return newData;
};

const annotationCoords = (x, y, radius) => {
	let coords = [x - (radius*2/3), y - (radius*2/3)];
	return coords;
};

const annotationOffset = (x, y) => {
	let offset = [];
	let xOffset = x > chartWidth / 2 ? chartWidth / 10 : -chartWidth / 3.5;
	let yOffset = y > chartWidth / 2 ? -chartWidth / 2 : -chartWidth / 3.5;
	offset = [xOffset, yOffset];
	return offset;
};

const addAnnotation = () => {
	d3.select("#ranked-choice-annotation")
		.remove();
	const vote = d3.select("#your-vote");
	const voteRadius = parseFloat(vote.attr("r"));
	const voteX = parseFloat(vote.attr("cx"));
	const voteY = parseFloat(vote.attr("cy"));
	const coords = annotationCoords(voteX, voteY, voteRadius);
	const annotationX = coords[0];
	const annotationY = coords[1];
	const offset = annotationOffset(voteX, voteY);
	const offsetX = offset[0];
	const offsetY = offset[1];

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

	const makeAnnotations = d3.annotation()
		.annotations(annotations);
	svg.append("g")
		.attr("id", "ranked-choice-annotation")
		.call(makeAnnotations);
};

const removeAnnotation = () => {
	d3.select("#ranked-choice-annotation")
		.remove();
};

const scrollytelling = () => {
	setTimeout(() => { // set up scrollama scroller
		const scroller = scrollama();
		scroller.setup({
			step: ".ranked-choice-slide",
			offset: 0.5
		});

		// event handler for scrolling through a step
		const handleStepEnter = response => {
			const slideNum = response.index;
			addLegend(slideNum);
			if (slideNum !== 0 && slideNum !== 1 && slideNum !== 3 && slideNum !== 4 && slideNum !== 6) {
				const data = slideNum === 0 ? allData : stepData(slideNum);
				updateChart(data, slideNum);
			}

			if (slideNum === 0) {
				setTimeout(() => addAnnotation(), 600);
				removeLegend();
			}

			if (slideNum === 2) {
				removeAnnotation();
			}

			if (slideNum >= 9) {
				setTimeout(() => addWinnerLabel(slideNum), 500);
			}

			if (slideNum === 8) {
				removeWinnerLabel();
			}
		};
		scroller.onStepEnter(handleStepEnter);
	}, 200);
};

function init() {
	setInitialData();
	setTimeout(() => {
		makeChart(allData, 0);
		scrollytelling();
	}, 200);
};

$(document).ready(function () {
	init();
});