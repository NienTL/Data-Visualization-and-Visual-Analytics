
let in_spotify_playlists_min = 1e5;
let in_spotify_playlists_max = 0;
let in_deezer_playlists_min = 1e5;
let in_deezer_playlists_max = 0;
let in_apple_playlists_min = 1e5;
let in_apple_playlists_max = 0;
let artistList = {};
let words = [];
const getMinList = () => ({
    spotify: in_spotify_playlists_min,
    apple: in_apple_playlists_min,
    deezer: in_deezer_playlists_min,
});

const getMaxList = () => ({
    spotify: in_spotify_playlists_max,
    apple: in_apple_playlists_max,
    deezer: in_deezer_playlists_max,
});

d3.csv("./spotify-2023.csv")
    .then(function (data) {
        data.forEach((row, idx) => {
            const cleanedRow = cleanData(row);
            data[idx] = cleanedRow;
            // 处理每首歌的艺术家和播放清单数据
            cleanedRow.artist_name.forEach(artist => {
                // 如果 `artistList` 中没有该艺术家，初始化
                if (!artistList[artist]) {
                    artistList[artist] = {
                        spotify: 0,
                        apple: 0,
                        deezer: 0,
                    };
                }

                // 累加播放清单数量
                artistList[artist].spotify += cleanedRow.in_spotify_playlists;
                artistList[artist].apple += cleanedRow.in_apple_playlists;
                artistList[artist].deezer += cleanedRow.in_deezer_playlists;

                in_spotify_playlists_min = Math.min(in_spotify_playlists_min, artistList[artist].spotify);
                in_spotify_playlists_max = Math.max(in_spotify_playlists_max, artistList[artist].spotify);
                in_deezer_playlists_min = Math.min(in_deezer_playlists_min, artistList[artist].deezer);
                in_deezer_playlists_max = Math.max(in_deezer_playlists_max, artistList[artist].deezer);
                in_apple_playlists_min = Math.min(in_apple_playlists_min, artistList[artist].apple);
                in_apple_playlists_max = Math.max(in_apple_playlists_max, artistList[artist].apple);
            });
        })


        // Create a scale to map word sizes to font sizes
        let sizeScale = d3.scaleLinear()
            .domain([in_spotify_playlists_min, in_spotify_playlists_max]) // Adjust based on your data's size range
            .range([10, 50]); // Adjust font size range

        Object.keys(artistList).forEach(key => {
            words.push({
                text: key,
                size: sizeScale(artistList[key].spotify)
            })
        });

        words = words.sort(function(a, b) { return (b.size - a.size);}).slice(0, 20);// 取前20名

        const selectElement = document.getElementById("platform");
        selectElement.addEventListener("change", (event) => {
            const selectedValue = event.target.value;
            
            words = [];

            d3.select('#wordCloud').selectAll('*').remove();
            const minList = getMinList();
            const maxList = getMaxList();

            // Create a scale to map word sizes to font sizes
            sizeScale = d3.scaleLinear()
                .domain([minList[selectedValue], maxList[selectedValue]]) // Adjust based on your data's size range
                .range([10, 50]); // Adjust font size range

            Object.keys(artistList).forEach(key => {
                words.push({
                    text: key,
                    size: sizeScale(artistList[key][selectedValue])
                })
            });

            words = words.sort(function(a, b) { return (b.size - a.size);}).slice(0, 20);// 取前20名
            wordCloud('#wordCloud').update(words);
        });         


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

        // Encapsulate the word cloud functionality
        function wordCloud(selector) {
            
            var fill = d3.scaleOrdinal(d3.schemeCategory10);

            //Construct the word cloud's SVG element
            var svg = d3.select(selector).append("svg")
                .attr("width", 1100)
                .attr("height", 600)
                .append("g")
                .attr("transform", "translate(580,250)");


            //Draw the word cloud
            function draw(words) {
                var cloud = svg.selectAll("g text")
                                .data(words, function(d) { return d.text; })

                cloud.enter()
                    .append("text") // 先 append 元素
                    .style("font-family", "Impact")
                    .style("fill", function(d, i) { return fill(i); })
                    .attr("text-anchor", "middle")
                    .attr('font-size', 1) // 初始字體大小設置為 1，便於動畫
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) { return d.text; })
                    .transition() // 然後調用 transition
                    .duration(600) // 設置動畫時長
                    .attr("font-size", function(d) { return d.size + "px"; }); // 動畫改變字體大小
            }


            //Use the module pattern to encapsulate the visualisation code. We'll
            // expose only the parts that need to be public.
            return {

                //Recompute the word cloud for a new set of words. This method will
                // asycnhronously call draw when the layout has been computed.
                //The outside world will need to call this function, so make it part
                // of the wordCloud return value.
                update: function(words) {
                    d3.layout.cloud().size([1000, 500])
                        .words(words)
                        .padding(5)
                        .rotate(function() { return ~~(Math.random() * 2) * 90; })
                        .font("Impact")
                        .fontSize(function(d) { return d.size; })
                        .on("end", draw)
                        .start();
                }
            }
        }

        // Create a new instance of the word cloud visualization
        wordCloud('#wordCloud').update(words);

    })
    .catch(function (err) {
        console.error(err);
});


