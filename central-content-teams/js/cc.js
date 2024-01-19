var ds;
var totalEntries;
var allData;
var config;
var currentThumb = 0;
var counter = 0;

var starter;

var nbc = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbhhcadzDRzmVpf4H-AGGoksaov6RUXzeY1CrJnmtvi8xiyTVjO_tuCmoYhGY8SD1MkP74tYlc4YJg/pub?gid=495244935&single=true&output=csv";
var tlmd = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbhhcadzDRzmVpf4H-AGGoksaov6RUXzeY1CrJnmtvi8xiyTVjO_tuCmoYhGY8SD1MkP74tYlc4YJg/pub?gid=0&single=true&output=csv";
var lead = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbhhcadzDRzmVpf4H-AGGoksaov6RUXzeY1CrJnmtvi8xiyTVjO_tuCmoYhGY8SD1MkP74tYlc4YJg/pub?gid=285289146&single=true&output=csv";
var aud = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbhhcadzDRzmVpf4H-AGGoksaov6RUXzeY1CrJnmtvi8xiyTVjO_tuCmoYhGY8SD1MkP74tYlc4YJg/pub?gid=1032593897&single=true&output=csv";
var dl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbhhcadzDRzmVpf4H-AGGoksaov6RUXzeY1CrJnmtvi8xiyTVjO_tuCmoYhGY8SD1MkP74tYlc4YJg/pub?gid=586000388&single=true&output=csv";


function init() {
	//console.log("ready");

	$("#cardPic,#fName,#lName,#pInfo").css("opacity", 0);


	config = buildConfig();

	starter = getParams("s");

	switch (starter) {
		case "tlmd":
			loadData(tlmd);
			break;
		case "nbc":
			loadData(nbc);
			break;
		case "lead":
			loadData(lead);
			break;
		case "aud":
			loadData(aud);
			break;
		case "dl":
			loadData(dl);
			break;
		default:
			loadData(lead);
	}



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


function loadData(which) {

	Papa.parse(which, {
		download: true,
    header: true,
		config,
		complete: function(results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			parseData()
		}
	});

	switch (which) {
		case tlmd:
		$("#teamLabel").text("Telemundo National");
		$("#cardCon").css("background-image", "url('images/card-bg-t.jpg')");
		break;

		case nbc:
		$("#teamLabel").text("NBC National");
		$("#cardCon").css("background-image", "url('images/card-bg-n.jpg')");
		break;

		case lead:
		$("#teamLabel").text("Leadership and Specialty Teams");
		$("#cardCon").css("background-image", "url('images/card-bg-n.jpg')");
		break;

		case aud:
		$("#teamLabel").text("Audience Development");
		$("#cardCon").css("background-image", "url('images/card-bg-n.jpg')");
		break;

		case dl:
		$("#teamLabel").text("Digital Leads");
		$("#cardCon").css("background-image", "url('images/card-bg-n.jpg')");
		break;

	}

}

function parseData() {
	var $len = allData.length;
	totalEntries = $len;

	//do something
	//console.log(allData[i][0].myid);
	createGrid();

}

function createGrid() {

	$("#thumbsCon").html("");
	$("#mySelect").html("");

	for (i=0; i<totalEntries; i++) {
		$("#thumbsCon").append("<div class='thumb' id='c" + i + "' data-id='" + i + "'>" +
													 "<div class='' id='i" + i + "'><img src='" + allData[i].image + "' class='img-fluid' /></div>" +
													 "<p class='thLast'><strong>" + allData[i].first_name + " " + allData[i].last_name + "</strong><br/>" + allData[i].title + "</p>" +
													 "</div>");

		$("#mySelect").append($("<option class='dropdown-item' value='" + i + "'></option>").html(allData[i].first_name + " " + allData[i].last_name + " " + allData[i].title));

		$(".thumb").css("opacity", 0);

	}

	//var thHeight = Math.ceil(($(".thumb").width() / 3) * 4);
	//$(".thMask").css("height", thHeight);

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
	$("#fName").text(allData[which].first_name);
	$("#lName").text(allData[which].last_name);
	$("#pInfo").html("<div class='stat'><span class='bolder'>Title: </span>" + allData[which].title + "</div>" +
 									 "<div class='stat'><span class='bolder'>Phone: </span>" + allData[which].phone + "</div>" +
									 "<div class='stat'><span class='bolder'>Slack: </span>" + allData[which].slack + "</div>" +
									 
									 "<div class='stat'><span class='bolder'>Location: </span>" + allData[which].location + "</div>");



	$("#cardPic,#fName,#lName,#pInfo").animate({
    opacity: 1
  }, 500, function() {
    // Animation complete.
  });

	setTimeout(resizeFrame, 2000);


}

function getParams(k){
  var p = {};
  location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(s,k,v){p[k]=v})
	return k?p[k]:p;
}

function resizeFrame() {
	xtalk.signalIframe()
}


$(document).ready(function(){
	init();
});
