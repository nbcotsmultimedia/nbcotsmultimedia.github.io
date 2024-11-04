// Constants
const RESIZE_DELAY = 250;
const SHEET_URL = `https://docs.google.com/spreadsheets/d/1UOhqRYV_TlJWWXGUIr8gO3JC2hDIdcGRO20-T1L75cU/export?format=csv&gid=1016009773`;
const MINIMUM_SIZE_FOR_TEXT = 100;

// Color configurations
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
let svg, treemapContainer;

// Initialize Pym
// const pymChild = new pym.Child({ polling: 500 });

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

// Text wrapping function
function wrap(text, width) {
  text.each(function () {
    const textElement = d3.select(this);
    const words = textElement.text().split(/\s+/);
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.2;
    const y = parseFloat(textElement.attr("y"));
    const dy = 0;
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
        line = [word];
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

// Efficient resize handler using requestAnimationFrame
function efficientResize() {
  if (!svg || !cachedData) return;

  const container = treemapContainer;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Update SVG dimensions
  svg
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Recalculate treemap layout
  const treemap = d3
    .treemap()
    .size([width, height])
    .padding(4)
    .tile(d3.treemapSquarify.ratio(1))
    .round(true);

  const root = treemap(cachedData);
  root.sort((a, b) => b.value - a.value);

  // Update existing elements
  const nodes = svg.selectAll("g.node-group").data(root.leaves());

  // Transition node positions
  nodes
    .transition()
    .duration(300)
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  // Update rectangles
  nodes
    .select("rect")
    .transition()
    .duration(300)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  // Update text
  nodes.select("g.text-group").each(function (d) {
    const textGroup = d3.select(this);
    const nodeWidth = d.x1 - d.x0;
    const nodeHeight = d.y1 - d.y0;
    const shouldShowText =
      nodeWidth > MINIMUM_SIZE_FOR_TEXT && nodeHeight > MINIMUM_SIZE_FOR_TEXT;

    textGroup
      .select("text")
      .style("display", shouldShowText ? "block" : "none")
      .style(
        "font-size",
        `${Math.max(8, Math.min(14, Math.min(nodeWidth, nodeHeight) / 5))}px`
      )
      .call(wrap, Math.max(0, nodeWidth - 8));
  });

  // Notify Pym
  // pymChild.sendHeight();

  // Notify Crosstalk
  setTimeout(function () {
    xtalk.signalIframe();
  }, 1000);
}

// Debounced resize using requestAnimationFrame
function debouncedResize() {
  let frame;
  return () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(efficientResize);
  };
}

// Initialize visualization
function initializeTreemap() {
  treemapContainer = document.getElementById("treemap");
  if (!treemapContainer) return;

  const width = treemapContainer.clientWidth;
  const height = treemapContainer.clientHeight;

  // Create SVG once
  svg = d3
    .select("#treemap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Create tooltip once
  let tooltip = d3.select("body").select(".treemap-tooltip");
  if (tooltip.empty()) {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "treemap-tooltip hidden")
      .style("position", "absolute");
  }

  // Load data once
  d3.csv(SHEET_URL)
    .then((data) => {
      cachedData = processData(data);
      createInitialTreemap(cachedData, tooltip);
      isLoading = false;
    })
    .catch((error) => {
      console.error("Error loading data:", error);
      isLoading = false;
    });
}

// Initial treemap creation
function createInitialTreemap(data, tooltip) {
  const width = treemapContainer.clientWidth;
  const height = treemapContainer.clientHeight;

  const treemap = d3
    .treemap()
    .size([width, height])
    .padding(4)
    .tile(d3.treemapSquarify.ratio(1))
    .round(true);

  const root = treemap(data);
  root.sort((a, b) => b.value - a.value);

  const colorScale = d3.scaleOrdinal().domain(COLOR_DOMAIN).range(COLOR_RANGE);

  // Create nodes
  const nodes = svg
    .selectAll("g.node-group")
    .data(root.leaves())
    .join("g")
    .attr("class", "node-group")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  // Add rectangles
  nodes
    .append("rect")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => colorScale(d.data.id))
    .attr("fill-opacity", 0.7)
    .attr("stroke", (d) => colorScale(d.data.id))
    .attr("stroke-width", 2);

  // Add text groups
  const textGroups = nodes
    .append("g")
    .attr("class", "text-group")
    .attr("pointer-events", "none")
    .attr("transform", "translate(0, 12)");

  // Add labels
  textGroups
    .append("text")
    .attr("x", 4)
    .attr("y", 4)
    .text((d) => d.data.id)
    .style("font-size", (d) => {
      const nodeSize = Math.min(d.x1 - d.x0, d.y1 - d.y0);
      return `${Math.max(8, Math.min(14, nodeSize / 5))}px`;
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
          `<div class="tooltip-title">${d.data.id}</div>
               <div class="tooltip-value">${d.value.toFixed(1)}%</div>`
        )
        .style("opacity", 1);
      updateTooltipPosition(event, tooltip);
    })
    .on("mousemove", (event) => updateTooltipPosition(event, tooltip))
    .on("mouseout", () => {
      tooltip.classed("hidden", true).style("opacity", 0);
    });

  pymChild.sendHeight();
}

// Helper function for tooltip positioning
function updateTooltipPosition(event, tooltip) {
  const tooltipWidth = tooltip.node().offsetWidth;
  const tooltipHeight = tooltip.node().offsetHeight;

  let x = event.pageX + 10;
  let y = event.pageY - tooltipHeight - 10;

  if (x + tooltipWidth > window.innerWidth) {
    x = window.innerWidth - tooltipWidth - 10;
  }
  if (y < 0) {
    y = event.pageY + 10;
  }

  tooltip.style("left", `${x}px`).style("top", `${y}px`);
}

// Initialize and set up event listeners
window.addEventListener("resize", debouncedResize());
initializeTreemap();
