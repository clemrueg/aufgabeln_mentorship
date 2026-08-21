/*******************************/
// Pipeline
/*******************************/       

// main.js:
// │
// ├── load CSV
// ├── format original data
// ├── explore / calculate category shares
// ├── apply shared 3% category rule
// │
// └── cleanedData
//       ├── drawBubbleChart(cleanedData)
//       └── drawSankey(cleanedData)


// bubblechart.js
// └── transformations/layout specific to VIZ1


// sankey.js
// └── transformations/layout specific to VIZ2

/*******************************/
// Load data and call function createViz
/*******************************/       
        
// Load, format and measure the dataset
d3.csv("./data/data_messungen.csv", d => {
  return {

    //for both VIZ
    quantity: +d.quantity_grams, //convert quantity from string to number
    
    // for VIZ1
    item: d.analysis_item_name,
    category: d.analysis_category, 
    
    // for VIZ2
    reason: d.reason,
    cause: d.waste_cause

  };
}).then(data => {

    console.log("Data", data);

    console.log("Length data:",data.length); // 139 Einträge

  // Get the max and min quantities
    console.log("Max quantity:", d3.max(data, d => d.quantity));
    console.log("Min quantity:", d3.min(data, d => d.quantity)); 
    console.log("Quantity extent:", d3.extent(data, d => d.quantity)); 

    
    /*******************************/
    /*      Calculate totals       */
    /*******************************/

    // Calculate total amount of  food wasted (in grams)
    const totalQuantity = d3.sum(data, d => d.quantity);

    console.log("Total quantity in grams:", totalQuantity);
    console.log("Total quantity in kg:", totalQuantity / 1000);

    // Total quantity for each food category
    const categoryTotals = d3.rollups( // d3.rollups groups data by category and calculate something for every group
        data,
        values => d3.sum(values, d => d.quantity), // for each rollup group, calculate sum of all qauantities
        d => d.category // create groups based on category
      )
      .sort((a, b) => d3.descending(a[1], b[1])); //sort categories from highest to lowest quantity; a[1] because quantity is at index 1
    
      console.log("Category totals:", categoryTotals);

    /*******************************/
    /*    Calculate percentages    */
    /*******************************/

    // Calculate how much of the total each category represents (for ** 2% ** cutoff value, based on exploration); keep decimal instead of percentages for later calculations
    const categoryPercentages = categoryTotals.map(d => {
    
        return {
          category: d[0],
          quantity: d[1],
          percentage: d[1] / totalQuantity
        };
    
    });
    
    //console.table(categoryPercentages); // console.table instead of console.log for better readability

    /*******************************/
    /*    3% cutoff rule    */
    /*******************************/
    
    const cutoff = 0.03; // cutoff as decimal
    
    
    // Keep only the food categories that represent
    // at least 3% of the total quantity
    const mainCategories = categoryPercentages
      .filter(d => d.percentage >= cutoff) // filters data based on cutoff value
      .map(d => d.category); // .map returns only the category names of the filtered values
    
    console.log("Categories >= 3%:", mainCategories);

    // Create a new dataset with the cutoff for the Sankey diagram
    // to make sure the original data are still usable for VIZ1
    const cleanedData = data.map(d => {
    
      return {

        item: d.item,

        category: mainCategories.includes(d.category) // Condition: is this row inside the mainCategories array?
          ? d.category // if yes, keep original category
          : "Anderes", // if not, replace by "Anderes"
    
        cause: d.cause,
        reason: d.reason,
        quantity: d.quantity
      };
    
    });

    console.log("Cleaned data:", cleanedData);

    // Check the categories after applying the cutoff
    const cleanedCategoryTotals = d3.rollups(
      cleanedData,
      values => d3.sum(values, d => d.quantity),
      d => d.category
    )
    .sort((a, b) => b[1] - a[1]);

    // Category names ordered from highest to lowest total quantity
  const categoryOrder = cleanedCategoryTotals.map(d => d[0]);

  console.log("Category order:", categoryOrder);

  // shared color scale based on ranking from VIZ1
  const categoryColorScale = d3.scaleOrdinal()
    .domain(categoryOrder)
    .range(categoryColors);
    
    // console.table(cleanedCategoryTotals);


  /*******************************/
  /*    Call the visualizations   */
  /*******************************/

  // call VIZ 1
  drawBubbleChart(
    cleanedData,
    categoryOrder,
    categoryColorScale
  );

  createTooltipBubble();
  handleMouseEventsBubble(); 

  // call VIZ 2 + Tooltip
  drawSankey(
    cleanedData,
    categoryOrder,
    categoryColorScale
  );

  createTooltipSankey();

 });
