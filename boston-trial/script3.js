//#region - Interactivity

function nodeClicked(event, node, nodeById, nodesData, linksData) {
  const selectedNode = node;
  updateDetailsPanel(node);
  highlightConnected(node, nodeById, nodesData, linksData);
}

// Declare 'selectedNode' in a broader scope to manage the state
let selectedNode = null;

function nodeClicked(event, node, nodeById, nodesData, linksData) {
  event.stopPropagation(); // Stop the event from bubbling up

  // Check if the node was previously selected
  if (selectedNode !== node) {
    selectedNode = node; // Update the selected node
    highlightConnected(node, nodeById, nodesData, linksData); // Highlight connected nodes and links
    highlightNode(node); // Highlight the node itself
    updateDetailsPanel(node); // Update the details panel with node data
  } else {
    resetVisualState(); // Reset the visual state if the same node is clicked again
    selectedNode = null; // Clear the selected node
  }
}

// Function to highlight the clicked node
function highlightNode(node) {
  // Hide all borders first
  d3.selectAll(".node-border").style("display", "none");

  // Show the border for the selected node
  d3.select(`#node-${node.id}`)
    .select(".node-border")
    .style("display", "block"); // Ensure the border is visible
}

// Function to reset the graphic's visual state
function resetVisualState() {
  d3.selectAll(".node-group")
    .style("display", "block")
    .classed("highlighted faded node-selected", false);

  d3.selectAll("image").style("display", "block"); // Ensure images are visible
  d3.selectAll(".node-border").style("display", "none");

  d3.selectAll(".link")
    .classed("highlighted faded", false)
    .style("display", "");

  d3.select("#details-panel").style("display", "none");
  setSvgMargin(); // Adjust the SVG margin if it's being adjusted based on the details panel
}

// Function to set SVG margin based on the details panel's state
function setSvgMargin() {
  const detailsPanel = document.getElementById("details-panel");
  const svgElement = document.querySelector("svg");
  let marginTop = 0;

  if (detailsPanel.style.display === "block") {
    const panelHeight = detailsPanel.offsetHeight;
    marginTop += panelHeight;
  }

  svgElement.style.marginTop = `${marginTop}px`;
}

// Helper functions to manage the details panel and SVG's top margin
function setSvgMargin() {
  // Retrieve and measure DOM elements
  const detailsPanel = document.getElementById("details-panel");
  const svgElement = document.querySelector("svg");

  // Start with a base margin of 20px
  let marginTop = 0;

  // If the details panel is displayed, add its height to the base margin
  if (detailsPanel.style.display === "block") {
    const panelHeight = detailsPanel.offsetHeight; // Get the current height of the details panel
    marginTop += panelHeight; // Add the panel's height to the base margin
  }

  // Set the SVG's top margin
  svgElement.style.marginTop = `${marginTop}px`;
}

// Reset the graphic's visual state
function resetVisualState() {
  // Ensure all node groups are visible
  nodeGroup
    .style("display", "block")
    .classed("highlighted faded node-selected", false);

  // Reset styles for individual components if necessary
  nodeGroup.selectAll("image").style("display", "block"); // Make sure images are visible

  nodeGroup.selectAll(".node-border").style("display", "none");

  // Reset links to their default visual state
  linkGroup.classed("highlighted faded", false).style("display", ""); // Ensure links are set to default display

  // Hide the details panel
  d3.select("#details-panel").style("display", "none");

  // Reset the SVG margin if it's being adjusted based on the details panel
  setSvgMargin();

  // Clear any selected node reference
  selectedNode = null;
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

// Update the details panel with new node info
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
  setSvgMargin();

  // Event listener for closing the details panel
  document.getElementById("close-button").onclick = function () {
    d3.select("#details-panel").style("display", "none");
  };
}

// Function to highlight the clicked node
function highlightNode(node) {
  // Hide all borders first
  nodeGroup.selectAll(".node-border").style("display", "none");

  // Show the border for the selected node
  d3.select(`#node-${node.id}`)
    .select(".node-border")
    .style("display", "block"); // Ensure the border is visible
}

// Highlight the nodes and links connected to the clicked node
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

// Event listeners //

// When the user clicks on the body, reset the visual state
d3.select("body").on("click", function (event) {
  // Convert D3 selection to a DOM element using node() and then use closest
  if (
    !d3.select(event.target).node().closest(".node-group") &&
    !d3.select(event.target).node().closest(".details-panel")
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

document.addEventListener("DOMContentLoaded", function () {
  setSvgMargin(); // Set initial SVG margin when the document is ready
});

document
  .getElementById("scrollbar-div")
  .addEventListener("scroll", function () {
    var div = document.getElementById("scrollbar-div");
    // Check if the scrollbar has moved from the top
    if (div.scrollTop > 0) {
      div.classList.add("shadow-top");
    } else {
      div.classList.remove("shadow-top");
    }
  });

//#endregion
