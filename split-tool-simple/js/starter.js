let mode;

$(document).on('change', '.form-check', function (e) {
	mode = e.target.checked;
	buildSplit(mode)
});

function buildSplit(mode) {

	d3.select("#split-tool-options").selectAll("*").remove();
	d3.select("#split-tool").selectAll("*").remove();

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

	var root = d3.select("#split-tool-options")
		.append("div")
		.attr("class", "option-row r2")

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

	tool
		.append("div")
		.attr("id", "border-line1")

	tool
		.append("div")
		.attr("class", "left-photo")
		.append("div")
		.attr("id", "left-container")

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


					d3.selectAll(".cropme-slider").style("width", options.viewport.width - 50 + "px")
					d3.selectAll(".cropme-slider>input").style("width", options.viewport.width - 50 + "px")

				}
			}
			reader.readAsDataURL(file);

			// active download button when all files have been uploaded 

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


	leftFile.on("change", function (ev) {
		fileUpload(ev, leftContainer)
	})

	rightFile.on("change", function (ev) {
		fileUpload(ev, rightContainer)
	})


	if (mode) {
		const middleContainer = $('#middle-container');
		middleContainer.cropme(options);

		const middleFile = d3.select("#formFile-middle")

		middleFile.on("change", function (ev) {
			fileUpload(ev, middleContainer)
		})

	}

	d3.selectAll(".cropme-slider").style("width", options.viewport.width - 50 + "px")
	d3.selectAll(".cropme-slider>input").style("width", options.viewport.width - 50 + "px")
}

var element = $("#container-wrapper"); // global variable
var getCanvas; // global variable
var newData;

$("#download").on('click', function () {

	html2canvas(document.querySelector("#capture"), { scale: 2 }).then(canvas => {
		// document.body.appendChild(canvas)
		getCanvas = canvas;
		var imgageData = getCanvas.toDataURL("image/png");
		var a = document.createElement("a");
		a.href = imgageData; //Image Base64 Goes here
		a.download = "Image.png"; //File name Here
		a.click(); //Downloaded file
	});

});

d3.select("#test").on("click", function (e) {
	e.preventDefault();


})



//   self.properties.container.addEventListener('mousewheel', mousewheel);


buildSplit(mode)


