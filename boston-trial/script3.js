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

// Event listener for clicks on the body to reset the highlight
document.body.addEventListener("click", function () {
  if (currentlyHighlighted) {
    currentlyHighlighted.classed("highlighted", false);
    currentlyHighlighted = null;
  }

  resetHighlights();
});

//#endregion

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
