var ds;
var totalEntries;
var allData;
var status = "";
var party = "";
var myparent = "";
var dWidth;
var thBottom = 0;
var cols = 1;
var rows;
var initRun = true;

var config;

var intros = [];
var sheets = [];
var currentDecade = "";

var status = "";

function init() {
	//console.log("ready");
	$(".pages").hide();
	$("#infoWin").hide();

	sheets[0] = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNHdZsT5-uZpXceCV4ZUUU5vwmj7lm2VbtW9f1czQXQuEUxrby5eIPE80XFMH0HXJKuIcRzObNASt4/pub?gid=0&single=true&output=csv";

	config = buildConfig();

	dWidth = $(document).width();

	$( window ).resize(function() {
		resizeItems();
	});

	//myparent = xtalk.parentDomain;
	//console.log("parent" + myparent + "parent")

	$(".nextBtn").click( function() {
		nextPage();
	});
	$(".prevBtn").click( function() {
		prevPage();
	});

	loadData(0);

	$("#btnall").click(function() {
		currentDecade = "ny";
		$(this).addClass("active");
		$("#dcbtn").removeClass("active");
		$("#pabtn").removeClass("active");
    loadData(0);
	});

}


function loadData(which) {

	Papa.parse(sheets[which], {
		download: true,
    header: true,
		config,
		complete: function(results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			parseData();

		}
	});
}

function buildConfig()
{
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

function parseData() {

	var $len = allData.length;
	totalEntries = $len;


	$( "#gridCon").animate( { opacity: 0 }, 500, function() {
		generateGrid();
	});


}

function generateGrid() {

	$("#gridCon").html("");
	$("#gridCon").css("opacity", 1);

	for (var i=0; i<totalEntries; i++) {

		$("#gridCon").append("<div class='item' id='th" + i + "' data-id='" + i + "' data-gid='" + (i+1) + "'>" +
												"<div class='th'><img id='img" + i + "'src='" + allData[i].image + "' width='100%' alt='thumb' onerror='imgError(this);' />" +
												"<p class='pName'>" + allData[i].material + "<br/><span class='facility'>" + allData[i].facility_name + "</span></p>" +
												"</div>");


		switch (allData[i].outcome) {
			case "Unclear":
				$("#th" + i + " .pName").css("background-color", "#ff9900");
				break;
			case "Removed":
				$("#th" + i + " .pName").css("background-color", "#CC0000");
				break;
			case "Stayed":
				$("#th" + i + " .pName").css("background-color", "#009900");
				break;
			case "Moved":
				$("#th" + i + " .pName").css("background-color", "#0066cc");
				break;

			default:

			}

		//CLICK FUNCTION
		$("#th" + i).click(function () {
				//console.log(allData[$(this).attr("data-id")].link);
				//window.open(allData[$(this).attr("data-id")].link, '_blank');
				showInfo($(this).attr("data-id"));
		})


	}

	$(".item").css("margin-right", "0px");
	//$("#gridCon").css("justify-content", "space-between");


	resizeItems();


}

function imgError(image) {
	//console.log("error" + which.src)
	image.onerror = "";
  image.src = "images/0.jpg";
  return true;
}

function showInfo(which) {
	$("#infoImg").html("<img src='" + allData[which].image + "' class='img-fluid' />");
	$("#infoText").html("Title: " + allData[which].material + "<br/>Type: " + allData[which].type + "<br/><br/>Challenge: " + allData[which].challenge + "<br/><br/>Reponse: " + allData[which].response);
	$("#infoWin").show();

}

function resizeItems() {
		dWidth = $(document).width();
		if (dWidth >= 300) {
			cols = 3;
		}
		if (dWidth >= 400) {
			cols = 3;
		}
		if (dWidth >= 500) {
			cols = 3;
		}
		if (dWidth >= 600) {
			cols = 5;
		}
		if (dWidth >= 800) {
			cols = 6;
		}
		if (dWidth >= 1000) {
			cols = 8;
		}
		if (dWidth >= 1200) {
			cols = 8;
		}
		if (dWidth >= 1400) {
			cols = 10;
		}


		$(".item").css("width", Math.floor(dWidth/cols)-10);
		if (dWidth > 500) {
			$(".th").css("height", $(".item").width()/3 * 7);
		} else {
			$(".th").css("height", $(".item").width()/3 * 7.6);
		}



		setTimeout(function(){ xtalk.signalIframe(); }, 2000);



}


$(document).ready(function(){
	init();
});
