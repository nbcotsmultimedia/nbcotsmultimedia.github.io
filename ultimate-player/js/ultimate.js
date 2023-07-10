var ds;
var totalEntries;
var allData;
var config;
var currentPlayer = 0;

var valHead = 0;
var valTorso = 0;
var valLegs = 0;
var valRf = 0;
var valLf = 0;
var playerRating = 0;

var headHeader = "";
var torsoHeader = "";
var legsHeader = "";
var rfHeader = "";
var lfHeader = "";

var inArticle;

var dWidth;

function init() {
	//console.log("ready");
	dWidth = $(document).width();

	var myparent = xtalk.parentDomain;
	if (myparent == undefined || myparent == null || myparent == "" || myparent == "http" ) {
		inArticle = false;
	} else {
		inArticle = true;
	}
	console.log(myparent)
	console.log(inArticle)

	if (lang == "eng") {
		headHeader = "Head";
		torsoHeader = "Torso";
		legsHeader = "Legs";
		rfHeader = "Right Foot";
		lfHeader = "Left Foot";
	} else {
		headHeader = "Cabeza";
		torsoHeader = "Torso";
		legsHeader = "Piernas";
		rfHeader = "Pie derecho";
		lfHeader = "Pie izquierdo";
	}

	config = buildConfig();

	loadData();

	$("#saveImage").hide();
	$("#saveImage").click (function() {
		downloadImage();
	});

	$("#nbcLogo").hide();
	$("#tLogo").hide();

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

	Papa.parse('https://docs.google.com/spreadsheets/d/e/2PACX-1vSmqbrIDBePFcZtOl0-ckTirl1a2ySfNWNqMQIa3yN52CWgFw0gWOliNIoXKUkS_gbklNKBLiqCCl6T/pub?gid=0&single=true&output=csv', {
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
	createNames();

}

function createNames() {
	for (var i=0; i<totalEntries; i++) {
		$("#allNames").append("<div class='pName' id='p" + i + "' data-id='" + i + "'>" + allData[i].name + "</div>");
		$("#pdrop").append("<option value=\"" + i + "\">" + allData[i].name + "</option>");
	}

	$(".pName").click(function() {
		//console.log($(this).attr("data-id"));
		showParts($(this).attr("data-id"));
	});

	showParts(0);
}

function showParts(which) {
	$("#p" + currentPlayer).removeClass("bgHigh" + currentPlayer);

	currentPlayer = which;

	$("#p" + which).addClass("bgHigh" + which);

  var headText = "";
	var torsoText = "";
	var legsText = "";
	var rfText = "";
	var lfText = "";

	var selectText = "";

	if (lang == "eng") {
		headText = allData[which].head;
		torsoText = allData[which].torso;
		legsText = allData[which].legs;
		rfText = allData[which].right_foot;
		lfText = allData[which].left_foot;

		selectText = "Select";

	} else {
		headText = allData[which].head_esp;
		torsoText = allData[which].torso_esp;
		legsText = allData[which].legs_esp;
		rfText = allData[which].right_foot_esp;
		lfText = allData[which].left_foot_esp;

		selectText = "Selecciona";
	}

	$("#allParts").html("");
	$("#allParts").append("<div class='partCon' id='pc0'>" +
												"<div class='dottedCircle'><img src='images/" + allData[which].imgpre + "-head.png' class='img-fluid' />" + "</div>" +
												"<div class='partsRight'>" +
												"<p class='partName'>" + headHeader + "</p>" +
												"<p class='partDesc'>" + headText + "</p>" +
												"<div id='s0' class='selBtn' data-id='0' data-part='head'>" + selectText + "</div></div></div>" +

												"<div class='partCon' id='pc1'>" +
												"<div class='dottedCircle'><img src='images/" + allData[which].imgpre + "-torso.png' class='img-fluid' />" + "</div>" +
												"<div class='partsRight'>" +
												"<p class='partName'>" + torsoHeader + "</p>" +
												"<p class='partDesc'>" + torsoText + "</p>" +
												"<div id='s1' class='selBtn' data-id='1' data-part='torso'>" + selectText + "</div></div></div>" +

												"<div class='partCon' id='pc2'>" +
												"<div class='dottedCircle'><img src='images/" + allData[which].imgpre + "-legs.png' class='img-fluid' />" + "</div>" +
												"<div class='partsRight'>" +
												"<p class='partName'>" + legsHeader + "</p>" +
												"<p class='partDesc'>" + legsText + "</p>" +
												"<div id='s2' class='selBtn' data-id='2' data-part='legs'>" + selectText + "</div></div></div>" +

												"<div class='partCon' id='pc3'>" +
												"<div class='dottedCircle'><img src='images/" + allData[which].imgpre + "-rf.png' class='img-fluid' />" + "</div>" +
												"<div class='partsRight'>" +
												"<p class='partName'>" + rfHeader + "</p>" +
												"<p class='partDesc'>" + rfText + "</p>" +
												"<div id='s3' class='selBtn' data-id='3' data-part='rf'>" + selectText + "</div></div></div>" +

												"<div class='partCon' id='pc4'>" +
												"<div class='dottedCircle'><img src='images/" + allData[which].imgpre + "-lf.png' class='img-fluid' />" + "</div>" +
												"<div class='partsRight'>" +
												"<p class='partName'>" + lfHeader + "</p>" +
												"<p class='partDesc'>" + lfText + "</p>" +
												"<div id='s4' class='selBtn' data-id='4' data-part='lf'>" + selectText + "</div></div></div>" +

												"");

		animateParts();

		$(".selBtn").click(function() {
			//console.log(allData[currentPlayer].imgpre + "//" + $(this).attr("data-id") + "//" + $(this).attr("data-part"));
		//	$("#bodyParts").append("<div id='placed" + $(this).attr("data-part") + "' class='placedParts'><img src='images/" + allData[currentPlayer].imgpre + "-" + $(this).attr("data-part") + ".png' /></div>");

			switch ($(this).attr("data-part")) {
				case "head":
					$("#placedhead").css("opacity", 0);
					$("#placedhead").html("<img src='images/" + allData[currentPlayer].imgpre + "-" + $(this).attr("data-part") + ".png' />");
					if (lang == "eng") {
						$("#labelhead").html(allData[currentPlayer].last_name + "'s " + headHeader);
					} else {
						$("#labelhead").html(headHeader + " de " + allData[currentPlayer].last_name);
					}
					$("#labelhead").append("<p><img src='images/" + allData[currentPlayer].head_rating + "stars.png' /></p>");
					$("#labelhead").css("display", "block");
					$("#placedhead").animate({ opacity: 1 }, 333 );
					valHead = Number(allData[currentPlayer].head_rating);
					break;
				case "torso":
					$("#placedtorso").css("opacity", 0);
					$("#placedtorso").html("<img src='images/" + allData[currentPlayer].imgpre + "-" + $(this).attr("data-part") + ".png' />");
					//$("#labeltorso").html(allData[currentPlayer].last_name + " " + torsoHeader);
					if (lang == "eng") {
						$("#labeltorso").html(allData[currentPlayer].last_name + "'s " + torsoHeader);
					} else {
						$("#labeltorso").html(torsoHeader + " de " + allData[currentPlayer].last_name);
					}
					$("#labeltorso").append("<p><img src='images/" + allData[currentPlayer].torso_rating + "stars.png' /></p>");
					$("#labeltorso").css("display", "block");
					$("#placedtorso").animate({ opacity: 1 }, 333 );
					valTorso = Number(allData[currentPlayer].torso_rating);
					break;
				case "legs":
					$("#placedlegs").css("opacity", 0);
					$("#placedlegs").html("<img src='images/" + allData[currentPlayer].imgpre + "-" + $(this).attr("data-part") + ".png' />");
					//$("#labellegs").html(allData[currentPlayer].last_name + " " + legsHeader);
					if (lang == "eng") {
						$("#labellegs").html(allData[currentPlayer].last_name + "'s " + legsHeader);
					} else {
						$("#labellegs").html(legsHeader + " de " + allData[currentPlayer].last_name);
					}
					$("#labellegs").append("<p><img src='images/" + allData[currentPlayer].legs_rating + "stars.png' /></p>");
					$("#labellegs").css("display", "block");
					$("#placedlegs").animate({ opacity: 1 }, 333 );
					valLegs = Number(allData[currentPlayer].legs_rating);
					break;
				case "rf":
					$("#placedrf").css("opacity", 0);
					$("#placedrf").html("<img src='images/" + allData[currentPlayer].imgpre + "-" + $(this).attr("data-part") + ".png' />");
					//$("#labelrf").html(allData[currentPlayer].last_name + " " + rfHeader);
					if (lang == "eng") {
						$("#labelrf").html(allData[currentPlayer].last_name + "'s " + rfHeader);
					} else {
						$("#labelrf").html(rfHeader + " de " + allData[currentPlayer].last_name);
					}
					$("#labelrf").append("<p><img src='images/" + allData[currentPlayer].rf_rating + "stars.png' /></p>");
					$("#labelrf").css("display", "block");
					$("#placedrf").animate({ opacity: 1 }, 333 );
					valRf = Number(allData[currentPlayer].rf_rating);
					break;
				case "lf":
					$("#placedlf").css("opacity", 0);
					$("#placedlf").html("<img src='images/" + allData[currentPlayer].imgpre + "-" + $(this).attr("data-part") + ".png' />");
					//$("#labellf").html(allData[currentPlayer].last_name + " " + lfHeader);
					if (lang == "eng") {
						$("#labellf").html(allData[currentPlayer].last_name + "'s " + lfHeader);
					} else {
						$("#labellf").html(lfHeader + " de " + allData[currentPlayer].last_name);
					}
					$("#labellf").append("<p><img src='images/" + allData[currentPlayer].lf_rating + "stars.png' /></p>");
					$("#labellf").css("display", "block");
					$("#placedlf").animate({ opacity: 1 }, 333 );
					valLf = Number(allData[currentPlayer].lf_rating);
					break;
			}

			calcRating();

		})
}

function calcRating() {
	if (valHead != 0 && valTorso != 0 && valLegs != 0 && valRf != 0 && valLf != 0) {
		playerRating = (valHead + valTorso + valLegs + valRf + valLf) / 5;
		if (lang == "eng") {
			$("#scoreText").text("YOUR ULTIMATE PLAYER RATING: " + playerRating);
		} else {
			$("#scoreText").text("PUNTAJE DE TU JUGADOR PERFECTO: " + playerRating);
		}
		$("#theStars").html("<div class='Stars' style='--rating: " + playerRating + ";' aria-label='star rating'></div>");

		$("#outline").css("opacity", 0);

		if (dWidth > 500) {
			$("#saveImage").show();
		}

		if (inArticle) {
			setTimeout(xtalk.signalIframe(), 1000);
		}

	}
}

function downloadImage() {

	 $("#yourSelections").hide();
	 $("#saveImage").hide();
	 $("#theStars").hide();
	 $(".Stars").hide();
 	 $("#scoreText").html("YOUR ULTIMATE PLAYER RATING<br><span class='sectHeadBig'>" + playerRating + " / 5</span>");

	 if (lang == "eng") {
		 $("#nbcLogo").show();
	 } else {
		 $("#tLogo").show();
	 }

	// $("#bodyParts").css("zoom", 1);
	// $("#bodyParts").css("width", "475px");


	 html2canvas($('#theBody')[0], {
		  width: 575,
		  height: 700,
			backgroundColor: "#333333"
		}).then(function(canvas) {
		  var a = document.createElement('a');
		  a.href = canvas.toDataURL("image/jpg");
		  a.download = 'my-ultimate-player.jpg';
		  a.click();

			$("#yourSelections").show();
	 	 	$("#saveImage").show();
			if (lang == "eng") {
				$("#scoreText").text("YOUR ULTIMATE PLAYER RATING: " + playerRating);
			} else {
				$("#scoreText").text("PUNTAJE DE TU JUGADOR PERFECTO: " + playerRating);
			}
			$("#theStars").show();
			$(".Stars").show();
			$("#nbcLogo").hide();
			$("#tLogo").hide();

			/*if (dWidth < 500) {
				$("#bodyParts").css("zoom", .66);
			} else {
				$("#bodyParts").css("width", "408px");
			}*/
		});

	 //$("#dlCanvas").append("<a href='#'' class='button' id='btn-download' download='my-file-name.jpg'>Download</a>");
	 //var toDL = getBase64Image(canvas);
	 //console.log(toDL)

	 var button = document.getElementById('btn-download');
 	 button.addEventListener('click', function (e) {
		   var dataURL = canvas.toDataURL('image/jpg');
			 dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
		   button.href = dataURL;
		 });
}

function getBase64Image(img) {
  var dataURL = img.toDataURL("image/jpg");
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function animateParts() {
	$("#pc0").animate({ opacity: 1, left: "50px" }, 333 );
	$("#pc1").delay(100).animate({ opacity: 1 }, 333 );
	$("#pc2").delay(200).animate({ opacity: 1 }, 333 );
	$("#pc3").delay(300).animate({ opacity: 1 }, 333 );
	$("#pc4").delay(400).animate({ opacity: 1 }, 333 );

	if (inArticle) {
		setTimeout(xtalk.signalIframe(), 1000);
	}
}

$(document).ready(function(){
	init();
});
