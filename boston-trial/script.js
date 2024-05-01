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
  mouseY = 0,
  maxDetailsPanelHeight = 0; // Initialize with 0 or a minimum height

//#endregion

//#region - Load and process data

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

loadData();

//#endregion

//#region - Create graphic

function createGraphic() {
  setupNodes();
  setupLinks();
}

function setupNodes() {
  const svgWidth = document.documentElement.clientWidth;
  const isSmallViewport = svgWidth < 600;

  // Adjust number of columns dynamically depending on screen size
  const numCols = isSmallViewport ? 3 : 4;

  // Calculate spacing between nodes
  const spacingX = svgWidth / numCols;

  // Apply an initial offset to the first column to center the grid
  const initialOffset = (svgWidth - spacingX * (numCols - 1)) / 2;

  // Adjust node radius dynamically
  const nodeRadius = isSmallViewport ? 34 : 40;

  // Calculate node positions
  nodesData.forEach((node, i) => {
    node.x = initialOffset + (i % numCols) * spacingX;
    node.y =
      Math.floor(i / numCols) *
        (nodeRadius * 2 + (isSmallViewport ? 10 : 20) + 45) +
      45;
  });

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

    // Prepend a rect to serve as the text background
    node
      .insert("rect", "text.node-name")
      .attr("class", "node-name-bg")
      .attr("x", bbox.x - padding)
      .attr("y", bbox.y - padding)
      .attr("width", bbox.width + padding * 2)
      .attr("height", bbox.height + padding * 2);
  });
}

function setupLinks() {
  linkGroup = svg
    .selectAll(".link")
    .data(linksData)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.6)
    .lower()
    .attr("x1", (d) => nodeById.get(d.source).x)
    .attr("y1", (d) => nodeById.get(d.source).y)
    .attr("x2", (d) => nodeById.get(d.target).x)
    .attr("y2", (d) => nodeById.get(d.target).y);
}

//#endregion

//#region - Interactivity

// Helper functions to manage the details panel and SVG's top margin
function setSvgMargin() {
  // Retrieve and measure DOM elements
  const detailsPanel = document.getElementById("details-panel");
  const svgElement = document.querySelector("svg");
  const panelHeight = detailsPanel.offsetHeight;

  // If the details panel is displayed (block)...
  if (detailsPanel.style.display === "block") {
    // Set the SVG's top margin to the sum of the header's height and the panel's height
    svgElement.style.marginTop = `${panelHeight}px`;
  } else {
    // Otherwise, just use margin 0
    svgElement.style.marginTop = `0px`;
  }
}

// Show and hide the details panel
function toggleDetailsPanel() {
  // Retrieve details panel from the DOM
  const detailsPanel = document.getElementById("details-panel");

  // Toggle the display state of the panel between none and block
  detailsPanel.style.display =
    detailsPanel.style.display === "none" ? "block" : "none";

  // Call setSvgMargin to adjust the SVG's margin based on the new state of the details panel
  setSvgMargin();
}

// Reset the graphic's visual state
function resetVisualState() {
  // Reset styles and class attributes for the entire node group
  nodeGroup
    .style("display", "block") // Ensure groups are visible
    .classed("highlighted faded node-selected", false); // Remove visual modification classes

  // Reset styles for individual components if necessary
  nodeGroup.selectAll("image").style("display", "block"); // Make sure images are visible

  nodeGroup.selectAll(".node-border").style("display", "none"); // Keep node borders hidden when not selected

  // Reset links to their default visual state
  linkGroup.classed("highlighted faded", false).style("display", ""); // Ensure links are set to default display

  // Hide the details panel
  d3.select("#details-panel").style("display", "none");

  // Reset the SVG margin if it's being adjusted based on the details panel
  setSvgMargin();

  // Clear any selected node reference
  selectedNode = null;
}

// Update the details panel with new node info
function updateDetailsPanel(node) {
  // Clear details panel and populate it with data about the clicked node
  const details = d3.select("#details-content").html("");
  details.append("h1").attr("class", "person-name").text(node.name);
  if (node.role && node.role.trim()) {
    details.append("h2").attr("class", "person-role").text(node.role);
  }
  details
    .append("p")
    .attr("class", "person-description")
    .text(node.blurb || "No additional information available.");

  // Filter connections for the selected node, group them by type, and append this information to the details panel
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

  // Make the details panel visible
  d3.select("#details-panel").style("display", "block");
  // Update the SVG's margin to accommodate it
  setSvgMargin();
}

// Node click event
function nodeClicked(event, d) {
  // Stop the event from propagating further
  event.stopPropagation();

  // Calculate position for the details panel
  updatePanelPosition(event);

  // Highlight the node and connected links
  if (selectedNode !== d) {
    selectedNode = d;
    highlightConnected(d);
    updateDetailsPanel(d); // Update the panel with content specific to the clicked node
  } else {
    resetVisualState();
  }
}

// Highlight connected nodes and links
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

// Adjust panel position based on scroll location (mobile only)
function updatePanelPosition() {
  const detailsPanel = document.getElementById("details-panel");
  const scrollY = window.scrollY; // Current vertical scroll position of the window
  const viewportHeight = window.innerHeight; // Height of the viewport

  // Position the panel at the current scroll position + a fraction of the viewport height
  // This ensures it's always reasonably within the current viewable area.
  let topPosition = scrollY + viewportHeight * 0.1; // Adjust the multiplier as necessary

  // Cap the position to not go below a certain part of the screen
  topPosition = Math.min(topPosition, scrollY + viewportHeight * 0.8);

  detailsPanel.style.top = `${topPosition}px`;
  detailsPanel.style.position = "absolute"; // Make sure it's positioned relative to the nearest positioned ancestor
  detailsPanel.style.display = "block"; // Show the panel
}

// Event listeners //

// When the user clicks on the body, reset the visual state
d3.select("body").on("click", function (event) {
  if (
    !d3.select(event.target).closest(".node-group").node() &&
    !d3.select(event.target).classed("details-panel")
  ) {
    resetVisualState();
  }
});

// When a new node is selected, redraw graphics and reset the visual state
window.addEventListener("resize", () => {
  createGraphic();
  if (selectedNode) {
    resetVisualState();
  }
});

// Add event listener to the panel's close button to toggle its visibility
d3.select(".close-button").on("click", () => toggleDetailsPanel());

//#endregion
