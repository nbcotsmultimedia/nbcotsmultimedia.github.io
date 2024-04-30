//#region - Universal variables

// Set global variables for data and SVG element
const urls = {
  nodes:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv",
  links:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv",
};
let nodesData,
  linksData,
  nodeById,
  svg = d3.select("svg"),
  selectedNode,
  maxDetailsPanelHeight = 0; // Initialize with 0 or a minimum height you want to start with

//#endregion

//#region - Load and process data

// Load data asynchronously, and once available call the function to create the graphic
Promise.all([d3.csv(urls.nodes), d3.csv(urls.links)])
  .then((results) => {
    [nodesData, linksData] = results;
    nodeById = new Map(nodesData.map((node) => [node.id, node]));
    createGraphic();
  })
  .catch(console.error);

//#endregion

//#region - Create graphic

function createGraphic() {
  //#region - Setup

  const svgWidth = document.documentElement.clientWidth;
  const isSmallViewport = svgWidth < 600;

  // Adjust number of columns dynamically depending on screen size
  const numCols = isSmallViewport ? 3 : 4;

  // Adjust node radius dynamically
  const nodeRadius = isSmallViewport ? 36 : 40;

  // Calculate spacing between nodes
  const spacingX = svgWidth / numCols;

  // Apply an initial offset to the first column to center the grid
  const initialOffset = (svgWidth - spacingX * (numCols - 1)) / 2;

  // Calculate node positions
  nodesData.forEach((node, i) => {
    node.x = initialOffset + (i % numCols) * spacingX;
    node.y =
      Math.floor(i / numCols) *
        (nodeRadius * 2 + (isSmallViewport ? 10 : 20) + 45) +
      45;
  });

  // Clear SVG for redrawing
  svg.selectAll("*").remove();

  //#endregion

  //#region - Append links

  linkGroup = svg
    .selectAll(".link")
    .data(linksData)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.6)
    .attr("x1", (d) => nodeById.get(d.source).x)
    .attr("y1", (d) => nodeById.get(d.source).y)
    .attr("x2", (d) => nodeById.get(d.target).x)
    .attr("y2", (d) => nodeById.get(d.target).y);

  //#endregion

  //#region - Append nodes

  nodeGroup = svg
    .selectAll(".node-group")
    .data(nodesData)
    .enter()
    .append("g")
    .attr("class", "node-group")
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .on("click", nodeClicked);

  nodeGroup
    .selectAll("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", nodeRadius);

  // Add border
  nodeGroup
    .append("circle")
    .attr("class", "node-border")
    .attr("r", nodeRadius + 0.25)
    .style("fill", "none")
    .style("stroke", "#18206f")
    .style("stroke-width", 2)
    .style("display", "none");

  // Add image
  nodeGroup
    .append("image")
    .attr("class", "node-image")
    .attr("xlink:href", (d) => d.imageUrl)
    .attr("x", -nodeRadius)
    .attr("y", -nodeRadius)
    .attr("width", nodeRadius * 2)
    .attr("height", nodeRadius * 2);

  // Add text
  nodeGroup
    .append("text")
    .attr("class", "node-name")
    .attr("y", nodeRadius + 20)
    .attr("text-anchor", "middle")
    .text((d) => d.name);

  // Add background rectangle to labels
  nodeGroup.each(function (d, i) {
    const node = d3.select(this);
    const bbox = node.select("text.node-name").node().getBBox();

    // Add a small padding to the background rectangle
    const padding = 2;

    // Prepend a rect to serve as the background
    node
      .insert("rect", "text.node-name")
      .attr("class", "node-name-bg")
      .attr("x", bbox.x - padding)
      .attr("y", bbox.y - padding)
      .attr("width", bbox.width + padding * 2)
      .attr("height", bbox.height + padding * 2);
  });

  //#endregion
}

//#endregion

//#region - Interactivity

// Node click event handler
function nodeClicked(event, d) {
  event.stopPropagation(); // Prevent the click event from affecting parent elements

  // Reset all nodes' borders
  nodeGroup
    .selectAll("circle")
    .style("display", "none") // Hide all borders
    .attr("stroke", "none");

  if (selectedNode !== d) {
    // Check if node clicked is different from currently selected node

    // Highlight new node
    const circle = d3.select(this).select("circle");
    circle
      .style("display", "") // Make sure the circle is visible
      .attr("stroke", "#18206f")
      .attr("stroke-width", 3);

    selectedNode = d; // Update selected node to clicked node

    highlightConnected(d); // Call function to highlight nodes and links that are connected to selected node
    updateDetailsPanel(d); // Display details about selected node in panel
  } else {
    resetVisualState(); // If the clicked node is the same as the previously selected node, reset appearance of all nodes
  }
}

