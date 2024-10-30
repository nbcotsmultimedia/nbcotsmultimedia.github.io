// Constants for data and sizing
const SHEET_URL = `https://docs.google.com/spreadsheets/d/1UOhqRYV_TlJWWXGUIr8gO3JC2hDIdcGRO20-T1L75cU/export?format=csv&gid=1016009773`;
const MINIMUM_SIZE_FOR_DETAILS = 160;
const MINIMUM_SIZE_FOR_LABEL = 80;
const RESIZE_DELAY = 250;
const RESIZE_THROTTLE = 60;

// Add back the color constants
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
  "#B4C9F9", // Light blue for economy
  "#E5A9B3", // Gray pink for abortion rights
  "#CEBDF4", // Light purple for immigration
  "#FBD451", // Turquoise for national security
  "#CBE896", // Fresh green for healthcare
  "#F5B517", // Golden yellow for climate
  "#CC9FFF", // Deep mauve for gun policy
  "#7C869B", // Salmon pink for racial inequality
  "#C6C112", // Warm brown for crime
  "#C6A8B9", // Blue-gray for education
];

// Add loading state management
let isLoading = true;
let cachedData = null;

// Initialize Pym
const pymChild = new pym.Child({ polling: 500 });

// Add back the missing processData function
function processData(data) {
  const processedData = [
    { id: "root", parent: "", value: 0 },
    ...data.map((d) => ({
      id: d.Issues,
      parent: "root",
      value: parseFloat(d.Percent) || 0,
    })),
  ];

  const root = d3
    .stratify()
    .id((d) => d.id)
    .parentId((d) => d.parent)(processedData)
    .sum((d) => d.value);

  return root;
}

// Add the getLightness function that was also missing
function getLightness(color) {
  const rgb = d3.color(color);
  return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
}

// Add the wrap function that was missing
function wrap(text, width) {
  text.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/);
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.2;
    const y = text.attr("y");
    const dy = 0;
    let tspan = text
      .text(null)
      .append("tspan")
      .attr("x", 4)
      .attr("y", y)
      .attr("dy", dy + "em");

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 4)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}

function createTreemap(providedWidth, providedHeight) {
  // Get container dimensions
  const container = document.getElementById("treemap");
  if (!container) {
    console.error("Treemap container not found");
    return;
  }

  // Show loading state
  if (isLoading) {
    container.style.opacity = "0.5";
  }

  const width = providedWidth || container.clientWidth;
  const height = providedHeight || container.clientHeight;

  // Clear existing SVG with transition
  d3.select("#treemap svg")
    .transition()
    .duration(200)
    .style("opacity", 0)
    .remove();

  // Create new SVG with initial opacity 0
  const svg = d3
    .select("#treemap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("opacity", 0);

  // Add tooltip if it doesn't exist
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
      .padding(2)
      .tile(d3.treemapSquarify.ratio(1))
      .round(true);

    const root = treemap(data);
    root.sort((a, b) => b.value - a.value);

    const colorScale = d3
      .scaleOrdinal()
      .domain(COLOR_DOMAIN)
      .range(COLOR_RANGE);

    // Create node groups with hover interaction
    const nodes = svg
      .selectAll("g.node-group")
      .data(root.leaves())
      .join("g")
      .attr("class", "node-group")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .style("opacity", 0)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip.classed("hidden", false).html(`
            <div class="tooltip-title">${d.id}</div>
            <div class="tooltip-value">${d.value}% of respondents</div>
          `);
        updateTooltipPosition(event);
      })
      .on("mousemove", updateTooltipPosition)
      .on("mouseleave", () => tooltip.classed("hidden", true));

    // Add rectangles
    nodes
      .append("rect")
      .attr("class", "node")
      .attr("width", (d) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d) => colorScale(d.id))
      .attr("data-background-lightness", (d) =>
        getLightness(colorScale(d.id)) < 0.5 ? "dark" : "light"
      );

    // Add text with proper sizing checks
    nodes.each(function (d) {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;

      if (width < MINIMUM_SIZE_FOR_LABEL || height < MINIMUM_SIZE_FOR_LABEL) {
        return;
      }

      const textGroup = d3
        .select(this)
        .append("g")
        .attr(
          "class",
          `text-group${
            width < MINIMUM_SIZE_FOR_DETAILS ||
            height < MINIMUM_SIZE_FOR_DETAILS
              ? " compact"
              : ""
          }`
        );

      textGroup
        .append("text")
        .attr("class", "node-label")
        .attr("x", 4)
        .attr("y", 24)
        .text(d.id)
        .call(wrap, width - 8);

      if (
        width >= MINIMUM_SIZE_FOR_DETAILS &&
        height >= MINIMUM_SIZE_FOR_DETAILS
      ) {
        textGroup
          .append("text")
          .attr("class", "node-value")
          .attr("x", 4)
          .attr("y", 48)
          .text(`${d.value}%`);
      }
    });

    // Fade in all elements smoothly
    svg.transition().duration(400).style("opacity", 1);

    nodes.transition().duration(400).style("opacity", 1);

    // Update loading state
    isLoading = false;
    container.style.opacity = "1";
  }

  function updateTooltipPosition(event) {
    const tooltipNode = tooltip.node();
    const padding = 10;

    let left = event.pageX + padding;
    let top = event.pageY + padding;

    // Adjust if tooltip would go off screen
    if (tooltipNode) {
      const tooltipWidth = tooltipNode.offsetWidth;
      const tooltipHeight = tooltipNode.offsetHeight;

      if (left + tooltipWidth > window.innerWidth - padding) {
        left = event.pageX - tooltipWidth - padding;
      }
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = event.pageY - tooltipHeight - padding;
      }
    }

    tooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  // Use cached data if available, otherwise fetch
  if (cachedData) {
    updateTreemap(cachedData);
  } else {
    d3.csv(SHEET_URL)
      .then((data) => {
        const processedData = processData(data);
        cachedData = processedData;
        updateTreemap(processedData);
      })
      .catch((error) => {
        console.error("Error loading or processing data:", error);
        container.style.opacity = "1";
        isLoading = false;
      });
  }
}

// Optimized resize handler
function initializeResizeHandling() {
  const container = document.getElementById("treemap");
  if (!container) {
    console.error("Treemap container not found");
    return () => {};
  }

  let resizeTimeout;
  let lastWidth = container.clientWidth;
  let lastHeight = container.clientHeight;

  const resizeHandler = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Prevent unnecessary redraws
    if (Math.abs(width - lastWidth) < 5 && Math.abs(height - lastHeight) < 5) {
      return;
    }

    lastWidth = width;
    lastHeight = height;

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      createTreemap(width, height);
      pymChild.sendHeight();
    }, RESIZE_DELAY);
  };

  // Use ResizeObserver if available
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }

  // Fallback to window resize event
  window.addEventListener("resize", resizeHandler);
  return () => window.removeEventListener("resize", resizeHandler);
}

// Initialize after DOM load
document.addEventListener("DOMContentLoaded", () => {
  createTreemap();
  const cleanup = initializeResizeHandling();
  window.addEventListener("unload", cleanup);
});
