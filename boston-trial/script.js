// Set global variables
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";

const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

// Assuming a simple grid layout
const numRows = 4; // Total number of rows
const numCols = 4; // Total number of columns
const spacingX = width / (numCols + 1); // Spacing between nodes horizontally
const spacingY = height / (numRows + 1); // Spacing between nodes vertically

// Load nodes and then links; after loading, initialize the graph
d3.csv(nodesURL, (d) => ({
  id: d.id,
  name: d.name,
  role: d.role, // Removed duplicate role assignment
})).then((nodes) => {
  console.log("Nodes loaded:", nodes); // Log the nodes

  d3.csv(linksURL, (d) => ({
    source: d.source,
    target: d.target,
    type: d.type,
  })).then((links) => {
    console.log("Links loaded:", links); // Log the links
    initializeGraph({ nodes, links });
  });
});

// Initialize graph

function initializeGraph(graphData) {
  // Log the combined graph data to check if nodes and links are correctly loaded
  console.log("Graph data loaded:", graphData);

  // Define the dimensions of the SVG canvas
  const width = 600; // Set the width of the SVG
  const height = 600; // Set the height of the SVG

  // Create an SVG element in the body of the HTML and set its dimensions
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Initialize the simulation with forces
  const simulation = d3
    .forceSimulation(graphData.nodes)
    // Link force based on loaded links
    .force(
      "link",
      d3.forceLink(graphData.links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody()) // Repelling force between nodes
    .force("center", d3.forceCenter(width / 2, height / 2)); // Centering force

  // Define the simulation's "tick" event handler
  simulation.nodes(graphData.nodes).on("tick", ticked);
  simulation.force(
    "link",
    d3
      .forceLink(graphData.links)
      .id((d) => d.id)
      .distance(100)
  ); // Increase the distance to space out connected nodes

  simulation.force("charge", d3.forceManyBody().strength(-120)); // Increase the magnitude of the negative value for more repulsion

  simulation.force(
    "collide",
    d3.forceCollide().radius((d) => d.radius + 10)
  ); // Adjust the radius for the desired spacing

  // Create the links (line elements) and set their properties
  const link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graphData.links) // Bind link data
    .enter()
    .append("line") // Create line elements for each link
    .attr("stroke-width", 2); // Set the stroke width of the lines

  // Create the nodes (circle elements) and set their properties
  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graphData.nodes) // Bind node data
    .enter()
    .append("circle") // Create circle elements for each node
    .attr("r", 5) // Set the radius of the circles
    // Add drag behavior to nodes to allow interaction
    .call(
      d3
        .drag()
        .on("start", dragstarted) // Define what happens on drag start
        .on("drag", dragged) // Define what happens when dragging
        .on("end", dragended)
    ); // Define what happens when drag ends

  // After creating nodes and links
  const labels = svg
    .append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(graphData.nodes)
    .enter()
    .append("text")
    .text((d) => d.name);

  // Function to update positions of nodes and links on each tick
  function ticked() {
    // Update link positions
    link
      .attr("x1", (d) => d.source.x) // Set the x1 position of the line
      .attr("y1", (d) => d.source.y) // Set the y1 position of the line
      .attr("x2", (d) => d.target.x) // Set the x2 position of the line
      .attr("y2", (d) => d.target.y); // Set the y2 position of the line

    // Update node positions
    node
      .attr("cx", (d) => d.x) // Set the x position of the circle
      .attr("cy", (d) => d.y); // Set the y position of the circle

    // Update label positions based on the node's current position
    labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
  }

  // Function definitions for drag events
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart(); // Reheat the simulation
    d.fx = d.x; // Fix the node's position in x
    d.fy = d.y; // Fix the node's position in y
  }

  function dragged(event, d) {
    d.fx = event.x; // Set the node's fixed x position to the current event x position
    d.fy = event.y; // Set the node's fixed y position to the current event y position
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0); // Cool down the simulation
    d.fx = null; // Unfix the node's position in x
    d.fy = null; // Unfix the node's position in y
  }
}
