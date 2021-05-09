async function getText() {
  let x = await fetch("http://localhost:8000/simulatedTrades");
  let y = await x.json();
  addHistory(y)
}

function addHistory(data) {
  var table = document.getElementById("history")
  //for each param
  data.forEach((d) => {
    //for each trade history item in that param
    d.Data.forEach((s, i) => {
      let row = table.insertRow()
      row.insertCell().innerHTML = parseInt(JSON.stringify(i)) + 1

      let param = row.insertCell()
      param.innerHTML = d.DataLabel
      param.style.color = "white"

      for (const [key, value] of Object.entries(s)) {
        row.insertCell().innerHTML = value
        row.style.color = "white"
      }
    })
    
  })
}

getText()