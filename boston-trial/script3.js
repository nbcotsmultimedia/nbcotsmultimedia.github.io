///////////// tktktktkt
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

// Define the function to move the SVG depending on details pane position
function setSvgMargin() {
  console.log("set svg margin");
}

// Define the function to reset the graphic's visual state
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

// Define the function to move the SVG depending on details pane position
function setSvgMargin() {
  const detailsPanel = document.getElementById("details-panel");
  const svgElement = document.querySelector("svg");
  const fromBottom = detailsPanel.classList.contains("from-bottom");

  if (detailsPanel.style.display === "block") {
    const panelHeight = detailsPanel.offsetHeight;

    if (fromBottom) {
      // Extend the SVG container downwards by increasing the bottom padding
      svgElement.style.paddingBottom = `${panelHeight}px`;
      svgElement.style.marginBottom = `-${panelHeight}px`; // Negative margin to pull the content up

      // Optionally, scroll to ensure SVG is visible above the details panel
      window.scrollTo({
        top: svgElement.getBoundingClientRect().top + window.scrollY - 50,
        behavior: "smooth",
      });
    } else {
      // Adjust the top margin normally if the panel is not from the bottom
      svgElement.style.marginTop = `${panelHeight}px`;
    }
  } else {
    // Reset margins and paddings when the details panel is not displayed
    svgElement.style.marginTop = "0";
    svgElement.style.paddingBottom = "0";
    svgElement.style.marginBottom = "0";
  }
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
