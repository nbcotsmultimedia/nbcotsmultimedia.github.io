// if mode is true, split is triptych
let mode;

// event handler for toggle between diptych and triptych
$(document).on('change', '.form-check', function (e) {
	mode = e.target.checked;
	let id = d3.select(".active").attr("id")

	if (id == "radio-left") {
		buildSplit(mode, true)
	} else {
		buildSplit(mode, false)
	}

});

// function to build split tool
// takes two variables - is the split a diptych or triptych (mode) and are the lines straight or diagonal? both are boolean
function buildSplit(mode, diagonal) {

	// destroy elements generated during previous run if needed
	d3.select("#split-tool-options").selectAll("*").remove();
	d3.select("#split-tool").selectAll("*").remove();

	// the image cropping library (cropme) takes some options
	// need to adjust viewport and container width based on if diptych or triptych
	// would have been nice if we could set to 100% of parent container, but unfortunately this needs to be hardcoded for the library to work    

	let options;

	if (mode) {
		options = {
			container: {
				width: 250,
				height: 423
			},
			viewport: {
				width: 250,
				height: 423,
				border: {
					enable: true,
					width: 2,
					color: '#000'
				}
			},
			zoom: {
				enable: true,
				mouseWheel: true,
				slider: true
			}
		}
	} else {
		options = {
			container: {
				width: 375,
				height: 423
			},
			viewport: {
				width: 375,
				height: 423,
				border: {
					enable: true,
					width: 2,
					color: '#000'
				}
			},
			zoom: {
				enable: true,
				mouseWheel: true,
				slider: true
			}
		}
	}

	// using d3 to generate some containers/file upload buttons for cropme
	var root = d3.select("#split-tool-options")

	var leftForm = root
		.append("div")
		.attr("class", "mb-3 li")

	leftForm
		.append("label")
		.attr("class", "form-label")
		.attr("for", "formFile-left")
		.html("Left photo")

	leftForm
		.append("input")
		.attr("class", "form-control")
		.attr("type", "file")
		.attr("id", "formFile-left")

	// if triptych, generate a middle container and file upload
	if (mode) {

		var middleForm = root
			.append("div")
			.attr("class", "mb-3 mi")

		middleForm
			.append("label")
			.attr("class", "form-label")
			.attr("for", "formFile-middle")
			.html("Middle photo")

		middleForm
			.append("input")
			.attr("class", "form-control")
			.attr("type", "file")
			.attr("id", "formFile-middle")
	}

	var rightForm = root
		.append("div")
		.attr("class", "mb-3 ri")

	rightForm
		.append("label")
		.attr("class", "form-label")
		.attr("for", "formFile-right")
		.html("Right photo")

	rightForm
		.append("input")
		.attr("class", "form-control")
		.attr("type", "file")
		.attr("id", "formFile-right")

	var tool = d3.select("#split-tool")
		.append("div")
		.attr("class", "container-wrapper")
		.attr("id", "capture")

	// seperation lines for photos
	tool
		.append("div")
		.attr("id", "border-line1")

	tool
		.append("div")
		.attr("class", "left-photo")
		.append("div")
		.attr("id", "left-container")

	// if triptych, implement two lines instead of one
	if (mode) {

		tool
			.append("div")
			.attr("class", "middle-photo")
			.append("div")
			.attr("id", "middle-container")

		d3.select("#border-line1").remove()

		tool
			.append("div")
			.attr("id", "border-line2")

		tool
			.append("div")
			.attr("id", "border-line3")
	}

	// making sure the correct styles are applied to the border lines depending on if straight or diagonal 
	// this could be more efficient...
	if (diagonal) {
		d3.selectAll("#border-line1")
			.classed("diagonal", true)

		d3.selectAll("#border-line2")
			.classed("diagonal2", true)

		d3.selectAll("#border-line3")
			.classed("diagonal3", true)

	} else {
		d3.selectAll("#border-line1")
			.classed("diagonal", false)

		d3.selectAll("#border-line2")
			.classed("diagonal2", false)

		d3.selectAll("#border-line3")
			.classed("diagonal3", false)
	}

	tool
		.append("div")
		.attr("class", "right-photo")
		.append("div")
		.attr("id", "right-container")


	const leftContainer = $('#left-container');
	const rightContainer = $('#right-container');

	leftContainer.cropme(options);
	rightContainer.cropme(options);

	const leftFile = d3.select("#formFile-left")
	const rightFile = d3.select("#formFile-right")

	// file upload function
	var fileUpload = function (ev, container) {
		if (ev.target.files) {
			let file = ev.target.files[0];
			var reader = new FileReader();

			reader.onloadend = function (e) {
				var image = new Image();
				image.src = e.target.result;
				image.onload = function (ev) {
					console.log("loading");

					container.cropme('destroy')
					container.cropme(options);
					container.cropme('bind', {
						url: image.src
					});

					// the zoom sliders are crop me defaults, so tweaking styling a bit 
					d3.selectAll(".cropme-slider").style("width", options.viewport.width - 50 + "px")
					d3.selectAll(".cropme-slider>input").style("width", options.viewport.width - 50 + "px")


				}
			}
			reader.readAsDataURL(file);

			// only activate download button when all files have been uploaded 
			if (mode) {

				if ((document.getElementById('formFile-right').files.length != 0) & (document.getElementById('formFile-left').files.length != 0) & (document.getElementById('formFile-middle').files.length != 0)) {
					console.log("all uploaded");

					$('#download').removeAttr("disabled")
				}

			} else {
				if ((document.getElementById('formFile-right').files.length != 0) & (document.getElementById('formFile-left').files.length != 0)) {
					console.log("both uploaded");

					$('#download').removeAttr("disabled")
				}

			}
		}
	}

	// binding file upload functions to file inputs 
	leftFile.on("change", function (ev) {
		fileUpload(ev, leftContainer)
	})

	rightFile.on("change", function (ev) {
		fileUpload(ev, rightContainer)
	})

	// change styling when user clicks between diagonal and straight lines 
	d3.selectAll(".radio-option").on("click", function (e) {
		let id = d3.select(this).attr("id")

		d3.selectAll(".radio-option").classed("active", false)
		d3.select("#" + id).classed("active", true)

		if (id == "radio-right") {
			d3.select("#border-line1").classed("diagonal", false)
			d3.select("#border-line2").classed("diagonal2", false)
			d3.select("#border-line3").classed("diagonal3", false)

			d3.select("#left-container").classed("triptych", false)
			d3.select("#middle-container").classed("triptych", false)
			d3.select("#right-container").classed("triptych", false)

			d3.select("#left-container").classed("diptych", false)
			d3.select("#right-container").classed("diptych", false)


		} else {
			d3.select("#border-line1").classed("diagonal", true)
			d3.select("#border-line2").classed("diagonal2", true)
			d3.select("#border-line3").classed("diagonal3", true)

			if (mode) {

				d3.select("#left-container").classed("triptych", true)
				d3.select("#middle-container").classed("triptych", true)
				d3.select("#right-container").classed("triptych", true)
		
				d3.select("#left-container").classed("diptych", false)
				d3.select("#right-container").classed("diptych", false)
		
			} else {
				d3.select("#left-container").classed("triptych", false)
				d3.select("#middle-container").classed("triptych", false)
				d3.select("#right-container").classed("triptych", false)
		
				d3.select("#left-container").classed("diptych", true)
				d3.select("#right-container").classed("diptych", true)
			}
		}

	})

	if(diagonal){
		if (mode) {

			d3.select("#left-container").classed("triptych", true)
			d3.select("#middle-container").classed("triptych", true)
			d3.select("#right-container").classed("triptych", true)
	
			d3.select("#left-container").classed("diptych", false)
			d3.select("#right-container").classed("diptych", false)
	
		} else {
			d3.select("#left-container").classed("triptych", false)
			d3.select("#middle-container").classed("triptych", false)
			d3.select("#right-container").classed("triptych", false)
	
			d3.select("#left-container").classed("diptych", true)
			d3.select("#right-container").classed("diptych", true)
		}

	}

	// binding file upload function to middle input if triptych
	if (mode) {
		const middleContainer = $('#middle-container');
		middleContainer.cropme(options);

		const middleFile = d3.select("#formFile-middle")

		middleFile.on("change", function (ev) {
			fileUpload(ev, middleContainer)
		})

	} 

	// the zoom sliders are crop me defaults, so tweaking styling a bit 
	d3.selectAll(".cropme-slider").style("width", options.viewport.width - 50 + "px")
	d3.selectAll(".cropme-slider>input").style("width", options.viewport.width - 50 + "px")
}

// download button even handler
$("#download").on('click', function () {

	// ensures that the diagonal lines are cropped
	d3.select("#capture").style("overflow", "hidden")

	// update this setting to change photo output width and height
	let options = {
		canvasWidth: 1500,
		canvasHeight: 846
	}

	htmlToImage.toPng(document.getElementById('capture'), options)
		.then(function (dataUrl) {
			download(dataUrl, 'image.png');
			d3.select("#capture").style("overflow", "unset")
		});
});

// on page load generate a diptych with diagonal lines...
buildSplit(false, true)


