//#region - Universal variables

// URL to nodes tab
const nodesURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=0&single=true&output=csv";

// URL to links tab
const linksURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT98sc8Mt60Xt-fMGPrX2YkECtVrHEL6nCf36kq0SzePOUugsvotOM2tnDFmV7L7TGGaSvn19aoQ0av/pub?gid=1899076594&single=true&output=csv";

// Variables to store the loaded node and link data
let nodesData, linksData;

// Selects the first <svg> element in the doc to operate on
let svg = d3.select("svg");

// Variable to store tooltip functionality
let tooltip;

// Variable to store the currently selected node
let selectedNode = null;

//#endregion

//#region - Get and parse data

// Load and link data and process the results
Promise.all([d3.csv(nodesURL), d3.csv(linksURL)])
  .then((results) => {
    nodesData = results[0]; // Store nodes data
    linksData = results[1]; // Store links data

    // Create a map of nodes by id
    let nodeById = new Map(nodesData.map((node) => [node.id, node]));

    // Make sure the rest of your code has access to nodeById
    // You can do this by passing it to the functions that need it or making it available in a wider scope

    if (Array.isArray(nodesData) && Array.isArray(linksData)) {
      initializeTooltip(); // Initialize tooltip after data is loaded
      updateGraphicLayout(nodeById); // Initialize graph layout with loaded data
    } else {
      console.error("Data is not in expected format:", nodesData, linksData);
    }
  })
  .catch((error) => {
    console.error("Error loading data: ", error); // Log data loading error if necessary
  });

//#endregion

//#region - Initialize tooltip

// Define a function to initialize a tooltip styled as a small pop-up box
function initializeTooltip() {
  tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("padding", "10px")
    .style("background", "#fff")
    .style("border", "1px solid #ddd")
    .style("border-radius", "5px")
    .style("text-align", "left");
}

//#endregion

//#region - Create graphic

