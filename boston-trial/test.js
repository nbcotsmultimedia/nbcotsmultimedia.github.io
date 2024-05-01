// On mouseover for nodes
function nodeMouseover(event, d) {
  if (!selectedNode) {
    // Show node tooltip only if no node is selected
    tooltip
      .html(`Name: ${d.name}<br/>Role: ${d.blurb}`)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY + 10 + "px")
      .style("display", "block");
  } else {
    // When a node is selected, only show tooltip for connected nodes
    if (isNodeConnected(d)) {
      // Check if node is connected to the selected node
      tooltip
        .html(`Name: ${d.name}<br/>Role: ${d.blurb}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px")
        .style("display", "block");
    }
  }
}

// Helper function to check if a node is connected to the selected node
function isNodeConnected(node) {
  return linksData.some((link) => {
    return (
      (link.source === selectedNode.id && link.target === node.id) ||
      (link.target === selectedNode.id && link.source === node.id)
    );
  });
}

// On mouseover for links
function linkMouseover(event, d) {
  if (selectedNode) {
    // Only show tooltip for links if a node is selected
    const sourceNode = nodeById.get(d.source);
    const targetNode = nodeById.get(d.target);
    tooltip
      .html(`Connection: ${sourceNode.name} to ${targetNode.name}, ${d.type}`) // Customize tooltip content
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY + 10 + "px")
      .style("display", "block");
  }
}

// On mouseout for both nodes and links
function mouseout() {
  // Hide the tooltip
  tooltip.style("display", "none");
}

// On click
function nodeClicked(event, d) {
  // Prevent events on the SVG from affecting elements below
  event.stopPropagation();

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

  // Toggle the panel based on whether a node is selected
  if (selectedNode && selectedNode.id === d.id) {
    detailPanel.close();
    selectedNode = null;
  } else {
    if (selectedNode) {
      detailPanel.close(); // Close the current panel
    }
    selectedNode = d;
    detailPanel
      .classed("visible", true) // This will add the class that slides the panel in
      .style("display", "block"); // Ensure that the panel is displayed
    detailPanel.updateContent(d);
  }
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

// Reset function simplified for clarity
function resetHighlights() {
  svg.selectAll(".node-group").style("opacity", 1);
  svg.selectAll(".link").style("stroke-opacity", 0.6);
}

// Click out of highlight mode anywhere
svg.on("click", function (event) {
  // Check if the clicked element is not a node
  if (!event.target.classList.contains("node-image")) {
    // Reset the selected node and highlights
    selectedNode = null;
    resetHighlights();
  }
});
