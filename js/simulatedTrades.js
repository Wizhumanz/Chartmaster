async function getText() {
  let x = await fetch("http://localhost:8000/simulatedTrades");
  let y = await x.json();
  addHistory(y)
}

function addHistory(data) {
  var table = document.getElementById("history")
  data.forEach((d) => {
    d.Data.forEach((s) => {
      let row = table.insertRow()

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