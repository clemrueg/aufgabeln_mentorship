// Steps: 
// original data
      
// prepare data
      
// nodes + links
      
// initialize sankey generator
      
// call sankey generator
      
// annotated nodes + links
      
// draw nodes
      
// draw ribbons

/*******************************/
/*       Draw the Sankey       */
/*******************************/

const drawSankey = data => {

    /*******************************/
    /*      Chart dimensions       */
    /*******************************/

    const width = 1000;
    const height =1500;

    const margin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    /*******************************/
    /*      Explore the data       */
    /*******************************/

    // Unique food categories after applying the 3% cutoff
    const categories = [...new Set(data.map(d => d.category))]; 
        //data.map creates an array containing the category of every row
        // new Set = remove duplicates
        // [...] = takes the values ouf of the set (which is like a single array) and insets them individually into the [category] array
        console.log("Sankey categories:", categories);

    // Unique causes (6)
    const causes = [...new Set(data.map(d => d.cause))]; //
    console.log("Causes:", causes);
    
    // Get all unique reasons (7)
    const reasons = [...new Set(data.map(d => d.reason))];
    console.log("Reasons:", reasons);

    /*******************************/
    /*  STEP 6:  Prepare data in "Sankey-Flow-Format"    */
    /*******************************/

    // combine rows that follow exactly the same path 
    // sankeyData -> group by category -> within that group, group by cause -> within that group, group by reason -> sum quantity

    const pathRollups = d3.flatRollup( //use flatRollup, because d3.rollups create a nested array ob objects
        data, // we can call data and not "cleanedData" here, because in main.js we already passed drawSankey(cleanedData), so this "data" effectively means the cleaned dataset
        values => d3.sum(values, d => d.quantity),
        d => d.category,
        d => d.cause,
        d => d.reason
      );
      
      const fullPathFlows = pathRollups.map(d => { //.map to turn the flat rollup array into objects
      
        return {
          category: d[0],
          cause: d[1],
          reason: d[2],
          quantity: d[3]
        };
      
      });
      
      //console.table(fullPathFlows);

    // // Check that total of aggregated paths is the same as total of raw data
    // const fullPathTotal = d3.sum(
    //     fullPathFlows,
    //     d => d.quantity
    //   );
      
    //   console.log("Total quantity after path aggregation:", fullPathTotal);


    /*******************************/
    /*  STEP 7:  Create Sankey nodes (from d3-sankey documentation)   */
    /*******************************/   

    // the sankey generator needs nodes, links and values and will return positions, dimansions and ribbon widths
    
    // From now on, use fullPathFlows because contains the cleaned "Anderes" category

    // Get all unique values for each level from the cleaned and aggregated Sankey data; same as above with original dataset
    const sankeyCategories = [...new Set(
      fullPathFlows.map(d => d.category)
    )];
    
    const sankeyCauses = [...new Set(
      fullPathFlows.map(d => d.cause)
    )];
    
    const sankeyReasons = [...new Set(
      fullPathFlows.map(d => d.reason)
    )];
    
    // console.log("Sankey categories:", sankeyCategories);
    // console.log("Sankey causes:", sankeyCauses);
    // console.log("Sankey reasons:", sankeyReasons);

    // Turn each category into a node object
    const categoryNodes = sankeyCategories.map(d => {

        return {
          id: `category-${d}`, // returns e.g. "category-Gemüse" ; id it the unique identifier we'll give to d3-sankey; unique id with level- important, e.g. to distinguish between various "Anderes" categories
          name: d, // returns "Gemüse"; readable name for display
          level: "category" // keep the level (whether category, cause or reason node); useful for layout and styling
        };
      
      }); 

    const causeNodes = sankeyCauses.map(d => {

        return {
          id: `cause-${d}`,
          name: d,
          level: "cause"
        };
      
      });
    
    const reasonNodes = sankeyReasons.map(d => {

        return {
            id: `reason-${d}`,
            name: d,
            level: "reason"
        };

      });
    
    // Combine the 3 nodes arrays into a single nodes array
    const nodes = categoryNodes
        .concat(causeNodes, reasonNodes);
  
   // console.table(nodes);

    /*******************************/
    /*  STEP 8:  Create Sankey links */
    /*******************************/   

    // for every complete paths (category -> cause -> reason)
    // we create two links: category -> cause and cause -> reason
    // (this is the way d3-sankey works, but we keep the complete path info for later on

    const links = []; // create empty array

    fullPathFlows.forEach((d, i) => { // loop throuh fullPathFlows objects; d = current full path, i = index in the array
       
        // create the category-cause link

        links.push({ // push data from the flow objects array to the empty links array

            source: `category-${d.category}`, // as defined in d3-sankey
            // name is the same as the IDs from the nodes tables
            target: `cause-${d.cause}`,
          
            value: d.quantity,
          
            // "Metadata"; not needed for d3-sankey, but useful for interaction later
            category: d.category,
            cause: d.cause,
            reason: d.reason,
          
            pathId: i, // give both segments of the same full path the same ID
            step: "category-cause"
          
          });
    
        // Create cause -> reason link

        links.push({

        source: `cause-${d.cause}`,
        target: `reason-${d.reason}`,

        value: d.quantity,

        category: d.category,
        cause: d.cause,
        reason: d.reason,

        pathId: i, // give both segments of the same full path the same ID
        step: "cause-reason"

        }); 

    });

    // console.table(links);

    // // Each full path produces 2 links, so number of links should be 2x full paths
    // console.log("Number of full paths:", fullPathFlows.length);
    // console.log("Number of links:", links.length);


    /*******************************/
    /*  STEP 9: Create sankey input data for d3-sankey */
    /*******************************/
    
    // Combine the nodes and links into one graph object that can be passed to the Sankey generator

    const sankeyInput = {
      nodes: nodes,
      links: links
    };
    
    console.log("Sankey input:", sankeyInput);


    /*******************************/
    /* STEP 10: Initialize sankey generator   */
    /*******************************/
    
    const sankeyGenerator = d3.sankey()
    
      // Tell D3 which property uniquely identifies each node
      .nodeId(d => d.id) // "when matching links to nodes, identify each node using its "id" property"
    
      .nodeWidth(20) // Width of the node rectangles
    
      .nodePadding(10) // padding between same-level-nodes
    
      // Define the area in which D3 can position the nodes
      .extent([ // demanded by the sankey API
        [0, 0], // top left corner
        [innerHeight, innerWidth] // bottom-right corner
      ]);

    /*******************************/
    /* STEP 11: Call the generator */
    /*******************************/

    // Pass the nodes and links to the Sankey generator; d3 adds the layout info needed to draw the chart
    const annotatedData = sankeyGenerator(sankeyInput); // sankeyInput = "FormattedData" from pieGenerator logic

    console.log("Annotated Sankey data:", annotatedData); // annotated data now has additional properties, e.g. x0,x1,y0,y1, etc.
    console.log("Example node:", annotatedData.nodes[0]);
    console.log("Example link:", annotatedData.links[0]);

    // before calling the generator, "source" (e.g. category-Gemüse) was a string.
    // After calling it, it became the node object so we can access it e.g. with d.source.name

    /*******************************/
    /* STEP 12: Draw basic Sankey  */
    /*******************************/

    // Append the SVG inside the Sankey div
    const svg = d3.select("#sankey")
    .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);
    
    // Append a group that contains the actual chart and translate it by the margin convention
    chart = svg
    .append("g")
        .attr(
        "transform",
        `translate(${margin.left}, ${margin.top})`
        );

    // Create link path generator, so we don't have to calculate the curve ourselves
    const linkGenerator = d3.linkVertical() // vertical link generator because we want the sankey running from top to bottom
        .source(d => [d.y0, d.source.x1]) // swapping x and y coordinates to do that
        .target(d => [d.y1, d.target.x0]);

    // Drawing links before nodes, so that nodes appear on top of the ribbons
    chart
    .append("g")
    .selectAll("path")
    .data(annotatedData.links)
    .join("path")
        .attr("d", linkGenerator)
        .attr("fill", "none")
        .attr("stroke", darkBlue)
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", d => d.width); // d.width created in the sankey generator, based on d.quantity

    // Draw the nodes
    chart
    .append("g")
    .selectAll("rect")
    .data(annotatedData.nodes)
    .join("rect")
    // Swap the Sankey x/y coordinates so the levels run from top to bottom
        .attr("x", d => d.y0)
        .attr("y", d => d.x0)

        .attr("width", d => d.y1 - d.y0)
        .attr("height", d => d.x1 - d.x0)

        .attr("fill", darkBlue);

    /*******************************/
    /* STEP 13: Update Sankey, make it look nice  */
    /*******************************/

    // Add node labels
    chart
      .append("g")
      .selectAll("text")
      .data(annotatedData.nodes)
      .join("text")
          .text(d => d.name)

          // Use same coordinates as nodes; place label in the horizontal center of the node
          .attr("x", d => (d.y0 + d.y1) / 2)
          .attr("y", d => d.x0 - 5) // label 5px above node

          .attr("text-anchor", "middle")
          .style("font-size", "12px");
    
    console.log("AnnotatedData", annotatedData)
    
    // Add level labels
    

  /*******************************/
  /* STEP 14: Add interaction  */
  /*******************************/

