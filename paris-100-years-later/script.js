// Constants
const TOTAL_SLIDES = 14;
const MOBILE_BREAKPOINT = 600;

// DOM Selections
const scrolly = d3.select("#scrolly");
const steps = scrolly.selectAll(".step");
const scrollGraphic = scrolly.select(".scroll__graphic");
const chart = scrollGraphic.select(".chart");
const scrollIndicator = d3.select("#scroll-indicator");

// Initialize scrollama
const scroller = scrollama();

// Utility Functions
const getImageSrc = (index) => {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const suffix = isMobile ? "m" : "";
  return `images/slide${index.toString().padStart(2, "0")}${suffix}.png`;
};

function updateImageSources() {
  const activeStep = steps.filter(".is-active");
  if (activeStep.size() > 0) {
    const stepIndex = activeStep.attr("data-step");
    const img = chart.select("img");
    const imageSrc = getImageSrc(stepIndex);
    img.attr("src", imageSrc);
  }
}

function handleResize() {
  const stepHeight = window.innerHeight * 0.75;
  steps.style("height", stepHeight + "px");
  scroller.resize();
}

// Step Enter Handler
function handleStepEnter(response) {
  const { index, direction } = response;
  const slideIndex = parseInt(d3.select(response.element).attr("data-step"));

  console.log(`Entering step ${slideIndex}, direction: ${direction}`);

  // Update active step
  steps.classed("is-active", (d, i) => i === index);

  // Update image
  const img = chart.select("img");
  const imageSrc = getImageSrc(slideIndex);

  // Update the image source immediately
  img.attr("src", imageSrc);

  // Handle last slide
  if (slideIndex === TOTAL_SLIDES) {
    scrollGraphic.style("height", "auto");
    chart.style("height", "auto");
    img.style("height", "auto").style("object-fit", "contain");
  } else {
    scrollGraphic.style("height", "100vh");
    chart.style("height", "100%");
    img.style("height", "100%").style("object-fit", "cover");
  }

  // Hide the scroll indicator after passing the first step
  if (slideIndex > 1) {
    scrollIndicator.style("opacity", 0);
    setTimeout(() => scrollIndicator.style("display", "none"), 500); // Ensure it is completely hidden after the transition
  }
}

// Initialize
function init() {
  // Set up sticky graphic
  scrollGraphic
    .style("position", "sticky")
    .style("top", "0px")
    .style("height", "100vh");

  // Set up Scrollama
  scroller
    .setup({
      step: ".step",
      offset: 0.5,
      debug: false,
    })
    .onStepEnter(handleStepEnter);

  // Setup resize handler
  window.addEventListener("resize", handleResize);

  // Load first image
  chart
    .select("img")
    .attr("src", getImageSrc(1))
    .style("width", "100%")
    .style("height", "100%")
    .style("object-fit", "cover")
    .style("object-position", "top")
    .style("display", "block");

  // Initial resize
  handleResize();
}

// Start it up
init();
