// Define constants first
const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQKZEhqvFfMk132Qb4CLvm521RVaxiCrjJsWQIDtf2EfOWnVpRf-xpAM24SkIpR4UEsqYMdqvNgdxbs/pub?gid=664937285&single=true&output=csv`;
const MINIMUM_SIZE_FOR_DETAILS = 160; // Minimum pixel size to show details
const MINIMUM_SIZE_FOR_LABEL = 100; // Minimum pixel size to show label

// Color palette
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
  "#5B7BB4", // Clear blue for economy
  "#E1875E", // Warm coral for abortion rights
  "#9C6B98", // Distinct purple for immigration
  "#63A8A4", // Turquoise for national security
  "#7FB069", // Fresh green for healthcare
  "#D6A344", // Golden yellow for climate
  "#8B5E83", // Deep mauve for gun policy
  "#DB7F7F", // Salmon pink for racial inequality
  "#B47E4D", // Warm brown for crime
  "#8E97A4", // Blue-gray for education
];

function createTreemap() {
  // Get container dimensions
  const container = document.getElementById("treemap");
  console.log("Container dimensions:", {
    width: container.clientWidth,
    height: container.clientHeight,
  });
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Clear existing SVG
  d3.select("#treemap svg").remove();

  // Create tooltip div if it doesn't exist
  let tooltip = d3.select("body").select(".treemap-tooltip");
  if (tooltip.empty()) {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "treemap-tooltip hidden")
      .style("position", "absolute");
  }

  // Create new SVG with current dimensions
  const svg = d3
    .select("#treemap")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);

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

  function getLightness(color) {
    const rgb = d3.color(color);
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  }

  function updateTooltipPosition(event, bounds) {
    const tooltipWidth = tooltip.node().offsetWidth;
    const tooltipHeight = tooltip.node().offsetHeight;
    const padding = 10;

    let left = event.pageX + padding;
    let top = event.pageY + padding;

    // Adjust if tooltip would go off screen
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = event.pageX - tooltipWidth - padding;
    }
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = event.pageY - tooltipHeight - padding;
    }

    tooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  function showTooltip(event, d) {
    tooltip.classed("hidden", false).html(`
        <div class="tooltip-title">${d.id}</div>
        <div class="tooltip-value">${d.value}% of voters</div>
      `);

    updateTooltipPosition(event, d);
  }

  function hideTooltip() {
    tooltip.classed("hidden", true);
  }

  function moveTooltip(event, d) {
    updateTooltipPosition(event, d);
  }

  function wrap(text, width) {
    text.each(function (d) {
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

    const nodes = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    // Create node groups with hover interaction
    const nodeGroups = nodes
      .append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .on("mouseover", showTooltip)
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip);

    // Add rectangles to node groups
    nodeGroups
      .append("rect")
      .attr("class", "node")
      .attr("width", (d) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d) => colorScale(d.id))
      .attr("data-background-lightness", (d) =>
        getLightness(colorScale(d.id)) < 0.5 ? "dark" : "light"
      );

    const textGroups = nodeGroups.append("g").attr("class", (d) => {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      return `text-group${
        width < MINIMUM_SIZE_FOR_DETAILS || height < MINIMUM_SIZE_FOR_DETAILS
          ? " compact"
          : ""
      }`;
    });

    textGroups.each(function (d) {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;

      if (width < MINIMUM_SIZE_FOR_LABEL || height < MINIMUM_SIZE_FOR_LABEL) {
        return;
      }

      const group = d3.select(this);

      group
        .append("text")
        .attr("class", "node-label")
        .attr("x", 4)
        .attr("y", 24)
        .text(d.id)
        .call(wrap, d.x1 - d.x0 - 8);

      if (
        width >= MINIMUM_SIZE_FOR_DETAILS &&
        height >= MINIMUM_SIZE_FOR_DETAILS
      ) {
        group
          .append("text")
          .attr("class", "node-value")
          .attr("x", 4)
          .attr("y", 48)
          .text(`${d.value}%`);
      }
    });
  }

  // Load and process data
  return d3
    .csv(SHEET_URL)
    .then((data) => {
      console.log("Raw data:", data); // Check if data is loading
      const root = processData(data);
      console.log("Processed root:", root); // Check processed data
      updateTreemap(root);
    })
    .catch((error) => {
      console.error("Error loading or processing data:", error);
      // Add more specific error handling
      if (error.name === "TypeError") {
        console.error("Network error - check CORS settings");
      }
    });
}

// Initialize after the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initial creation
  createTreemap();

  // Add resize handler with debounce
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      createTreemap();
    }, 250);
  });
});
