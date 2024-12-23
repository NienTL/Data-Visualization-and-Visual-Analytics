const margin = {top: 60, right: 40, bottom: 60, left: 60};
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

const colorScale = d3.scaleOrdinal()
    .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
    .range(["#EF6F6C", "#465775", "#56E39F"]);
    
//Default axis
let x_axis_property = "sepal length";
let y_axis_property = "sepal width";

// Read the CSV data
d3.csv("http://vis.lab.djosix.com:2024/data/iris.csv").then(data => {
    // Parse the data
    data.forEach(d => {
        d["sepal length"] = parseFloat(d["sepal length"]) || NaN;
        d["sepal width"] = parseFloat(d["sepal width"]) || NaN;
        d["petal length"] = parseFloat(d["petal length"]) || NaN;
        d["petal width"] = parseFloat(d["petal width"]) || NaN;
    });

    console.log("iris dataset:", data);
    
    // Initialize chart with the default x and y properties
    updateChart(x_axis_property, y_axis_property, data);

    d3.select('#x-select')
        .property("value", x_axis_property)
        .on("change", function() {
            x_axis_property = this.value;
            updateChart(x_axis_property, y_axis_property, data);
        });

    d3.select('#y-select')
        .property("value", y_axis_property)
        .on("change", function() {
            y_axis_property = this.value;
            updateChart(x_axis_property, y_axis_property, data);
        });
});

function updateChart(x_axis_property, y_axis_property, data) {
    const xScale = d3.scaleLinear()
        .range([0, width])
        .domain([d3.min(data, d => d[x_axis_property]), d3.max(data, d => d[x_axis_property])]);

    const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([d3.min(data, d => d[y_axis_property]), d3.max(data, d => d[y_axis_property])]);

    console.log("min:", d3.min(data, d => d[x_axis_property]))
    // Remove existing axes before creating new ones
    svg.select(".x-axis").remove();
    svg.select(".y-axis").remove();

    // Create x-axis
    const x_axis = d3.axisBottom(xScale);
    
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${margin.left}, ${height + margin.top})`)
        .call(x_axis);

    // Create y-axis
    const y_axis = d3.axisLeft(yScale);
    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .call(y_axis);

    // Remove existing circles before creating new ones
    svg.selectAll("circle").remove();

    // Append circles based on the data
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[x_axis_property]))
        .attr("cy", d => yScale(d[y_axis_property]))
        .attr("r", 6)
        .attr("fill", d => colorScale(d.class))
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .on("mouseover", function(d) {
            var boundData = d3.select(this).datum();
            d3.select(this).append("title")
                .text(`X: ${boundData[x_axis_property]}, Y: ${boundData[y_axis_property]}, Class: ${boundData.class}`);
        })
        .on("mouseout", function() {
            d3.select(this).select("title").remove();
        });
}