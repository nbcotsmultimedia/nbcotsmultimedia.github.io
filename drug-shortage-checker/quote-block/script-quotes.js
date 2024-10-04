document.addEventListener("DOMContentLoaded", () => {
  const quotes = document.querySelectorAll(".quote");
  let currentQuoteIndex = 0;

  const animate = (quote) => {
    const words = Array.from(quote.querySelectorAll("p span"));
    const author = quote.querySelector(".quote-author");
    const details = quote.querySelector(".quote-details");
    let maxDelay = 0;
    let maxDuration = 0;

    // Function to get a random index with a bias towards the original index
    const getWeightedRandomIndex = (originalIndex, arrayLength) => {
      const randomFactor = Math.random();
      const maxDistance = arrayLength / 4; // Maximum distance from original index
      const distance = Math.floor(randomFactor * maxDistance);
      const direction = Math.random() < 0.5 ? -1 : 1;
      let newIndex = originalIndex + direction * distance;
      return Math.max(0, Math.min(newIndex, arrayLength - 1));
    };

    // Create a new array with mostly ordered, but slightly randomized indices
    const semiRandomIndices = words.map((_, index) => ({
      originalIndex: index,
      newIndex: getWeightedRandomIndex(index, words.length),
    }));

    // Sort the indices based on the new, semi-random order
    semiRandomIndices.sort((a, b) => a.newIndex - b.newIndex);

    // Animate words based on the new semi-random order
    semiRandomIndices.forEach((indexObj, i) => {
      const word = words[indexObj.originalIndex];
      const isLongQuote = words.length > 50;
      const baseDuration = isLongQuote ? 1.0 : 2.0;
      const baseDelay = 0.05;

      const duration = baseDuration + Math.random() * 0.5;
      const delay = baseDelay * i + Math.random() * 0.5;

      const blur = Math.floor(Math.random() * 10) + 1;

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
        ease: "power2.out",
      });
    });

    const authorDelay = maxDelay + maxDuration + 0.5;

    gsap.set([author, details], { opacity: 0 });
    gsap.to(author, {
      opacity: 1,
      duration: 1.5,
      delay: authorDelay,
      ease: "power2.out",
    });
    gsap.to(details, {
      opacity: 1,
      duration: 1.5,
      delay: authorDelay,
      ease: "power2.out",
    });

    return authorDelay + 2;
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
      duration: 1.5,
      onComplete: () => {
        resetQuote(quotes[currentQuoteIndex]);
        quotes[currentQuoteIndex].style.display = "none";
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        quotes[currentQuoteIndex].style.display = "block";
        gsap.set(quotes[currentQuoteIndex], { opacity: 1 });
        const animationDuration = animate(quotes[currentQuoteIndex]);

        // Schedule the next quote change
        gsap.delayedCall(animationDuration + 6, changeQuote);
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
      gsap.delayedCall(12, changeQuote);
    }
  } else {
    console.error("No quotes found on the page");
  }
});
