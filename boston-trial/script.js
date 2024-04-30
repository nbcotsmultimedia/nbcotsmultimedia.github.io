//#region - Universal variables

// URLs to data tabs
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";
const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

// Global variables for data, SVG element, tooltip, and selected node
let nodesData, linksData, nodeById;
let svg = d3.select("svg");
let tooltip;
let selectedNode = null;

//#endregion

//#region - Load and process data

Promise.all([d3.csv(nodesURL), d3.csv(linksURL)])
  .then((results) => {
    nodesData = results[0];
    linksData = results[1];
    nodeById = new Map(nodesData.map((node) => [node.id, node]));
    initializeTooltip();
    updateGraphicLayout();
  })
  .catch((error) => console.error("Error loading data: ", error));

//#endregion

//#region - Initialize tooltip

function initializeTooltip() {
  tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("padding", "10px")
    .style("background", "#fff")
    .style("border", "1px solid #ddd")
    .style("border-radius", "5px")
    .style("text-align", "left");
}

//#endregion

//#region - Update graphic

// Define and update graphic layout
function updateGraphicLayout() {
  const svgWidth = document.documentElement.clientWidth;
  const svgHeight = window.innerHeight;
  const isSmallViewport = svgWidth < 600;
  const numCols = isSmallViewport ? 3 : 4;
  const nodeRadius = isSmallViewport ? 24 : 40;
  const spacingX = svgWidth / (numCols + 1);
  const spacingY = nodeRadius * 2 + (isSmallViewport ? 10 : 20) + 45;

  // Calculate node positions
  nodesData.forEach((node, i) => {
    node.x = (i % numCols) * spacingX + spacingX / 2;
    node.y = Math.floor(i / numCols) * spacingY + spacingY / 2;
  });

  // Clear SVG for redrawing
  svg.selectAll("*").remove();

  //#region - Append links

  const linkGroup = svg
    .selectAll(".link")
    .data(linksData)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("x1", (d) => nodeById.get(d.source).x)
    .attr("y1", (d) => nodeById.get(d.source).y)
    .attr("x2", (d) => nodeById.get(d.target).x)
    .attr("y2", (d) => nodeById.get(d.target).y);

  //#endregion

  //#region - Append nodes and labels

  const nodeGroup = svg
    .selectAll(".node-group")
    .data(nodesData)
    .enter()
    .append("g")
    .attr("class", "node-group")
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .on("click", nodeClicked);

  nodeGroup
    .append("image")
    .attr("class", "node-image")
    .attr("xlink:href", (d) => d.imageUrl)
    .attr("x", -nodeRadius)
    .attr("y", -nodeRadius)
    .attr("width", nodeRadius * 2)
    .attr("height", nodeRadius * 2);

  nodeGroup
    .append("text")
    .attr("class", "node-name")
    .attr("y", nodeRadius + 20)
    .attr("text-anchor", "middle")
    .text((d) => d.name);

  nodeGroup
    .append("text")
    .attr("class", "node-role")
    .attr("y", nodeRadius + 35)
    .attr("text-anchor", "middle")
    .text((d) => d.role);

  //#endregion
}

//#endregion

//#region - Interactivity

// Node click event handler
function nodeClicked(event, d) {
  if (selectedNode === d) {
    resetVisualState();
    selectedNode = null;
  } else {
    selectedNode = d;
    highlightConnected(d);
    updateDetailsPanel(d);
  }
  event.stopPropagation(); // Prevents the click from being detected by the SVG
}

// Highlight connected nodes and links
function highlightConnected(node) {
  const connectedNodes = new Set();
  linksData.forEach((link) => {
    if (link.source === node.id || link.target === node.id) {
      connectedNodes.add(link.source);
      connectedNodes.add(link.target);
    }
  });

  // Apply 'highlighted' or 'faded' classes based on the connection
  svg
    .selectAll(".node-group")
    .classed("highlighted", (d) => connectedNodes.has(d.id))
    .classed("faded", (d) => !connectedNodes.has(d.id));
  svg
    .selectAll(".link")
    .classed(
      "highlighted",
      (d) => connectedNodes.has(d.source) || connectedNodes.has(d.target)
    )
    .classed(
      "faded",
      (d) => !connectedNodes.has(d.source) && !connectedNodes.has(d.target)
    );
}

// Node click event handler
function nodeClicked(event, d) {
  if (selectedNode === d) {
    // Node is deselected
    resetVisualState();
    selectedNode = null;
  } else {
    // Node is selected
    selectedNode = d;
    highlightConnected(d);
    updateDetailsPanel(d);
  }
  event.stopPropagation(); // Prevents the click event from propagating to the SVG
}

// SVG click listener for the background click to reset selection
svg.on("click", function () {
  if (selectedNode) {
    console.log("SVG background clicked - resetting visual state.");
    resetVisualState();
    selectedNode = null;
  }
});

// Node click event listener with a console log
nodeGroup.on("click", function (event, d) {
  event.stopPropagation();
  console.log("Node clicked - processing node selection.");
  nodeClicked(event, d);
});

// Reset visual state function with a console log
function resetVisualState() {
  console.log("Resetting visual state to default.");
  nodeGroup.classed("highlighted", false).classed("faded", false);
  linkGroup.classed("highlighted", false).classed("faded", false);
  d3.select("#details-panel").style("display", "none");
}

// Window click event listener with a console log
window.addEventListener("click", function (event) {
  const insideSVG = svg.node().contains(event.target);
  const insideDetailsPanel = document
    .getElementById("details-panel")
    .contains(event.target);

  if (!insideSVG && !insideDetailsPanel) {
    console.log(
      "Click outside SVG and details panel - resetting visual state."
    );
    resetVisualState();
    selectedNode = null;
    closeDetailsPanel();
  }
});

// Update details panel
function updateDetailsPanel(node) {
  const detailsHTML = `<h1>${node.name}</h1><p>${
    node.description || "No additional information available."
  }</p>`;
  d3.select("#details-content").html(detailsHTML);
  d3.select("#details-panel").style("display", "block");

  const detailsPanelHeight =
    document.getElementById("details-panel").offsetHeight;
  svg.style("margin-top", `${detailsPanelHeight}px`);
}

// Close details panel function with a console log
function closeDetailsPanel() {
  console.log("Closing details panel.");
  d3.select("#details-panel").style("display", "none");
  // If needed, reset any related visual states
  resetVisualState();
}

// Resize listener
window.addEventListener("resize", () => {
  if (selectedNode) {
    closeDetailsPanel();
    resetVisualState();
    selectedNode = null;
  }
  updateGraphicLayout();
});

//#endregion