// Apply classes to highlight connected nodes
function highlightConnected(node) {
  const connectedNodes = new Set(); // Initialize a new set object to store IDs of connected nodes
  const connectedLinks = new Set(); // Initialize a new set object to store IDs of connected links

  // Identify connected nodes and links
  linksData.forEach((link) => {
    if (link.source === node.id || link.target === node.id) {
      connectedNodes.add(link.source);
      connectedNodes.add(link.target);
      connectedLinks.add(link.id || `${link.source}-${link.target}`);
    }
  });

  // Adjust label visibility
  nodeGroup.select("text.node-name").style("display", function (d) {
    return connectedNodes.has(d.id) ? "block" : "none"; // Only display labels for connected nodes
  });

  // Highlight or hide nodes based on connection
  nodeGroup
    .classed("highlighted", (d) => connectedNodes.has(d.id))
    .classed("faded", (d) => !connectedNodes.has(d.id));

  // Adjust visibility for connected and non-connected links
  linkGroup.each(function (d) {
    const linkId = d.id || `${d.source}-${d.target}`;
    if (connectedLinks.has(linkId)) {
      d3.select(this).classed("highlighted", true).style("display", "");
    } else {
      d3.select(this).classed("highlighted", false).style("display", "none");
    }
  });
}

// Function to reset visual state
function resetVisualState() {
  // Reset the classes and styles for nodes
  nodeGroup
    .classed("highlighted faded", false) // Remove both 'highlighted' and 'faded' classes from all nodes
    .select("image")
    .classed("node-selected", false) // Remove 'node-selected' class from images
    .select(".node-border")
    .style("display", "none"); // Hide node borders

  // Reset the classes and styles for links
  linkGroup
    .classed("highlighted", false)
    .style("display", null)
    .classed("faded", false)
    .style("display", null);

  // Additional check to make sure links reset properly
  svg.selectAll(".link").style("display", null);

  // Clear selection state
  selectedNode = null;

  // Reset visual elements
  svg.selectAll(".node-name").style("display", null); // Show all node names

  // Hide the details panel
  d3.select("#details-panel").style("display", "none");

  // Reset the top margin of the SVG
  d3.select("svg").style("margin-top", "0px");

  // Reset label visibility for all nodes
  nodeGroup.select("text.node-name").style("display", "block");
}

// Update details panel
function updateDetailsPanel(node) {
  // Clear existing contents
  const details = d3.select("#details-content").html("");

  // Append name and description
  details.append("h1").attr("class", "person-name").text(node.name);
  details.append("h2").attr("class", "person-role").text(node.role);
  details
    .append("p")
    .attr("class", "person-description")
    .text(node.blurb || "No additional information available.");

  // Group connections by type
  const connectionsByType = d3.group(
    linksData.filter(
      (link) => link.source === node.id || link.target === node.id
    ),
    (d) => d.type
  );

  // Iterate through each connection type and append them
  connectionsByType.forEach((connections, type) => {
    const typeContainer = details
      .append("div")
      .attr("class", "connection-category");

    typeContainer
      .append("span")
      .attr("class", "category-name")
      .text(`${type}: `);

    const nameList = connections
      .map((link) => {
        let connectedNodeId =
          link.source === node.id ? link.target : link.source;
        let connectedNode = nodesData.find((n) => n.id === connectedNodeId);
        return connectedNode ? connectedNode.name : "Unknown";
      })
      .join(", ");

    typeContainer.append("span").attr("class", "node-names").text(nameList);
  });

  // Display the details panel
  d3.select("#details-panel").style("display", "block");

  // Ensure the panel is visible to measure it correctly
  const detailsPanel = d3.select("#details-panel").style("display", "block");

  // Calculate the height of the details panel
  const panelHeight = detailsPanel.node().getBoundingClientRect().height;

  // Apply this height as top margin to the SVG
  d3.select("svg").style("margin-top", `${panelHeight}px`);
}

// Close details panel function
function closeDetailsPanel() {
  d3.select("#details-panel").style("display", "none");
  resetVisualState();
}

// SVG click listener for the background click to reset selection
svg.on("click", function () {
  if (selectedNode) {
    resetVisualState();
    selectedNode = null;
  }
});

// Resize listener
window.addEventListener("resize", () => {
  if (selectedNode) {
    closeDetailsPanel();
    resetVisualState();
    selectedNode = null;
  }
  createGraphic();
});

d3.select(".close-button").on("click", function () {
  closeDetailsPanel(); // Call your function to close the details panel
});

//#endregion
