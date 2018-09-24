;(function() {


})();

let playerUrl = 'https://fantasy.premierleague.com/drf/element-summary/';

function getPlayerData(callback) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "https://fantasy.premierleague.com/drf/bootstrap-static", true);

  xhr.onload = function() {
    if (xhr.readyState === 4) {
        if (xhr.status === 200) {
            callback.apply(xhr);
        } else {
            console.error(xhr.statusText);
        }
    }
  };
  xhr.send(null);
}

function getDetailedPlayerData(id) {
  return new Promise(function(resolve, reject) {

    let xhr = new XMLHttpRequest();
    xhr.open("GET", playerUrl + id, true);

    xhr.onload = function() {
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
getPlayerData(parsePlayerData);

function getTop5(players, atrribute) {
  return players.sort((a,b) => b[atrribute] - a[atrribute] ).slice(0,5);
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

function addPlayerToExpectedPointsList(player,p , nextOpp, isHome) {
  let expectedList = document.getElementsByClassName('expected-points-list')[0];
  let playerEle = document.createElement('dd');
  playerEle.classList.add("percentage");
  playerEle.classList.add("percentage-" +  Math.round(p));
   
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

function parsePlayerData() {
  let result = JSON.parse(this.responseText);
  let playersData = result['elements'];

  let players = playersData.map(player => {

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

  let sortedByMostTransfersIn = players.sort((a,b) => b.transfers_in_week - a.transfers_in_week ).slice(0,5);
  let sortedByMostTransfersOut = players.sort((a,b) => b.transfers_out_week - a.transfers_out_week ).slice(0,5);
  let mostPointsPerGame = players.sort((a,b) => b.points_per_game - a.points_per_game ).slice(0,5);
  let top5PlayersHighestExpectedPoints = getTop5(players, 'expected_next');
  let topExpectedPoints = top5PlayersHighestExpectedPoints.slice(0, 1)[0].expected_next;

  top5PlayersHighestExpectedPoints.forEach(player => {
    let p = (player.expected_next / topExpectedPoints) * 100;
    console.log(p, topExpectedPoints)
    let playerDataPromise = getDetailedPlayerData(player.id);
    playerDataPromise.then(function(playerData) {
      let nextOpp = getNextOppentent(playerData);
      let isHome = isHomeGame(playerData);
      addPlayerToExpectedPointsList(player,p, nextOpp, isHome);
    });
  });




  let transfersInNameTableRow = document.getElementsByClassName('transfers-in-names')[0];
  let transfersOutNameTableRow = document.getElementsByClassName('transfers-out-names')[0];
  let mostPointsPerGameDiv = document.getElementsByClassName('most-point-per-game')[0];

  let highestAmount = sortedByMostTransfersOut.slice(0, 1)[0].transfers_out_week > sortedByMostTransfersIn.slice(0,1)[0].transfers_in_week ? sortedByMostTransfersOut.slice(0, 1)[0].transfers_out_week : sortedByMostTransfersIn.slice(0,1)[0].transfers_in_week;

    sortedByMostTransfersIn.forEach(player => {
      let percent = player.transfers_in_week / highestAmount;

        let nameData = createPlayerData(player.name, player.transfers_in_week, percent);
        transfersInNameTableRow.appendChild(nameData);
    });

    sortedByMostTransfersOut.forEach(player => {
      let percent = player.transfers_out_week / highestAmount;
      let nameData = createPlayerData(player.name, player.transfers_out_week, percent);

      transfersOutNameTableRow.appendChild(nameData);
      
  });

//   mostPointsPerGame.forEach(player => {
//     let newTableData = document.createElement("li");
//     let text = document.createTextNode(player.name + " - " + player.points_per_game);
//     newTableData.appendChild(text);
//     mostPointsPerGameDiv.appendChild(newTableData);
// });
}

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

