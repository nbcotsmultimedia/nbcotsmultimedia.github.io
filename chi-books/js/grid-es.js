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

var maxDisp = 36;
var pages;
var currentPage = 0;

var intros = [];
var sheets = [];
var currentCity = "";

function init() {
	//console.log("ready");
	$(".pages").hide();

	sheets[0] = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRV6g5gNJrWDap55aDZypNei_1xZ1CkZN-iEpBCPP7j50ui0snzcuXLPtzHEsJc--26N4QTxaqpc6R0/pub?gid=190874&single=true&output=csv";
	sheets[1] = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRV6g5gNJrWDap55aDZypNei_1xZ1CkZN-iEpBCPP7j50ui0snzcuXLPtzHEsJc--26N4QTxaqpc6R0/pub?gid=390698012&single=true&output=csv";
	sheets[2] = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRV6g5gNJrWDap55aDZypNei_1xZ1CkZN-iEpBCPP7j50ui0snzcuXLPtzHEsJc--26N4QTxaqpc6R0/pub?gid=342884819&single=true&output=csv";

	intros[0] = "El 11 de septiembre de 2001, el vuelo 11 de American Airlines impactó la Torre Norte del World Trade Center en el Bajo Manhattan a las 8:46 a.m. Un segundo avión, el vuelo 175 de United, se estrelló a las 9:03 a.m. y en menos de 90 minutos ambas torres se derrumbaron y 2,753 personas murieron.1 Al día de hoy, todavía quedan 1,100 víctimas por ser identificadas.";
	intros[1] = "Cerca de una hora después de que el segundo avión se estrelló contra el World Trade Center, en Nueva York, un tercero golpeó el oeste del Pentágono a las 9:37 a.m. La nave impactó el primer piso y produjo una llamarada que terminó con 184 vidas. En el sitio se erigió un monumento a las víctimas, que abrió en el 2008.";
	intros[2] = "Los pasajeros a bordo del vuelo 93 de United sabían que Estados Unidos estaba bajo ataque luego de que otras naves se estrellaran contra las Torres Gemelas y el Pentágono. Se piensa que los secuestradores de ese vuelo pretendían ir contra el Capitolio Federal o la Casa Blanca cuando los pasajeros intentaron someterlos y tomar control de la nave. Uno de ellos se escuchó a través de una comunicación cuando dijo “¿están listos? Adelante”. Poco después el avión se estrelló en Shanksville, Pensilvania, con un saldo de 40 muertos, entre tripulación y viajeros.";

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

	$("#nybtn").click(function() {
		currentCity = "ny";
		$(this).addClass("active");
		$("#dcbtn").removeClass("active");
		$("#pabtn").removeClass("active");
    loadData(0);
	});

	$("#dcbtn").click(function() {
		currentCity = "dc";
		$(this).addClass("active");
		$("#nybtn").removeClass("active");
		$("#pabtn").removeClass("active");
		loadData(1);

	});

	$("#pabtn").click(function() {
		currentCity = "pa";
		$(this).addClass("active");
		$("#nybtn").removeClass("active");
		$("#dcbtn").removeClass("active");
	  loadData(2);
	});

}


