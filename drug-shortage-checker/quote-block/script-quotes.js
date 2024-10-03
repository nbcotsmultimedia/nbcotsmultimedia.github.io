document.addEventListener("DOMContentLoaded", () => {
  const quotes = document.querySelectorAll(".quote");
  let currentQuoteIndex = 0;

  const animate = (quote) => {
    const words = quote.querySelectorAll("span");
    const cite = quote.querySelector("cite");
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

    if (cite) {
      gsap.set(cite, { opacity: 0 });
      gsap.to(cite, {
        opacity: 1,
        duration: maxDuration,
        delay: maxDelay,
      });
    }

    return maxDuration + maxDelay;
  };

  const resetQuote = (quote) => {
    const words = quote.querySelectorAll("span");
    const cite = quote.querySelector("cite");
    gsap.set(words, { filter: "blur(0px)", opacity: 0 });
    if (cite) gsap.set(cite, { opacity: 0 });
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
