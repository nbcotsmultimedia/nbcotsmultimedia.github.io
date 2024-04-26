const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";
const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

let nodesData, linksData;

Promise.all([d3.csv(nodesURL), d3.csv(linksURL)]).then(([nodes, links]) => {
  nodesData = nodes;
  linksData = links;
  updateGraphLayout();
});

function updateGraphLayout() {
  const svgWidth = document.documentElement.clientWidth;
  const svgHeight = window.innerHeight;

  // Responsive sizing for nodes and labels
  const isSmallViewport = svgWidth < 600;
  const numCols = isSmallViewport ? 2 : 4;
  const nodeRadius = isSmallViewport ? 24 : 40; // Smaller radius for smaller viewport
  const labelFontSize = isSmallViewport ? "8px" : "12px"; // Smaller font size for smaller viewport
  const labelLineHeight = isSmallViewport ? "1em" : "1.2em"; // Adjust line height for smaller viewport
  const labelPadding = isSmallViewport ? 10 : 20; // Closer labels for smaller viewport

  // Calculate the number of rows required to display all nodes
  const numRows = Math.ceil(nodesData.length / numCols);

  // Calculate the total height required based on nodes and labels
  const contentHeight =
    numRows * (nodeRadius * 2 + labelPadding) + labelPadding;

  // Ensure that the viewBox height is not less than the window height
  const requiredHeight = Math.max(svgHeight, contentHeight);

  const spacingX = svgWidth / (numCols + 1);
  // Increase this value to add more space between rows
  const rowPadding = 50; // Adjust this value as needed

  // Calculate the vertical spacing based on the node size, label size, and row padding
  const spacingY = nodeRadius * 2 + labelPadding + rowPadding;

  nodesData.forEach((node, i) => {
    node.x = (i % numCols) * spacingX + spacingX;
    node.y = Math.floor(i / numCols) * spacingY + spacingY;
  });

  let svg = d3.select("svg");
  if (svg.empty()) {
    svg = d3
      .select("body")
      .append("svg")
      .classed("svg-content-responsive", true);
  }

  svg.attr("preserveAspectRatio", "xMinYMin meet");

  const nodeById = new Map(nodesData.map((d) => [d.id, d]));

  svg
    .attr("viewBox", `0 0 ${svgWidth} ${requiredHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet");

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

  svg
    .selectAll(".node")
    .data(nodesData)
    .join("circle")
    .attr("class", "node")
    .attr("r", nodeRadius)
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("fill", "#fff")
    .attr("stroke", "#333333")
    .attr("stroke-width", isSmallViewport ? 1 : 2);

  const labels = svg.selectAll(".label").data(nodesData, (d) => d.id);

  labels.exit().remove();

  const newLabels = labels
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle");

  labels
    .merge(newLabels)
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y + nodeRadius + labelPadding)
    .selectAll("tspan")
    .data((d) => [d.name, ...d.role.split(",")])
    .join("tspan")
    .attr("x", (d, i, nodes) => d3.select(nodes[i].parentNode).attr("x"))
    .attr("dy", (d, i) => (i === 0 ? 0 : labelLineHeight))
    .text((d) => d)
    .style("font-size", labelFontSize);
}

window.addEventListener("resize", updateGraphLayout);
