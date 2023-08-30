var ds;
var totalEntries;
var allData;
var config;

var playerMode = "";
var currentQ = 1;

function init() {
	//console.log("ready");

	$("#q4a").hide();
	$("#q4b").hide();

	$("#q2").hide();
	$("#q3").hide();

	$("#resultCon").hide();

	$("#playerYesBtn").click(function(){
		playerMode = "y";
		showNextQ();
	});

	$("#playerNoBtn").click(function(){
		playerMode = "n";
		showNextQ();
	});

	$(".dn").click(function(){
		showNextQ();
	});

	$(".dn2").click(function(){
		getChoices("None");
	});

	$("#againbtn").click(function(){
		playerMode = "";
		currentQ = 1;
		$("#resultCon").hide();
		$("#q1").show();

	});


	/*
	$('input[name=q_player]').change(function(){
		if ($( 'input[name=q_player]:checked' ).val() == "yesplayer") {
			$("#q4a").show();
			$("#q4b").hide();
		} else {
			$("#q4a").hide();
			$("#q4b").show();
			getChoices("None");
		}

	});
	*/

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

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vSmlX3sFBujVKXifztFYKwx2XJ-9aORQPbgJz0iM2DG0s2nigs41pLHAlFtzS2X8saKSkeOCEZHPYMd/pub?gid=0&single=true&output=csv', {
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

function parseData() {
	var $len = allData.length;
	totalEntries = $len;

	//TO ACCESS DATA
	//console.log(allData[0].col_name_from_csv);

}

function showNextQ() {
	$("#q" + currentQ).hide();
	currentQ ++;
	if (currentQ < 4) {
		$("#q" + currentQ).show();
	} else {
		if (playerMode == "y") {
			$("#q4a").show();
			$("#q4b").hide();
		} else {
			$("#q4a").hide();
			$("#q4b").show();
		}

	}
}

function getChoices(which) {
	$("#q4a").hide();
	$("#q4b").hide();

	var tmpChoices = [];

	for (var i=0; i<totalEntries; i++) {
		//console.log(allData[i].player + "//" +  which)
		if (allData[i].player == which) {
			tmpChoices.push(allData[i].teamname)
		}
	}
	//console.log(tmpChoices)
	var randomNum = Math.floor(Math.random() * tmpChoices.length);
	$("#result").text(tmpChoices[randomNum]);
	$("#resultCon").show();
}

function getPlayer() {
	var currentPlayer = $("#playerdrop option:selected").text();
	getChoices(currentPlayer);
	//console.log(currentPlayer)

}


$(document).ready(function(){
	init();
});
