/*******************************/
/*       Draw bubble chart     */
/*******************************/

const drawBubbleChart = data => {


    /*******************************/
    /* STEP 1: Chart settings      */
    /*******************************/

    const margin = {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40
    };

    // Space between the six category packs
    const categoryGap = 40;

    // Space reserved above the packs for category labels
    const labelSpace = 50;

    // Maximum radius of the largest individual food bubble
    // Change this later if the whole visualization is too large/small
    const maxBubbleRadius = 55;

    // Padding between food bubbles inside a category
    const bubblePadding = 4;



    /*******************************/
    /* STEP 2: Aggregate items     */
    /*******************************/

    // Combine all measurements belonging to the same food item
    // within the same cleaned food category.
    //
    // Result of flatRollup:
    // [
    //   category,
    //   item,
    //   summed quantity
    // ]

    const itemRollups = d3.flatRollup(
        data,
        values => d3.sum(values, d => d.quantity),
        d => d.category,
        d => d.item
    );


    // Turn the flatRollup arrays into readable objects
    const foodItems = itemRollups.map(d => {

        return {
            category: d[0],
            item: d[1],
            quantity: d[2]
        };

    });

    console.table(foodItems);



    /*******************************/
    /* STEP 3: Build hierarchy     */
    /*******************************/

    // Group food items according to their Lebensmittel category
    const itemsByCategory = d3.group(
        foodItems,
        d => d.category
    );


    // Turn the grouped data into the structure needed for d3.hierarchy()
    //
    // root
    // ├── category
    // │   ├── item
    // │   ├── item
    // │   └── item
    // ├── category
    // │   └── ...
    // └── ...

    const hierarchyData = {

        name: "root",

        children: Array.from(
            itemsByCategory,
            ([category, items]) => {

                return {

                    name: category,

                    children: items.map(d => {

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
    /* STEP 4: Create D3 hierarchy */
    /*******************************/

    const root = d3.hierarchy(hierarchyData)

        // Only food-item nodes contain quantity.
        // Parent values are calculated from their children.
        .sum(d => d.quantity || 0)

        // Largest categories / foods first
        .sort((a, b) => b.value - a.value);


    console.log("D3 hierarchy:", root);



    /*******************************/
    /* STEP 5: Shared radius scale */
    /*******************************/

    // Find the largest food-item quantity
    const maxQuantity = d3.max(
        root.leaves(),
        d => d.value
    );


    // IMPORTANT:
    // One radius scale is shared by ALL six category packs.
    //
    // sqrt scale means:
    // quantity -> circle AREA
    //
    // A food item with the same quantity will therefore
    // have the same radius regardless of its category.

    const radiusScale = d3.scaleSqrt()
        .domain([0, maxQuantity])
        .range([0, maxBubbleRadius]);



    /*******************************/
    /* STEP 6: Pack each category  */
    /*******************************/

    // Each child of the main root is one food category.
    //
    // We keep the overall hierarchy, but calculate a local
    // circle pack for each category separately.

    const categoryPacks = root.children.map(categoryNode => {


        // Copy this category subtree so that its local pack
        // can be calculated independently.
        const categoryRoot = categoryNode.copy()

            .sum(d => d.quantity || 0)

            .sort((a, b) => b.value - a.value);


        // Create the pack generator for this category.
        //
        // size([1, 1]) is not used to determine bubble size
        // because we explicitly provide the bubble radius below.
        //
        // We will manually position the complete category pack later.

        const packGenerator = d3.pack()
            .size([1, 1])
            .padding(bubblePadding)

            // Explicit radius keeps bubble sizes comparable
            // between all six category packs.
            .radius(d => radiusScale(d.value));


        // Call the generator
        packGenerator(categoryRoot);


        return {
            name: categoryRoot.data.name,
            value: categoryRoot.value,

            // Store the packed hierarchy
            root: categoryRoot,

            // Radius of the entire category pack
            radius: categoryRoot.r
        };

    });


    console.log("Category packs:", categoryPacks);


    // Useful check:
    // after applying the 3% cutoff you expect six categories
    console.log(
        "Number of category packs:",
        categoryPacks.length
    );



    /*******************************/
    /* STEP 7: Position categories */
    /*******************************/

    // The packs now know their internal bubble positions,
    // but we decide where the six complete category groups
    // should sit in the SVG.
    //
    // Put them next to each other from left to right.

    let currentX = 0;


    categoryPacks.forEach(d => {

        // Position the center of this category pack
        d.x = currentX + d.radius;

        // Move to the right edge of this pack
        // plus the gap before the next category
        currentX += (d.radius * 2) + categoryGap;

    });


    // Remove the final unnecessary gap
    const packsWidth = currentX - categoryGap;


    // Find the largest category pack.
    // All category centers will use the same y position.
    const maxPackRadius = d3.max(
        categoryPacks,
        d => d.radius
    );


    // All six pack centers lie on this same horizontal line
    const packCenterY = labelSpace + maxPackRadius;



    /*******************************/
    /* STEP 8: SVG dimensions      */
    /*******************************/

    // Width depends on the actual six packed categories
    const width =
        margin.left +
        packsWidth +
        margin.right;


    // Height depends on the largest category pack
    const height =
        margin.top +
        labelSpace +
        (maxPackRadius * 2) +
        margin.bottom;



    /*******************************/
    /* STEP 9: Append SVG          */
    /*******************************/

    const svg = d3.select("#bubblechart")
        .append("svg")
        .attr(
            "viewBox",
            `0 0 ${width} ${height}`
        );


    // Apply margin convention
    const chart = svg
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left}, ${margin.top})`
        );



    /********************************/
    /* STEP 10: Category groups      */
    /********************************/

    // Create one SVG group <g> for each category pack.
    //
    // Each group is moved horizontally to the position
    // calculated above.

    const categoryGroups = chart
        .selectAll(".category-pack")
        .data(categoryPacks)
        .join("g")
            .attr("class", "category-pack")
            .attr(
                "transform",
                d => `translate(${d.x}, ${packCenterY})`
            );



    /*******************************/
    /* STEP 11: Color scale        */
    /*******************************/

    // Category names in their current order
    const categoryNames = categoryPacks.map(
        d => d.name
    );


    // Connect each category to one of the six global colors
    const categoryColor = d3.scaleOrdinal()
        .domain(categoryNames)
        .range(categoryColors);



    /********************************/
    /* STEP 12: Category boundaries  */
    /********************************/

    // Draw the category parent circle.
    //
    // At the moment it has an outline to make the packing
    // structure visible while developing the visualization.
    //
    // Later you can make this completely invisible.

    categoryGroups
        .append("circle")
        .attr("class", "category-boundary")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => d.radius)

        .attr("fill", "none")

        .attr(
            "stroke",
            d => categoryColor(d.name)
        )

        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.4);



    /*******************************/
    /* STEP 13: Draw food bubbles  */
    /*******************************/

    // We need to draw the leaf nodes separately
    // inside every category group.

    categoryGroups.each(function(categoryPack) {


        // Select the current category <g>
        const group = d3.select(this);


        // Get only the food-item nodes
        const foodNodes = categoryPack.root.leaves();


        group
            .selectAll(".food-bubble")
            .data(foodNodes)
            .join("circle")

                .attr("class", "food-bubble")


                // d3.pack calculated x/y relative to its own root.
                //
                // Subtract the category root position so that
                // the category center becomes (0, 0).
                .attr(
                    "cx",
                    d => d.x - categoryPack.root.x
                )

                .attr(
                    "cy",
                    d => d.y - categoryPack.root.y
                )


                // Radius was calculated with the shared scale
                .attr("r", d => d.r)


                // All foods belonging to the same category
                // receive the same color
                .attr(
                    "fill",
                    d => categoryColor(d.data.category)
                )

                .attr("fill-opacity", 0.8)

                .attr("stroke", "white")
                .attr("stroke-width", 1);

    });



    /*******************************/
    /* STEP 14: Category labels    */
    /*******************************/

    categoryGroups
        .append("text")

        .text(d => d.name)

        .attr("x", 0)

        // Put label above its enclosing category circle
        .attr(
            "y",
            d => -d.radius - 15
        )

        .attr("text-anchor", "middle")

        .style("font-size", "16px")
        .style("font-weight", "bold");



};