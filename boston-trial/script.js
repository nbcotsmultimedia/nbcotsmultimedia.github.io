//#region - Global variables
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";

const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

let nodesData, linksData;
//#endregion

// Load the data from the CSV files
Promise.all([d3.csv(nodesURL), d3.csv(linksURL)]).then(([nodes, links]) => {
  nodesData = nodes;
  linksData = links;
  updateGraphLayout(); // Call the function to draw the graph initially
});

// Function to update the graph layout based on the current viewport size
function updateGraphLayout() {
  const svgWidth = document.documentElement.clientWidth; // Full width of the viewport
  const svgHeight = window.innerHeight; // Full height of the viewport
  const numCols = svgWidth < 600 ? 2 : 4; // Use 2 columns for smaller screens, 4 for larger
  const spacingX = svgWidth / (numCols + 1);
  const spacingY = svgHeight / (Math.ceil(nodesData.length / numCols) + 0.5); // Distribute vertically

  // Calculate node positions based on current numCols and viewport size
  nodesData.forEach((node, i) => {
    node.x = (i % numCols) * spacingX + spacingX;
    node.y = Math.floor(i / numCols) * spacingY + spacingY;
  });

  // Select the SVG element, if it exists
  let svg = d3.select("svg");
  if (svg.empty()) {
    // If the SVG doesn't exist, create it
    svg = d3
      .select("body")
      .append("svg")
      .classed("svg-content-responsive", true); // Assign a class for CSS styling
  }

  // Set the view box to make the SVG responsive
  svg
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet");

  // Map to store node data by id for quick lookup
  const nodeById = new Map(nodesData.map((d) => [d.id, d]));

  // Update the links
  const linkElements = svg
    .selectAll(".link")
    .data(linksData)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", 2)
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("x1", (d) => nodeById.get(d.source).x)
    .attr("y1", (d) => nodeById.get(d.source).y)
    .attr("x2", (d) => nodeById.get(d.target).x)
    .attr("y2", (d) => nodeById.get(d.target).y);

  // Update the nodes
  const nodeElements = svg
    .selectAll(".node")
    .data(nodesData)
    .join("circle")
    .attr("class", "node")
    .attr("r", 40) // Adjust the radius as needed
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", "#fff")
    .attr("stroke", "#333333") // Stroke color
    .attr("stroke-width", 2); // Stroke width

  // Update the labels
  const labelPadding = 20; // Adjust the padding as needed
  const nodeRadius = 40;

  // Create labels for the nodes
  const labelElements = svg
    .selectAll(".label")
    .data(nodesData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y + nodeRadius + labelPadding)
    .attr("text-anchor", "middle")
    .selectAll("tspan")
    .data((d) => {
      // Here, split the role string by commas and prepend the name to the array
      let roles = d.role.split(","); // This will split the role string into an array of roles
      return [d.name, ...roles]; // Spread the roles into the array
    })
    .enter()
    .append("tspan")
    .attr("x", (d, i, nodes) => d3.select(nodes[i].parentNode).attr("x"))
    .attr("dy", (d, i) => (i === 0 ? 0 : "1.2em")) // Move subsequent lines down
    .text((d) => d)
    .style("font-size", (d, i) => (i === 0 ? "12px" : "10px")) // Adjust the font size
    .style("fill", (d, i) => (i === 0 ? "#333" : "#555"));
}

// Event listener for window resize
window.addEventListener("resize", updateGraphLayout);
