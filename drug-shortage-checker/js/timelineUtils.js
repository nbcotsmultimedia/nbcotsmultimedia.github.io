// timelineUtils.js

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

// Convert timeline events into HTML format
function generateTimelineHTML(timelineEvents) {
  const timelineHeight = 300;
  const timelineItems = timelineEvents
    // Map each event to a timeline item, calculating its vertical position within a fixed height (timelineHeight)
    .map((event, index) => {
      const topPosition =
        (index / (timelineEvents.length - 1)) * timelineHeight;
      // Call createTimelineItem for each event to generate its HTML
      return createTimelineItem(event, index, timelineEvents, topPosition);
    })
    .join("");

  // Wrap all items in an ordered list with a specified height
  return `
    <ol class="timeline timeline-wrapper" style="height: ${timelineHeight}px;">
      ${timelineItems}
    </ol>
  `;
}

//#endregion

//#region - TIMELINE ITEM GENERATION

// Generate HTML for each individual timeline item
/**
 * @param {Object} event - The timeline event object containing details such as date, status, and label
 * @param {number} index - The index of the current event within the timeline events array
 * @param {Array} timelineEvents - The complete array of timeline events for the drug
 * @param {number} topPosition - The calculated vertical position for this item on the timeline
 * @returns {string} HTML string for the timeline item, including an icon and description
 */
function createTimelineItem(event, index, timelineEvents, topPosition) {
  // Determine if the current item is the last one in the list
  const isLast = index === timelineEvents.length - 1;

  // Use getStatusIconSVG to generate an icon for the event's status
  const iconHtml = getStatusIconSVG(event.status, isLast);

  // Return an HTML list item for each event in the timeline - adding a 'current' class on the last item for styling
  return `
    <li class="timeline-item ${
      isLast ? "current" : ""
    }" style="top: ${topPosition}px;">
      ${iconHtml}
      <div class="timeline-item-description">
        <p class="date">${formatDate(event.date)}</p>
        <p class="event">${event.label}</p>
      </div>
    </li>
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
