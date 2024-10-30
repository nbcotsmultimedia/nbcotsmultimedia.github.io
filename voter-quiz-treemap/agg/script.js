// Constants
const SHEET_URL = `https://docs.google.com/spreadsheets/d/1UOhqRYV_TlJWWXGUIr8gO3JC2hDIdcGRO20-T1L75cU/export?format=csv&gid=1016009773`;
const MINIMUM_SIZE_FOR_TEXT = 100;
const RESIZE_DELAY = 250;
const RESIZE_THROTTLE = 60;

const COLOR_DOMAIN = [
  "The economy",
  "Abortion rights",
  "Immigration",
  "National security",
  "Healthcare",
  "Climate change",
  "Gun policy",
  "Racial inequality",
  "Crime",
  "Education",
];

const COLOR_RANGE = [
  "#B4C9F9",
  "#E5A9B3",
  "#CEBDF4",
  "#FBD451",
  "#CBE896",
  "#F5B517",
  "#CC9FFF",
  "#7C869B",
  "#C6C112",
  "#C6A8B9",
];

// State management
let isLoading = true;
let cachedData = null;

// Initialize Pym
const pymChild = new pym.Child({ polling: 500 });

// Data processing function
function processData(data) {
  const processedData = [
    { id: "root", parent: "", value: 0 },
    ...data.map((d) => ({
      id: d.Issues,
      parent: "root",
      value: parseFloat(d.Percent) || 0,
    })),
  ];
  return d3
    .stratify()
    .id((d) => d.id)
    .parentId((d) => d.parent)(processedData)
    .sum((d) => d.value);
}

// Utility functions
function getLightness(color) {
  const rgb = d3.color(color);
  return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
}

