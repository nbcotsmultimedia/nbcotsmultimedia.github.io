let mobile = window.innerWidth <= 768,
	chartWidth = mobile ? window.innerWidth : Math.min((window.innerWidth / 2), 600),
	captions,
	numSlides

const margin = { top: 40, right: 0, bottom: 10, left: 20 },
	width = chartWidth - margin.left - margin.right,
	height = chartWidth - margin.top - margin.bottom;


const svg = d3.select("#ranked-choice-chart")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

//const yourCandidateColors = ["", "", "#FE7743", "#FE7743", "#e77691", "#e77691", "#9FC87E", "#9FC87E"];
const yourCandidateColors = ["", "", "#fe9643", "#fe9643", "#e77688", "#e77688", "#95b85a", "#95b85a"];
const yourCandidateLabel = ["", "", "first choice", "first choice", "second choice", "second choice", "third choice"]

const rounds = [
	"",
	{
		"Candidate 1": 44,
		"Candidate 2": 22,
		"Candidate 3": 10,
		"Candidate 4": 8,
		"Candidate 5": 5,
		"Candidate 6": 4,
		"Candidate 7": 3,
		"Candidate 8": 2,
		"Your candidate": 2
	},
	"",
	{
		"Candidate 1": 45,
		"Candidate 2": 23,
		"Candidate 3": 12,
		"Candidate 4": 11,
		"Candidate 5": 5,
		"Your candidate": 4,
		"Invisible votes": 2
	},
	"",
	{
		"Candidate 1": 46,
		"Your candidate": 24,
		"Candidate 3": 13,
		"Candidate 4": 12,
		"Candidate 5": 5,
		"Invisible votes": 3
	},
	{
		"Candidate 1": 48,
		"Your candidate": 25,
		"Candidate 3": 13,
		"Candidate 4": 14,
		"Invisible votes": 4
	},
	{
		"Candidate 1": 53,
		"Your candidate": 29,
		"Candidate 4": 18,
		"Invisible votes": 5
	},
	{
		"Candidate 1": 29,
		"Your candidate": 53,
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

const generateData = () => {
	let children = Array(24).fill().map(item => ({ name: `Generic vote`, value: 1 }));
	children = children.concat(Array(1).fill().map(item => ({ name: `Your vote`, value: 1 })));
	children = children.concat(Array(75).fill().map(item => ({ name: `Generic vote`, value: 1 })));
	let invisibleVotes = Array(9).fill().map(item => ({ name: "Invisible vote", value: 1 }));
	allData = { name: "outer layer", children: [{ name: "all votes", children: children }].concat(invisibleVotes) };
};

const fillOpacity = (d, step) => {
	let opacity;
	if (step === 0) {
		if (d.data["name"] === "Invisible vote") {
			opacity = 0;
		} else if (d.parent.data["name"] === "outer layer") {
			opacity = 0.5;
		} else {
			opacity = 1;
		}
	} else if ((d.parent.data["name"] === "outer layer") || (d.data["name"] === "Invisible votes") || (d.parent.data["name"] === "Invisible votes")) {
		opacity = 0;
	} else if (d.parent.data["name"] === "candidates") {
		opacity = 0.5;
	} else {
		opacity = 1;
	}
	return opacity;
}

const makeChart = (stepData, step) => {
	const pack = data => d3.pack()
		.size([width, height])
		.padding(10)
		(d3.hierarchy(data)
			.sum(d => d.value)
			.sort((a, b) => b.value - a.value));

	const root = pack(stepData);

	svg.append("g")
		.selectAll("circle")
		.data(root.descendants().slice(1))
		.join("circle")
		.attr("class", "vote-circle")
		.attr("fill", d => d.data["name"] === "Your vote" ? "#8865c1" : d.data["name"] === "Your candidate" || d.parent.data["name"] === "Your candidate" ? yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)] : step === 0 ? /*"#71C0BB"*/ "#71c0ad" : "#79919c"/*"#6b7691"*/)
		.attr("fill-opacity", d => fillOpacity(d, step))
		.attr("stroke", d => d.data["name"] === "Your vote" ? "#000000" : d.data["name"] === "Your candidate" && d.children && d.children.length > 50 ? yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)] : "#6b7691")
		.attr("stroke-opacity", 1)
		.attr("stroke-width", d => step !== 0 && d.children && d.children.length > 50 || step < 2 && d.data["name"] === "Your vote" ? 1 : 0)
		.attr("id", d => d.data["name"] === "Your vote" ? "your-vote" : step !== 0 && d.children && d.children.length > 50 ? "winner" : "")
		.attr("r", d => d.r)
		.attr("cx", d => d.x)
		.attr("cy", d => d.y);
};

