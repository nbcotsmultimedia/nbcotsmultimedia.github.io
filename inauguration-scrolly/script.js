// Initialize scrollama
const scroller = scrollama();

// Select all images and steps
const images = document.querySelectorAll(".historic-image");
const steps = document.querySelectorAll(".step");

// Initialize first image and step on page load
function initializeFirstStep() {
  images[0].classList.add("is-active");
  steps[0].classList.add("is-active");
}

// Call initialization after DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeFirstStep);

// setup the instance, pass callback functions
scroller
  .setup({
    step: ".step",
    offset: 0.5,
    debug: false,
  })
  .onStepEnter(handleStepEnter)
  .onStepExit(handleStepExit);

// Handle entering a step
function handleStepEnter(response) {
  // Add 'is-active' class to current step
  response.element.classList.add("is-active");

  // Show corresponding image
  images.forEach((img, idx) => {
    if (idx === response.index) {
      img.classList.add("is-active");
    } else {
      img.classList.remove("is-active");
    }
  });
}

// Handle exiting a step
function handleStepExit(response) {
  // Remove 'is-active' class from current step
  response.element.classList.remove("is-active");
}

// Handle resize event
function handleResize() {
  scroller.resize();
}

// Add resize event listener
window.addEventListener("resize", handleResize);
