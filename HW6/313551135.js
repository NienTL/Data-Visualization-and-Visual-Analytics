let btn = document.querySelector("#tips")
let info = document.querySelector("#information")
let close = document.querySelector("#ok")
btn.addEventListener("click", function() {
    info.showModal();
})
close.addEventListener("click", function() {
    info.close()
})

const margin = { top: 50, right: 30, bottom: 40, left: 100 };
const width = 850 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select('#mydatavis')
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.csv("./ma_lga_12345.csv").then(function(data) {
    var data_c = {}
    for(let i = 0; i < data.length; i++){
        if(!(data[i]["saledate"] in data_c)) {
            data_c[data[i]["saledate"]] = {
                "house with 2 bedrooms": 0,
                "house with 3 bedrooms": 0,
                "house with 4 bedrooms": 0,
                "house with 5 bedrooms": 0,
                "unit with 1 bedrooms": 0,
                "unit with 2 bedrooms": 0,
                "unit with 3 bedrooms": 0
            }
        }
        class_str = data[i]["type"] + " with " + data[i]["bedrooms"] + " bedrooms";
        data_c[data[i]["saledate"]][class_str] = +data[i]["MA"]
    }
    // console.log("data_c: ", data_c)

    var data_d = []
    for(const [key, value] of Object.entries(data_c)) {
        value["date"] = moment(key, "DD/MM/YYYY").toDate();
        // console.log("value: ", value)
        data_d.push(value)
    }
    // console.log("data_d: ", data_d)

    data_d.sort(function (a,b ) { return a["date"] - b["date"]; });
    // console.log("data_d after sorted: ", data_d);
    data = data_d;

    var categories = Object.keys(data[0]).slice(0, -1)
    console.log("categories: ", categories)
    const colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494"]);

    var blocks = document.getElementById('blocks')
    let html = ""
    for(let i = 0; i < categories.length; i++) {
        html += '<div class = "list-group-item" style = "background-color:' + colorScale(categories[i]) + '">' + categories[i] + '</div>'
    }
    blocks.innerHTML = html;

    var sortable = new Sortable(blocks, {
        animation: 150,
        onChange: function (event) {
            event.newIndex
            let blocks_divs = blocks.getElementsByTagName("div");
            let categories = []
            for(let i = 0; i < blocks_divs.length; i++) {
                categories.push(blocks_divs[i].textContent)
            }
            render(categories);
        }
    });

    var activeCategories = new Set(categories);
    blocks.addEventListener('click', function(event) {
        if (event.target.classList.contains('list-group-item')) {
            const clickedCategory = event.target.textContent;
            if (activeCategories.has(clickedCategory)) {
                activeCategories.delete(clickedCategory); // 如果存在，則刪除
            } else {
                activeCategories.add(clickedCategory); // 否則添加
            }
            render(categories); // 重新渲染
        }
    });

    render(categories)

    function render(categories) {
        svg.selectAll('*').remove();
        let new_categories = Array.from(categories)
        new_categories.reverse();

        const x = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d["date"]; }))
            .range([0, width]);
        
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x)
                    .ticks(10)
                    .tickFormat(d3.timeFormat("%Y-%m-%d"))
                    .tickSize(-height))
            .attr("class", "x-axis")
        
        svg.selectAll(".tick line").attr("stroke", "lightgrey")
        
        const stackedData = d3.stack()
            .keys(new_categories)(data);

        const maxYValue = d3.max(stackedData, layer => d3.max(layer, d => d[1]));
        const y = d3.scaleLinear()
            .domain([0, maxYValue])
            .range([height, 0]);
        
        svg.append("g")
            .call(d3.axisLeft(y).ticks(7))
            .attr("class", "y-axis");

        const tooltip = d3.select("#mydatavis")
            .append("div")
            .attr("class", "tooltip")

        const mouseover = function(event, d) {
            const cate_name = d3.select(this).datum().key;
            console.log("cate_name:", cate_name)

            tooltip.html("Category: " + cate_name)
                .style("opacity", 1)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 30) + "px");

            d3.selectAll(".myArea").style("opacity", .2)
            d3.select(this)
                .style("stroke", "#ffffff")
                .style("opacity", 1)
        }

        const mousemove = function(event, d) {
            tooltip.style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 30) + "px");
        }

        const mouseleave = function(event, d) {
            tooltip.style("opacity", 0)

            d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
        }

        const area = d3.area()
            .x(d => x(d.data["date"]))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        svg.selectAll("mylayers")
            .data(stackedData)
            .join("path")
            .attr("class", "myArea")
            .style("fill", function(d) { return colorScale(d.key); })
            .style("opacity", function(d) {
                return activeCategories.has(d.key) ? 1 : 0.2; // 根據 activeCategories 控制透明度
            })
            .attr("d", area)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
    }
});