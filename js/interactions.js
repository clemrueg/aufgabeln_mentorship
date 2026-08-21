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
        .attr("stroke", "black")
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);
   
    tooltip
        .append("text")
        .attr("font-size", 14)
        .text("")
        .attr("x", 0)
        .attr("y", 20)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "auto")
        .style("font-weight", 600);
};