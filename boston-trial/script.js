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

//#endregion

//#region - Load and process data

// Load and process data using jQuery, then initialize the graphic
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

// When document is fully loaded, run loadData function
$(document).ready(function () {
  loadData();
});

//#endregion

//#region - Create graphic

// Trigger the creation of nodes and links by calling setupLinks and setupNodes
function createGraphic() {
  if (!nodeById) {
    console.error("nodeById is undefined. Cannot create graphic.");
    return;
  }
  setupNodes();
  setupLinks();
}

//#region - Create links

// Bind link data to line elements and configure arrangement
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

// Set constants for styles and configurations
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

// Configure and position nodes based on the current viewport size and data
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

  renderNodes(nodeRadius);
}

// Calculate horizontal pacing between nodes
function calculateSpacing(width, numCols) {
  // Divide viewport width by number of columns to get spacing
  return width / numCols;
}

// Calculate offset spacing to center the nodes grid
function calculateInitialOffset(width, spacingX, numCols) {
  return (width - spacingX * (numCols - 1)) / 2;
}

// Calculate the x and y positions for each node and assign them
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

// Render the nodes in the SVG container
function renderNodes(nodesData, radius) {
  nodeGroup = svg
    .selectAll(".node-group")
    .data(nodesData)
    .enter()
    .append("g")
    .attr("class", "node-group")
    .attr("id", (d) => `node-${d.id}`)
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  nodeGroup
    .append("circle")
    .attr("class", "node")
    .attr("r", radius)
    .style("fill", config.fillColor)
    .style("stroke", config.strokeColor)
    .style("stroke-width", config.strokeWidth)
    // Attach a click event listener
    .on("click", function (event, d) {
      console.log("Node clicked:", d);
    });

  appendImages(nodeGroup, radius);
  appendText(nodeGroup, radius);
}

// Call the renderNodes function
renderNodes(10); // Pass the desired radius as an argument

// Add an image element to each node group
function appendImages(nodeGroup, radius) {
  nodeGroup
    .append("image")
    .attr("xlink:href", (d) => d.imageUrl)
    .attr("x", -radius)
    .attr("y", -radius)
    .attr("width", radius * 2)
    .attr("height", radius * 2);
}

// Add text labels to each node group
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

//#region - Interactivity

//#endregion
