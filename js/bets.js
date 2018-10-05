;
(function () {
    let url = "https://spreadsheets.google.com/feeds/list/1CTTIBS2F54OQZm3Chf3i-0Kz8f0Nq6w6qIkag2eihjc/1/public/values?alt=json";
    let val = "$t";
    const betTableBody = document.getElementsByClassName("upcoming-game-odds")[0];

    let requestData = (Url) => {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", Url, true);

            xhr.onload = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(Error(xhr.statusText));
                    }
                }
            };
            xhr.send(null);
        })
    };
    let upcomingGames = {};

    let betDataPromise = requestData(url);
    betDataPromise.then(function (data) {
        data.feed.entry.forEach(element => {
            if (element.gsx$status.$t === 'Pending') {
                if (!upcomingGames[element.gsx$eventname.$t]) {
                    upcomingGames[element.gsx$eventname.$t] = {
                        "date": element.gsx$commence.$t,
                        "homeTeam": "",
                        "homeOdds": Math.round((1 / Number(element.gsx$odd2.$t)) * 100) + "%",
                        "awayTeam": "",
                        "awayOdds": Math.round( (1 / element.gsx$odd1.$t) * 100) + "%",          
                    }
                }

            }


        });
        
        let upcomingGamesArray = []
        for (const key in upcomingGames) {
            if (upcomingGames.hasOwnProperty(key)) {
                const element = upcomingGames[key];
                let teams = key.split("_");
                element.homeTeam = teams[1];
                element.awayTeam = teams[0];
                upcomingGamesArray.push(element);
            }
        }

        function displayGameAndOdds(games) {
            games.forEach(function (game) {
                let row = document.createElement("tr");

                for (const key in game) {
                    if (game.hasOwnProperty(key)) {
                        const element = game[key];
                        let cell = document.createElement("td");
                        cell.classList.add("match-bet");
                        cell.appendChild(document.createTextNode(element));
                        row.appendChild(cell);
                    }
                }

                betTableBody.appendChild(row);
            })
        }

        displayGameAndOdds(upcomingGamesArray);

    })

})();