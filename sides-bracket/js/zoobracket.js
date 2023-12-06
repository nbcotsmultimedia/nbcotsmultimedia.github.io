var ds;
var totalEntries;
var allData;
var config;


function init() {
	console.log("ready");
	config = buildConfig();

	loadData();




}

function scrollToPos(where) {
	switch (where) {
		case "afcwc":
			$('#wrapper').animate({ scrollLeft: 0 }, 500);
			break;
		case "afcdv":
			$('#wrapper').animate({ scrollLeft: 100 }, 500);
			break;
		case "afcch":
			$('#wrapper').animate({ scrollLeft: 200 }, 500);
			break;
		case "sb":
			$('#wrapper').animate({ scrollLeft: 350 }, 500);
			break;
		case "nfcch":
			$('#wrapper').animate({ scrollLeft: 500 }, 500);
			break;
		case "nfcdv":
			$('#wrapper').animate({ scrollLeft: 650 }, 500);
			break;
		case "nfcwc":
			$('#wrapper').animate({ scrollLeft: 800 }, 500);
			break;



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

function loadData() {

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vSxyR34JWjs33XwXE-qEi_u86hfz8NbARkcCl1mIHnNSXze-L2fddnWF45Rm2iPRy8-R1oafg75EX6j/pub?gid=0&single=true&output=csv', {
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

	/*for (var j=0; j<$len; j++) {
		var counter = ds.column("id").data[j];
		allData[counter] = [ {
								myid: ds.column("id").data[j],
								image: ds.column("image").data[j],
								caption: ds.column("caption").data[j],
								credit: ds.column("credit").data[j]
						    }];
	}*/

	buildBracket();

	//do something
	//console.log(allData[i][0].myid);

}

function buildBracket() {

	for (var i=0; i<15; i++) {
			$("#g" + i).html("<div class=\"team\">" +
										"<div class='tgrp'><span class=\"seed\">" + allData[i].top_seed + "</span> " + allData[i].top_team + "</div>" +
										"<div class='tgrpb'><span class=\"seed\">" + allData[i].bot_seed + "</span> " + allData[i].bot_team + "</div>" +

										"</div>");
	}
}

$(document).ready(function(){
	init();
});
