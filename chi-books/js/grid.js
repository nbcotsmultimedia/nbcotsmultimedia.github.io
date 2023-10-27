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

var currentMaterial = 0;
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

	$("#nextBtn").click( function() {
		next();
	});
	$("#prevBtn").click( function() {
		prev();
	});
	$("#closeBtn").click( function() {
		$("#infoWin").hide();
		$("#gridCon").css("opacity", 1);
	})

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

		$("#gridCon").append("<div class='item' id='th" + i + "' data-id='" + i + "' data-o='" + allData[i].outcome + "' data-f='" + allData[i].facility_name + "'>" +
												"<div class='th'><img id='img" + i + "'src='" + allData[i].image + "' width='100%' alt='thumb' onerror='imgError(this);' />" +
												"<p class='pName'>" + allData[i].material + "</p>"+
												"<p class='facility'>" + allData[i].facility_name + "</p>" +
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

	$("#s0").on('change', function() {
		if ($("#k0").prop('checked')) {
				$( ".item[data-o='Stayed']" ).show();
		} else {
				$( ".item[data-o='Stayed']" ).hide();
		}
		showCount();
	});
	$("#s1").on('change', function() {
		if ($("#k1").prop('checked')) {
				$( ".item[data-o='Removed']" ).show();
		} else {
				$( ".item[data-o='Removed']" ).hide();
		}
		showCount();
	});
	$("#s2").on('change', function() {
		console.log($("#k2").prop('checked'))
		if ($("#k2").prop('checked')) {
				$( ".item[data-o='Moved']" ).show();
		} else {
				$( ".item[data-o='Moved']" ).hide();
		}
		showCount();
	});
	$("#s3").on('change', function() {
		if ($("#k3").prop('checked')) {
				$( ".item[data-o='Unclear']" ).show();
		} else {
				$( ".item[data-o='Unclear']" ).hide();
		}
		showCount();
	});

	$("#searchBtn").click (function() {
		var input = $("#searchF").val();
		$(".item").hide();
		$( ".item[data-f*='" + input + "']" ).show();
		showCount();
	});

	showCount();
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
	$("#infoText").html("<p class='bookTitle'> " + allData[which].material + "</p>" +
											"<p class='bookInfo'><em>" + allData[which].author + "</em></p>" +
											"<p class='bookInfo'><b>Type:</b> " + allData[which].type + "</p>" +
											"<p class='bookInfo'><b>Outcome: </b>" + allData[which].outcome + "</p>" +
											"<p class='bookInfo'><b>Library or School District: </b>" + allData[which].facility_name + " (" + allData[which].location + ")</p>" +
											"<p class='bookInfo'><b>Challenge:</b> " + allData[which].challenge + "</p>" +
											"<p class='bookInfo'><b>Reponse:</b> " + allData[which].response) + "</p>";
	$("#infoWin").show();
	currentMaterial = which;

	$("#gridCon").css("opacity", .25);
}

function showCount() {
	$("#countDisp").text("Showing " + $('.item:visible').length + " items");
}

function next() {
	if (currentMaterial < totalEntries) {
		currentMaterial ++;
		showInfo(currentMaterial)
	}
}

function prev() {
	if (currentMaterial > 0) {
		currentMaterial --;
		showInfo(currentMaterial);
	}
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
