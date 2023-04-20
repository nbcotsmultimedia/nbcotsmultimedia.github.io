var ds;
var totalEntries;
var allData = [];


function init() {
	//console.log("ready");

	loadData(1);

		
}


function loadData(which) {

	//LOAD DATA WITH MISO
	ds = new Miso.Dataset({
  		importer : Miso.Dataset.Importers.GoogleSpreadsheet,
  		parser : Miso.Dataset.Parsers.GoogleSpreadsheet,
  		key : "1sXZ17-t702XuFOGj_OusfhgyW5Kj-o5_OCVJgNOXlzI", //CHANGE TO YOUR KEY HERE
  		worksheet : which
	});

	ds.fetch({ 
	  success : function() {
	     console.log("So say we all!");
	     parseData();
	  },
	  error : function() {
	   //console.log("What the frak?");
	  }
	});

}

function parseData() {
	var $len = ds.column("id").data.length;
	totalEntries = $len;
	
	//LOOP THRU GOOGLE DATA AND PUT INTO OBJECT
	for (var j=0; j<$len; j++) {
		var counter = ds.column("id").data[j];
		allData[counter] = [ {
								myid: ds.column("id").data[j],
								image: ds.column("image").data[j],
								caption: ds.column("caption").data[j],
								credit: ds.column("credit").data[j]
						    }];
	}

	//do something 
	//console.log(allData[i][0].myid);

}	

	

$(document).ready(function(){
	init();
});