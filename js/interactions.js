const createTooltipBubble = () => {

    const tooltip = bubbleChart
        .append("g")
            .attr("class", "tooltip-bubble")
            .style("opacity",0);

    tooltip
        .append("rect")
            .attr("class","tooltip-bubble-box")
            .attr("height", bubbleTooltipHeight)
            .attr("width", bubbleTooltipWidth)
            .attr("rx", 4)
            .attr("ry", 4)
    
    tooltip
        .append("text")
            .text("Chinakohl, Rotkohl, Kohlrabi")
            .attr("x", bubbleTooltipWidth/2)
            .attr("y", bubbleTooltipHeight/2 + 1)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline","middle")
            .attr("fill", "black")
            .style("font-weight", 60);

}

const handleMouseEventsBubble = () => {

    bubbleChart.selectAll("circle")
        .on("mouseenter", (e,d) => { // function depending on 2 arguments: e = DOM event, d = datum

         //console.log("DOM event",e);
         //console.log("Attached datum", d);
        
        // Update the text in the tooltip
        const quantityKg =(d.value / 1000).toFixed(2);

        const tooltipText = d3.select(".tooltip-bubble text");

        tooltipText.text(""); // create empty text and use tspan to be able to have text on more than one line

        tooltipText
            .append("tspan")
            .attr("class","tooltipNumber")
            .attr("x", bubbleTooltipWidth / 2)
            .text(`${quantityKg} kg`);
            
        tooltipText
            .append("tspan")
            .attr("x", bubbleTooltipWidth / 2)
            .attr("dy", 20) //dy: 20 --> moves the second line 20px below the first one
            .text(`${d.data.name}`); // not simply d.name, because the bubble data is a hierarchy node

        // Position the tooltip above the hovered circle
        // we base this on the mouse position and not the cx / cy position, as these relate to the full groups and not the single elements inside of the different packs
        const mousePosition = d3.pointer(e, bubbleChart.node()); // e = the mouse event, bubbleChart.node = the actual <g> element used as the coordinate reference
            //d3.pointer() returns the mouse position relative to that element

        const mouseX = mousePosition[0]; // x position; d3.pointer returns an array [x,y]
        const mouseY = mousePosition[1]; // y position


        d3.select(".tooltip-bubble")
            .attr("transform", `translate(${mouseX - bubbleTooltipWidth/2}, ${mouseY - bubbleTooltipHeight - 10})`) // positions the tooltip above and centered on the mouse
            .transition()
                .duration(200)
                .style("opacity",1);
        })

        .on("mouseleave", (e,d) => {

            d3.select(".tooltip-bubble")
                .style("opacity",0)
                .attr("transform",`translate(0,500)`);

        });
}

const createTooltipSankey = () => {
 
 
    const tooltipWidth = 200;
    const tooltipHeight =  100;
 
    const tooltip = sankeyChart
        .append("g")
            .attr("class", "tooltip-sankey");
   
    tooltip // no problem if we use the same "tooltip" as in the bubblechart function, since this one only lives in this other function
        .append("rect")
        .attr("height", tooltipHeight)
        .attr("width", tooltipWidth)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "lightblue")
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);
   
    tooltip
        .append("text")
        .attr("font-size", 12)
        .text("")
        .attr("x", 0)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "auto");
};

const handleMouseEventsSankey = (sankeyLinks, categoryColorScale, width) => { // call width as an argument, bc in sankey.js, not global
   
    // Adding interaction to the links 
    sankeyLinks
      .on("mouseenter", function(e,d) {
          //console.log(e,d);
      
          // Selecting the path to be highlighted when mouse is hovered over
            sankeyLinks
                .filter(link => link.pathId === d.pathId) // to highlight the full path, not only link between two nodes
                    .attr("stroke", categoryColorScale(d.category))
                    .attr("stroke-opacity", 1);
                           
            // Modifying the tool tip based on the linked nodes data
           const tooltipText = d3.select(".tooltip-sankey text");

                tooltipText.text("");

                // Amount in bold
                tooltipText
                    .append("tspan")
                    .attr("x", 5)
                    .attr("dy", 5)
                    .style("font-weight", 700)
                    .text(`${d.value.toFixed(0)} g`);

                // Continue same line
                tooltipText
                    .append("tspan")
                    .style("font-weight", 400)
                    .text(` of ${d.category} wasted`);

                // New line
                tooltipText
                    .append("tspan")
                    .attr("x", 5)
                    .attr("dy", 20)
                    .text("following the path");

                // New line
                tooltipText
                    .append("tspan")
                    .attr("x", 5)
                    .attr("dy", 20)
                    .text(`${d.cause} – ${d.reason}`);
                        
                             
            // Translating the tooltip based on mouse position (if left side then tool tip to the right and if over the half way line then tool tip to the left)
            d3.select(".tooltip-sankey")
                               
                .attr("transform", () =>{
                    if ( e.offsetX < width/2 ) {
                        return `translate(${e.offsetX + 60}, ${e.offsetY - 25})`;
                    }
                    else if (e.offsetX > width/2 || e.offsetY < 650){
                        return  `translate(${e.offsetX - 160}, ${e.offsetY + 85})`;
                    }
                    else if (e.offsetX > width/2 || e.offsetY > 650){
                        return  `translate(${e.offsetX + 160}, ${e.offsetY + 165})`;
                    }
                })

            // Tooltip opacity set to show background and stroke colour
            d3.select(".tooltip-sankey rect")
                .attr("fill-opacity", 0.85)
                .attr("stroke-opacity", 1)                  
        })

        .on("mouseleave", function(e,d) {
            // returns the stroke to the original colour
            sankeyLinks
                .filter(link => link.pathId === d.pathId)
                    .attr("stroke", "lightgrey")
                    .attr("stroke-opacity", 0.5);

            // Resets the tooltip text and sets opacaties to 0 to hide
            d3.select(".tooltip-sankey text")
                .text("")
            
            d3.select(".tooltip-sankey rect")
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
        })

};

//*************************//
//      Node tooltip        //
//*************************//

//Tooltip with for nodes, showing nodes percentages at that level

const createTooltipSankeyNodes = () => {

    const tooltip = sankeyChart
        .append("g")
        .attr("class", "tooltip-sankey-node")
        .attr("fill", "white")
        .style("opacity", 0);

    tooltip
        .append("rect")
        .attr("width", 200)
        .attr("height", 40)
        .attr("rx", 4)
        .attr("ry", 4);

    tooltip
        .append("text")
        .attr("x", 100)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill","black")
        .style("font-size", "12px");
};

const handleMouseEventsSankeyNodes = sankeyNodes => {

    sankeyNodes
        .on("mouseenter", function(e, d) {

            const nodesAtSameLevel = sankeyNodes
                .data()
                .filter(node => node.level === d.level);

            const levelTotal = d3.sum(
                nodesAtSameLevel,
                node => node.value
            );

            const percentage = (d.value / levelTotal * 100).toFixed(1);

            d3.select(".tooltip-sankey-node text")
                .text(`${d.name}: ${percentage}%`);

            const mousePosition = d3.pointer(e, sankeyChart.node());

            d3.select(".tooltip-sankey-node")
                .attr(
                    "transform",
                    `translate(${mousePosition[0] + 10}, ${mousePosition[1] - 70})`
                )
                .style("opacity", 1);
        })

        .on("mouseleave", function() {

            d3.select(".tooltip-sankey-node")
                .style("opacity", 0);

        });
};