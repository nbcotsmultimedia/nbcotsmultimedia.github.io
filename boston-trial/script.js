// Set global variables
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";

const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

// Load nodes
d3.csv(nodesURL, (d) => ({
  id: d.id, // Adjust according to your column names
  name: d.name,
  role: d.role,
  type: d.type,
  role: d.role,
})).then((nodes) => {
  console.log("Nodes loaded:", nodes); // Log the nodes to ensure they are loaded correctly

  // Load links after nodes have been loaded
  d3.csv(linksURL, (d) => ({
    source: d.source,
    target: d.target,
    type: d.type,
  })).then((links) => {
    console.log("Links loaded:", links); // Log the links to ensure they are loaded correctly

    // Now that both have been loaded, initialize the graph
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

  // Define a custom force for clustering nodes by their group
  function forceCluster() {
    const strength = 0.2; // Strength of the force

    function force(alpha) {
      const centroids = new Map(); // Keeps track of the centroid of each group

      // Compute the centroid of each group
      graphData.nodes.forEach(function (node) {
        if (!centroids.has(node.group)) {
          centroids.set(node.group, { x: 0, y: 0, count: 0 });
        }
        const centroid = centroids.get(node.group);
        centroid.x += node.x;
        centroid.y += node.y;
        centroid.count += 1;
      });

      centroids.forEach((centroid) => {
        centroid.x /= centroid.count;
        centroid.y /= centroid.count;
      });

      // Apply forces to nodes towards their group's centroid
      graphData.nodes.forEach(function (node) {
        if (node.type === "individual" && centroids.has(node.group)) {
          const centroid = centroids.get(node.group);
          node.vx += (centroid.x - node.x) * strength * alpha;
          node.vy += (centroid.y - node.y) * strength * alpha;
        }
      });
    }

    return force;
  }

  // Add the custom clustering force to the simulation
  simulation.force("cluster", forceCluster());

  // Initialize the simulation with forces
  const simulation = d3
    .forceSimulation(graphData.nodes)
    .force(
      "link",
      d3.forceLink(graphData.links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("cluster", forceCluster());

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
    .text((d) => d.name) // Make sure your nodes data have a 'name' property
    .attr("x", 8)
    .attr("y", ".31em");

  // Define the simulation's "tick" event handler which updates the graph elements' positions
  simulation
    .nodes(graphData.nodes) // Set the nodes in the simulation
    .on("tick", ticked); // On each tick, update positions

  simulation.force("link").links(graphData.links); // Set the links in the link force

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

    // Update label positions
    labels
      .attr("x", (d) => d.x) // Set the x position of the label
      .attr("y", (d) => d.y); // Set the y position of the label
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
