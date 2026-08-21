const createTooltip = () => {
 
 
    const tooltipWidth = 200;
    const tooltipHeight =  100;
 
    const tooltip = chart
        .append("g")
            .attr("class", "tooltip");
   
    tooltip
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