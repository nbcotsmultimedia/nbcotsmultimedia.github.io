const quotes = document.querySelectorAll(".quote");
let currentQuoteIndex = 0;

function showNextQuote() {
  // Fade out current quote
  quotes[currentQuoteIndex].classList.remove("visible");

  // Update index to next quote
  currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;

  // Delay before fading in next quote
  setTimeout(() => {
    // Fade in next quote
    quotes[currentQuoteIndex].classList.add("visible");
  }, 2000); // 2000ms delay, adjust as needed
}

function startRotation() {
  // Show the first quote initially
  quotes[0].classList.add("visible");

  // Change quote every 8 seconds
  setInterval(showNextQuote, 8000);
}

// Start rotation when the window loads
window.addEventListener("load", startRotation);
