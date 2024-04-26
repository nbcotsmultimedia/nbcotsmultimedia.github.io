// Define the dimensions of the SVG canvas
const width = 600; // Set the width of the SVG
const height = 800; // Set the height of the SVG, adjusted for more space

// Set global variables
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";

const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

// Define the grid layout parameters
const numCols = 4;
const spacingX = width / (numCols + 1);
const spacingY = 150;

// Load the nodes data
d3.csv(nodesURL).then((nodes) => {
  console.log("Nodes loaded:", nodes);

  // Assuming the nodes array has an 'id' field, add 'x' and 'y' properties based on the grid layout
  nodes.forEach((node, i) => {
    node.x = (i % numCols) * spacingX + spacingX;
    node.y = Math.floor(i / numCols) * spacingY + spacingY;
  });

  // Create an SVG element in the body of the HTML document
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Create SVG text elements for node labels
  svg
    .selectAll(".label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y + 70)
    .text((d) => d.name)
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

  // Load the links data
  d3.csv(linksURL).then((links) => {
    console.log("Links loaded:", links);

    // Create a map to find nodes by their IDs
    const nodeById = new Map(nodes.map((node) => [node.id, node]));

    // Calculate positions for the links based on node positions
    const calculatedLinks = links
      .map((link) => {
        const sourceNode = nodeById.get(link.source);
        const targetNode = nodeById.get(link.target);

        if (!sourceNode || !targetNode) {
          console.error("Source or target not found for link:", link);
          return null; // Skip this link if nodes are not found
        }

        // Calculate a midpoint for the horizontal segment of the link
        const midX = (sourceNode.x + targetNode.x) / 2;

        // Construct the path using SVG syntax for a 'polyline'
        const path = `M${sourceNode.x},${sourceNode.y} H${midX} V${targetNode.y} H${targetNode.x}`;

        return { source: sourceNode, target: targetNode, path };
      })
      .filter((link) => link); // Remove any undefined entries

    // Draw the paths for the links
    svg
      .selectAll(".link")
      .data(calculatedLinks)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d) => d.path)
      .style("stroke", "#999")
      .style("stroke-width", 2)
      .style("fill", "none")
      .style("stroke-opacity", 0.5); // Set the opacity of the links

    // Create SVG circle elements for each node
    svg
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 50)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .style("fill", "#cccccc");
  });
});
