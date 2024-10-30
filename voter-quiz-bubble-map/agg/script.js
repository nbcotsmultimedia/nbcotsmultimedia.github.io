// Color scale for sentiments
const colorScale = d3
  .scaleOrdinal()
  .domain(["positive", "neutral", "negative"])
  .range(["#4ade80", "#94a3b8", "#f87171"]);

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
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRx51Xt1gPVbW4Ds9YV6stsVKQc3_ct1fN2smYrK-aXOMLpkI-tEWfXM2H-rycbu1T058M8CwBwX6AO/pub?gid=1540148494&single=true&output=csv"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    console.log("Raw data:", text);

    // Parse CSV
    const csvData = d3.csvParse(text);
    console.log("Parsed CSV:", csvData);

    // Process the data
    const processedData = csvData
      .map((row) => ({
        id: row.Feeling,
        feeling: row.Feeling,
        percentage: parseFloat(row.Percent.replace("%", "")),
        sentiment: getSentiment(row.Feeling),
        value: parseFloat(row.Percent.replace("%", "")),
      }))
      .filter((item) => !isNaN(item.percentage));

    console.log("Processed data:", processedData);

    if (processedData.length === 0) {
      throw new Error("No valid data after processing");
    }

    return processedData;
  } catch (error) {
    console.error("Error fetching or parsing data:", error);
    return [];
  }
}

function createBubbleChart(data) {
  // Clear previous chart if any
  d3.select("#chart-container").selectAll("*").remove();

  // Get container dimensions
  const container = document.getElementById("chart-container");
  const width = container.clientWidth;
  const height = Math.min(width, 600);

  // Create SVG
  const svg = d3
    .select("#chart-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Create pack layout
  const pack = d3
    .pack()
    .size([width - 20, height - 20])
    .padding(3);

  // Create hierarchy
  const root = d3.hierarchy({ children: data }).sum((d) => d.value);

  // Generate bubble layout
  const circles = pack(root).leaves();

  // Create group for bubbles
  const bubbleGroup = svg.append("g").attr("transform", `translate(10, 10)`);

  // Add bubbles with transition
  const nodes = bubbleGroup
    .selectAll(".node")
    .data(circles)
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Add circles with transition
  nodes
    .append("circle")
    .attr("r", 0)
    .attr("fill", (d) => colorScale(d.data.sentiment))
    .attr("opacity", 0.7)
    .attr("stroke", (d) => d3.color(colorScale(d.data.sentiment)).darker())
    .attr("stroke-width", 2)
    .transition()
    .duration(1000)
    .attr("r", (d) => d.r);

  // Add hover effects
  nodes
    .selectAll("circle")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.9)
        .attr("stroke-width", 3);

      // Highlight legend item
      legendGroup
        .selectAll(".legend-item")
        .filter((item) => item === d.data.sentiment)
        .select("circle")
        .transition()
        .duration(200)
        .attr("r", 8);
    })
    .on("mouseout", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.7)
        .attr("stroke-width", 2);

      // Reset legend item
      legendGroup
        .selectAll(".legend-item circle")
        .transition()
        .duration(200)
        .attr("r", 6);
    });

  // Add text for feeling with fade-in
  nodes
    .append("text")
    .attr("dy", "-0.2em")
    .style("text-anchor", "middle")
    .style("font-size", (d) => `${Math.min(d.r / 3, 16)}px`)
    .style("opacity", 0)
    .text((d) => d.data.feeling)
    .transition()
    .delay(1000)
    .duration(500)
    .style("opacity", 1);

  // Add text for percentage with fade-in
  nodes
    .append("text")
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", (d) => `${Math.min(d.r / 3, 14)}px`)
    .style("opacity", 0)
    .text((d) => `${d.data.percentage}%`)
    .transition()
    .delay(1000)
    .duration(500)
    .style("opacity", 1);

  // Add legend
  const legendData = ["positive", "neutral", "negative"];
  const legendGroup = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 120}, 20)`);

  const legend = legendGroup
    .selectAll(".legend-item")
    .data(legendData)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 25})`);

  legend
    .append("circle")
    .attr("r", 6)
    .attr("fill", (d) => colorScale(d))
    .attr("opacity", 0.7)
    .attr("stroke", (d) => d3.color(colorScale(d)).darker())
    .attr("stroke-width", 2);

  legend
    .append("text")
    .attr("x", 15)
    .attr("y", 5)
    .text((d) => d.charAt(0).toUpperCase() + d.slice(1));

  // Add legend interactivity
  legend
    .on("mouseover", function (event, d) {
      // Highlight related bubbles
      nodes
        .filter((node) => node.data.sentiment === d)
        .selectAll("circle")
        .transition()
        .duration(200)
        .attr("opacity", 0.9)
        .attr("stroke-width", 3);

      // Highlight legend item
      d3.select(this).select("circle").transition().duration(200).attr("r", 8);
    })
    .on("mouseout", function (event, d) {
      // Reset bubbles
      nodes
        .selectAll("circle")
        .transition()
        .duration(200)
        .attr("opacity", 0.7)
        .attr("stroke-width", 2);

      // Reset legend item
      d3.select(this).select("circle").transition().duration(200).attr("r", 6);
    });
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
  }, 250)
);