function wrap(text, width) {
  text.each(function () {
    const textElement = d3.select(this);
    const words = textElement.text().split(/\s+/);
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.2; // Adjust line height as needed
    const y = parseFloat(textElement.attr("y"));
    const dy = 0; // Vertical offset for each line
    let tspan = textElement
      .text(null)
      .append("tspan")
      .attr("x", 4)
      .attr("y", y)
      .attr("dy", dy + "em");

    for (let word of words) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word]; // Start a new line with the current word
        tspan = textElement
          .append("tspan")
          .attr("x", 4)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}

// Custom debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Main treemap creation function
function createTreemap(providedWidth, providedHeight) {
  const container = document.getElementById("treemap");
  if (!container) {
    console.error("Treemap container not found");
    return;
  }

  // Use the full width of the parent container
  const width = container.parentNode.clientWidth;
  const height = providedHeight || container.clientHeight;

  // Clear existing SVG
  d3.select("#treemap svg").remove();

  // Create new SVG
  const svg = d3
    .select("#treemap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Create tooltip
  let tooltip = d3.select("body").select(".treemap-tooltip");
  if (tooltip.empty()) {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "treemap-tooltip hidden")
      .style("position", "absolute");
  }

  function updateTreemap(data) {
    const treemap = d3
      .treemap()
      .size([width, height])
      .padding(4)
      .tile(d3.treemapSquarify.ratio(1))
      .round(true);

    const root = treemap(data);
    root.sort((a, b) => b.value - a.value);

    const colorScale = d3
      .scaleOrdinal()
      .domain(COLOR_DOMAIN)
      .range(COLOR_RANGE);

    // Create node groups
    const nodes = svg
      .selectAll("g.node-group")
      .data(root.leaves())
      .join("g")
      .attr("class", "node-group")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .style("opacity", 0)
      .style("cursor", "pointer");

    // Add rectangles
    nodes
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => colorScale(d.data.id))
      .attr("fill-opacity", 0.7) // Add transparency to fill
      .attr("stroke", (d) => colorScale(d.data.id)) // Add border with same color
      .attr("stroke-width", 2); // Adjust border width as needed

    // Add text groups
    const textGroups = nodes
      .append("g")
      .attr("class", "text-group")
      .attr("pointer-events", "none")
      .attr("transform", "translate(0, 12)"); // Move text group down by 12 pixels

    // Add labels
    textGroups
      .append("text")
      .attr("class", "node-label")
      .attr("x", 4)
      .attr("y", 4)
      .text((d) => {
        const nodeWidth = d.x1 - d.x0;
        const nodeHeight = d.y1 - d.y0;
        return nodeWidth > MINIMUM_SIZE_FOR_TEXT &&
          nodeHeight > MINIMUM_SIZE_FOR_TEXT
          ? d.data.id
          : "";
      })
      .style("font-size", (d) => {
        const nodeSize = Math.min(d.x1 - d.x0, d.y1 - d.y0);
        return `${Math.max(8, Math.min(14, nodeSize / 5))}px`; // Adjust font size based on node size
      })
      .style("display", (d) => {
        const nodeWidth = d.x1 - d.x0;
        const nodeHeight = d.y1 - d.y0;
        return nodeWidth > MINIMUM_SIZE_FOR_TEXT &&
          nodeHeight > MINIMUM_SIZE_FOR_TEXT
          ? "block"
          : "none";
      })
      .call(wrap, (d) => Math.max(0, d.x1 - d.x0 - 8));

    // Add interactions
    nodes
      .on("mouseover", (event, d) => {
        tooltip
          .classed("hidden", false)
          .html(
            `<div class="tooltip-title">${
              d.data.id
            }</div><div class="tooltip-value">${d.value.toFixed(1)}%</div>`
          )
          .style("opacity", 1); // Show tooltip with full opacity

        // Positioning logic
        const tooltipWidth = tooltip.node().offsetWidth;
        const tooltipHeight = tooltip.node().offsetHeight;

        let x = event.pageX + 10; // Add a small offset
        let y = event.pageY - tooltipHeight - 10; // Position above the mouse pointer

        // Check if the tooltip goes beyond the right edge
        if (x + tooltipWidth > window.innerWidth) {
          x = window.innerWidth - tooltipWidth - 10; // Adjust x position
        }

        // Check if the tooltip goes beyond the top edge
        if (y < 0) {
          y = event.pageY + 10; // Position below if there's not enough space above
        }

        // Set tooltip position
        tooltip.style("left", `${x}px`).style("top", `${y}px`);
      })
      .on("mousemove", (event) => {
        const tooltipWidth = tooltip.node().offsetWidth;
        const tooltipHeight = tooltip.node().offsetHeight;

        let x = event.pageX + 10; // Add a small offset
        let y = event.pageY - tooltipHeight - 10; // Position above the mouse pointer

        // Check if the tooltip goes beyond the right edge
        if (x + tooltipWidth > window.innerWidth) {
          x = window.innerWidth - tooltipWidth - 10; // Adjust x position
        }

        // Check if the tooltip goes beyond the top edge
        if (y < 0) {
          y = event.pageY + 10; // Position below if there's not enough space above
        }

        // Set new position for the tooltip
        tooltip.style("left", `${x}px`).style("top", `${y}px`);
      })
      .on("mouseout", () => {
        tooltip.classed("hidden", true).style("opacity", 0); // Hide and fade out on mouse out
      });

    // Fade in nodes
    nodes.transition().duration(500).style("opacity", 1);

    // Set container opacity to 1 and update loading state
    container.style.opacity = "1";
    isLoading = false;

    pymChild.sendHeight();
  }

  // Load data and create treemap
  if (cachedData) {
    updateTreemap(cachedData);
  } else {
    d3.csv(SHEET_URL)
      .then((data) => {
        cachedData = processData(data);
        updateTreemap(cachedData);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
        isLoading = false;
        container.style.opacity = "1";
      });
  }
}

// Debounced resize handler
const debouncedResize = debounce(() => {
  createTreemap();
}, RESIZE_DELAY);

// Add event listener for resizing
window.addEventListener("resize", debouncedResize);

// Initial creation of treemap
createTreemap();
