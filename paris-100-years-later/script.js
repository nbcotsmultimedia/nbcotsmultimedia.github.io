// using d3, select elements
var main = d3.select("main");
var scrolly = main.select("#scroll");
var figure = scrolly.select(".scroll__graphic");
var article = scrolly.select(".scroll__text");
var step = article.selectAll(".step");

// initialize a new instance of scrollama
var scroller = scrollama();

// check for mobile view
function isMobileView() {
  return window.innerWidth < 500;
}

// Function to get image dimensions
function getImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = src;
  });
}

// window resize listener event
async function handleResize() {
  var windowHeight = window.innerHeight;
  var figureHeight = windowHeight;
  var figureMarginTop = (windowHeight - figureHeight) / 2;

  figure
    .style("height", figureHeight + "px")
    .style("top", figureMarginTop + "px");

  // Adjust step heights based on image dimensions
  for (let i = 0; i < step.size(); i++) {
    let stepHeight = Math.floor(windowHeight * 0.75);

    // Special handling for slide01 and slide13
    if (i === 0 || i === 12) {
      const imageSuffix = isMobileView() ? "m" : "";
      const imageSrc = `images/slide${(i + 1)
        .toString()
        .padStart(2, "0")}${imageSuffix}.png`;
      const dimensions = await getImageDimensions(imageSrc);
      const imageAspectRatio = dimensions.height / dimensions.width;
      const viewportAspectRatio = windowHeight / window.innerWidth;

      if (imageAspectRatio > viewportAspectRatio) {
        // Image is taller than the viewport
        stepHeight = Math.max(
          stepHeight,
          dimensions.height * (window.innerWidth / dimensions.width)
        );
      }
    }

    d3.select(step.nodes()[i]).style("height", stepHeight + "px");
  }

  scroller.resize();
}

// scrollama event handler - handles the event when a step is entered
function handleStepEnter(response) {
  console.log("Step entered:", response.index);

  step.classed("is-active", function (d, i) {
    return i === response.index;
  });

  var img = figure.select("img");
  var imageIndex = response.index;
  var totalImages = 13; // Set this to your total number of images

  // Ensure imageIndex doesn't exceed the number of available images
  imageIndex = Math.min(imageIndex, totalImages - 1);

  var imageSuffix = isMobileView() ? "m" : "";
  var imageSrc = `images/slide${(imageIndex + 1)
    .toString()
    .padStart(2, "0")}${imageSuffix}.png`;

  // Only change the image if it's different from the current one
  if (img.attr("src") !== imageSrc) {
    img.attr("src", imageSrc);
    console.log("Image source set to:", imageSrc);
  }

  // Adjust image styling for longer images (slide01 and slide13)
  if (imageIndex === 0 || imageIndex === 12) {
    img
      .style("width", "100vw")
      .style("height", "auto")
      .style("max-height", "none")
      .style("object-fit", "contain")
      .style("object-position", "top center");

    figure.style("height", "auto");
  } else {
    img
      .style("width", "100vw")
      .style("height", "100vh")
      .style("object-fit", "cover")
      .style("object-position", "top center");

    figure.style("height", "100vh");
  }

  // Special handling for the footer illustration
  if (imageIndex === totalImages - 1) {
    article
      .select(`.step[data-step='${totalImages - 1}']`)
      .style("display", "none");
  } else {
    article.selectAll(".step").style("display", "block");
  }
}

// apply the sticky polyfill
function setupStickyfill() {
  d3.selectAll(".sticky").each(function () {
    Stickyfill.add(this);
  });
}

// handle step progress
function handleStepProgress(response) {
  if (response.progress > 0.99) {
    scroller.disable();
    setTimeout(() => scroller.enable(), 500);
  }
}

// set up a back button to let users go to top
function setupBackToTopButton() {
  var backToTopBtn = d3.select("#backToTopBtn");

  window.onscroll = function () {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      backToTopBtn.style("display", "block");
    } else {
      backToTopBtn.style("display", "none");
    }
  };

  backToTopBtn.on("click", function () {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });
}

// preload images function
function preloadImages() {
  const totalImages = 13; // Set this to your total number of images
  const images = [];

  for (let i = 1; i <= totalImages; i++) {
    const desktopImage = new Image();
    desktopImage.src = `images/slide${i.toString().padStart(2, "0")}.png`;
    images.push(desktopImage);

    const mobileImage = new Image();
    mobileImage.src = `images/slide${i.toString().padStart(2, "0")}m.png`;
    images.push(mobileImage);
  }

  console.log(`Preloaded ${images.length} images`);
}

// initialization function
async function init() {
  console.log("Initializing...");
  setupStickyfill();
  await handleResize(); // Wait for handleResize to complete
  preloadImages();

  scroller
    .setup({
      step: "#scroll .scroll__text .step",
      offset: 0.5,
      progress: true,
      threshold: 1, // Adjusted for smoother transitions
    })
    .onStepEnter(handleStepEnter)
    .onStepProgress(handleStepProgress);

  window.addEventListener("resize", handleResize);

  window.addEventListener("resize", function () {
    if (isMobileView()) {
      handleStepEnter({ index: scroller.getCurrentIndex() });
    }
  });

  setupBackToTopButton();

  console.log("Initialization complete");

  xtalk.signalIframe();
}

// kick things off
init();
