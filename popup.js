;
(function () {
  "use strict";
  let playerUrl = 'https://fantasy.premierleague.com/drf/element-summary/';
  let mainFplUrl = "https://fantasy.premierleague.com/drf/bootstrap-static";
  let transfersInNameTableRow = document.getElementsByClassName('transfers-in-names')[0];
  let transfersOutNameTableRow = document.getElementsByClassName('transfers-out-names')[0];
  let mostPointsPerGameDiv = document.getElementsByClassName('most-point-per-game')[0];

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

  function createExpectedPointsPlayerElement(player, p, nextOpp, isHome) {
    let expectedList = document.getElementsByClassName('expected-points-list')[0];
    let playerEle = document.createElement('dd');
    playerEle.classList.add("percentage");
    playerEle.classList.add("percentage-" + Math.round(p));

    let text = document.createElement("span");
    text.classList.add("text");
    let t = document.createTextNode(player.name + " - " + player.expected_next);
    let br = document.createElement("br");
    let venue = isHome ? "(H)" : "(A)";
    let n = document.createTextNode(nextOpp + " " + venue);
    text.appendChild(t);
    text.appendChild(br);
    text.appendChild(n);
    playerEle.appendChild(text);
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
        id: player.id
      }

    });
  };

  let addPlayerToExpectedPointsList = (result, player, relativeAmount) => {
    let nextOpp = getNextOppentent(result);
    let isHome = isHomeGame(result);
    createExpectedPointsPlayerElement(player, relativeAmount, nextOpp, isHome);
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

  let createExpectedPointsList = (data, topExpectedPoints) => {
    console.log(topExpectedPoints)
    data.forEach(player => {
      let relativeAmount = (player.expected_next / topExpectedPoints) * 100;
      let playerDataPromise = getDetailedPlayerData(player.id);
      playerDataPromise.then(function (data) {
        
        addPlayerToExpectedPointsList(data, player, relativeAmount);
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

  let playerDataPromise = requestData(mainFplUrl);

  playerDataPromise.then(function (data) {
    let playerData = parsePlayerData(data['elements']);
    let top5TransfersIn = getTop5(playerData, 'transfers_in_week');
    let top5TransfersOut = getTop5(playerData, 'transfers_out_week');
    let top5PointsPerGame = getTop5(playerData, 'points_per_game');
    let top5HighestExpectedPoints = getTop5(playerData, 'expected_next');
    let topExpectedPoints = getTopPlayer(top5HighestExpectedPoints, 'expected_next');
    let highestAbsoluteTransferAmount = getHighestTransferAmount(top5TransfersIn, top5TransfersOut);

    createExpectedPointsList(top5HighestExpectedPoints, topExpectedPoints);
    createTransferInList(top5TransfersIn, highestAbsoluteTransferAmount);
    createTransferOutList(top5TransfersOut, highestAbsoluteTransferAmount);
  });

})();