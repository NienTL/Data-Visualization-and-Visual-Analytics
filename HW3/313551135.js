const margin = {top: 40, right: 20, bottom: 20, left: 20};
const width = 600 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

d3.text("http://vis.lab.djosix.com:2024/data/abalone.data").then(function (data) {
    console.log("Abalone.data: ", data);
    var attrs = ["Length", "Diameter", "Height", "Whole weight", "Shucked weight", "Viscera weight", "Shell weight", "Rings"];
    var data_F = [];
    var data_M = [];
    var data_I = [];

    var rows = data.split("\n");
    for(var i = 0; i < rows.length; i++){
        //每一欄以“，”隔開
        var cols = rows[i].split(",");
        var each_data = [];
        for (var j = 0; j < 8; j++){
            //不儲存Sex
            each_data.push(+cols[j+1]);
        }
        if (cols[0] == "F"){
            data_F.push(each_data);
        }
        else if (cols[0] == "M"){
            data_M.push(each_data);
        }
        else if (cols[0] == "I"){
            data_I.push(each_data);
        }
    }

    //Build up correlation matrix
    cg_F = correlogram(data_F);
    cg_M = correlogram(data_M);
    cg_I = correlogram(data_I);

    //Build up render bar
    render_bar()
    //Present the correlation matrix according to different sex
    render_cg(cg_M)

    const radioButtons = document.querySelectorAll('input[name="sex"]');
    for (const button of radioButtons) {
        button.addEventListener('change', showSelected);
    }

    function showSelected(e) {
        if(this.checked) {
            if (this.value == "female") {
                render_cg(cg_F)
            }
            else if (this.value == "male") {
                render_cg(cg_M)
            }
            else if (this.value == "infant"){
                render_cg(cg_I)
            }
        }
    }

    //Build up correlation matrix
    function correlogram(data) {
        const matrix = math.transpose(data);
        let cg = [];
        for(let i = 0; i < matrix.length; i++){
            for(let j = 0; j < matrix.length; j++){
                let corr = math.corr(matrix[i], matrix[j]);
                cg.push({
                    x: attrs[i],
                    y: attrs[j],
                    value: +corr
                });
            }
        }

        return cg
    }

    function render_bar() {
        var bar_top = 15;
        var bar_height = 15;

        var bar_svg = d3.selectAll(".bar").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", bar_top + bar_height + 20)
            .append("g")
            .attr("transform", `translate(${margin.left},${bar_top})`);
        
        var defs = bar_svg.append("defs");
        var gradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");
        
        var stops = [{offset: 0, color: "#FA6623", value: 0}
                    , {offset: .5, color: "#ffffff", value: 0.5}
                    , {offset: 1, color: "#0F6879", value: 1}];
        
        gradient.selectAll("stop")
            .data(stops)
            .enter()
            .append("stop")
            .attr("offset", function(d) { return (100 * d.offset) + "%"; })
            .attr("stop-color", function(d) { return d.color;});
        
        //Draw the gradient bar
        bar_svg.append("rect")
            .attr("width", width)
            .attr("height", bar_height)
            .style("fill", "url(#linear-gradient)");
        //Create value tag
        bar_svg.selectAll("text")
            .data(stops)
            .enter()
            .append("text")
            .attr("x", function(d) { return width * d.offset; })
            .attr("dy", -6)
            .style("text-anchor", function(d, i) { return i == 0? "start" : i == 1? "middle" : "end"})
            .text(function(d, i) { return d.value.toFixed(2); })
            .style("font-size", 12)
            .style("fill", "#FFFFFF");
    }

    function render_cg(cg) {
        //When the category is changed, clear the current svg
        d3.select("#mydatavis").select("svg").remove()

        const domain = Array.from(new Set(cg.map(function(d) { return d.x})))
        // const num = Math.sqrt(cg.length)

        const color = d3.scaleLinear()
            .domain([0, 0.5, 1])
            .range(["#FA6623", "#ffffff", "#0F6879"]);
        //Create the size scale for the bubbles
        const size = d3.scaleSqrt()
            .domain([0, 1])
            .range([0, 15]);

        const x = d3.scalePoint()
            .range([0, width])
            .domain(domain)
        
        const y = d3.scalePoint()
        .range([0, height])
        .domain(domain)

        const svg = d3.select("#mydatavis")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        //Create one "g" element for each cell of correlation matrix
        const cor = svg.selectAll(".cor")
            .data(cg)
            .join("g")
            .attr("class", "cor")
            .attr("transform", function(d) {
                return `translate(${x(d.x)}, ${y(d.y)})`
            });
        //Add the text with specific color
        cor.filter(function(d){
            const ypos = domain.indexOf(d.y);
            const xpos = domain.indexOf(d.x);
            return xpos <= ypos;
            })
            .append("text")
            .attr("y", 5)
            .text(function(d) {
                if(d.x === d.y) {
                    return d.x;
                } else{
                    return d.value.toFixed(2);
                }
            })
            .style("font-size",13)
            .style("text-anchor", "middle")
            .style("fill", function(d) {
                if(d.x === d.y){
                    return "#FFFFFF";
                } else{
                    return color(d.value);
                }
            })
            .style("font-weight", 'bold');

        //Add bubbles
        cor.filter(function(d) {
            const ypos = domain.indexOf(d.y);
            const xpos = domain.indexOf(d.x);
            return xpos > ypos;
            })
            .append("circle")
            .attr("r", function(d) {
                return size(Math.abs(d.value))
            })
            .style("fill", function(d) {
                if(d.x === d.y) {
                    return "#000";
                } else{
                    return color(d.value);
                }
            })
            .style("opacity", 0.8)
        
    }
}) 