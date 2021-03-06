;
(function () {
    let userId = 0;
    let loggedInUserUrl = "https://fantasy.premierleague.com/drf/bootstrap-dynamic";
    let userMainUrl = "https://fantasy.premierleague.com/drf/my-team/";
    let liveDataUrl = "https://fantasy.premierleague.com/drf/event/";
    let playerHistoryUrl = "https://fantasy.premierleague.com/drf/entry/";
    let leaguesBody = document.querySelectorAll(".live-leagues-body")[0];
    const latestPicksBaseUrl = "https://fantasy.premierleague.com/drf/entry/";
    const liveLeaguesTable = document.querySelectorAll(".live-leagues-table")[0];
    const leagueUrl = "https://fantasy.premierleague.com/drf/leagues-classic-standings/";
    const classicLeagueBody = document.querySelectorAll(".live-classic-league-body")[0];
    const classicLeagueDiv = document.querySelectorAll(".classic-leagues")[0];
    const backToLeagueListBtn = document.querySelectorAll(".league-back-btn")[0];
    const leagesDiv = document.querySelectorAll(".live-leagues")[0];
    const leagueName = document.querySelectorAll(".league-name")[0];
    const refreshLeagueBtn = document.querySelectorAll(".classic-league__btn")[0];
    let currentMiniLeagueView = null;
    let currGameweek = 0;

    backToLeagueListBtn.addEventListener("click", event => {
        currentGameweek = 0;
        currentMiniLeagueView = null;
        classicLeagueDiv.classList.add("hidden");
        liveLeaguesTable.classList.remove("hidden");
        liveLeaguesTable.classList.remove("animated");
        liveLeaguesTable.classList.remove("fadeOutDown");
    });

    refreshLeagueBtn.addEventListener("click", event => {
        classicLeagueDiv.classList.add('animated', 'rotateOut');
        openMiniLeagueTable(currentMiniLeagueView, currGameweek);
    })

    let requestData = (Url) => {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", Url, true);

            xhr.onload = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        if(xhr.status === 429) {
                            alert("Seems like someone is a bit eager... Your rate limit has been reached, please wait a few seconds and click refresh!");
                        }
                        console.log(xhr);
                        reject(Error(xhr.statusText));
                    }
                }
            };

            xhr.onerror = function(error) {
                reject(Error("Network Error"));
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

        currGameweek = result.entry.current_event;


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

                        cell.addEventListener("click", openMiniLeagueTable.bind(this, league, currGameweek))
                    }
                }

                leaguesBody.appendChild(row);

            });
        })
    });

    async function openMiniLeagueTable(league, currentGameweek) {
        currentMiniLeagueView = league;
        currGameweek = currentGameweek;
        let leagueDataPromise = requestData(leagueUrl + league.id);
        liveLeaguesTable.classList.add('animated', 'fadeOutDown');


        leagueDataPromise.then(async function (result) {
            
            leagueName.innerHTML = "";
            leagueName.appendChild(document.createTextNode(result.league.name));
            let liveData = await getLiveData(currentGameweek);
            let livePlayerData = liveData.elements;
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
            let previousGameweekPromises = [];
            let leaguePlayers = [];

            league.forEach(function (player) {
                latestPicksPromises.push(requestData(latestPicksBaseUrl + "/" + player.entry_id + "/event/" + currentGameweek + "/picks"));
                leaguePlayers.push(player);
                previousGameweekPromises.push(requestData(playerHistoryUrl + player.entry_id + "/history"));
            });

            Promise.all(latestPicksPromises).then(function (players) {

                players.forEach(function (result, index) {
                    let currPlayer = leaguePlayers[index];
                    let playerPicks = result.picks;
                    let latestPlayerPoints = 0;
                    currPlayer.gameweek_transfers = result.entry_history.event_transfers;
                    currPlayer.transfer_cost = 0 - result.entry_history.event_transfers_cost;
                    currPlayer.team_value = (result.entry_history.value - result.entry_history.bank ) / 10 ;
                    currPlayer.money_bank = result.entry_history.bank / 10;

                    playerPicks.forEach(function (pick) {
                        if (result.active_chip === "bboost" || pick.position <= 11) {
                            let playerElementId = pick.element;
                            let totalPlayerPoints = livePlayerData[playerElementId].stats.total_points * pick.multiplier;
                            latestPlayerPoints += totalPlayerPoints;
                        }
                        if (pick.multiplier > 1) {

                            let captain = window.playerData.find(function (player) {
                                return player.id === pick.element;
                            });
                            currPlayer.captain = captain.name;
                        }

                    });
                    currPlayer.chip = result.active_chip;
                    currPlayer.gameweek_points = latestPlayerPoints - result.entry_history.event_transfers_cost;
                    leaguePlayers[index] = currPlayer;
                });

                Promise.all(previousGameweekPromises).then(function (result) {

                    result.forEach(function (player) {
                        let playerId = player.entry.id;

                        let totalPointsLastWeek = player.history.find(function (gameweek) {
                            return gameweek.event === currentGameweek - 1;
                        }).total_points;

                        let p = leaguePlayers.find(function (p) {
                            return p.entry_id === playerId;
                        });

                        p.total = totalPointsLastWeek + p.gameweek_points;
                    });

                    leaguePlayers.sort((a, b) => b.total - a.total);

                    classicLeagueBody.innerHTML = "";
                    let previousRank = 0;
                    let previousPoints = 0;

                    leaguePlayers.forEach(function (player, index) {

                        if (previousPoints === player.total) {
                            player.rank = previousRank;
                        } else {
                            previousRank = index + 1;
                            player.rank = previousRank;
                        }
                        previousPoints = player.total;

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
                        classicLeagueDiv.classList.remove('animated', 'rotateOut');
                        classicLeagueDiv.classList.remove("hidden");
                    });

                })



            })


        })
    }

    let getLiveData = function (currGameweek) {
        return requestData(liveDataUrl + currGameweek + "/live");
    };

})();