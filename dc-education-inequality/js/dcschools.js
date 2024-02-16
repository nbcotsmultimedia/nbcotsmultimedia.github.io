var docWidth = $(document).width();

var config;
var allData;
var totalEntries;

function init() {
	//console.log("ready");
	config = buildConfig();

	loadData();




	$("#backTo").click (function() {
		$(".thCon").show();
		$("#theText").scrollTop(0);
		fadeInThumbs();
		xtalk.signalIframe();
	})


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
	Papa.parse(sheet, {
		download: true,
    header: true,
		config,
		complete: function(results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			//console.log("Data loaded" + allData)
			parseData();
		}
	});
}

function parseData() {
	var $len = allData.length;
	totalEntries = $len;

	var prompt = "";

	for (var i=0; i<totalEntries; i++) {

		if (allData[i].type == "video") {
			prompt = "Watch";
		} else {
			prompt = "Watch";
		}

		$("#theNav").append("<div class=\"thCon\" id=\"th" + i + "\" data-type=\"" + allData[i].type + "\">" +
												"<img src=\"" + allData[i].thumb_url + "\" class=\"img-fluid\" />" +
												"<p class=\"name\">" + allData[i].title + "</p>" +
												"<p class=\"quote\">" + allData[i].desc + "</p>" +
												"<p style=\"text-align: center\"><button class=\"btn btn-primary\" id=\"btn0\">" + prompt + "</button></p></div>");
	}

	fadeInThumbs();


}

function fadeInThumbs() {
	$("#contentCon").hide();
	$("#vidCon").empty();
	$("#theText").empty();

  	for (let i = 0; i < totalEntries; i++) {
		const delay = i * 500;
		$("#th"+i).delay(delay).animate({
			opacity: 1, top: 0
		}, 1000);

		$("#th"+i).click(function() {
			showStory(i);
		});

	}

	//setTimeout(function(){ xtalk.signalIframe(); }, 2000);


}

function showStory(which) {
	console.log("link")
	window.open(allData[which].link, 'blank');
	/*$("#th0" ).animate({
    opacity: 0,
		top: "+=100"
  }, 750);
	$("#th1" ).animate({
    opacity: 0,
		top: "+=100"
  }, 750);

	$("#th2" ).animate({
    opacity: 0,
		top: "+=100"
  }, 750, function() {
    //$(".thCon").hide();
		loadStory(which);
  });


	xtalk.signalIframe();*/


}

function loadStory(which) {
	if (docWidth < 500) {
		if (which == 0) {
			$("#contentCon").css("top", "0px");
		}
		if (which == 1) {
			$("#contentCon").css("top", "100px");
		}
		if (which == 2) {
			$("#contentCon").css("top", "450px");
		}
	}

	$("#contentCon").show();
	$("#contentCon").css("opacity", 0);

	//POPULATE TEXT
	$("#title").text(allData[which].title);
	$("#theText").html(allData[which].storytext);

	//LOAD VIDEO
	/*
	$("#vidCon").empty();
	var vheight = Math.round(($("#vidCon").width() / 16) * 9);

	$("#vidCon").append("<iframe width=\"" + $("#vidCon").width() + "\" height=\"" + vheight+ "\" scrolling=\"no\" id=\"nbcLMP11323831570\" allowfullscreen=\"true\" webkitallowfullscreen=\"true\" mozallowfullscreen=\"true\" src=\"https://www.nbcsandiego.com/video-layout/amp_video/?noid=" + allData[which].cmsid + "&amp;videoID=" + allData[which].videoid + "&amp;origin=nbcsandiego.com&amp;fullWidth=y&amp;turl=nbcsandiego.com&amp;ourl=x&amp;lp=5&amp;fullWidth=y&amp;random=23msg&amp;callletters=knsd&amp;embedded=true\" style=\"border: none;\"></iframe>");
	*/

	$("#contentCon" ).delay(750).animate({
    opacity: 1
  }, 500, function() {
    xtalk.signalIframe();
  });


}





$(document).ready(function(){
	init();
});