const updateChart = (stepData, step) => {

	const pack = data => d3.pack()
		.size([width, height])
		.padding(10)
		(d3.hierarchy(data)
			.sum(d => d.value)
			.sort((a, b) => b.value - a.value));

	const root = pack(stepData);

	d3.selectAll(".vote-circle")
		.data(root.descendants().slice(1))
		.transition()
		.delay((d, i) => i * 5)
		.duration(500)
		.attr("fill", d => d.data["name"] === "Your vote" ? "#8865c1" : d.data["name"] === "Your candidate" || d.parent.data["name"] === "Your candidate" ? yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)] : step === 0 ? "#71c0ad" : "#79919c")
		.attr("fill-opacity", d => fillOpacity(d, step))
		.attr("stroke", d => d.data["name"] === "Your vote" ? "#3d3d3d" : d.data["name"] === "Your candidate" && d.children && d.children.length > 50 ? yourCandidateColors[Math.min(step, yourCandidateColors.length - 1)] : "#6b7691")
		.attr("stroke-opacity", 1)
		.attr("stroke-width", d => step !== 0 && d.children && d.children.length > 50 || step < 2 && d.data["name"] === "Your vote" ? 1 : 0)
		.attr("id", d => d.data["name"] === "Your vote" ? "your-vote" : step !== 0 && d.children && d.children.length > 50 ? "winner" : "")
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
			color: step === 9 ? "#95b85a" : "#79919c"
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
	if (step === 2 || step === 4 || step === 6) {
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
				.attr("fill-opacity", 0.5);

			legend.append("text")
				.attr("x", mobile ? 28 : 28)
				.attr("y", mobile ? -5 : -15)
				.attr("fill", "#3d3d3d")
				.text(`Your ${yourCandidateLabel[Math.min(step, yourCandidateLabel.length - 1)]}`);

			legend.append("circle")
				.attr("cx", mobile ? 200 : 190)
				.attr("cy", mobile ? -10 : -20)
				.attr("r", 12)
				.attr("fill", "#79919c")
				.attr("fill-opacity", 0.5);

			legend.append("text")
				.attr("x", mobile ? 218 : 208)
				.attr("y", mobile ? -5 : -15)
				.attr("fill", "#3d3d3d")
				.text("Other candidates");
		}, 150)
	} else if (step === 1) {
		d3.select("#ranked-choice-legend")
			.remove();
	} else if (step === 10) {
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
				.attr("fill-opacity", 0.5);

			legend.append("text")
				.attr("x", 28)
				.attr("y", -15)
				.attr("fill", "#3d3d3d")
				.text("Other candidates");
		}, 150)
	}
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
	let coords = [x, y - radius];
	return coords;
};

const annotationOffset = (x, y) => {
	let offset = [];
	let xOffset = x > chartWidth / 2 ? chartWidth / 10 : -chartWidth / 10;
	let yOffset = y > chartWidth / 2 ? -chartWidth / 2 : -chartWidth / 4;
	offset = [xOffset, yOffset];
	return offset;
};

const addAnnotation = () => {
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
			if (slideNum !== 1 && slideNum !== 3 && slideNum !== 5) {
				const data = slideNum === 0 ? allData : stepData(slideNum);
				updateChart(data, slideNum);
			}

			if (slideNum === 0) {
				setTimeout(() => addAnnotation(), 600);
			}

			if (slideNum === 2) {
				removeAnnotation();
			}

			if (slideNum >= 8) {
				setTimeout(() => addWinnerLabel(slideNum), 500);
			}

			if (slideNum === 7) {
				removeWinnerLabel();
			}
		};
		scroller.onStepEnter(handleStepEnter);
	}, 200);
};

function init() {
	generateData();
	setTimeout(() => {
		makeChart(allData, 0);
		scrollytelling();
	}, 200);
};

$(document).ready(function () {
	init();
});