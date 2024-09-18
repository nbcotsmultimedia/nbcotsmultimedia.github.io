const quotes = document.querySelectorAll(".quote");

function splitText(element) {
  const text = element.innerText;
  element.innerHTML = text
    .split("")
    .map((char) => `<span>${char}</span>`)
    .join("");
}

function revealText(element) {
  const spans = element.querySelectorAll("span");
  spans.forEach((span, index) => {
    setTimeout(() => {
      span.style.opacity = "1";
      span.style.transform = "translateY(0)";
    }, 30 * index);
  });
}

function handleScroll() {
  quotes.forEach((quote) => {
    if (isElementInViewport(quote) && !quote.classList.contains("visible")) {
      quote.classList.add("visible");
      const quoteText = quote.querySelector(".quote-text");
      revealText(quoteText);
    }
  });
}

// tktk

const container = document.querySelector(".container");

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function handleScroll() {
  quotes.forEach((quote, index) => {
    if (isElementInViewport(quote)) {
      quote.classList.add("visible");

      // If this is the last quote, prevent further scrolling
      if (index === quotes.length - 1) {
        container.style.height = `${window.pageYOffset + window.innerHeight}px`;
      }
    } else {
      quote.classList.remove("visible");
    }
  });
}

function parallaxScroll() {
  const scrolled = window.pageYOffset;
  quotes.forEach((quote, index) => {
    const parent = quote.closest(".quote-section");
    const limit = parent.offsetTop + parent.offsetHeight;
    if (scrolled > parent.offsetTop && scrolled <= limit) {
      const translateY = (scrolled - parent.offsetTop) / 3;
      quote.style.transform = `translate(-50%, calc(-50% + ${translateY}px))`;

      // If this is the last quote and it's fully visible, prevent further scrolling
      if (index === quotes.length - 1 && isElementInViewport(quote)) {
        container.style.height = `${window.pageYOffset + window.innerHeight}px`;
      }
    }
  });
}

window.addEventListener("scroll", () => {
  handleScroll();
  parallaxScroll();
});

window.addEventListener("load", () => {
  handleScroll();
  setTimeout(() => {
    document.querySelector(".quote").classList.add("visible");
  }, 100);
});
