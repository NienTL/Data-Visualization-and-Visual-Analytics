const margin = {top: 30, right: 100, bottom: 10, left: 50};
const width = 1250 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#mydatavis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")" );

d3.csv("./iris.csv", function(data) {
    var colorScale = d3.scaleOrdinal()
        .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
        .range(["#EF6F6C", "#465775", "#56E39F"]);

    var dimensions = ["sepal length", "sepal width", "petal length", "petal width"];

    var y = {};
    for (d in dimensions){
        let y_max = 0
        let y_min = 999
        
        for(let i = 0; i < data.length; i++){
            if(data[i][dimensions[d]] > y_max){
                y_max = data[i][dimensions[d]]
            }
            if(data[i][dimensions[d]] < y_min){
                y_min = data[i][dimensions[d]]
            }  
        }
        console.log("y_min:", y_min, "y_max:", y_max);
        attri = dimensions[d]
        y[attri] = d3.scaleLinear()
                .domain([Math.floor(y_min), Math.ceil(y_max)])
                .range([height, 0])
    }

    var x = {}
    cur_x = d3.scalePoint()
        .range([0, width])
        .domain(dimensions);
    for (d in dimensions) {
        attri = dimensions[d];
        x[attri] = cur_x(attri);
    }

    var lighten = function(d){
        var selected_class = d.class;

        d3.selectAll(".line")
            .transition().duration(200)
            .style("stroke", "lightgrey")
            .style("opacity", "0.2");

        d3.selectAll("." + selected_class)
            .transition().duration(200)
            .style("stroke", colorScale(selected_class))
            .style("opacity", "1");
    };

    var unlighten = function(d){
        d3.selectAll(".line")
            .transition().duration(200).delay(1000)
            .style("stroke", function(d) { return colorScale(d.class); })
            .style("opacity", "1");
    };

    function path(d) {
        return d3.line()(dimensions.map(function (p) { return [x[p], y[p](d[p])]; }));
    }

    var all_lines = svg.selectAll("myPath")
        .data(data)
        .enter()
        .append("path")
        .attr("class", function(d) { return "line " + d.class })
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", function(d) { return (colorScale(d.class)) })
        .style("opacity", 0.5)
        .on("mouseover", lighten)
        .on("mouseleave", unlighten);

    var drags = [];
    var order = [];
    svg.selectAll("myAxis")
        .data(dimensions).enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", function(d) { return "translate(" + x[d] + ")"; })
        .each(function(d, index) { 
            drags[index] = d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(5)); 
            order[index] = index;
            drags[index].call(d3.drag()
                .on("start", function(d){ })
                .on("drag", function(d){
                    x[d] = Math.min(Math.max(d3.event.x, 0), 1000);
                    drags[index].attr("transform", function (d) { return "translate(" + x[d] + ")"; })
                    for (var i = 0; i < 4; i++){
                        for(var j = i + 1; j < 4; j++){
                            if(x[dimensions[i]] >= x[dimensions[j]]){
                                if (d == dimensions[i]){
                                    x[dimensions[j]] = 1000 / 3 * i;
                                    drags[order[j]].attr("transform", function (d) { return "translate(" + x[dimensions[j]] + ")"; })
                                }
                                if (d == dimensions[j]) {
                                    x[dimensions[i]] = 1000 / 3 * j;
                                    drags[order[i]].attr("transform", function (d) { return "translate(" + x[dimensions[i]] + ")"; })
                                }
                                tmp = dimensions[i];
                                dimensions[i] = dimensions[j];
                                dimensions[j] = tmp;
                                tmp = order[i];
                                order[i] = order[j];
                                order[j] = tmp;
                                break;
                            }
                        }
                    }
                    all_lines.attr("d", path)
                })
                .on("end", function(d){ }))
        })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; })
        .style("fill", "black");
});