chart
    .append("g")
    .selectAll("path")
    .data(annotatedData.links)
    .join("path")
        .attr("d", linkGenerator)
        .attr("fill", "transparent")
        .attr("stroke", "lightgrey")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", d => d.width)
        .on("mouseenter", function(e,d) {
                        console.log(e,d);

                        // Selecting the path to be highlighted when mouse is hovered over
                            d3.select(this)
                                .attr("stroke", "orange")
                                .attr("stroke-opacity", 1);
                           
                        // Modifying the tool tip based on the linked nodes data
                            const tooltipText = d3.select(".tooltip text");
                              tooltipText.text("");
                                tooltipText.append("tspan")
                                .attr("x", 5)
                                .attr("dy", 5)
                                .text(`Value: ${d.value}`);
                                tooltipText.append("tspan")
                                .attr("x", 5)
                                .attr("dy", 20)
                                .text(`${((d.value / d.source.value) * 100).toFixed(1)}% of ${d.source.id}`);
                                tooltipText.append("tspan")
                                .attr("x", 5)
                                .attr("dy", 20)
                                .text(`to target ${d.target.name}`);
                             
                        // Translating the tooltip based on mouse position (if left side then tool tip to the right and if over the half way line then tool tip to the left)
                              d3.select(".tooltip")
                               
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
                            d3.select(".tooltip rect")
                              .attr("fill-opacity", 0.85)
                              .attr("stroke-opacity", 1)                  
        })
        .on("mouseleave", function() {
                        // returns the stroke to the original colour
                              d3.select(this)
                                .attr("stroke", "lightgrey")
                                .attr("stroke-opacity", 0.5);

                        // Resets the tooltip text and sets opacaties to 0 to hide
                              d3.select(".tooltip text")
                                  .text("")
                            d3.select(".tooltip rect")
                              .attr("fill-opacity", 0)
                              .attr("stroke-opacity", 0)
                              })

    
};