// Function to define and update the layout of the graphic
function updateGraphicLayout(nodeById) {
  //#region - Set sizing and positions
  const svgWidth = document.documentElement.clientWidth; // Get width of viewport
  const svgHeight = window.innerHeight; // Get height of viewport
  const isSmallViewport = svgWidth < 600; // Determine if viewport is small
  const numCols = isSmallViewport ? 3 : 4; // Set # of columns
  const nodeRadius = isSmallViewport ? 24 : 40; // Set node radius
  const spacingX = svgWidth / (numCols + 1); // Calculate horizontal spacing
  const spacingY = nodeRadius * 2 + (isSmallViewport ? 10 : 20) + 45; // Calculate vertical spacing

  // Calculate positions for each node based on its index
  nodesData.forEach((node, i) => {
    node.x = (i % numCols) * spacingX + spacingX / 2;
    node.y = Math.floor(i / numCols) * spacingY + spacingY / 2;
  });

  // Clear any existing elements in the SVG to prepare for new drawing
  svg.selectAll("*").remove();

  // Create variables to store max x and y coordinates to define viewbox
  let maxX = 0,
    maxY = 0;
  nodesData.forEach((node) => {
    maxX = Math.max(maxX, node.x + nodeRadius); // Rightmost point
    maxY = Math.max(maxY, node.y + nodeRadius); // Bottom-most point
  });

  // Set the viewbox of the SVG to ensure all elements fit within it
  const viewBoxWidth = maxX + spacingX;
  const viewBoxHeight = maxY + spacingY;
  svg
    .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .attr("preserveAspectRatio", "xMidYMin meet");

  console.log(`viewBox dimensions: ${viewBoxWidth} ${viewBoxHeight}`); // Confirm viewBox dimensions

  //#endregion

  //#region - Append links
  // Append the links before nodes so they appear underneath the nodes
  svg
    .selectAll(".link") // Select all elements with the class link
    .data(linksData) // Bind links data to these elements
    .enter() // Enter the data join
    .append("line") // Append a line element for each new data item
    .attr("class", "link") // Set a CSS class
    .attr("stroke", "#999") // Set a stroke color
    .attr("stroke-opacity", 0.6) // Set the opacity of the line
    .attr("x1", (d) => nodeById.get(d.source).x) // Set starting x coordinate
    .attr("y1", (d) => nodeById.get(d.source).y) // Set starting y coordinate
    .attr("x2", (d) => nodeById.get(d.target).x) // Set ending x coordinate
    .attr("y2", (d) => nodeById.get(d.target).y) // Set ending y coordinate
    .attr("data-source-id", (d) => d.source)
    .attr("data-target-id", (d) => d.target);

  //#endregion

  //#region - Append nodes

  // Before appending the groups, check if there are any pre-existing elements that could interfere with the data join.
  const preExistingNodeGroups = svg.selectAll(".node-group").size();
  console.log("Pre-existing .node-group elements:", preExistingNodeGroups);

  // Inspect the nodesData just before the data join.
  console.log("nodesData just before data join:", nodesData);

  // Create groups for each node, which will contain images and labels
  const nodeGroup = svg
    .selectAll(".node-group") // Select all elements with class "node-group"
    .data(nodesData) // Bind node data to these elements
    .enter() // Enter the data join
    .append("g") // Append a g ("group") element for each new data item
    .attr("class", "node-group") // Assign CSS class
    .attr("transform", (d) => `translate(${d.x},${d.y})`); // Set the transform attribute to translate the group to the position specified by each node's data

  console.log("nodeGroup size:", nodeGroup.size()); // Should log the number of elements appended

  // Append images, text for node names and roles within each group
  nodeGroup
    .append("image") // Append an image element to each node group
    .attr("class", "node-image") // Set the CSS class
    .attr("xlink:href", (d) => d.imageUrl) // Set the source URL for the image
    .attr("x", -nodeRadius) // Set the x coordinate of the top left corner
    .attr("y", -nodeRadius) // Set the y coordinate of the top left corner
    .attr("width", nodeRadius * 2) // Set the width of the image
    .attr("height", nodeRadius * 2) // Set the height of the image
    .on("click", nodeClicked) // Add event listener for the click event
    .on("mouseover", nodeMouseover) // Add event listener for the mouseover event
    .on("mouseout", nodeMouseout); // Add event listener for the mouseout event

  nodeGroup
    .append("text") // Append a text element to each node group
    .attr("class", "node-name") // Assign the CSS class
    .attr("y", nodeRadius + 20) // Set the y coordinate for the text
    .attr("text-anchor", "middle") // Align text to the middle of its x coordinate
    .text((d) => d.name); // Set the text content to be the "name" property

  nodeGroup
    .append("text") // Append a text element to each node group
    .attr("class", "node-role") // Assign the CSS class
    .attr("y", nodeRadius + 35) // Set the y coordinate for the text
    .attr("text-anchor", "middle") // Align text to the middle of its x coordinate
    .text((d) => d.role); // Set the text content to be the "role" property
  //#endregion

  //#region - Interactivity functions

  // On mouseover
  function nodeMouseover(event, d) {
    // Log the data associated with the mouseover event
    // console.log("Mouseover event triggered:", d);
    tooltip
      .style("display", "block")
      .html(`Name: ${d.name}<br/>${d.blurb}`) // Customize as needed
      .style("left", event.pageX + 10 + "px") // Position slightly right of the cursor
      .style("top", event.pageY + 10 + "px"); // Position slightly below the cursor
  }

  // On mouseout
  function nodeMouseout() {
    // Log the mouseout event
    // console.log("Mouseout event triggered");
    tooltip.style("display", "none");
  }

  // On click
  function nodeClicked(event, d) {
    console.log("Click event triggered:", d); // Log the data associated with the click event
    console.log("Current selectedNode:", selectedNode); // Log the value of selectedNode
    if (selectedNode && selectedNode.id === d.id) {
      selectedNode = null; // Deselect node
      console.log("Deselected node:", d);
      resetHighlights(); // Reset any visual highlights
    } else {
      selectedNode = d;
      console.log("Selected node:", d);
      console.log("Links data before highlighting:", linksData);
      highlightConnected(d);
    }
    console.log("highlightConnected function called");
    event.stopPropagation(); // Stop the event from bubbling up to avoid unwanted interactions
  }

  // Function to reset highlights
  function resetHighlights() {
    console.log("Resetting highlights"); // Log that highlights are being reset
    // Reset all nodes to full opacity
    svg.selectAll(".node-group").style("opacity", 1);

    // Reset all links to their default opacity
    svg.selectAll(".link").style("stroke-opacity", 0.6);
  }

  // Function to highlight connected nodes and links
  function highlightConnected(node) {
    // If no node is provided, reset all highlights and return
    if (!node) {
      resetHighlights();
      return;
    }

    const connectedNodeIds = linksData
      // Filter the linksData array to only include links connected to the selected node
      .filter((link) => link.source === node.id || link.target === node.id)
      // Extract the IDs of the connected nodes
      .flatMap((link) => [link.source, link.target]);

    // Adjust the opacity of all nodes based on whether they are connected to the selected node
    svg
      .selectAll(".node-group")
      .style("opacity", (d) => (connectedNodeIds.includes(d.id) ? 1 : 0.1));

    // Adjust the opacity of all links based on whether their source or target nodes are connected
    svg.selectAll(".link").style("stroke-opacity", (link) => {
      return connectedNodeIds.includes(link.source) &&
        connectedNodeIds.includes(link.target)
        ? 1
        : 0.1;
    });
  }

  //#endregion
}

//#endregion

// Resize event handler to update the layout on window resize
// window.addEventListener("resize", updateGraphicLayout);
