// using d3 for convenience
var main = d3.select("main");
var scrolly = main.select("#scroll");
var figure = scrolly.select(".scroll__graphic");
var article = scrolly.select(".scroll__text");
var step = article.selectAll(".step");

// initialize the scrollama
var scroller = scrollama();

// generic window resize listener event
function handleResize() {
  // 1. update height of step elements
  var stepH = Math.floor(window.innerHeight * 0.75);
  step.style("height", stepH + "px");

  var figureHeight = window.innerHeight;
  var figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figure
    .style("height", figureHeight + "px")
    .style("top", figureMarginTop + "px");

  // 3. tell scrollama to update new element dimensions
  scroller.resize();
}

// scrollama event handlers
function handleStepEnter(response) {
  console.log("Step entered:", response.index);

  // add color to current step only
  step.classed("is-active", function (d, i) {
    return i === response.index;
  });

  // update graphic based on step
  var imageIndex = response.index + 1;
  var imageSrc = `images/slide${imageIndex.toString().padStart(2, "0")}.png`;

  figure.select("img").attr("src", imageSrc);

  console.log("Image source set to:", imageSrc);
}

function setupStickyfill() {
  d3.selectAll(".sticky").each(function () {
    Stickyfill.add(this);
  });
}

function adjustSlide01() {
  var slide01 = document.querySelector(
    '.scroll__graphic .chart img[src*="slide01"]'
  );
  if (slide01) {
    var aspectRatio = slide01.naturalWidth / slide01.naturalHeight;
    if (aspectRatio > 1) {
      slide01.style.width = "100%";
      slide01.style.height = "auto";
    } else {
      slide01.style.width = "auto";
      slide01.style.height = "100%";
    }
  }
}

function init() {
  console.log("Initializing...");
  setupStickyfill();

  // 1. force a resize on load to ensure proper dimensions are sent to scrollama
  handleResize();

  // 2. setup the scroller passing options
  // 3. bind scrollama event handlers
  scroller
    .setup({
      step: "#scroll .scroll__text .step",
      offset: 0.5,
      //   debug: true,
    })
    .onStepEnter(handleStepEnter);

  // setup resize event
  window.addEventListener("resize", handleResize);

  // Add event listener for image load
  window.addEventListener("load", adjustSlide01);

  console.log("Initialization complete");

  xtalk.signalIframe();
}

// kick things off
init();
