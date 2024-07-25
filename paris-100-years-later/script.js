// using d3 for convenience
var main = d3.select("main");
var scrolly = main.select("#scroll");
var figure = scrolly.select(".scroll__graphic");
var article = scrolly.select(".scroll__text");
var step = article.selectAll(".step");

// initialize the scrollama
var scroller = scrollama();

function isMobileView() {
  return window.innerWidth < 500;
}

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

  // 4. Update image based on new viewport size
  var currentStep = d3.select(".is-active");
  if (!currentStep.empty()) {
    var stepIndex = currentStep.attr("data-step") - 1;
    handleStepEnter({ index: stepIndex });
  }
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
  var imageSuffix = isMobileView() ? "m" : "";
  var imageSrc = `images/slide${imageIndex
    .toString()
    .padStart(2, "0")}${imageSuffix}.png`;

  var img = figure.select("img");
  img.attr("src", imageSrc);

  console.log("Image source set to:", imageSrc);

  // Adjust the height for the long images in steps 01 and 13 and hide text block for step 13
  if (imageIndex === 1 || imageIndex === 13) {
    img
      .style("height", "auto")
      .style("width", "100%")
      .style("object-fit", "contain")
      .style("max-height", "none");
    figure.style("height", "auto");
    if (imageIndex === 13) {
      article.select(".step[data-step='13']").style("display", "none");
    }
  } else {
    img
      .style("height", "100%")
      .style("width", "auto")
      .style("object-fit", "cover")
      .style("max-height", "100vh");
    figure.style("height", "100vh");
    article.selectAll(".step").style("display", "block");
  }
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

  // Add event listener for viewport changes
  window.addEventListener("resize", function () {
    if (isMobileView()) {
      handleStepEnter({ index: scroller.getCurrentIndex() });
    }
  });

  console.log("Initialization complete");

  xtalk.signalIframe();
}

// kick things off
init();
