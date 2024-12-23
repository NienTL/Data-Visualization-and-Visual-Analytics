const margin = {top: 100, right: 50, bottom: 60, left: 100}
const width = 1100 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#bubblechart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Bubble Chart Canva
// Add X axis
const x = d3.scaleLinear()
            .domain([1930, 2030])
            .range([ 0, width ]);

svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

// Add Y axis
const y = d3.scaleLinear()
    .domain([0, 12.99])
    .range([height, 0]);

svg.append("g")
    .call(d3.axisLeft(y));

// Add a scale for bubble size
const z = d3.scaleLinear()
    .domain([2762, 3703895000])
    .range([ 20, 100]);

const trackColor = d3.scaleOrdinal(d3.schemeSet3);

d3.csv("./spotify-2023.csv").then(function (data) {
    let artistList = {};

    // Data Preprocessing
    data.forEach((row, idx) => {
        const cleanedRow = cleanData(row);
        data[idx] = cleanedRow;
        cleanedRow.artist_name.forEach((artist) => {
            if (!artistList[artist]) {
              artistList[artist] = [];
            }
            artistList[artist].push(cleanedRow);
        });
    });

    const popularArtists = Object.entries(artistList)
      .filter(([artist, songs]) => songs.length >= 10)
      .sort((a, b) => b[1].length - a[1].length);

    const singerSelect = d3.select("#singer");

    singerSelect.selectAll("option")
      .data(popularArtists)
      .enter()
      .append("option")
      .attr("value", (d) => d[0])
      .text((d) => `${d[0]} (${d[1].length} songs)`);

    updateBubbleChart(popularArtists[0][0]);

    singerSelect.on("change", function () {
        const selectedArtist = this.value;
        updateBubbleChart(selectedArtist);
    });

    // updateBubbleChart 函數使用區域 artistList
    function updateBubbleChart(artist) {
        const filteredData = artistList[artist];

        const minYear = d3.min(filteredData, (d) => d.released_year);
        const maxYear = d3.max(filteredData, (d) => d.released_year);

        x.domain([minYear - 1, maxYear + 1]); 
        svg.select("g")
            .transition()
            .duration(300)
            .call(d3.axisBottom(x)
                .ticks((maxYear - minYear) + 1) 
                .tickFormat(d3.format("d")));

        filteredData.sort((a, b) => b.streams - a.streams);

        const bubbles = svg.selectAll(".bubbles").data(filteredData, (d) => d.track_name);

        bubbles.exit().transition().duration(300).attr("r", 0).remove();

        bubbles.transition()
            .duration(300)
            .attr("cx", (d) => x(d.released_year + (d.released_month - 1) / 12 + d.released_day / 365)) 
            .attr("cy", (d) => y(d.released_month + d.released_day / 31)) 
            .attr("r", (d) => z(d.streams))
            .style("fill", (d) => trackColor(d.track_name));

        bubbles.enter()
            .append("circle")
            .attr("class", "bubbles")
            .attr("cx", (d) => x(d.released_year + (d.released_month - 1) / 12 + d.released_day / 365))
            .attr("cy", (d) => y(d.released_month + d.released_day / 31))
            .attr("r", 0)
            .style("fill", (d) => trackColor(d.track_name))
            .on("mouseover", showTooltip)
            .on("mousemove", moveTooltip)
            .on("mouseleave", hideTooltip)
            .on("click", handleClick)
            .transition()
            .duration(300)
            .attr("r", (d) => z(d.streams));
    }
});
    

// -1- Create a tooltip div that is hidden by default:
const tooltip = d3.select("#bubblechart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    // .style("background-color", "black")
    .style("background-color", "#DD968F") 
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("color", "white")

// -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
function showTooltip(event, d) {
    tooltip.transition()
        .duration(200)
        .style("opacity", 1)
    tooltip.html(`<strong>${d.track_name}</strong><br>Released: ${d.released_year}/${d.released_month}/${d.released_day}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
}
    
function moveTooltip(event) {
    tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY + 10 + "px");
}
    
function hideTooltip() {
    tooltip.transition().duration(200).style("opacity", 0);
}

function handleClick(event, d) {
    const bubbleColor = trackColor(d.track_name);
    console.log("bubbleColor: ", bubbleColor)
    console.log("Domain: ", trackColor.domain());
    console.log("Track Name: ", d.track_name);
    const radarData = [{
        className: d.artist_name,
        songName: d.track_name,
        keyword: `${d.track_name} ${d.artist_name}`,
        color: bubbleColor,
        axes: [
            { axis: "danceability_%", value: d.danceability },
            { axis: "valence_%", value: d.valence },
            { axis: "energy_%", value: d.energy },
            { axis: "acousticness_%", value: d.acousticness },
            { axis: "instrumentalness_%", value: d.instrumentalness },
            { axis: "liveness_%", value: d.liveness },
            { axis: "speechiness_%", value: d.speechiness }
        ]
    }];

    // 將資料存入 localStorage
    localStorage.setItem('radarData', JSON.stringify(radarData));

    // 跳轉到雷達圖頁面
    window.location.href = './radarChart/example/radarChart.html';
}
      


function cleanData(row) {
    const artist_name = row["artist(s)_name"].split(',').map(name => name.trim());

    return {
        track_name: row.track_name.trim().replace(/^['"]|['"]$/g, ''), // 去掉首尾引號
        artist_name: artist_name, // 分割成數組並去除多餘空格
        artist_count: artist_name.length, // 重新計算作者數量
        released_year: parseInt(row.released_year, 10),
        released_month: parseInt(row.released_month, 10),
        released_day: parseInt(row.released_day, 10),
        streams: parseNumeric(row.streams), // 轉成數值
        in_shazam_charts: parseNumeric(row.in_shazam_charts),
        in_deezer_charts: parseNumeric(row.in_deezer_charts),
        in_apple_charts: parseNumeric(row.in_apple_charts),
        in_apple_playlists: parseNumeric(row.in_apple_playlists),
        in_deezer_playlists: parseNumeric(row.in_deezer_playlists),
        in_spotify_charts: parseNumeric(row.in_spotify_charts),
        in_spotify_playlists: parseNumeric(row.in_spotify_playlists),
        bpm: parseNumeric(row.bpm),
        key: row.key && row.key.trim() ? row.key.trim() : "C", // 如果 key 為空，則默認為 C
        mode: row.mode, // 保留字符串
        danceability: parseNumeric(row["danceability_%"]),
        energy: parseNumeric(row["energy_%"]),
        valence: parseNumeric(row["valence_%"]),
        acousticness: parseNumeric(row["acousticness_%"]),
        instrumentalness: parseNumeric(row["instrumentalness_%"]),
        liveness: parseNumeric(row["liveness_%"]),
        speechiness: parseNumeric(row["speechiness_%"]),
    };
}

// 輔助函数：將字符串中的逗號移除並轉為數字
function parseNumeric(value) {
    if (!value || typeof value !== 'string') return 0;
    return parseFloat(value.replace(/,/g, '')) || 0;
}


