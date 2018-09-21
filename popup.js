
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

getPlayerData(parsePlayerData);

function parsePlayerData() {
  let result = JSON.parse(this.responseText);
  let playersData = result['elements'];

  let players = playersData.map(player => {

      return {
        name: player.web_name,
        transfers_in_week: player.transfers_in_event
      }

  });

  let sortedByMostTransfersIn = players.sort((a,b) => b.transfers_in_week - a.transfers_in_week ).slice(0,5);
  let transfersInNameTableRow = document.getElementsByClassName('transfers-in-names')[0];
  let transfersInAmountTableRow = document.getElementsByClassName('transfers-in-amount')[0];

  sortedByMostTransfersIn.forEach(player => {
      let nameData = createTableData(player.name);
      transfersInNameTableRow.appendChild(nameData);

      let amount = createTableData(player.transfers_in_week);
      transfersInAmountTableRow.appendChild(amount);
  });
}


function createTableData(val) {
  let newTableData = document.createElement("td");
  let text = document.createTextNode(val);
  newTableData.appendChild(text);

  return newTableData;
}

