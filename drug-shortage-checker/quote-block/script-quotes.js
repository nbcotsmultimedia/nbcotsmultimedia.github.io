document.addEventListener("DOMContentLoaded", () => {
  const quotes = document.querySelectorAll(".quote");
  let currentQuoteIndex = 0;

  const animate = (quote) => {
    const words = quote.querySelectorAll("p span");
    const author = quote.querySelector(".quote-author");
    const details = quote.querySelector(".quote-details");
    let maxDelay = 0;
    let maxDuration = 0;

    words.forEach((word) => {
      const duration = parseFloat(word.dataset.duration);
      const delay = parseFloat(word.dataset.delay);
      const blur = word.dataset.blur;
      maxDelay = Math.max(delay, maxDelay);
      maxDuration = Math.max(duration, maxDuration);

      gsap.set(word, {
        filter: `blur(${blur}px)`,
        opacity: 0,
      });
      gsap.to(word, {
        filter: "blur(0px)",
        opacity: 1,
        duration: duration,
        delay: delay,
      });
    });

    // Animate author and details after the quote
    const authorDelay = maxDelay + maxDuration + 0.5; // 0.5s after quote finishes
    gsap.set([author, details], { opacity: 0 });
    gsap.to(author, {
      opacity: 1,
      duration: 1,
      delay: authorDelay,
    });
    gsap.to(details, {
      opacity: 1,
      duration: 1,
      delay: authorDelay + 0.5, // 0.5s after author starts appearing
    });

    return authorDelay + 1.5; // Total animation duration
  };

  const resetQuote = (quote) => {
    const words = quote.querySelectorAll("p span");
    const author = quote.querySelector(".quote-author");
    const details = quote.querySelector(".quote-details");
    gsap.set(words, { filter: "blur(0px)", opacity: 0 });
    gsap.set([author, details], { opacity: 0 });
  };

  const changeQuote = () => {
    gsap.to(quotes[currentQuoteIndex], {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        resetQuote(quotes[currentQuoteIndex]);
        quotes[currentQuoteIndex].style.display = "none";
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        quotes[currentQuoteIndex].style.display = "block";
        gsap.set(quotes[currentQuoteIndex], { opacity: 1 });
        const animationDuration = animate(quotes[currentQuoteIndex]);

        // Schedule the next quote change
        gsap.delayedCall(animationDuration + 5, changeQuote); // 5 seconds of pause after animation
      },
    });
  };

  // Initialize: hide all quotes except the first one
  quotes.forEach((quote, index) => {
    if (index !== 0) {
      quote.style.display = "none";
    }
  });

  // Start the animation
  if (quotes.length > 0) {
    animate(quotes[0]);
    if (quotes.length > 1) {
      gsap.delayedCall(10, changeQuote); // Start rotating quotes after 10 seconds
    }
  } else {
    console.error("No quotes found on the page");
  }
});
