// timelineUtils.js

// #region - CONSTANTS

const NORMAL_SPACING = 300; // This should match your current timelineHeight
const REDUCED_SPACING = 60; // Adjust this value as needed
function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

//#endregion

//#region - TIMELINE EVENTS GENERATION

// Create an array of timeline events based on drug shortage data
function generateTimelineEvents(drug) {
  // Create a 'reportedDate' event to represent when a drug shortage was initially reported
  const reportedDate = new Date(drug.shortageReportedDate);
  const updateDate = new Date(drug.shortageUpdateDate);
  const currentDate = new Date();

  // Add additional events depending on drug's status
  let timelineEvents = [
    { date: reportedDate, status: "Shortage", label: "Shortage reported" },
  ];

  const lowerStatus = drug.shortageStatus.toLowerCase();
  switch (lowerStatus) {
    case "resolved":
      timelineEvents.push(
        { date: updateDate, status: "Resolved", label: "Shortage resolved" },
        { date: currentDate, status: "Resolved", label: "Drug available" }
      );
      break;
    case "current":
      timelineEvents.push({
        date: currentDate,
        status: "Shortage",
        label: "Shortage ongoing",
      });
      break;
    case "discontinued":
      timelineEvents.push(
        {
          date: updateDate,
          status: "Discontinued",
          label: "Drug discontinued",
        },
        { date: currentDate, status: "Discontinued", label: "Drug unavailable" }
      );
      break;
  }

  // Sort events chronologically
  timelineEvents.sort((a, b) => a.date - b.date);
  // Mark last event as current
  timelineEvents[timelineEvents.length - 1].isCurrent = true;

  return timelineEvents;
}

//#endregion

//#region - TIMELINE HTML GENERATION

// Map all events' positions on the timeline and convert into HTML format
function generateTimelineHTML(timelineEvents) {
  let prevTopPosition = 0;
  const timelineItems = timelineEvents
    .map((event, index) => {
      let topPosition;
      if (index > 0) {
        const prevEvent = timelineEvents[index - 1];
        const isSameTime = prevEvent.date.getTime() === event.date.getTime();
        const spacing = isSameTime
          ? REDUCED_SPACING
          : NORMAL_SPACING / (timelineEvents.length - 1);
        topPosition = prevTopPosition + spacing;
      } else {
        topPosition = 0;
      }

      const item = createTimelineItem(
        event,
        index,
        timelineEvents,
        topPosition,
        prevTopPosition
      );
      prevTopPosition = topPosition;
      return item;
    })
    .join("");

  const totalHeight = prevTopPosition;

  return `
    <ol class="timeline timeline-wrapper" style="height: ${totalHeight}px;">
      ${timelineItems}
    </ol>
  `;
}

//#endregion

//#region - TIMELINE ITEM HTML GENERATION

const skipElapsedTimePairs = new Set([
  "Shortage resolved|Drug available",
  "Drug discontinued|Drug unavailable",
]);

function createTimelineItem(
  event,
  index,
  timelineEvents,
  topPosition,
  prevTopPosition
) {
  const isLast = index === timelineEvents.length - 1;
  let elapsedTimeHtml = "";
  let currentTopPosition = topPosition;

  if (index > 0) {
    const prevEvent = timelineEvents[index - 1];
    if (!isValidDate(prevEvent.date) || !isValidDate(event.date)) {
      console.error(
        `Invalid date: prevEvent.date = ${prevEvent.date}, event.date = ${event.date}`
      );
      return "";
    }

    currentTopPosition =
      prevEvent.date.getTime() === event.date.getTime()
        ? prevTopPosition + REDUCED_SPACING
        : topPosition;

    elapsedTimeHtml = generateElapsedTimeHtml(
      prevEvent,
      event,
      currentTopPosition,
      prevTopPosition
    );
  }

  return `
    ${elapsedTimeHtml}
    <li class="timeline-item ${
      isLast ? "current" : ""
    }" style="top: ${currentTopPosition}px;">
      ${getStatusIconSVG(event.status, isLast)}
      <div class="timeline-item-description">
        <p class="date">${
          isValidDate(event.date) ? formatDate(event.date) : "Invalid Date"
        }</p>
        <p class="event">${event.label}</p>
      </div>
    </li>
  `;
}

function generateElapsedTimeHtml(
  prevEvent,
  event,
  topPosition,
  prevTopPosition
) {
  if (skipElapsedTimePairs.has(`${prevEvent.label}|${event.label}`)) {
    return "";
  }

  const duration = calculateDuration(prevEvent.date, event.date);
  if (!duration) {
    return "";
  }

  return `
    <div class="elapsed-time" style="top: ${
      (topPosition + prevTopPosition) / 2
    }px;">
      ${duration}
    </div>
  `;
}

//#endregion

//#region - STATUS ICON GENERATION

// Generate the SVG icon for a given status
/**
 * @param {string} status - The status of the timeline event (e.g., "Shortage", "Resolved", "Discontinued")
 * @param {boolean} isCurrent - Indicates whether this status represents the current state
 * @returns {string} HTML string for the status icon
 */
function getStatusIconSVG(status, isCurrent) {
  // Convert the status to lowercase for consistent CSS class naming
  const iconClass = status.toLowerCase();

  // Check if this is the event with current status - if so, return icon with current style
  if (isCurrent) {
    // Return HTML for a current status icon
    return `
      <div class="timeline-item-icon current">
        <div class="current-status-circle ${iconClass}"></div>
      </div>
    `;
  }

  // Define SVG icons for different statuses
  const svgContent = {
    // Exclaimation point icon
    shortage:
      '<path d="M7.005 3.1a1 1 0 1 1 1.99 0l-.388 6.35a.61.61 0 0 1-1.214 0zM7 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0"/>',
    // Check mark icon
    resolved:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
      '<path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>' +
      "</svg>",
    // Crossed circle icon
    discontinued:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
      '<path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>',
  };

  // If this event is not the current event, return a standard icon
  return `
    <div class="timeline-item-icon ${iconClass}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        ${svgContent[iconClass] || svgContent.shortage}
      </svg>
    </div>
  `;
}

//#endregion

//#region - GLOBAL EXPORTS

// Make functions globally accessible
window.TimelineUtils = {
  generateTimelineEvents: generateTimelineEvents,
  generateTimelineHTML: generateTimelineHTML,
  createTimelineItem: createTimelineItem,
  getStatusIconSVG: getStatusIconSVG,
};

//#endregion
