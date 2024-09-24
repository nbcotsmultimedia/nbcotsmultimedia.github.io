var extractedURL;
var callletters;
var partner = "";

function init() {
	//console.log("ready");
	$("#localSec").hide();
    //$("#partnerSec").hide();
      
    $(".showLocal").click(function() {
      $("#localSec").show();
      $("#partnerSec").hide();
    });

    $(".showPartner").click(function() {
      $("#localSec").hide();
      $("#partnerSec").show();
    });

    //FOR PARTNER VIDEOS
    $("#submitPartner").click(function () {
		var tmp1a;
	    var pattern;
		var srcIndex;

		if ($("#partnerCode").val().indexOf("nbcnews.com") > 0 || $("#partnerCode").val().indexOf("today.com")  > 0) {
			//console.log("nbc or today");
			partner = "NBCTODAY";
			$("#lead").show();
			tmp1a = $("#partnerCode").val().replace(/\'/g,"\"");
      		pattern = /"([^"]*)"/g;
			srcIndex = 3;
			
		} 

		if ($("#partnerCode").val().indexOf("msnbc.com")  > 0) {
			//console.log("MSNBC");
			partner = "MSNBC";
			$("#lead").hide();
			tmp1a = $("#partnerCode").val().replace(/\'/g,"\"");
      		pattern = /"([^"]*)"/g;
			srcIndex = 3;
			
		} 
		
		if ($("#partnerCode").val().indexOf("cnbc.com") > 0) {
			//console.log("CNBC");
			partner = "CNBC";
			$("#lead").hide();
			tmp1a = $("#partnerCode").val().replace(/\'/g,"\"");
			pattern = /"([^"]*)"/g;
			srcIndex = 0;
		} 

		if ($("#partnerCode").val().indexOf("nbcsports.com") > 0) {
			//console.log("NBCSports");
			partner = "NBCSPORTS";
			$("#lead").hide();
			tmp1a = $("#partnerCode").val().substring(12,$("#partnerCode").val().indexOf("style"))
			//<iframe src=https://www.nbcsports.com/video/embed/nbcsports/iR4tJy4samCa?autoPlay=true&mute=true style="width:480px; height:270px" frameBorder="0" seamless="seamless" allowFullScreen></iframe>
			//console.log("SPORTS " + tmp1a);
			srcIndex = 0;
		} 
		
		var matches = [];

		if (partner != "NBCSPORTS") {
	      matches = tmp1a.match(pattern);  //returns array
		  //console.log(matches)
		} else {
			matches[0] = tmp1a;
		}
	  
	  if ($("#partnerCode").val().indexOf("nbcnews.com") > 0 || $("#partnerCode").val().indexOf("today.com") > 0) {
		$("#leadURL").text(matches[3].substring(1, matches[3].length-1));
	  } 
       
      $("#embedCode").text("<div style=\"position:relative;overflow:hidden;width:100%;padding-top:56.25%;\" class=\"wp-block-embed is-type-video\"><iframe style=\"position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;\" class=\"wp-block-embed is-type-video\" src=" + matches[srcIndex] + " width=\"100%\" height=\"100%\" frameborder=\"0\" allowfullscreen=\"yes\"></iframe></div>")

      //$("#justURL").text(matches[0].substring(1, matches[0].length-1));
 
    });

	//FOR LOCAL PLAYER CONVERSION
	$("#localConvert").click(function () {
		var tmp = $("#localPastedCode").val();

		extractedURL = tmp.match(/"(.*?)"/g);

		//console.log(extractedURL[2]);

		var cid = getParams("CID");
		var videoID = getParams("videoID");
		var origin = getParams("origin");
		//console.log(cid + " / " + videoID + " / " + origin);

		getCalls(origin);

		$("#localCode").text("<iframe width=\"100%\" height=\"400\" scrolling=\"no\" id=\"nbcLMP141329420\" allowfullscreen=\"true\" webkitallowfullscreen=\"true\" mozallowfullscreen=\"true\" src=\"https://" + origin + "/video-layout/amp_video/?noid=" + cid + "&amp;videoID=" + videoID + "&amp;origin=" + origin + "&amp;fullWidth=y&amp;turl=&amp;ourl=&amp;lp=5&amp;fullWidth=y&amp;random=scsqjx&amp;callletters=" + callletters + "&amp;embedded=true\" style=\"border: none;\"></iframe>");


	});

	$("#get").click(function () {

	  getCalls($("#stations").val());

	  $("#localCode2").text("<iframe width=\"100%\" height=\"400\" scrolling=\"no\" id=\"nbcLMP141329420\" allowfullscreen=\"true\" webkitallowfullscreen=\"true\" mozallowfullscreen=\"true\" src=\"https://" + $("#stations").val() + "/video-layout/amp_video/?noid=" + $("#cidPaste").val() + "&amp;videoID=" + $("#vidPaste").val() + "&amp;origin=" + $("#stations").val() + "&amp;fullWidth=y&amp;turl=&amp;ourl=&amp;lp=5&amp;fullWidth=y&amp;random=scsqjx&amp;callletters=" + callletters + "&amp;embedded=true\" style=\"border: none;\"></iframe>")

	
	});
	
}

