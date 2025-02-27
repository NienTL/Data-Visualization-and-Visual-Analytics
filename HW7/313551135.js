d3.csv("./air-pollution.csv").then(function (data) { 
    console.log("data:", data)
    const addressMap = {};
    const round_value = function (num, decimal) { 
        var value = Math.round((num + Number.EPSILON) * Math.pow(10, decimal)) / Math.pow(10, decimal);
        return value;
    }

    function aggregate(data, type) {
        var sums = data.reduce(function (acc, obj) {
            var date = obj["Measurement date"].split(" ")[0];
            var station = obj["Station code"];
            var address = obj["Address"];
            addressMap[station] = address;
            if (!acc[date]) { acc[date] = {}; }
            if (!acc[date][station]) { acc[date][station] = { sum: 0, count: 0 }; }
            acc[date][station].sum += +obj[type];
            acc[date][station].count++;
            return acc;
        }, Object.create(null));

        const result = Object.keys(sums).map(function (date) {
            return Object.keys(sums[date]).map(function (station) {
                return {
                    "ts": new Date(date),
                    "series": station,
                    "val": round_value(sums[date][station].sum / sums[date][station].count, 4),
                };
            });
        });
        // console.log("result: ", result)
        return result;
    }

    const selectMenu = document.getElementById('type-select');
    selectMenu.addEventListener('change', function() {
        render(this.value);
    });
    
    function render(type) {
        var aggre_data = aggregate(data, type);
        var flat_data = [].concat(...aggre_data);
        
        const colorSchemes = {
            "SO2": ["white", "#993333"],
            "NO2": ["white", "#FF9900"],
            "O3": ["white", "#006633"],
            "CO": ["white", "#336699"],
            "PM10": ["white", "#ab47bc"],
            "PM2.5": ["white", "#808040"]
        };

        const colors = colorSchemes[type] || ["white", "gray"]; // 若 type 未定義，使用灰色調

        HorizonTSChart()(document.getElementById('mydatavis'))
            .data(flat_data)
            .series('series')
            .positiveColors(colors)
            .tooltipContent(function(d) { 
                const address = addressMap[d.series];
                const ts = new Date(d.ts);
                
                if (isNaN(ts)) {
                    console.error("Invalid Date:", d.ts);
                    return `<div style="color: red;">Invalid Date</div>`;
                }

                const formattedDate = ts.toLocaleDateString();
                const formattedTime = ts.toLocaleTimeString();

                const tooltipHtml = `<div style="
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 8px;
                    font-size: 14px;
                    border-radius: 5px;
                    max-width: 300px;
                    white-space: normal;
                    word-wrap: break-word;
                ">▹Address: ${address}<br>▹Date: ${formattedDate} ${formattedTime}<br>▹Value: ${d.val}</div>`;
                return tooltipHtml;
            });    
    }

    render("SO2");
});


