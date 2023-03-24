var ds;
var totalEntries;
var allData;
var config;
var currentThumb = 0;
var counter = 0;


function init() {
	//console.log("ready");

	$("#cardPic,#fName,#lName,#pInfo").css("opacity", 0);


	config = buildConfig();
	loadData();


}

function buildConfig() {
	return {
		delimiter: "",	// auto-detect
		newline: "",	// auto-detect
		quoteChar: '"',
		escapeChar: '"',
		header: false,
		transformHeader: undefined,
		dynamicTyping: false,
		preview: 0,
		encoding: "",
		worker: false,
		comments: false,
		step: undefined,
		complete: undefined,
		error: undefined,
		download: false,
		downloadRequestHeaders: undefined,
		downloadRequestBody: undefined,
		skipEmptyLines: false,
		chunk: undefined,
		chunkSize: undefined,
		fastMode: undefined,
		beforeFirstChunk: undefined,
		withCredentials: undefined,
		transform: undefined,
		delimitersToGuess: [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP]
	};
}


function loadData() {

	Papa.parse("https://docs.google.com/spreadsheets/d/e/2PACX-1vRdu9NROchUVVi3_gfWKC8__x8DXX4JU4C3Rr6Fax4a3pclFWo6XVmS1sJOEQydFz8pdxF_gDEVlayU/pub?gid=0&single=true&output=csv", {
		download: true,
    header: true,
		config,
		complete: function(results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			parseData()
		}
	});

}

function parseData() {
	var $len = allData.length;
	totalEntries = $len;

	//do something
	//console.log(allData[i][0].myid);
	createGrid();

}

function createGrid() {

	for (i=0; i<totalEntries; i++) {
		$("#thumbsCon").append("<div class='thumb' id='c" + i + "' data-id='" + i + "'>" +
													 "<div class='thMask' id='i" + i + "'><img src='" + allData[i].image + "' class='headOnly' /></div>" +
													 "<p class='thLast'>" + allData[i].last + "</p>" +
													 "</div>");

		$("#mySelect").append($("<option class='dropdown-item' value='" + i + "'></option>").html(allData[i].name));

		$(".thumb").css("opacity", 0);

	}

	var thHeight = Math.ceil(($(".thumb").width() / 3) * 4);
	$(".thMask").css("height", thHeight);

	$(".thumb").click(function() {
		//console.log($(this).attr("data-id"));
		loadCard($(this).attr("data-id"));

	});

	//animateThumb(0);

	$(".thumb").animate({ opacity: 1 }, 1000, function() {

	});

	loadCard(0);
}

function animateThumb(which) {
	if (which < totalEntries) {
		$("#c" + which).animate({ opacity: 1 }, 100, function() {
	    counter ++;
			animateThumb(counter);
	  });
	}
}

function loadCard(which) {

	//console.log("card " + which);

	$("#cardPic,#fName,#lName,#pInfo").css("opacity", 0);

	$("#i" + currentThumb).removeClass("thactive");
	currentThumb = which;
	$("#i" + which).addClass("thactive");

	$("#cardPic").html("<img src='" + allData[which].image + "' class='img-fluid' />");
	$("#fName").text(allData[which].first);
	$("#lName").text(allData[which].last);
	$("#pInfo").html("<div class='stat'><span class='bolder'>POSICIÓN: </span>" + allData[which].position + "</div>" +
 									 "<div class='stat'><span class='bolder'>BATEA/TIRA: </span>" + allData[which].b_t + "</div>" +
									 "<div class='stat'><span class='bolder'>ESTATURA: </span>" + allData[which].height + "</div>" +
									 "<div class='stat'><span class='bolder'>PESO: </span>" + allData[which].weight + " lbs</div>" +
									 "<div class='stat'><span class='bolder'>LUGAR DE NACIMIENTO: </span>" + allData[which].hometown + "</div>" +
									 "<div class='stat'><span class='bolder'>ACTUAL EQUIPO: </span>" + allData[which].team + "</div>");

	if (which == 8 || which == 27) {
		$("#lName").addClass("smaller");
	} else {
		$("#lName").removeClass("smaller");
	}

	$("#cardPic,#fName,#lName,#pInfo").animate({
    opacity: 1
  }, 500, function() {
    // Animation complete.
  });

	setTimeout(resizeFrame, 2000);


}

function resizeFrame() {
	xtalk.signalIframe()
}


$(document).ready(function(){
	init();
});
