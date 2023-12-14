var totalEntries;
var allData;
var myparent = "";
var dWidth;
var cols = 1;

var config;

var sheets = [];

function init() {
	//console.log("ready");
	$(".pages").hide();

	sheets[0] = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR8qvXWYomhoqsNT_wJxWdxAt5gpm-hnjWkcPJ4tckHsd4KuBY3RFH63gzKLzoR9uD1kb60qMlh-VKO/pub?gid=277823606&single=true&output=csv";

	config = buildConfig();

	dWidth = $(document).width();

	$( window ).resize(function() {
		resizeItems();
	});

	myparent = xtalk.parentDomain;
	if (myparent == undefined || myparent == null || myparent == "" || myparent == "https://ots.nbcwpshield.com/" || myparent == "http" ) {
		myparent = "https://www.nbcdfw.com/";
	}

	loadData(0);

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
												"<p class='pName'>" + allData[i].name + "</p>" +
												"<p class='pRole'>" + allData[i].bio + " died on " + allData[i].died + " at the age of " + allData[i].age + ".&nbsp; <a href='" + myparent + allData[i].link + "' target='_blank'>Full story</a></p>" +
												"</div>");
		//CLICK FUNCTION
		$("#th" + i).click(function () {
				//console.log(allData[$(this).attr("data-id")].link);
				window.open(myparent + allData[$(this).attr("data-id")].link, '_blank');
		});


	}

	$(".item").css("margin-right", "0px");
	//$("#gridCon").css("justify-content", "space-between");

	resizeItems();

}

function imgError(image) {
	//console.log("error" + which.src)
	image.onerror = "";
  image.src = "";
  return true;
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
			cols = 6;
		}
		if (dWidth >= 1200) {
			cols = 6;
		}
		if (dWidth >= 1400) {
			cols = 8;
		}


		$(".item").css("width", Math.floor(dWidth/cols)-10);
		if (dWidth > 500) {
			$(".th").css("height", $(".item").width()/3 * 3.9);
		} else {
			$(".th").css("height", $(".item").width()/3 * 5.5);
		}


		setTimeout(function(){ xtalk.signalIframe(); }, 2000);

}


$(document).ready(function(){
	init();
});
