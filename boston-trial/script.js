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
  let freezeHighlights = false; // This flag will control the behavior of mouseleave events

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

  // Desktop interactions
  nodeGroup
    .on("mouseenter", function (event, d) {
      if (!freezeHighlights) {
        console.log("mouseenter - highlighting", d.id);
        highlightNode(d.id);
        highlightConnected(d.id);
      }
    })
    .on("mouseleave", function (event, d) {
      if (!freezeHighlights) {
        console.log("mouseleave - resetting highlights", d.id);
        resetHighlights();
      }
    })
    .on("click", function (event, d) {
      event.stopPropagation(); // Prevent event bubbling that might trigger svg click
      if (!freezeHighlights || currentlyHighlighted !== d.id) {
        console.log("Mouse click event on node", d.id);
        resetHighlights();
        highlightNode(d.id);
        highlightConnected(d.id);
        currentlyHighlighted = d.id;
        freezeHighlights = true; // Freeze highlights until another node is clicked or the same node is clicked again
      } else {
        console.log("Click on the same node, reset highlights");
        resetHighlights();
        currentlyHighlighted = null;
        freezeHighlights = false; // Allow hover effects to change highlights again
      }
    });

  // Mobile interactions
  nodeGroup.on("touchstart", function (event, d) {
    console.log("touchstart", d.id);
    manageNodeClick(this, event, d);
  });

  svg.on("click", function () {
    if (currentlyHighlighted && freezeHighlights) {
      console.log("SVG or non-node area clicked, resetting highlights.");
      resetHighlights();
      currentlyHighlighted = null;
      freezeHighlights = false;
    }
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
    // If the same node is clicked again, reset highlights
    console.log("Click on the same node, reset highlights");
    resetHighlights();
    currentlyHighlighted = null; // Clear the highlighted node state
  } else {
    // Different node is clicked or no node was previously selected
    resetHighlights(); // Reset any previous highlights
    highlightNode(nodeId); // Highlight the newly clicked node
    highlightConnected(nodeId); // Highlight connected links
    currentlyHighlighted = nodeId; // Update the currently highlighted node
    console.log("New node highlighted:", nodeId);
  }
}

function highlightNode(nodeId) {
  // Hide all borders
  nodeGroup.selectAll(".node-border").style("display", "none");
  // Show border for the active node
  d3.select(`#node-${nodeId}`).select(".node-border").style("display", "block");
  // Add highlighted class for styling (if needed)
  d3.select(`#node-${nodeId}`).classed("highlighted", true);
}

function highlightConnected(nodeId) {
  linkGroup.classed("highlighted", function (d) {
    // Assuming d.source and d.target are either node objects or IDs
    const sourceId = typeof d.source === "object" ? d.source.id : d.source;
    const targetId = typeof d.target === "object" ? d.target.id : d.target;
    return sourceId === nodeId || targetId === nodeId;
  });
}

function resetHighlights() {
  // Hide all borders
  nodeGroup.selectAll(".node-border").style("display", "none");
  // Remove highlighted class from nodes
  nodeGroup.classed("highlighted", false);
  // Reset all links to unhighlighted state
  linkGroup.classed("highlighted", false);
}
