let btn = document.querySelector("#tips")
let info = document.querySelector("#information")
let close = document.querySelector("#ok")
btn.addEventListener("click", function() {
    info.showModal();
})
close.addEventListener("click", function() {
    info.close()
})

const margin = {top: 100, right: 30, bottom: 40, left: 300};
const width = 1500 - margin.left - margin.right;
const height = 20000 - margin.top - margin.bottom;

const svg = d3.select("#mydatavis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

const attrs = ["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"];
const colorScale = d3.scaleOrdinal()
    .domain(attrs)
    .range(["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0"]);

let cur_lightened_attr = null;

d3.csv("http://vis.lab.djosix.com:2024/data/TIMES_WorldUniversityRankings_2024.csv").then(function(data) {
    // console.log(data);
    data = data.filter(d => d["rank"] != "Reporter");
    data.forEach(d => {
        d["name"] = d["name"] || NaN;
        d["scores_overall"] = parseFloat(d["scores_overall"]) || NaN;
        d["scores_teaching"] = parseFloat(d["scores_teaching"]) || NaN;
        d["scores_research"] = parseFloat(d["scores_research"]) || NaN;
        d["scores_citations"] = parseFloat(d["scores_citations"]) || NaN;
        d["scores_industry_income"] = parseFloat(d["scores_industry_income"]) || NaN;
        d["scores_international_outlook"] = parseFloat(d["scores_international_outlook"]) || NaN;
        // console.log("d[scores_overall]", d["scores_overall"])
    })
    console.log("Dataset: ", data);
    //Default sort by overall and the order is decending
    d3.select("#sort-by").property("value", "scores_overall");
    d3.select("#order").property("value", "descending");
    //Listen to the menu changed
    d3.select("#sort-by").on("change", updateChart);
    d3.select("#order").on("change", updateChart);
    
    updateChart();

    function updateChart() {
        cur_lightened_attr = null;
        d3.selectAll(".legend-control span").style("opacity", 1);
        clickOn(cur_lightened_attr);

        const sortAttr = d3.select("#sort-by").property("value");
        const order = d3.select("#order").property("value");
        const sorted_data = sorting(data, sortAttr, order);

        render_barchart(sorted_data);
    }

    function clickOn(cur_lighten_attr) {
        d3.selectAll(".legend-control span")
        .on("click", function(event, d) {
            const selected_attr = d3.select(this).attr("class");
            console.log("Selected attribute:", selected_attr);
            //The attribute is already be lightened
            if(cur_lightened_attr === selected_attr) {
                //Restore to all the attributes are lightened
                cur_lightened_attr = null;
                svg.selectAll("rect").style("opacity", 1);
                //Restore the legend
                d3.selectAll(".legend-control span").style("opacity", 1);
                // d3.selectAll(".legend-control .text").style("opacity", 1);
            } else {
                cur_lightened_attr = selected_attr;

                svg.selectAll("rect")
                .style("opacity", function() {
                    //The cur_lightened attribute is lightened, and the others are of opacity 0.1
                    return d3.select(this.parentNode).datum().key === cur_lightened_attr ? 1 : 0.3;
                });

                d3.selectAll(".legend-control span").style("opacity", function() {
                    return d3.select(this).attr("class") === cur_lightened_attr ? 1 : 0.3;
                });

                d3.selectAll(".legend-control .text").style("opacity", function() {
                    const correspondingSpanClass = d3.select(this.previousElementSibling).attr("class");
                    // console.log("correspondingSpanClass: ", correspondingSpanClass);
                    return correspondingSpanClass === cur_lightened_attr ? 1 : 0.3;
                });
            }
        });
    }
    
    function sorting(data, sort_attr, sort_by) {
        if(sort_by === "descending") {
            data.sort((a, b) => b[sort_attr] - a[sort_attr]);
        }
        else if (sort_by === "ascending") {
            data.sort((a, b) => a[sort_attr] - b[sort_attr]);
        }
        else{
            console.log("Sort Error!");
        }
        // console.log("sorted_data: ", data);
        return data;
    }

    function render_barchart(data) {
        //Clear
        svg.selectAll("*").remove();
        //Build x and y scale
        const x = d3.scaleLinear()
            .range([0, width])
            .domain([0, 500]);
            
        const y = d3.scaleBand()
            .range([0, height])
            .padding(0.2)
            .domain(data.map(d => d["name"]));

        //Create x-axis and y-axis
        const xAxis = d3.axisBottom(x);
        const yAxis = d3.axisLeft(y)

        //Add x-axis and y-axis to the bottome of the chart
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);
        //Add x-axis and y-axis to the top of the chart    
        svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, -8)`)
        .call(xAxis)
        .selectAll(".tick text")
        .attr("dy", "-1.5em");

        svg.append("g")
            .call(yAxis);

        //Vertical lines
        const ticks = x.ticks();
        const line_height = height;

        ticks.forEach(tick => {
            svg.append("line")
                .attr("x1", x(tick))
                .attr("y1", 0)
                .attr("x2", x(tick))
                .attr("y2", line_height)
                .attr("stroke", "lightgrey")
                .attr("stroke-dasharray", "5, 5");
        })

        //Stack the data
        const stackData = d3.stack()
            .keys(attrs)
            (data)
        console.log("stackData: ", stackData);

       //Create a tooltip
        const tooltip = d3.select("#mydatavis")
            .append("div")
            .attr("class", "tooltip")
        
        const mouseover = function(event, d) {
            const u_name = d3.select(this.parentNode).datum().key;
            console.log("u_name: ", u_name);

            //If there is an attribute lightened, users can only mouse over the choosed attribute
            if(cur_lightened_attr != null && u_name != cur_lightened_attr) {
                console.log("I'm in the if condition!")
                return;
            }

            const u_value = d.data[u_name];
            console.log("value: ", u_value);

            tooltip.html("Attribute: " + u_name + "<br>" + "Value: " + u_value)
                .style("opacity", 1)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 30) + "px");
            
            d3.select(this)
                .transition()
                .duration(200)
                .style("fill-opacity", 0.3)

            // console.log("Tooltip shown at:", (event.pageX + 5), (event.pageY - 30));
        }   

        const mousemove = function(event, d) {
            tooltip.style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 30) + "px");
            // console.log("Tooltip position:", event.pageX, event.pageY);
        }

        const mouseleave = function(event, d) {
            tooltip.style("opacity", 0)

            d3.select(this)
                .transition()
                .duration(200)
                .style("fill-opacity", 1);
        }

        //Show the bars
        svg.append("g")
            .selectAll("g")
            .data(stackData)
            .join("g")
            .attr("fill", d => colorScale(d.key))
            .attr("class", d => "myRect" + d.key)
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d.data.name))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d[1]) - x(d[0]))
            .attr("stroke", "grey")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
    }
})
    