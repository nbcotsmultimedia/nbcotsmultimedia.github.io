//#region - Universal variables

// Set global variables for data and SVG element
const urls = {
  nodes:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv",
  links:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv",
};
let svg = d3.select("svg");
let nodeGroup;
let currentlyHighlighted = null; // Keep track of the highlighted node

//#endregion

//#region - Load and process data

// Define the function to load and process data using jQuery, then initialize the graphic
async function loadData() {
  try {
    [nodesData, linksData] = await Promise.all([
      d3.csv(urls.nodes),
      d3.csv(urls.links),
    ]);

    nodeById = new Map(nodesData.map((node) => [node.id, node]));

    createGraphic();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// When document is fully loaded, call the loadData function
$(document).ready(function () {
  loadData();
});

//#endregion

//#region - Create graphic

// Define the main function to trigger the creation of nodes and links
function createGraphic() {
  if (!nodeById) {
    console.error("nodeById is undefined. Cannot create graphic.");
    return;
  }
  setupNodes();
  setupLinks();
}

//#region - Create links

// Define the function to bind link data to line elements and configure arrangement
function setupLinks() {
  linkGroup = svg
    .selectAll(".link")
    .data(linksData)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.5)
    .lower()
    .attr("x1", (d) => {
      const sourceNode = nodeById.get(d.source);
      return sourceNode ? sourceNode.x : 0; // Ensure we're getting the correct x coordinate
    })
    .attr("y1", (d) => {
      const sourceNode = nodeById.get(d.source);
      return sourceNode ? sourceNode.y : 0; // Ensure we're getting the correct y coordinate
    })
    .attr("x2", (d) => {
      const targetNode = nodeById.get(d.target);
      return targetNode ? targetNode.x : 0; // Ensure we're getting the correct x coordinate
    })
    .attr("y2", (d) => {
      const targetNode = nodeById.get(d.target);
      return targetNode ? targetNode.y : 0; // Ensure we're getting the correct y coordinate
    });
}

//#endregion

//#region - Create nodes

// Set constants for styles and configurations of nodes
const config = {
  smallViewportWidth: 600,
  smallNodeRadius: 34,
  largeNodeRadius: 40,
  nodeSpacingSmall: 10,
  nodeSpacingLarge: 20,
  basePadding: 45,
  strokeWidth: 1,
  strokeColor: "#999",
  fillColor: "#fff",
};

// Define the function to configure and position nodes based on the current viewport size and data
function setupNodes() {
  const svgWidth = document.documentElement.clientWidth;
  const isSmallViewport = svgWidth < config.smallViewportWidth;
  const nodeRadius = isSmallViewport
    ? config.smallNodeRadius
    : config.largeNodeRadius;
  const numCols = isSmallViewport ? 3 : 4;

  // Calculate horizontal spacing between nodes
  const spacingX = calculateSpacing(svgWidth, numCols);

  // Calculate initial horizontal offset for the first node
  const initialOffset = calculateInitialOffset(svgWidth, spacingX, numCols);

  // For each node, pass these variables
  nodesData.forEach((node, i) =>
    positionNode(
      node,
      i,
      spacingX,
      initialOffset,
      nodeRadius,
      isSmallViewport,
      numCols
    )
  );

  // Ensure nodesData is passed to renderNodes
  renderNodes(nodesData, nodeRadius);
}

// Define the function to calculate horizontal pacing between nodes
function calculateSpacing(width, numCols) {
  // Divide viewport width by number of columns to get spacing
  return width / numCols;
}

// Define the function to calculate offset spacing (on either side of the group of node columns)
function calculateInitialOffset(width, spacingX, numCols) {
  return (width - spacingX * (numCols - 1)) / 2;
}

// Define the function to calculate the x and y positions for each node and assign them
function positionNode(
  node,
  index,
  spacingX,
  offset,
  radius,
  isSmallViewport,
  numCols
) {
  node.x = offset + (index % numCols) * spacingX;
  node.y =
    Math.floor(index / numCols) *
      (radius * 2 +
        (isSmallViewport ? config.nodeSpacingSmall : config.nodeSpacingLarge) +
        config.basePadding) +
    config.basePadding;
}

// Define the function to render the nodes in the SVG container
function renderNodes(nodesData, radius) {
  nodeGroup = svg
    .selectAll(".node-group")
    .data(nodesData)
    .enter()
    .append("g")
    .attr("class", "node-group")
    .attr("id", (d) => `node-${d.id}`)
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  // Append the circle to the node
  nodeGroup
    .append("circle")
    .attr("class", "node")
    .attr("r", radius)
    .style("fill", config.fillColor)
    .style("stroke", config.strokeColor)
    .style("stroke-width", config.strokeWidth);

  // Append the border to the node for hover effect
  nodeGroup
    .append("circle")
    .attr("class", "node-border")
    .attr("r", radius + 1); // slightly larger radius for the border

  // Append images to the nodes
  appendImages(nodeGroup, radius);

  // Append labels to the nodes
  appendText(nodeGroup, radius);

  nodeGroup.on("click touchstart", function (event, d) {
    console.log("Interaction triggered", d);
    event.preventDefault(); // Prevents browser's default behavior, important for touch devices
    manageNodeClick(this, event, d);
  });
}

// Define the function to add an image element to each node group
function appendImages(nodeGroup, radius) {
  nodeGroup
    .append("image")
    .attr("xlink:href", (d) => d.imageUrl)
    .attr("x", -radius)
    .attr("y", -radius)
    .attr("width", radius * 2)
    .attr("height", radius * 2);
}

// Define the function to add text labels to each node group
function appendText(nodeGroup, radius) {
  nodeGroup
    .append("text")
    .attr("class", "node-name")
    .attr("y", radius + 20)
    .attr("text-anchor", "middle")
    .text((d) => d.name);

  nodeGroup.each(function (d) {
    const node = d3.select(this);
    const bbox = node.select("text").node().getBBox();
    node
      .insert("rect", "text")
      .attr("class", "node-name-bg")
      .attr("x", bbox.x - 2)
      .attr("y", bbox.y - 2)
      .attr("width", bbox.width + 4)
      .attr("height", bbox.height + 4)
      .attr("rx", 5)
      .attr("ry", 5);
  });
}

//#endregion

//#endregion

//#region - Interactivity functions

// Define the function to manage node click, highlight logic, and details panel
function manageNodeClick(element, event, d) {
  event.stopPropagation();
  const nodeId = d.id;

  if (currentlyHighlighted === nodeId) {
    // Clear all highlights if the same node is clicked again
    clearAllHighlights();
  } else {
    // Clear previous highlights
    clearAllHighlights();

    // Highlight the new node and its connections
    highlightNode(nodeId);
    highlightConnected(nodeId);
    currentlyHighlighted = nodeId; // Update the highlighted node ID
  }
}

function clearAllHighlights() {
  nodeGroup.selectAll(".node-border").style("display", "none");
  nodeGroup.classed("highlighted", false).classed("faded", false);
  linkGroup.classed("highlighted", false).classed("faded", false);
  currentlyHighlighted = null;
}

function highlightConnectedNodesAndLinks(nodeId) {
  // This function should handle the highlighting logic for connected nodes and links
  // You would need to define how nodes and links are considered 'connected'
  // For example, you could use data attributes or have a map of connections
  d3.selectAll(`[data-connected-to="${nodeId}"]`).classed("highlighted", true);
  d3.selectAll(
    `.link[data-source="${nodeId}"], .link[data-target="${nodeId}"]`
  ).classed("highlighted", true);
}

function resetVisualState() {
  d3.selectAll(".node-group").style("stroke", null).style("stroke-width", null); // Reset styles
}

// Define the function to highlight the primary node
function highlightNode(nodeId) {
  // Hide all borders first
  nodeGroup.selectAll(".node-border").style("display", "none");

  // Show the border for the selected node
  d3.select(`#node-${nodeId}`).select(".node-border").style("display", "block");
}

// Define the function to highlight the secondary nodes and links
function highlightConnected(nodeId) {
  const connectedNodes = new Set();
  const connectedLinks = new Set();

  // Identify connected nodes and links
  linksData.forEach((link) => {
    if (link.source === nodeId || link.target === nodeId) {
      connectedNodes.add(link.source);
      connectedNodes.add(link.target);
      connectedLinks.add(link.id || `${link.source}-${link.target}`);
    }
  });

  // Highlight or hide nodes and links based on connection
  nodeGroup
    .classed("highlighted", (d) => connectedNodes.has(d.id))
    .classed("faded", (d) => !connectedNodes.has(d.id));
  linkGroup.each(function (d) {
    const linkId = d.id || `${d.source}-${d.target}`;
    d3.select(this)
      .classed("highlighted", connectedLinks.has(linkId))
      .classed("faded", !connectedLinks.has(linkId));
  });
}

// Define the function to reset node highlights
function resetHighlights() {
  // Reset all node highlights
  nodeGroup.selectAll(".node").classed("highlighted", false);
  nodeGroup.selectAll(".node-border").style("display", "none"); // Hide node borders

  // If there are any highlighted or faded classes applied to links, reset those as well
  linkGroup
    .selectAll(".link")
    .classed("highlighted", false)
    .style("display", "");
}

// Define the function to toggle the details pane open / closed
function toggleDetailsPanel(event, d) {
  event.stopPropagation(); // Prevent further propagation of the current event

  const detailsPanel = document.getElementById("details-panel");
  const isVisible = detailsPanel.style.display === "block";

  console.log("Panel is currently visible:", isVisible);

  if (!isVisible) {
    detailsPanel.style.display = "block";
    detailsPanel.style.opacity = "1";
    detailsPanel.style.visibility = "visible";
    console.log("Showing details panel");
  } else {
    detailsPanel.style.opacity = "0";
    detailsPanel.style.visibility = "hidden";
    console.log("Hiding details panel");
    setTimeout(() => {
      detailsPanel.style.display = "none";
    }, 300); // 300 miliseconds = 0.3 seconds
  }
}

// Define the function to populate information in the details pane
function updateDetailsPanel(node) {
  // Set the name in the 'name-container' span
  d3.select("#name-span").text(node.name);

  const scrollBar = document.getElementById("scrollbar-div");
  const details = d3.select("#details-content").html("");

  if (node.role && node.role.trim()) {
    details.append("h2").attr("class", "person-role").text(node.role);
  }

  details
    .append("p")
    .attr("class", "person-description")
    .text(node.blurb || "No additional information available.");

  details
    .append("p")
    .html(`<span class="connections-title">connections</span>`);

  d3.group(
    linksData.filter(
      (link) => link.source === node.id || link.target === node.id
    ),
    (d) => d.type
  ).forEach((connections, type) => {
    const typeContainer = details
      .append("div")
      .attr("class", "connection-category");
    typeContainer
      .append("span")
      .attr("class", "category-name")
      .text(`${type}: `);
    typeContainer
      .append("span")
      .attr("class", "node-names")
      .text(
        connections
          .map(
            (link) =>
              nodesData.find(
                (n) =>
                  n.id === (link.source === node.id ? link.target : link.source)
              )?.name || "Unknown"
          )
          .join(", ")
      );
  });

  scrollBar.scrollTop = 0;
  d3.select("#details-panel").style("display", "block");
  // setSvgMargin();
}

// Event listener for clicks on the body to reset the highlight
document.body.addEventListener("click", function () {
  if (currentlyHighlighted) {
    currentlyHighlighted.classed("highlighted", false);
    currentlyHighlighted = null;
  }

  resetHighlights();
});

//#endregion
