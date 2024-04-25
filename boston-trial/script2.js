// Define the dimensions of the SVG canvas
const width = 600; // Set the width of the SVG
const height = 800; // Set the height of the SVG, adjusted for more space

// Set global variables
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";

const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

// Load nodes and then links; after loading, initialize the graph
d3.csv(nodesURL).then((nodes) => {
  console.log("Nodes loaded:", nodes); // Log the nodes

  // Create an SVG element in the body of the HTML and set its dimensions
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Assuming a simple grid layout
  const numCols = 4; // Total number of columns
  const spacingX = width / (numCols + 1); // Spacing between nodes horizontally
  const spacingY = 150; // Spacing between nodes vertically, adjust as needed

  // Create nodes (circle elements) based on the grid layout
  const node = svg
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", 50) // Radius of nodes
    .attr("cx", (d, i) => (i % numCols) * spacingX + spacingX) // X position
    .attr("cy", (d, i) => Math.floor(i / numCols) * spacingY + spacingY) // Y position
    .style("fill", "#cccccc"); // Example node color

  // Create labels (text elements) for the nodes
  const labels = svg
    .selectAll(".label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d, i) => (i % numCols) * spacingX + spacingX)
    .attr("y", (d, i) => Math.floor(i / numCols) * spacingY + spacingY + 70) // Adjust y value to place below the node
    .text((d) => d.name)
    .attr("text-anchor", "middle")
    .style("font-size", "12px");

  // Load nodes and then links; after loading, initialize the graph
  d3.csv(nodesURL).then((nodes) => {
    // ... (rest of your nodes code)

    // Once nodes are loaded and created, load the links
    d3.csv(linksURL).then((links) => {
      console.log("Links loaded:", links);

      // Create a map to quickly find nodes by their ID
      const nodeById = new Map(nodes.map((node) => [node.id, node]));

      // Calculate positions for links based on the node positions
      const calculatedLinks = links.map((link) => {
        const sourceNode = nodeById.get(link.source);
        const targetNode = nodeById.get(link.target);

        // Find the index of source and target nodes to calculate their positions
        const sourceIndex = nodes.indexOf(sourceNode);
        const targetIndex = nodes.indexOf(targetNode);

        // Calculate positions based on the grid layout
        return {
          source: {
            x: (sourceIndex % numCols) * spacingX + spacingX,
            y: Math.floor(sourceIndex / numCols) * spacingY + spacingY,
          },
          target: {
            x: (targetIndex % numCols) * spacingX + spacingX,
            y: Math.floor(targetIndex / numCols) * spacingY + spacingY,
          },
        };
      });

      // Create the link elements (line SVG elements)
      svg
        .selectAll(".link")
        .data(calculatedLinks)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)
        .style("stroke", "#999") // Example link color
        .style("stroke-opacity", 0.6) // Example link opacity
        .style("stroke-width", 2); // Example link stroke width
    });
  });
});

// You can add styling for .node and .label in your CSS file
