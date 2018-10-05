;
(function () {
  "use strict";
  let playerUrl = 'https://fantasy.premierleague.com/drf/element-summary/';
  let mainFplUrl = "https://fantasy.premierleague.com/drf/bootstrap-static";
  let transfersInNameTableRow = document.getElementsByClassName('transfers-in-names')[0];
  let transfersOutNameTableRow = document.getElementsByClassName('transfers-out-names')[0];
  let mostPointsPerGameDiv = document.getElementsByClassName('most-point-per-game')[0];
  let fixtureEaseScheduleDiv = document.getElementsByClassName('fixture-ease-schedule')[0];
  let teamNames = [];

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

  let getDetailedPlayerData = (id) => {
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", playerUrl + id, true);

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
    });

  }

  function getTop5(players, atrribute) {
    return players.sort((a, b) => b[atrribute] - a[atrribute]).slice(0, 5);
  }

  function getTop5ByPosition(players, atrribute, positionId) {
    let playersFromPosition = players.filter(player => {
      return player.element_type === positionId;
    })
    return playersFromPosition.sort((a, b) => b[atrribute] - a[atrribute]).slice(0, 5);
  }

  let getTopPlayer = (players, attribute) => {
    return players.slice(0, 1)[0][attribute];
  }

  function parseDetailedPlayerData() {
    return JSON.parse(this.responseText);
  }

  function getNextOppentent(data) {
    return data.fixtures_summary[0].opponent_short_name;
  }

  function isHomeGame(data) {
    return data.fixtures_summary[0].is_home;
  }

  function createExpectedPointsPlayerElement(player, p, nextOpp, isHome, position) {
    let expectedList = document.getElementsByClassName('expected-points-list-' + position)[0];
    let playerEle = document.createElement('div');
    playerEle.classList.add("bar-" + Math.round(p));
    
    let expectedPointsElement = document.createElement("span");
    expectedPointsElement.classList.add("expected-points__name");
    expectedPointsElement.appendChild(document.createTextNode(player.expected_next));
    playerEle.appendChild(expectedPointsElement);

    playerEle.appendChild(document.createElement("br"));
    playerEle.appendChild(document.createTextNode(player.name));
    

    // let text = document.createElement("span");
    // text.classList.add("text");
    // let t = document.createTextNode(player.name + " - " + player.expected_next);
    // let br = document.createElement("br");
    // let venue = isHome ? "(H)" : "(A)";
    // let n = document.createTextNode(nextOpp + " " + venue);
    // text.appendChild(t);
    // text.appendChild(br);
    // text.appendChild(n);
    // playerEle.appendChild(text);
    expectedList.appendChild(playerEle);
  }

  let parsePlayerData = (result) => {

    return result.map(player => {

      return {
        name: player.web_name,
        transfers_in_week: player.transfers_in_event,
        transfers_out_week: player.transfers_out_event,
        points_per_game: player.points_per_game,
        expected_next: player.ep_next,
        form: player.form,
        id: player.id,
        team_code: player.team_code,
        element_type: player.element_type
      }

    });
  };

  let addPlayerToExpectedPointsList = (result, player, relativeAmount, position) => {
    let nextOpp = getNextOppentent(result);
    let isHome = isHomeGame(result);
    createExpectedPointsPlayerElement(player, relativeAmount, nextOpp, isHome, position);
  };

  //   mostPointsPerGame.forEach(player => {
  //     let newTableData = document.createElement("li");
  //     let text = document.createTextNode(player.name + " - " + player.points_per_game);
  //     newTableData.appendChild(text);
  //     mostPointsPerGameDiv.appendChild(newTableData);
  // });

  function createPlayerData(name, val, p) {
    let newTableData = document.createElement("li");
    let text = document.createTextNode(val);
    var br = document.createElement("br");

    let playerSpanEle = document.createElement("span");
    let nameText = document.createTextNode(name);
    playerSpanEle.appendChild(nameText);

    newTableData.appendChild(text);
    newTableData.appendChild(br);
    newTableData.appendChild(playerSpanEle);
    newTableData.classList.add("player");


    let size = 200 * p;
    let s = size.toString() + "px";

    newTableData.style.width = s;
    newTableData.style.height = s;

    let fontSize = 3 * p;
    newTableData.style.fontSize = fontSize + 'rem';
    playerSpanEle.style.fontSize = (fontSize * 0.5) + 'rem';

    newTableData.style.color = '#fff';

    let borderSize = 4 * p;
    newTableData.style.borderWidth = borderSize + 'px';

    return newTableData;
  }

  let getHighestTransferAmount = (transfersIn, transfersOut) => {
    let mostIn = transfersIn.slice(0, 1)[0].transfers_in_week;
    let mostOut = transfersOut.slice(0, 1)[0].transfers_out_week;
    return mostOut > mostIn ? mostOut : mostIn;
  };

  let createExpectedPointsList = (data, topExpectedPoints, position) => {

    data.forEach(player => {
      let relativeAmount = (player.expected_next / topExpectedPoints) * 100;
      let promises = [];
      promises.push(getDetailedPlayerData(player.id));

      Promise.all(promises).then(function (result) {
        result.forEach(function (r) {
          addPlayerToExpectedPointsList(r, player, relativeAmount, position);
        });
      });
    });
  }
  let createTransferInList = (data, highestAbsoluteTransferAmount) => {
    data.forEach(player => {
      let percent = player.transfers_in_week / highestAbsoluteTransferAmount;
      let nameData = createPlayerData(player.name, player.transfers_in_week, percent);
      transfersInNameTableRow.appendChild(nameData);
    });
  };

  let createTransferOutList = (data, highestAbsoluteTransferAmount) => {
    data.forEach(player => {
      let percent = player.transfers_out_week / highestAbsoluteTransferAmount;
      let nameData = createPlayerData(player.name, player.transfers_out_week, percent);

      transfersOutNameTableRow.appendChild(nameData);
    });
  };

  let getOnePlayerIdFromEachTeam = (data) => {
    let arrayOfTeamCodes = [];
    let listOfPlayer = [];

    data.forEach(function (player) {
      if (arrayOfTeamCodes.indexOf(player.team_code) === -1) {

        arrayOfTeamCodes.push(player.team_code);

        listOfPlayer.push({
          id: player.id,
          team: player.team_code
        });

      }
    });
    return listOfPlayer;
  }

  let getTeamNames = () => {
    return requestData("https://fantasy.premierleague.com/drf/teams/");
  }

  let getTeamName = (id) => {

    let result = teamNames.find(function (team) {
      return team.code === id;
    }).name;

    return result;
  }

  let parseTeamNames = function (teams) {

    teamNames = teams.map(function (team) {
      return {
        code: team.code,
        name: team.name
      }
    })
  }

  let getTransferEaseSchedule = async function (data) {
    let fixtures = [];
    var teams = parseTeamNames(await getTeamNames());

    return new Promise(function (resolve, reject) {

      data.forEach(function (player) {
        let promises = [];
        promises.push(getDetailedPlayerData(player.id));

        Promise.all(promises).then(function (results) {
          results.forEach(function (result) {
            let nextFixtures = result["fixtures"].slice(0, 6);
            let f = [];
            let totalDiff = 0;
            let teamName = getTeamName(player.team);

            nextFixtures.forEach(function (fix) {
              totalDiff += fix.difficulty;

              f.push({
                oppenent: fix.opponent_name,
                difficulty: fix.difficulty,
                team: teamName
              });

            });

            let avgDifficulty = totalDiff / f.length;

            fixtures.push({
              fixtures: f,
              averageDifficulty: avgDifficulty
            });

          });
        }).then(function () {
          if (fixtures.length === 20) {
            resolve(fixtures);
          };
        });
      });
    });
  };

  let createFixtureScheduleList = (data) => {
    data = data.sort((a, b) => a.averageDifficulty - b.averageDifficulty);

    data.forEach(function (d) {
      let fixtures = d['fixtures'];
      let teamFixtures = document.createElement("li");
      teamFixtures.classList.add("team-fixtures");

      let teamNameDiv = document.createElement("div");
      teamNameDiv.classList.add("team-name");
      teamNameDiv.appendChild(document.createTextNode(fixtures[0].team));// + "  (" + d['averageDifficulty'].toFixed(3) + ")  "));

      teamFixtures.appendChild(teamNameDiv);

      fixtures.forEach(function (fixture) {
        let fix = document.createElement("div");
        fix.classList.add("fixture");
        fix.classList.add("difficulty-" + fixture.difficulty);
        fix.title = fixture.oppenent;
        teamFixtures.appendChild(fix);
      });

      fixtureEaseScheduleDiv.appendChild(teamFixtures);
    });


  }

  let playerDataPromise = requestData(mainFplUrl);

  playerDataPromise.then(function (data) {
    //player data
    let playerData = parsePlayerData(data['elements']);

    //gameweek transfers
    let top5TransfersIn = getTop5(playerData, 'transfers_in_week');
    let top5TransfersOut = getTop5(playerData, 'transfers_out_week');
    let highestAbsoluteTransferAmount = getHighestTransferAmount(top5TransfersIn, top5TransfersOut);
    createTransferInList(top5TransfersIn, highestAbsoluteTransferAmount);
    createTransferOutList(top5TransfersOut, highestAbsoluteTransferAmount);

    //Fixture ease schedule
    let playerList = getOnePlayerIdFromEachTeam(playerData);
    let fixtureEaseSchedule = getTransferEaseSchedule(playerList);
    fixtureEaseSchedule.then(function (result) {
      createFixtureScheduleList(result);
    });

    //Points per game
    let top5PointsPerGame = getTop5(playerData, 'points_per_game');

    //Expected Points
    let postions = requestData("https://fantasy.premierleague.com/drf/element-types/");
    postions.then(function (result) {
      result.forEach(function (position) {
        let top5 = getTop5ByPosition(playerData, 'expected_next', position.id);
        createExpectedPointsList(top5, top5[0].expected_next, position.plural_name_short);
      });
    });



  });

})();