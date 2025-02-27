const width = 960;
const height = 960;
const size = 230;
const padding = 28;

const colorScale = {
    "Iris-setosa": "#EF6F6C",
    "Iris-versicolor": "#465775",
    "Iris-virginica": "#56E39F"
};

const attributes = ["sepal length", "sepal width", "petal length", "petal width"];

const svg = d3.select("svg").attr("viewBox", [-padding * 2, -padding * 2, width + padding * 3, height + padding * 3]);

const brush = (cell, circle, svg, { padding, size, x, y, attributes}) => {
    const brush = d3.brush()
        .extent([[padding / 2, padding / 2], [size - padding / 2, size - padding / 2]])
        .on("start", brushclear)
        .on("brush", brushed)
        .on("end", brushend);

    cell.call(brush);
    let brushCell;

    function brushclear() {
        if (brushCell !== this){
            d3.select(brushCell).call(brush.move, null);
            brushCell = this;
        }
    }
    //selection: brusharea
    function brushed({ selection }, [i, j]) {
        let selected = [];
        if(selection) {
            //x0, y0:upper left; x1, y1: bottom right
            const [[x0, y0], [x1, y1]] = selection;
            circle.classed("hidden",
                (d) =>
                    x0 > x[i](d[attributes[i]]) ||
                    x1 < x[i](d[attributes[i]]) ||
                    y0 > y[j](d[attributes[j]]) ||
                    y1 < y[j](d[attributes[j]])
            );
            //lightened area
            selected = data.filter(
                (d) => 
                    x0 < x[i](d[columns[i]]) &&
                    x1 > x[i](d[columns[i]]) &&
                    y0 < y[j](d[columns[j]]) &&
                    y1 > y[j](d[columns[j]])
            );
        }
        //store the selected point into svg property as the value
        svg.property("value", selected).dispatch("input")
    }
    //
    function brushend({ selection }) {
        if(selection) return;
        //if selection == null => No point is selected => clear the "value" array
        svg.property("value", []).dispatch("input");
        circle.classed("hidden", false)
    }
}

d3.csv("./iris.csv").then((data) => {
    console.log(data)
    data.splice(150, 1)
    const x = attributes.map((attri) => 
        d3.scaleLinear()
        .domain(d3.extent(data, (d) => d[attri]))
        .rangeRound([padding / 2, size - padding /2])
    );

    const y =x.map((x) => x.copy()
        .range([size - padding / 2, padding / 2 ])
    );
    
    const x_axis = d3.axisBottom()
        .scale(x)
        .ticks(6)
        .tickSize(size * attributes.length)
        .tickFormat(() => "");

    const y_axis = d3.axisLeft()
        .scale(y)
        .ticks(6)
        .tickSize(-size * attributes.length)
        .tickFormat(() => "");
    //X cells
    const x_cells = (g) => g.selectAll("g")
        .data(x)
        .join("g")
        .attr("transform", (d, i) => `translate(${i * size}, 0)`)
        .each(function(d) {
            return d3.select(this).call(x_axis.scale(d));
        })
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd")
    );
    //Y cells
    const y_cells = (g) => g.selectAll("g")
        .data(y)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * size})`)
        .each(function(d) {
            return d3.select(this).call(y_axis.scale(d));
        })
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd")
    );
    
    svg.attr("viewBox", [-padding * 2, -padding * 2, width + padding * 3, height + padding * 3])
        .append("style")
        .text(`circle.hidden { fill: #CCC; fill-opacity: 0.7; r: 3.5px; }`
    );

    svg.append("g").call(x_cells);
    svg.append("g").call(y_cells);

    //each matrix
    const cell = svg.append("g")
        .selectAll("cell")
        .data(d3.cross(d3.range(attributes.length), d3.range(attributes.length)))
        .join("g")
        .attr("transform", ([i, j]) => `translate(${i * size}, ${j * size})`
    );
    //outline of each matrix 
    cell.append("rect")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("x", padding / 2 + 0.5)
        .attr("y", padding / 2 + 0.5)
        .attr("width", size - padding)
        .attr("height", size - padding);

    //The text name of each attribute at the top
    attributes.forEach((attr, i) => {
        svg.append("text")
            .attr("x", (i + 0.5) * size) // x coordinate
            .attr("y", padding - 30) // y coordinate
            .style("text-anchor", "middle")
            .style("font-size", "28px")
            .style("fill", "black")
            .text(attr);
    });

    //The text name of each attribute at the left
    attributes.forEach((attr, i) => {
        svg.append("text")
            .attr("x", padding + 32) 
            .attr("y", (i + 0.5) * size - 18)
            .style("text-anchor", "end") 
            .style("font-size", "28px") 
            .style("fill", "black")
            .attr("transform", "rotate(-90," + (-padding / 2) + "," + ((i + 0.5) * size) + ")") // 旋轉 90 度
            .text(attr);
    });
    
    cell.each(function([i, j]){
        if (i == j){
            const values = data.map(function(d){
                return +d[attributes[i]];
            });
            const xHis = d3.scaleLinear()
                .domain([d3.min(values), d3.max(values)])
                .range([padding / 2, size - padding / 2 ]);
                
            const histo = d3.bin()
                .domain(xHis.domain())
                .thresholds(xHis.ticks(10))(values);

            const yHis = d3.scaleLinear()
                .domain([0, d3.max(histo, function(d){
                    return d.length;
                }),
                ])
                .range([size - padding / 2, padding / 2]);
            
            d3.select(this)
                .selectAll("bar")
                .data(histo)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function(d){
                    return xHis(d.x0);
                })
                .attr("y", function(d){
                    return yHis(d.length);
                })
                .attr("width", xHis(histo[0].x1) - xHis(histo[0].x0) - 1)
                .attr("height", (d) => size - padding / 2 - yHis(d.length))
                .style("fill", "#D3A588");
                
            d3.select(this).append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${size - padding / 2})`)
                .call(d3.axisBottom(xHis).ticks(6));
            
            d3.select(this).append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${padding / 2}, 0)`) 
                .call(d3.axisLeft(yHis).ticks(6));
        } else {
            d3.select(this)
                .selectAll("circle")
                .data(
                    data.filter((d) => !isNaN(d[attributes[i]]) && !isNaN(d[attributes[j]]))
                )
                .join("circle")
                .attr("cx", (d) => x[i](d[attributes[i]]))
                .attr("cy", (d) => y[j](d[attributes[j]]));

            d3.select(this).append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${size - padding / 2})`) 
                .call(d3.axisBottom(x[i]).ticks(6));

            d3.select(this).append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${padding / 2}, 0)`)
                .call(d3.axisLeft(y[j]).ticks(6));
        }
    });
    const circle = cell.selectAll("circle")
        .attr("r", 3.5)
        .attr("fill-opacity", 0.7)
        .attr("fill", (d) => `${colorScale[d["class"]]}`);

    cell.call(brush, circle, svg, { padding, size, x, y, attributes}); 
});
