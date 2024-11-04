// Color scale for sentiments with improved colors and transparency
const colorScale = d3
  .scaleOrdinal()
  .domain(["positive", "neutral", "negative"])
  .range([
    // "#F0A6CA",
    "#A7E099", // positive
    "#8E8E93", // neutral
    "#F8623F", // negative
  ]);

// Add Pym
var pymChild = new pym.Child({ polling: 500 });

// Add tooltip div
d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background-color", "white")
  .style("border", "1px solid #ddd")
  .style("border-radius", "4px")
  .style("padding", "8px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

// Function to determine sentiment
function getSentiment(feeling) {
  const positiveWords = ["hopeful", "excited", "happy", "optimistic"];
  const negativeWords = ["anxious", "scared", "frustrated", "worried"];
  const neutralWords = ["indifferent", "other", "neutral"];

  feeling = feeling.toLowerCase();

  if (positiveWords.some((word) => feeling.includes(word))) return "positive";
  if (negativeWords.some((word) => feeling.includes(word))) return "negative";
  return "neutral";
}

// Function to get data from sheet
async function fetchData() {
  try {
    const response = await fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKZEhqvFfMk132Qb4CLvm521RVaxiCrjJsWQIDtf2EfOWnVpRf-xpAM24SkIpR4UEsqYMdqvNgdxbs/pub?gid=307716382&single=true&output=csv"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();

    // Parse CSV
    const csvData = d3.csvParse(text);

    // Process and group the data by sentiment
    const processedData = csvData
      .map((row) => ({
        name: row.Feeling,
        value: parseFloat(row.Percent.replace("%", "")),
        sentiment: getSentiment(row.Feeling),
      }))
      .filter((item) => !isNaN(item.value));

    // Group by sentiment
    const groupedData = d3.group(processedData, (d) => d.sentiment);

    // Create hierarchical structure
    const hierarchicalData = {
      name: "root",
      children: Array.from(groupedData, ([key, values]) => ({
        name: key,
        children: values,
      })),
    };

    console.log("Processed hierarchical data:", hierarchicalData);

    return hierarchicalData;
  } catch (error) {
    console.error("Error fetching or parsing data:", error);
    return null;
  }
}

// Function to create chart
function createBubbleChart(data) {
  if (!data) return;

  // Clear previous chart
  d3.select("#chart-container").selectAll("*").remove();

  // Get container dimensions
  const container = document.getElementById("chart-container");
  const width = container.clientWidth;
  const height = width * 0.75;
  const margin = { top: 10, right: 20, bottom: 10, left: 20 };

  // Adjusted minimum radius for labels
  const MIN_RADIUS_FOR_LABEL = 35;

  // Create SVG with background
  const svg = d3
    .select("#chart-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("background", "#FFFFFF"); // Clean white background

  // Create pack layout with adjusted padding
  const pack = d3
    .pack()
    .size([
      width - margin.left - margin.right,
      height - margin.top - margin.bottom,
    ])
    .padding(3);

  // Create hierarchy
  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  pack(root);

  // Create main chart group
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add sentiment group clusters with improved styling
  const sentimentGroups = chartGroup
    .selectAll(".sentiment-group")
    .data(root.children)
    .join("g")
    .attr("class", "sentiment-group");

  // Add sentiment labels at the top
  sentimentGroups
    .append("text")
    .attr("class", "sentiment-label")
    .attr("x", (d) => {
      // Calculate the center x position of all bubbles in the group
      const xPositions = d.children.map((child) => child.x);
      const minX = Math.min(...xPositions);
      const maxX = Math.max(...xPositions);
      return minX + (maxX - minX) / 2;
    })
    .attr("y", (d) => {
      // Get the top-most circle in this sentiment group
      const topBubble = d.children.reduce((top, current) =>
        current.y - current.r < top.y - top.r ? current : top
      );
      // Position the label just above the highest bubble
      return topBubble.y - topBubble.r - 8;
    })
    .attr("text-anchor", "middle")
    .style("font-family", "var(--font-arthouse)")
    .style("font-size", "18px")
    .style("font-weight", "600")
    .style("fill", (d) => d3.color(colorScale(d.data.name)).darker())
    .text((d) => d.data.name.charAt(0).toUpperCase() + d.data.name.slice(1));

  // Create nodes with improved transitions
  const nodes = sentimentGroups
    .selectAll(".feeling-node")
    .data((d) => d.children)
    .join("g")
    .attr("class", "feeling-node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Format percentage without trailing zeros
  const formatPercent = (value) => {
    return Number(value).toString() + "%";
  };

  // Add circles with enhanced styling and smoother transitions
  nodes
    .append("circle")
    .attr("r", 0)
    .attr("fill", (d) => {
      const color = d3.color(colorScale(d.parent.data.name));
      color.opacity = 0.85; // Semi-transparent fills
      return color;
    })
    .attr("stroke", (d) => d3.color(colorScale(d.parent.data.name)).darker(0.2))
    .attr("stroke-width", 1.5)
    .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.05))")
    .transition()
    .duration(1200)
    .ease(d3.easeCubicOut)
    .attr("r", (d) => d.r);

  // More subtle hover effects
  // More subtle hover effects
  nodes
    .selectAll("circle")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.08))")
        .attr("fill", (d) => {
          const color = d3.color(colorScale(d.parent.data.name));
          color.opacity = 0.95; // Slightly increase opacity on hover
          return color;
        });

      // First set the content
      d3.select(".tooltip").html(`
          <div class="tooltip-title">${d.data.name}</div>
          <div class="tooltip-value">${formatPercent(d.data.value)}</div>
        `);

      // Then handle the transition separately
      d3.select(".tooltip").transition().duration(150).style("opacity", 1);

      // Update tooltip position
      const tooltipWidth = d3.select(".tooltip").node().offsetWidth;
      const tooltipHeight = d3.select(".tooltip").node().offsetHeight;

      // Position tooltip to avoid edge overflow
      let tooltipX = event.pageX + 12;
      let tooltipY = event.pageY - 12;

      // Adjust if too close to right edge
      if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = event.pageX - tooltipWidth - 12;
      }

      // Adjust if too close to bottom edge
      if (tooltipY + tooltipHeight > window.innerHeight) {
        tooltipY = event.pageY - tooltipHeight - 12;
      }

      d3.select(".tooltip")
        .style("left", `${tooltipX}px`)
        .style("top", `${tooltipY}px`);
    })
    .on("mousemove", function (event) {
      const tooltipWidth = d3.select(".tooltip").node().offsetWidth;
      const tooltipHeight = d3.select(".tooltip").node().offsetHeight;

      let tooltipX = event.pageX + 12;
      let tooltipY = event.pageY - 12;

      if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = event.pageX - tooltipWidth - 12;
      }
      if (tooltipY + tooltipHeight > window.innerHeight) {
        tooltipY = event.pageY - tooltipHeight - 12;
      }

      d3.select(".tooltip")
        .style("left", `${tooltipX}px`)
        .style("top", `${tooltipY}px`);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke-width", 1.5)
        .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.05))")
        .attr("fill", (d) => {
          const color = d3.color(colorScale(d.parent.data.name));
          color.opacity = 0.85; // Return to original opacity
          return color;
        });

      d3.select(".tooltip").transition().duration(150).style("opacity", 0);
    });

  // Add labels with improved typography and positioning
  nodes
    .append("text")
    .attr("class", "feeling-label")
    .attr("dy", "-0.3em")
    .style("text-anchor", "middle")
    .style("font-family", "var(--font-arthouse)")
    .style("font-weight", "500")
    .style("fill", "#2C2C2E")
    .style("font-size", (d) => `${Math.min(d.r / 3, 14)}px`)
    .style("opacity", 0)
    .text((d) => (d.r >= MIN_RADIUS_FOR_LABEL ? d.data.name : ""))
    .transition()
    .delay(1000)
    .duration(500)
    .style("opacity", (d) => (d.r >= MIN_RADIUS_FOR_LABEL ? 1 : 0));

  // Add percentage labels with improved styling
  nodes
    .append("text")
    .attr("class", "percentage-label")
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-family", "var(--font-arthouse)")
    .style("font-weight", "600")
    .style("fill", "#2C2C2E")
    .style("font-size", (d) => `${Math.min(d.r / 3, 16)}px`)
    .style("opacity", 0)
    .text((d) =>
      d.r >= MIN_RADIUS_FOR_LABEL ? formatPercent(d.data.value) : ""
    )
    .transition()
    .delay(1000)
    .duration(500)
    .style("opacity", (d) => (d.r >= MIN_RADIUS_FOR_LABEL ? 1 : 0));
}

// Function to handle window resize
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    pymChild.sendHeight();
  };
}

// Initial load of the chart
async function initChart() {
  const data = await fetchData();
  createBubbleChart(data);
}

// Initial creation
initChart();

// Handle window resize
window.addEventListener(
  "resize",
  debounce(async () => {
    const data = await fetchData();
    createBubbleChart(data);
    pymChild.sendHeight();
  }, 250)
);
