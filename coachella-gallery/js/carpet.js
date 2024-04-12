var ds;
var totalEntries;
var allData;
var allDataRev;
var config;
var currentThumb = 0;
var counter = 0;
var theCount = 0;

function init() {
  //console.log("ready");

  $("#cardPic").css("opacity", 0);

  config = buildConfig();
  loadData();
}

function buildConfig() {
  return {
    delimiter: "", // auto-detect
    newline: "", // auto-detect
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
    delimitersToGuess: [",", "\t", "|", ";", Papa.RECORD_SEP, Papa.UNIT_SEP],
  };
}

function loadData() {
  Papa.parse(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjoNFo_Bz6ND6v7TxyJ6ALBsCk6e4KQriV_JcPXkbUNrAZs4mpYqol_SqyE3URol-jBDK3elhD0X9D/pub?output=csv",
    {
      download: true,
      header: true,
      config,
      complete: function (results) {
        //console.log("Finished:", results.data);
        allData = results.data;
        parseData();
      },
    }
  );
}

function parseData() {
  var $len = allData.length;
  totalEntries = $len;

  //do something
  //console.log(allData[i][0].myid);
  createGrid();
}

function createGrid() {
  var tmpImg = [];

  for (i = 0; i < totalEntries; i++) {
    tmpImg = allData[i].image.split("?");

    $("#thumbsCon").append(
      "<div class='thumb' id='c" +
        i +
        "' data-id='" +
        i +
        "'>" +
        "<div class='thMask' id='i" +
        i +
        "'><img src='" +
        tmpImg[0] +
        "?quality=85&strip=all&w=100&h=150&crop=1&fit=125%2C125' class='img-fluid' /></div>" +
        "<p class='thLast'>" +
        allData[i].name +
        "</p>" +
        "</div>"
    );

    $("#mySelect").append(
      $("<option class='dropdown-item' value='" + i + "'></option>").html(
        allData[i].name
      )
    );

    $(".thumb").css("opacity", 0);
  }

  //var thHeight = Math.ceil(($(".thumb").width() / 3) * 4);
  //$(".thMask").css("height", thHeight);

  $(".thumb").click(function () {
    //console.log("ID " + $(this).attr("data-id"));
    loadCard($(this).attr("data-id"));
  });

  $("#nextBtn").click(function () {
    loadCard(Number(currentThumb) + 1);
    document.getElementById("mySelect").selectedIndex = currentThumb;
  });
  $("#prevBtn").click(function () {
    loadCard(Number(currentThumb) - 1);
    document.getElementById("mySelect").selectedIndex = currentThumb;
  });

  //animateThumb(0);

  $(".thumb").animate({ opacity: 1 }, 1000, function () {});

  loadCard(0);
}

function animateThumb(which) {
  if (which < totalEntries) {
    $("#c" + which).animate({ opacity: 1 }, 100, function () {
      counter++;
      animateThumb(counter);
    });
  }
}

function loadCard(which) {
  //console.log("card " + which);

  $("#cardPic").css("opacity", 0);

  $("#i" + currentThumb).removeClass("thactive");
  currentThumb = which;
  $("#i" + which).addClass("thactive");

  if (which == 0) {
    $("#prevBtn").hide();
  } else {
    $("#prevBtn").show();
  }
  if (which == totalEntries - 1) {
    $("#nextBtn").hide();
  } else {
    $("#nextBtn").show();
  }

  var tmpImg = [];
  tmpImg = allData[which].image.split("?");
  //console.log(tmpImg)

  theCount = Number(which) + 1;

  $("#cardPic").html(
    "<img src='" +
      tmpImg[0] +
      "?quality=85&strip=all&w=500&h=750&crop=1&fit=650%2C650' class='img-fluid' />"
  );
  $("#cardName").html(allData[which].name);
  $("#cardCaption").html(
    "<span class='countDisp'>" +
      theCount +
      "/" +
      totalEntries +
      "</span>&nbsp;&nbsp;&nbsp;" +
      allData[which].caption
  );

  if (which == 8 || which == 27) {
    $("#lName").addClass("smaller");
  } else {
    $("#lName").removeClass("smaller");
  }

  $("#cardPic,#fName,#lName,#pInfo").animate(
    {
      opacity: 1,
    },
    500,
    function () {
      // Animation complete.
    }
  );

  setTimeout(resizeFrame, 2000);
}

function resizeFrame() {
  xtalk.signalIframe();
}

$(document).ready(function () {
  init();
});
