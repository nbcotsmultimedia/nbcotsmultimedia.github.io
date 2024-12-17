// Initialize scrollama and global variables
const scroller = scrollama();
const article = document.querySelector("article");
const image = document.querySelector(".sticky-image");
let eventData = [];
let currentContent = null;
let currentIndex = -1;

// Function to fetch and parse Google Sheet data
async function fetchSheetData() {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9bAGMcEGwOmbIBkBPbHQT1YDUgBUbcK7oGuaGTQJYQfD1AbeczSrlSjtSrO6C2ykNU--b9fJNeP5W/pub?gid=0&single=true&output=csv";

  try {
    const response = await fetch(sheetUrl);
    const data = await response.text();

    Papa.parse(data, {
      header: true,
      complete: function (results) {
        eventData = results.data;
        generateSteps();
        initScrollama();
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
      },
    });
  } catch (error) {
    console.error("Error fetching sheet:", error);
  }
}

// Function to handle content transitions
function transitionContent(newData, index) {
  // Don't recreate if we're already showing this content
  if (currentIndex === index) return;

  currentIndex = index;

  // Create new content box
  const newContent = document.createElement("div");
  newContent.classList.add("event-content");

  // Format date
  const date = new Date(newData.Date);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Create HTML structure for the event
  newContent.innerHTML = `
        <div class="event-date">${formattedDate}</div>
        <div class="event-title">${newData.Event}</div>
        <div class="event-description">${newData.Description}</div>
        <div class="event-category category-${newData.Category.toLowerCase()}">${
    newData.Category
  }</div>
    `;

  // If there's existing content, fade it out first
  if (currentContent) {
    currentContent.classList.remove("visible");
    setTimeout(() => {
      currentContent.remove();
      document.body.appendChild(newContent);
      // Brief timeout to ensure DOM has updated
      requestAnimationFrame(() => {
        newContent.classList.add("visible");
      });
    }, 300);
  } else {
    // If no existing content, just fade in the new content
    document.body.appendChild(newContent);
    requestAnimationFrame(() => {
      newContent.classList.add("visible");
    });
  }

  currentContent = newContent;
}

// Generate steps using the parsed data
function generateSteps() {
  eventData.forEach((row, index) => {
    const step = document.createElement("div");
    step.classList.add("step");
    step.setAttribute("data-step", index);
    article.appendChild(step);
  });
}

// Initialize scrollama
function initScrollama() {
  scroller
    .setup({
      step: ".step",
      offset: 0.5,
      debug: false,
    })
    .onStepEnter((response) => {
      // Prevent multiple triggers for the same step
      if (currentIndex === response.index) return;

      // Update image first
      const imageNumber = (response.index + 1).toString().padStart(2, "0");
      image.src = `images/${imageNumber}.jpg`;
      image.alt = eventData[response.index].Event;

      // Update content with transition
      transitionContent(eventData[response.index], response.index);
    });
}

// Handle window resize
window.addEventListener("resize", scroller.resize);

// Start the process
fetchSheetData();
