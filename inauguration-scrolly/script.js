// script.js

// Check if pym is available before initializing
var pymChild;
if (typeof pym !== "undefined") {
  pymChild = new pym.Child({
    polling: 500,
    initialHeight: 800,
  });
}

// Handle scrolling and image transitions
const images = document.querySelectorAll(".historic-image");
const textOverlays = document.querySelectorAll(".text-overlay");
const scrollContainer = document.querySelector(".scroll-container");
const totalImages = images.length;

window.addEventListener("scroll", () => {
  const scrollHeight = scrollContainer.clientHeight - window.innerHeight;
  const scrollProgress = window.scrollY / scrollHeight;

  const imageIndex = Math.min(
    Math.floor(scrollProgress * totalImages),
    totalImages - 1
  );

  images.forEach((img, index) => {
    if (index === imageIndex) {
      img.classList.add("visible");
    } else {
      img.classList.remove("visible");
    }
  });

  textOverlays.forEach((overlay, index) => {
    if (index === imageIndex) {
      overlay.classList.add("visible");
    } else {
      overlay.classList.remove("visible");
    }
  });
});