function copyCode(element) {
	//var copyText = $("#" + which).text();

	var $temp = $("<input>");
	$("body").append($temp);
	$temp.val($(element).text()).select();
	document.execCommand("copy");
	$temp.remove();

}

function getParams(k){
	var p = {};
	extractedURL[2].replace(/[?&]+([^=&]+)=([^&]*)/gi,function(s,k,v){p[k]=v})
	return k?p[k]:p;
}

function getCalls(which) {

	switch (which) {
	  case "lx.com":
		callletters = "lx";
		break;
	  case "nbcnewyork.com":
		callletters = "wnbc";
		break;
	  case "nbcphiladelphia.com":
		callletters = "wcau";
		break;
	  case "nbcwashington.com":
		callletters = "wrc";
		break;
	  case "nbcmiami.com":
		callletters = "wtvj";
		break;
	  case "nbcdfw.com":
		callletters = "kxas";
		break;
	  case "nbcsandiego.com":
		callletters = "knsd";
		break;
	  case "nbclosangeles.com":
		callletters = "knbc";
		break;
	  case "nbcbayarea.com":
		callletters = "kntv";
		break;
	  case "nbcchicago.com":
		callletters = "wmaq";
		break;
	  case "nbcconnecticut.com":
		callletters = "wvit";
		break;
	  case "nbcboston.com":
		callletters = "wbts";
		break;
	  case "necn.com":
		callletters = "necn";
		break;

	  case "telemundoareadelabahia.com":
		callletters = "ksts";
		break;
	  case "telemundochicago.com":
		callletters = "wsns";
		break;
	  case "telemundodallas.com":
		callletters = "kxtx";
		break;
	  case "telemundodenver.com":
		callletters = "kden";
		break;
	  case "telemundo48elpaso.com":
		callletters = "ktdo";
		break;
	  case "telemundohouston.com":
		callletters = "ktmd";
		break;
	  case "telemundo52.com":
		callletters = "kvea";
		break;
	  case "telemundolasvegas.com":
		callletters = "kblr";
		break;
	  case "telemundo40.com":
		callletters = "ktml";
		break;
	  case "telemundo51.com":
		callletters = "wscv";
		break;
	  case "telemundo47.com":
		callletters = "wnju";
		break;
	  case "telemundonuevainglaterra.com":
		callletters = "wneu";
		break;
	  case "telemundo31.com":
		callletters = "xxxx";
		break;
	  case "telemundo62.com":
		callletters = "wtmo";
		break;
	  case "telemundoarizona.com":
		callletters = "ktaz";
		break;
	  case "telemundopr.com":
		callletters = "wkaq";
		break;
	  case "telemundosanantonio.com":
		callletters = "kvda";
		break;
	  case "telemundo20.com":
		callletters = "kuan";
		break;
	  case "telemundo49.com":
		callletters = "wrmd";
		break;
	  case "telemundowashingtondc.com":
		callletters = "wzdc";
		break;
	  case "telemundoutah.com":
		callletters = "kulx";
		break;
	  case "telemundo33.com":
		callletters = "kcso";
		break;
	  case "telemundofresno.com":
		callletters = "knso";
		break;

	  default:
		callletters = "ots";
	}
}


$(document).ready(function(){
	init();
});