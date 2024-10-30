// Color scale for sentiments
const colorScale = d3
  .scaleOrdinal()
  .domain(["positive", "neutral", "negative"])
  .range([
    "#139A43", // Pigment green for positive
    "#D3D0CB", // Light gray for neutral
    "#ED6A5A", // Bittersweet for negative
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

async function fetchData() {
  try {
    const response = await fetch(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTP2jDjweObrdYMewZakqJnuGFCgUQ0zr0AYy0--C3t4vYv-knAiZ-LRJJ3DPMi5drlLC00qvosmSUI/pub?gid=2117342652&single=true&output=csv"
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

function createBubbleChart(data) {
  if (!data) return;

  // Clear previous chart if any
  d3.select("#chart-container").selectAll("*").remove();

  // Get container dimensions
  const container = document.getElementById("chart-container");
  const width = container.clientWidth;
  const height = width * (504.7 / 721); // Match the aspect ratio from your example
  const margin = { top: 5, right: 5, bottom: 5, left: 5 }; // Minimal margins

  // Minimum radius for showing labels
  const MIN_RADIUS_FOR_LABEL = 30;

  // Create SVG
  const svg = d3
    .select("#chart-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Create pack layout
  const pack = d3.pack().size([width, height]).padding(2);

  // Create hierarchy and compute the layout
  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  pack(root);

  // Create group for the chart
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add sentiment group clusters
  const sentimentGroups = chartGroup
    .selectAll(".sentiment-group")
    .data(root.children)
    .join("g")
    .attr("class", "sentiment-group");

  // Add sentiment labels
  //   sentimentGroups
  //     .append("text")
  //     .attr("class", "sentiment-label")
  //     .attr("x", (d) => d.x)
  //     .attr("y", (d) => d.y - d.r - 10)
  //     .attr("text-anchor", "middle")
  //     .style("font-size", "16px")
  //     .style("font-weight", "bold")
  //     .style("fill", (d) => d3.color(colorScale(d.data.name)).darker())
  //     .text((d) => d.data.name.charAt(0).toUpperCase() + d.data.name.slice(1));

  // Add circles for each feeling
  const nodes = sentimentGroups
    .selectAll(".feeling-node")
    .data((d) => d.children)
    .join("g")
    .attr("class", "feeling-node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Add circles with transition
  nodes
    .append("circle")
    .attr("r", 0)
    .attr("fill", (d) => colorScale(d.parent.data.name))
    .attr("opacity", 0.7)
    .attr("stroke", (d) => d3.color(colorScale(d.parent.data.name)).darker())
    .attr("stroke-width", 2)
    .transition()
    .duration(1000)
    .attr("r", (d) => d.r);

  // Add hover effects and tooltip
  nodes
    .selectAll("circle")
    .on("mouseover", function (event, d) {
      // Highlight circle
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.9)
        .attr("stroke-width", 3);

      // Show tooltip
      d3.select(".tooltip")
        .style("opacity", 1)
        .html(
          `
                    <div class="tooltip-title">${d.data.name}</div>
                    <div class="tooltip-value">${d.data.value}%</div>
                `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mousemove", function (event) {
      // Move tooltip with mouse
      d3.select(".tooltip")
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", function (event, d) {
      // Reset circle
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.7)
        .attr("stroke-width", 2);

      // Hide tooltip
      d3.select(".tooltip").style("opacity", 0);
    });

  // Add text for feeling names (only for larger bubbles)
  nodes
    .append("text")
    .attr("dy", "-0.2em")
    .style("text-anchor", "middle")
    .style("font-size", (d) => `${Math.min(d.r / 3, 16)}px`)
    .style("opacity", 0)
    .text((d) => (d.r >= MIN_RADIUS_FOR_LABEL ? d.data.name : ""))
    .transition()
    .delay(1000)
    .duration(500)
    .style("opacity", (d) => (d.r >= MIN_RADIUS_FOR_LABEL ? 1 : 0));

  // Add text for percentages (only for larger bubbles)
  nodes
    .append("text")
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", (d) => `${Math.min(d.r / 3, 14)}px`)
    .style("opacity", 0)
    .text((d) => (d.r >= MIN_RADIUS_FOR_LABEL ? `${d.data.value}%` : ""))
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