function loadData(which) {
	//https://docs.google.com/spreadsheets/d/e/2PACX-1vRBdmU-W1PcIqRlhOibsgrqZaEo3Q87fwgBW-Yf7-G2zi8vPoe6PSNXtJ1prZPToa9OgFktSrmXUxl4/pub?gid=0&single=true&output=csv
	Papa.parse(sheets[which], {
		download: true,
    header: true,
		config,
		complete: function(results) {
			//console.log("Finished:", results.data);
			allData = results.data;
			currentPage = 0;
			parseData();
			$("#intro").text(intros[which]);
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
	pages = Math.ceil(totalEntries/maxDisp);

	$( "#gridCon").animate( { opacity: 0 }, 500, function() {
		generateGrid();
	});


}

function generateGrid() {

	$("#gridCon").html("");
	$("#gridCon").css("opacity", 1);

	var startWith = currentPage * maxDisp;
	var endWith = startWith + maxDisp;
	if (endWith > totalEntries) {
		endWith = totalEntries;
	}
	//console.log("S " + startWith);
	//console.log("E " + endWith);

	$(".tPages").text((currentPage + 1) + " of " + pages);

	for (var i=startWith; i<endWith; i++) {

		var theName = "";
		if (allData[i].beyond == "N/A") {
			theName = allData[i].name;
		} else {
			theName = "<a href='" + allData[i].beyond + "' target='_blank'>" + allData[i].name+ "</a>";
		}

		$("#gridCon").append("<div class='item' id='th" + i + "' data-id='" + i + "' data-gid='" + (i+1) + "'>" +
												"<div class='th'><img id='img" + i + "'src='" + allData[i].image + "' width='100%' alt='thumb' onerror='imgError(this);' />" +
												"<div class='adopted'></div></div>" +
												"<p class='pName'>" + theName + "</p>" +
												"<p class='pRole'>Edad: " + allData[i].age + "</p>" +
												"<p class='pRole fromWhere'>De: " + allData[i].city + "</p>" +

												"</div>");

												$("#th" + i + " img").on('load',function(){
										        if ($(this).width() > $(this).height() ) {
															//console.log("width greater than height");

															$(this).height($(".th").height());
															$(this).width("auto");
															$(this).css("position", "relative");
															$(this).css('left', ($(".item").width() - $(this).width()) / 2)
														}

														if ($(this).width() <= $(this).height()) {
															//$(this).width("auto");
															$(this).height($(".th").height());
														}

										    });



		//CLICK FUNCTION
		/*$("#th" + i).click(function () {
				//console.log(allData[$(this).attr("data-id")][0].link);
				//window.open(allData[$(this).attr("data-id")].link, '_blank');
		});*/


	}

	$(".pages").show();

	$( "p:contains('N/A')" ).css( "display", "none" );

	if (currentCity == "dc") {
			$(".fromWhere").hide();
	}


	if (endWith - startWith < 5) {
		$(".item").css("margin-right", "10px");
		$("#gridCon").css("justify-content", "start");
		//console.log("less than 5");

	} else {
			$(".item").css("margin-right", "0px");
		$("#gridCon").css("justify-content", "space-between");
		//console.log("more than 5");
	}


	resizeItems();


}

function nextPage() {
	if (currentPage < (pages-1)) {
		currentPage ++;
		generateGrid();
	}
}

function prevPage() {
	if (currentPage > 0) {
		currentPage --;
		generateGrid();
	}
}

function imgError(image) {
	//console.log("error" + which.src)
	image.onerror = "";
  image.src = "images/0.jpg";
  return true;
}

function resizeItems() {
		dWidth = $(document).width();
		if (dWidth >= 300) {
			cols = 4;
		}
		if (dWidth >= 400) {
			cols = 4;
		}
		if (dWidth >= 500) {
			cols = 4;
		}
		if (dWidth >= 600) {
			cols = 5;
		}
		if (dWidth >= 800) {
			cols = 6;
		}
		if (dWidth >= 1000) {
			cols = 9;
		}
		if (dWidth >= 1200) {
			cols = 9;
		}
		if (dWidth >= 1400) {
			cols = 10;
		}
		if (dWidth < 500) {
			$("#nybtn").text("NYC");
			$("#dcbtn").text("Pentágono");
			$("#pabtn").text("Shanksville");
			$("#navCon").css("width", "285px")
		}


		$(".item").css("width", Math.floor(dWidth/cols)-10);
		$(".th").css("height", $(".item").width()/3 * 3.5);

		rows = Math.ceil(totalEntries/cols);
		//console.log("number of rows " + Math.ceil(totalItems/cols));
		//console.log("to fill out, there should be " + rows * cols);
		var toFill = rows * cols;
		//console.log("missing " + (toFill - totalEntries) )
		var missing = toFill - totalEntries;
		//console.log(missing + "Miss")

		if (missing > 0) {
			for (var j=0; j<missing; j++) {
				//$("#gridCon").append("<div class='item'></div>");
			//	totalEntries ++;
			}
			//resizeItems();
		}

		//CREATE EMPTY DIV FOR LAST ROW INSERTION
		if (initRun) {
			//$("#extra").append("<div class='tmp' id='th" + (cols * rows) + "'></div>");
			initRun = false;
		}

		setTimeout(function(){ xtalk.signalIframe(); }, 2000);



}


$(document).ready(function(){
	init();
});
