;
(function () {
    let userId = 0;
    let loggedInUserUrl = "https://fantasy.premierleague.com/drf/bootstrap-dynamic";
    let userMainUrl = "https://fantasy.premierleague.com/drf/my-team/";
    let leaguesBody = document.querySelectorAll(".live-leagues-body")[0];
    const liveLeaguesTable = document.querySelectorAll(".live-leagues-table")[0];
    const leagueUrl = "https://fantasy.premierleague.com/drf/leagues-classic-standings/";
    const classicLeagueBody = document.querySelectorAll(".live-classic-league-body")[0];
    const classicLeagueDiv = document.querySelectorAll(".classic-leagues")[0];
    const backToLeagueListBtn = document.querySelectorAll(".league-back-btn")[0];

    backToLeagueListBtn.addEventListener("click", event => {
        classicLeagueDiv.classList.add("hidden");
        liveLeaguesTable.classList.remove("hidden");
        liveLeaguesTable.classList.remove("animated");
        liveLeaguesTable.classList.remove("fadeOutDown");
    });



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

    let userPromise = requestData(loggedInUserUrl);
    userPromise.then(function (result) {
        userId = result.entry.id
        let userUrl = userMainUrl + userId;
        var userDataPromise = requestData(userUrl);

        userDataPromise.then(function (result) {
            let leagues = result.leagues.classic.map(function (league) {
                return {
                    "name": league.name,
                    "rank": league.entry_rank,
                    "id": league.id
                }
            });

            leagues.forEach(league => {
                let row = document.createElement("tr");

                for (const key in league) {
                    if (league.hasOwnProperty(key) && key !== "id") {
                        const element = league[key];
                        let cell = document.createElement("td");
                        cell.classList.add("league");
                        cell.appendChild(document.createTextNode(element));
                        row.appendChild(cell);

                        cell.addEventListener("click", function () {
                            liveLeaguesTable.classList.add('animated', 'fadeOutDown');
                            let leagueDataPromise = requestData(leagueUrl + league.id);

                            leagueDataPromise.then(function (result) {
                                let league = result.standings.results.map(function (player) {
                                    return {
                                        "name": player.player_name,
                                        "rank": player.rank,
                                        "total": player.total
                                    }
                                });
                                liveLeaguesTable.classList.add("hidden");
                                classicLeagueBody.innerHTML = "";
                                
                                league.forEach(function (player) {
                                    let row = document.createElement("tr");

                                    for (const key in player) {
                                        if (player.hasOwnProperty(key)) {
                                            const element = player[key];
                                            let cell = document.createElement("td");
                                            cell.classList.add("league-player");
                                            cell.appendChild(document.createTextNode(element));
                                            row.appendChild(cell);
                                        }
                                    }
                                    
                                    classicLeagueBody.appendChild(row);
                                    classicLeagueDiv.classList.remove("hidden");
                                })
                            })
                        })
                    }
                }

                leaguesBody.appendChild(row);

            });
        })
    })



})();