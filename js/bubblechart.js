// Steps:
//
// STEP 1: Aggregate measurements by food category + food item
//
// STEP 2: Convert the aggregated data into a hierarchy
//         root -> category -> food item
//
// STEP 3: Create the D3 hierarchy with d3.hierarchy()
//
// STEP 4: Compute node values with root.sum()
//
// STEP 5: Get category nodes and food-item leaf nodes
//
// STEP 6: Create one shared radius scale for all food items
//
// STEP 7: Create a circle-pack layout for each food category
//
// STEP 8: Call the pack generator for each category
//
// STEP 9: Position the category packs next to each other horizontally
//
// STEP 10: Append the SVG container
//
// STEP 11: Create one SVG group for each category pack
//
// STEP 12: Draw the food-item circles
//
// STEP 13: Draw / hide the category parent circles
//
// STEP 14: Add category labels
//
// STEP 15: Check layout, bubble sizes and category spacing


/*******************************/
/*      Draw bubble chart      */
/*******************************/

const drawBubbleChart = data => {


    /*******************************/
    /* STEP 1: Aggregate items     */
    /*******************************/

    // Combine measurements belonging to the same food item
    // within the same cleaned food category
    const itemRollups = d3.flatRollup(
        data,
        values => d3.sum(values, d => d.quantity), // sum quantities per category per item
        d => d.category,
        d => d.item
    );

    console.log("Item rollups:", itemRollups);


    // Turn the flatRollup result into objects, easier to use
    const foodItems = itemRollups.map(d => {

        return {
            category: d[0],
            item: d[1],
            quantity: d[2]
        };

    });

    //console.table(foodItems);

    console.log("Largest food quantityy:", d3.max(foodItems, d => d.quantity));
    
    console.log( "Smallest food quantity:", d3.min(foodItems, d => d.quantity));


    /*******************************/
    /* STEP 2: Build hierarchy data */
    /*******************************/
    
    // Group the aggregated food items by category
    const itemsByCategory = d3.group(
        foodItems,
        d => d.category
    );
    
    console.log("Items grouped by category:", itemsByCategory);

    // Create nested object needed for d3.hierarchy
    const hierarchyData = {
    
        name: "root",
    
        children: Array.from( // turns the map (that resulted from d3.group) into an array, containing [category, items]
            itemsByCategory,
            ([category, items]) => {
    
                return {
    
                    name: category,
    
                    children: items.map(d => { // turns every item into a child object
    
                        return {
                            name: d.item,
                            category: d.category,
                            quantity: d.quantity
                        };
    
                    })
    
                };
    
            }
        )
    
    };
    
    console.log("Hierarchy data:", hierarchyData);

    /*******************************/
    /* STEP 3: Create D3 hierarchy */
    /*******************************/
    
    // Turn the nested object into a D3 hierarchy
    const root = d3.hierarchy(hierarchyData);
    
    console.log("D3 hierarchy:", root);

    /*******************************/
    /* STEP 4: Compute node values */
    /*******************************/
    
    // summing child values for category nodes
    // we need root.sum() becasue d3.pack() uses the hierarchy's value property when calculating 
    // the circle-pack-layout. So we make the previously calculated d.quantity available in the d3 hierarchy format
    root.sum(d => d.quantity || 0); // if quantity exists, use it; otherwise use 0 --> becasue e.g. categories have no quantities, should be 0
     
    console.log("Hierarchy with values:", root);

    console.log("Root total:", root.value);

    /*******************************/
    /* STEP 5: hierarchy nodes */
    /*******************************/
    
    // Children of the root = food categories
    const categoryNodes = root.children;
    
    // Leaf nodes = individual food items
    const foodItemNodes = root.leaves();
    
    console.log("Category nodes:", categoryNodes);
    console.log("Food item nodes:", foodItemNodes);


    /*******************************/
    /* STEP 6: Create radius scale */
    /*******************************/
    
    // Max. radius for the largest food-item bubble
    const maxBubbleRadius = 50;
    
    
    // Find the largest food-item quantity
    const maxFoodQuantity = d3.max(
        foodItemNodes,
        d => d.value
    );
    
    console.log("Maximum food-item quantity:", maxFoodQuantity);
    
    
    // Create one shared radius scale for ALL food items, even if the packs are separated
    // Otherwise it might use the biggest value of EACH PACK to define the size relatively to that
    const radiusScale = d3.scaleSqrt() // scaling with the sqrt to get the size as an area, instead of scaling the radius linearly
        .domain([0, maxFoodQuantity])
        .range([0, maxBubbleRadius]);    


    /*******************************/
    /* STEP 7: Initialize pack generator   */
    /*******************************/
        
    const bubblePadding = 3; // Padding between individual food item circles
        
        
    // Initialize the circle-pack layout generator
    const packLayoutGenerator = d3.pack()
         .size([1, 1]) // minimal layout size required by pack generator
            // actual size will grow as large as necessary to contain circles based on the radius
         .padding(bubblePadding)
        .radius(d => radiusScale(d.value)); // use radius previously defined to have same radius for each pack


    /*******************************/
    /* STEP 8: Create 8 individual category packs */
    /*******************************/
            
    const categoryPacks = categoryNodes.map(categoryNode => { // looping through each category node, creating one packed hierarcy for each
            
        // Make a copy of the category subtree, so that each category can
        // temporarily act as its own root
        const categoryRoot = categoryNode.copy();
            
        // Recalculate the hierarchy values for this subtree
        categoryRoot.sum(d => d.quantity || 0);
            
        // Call the pack generator
        // D3 now adds x, y and r coordinates
        packLayoutGenerator(categoryRoot);
            
            
            return categoryRoot;
            
        });
            
        console.log("Category packs:", categoryPacks); // categoryPacks = array containing 8 objects: 8 packed hierarchies
          
            // console.table(
            //     categoryPacks.map(d => {
            
            //         return {
            //             category: d.data.name,
            //             quantity: d.value,
            //             radius: d.r,
            //             numberOfItems: d.leaves().length
            //         };
            
            //     })
            // );


    /*******************************/
    /* STEP 9: Position packs      */
    /*******************************/
            
    // Horizontal space between category packs
    const categoryGap = 30;
            
            
    // Start at the left side of the visualization
    let currentX = 0;
            
            
    // Give each category pack its horizontal position
    categoryPacks.forEach(d => {
            
        // Position the CENTER of the current category pack.
        // currentX represents the left edge of the available space,
        // so we add the category radius to reach its center.
        d.layoutX = currentX + d.r; //d.x, d.y and d.r calculated by circle-pack layout
            
            
        // Move currentX to the right edge of this category,
        // then add a gap before the next category.
        currentX += (d.r * 2) + categoryGap;
            
    });

    // Width occupied by all category packs
    const packsWidth = currentX - categoryGap;
    
    
    // Largest category determines the vertical space needed
    const maxPackRadius = d3.max(
        categoryPacks,
        d => d.r
    );

    /*******************************/
    /* STEP 10: Append SVG         */
    /*******************************/
    
    // Margins around the visualization
    const margin = {
        top: 50,
        right: 40,
        bottom: 40,
        left: 40
    };
    
    
    // Vertical position of all category-pack centers
    const packCenterY = maxPackRadius;
    
    
    // Calculate SVG dimensions based on the actual pack sizes
    const width =
        margin.left +
        packsWidth +
        margin.right;
    
    const height =
        margin.top +
        (maxPackRadius * 2) +
        margin.bottom;
    
    
    // Append SVG inside the bubblechart div
    const svg = d3.select("#bubblechart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);
    
    
    // Append chart group and apply margin convention
    const chart = svg
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left}, ${margin.top})`
        );

    /*******************************/
    /* STEP 11: Category groups    */
    /*******************************/
        
    // Create one SVG group for each food category
    const categoryGroups = chart
        .selectAll(".category-pack")
        .data(categoryPacks)
        .join("g")
            .attr("class", "category-pack")
            .attr(
                 "transform",
                 d => `translate(${d.layoutX}, ${packCenterY})`
             );

/*******************************/
/* STEP 12: Draw food bubbles  */
/*******************************/

// For each category group, draw all its food-item leaf nodes
categoryGroups.each(function(categoryRoot) {

    // Select the current category <g>
    const group = d3.select(this);

    // Get only the food-item nodes from this category
    const foodNodes = categoryRoot.leaves();

    // Draw one circle for each food item
    group
        .selectAll(".food-bubble")
        .data(foodNodes)
        .join("circle")
            .attr("class", "food-bubble")

            // Position relative to the center of the category pack
            .attr("cx", d => d.x - categoryRoot.x)
            .attr("cy", d => d.y - categoryRoot.y)

            // Radius calculated by d3.pack()
            .attr("r", d => d.r)

            // Temporary styling
            .attr("fill", "lightgrey")
            .attr("stroke", "white")
            .attr("stroke-width", 1);

});         
     
/*******************************/
/* STEP 14: Category labels    */
/*******************************/

// Use the position of the first category label
// as the common horizontal line for all labels
const labelY = categoryPacks[0].r + 25;


// Add one label below each category pack
categoryGroups
    .append("text")
        .attr("class", "category-label")

        .text(d => d.data.name)

        .attr("x", 0)

        // Same y position for every category label
        .attr("y", labelY)
        .attr("text-anchor", "middle")

};