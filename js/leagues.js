;
(function () {
    let userId = 0;
    let loggedInUserUrl = "https://fantasy.premierleague.com/drf/bootstrap-dynamic";
    let userMainUrl = "https://fantasy.premierleague.com/drf/my-team/";
    let liveDataUrl = "https://fantasy.premierleague.com/drf/event/";
    let leaguesBody = document.querySelectorAll(".live-leagues-body")[0];
    const latestPicksBaseUrl = "https://fantasy.premierleague.com/drf/entry/";
    const liveLeaguesTable = document.querySelectorAll(".live-leagues-table")[0];
    const leagueUrl = "https://fantasy.premierleague.com/drf/leagues-classic-standings/";
    const classicLeagueBody = document.querySelectorAll(".live-classic-league-body")[0];
    const classicLeagueDiv = document.querySelectorAll(".classic-leagues")[0];
    const backToLeagueListBtn = document.querySelectorAll(".league-back-btn")[0];
    const leagesDiv = document.querySelectorAll(".live-leagues")[0];
    const leagueName = document.querySelectorAll(".league-name")[0];
    let livePlayerData = {};

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
    userPromise.then(async function (result) {
        if (result.entry === null) {
            leagesDiv.appendChild(document.createTextNode("YOU MUST BE LOGGED IN ON THE MAIN FPL SITE TO VIEW LIVE LEAGUE DATA"));
            return;
        }

        let currentGameweek = result.entry.current_event;


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

                        cell.addEventListener("click", openMiniLeagueTable.bind(this, league, currentGameweek))
                    }
                }

                leaguesBody.appendChild(row);

            });
        })
    });

    async function openMiniLeagueTable(league, currentGameweek) {
        let leagueDataPromise = requestData(leagueUrl + league.id);
        liveLeaguesTable.classList.add('animated', 'fadeOutDown');
        

        leagueDataPromise.then(function (result) {
            leagueName.innerHTML = "";
            leagueName.appendChild(document.createTextNode(result.league.name));
            livePlayerData = (await getLiveData(currentGameweek)).elements;
            
            let league = result.standings.results.map(function (player) {
                return {
                    "name": player.entry_name,
                    "rank": player.rank,
                    "total": player.total,
                    "entry_id": player.entry,
                    "gameweek_points": player.event_total
                }
            });

            liveLeaguesTable.classList.add("hidden");
            classicLeagueBody.innerHTML = "";
            let latestPicksPromises = [];
            let leaguePlayers = [];

            league.forEach(function (player) {
                latestPicksPromises.push(requestData(latestPicksBaseUrl + "/" + player.entry_id + "/event/" + currentGameweek + "/picks"));
                leaguePlayers.push(player);
            })

            Promise.all(latestPicksPromises).then(function (players) {
                players.forEach(function (result, index) {
                    let currPlayer = leaguePlayers[index];
                    let currentGameweekPoints = currPlayer.gameweek_points;
                    let playerPicks = result.picks;
                    let latestPlayerPoints = 0;
                    playerPicks.forEach(function (pick) {
                        if (result.active_chip === "bboost" || pick.position <= 11) {
                            let playerElementId = pick.element;
                            let totalPlayerPoints = livePlayerData[playerElementId].stats.total_points * pick.multiplier;
                            latestPlayerPoints += totalPlayerPoints;
                        }
                    });

                    let addedPoints = 0;

                    if(latestPlayerPoints >= 0 && currentGameweekPoints >= 0) {
                        addedPoints = latestPlayerPoints - currentGameweekPoints;
                    } else {
                        addedPoints -= (Math.abs(latestPlayerPoints) + Math.abs(currentGameweekPoints));
                    }

                    if (currentGameweekPoints !== latestPlayerPoints) {
                        currPlayer.gameweek_points += addedPoints;
                    }
                    
                    currPlayer.chip = result.active_chip;
                    currPlayer.total += addedPoints;
                    leaguePlayers[index] = currPlayer;
                })

                leaguePlayers.sort((a, b) => b.total - a.total);

                classicLeagueBody.innerHTML = "";
                leaguePlayers.forEach(function (player) {
                    let row = document.createElement("tr");
                    for (const key in player) {
                        if (player.hasOwnProperty(key) && key != "entry_id") {
                            const element = player[key];
                            let cell = document.createElement("td");
                            cell.classList.add("league-player");
                            cell.appendChild(document.createTextNode(element));
                            row.appendChild(cell);
                        }
                    }
                    classicLeagueBody.appendChild(row);
                    classicLeagueDiv.classList.remove("hidden");
                });

            })


        })
    }

    let getLiveData = function (currGameweek) {
        return requestData(liveDataUrl + currGameweek + "/live");
    };



})();