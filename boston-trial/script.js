//#region - Universal variables
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";
const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

let nodesData, linksData;
let svg = d3.select("svg");
//#endregion

//#region - Get and parse data

// Call 'updateGraphLayout' after data is loaded
Promise.all([d3.csv(nodesURL), d3.csv(linksURL)]).then(([nodes, links]) => {
  nodesData = nodes;
  linksData = links;
  updateGraphLayout();
});
//#endregion

function updateGraphLayout() {
  // First, declare and initialize isSmallViewport
  const svgWidth = document.documentElement.clientWidth;
  const isSmallViewport = svgWidth < 600;

  const strokeWidth = isSmallViewport ? 1 : 2;

  //#region - Get viewport dimensions
  const svgHeight = window.innerHeight;
  //#endregion

  //#region - Determine layout based on viewport size
  const numCols = isSmallViewport ? 3 : 4; // Determine the number of columns
  const numRows = Math.ceil(nodesData.length / numCols); // Calculate the number of rows
  const nodeRadius = isSmallViewport ? 24 : 40; // Set the radius for the nodes
  const labelFontSize = isSmallViewport ? "8px" : "12px"; // Set the font size for labels
  const labelLineHeight = isSmallViewport ? "1em" : "1.2em"; // Set the line height for labels
  const labelPadding = isSmallViewport ? 10 : 20; // Set label padding
  //#endregion

  //#region - Calculate spacing between nodes
  const spacingX = svgWidth / (numCols + 1); // Horizontal spacing
  const spacingY = nodeRadius * 2 + labelPadding + 45; // Vertical spacing
  //#endregion

  //#region - Position nodes and add interactivity

  nodesData.forEach((node, i) => {
    node.x = (i % numCols) * spacingX + spacingX / 2; // Center nodes in each column
    node.y = Math.floor(i / numCols) * spacingY + spacingY / 2; // Center nodes in each row
  });

  function handleMouseOver(d, i) {
    // Log the node data for the hovered node
    console.log("Mouseover on node data:", d);

    // Log all links data for reference
    console.log("All links data:", linksData);

    // Highlight the connected links
    svg.selectAll(".link").attr("stroke-opacity", (link) => {
      const isLinked = link.source === d.id || link.target === d.id;
      // Log the link data and the result of the conditional check
      console.log(
        `Link from ${link.source} to ${link.target} is ${
          isLinked ? "highlighted" : "faded"
        }`
      );
      return isLinked ? 1.0 : 0.1;
    });

    // Highlight the connected nodes and their labels
    svg.selectAll(".node-image, .label").style("opacity", (node) => {
      const isConnected =
        node.id === d.id ||
        linksData.some((link) => {
          return (
            (link.source === d.id && link.target === node.id) ||
            (link.target === d.id && link.source === node.id)
          );
        });
      // Log the node data and the result of the conditional check
      console.log(
        `Node ${node.id} is ${isConnected ? "highlighted" : "faded"}`
      );
      return isConnected ? 1.0 : 0.1;
    });
  }

  function handleMouseOut(d, i) {
    // Log the mouseout event
    console.log("Mouseout on node data:", d);

    // Reset the connected links
    svg.selectAll(".link").attr("stroke-opacity", 0.6);

    // Reset the connected nodes and their labels
    svg.selectAll(".node-image, .label").style("opacity", 1.0);
  }

  //#endregion

  //#region - Select the SVG element

  if (svg.empty()) {
    svg = d3
      .select("body")
      .append("svg")
      .classed("svg-content-responsive", true);
  }
  //#endregion

  //#region - Set viewbox dimensions
  // Compute the width and height required by the nodes
  let maxX = 0,
    maxY = 0;
  nodesData.forEach((node) => {
    maxX = Math.max(maxX, node.x + nodeRadius + strokeWidth); // Find rightmost edge
    maxY = Math.max(maxY, node.y + nodeRadius + strokeWidth); // Find bottom edge
  });

  // The viewBox should be large enough to contain all elements
  const viewBoxWidth = maxX + spacingX;
  const viewBoxHeight = maxY + spacingY;

  // Align SVG content to top and center horizontally
  svg
    .attr(
      "viewBox",
      `-${strokeWidth / 2} -${strokeWidth / 2} ${viewBoxWidth} ${viewBoxHeight}`
    )
    .attr("preserveAspectRatio", "xMidYMin meet");
  //#endregion

  //#region - Links
  const nodeById = new Map(nodesData.map((d) => [d.id, d]));

  svg
    .selectAll(".link")
    .data(linksData)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", isSmallViewport ? 1 : 2)
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("x1", (d) => nodeById.get(d.source).x)
    .attr("y1", (d) => nodeById.get(d.source).y)
    .attr("x2", (d) => nodeById.get(d.target).x)
    .attr("y2", (d) => nodeById.get(d.target).y);
  //#endregion

  //#region - Images
  svg.selectAll(".node-image").remove();

  svg
    .selectAll(".node-image")
    .data(nodesData)
    .join("image")
    .attr("class", "node-image")
    .attr("xlink:href", (d) => d.imageUrl)
    .attr("x", (d) => d.x - nodeRadius)
    .attr("y", (d) => d.y - nodeRadius)
    .attr("width", nodeRadius * 2)
    .attr("height", nodeRadius * 2)
    .on("mouseover", function (event, d) {
      // Make sure to pass both event and d
      handleMouseOver(d); // Call the event handler with the data `d`
    })
    .on("mouseout", function (event, d) {
      // Make sure to pass both event and d
      handleMouseOut(d); // Call the event handler with the data `d`
    });

  // Assume this is your stroke width
  const effectiveNodeRadius = nodeRadius + strokeWidth / 2;

  // Create invisible circles that will serve as strokes around the images
  svg
    .selectAll(".node-stroke")
    .data(nodesData)
    .join("circle")
    .attr("class", "node-stroke")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", effectiveNodeRadius) // Use the effective radius
    .attr("fill", "none")
    .attr("stroke", "#333333")
    .attr("stroke-width", strokeWidth);

  //#endregion

  //#region - Labels

  const labelsGroup = svg.selectAll(".label").data(nodesData, (d) => d.id);
  labelsGroup.exit().remove();

  // Enter new labels
  const enteredLabels = labelsGroup
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle");

  // Update existing + newly entered labels
  enteredLabels
    .merge(labelsGroup)
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y + nodeRadius + labelPadding)
    .selectAll("tspan")
    .data((d) => [d.name].concat(d.role.split(","))) // Split roles and prepend the name
    .join("tspan")
    .attr("class", (d, i) => (i === 0 ? "name" : "role")) // Apply class based on whether it's the name or role
    .attr("x", (d, i, nodes) => d3.select(nodes[i].parentNode).attr("x"))
    .attr("dy", (d, i) => (i === 0 ? 0 : "1.2em")) // Adjust line height
    .text((d) => d);

  //#endregion
}

// Update layout on resize
window.addEventListener("resize", updateGraphLayout);
