// utils.js
function formatDate(dateString) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function highlightMatch(text, searchTerm) {
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Define wrapper function for crosstalk to use throughout app
function signalIframeResize() {
  if (
    window.parent !== window &&
    typeof xtalk !== "undefined" &&
    xtalk.signalIframe
  ) {
    try {
      xtalk.signalIframe();
    } catch (error) {
      console.warn("Error calling xtalk.signalIframe:", error);
    }
  } else {
    console.log(
      "Page is not in an iframe or xtalk is not available. Skipping iframe resize signal."
    );
  }
}
