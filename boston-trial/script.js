// #region - Universal variables

// Set global variables for data and SVG element
const urls = {
  nodes:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv",
  links:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv",
};
let svg = d3.select("svg");
let nodeGroup, linkGroup;
let currentlyHighlighted = null; // Keep track of the highlighted node
let nodesData, linksData, nodeById;

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

// When the document is fully loaded, call the loadData function
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
  // Divide viewport width by the number of columns to get spacing
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

  // Add event listeners for interactivity
  nodeGroup.on("click", function (event, d) {
    event.stopPropagation(); // Prevent event bubbling
    manageNodeClick(this, event, d);
  });

  // Add event listeners for hover effect
  nodeGroup
    .on("mouseenter", function (event, d) {
      if (currentlyHighlighted === null) {
        d3.select(this).select(".node-border").style("display", "block");
        d3.select(this).classed("hovered", true);
        highlightNode(d.id);
        highlightConnected(d.id);
      }
    })
    .on("mouseleave", function (event, d) {
      if (currentlyHighlighted === null) {
        d3.select(this).select(".node-border").style("display", "none");
        d3.select(this).classed("hovered", false);
        resetHighlights();
      }
    });

  // Mobile interactions
  nodeGroup.on("touchstart", function (event, d) {
    console.log("touchstart", d.id);
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

function highlightNode(nodeId) {
  nodeGroup.classed("faded", (d) => d.id !== nodeId);
  // Hide all borders
  nodeGroup.selectAll(".node-border").style("display", "none");
  // Show border for the active node
  d3.select(`#node-${nodeId}`).select(".node-border").style("display", "block");
  // Add highlighted class for styling (if needed)
  d3.select(`#node-${nodeId}`)
    .classed("highlighted", true)
    .classed("faded", false);
}

function highlightConnected(nodeId) {
  // Reset all nodes and links to faded state first
  nodeGroup.classed("highlighted", false).classed("faded", true);
  linkGroup.classed("highlighted", false).classed("faded", true);

  // Set to store IDs of connected nodes
  const connectedNodes = new Set();

  // Iterate over links to find connections
  linksData.forEach((link) => {
    let sourceId = link.source;
    let targetId = link.target;

    // If the link source/target are objects, extract the ID
    if (typeof link.source === "object") sourceId = link.source.id;
    if (typeof link.target === "object") targetId = link.target.id;

    if (sourceId === nodeId || targetId === nodeId) {
      connectedNodes.add(sourceId);
      connectedNodes.add(targetId);
      // Select the link and apply classes
      d3.selectAll(`.link`)
        .filter(
          (d) =>
            (d.source === sourceId && d.target === targetId) ||
            (d.source === targetId && d.target === sourceId)
        )
        .classed("highlighted", true)
        .classed("faded", false);
    }
  });

  // Highlight the connected nodes and remove fade
  nodeGroup
    .classed("highlighted", (d) => connectedNodes.has(d.id))
    .classed("faded", (d) => !connectedNodes.has(d.id));
}

function resetHighlights() {
  nodeGroup.selectAll(".node-border").style("display", "none");
  nodeGroup.classed("highlighted", false).classed("faded", false);
  linkGroup.classed("highlighted", false).classed("faded", false);
}

const HEADER_HEIGHT = 120; // Adjust according to your header height
const DETAILS_PANEL_HEIGHT = 200; // Set the static height for the details panel
const PANEL_SVG_MARGIN = 10; // Adjust this value to control spacing between panel and SVG

function toggleDetailsPanel(show) {
  const detailsPanel = document.getElementById("details-panel");
  const header = document.querySelector(".header");
  const svgElement = d3.select("svg");

  const headerHeight = header.getBoundingClientRect().height;

  if (show) {
    detailsPanel.style.display = "block";
    detailsPanel.style.top = `${headerHeight}px`; // Position below the header
    detailsPanel.style.height = `${DETAILS_PANEL_HEIGHT}px`; // Fixed panel height
    detailsPanel.style.bottom = "auto";
    requestAnimationFrame(() => {
      detailsPanel.style.opacity = 1;
      detailsPanel.style.visibility = "visible";
      svgElement.style(
        "margin-top",
        `${DETAILS_PANEL_HEIGHT + PANEL_SVG_MARGIN}px`
      );
    });
  } else {
    detailsPanel.style.opacity = 0;
    detailsPanel.style.visibility = "hidden";
    setTimeout(() => {
      detailsPanel.style.display = "none";
      svgElement.style("margin-top", "0");
    }, 300); // Assume there's a CSS transition that matches this duration
  }
}

function updateDetailsPanel(node) {
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

  toggleDetailsPanel(true); // Show the panel
}

// Node click handler with positioning logic
function manageNodeClick(element, event, d) {
  event.preventDefault();
  event.stopPropagation();

  const nodeId = d.id;
  console.log(
    "Node clicked:",
    nodeId,
    "Currently highlighted:",
    currentlyHighlighted
  );

  if (currentlyHighlighted === nodeId) {
    console.log("Click on the same node, reset highlights");
    resetHighlights();
    currentlyHighlighted = null; // Clear the highlighted node state
    toggleDetailsPanel(false); // Explicitly hide the panel
  } else {
    resetHighlights(); // Reset any previous highlights
    highlightNode(nodeId); // Highlight the newly clicked node
    highlightConnected(nodeId); // Highlight connected links
    currentlyHighlighted = nodeId; // Update the currently highlighted node
    updateDetailsPanel(d); // Update panel content
    toggleDetailsPanel(true); // Explicitly show the panel
  }
}

// Mobile interactions
nodeGroup.on("touchstart", function (event, d) {
  console.log("touchstart", d.id);
  manageNodeClick(this, event, d);
});
