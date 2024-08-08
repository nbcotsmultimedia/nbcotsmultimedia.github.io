var totalEntries;
var allData;
var myparent = "";
var dWidth;
var cols = 1;

var config;

var sheets = [];

var allSports = [];

var colorDropVal = "All";
var sportDropVal = "All"

function init() {
	//console.log("ready");
	$(".pages").hide();
	$("#vidCon").hide();

	$("#closeBtn").click(function() {
		$("#gridCon").css("opacity", 1);
		$("#vidCon").hide();
	})


	sheets[0] = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSFoxPgZ39rGRimNJQxkpPo4Gt3RNxmg0Tw4pxU8kccHAv2ZRXvxpIub6YYHOJzJYoO74Qx5i3MYYse/pub?gid=1439609260&single=true&output=csv";

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

	createSportsDrop();

	$( "#gridCon").animate( { opacity: 0 }, 500, function() {
		generateGrid();
	});


}

function generateGrid() {

	$("#gridCon").html("");
	$("#gridCon").css("opacity", 1);

	for (var i=0; i<totalEntries; i++) {

		var watchTxt;
		if (dWidth < 500) {
			watchTxt = "&#9658";
		}  else {
			watchTxt = "&#9658 Watch";
		}

		$("#gridCon").append("<div class='item' id='th" + i + "' data-id='" + i + "' data-gid='" + (i+1) + "' data-color='all_" + allData[i].medal.toLowerCase() + "' data-sport='All_" + allData[i].sport + "' data-tmp='0'>" +
												"<div class='th'><div class='thcon'><img id='img" + i + "'src='" + allData[i].image + "' width='100%' alt='thumb' onerror='imgError(this);' /><div class='watchBtn' data-id='" + i + "'>" + watchTxt +  "</div></div>" +
												"<p class='pName'>" + allData[i].name + "</p>" +
												"<p class='pRole'>" + allData[i].medal.toUpperCase() + " - " + allData[i].sport + ", " + allData[i].event + "</p>" +
												"</div>");
		//CLICK FUNCTION
		/*$("#th" + i).click(function () {
				//console.log(allData[$(this).attr("data-id")].link);
				window.open(myparent + allData[$(this).attr("data-id")].link, '_blank');
		});*/

		//WATCH BTN
		if (allData[i].mediatype != "video") {
			$("#th" + i + " .th .thcon .watchBtn").hide();
		}

		//COLOR BAND
		switch (allData[i].medal) {
			case "gold":
				$("#th" + i + " .th .thcon").css("border-bottom", "5px solid #ffcc00")
				break;
			case "silver":
				$("#th" + i + " .th .thcon").css("border-bottom", "5px solid #999999")
				break;
			case "bronze":
				$("#th" + i + " .th .thcon").css("border-bottom", "5px solid #b4821e")
				break;
		}
	}
	
	$(".watchBtn").click(function() {
		watchHighlight($(this).attr("data-id"));
	});

	$(".item").css("margin-right", "0px");
	//$("#gridCon").css("justify-content", "space-between");

	resizeItems();
	showCount();

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
			cols = 5;
		}
		if (dWidth >= 1000) {
			cols = 5;
		}
		if (dWidth >= 1200) {
			cols = 5;
		}
		if (dWidth >= 1400) {
			cols = 5;
		}


		$(".item").css("width", Math.floor(dWidth/cols)-10);
		var vHeight = Math.ceil(($(".item").width() / 16) * 9);
		$(".thcon").css("height", vHeight);

		if (dWidth > 500) {
			$(".th").css("height", $(".item").width()/3 * 2.75);
		} else {
			$(".th").css("height", $(".item").width()/3 * 4.3);
		}


		setTimeout(function(){ xtalk.signalIframe(); }, 2000);

}

function createSportsDrop() {
	for (var i=0; i<totalEntries; i++) {
		allSports[i] = allData[i].sport;
	}
	
	//const uniqueArr = jQuery.uniqueSort(allSports)
	const uniqueArr = [...new Set(allSports)];
	uniqueArr.sort();

	for (var j=0; j<uniqueArr.length; j++) {
		$("#sportDrop").append("<option class=\"dropdown-item\">" + uniqueArr[j] + "</option>")
	}

}

function getDropVals() {
	colorDropVal = $("#colorDrop").val();
	sportDropVal = $("#sportDrop").val();
	filterMedals();
}

function filterMedals() {
	$(".item").hide();
	$(".item").css("opacity", 0);

	var tmpcount = 0;
	$( ".item[data-color*='" + colorDropVal.toLowerCase() + "'][data-sport*='" + sportDropVal + "']" ).show().animate({ opacity: 1 }, 1000, function() { $(this).attr("data-tmp", tmpcount); tmpcount++;  } );

	//$( ".item[data-o='" + $(this).attr("data-outcome") + "'][data-f*='" + $("#searchF").val().toLowerCase() + "']" ).show();
	//$( ".item[data-incident*='" + val + "']" ).attr("data-tmp", "100");

	showCount();

}

function showCount() {
	//$("#showing").html("Showing " + $('.item:visible').length + " items | " + "<a class='shall' href='javascript:showAll()'>Show all</a>");
	$("#showing").html("Showing " + $('.item:visible').length + " medals");
	xtalk.signalIframe();
}

function watchHighlight(which) {
	$("#gridCon").css("opacity", .2);
	$("#vidCon").show();

	if ($(document).height() - $("#th" + which).position().top  < 400) {
		$("#vidCon").css("top", $("#th" + which).position().top -300)
	} else {
		$("#vidCon").css("top", $("#th" + which).position().top -20);
	}

	var theHeight = Math.ceil(($("#vidCon").width() / 16) * 9);

	$("#theVideo").html("<iframe src='" + allData[which].mediaurl + "' width='100%' height='" + theHeight + "' scrolling='no' frameborder='0'></iframe>")

}

$(document).ready(function(){
	init();
});
