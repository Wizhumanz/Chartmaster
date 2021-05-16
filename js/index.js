
let baseURL = "http://localhost:8000"
let wsStatus = document.getElementById("wsStatus")

// Get parameters from a URL string
console.log(getParams(window.location.href).user)
let userID = getParams(window.location.href).user
// Simulated Trades index
let indexST = 1

// Disable btns initially
document.getElementById("panCandlesLeftBtn").style.display = "none"
document.getElementById("panCandlesRightBtn").style.display = "none"

/// CANDLESTICKS
let candleDisplayNumber = 170
let candleDrawStartIndex = 0
let candleDrawEndIndex = candleDisplayNumber
let allCandles = [] // all individual candles
let allProfitCurve = [] // all individual profits
let allSimTrades = [] // all individual trades

let wholeStartTime = getPickerDateTime("startDateTimePicker")
let wholeEndTime = getPickerDateTime("endDateTimePicker")
let newCandlesToFetch = 80 //used by obsolete getMoreData() 

let xAxisDateExisting
var dateFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S");
const margin = { top: 30, right: 20, bottom: 205, left: 70 },
  w = 1050,
  h = 680;
let existingWSResID
let existingWSResIDPC
let existingWSResIDST


const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }

function loadResult() {
  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }
  axios
    .get(baseURL + "/backtestHistory?user=" + userID, {
      headers: hd,
      // mode: "cors",
    })
    .then((res) => {
      res.data.forEach((l) => {
        // get reference to select element
        let sel = document.getElementById('resSelect');
        // create new option element
        let opt = document.createElement('option');
        // create text node to add to option element (opt)
        opt.appendChild(document.createTextNode(l));
        // set value property of opt
        opt.value = l.split(".")[0];
        // add opt to end of select box (sel)
        sel.appendChild(opt);
      })
    })
    .catch((error) => {
      console.log(error);
    });
}

loadResult()

function connectWs() {
  wsStatus.innerText = "Loading websockets..."
  var socket
  try {
    socket = new WebSocket("ws://localhost:8000/ws-cm/" + userID);
  } catch (err) {
    console.log(err);
  }

  if (socket) {
    socket.onopen = () => {
      socket.send("Client connected");
      wsStatus.innerText = "OK"
      wsStatus.className = "connected"
    };

    socket.onclose = (event) => {
      wsStatus.innerText = "Offline"
      wsStatus.className = "disconnected"
      console.log("Socket CLOSED Connection: ", event);
    };

    socket.onerror = (error) => {
      wsStatus.innerText = "Offline"
      wsStatus.className = "disconnected"
      console.log("Socket Error: ", error);
    };

    socket.onmessage = (msg) => {
      if (!(msg.data.includes("\"") || msg.data.includes("{") || msg.data.includes("}"))) {
        return
      }
      
      //candlestick
      if (JSON.parse(msg.data) != undefined && parseFloat(JSON.parse(msg.data).Data[0].Open) > 0) {
        //check if concat needed, or new data
        if (existingWSResID === "" || existingWSResID !== JSON.parse(msg.data).ResultID) {
          allCandles = JSON.parse(msg.data).Data
          //if candlestick chart empty
          drawChart(0, candleDisplayNumber)
          //show right arrow btn
          document.getElementById("panCandlesRightBtn").style.display = "inline"

          //save res id so next messages with same ID will be concatenated with existing data
          existingWSResID = JSON.parse(msg.data).ResultID
        } else {
          //add new data to existing array
          JSON.parse(msg.data).Data.forEach(newData => {
            allCandles.push(newData)
          })
          drawChart(0, candleDisplayNumber)
        }
      }

      //profit curve
      if (JSON.parse(msg.data) != undefined && parseFloat(JSON.parse(msg.data).Data[0].Data[0].Equity) > 0) {
        //check if concat needed, or new data
        if (existingWSResIDPC === "" || existingWSResIDPC !== JSON.parse(msg.data).ResultID) {
          allProfitCurve = JSON.parse(msg.data).Data
          //if candlestick chart empty
          drawPC(allProfitCurve)
          //save res id so next messages with same ID will be concatenated with existing data
          existingWSResIDPC = JSON.parse(msg.data).ResultID
        } else {
          //add new data to existing array
          allProfitCurve[0].Data = allProfitCurve[0].Data.concat(JSON.parse(msg.data).Data[0].Data)
          drawPC(allProfitCurve)
        }
      }

      //sim trades
      if (JSON.parse(msg.data) != undefined && parseFloat(JSON.parse(msg.data).Data[0].Data[0].EntryPrice) > 0) {
        if (existingWSResIDST === "" || existingWSResIDST !== JSON.parse(msg.data).ResultID) {
          allSimTrades = JSON.parse(msg.data).Data
          //if candlestick chart empty
          plotHistory(JSON.parse(msg.data).Data)

          //save res id so next messages with same ID will be concatenated with existing data
          existingWSResIDST = JSON.parse(msg.data).ResultID
        } else {
          //add new data to existing array
          indexST = 1
          allSimTrades[0].Data = allSimTrades[0].Data.concat(JSON.parse(msg.data).Data[0].Data)
          plotHistory(allSimTrades)
        }
      }

    };
  }
}
connectWs()

let riskInput
let leverageInput
let sizeInput
getInputValues() 

function computeBacktest() {
  let ticker = document.getElementById("tickerSelect").value
  let period = document.getElementById("periodSelect").value
  let startTimeStr = new Date(Math.abs((new Date(getPickerDateTime("startDateTimePicker")))) + getLocalTimezone()).toISOString().split(".")[0]
  let endTimeStr = new Date(Math.abs((new Date(getPickerDateTime("endDateTimePicker")))) + getLocalTimezone()).toISOString().split(".")[0]

  allCandles = [] // all individual candles
  displayCandlesChunks = [] // chunks of candles for display

  let backendInfo = {
    "ticker": ticker,
    "period": period,
    "time_start": startTimeStr,
    "time_end": endTimeStr,
    "candlePacketSize": "80",
    "user": userID,
    "risk" : riskInput, 
    "leverage": leverageInput, 
    "size" : sizeInput
  }

  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }
  axios
    .post(baseURL + "/backtest", backendInfo, {
      headers: hd,
      // mode: "cors",
    })
    .catch((error) => {
      console.log(error);
    });
}

function getInputValues() {
  const risk = document.getElementById('risk');
  const leverage = document.getElementById('leverage');
  const size = document.getElementById('size');

  risk.addEventListener('input', riskFunc);
  leverage.addEventListener('input', leverageFunc);
  size.addEventListener('input', sizeFunc);

  function riskFunc(e) {
    riskInput = e.target.value;
    console.log(riskInput)
  }
  function leverageFunc(e) {
    leverageInput = e.target.value;
    console.log(leverageInput)
  }
  function sizeFunc(e) {
    sizeInput = e.target.value;
    console.log(sizeInput)
  }
}

function getExchanges() {
  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }
  axios
    .get(baseURL + "/getChartmasterTickers", {
      headers: hd,
      // mode: "cors",
    })
    .then((res) => {
      //sort alphabetically
      res.data.sort(function (a, b) {
        if (a.symbol_id_exchange < b.symbol_id_exchange) { return -1; }
        if (a.symbol_id_exchange > b.symbol_id_exchange) { return 1; }
        return 0;
      })
      //fill ticker select with all options
      tickerSelect = document.getElementById("tickerSelect");
      res.data.forEach(t => {
        tickerSelect.options[tickerSelect.options.length] = new Option(
          t.symbol_id_exchange + "  (" + t.symbol_id + ")",
          t.symbol_id);
      })
      //default val
      tickerSelect.value = "BINANCEFTS_PERP_BTC_USDT"
    })
    .catch((error) => {
      console.log(error);
    });
}
getExchanges()

function loadBacktestRes() {
  var s = document.getElementById("resSelect")
  var selectedRes = s.value
  let getURL = baseURL + `/backtestHistory/${selectedRes}?user=` + userID + "&candlePacketSize=100"

  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }
  axios
    .get(getURL, {
      headers: hd,
      // mode: "cors",
    })
    .then((res) => {
      let gay = res.data.ModifiedCandlesticks
      console.log(gay)
    })
    .catch((error) => {
      console.log(error);
    });
}

function drawChart(start, end) {
  // console.log(start + " - " + end)
  let candlesToShow = allCandles.slice(start, end)
  // console.log(candlesToShow)
  if (!candlesToShow || candlesToShow.length == 0) {
    return
  }

  //reset chart
  d3.selectAll("#container > *").remove();

  candlesToShow.forEach(c => {
    if (c.DateTime === "") {
      console.log(c)
    }
  })

  // candlesToShow.forEach(c => {
    // console.log("BEFORE " + typeof(c.DateTime))
    // if (c.DateTime === "") {
    //   console.log(c)
    // }
  // })

  //build datetime array
  let dateTimes = []
  for (var i = 0; i < candlesToShow.length; i++) {
    // console.log(candlesToShow[i].DateTime)

    if (candlesToShow[i].DateTime === "") {
      console.log(candlesToShow[i])
    } else {
      let add = new Date(candlesToShow[i].DateTime) //sometimes causes null data
      dateTimes.push(add)
      if (add === null) {
        console.log(candlesToShow[i])
      } 
      candlesToShow[i].DateTime = add
    }
  }

  // candlesToShow.forEach(c => {
  //   console.log("AFTER " +typeof(c.DateTime))
  // })

  var svg = d3.select("#container")
    // .attr("width", "100%")
    // .attr("height", "110%")
    // .attr("padding-bottom", "3rem")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 1200 1200")
    .classed("svg-content", true)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var xmin = d3.min(dateTimes);
  var xmax = d3.max(dateTimes);
  var xScale = d3.scaleLinear().domain([-1, dateTimes.length])
    .range([0, w])
  var xDateScale = d3.scaleQuantize().domain([0, dateTimes.length]).range(dateTimes)
  let xBand = d3.scaleBand().domain(d3.range(-1, dateTimes.length)).range([0, w]).padding(0.3)
  var xAxis = d3.axisBottom()
    .scale(xScale)
    // .attr("font-size", "5px")
    .tickFormat(function (d) {
      return processXAxisLabel(d, dateTimes)
    });

  svg.append("rect")
    .attr("id", "rect")
    .attr("width", w)
    .attr("height", h)
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr("clip-path", "url(#clip)")

  var gX = svg.append("g")
    .attr("class", "axis x-axis") //Assign "axis" class
    .attr("transform", "translate(0," + h + ")")
    .call(xAxis)

  gX.selectAll(".tick text")
    .call(wrap, xBand.bandwidth())

  var ymin = d3.min(candlesToShow.map(r => r.Low));
  var ymax = d3.max(candlesToShow.map(r => r.High));
  var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
  var yAxis = d3.axisLeft()
    .scale(yScale)

  var gY = svg.append("g")
    .attr("class", "axis y-axis")
    .call(yAxis);

  var chartBody = svg.append("g")
    .attr("class", "chartBody")
    .attr("clip-path", "url(#clip)");

  // draw rectangles
  let candles = chartBody.selectAll(".candle")
    .data(candlesToShow)
    .enter()
    .append("rect")
    .attr('x', (d, i) => xScale(i) - xBand.bandwidth())
    .attr("class", "candle")
    .attr('y', d => yScale(Math.max(d.Open, d.Close)))
    .attr('width', xBand.bandwidth())
    .attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)))
    .attr("fill", d => (d.Open === d.Close) ? "silver" : (d.Open > d.Close) ? "red" : "darkgreen")

  //creating a horizontal line to show when strategy is in trade-----------
  // shapes.append("rect")
  //   .attr("x", 200)
  //   .attr("y", 620)
  //   .attr("width", 5000)
  //   .attr("height", 10)
  //   .attr("fill", "yellow")

  // Add index to Price Array
  candlesToShow.map(p => p["index"] = candlesToShow.indexOf(p))

  // Create Label
  let labelXMove = 4
  let labelYMove = 10
  let labelText = chartBody.selectAll("labelText")
    .data(candlesToShow.filter((p) => { return p.Label !== "" }))
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.index) - labelXMove - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.High) - labelYMove)
    .attr("stroke", "white")
    .attr("font-family", "Courier")
    .attr("font-size", "11px")
    .attr("z-index", "100")
    .text(d => d.Label);

  // Enter and Exit Pointers
  let pointerWidth = 7
  let pointerHeight = 15
  // let rotateAngle = 5
  let pointerXMove = 0
  let pointerYMove = 25

  let enterPointer = chartBody.selectAll("enterPointer")
    .data(candlesToShow.filter((p) => { return p.StratEnterPrice != 0 }))
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.Low) + pointerYMove)
    .attr("width", pointerWidth)
    .attr("height", pointerHeight)
    .attr("fill", "chartreuse")

  let exitPointer = chartBody.selectAll("exitPointer")
    .data(candlesToShow.filter((p) => { return p.StratExitPrice != 0 }))
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.Low) + pointerYMove)
    .attr("width", pointerWidth)
    .attr("height", pointerHeight)
    .attr("fill", "hotpink")
  // .attr("transform", "rotate(" + rotateAngle + "," + 20 + "," + 20 + ")");

  // draw high and low
  let stems = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append("line")
    .attr("class", "stem")
    .attr("x1", (d, i) => xScale(i) - xBand.bandwidth() / 2)
    .attr("x2", (d, i) => xScale(i) - xBand.bandwidth() / 2)
    .attr("y1", d => yScale(d.High))
    .attr("y2", d => yScale(d.Low))
    .attr("stroke", d => (d.Open === d.Close) ? "white" : (d.Open > d.Close) ? "red" : "darkgreen");

  // console.log(stems.selectAll("g.line").select(".stem"))
  // console.log(stems.selectAll(".stem"))

  let stemsXArray = []
  stems.selectAll(".stem")._parents.forEach(e => {
    stemsXArray.push(e.x1.baseVal.value)
  });
  // console.log(stems.selectAll(".stem")._parents[0].x1.baseVal.value)
  // console.log(parseInt(kms.select("#doge").attr("x")))

  svg.append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", w)
    .attr("height", h)

  const extent = [[0, 0], [w, h]];

  var resizeTimer;
  var zoom = d3.zoom()
    .scaleExtent([1, 100])
    .translateExtent(extent)
    .extent(extent)
    .on("zoom", zoomed)
    .on('zoom.end', zoomend)
  svg.call(zoom)

  function zoomed() {
    // if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'wheel') { return; }
    // console.log(d3.event.sourceEvent.deltaX)
    var t = d3.event.transform;
    let xScaleZ = t.rescaleX(xScale);

    let hideTicksWithoutLabel = function () {
      d3.selectAll('.xAxis .tick text').each(function (d) {
        if (this.innerHTML === '') {
          this.parentNode.style.display = 'none'
        }
      })
    }

    gX.call(
      d3.axisBottom(xScaleZ).tickFormat((d, e, target) => {
        if (d >= 0 && d <= dateTimes.length - 1) {
          return processXAxisLabel(d, dateTimes)
        }
      })
    )

    candles.attr("x", (d, i) => xScaleZ(i) - (xBand.bandwidth() * t.k) / 2)
      .attr("width", xBand.bandwidth() * t.k);

    stems.attr("x1", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);
    stems.attr("x2", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);

    // console.log(stems.selectAll(".stem")._parents[0].x1.baseVal.value)

    function changeStemsX() {
      let substituteX = []
      stems.selectAll(".stem")._parents.forEach(e => {
        // console.log(e.x1.baseVal.value)
        substituteX.push(e.x1.baseVal.value)
      });
      stemsXArray = substituteX
    }
    changeStemsX()

    // Label X Zooming
    labelText.attr("x", (d, i) => xScaleZ(d.index) - labelXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)

    // Pointers X Zooming
    enterPointer.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
    exitPointer.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)

    hideTicksWithoutLabel();

    gX.selectAll(".tick text")
      .call(wrap, xBand.bandwidth())
  }

  function zoomend() {
    var t = d3.event.transform;
    let xScaleZ = t.rescaleX(xScale);
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {

      var xmin = new Date(xDateScale(Math.floor(xScaleZ.domain()[0])))
      xmax = new Date(xDateScale(Math.floor(xScaleZ.domain()[1])))
      filtered = _.filter(candlesToShow, d => ((d.DateTime >= xmin) && (d.DateTime <= xmax)))
      minP = +d3.min(filtered, d => d.Low)
      maxP = +d3.max(filtered, d => d.High)
      buffer = Math.floor((maxP - minP) * 0.1)

      yScale.domain([minP - buffer, maxP + buffer])
      candles.transition()
        .duration(100)
        .attr("y", (d) => yScale(Math.max(d.Open, d.Close)))
        .attr("height", d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)));

      stems.transition().duration(100)
        .attr("y1", (d) => yScale(d.High))
        .attr("y2", (d) => yScale(d.Low))
      // console.log(stemsXArray[0])

      // shapes.transition()
      //   .duration(100)
      //   .attr("y", (d) => yScale(Math.max(d.Open, d.Close)))
      //   .attr("height", d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)));

      // label.transition().duration(100)
      //   .attr("y", (d) => yScale(d.High) - 100)

      // Label Y Zooming
      labelText.transition().duration(100)
        .attr("y", (d) => yScale(d.High) - labelYMove)

      // Pointers Y Zooming
      enterPointer.transition().duration(100)
        .attr("y", (d) => yScale(d.Low) + labelYMove)
      exitPointer.transition().duration(100)
        .attr("y", (d) => yScale(d.Low) + labelYMove)

      gY.transition().duration(100).call(d3.axisLeft().scale(yScale));

    }, 50)

  }

  //crosshairs
  var mouseG = svg.append("g")
    .attr("class", "mouse-over-effects");

  mouseG.append("path") // this is the black vertical line to follow mouse
    .attr("class", "mouse-line")
    .style("stroke", "yellow")
    .style("stroke-width", "1px")
    .style("opacity", "0");

  // var lines = document.getElementsByClassName('line');

  // var mousePerLine = mouseG.selectAll('.mouse-per-line')
  //   // .data(cities)
  //   .enter()
  //   .append("g")
  //   .attr("class", "mouse-per-line");

  // mousePerLine.append("circle")
  //   .attr("r", 7)
  //   .style("stroke", function (d) {
  //     return color(d.name);
  //   })
  //   .style("fill", "none")
  //   .style("stroke-width", "1px")
  //   .style("opacity", "0");

  // mousePerLine.append("text")
  //   .attr("transform", "translate(10,3)");

  mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
    .attr('width', w) // can't catch mouse events on a g element
    .attr('height', h)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseout', function () { // on mouse out hide line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "0");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "0");
    })
    .on('mouseover', function () { // on mouse in show line, circles and text
      d3.select(".mouse-line")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line circle")
        .style("opacity", "1");
      d3.selectAll(".mouse-per-line text")
        .style("opacity", "1");
    })
    .on('mousemove', function () { // mouse moving over canvas
      var mouse = d3.mouse(this);
      d3.select(".mouse-line")
        .attr("d", function () {
          var d = "M" + mouse[0] + "," + h;
          d += " " + mouse[0] + "," + 0;
          return d;
        });

      stemsXArray.forEach((x, i) => {
        if ((mouse[0] > (x - 3)) && (mouse[0] < (x + 3))) {
          document.getElementById("ohlcDisplay").innerHTML = `O <span>${candlesToShow[i].Open}</span> <br>H <span>${candlesToShow[i].High}</span> <br>L <span>${candlesToShow[i].Low}</span> <br>C <span>${candlesToShow[i].Close}</span>`
        }
      })
    });
}

function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
  // horizontalScroll()
}

/// PROFIT CURVE
function drawPC(data) {
  d3.selectAll("#profit > *").remove();
  var profitCurveData
  var pcMargin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 550 - pcMargin.left - pcMargin.right,
    height = 300 - pcMargin.top - pcMargin.bottom;

  // parse the date / time
  var parseTime = d3.timeParse("%d-%b-%y");

  // set the ranges
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var pcSvg = d3.select("#profit").append("svg")
    // .attr("width", "550")
    // .attr("height", "400")
    .attr("viewBox", "0 0 600 600")
    .append("g")
    .attr("transform",
      "translate(" + pcMargin.left + "," + pcMargin.top + ")");

    
  let formattedData = []
  let changedData = []

  // format the data. Change data from the backend to usuable form
  data.forEach(function (d) {
    d.Data.forEach(function (point) {
      if (formattedData.map((a) => { return a.date }).includes(point.DateTime)) {
        //add point.Equity to existing obj
        formattedData.forEach((a) => {
          if (a.date == point.DateTime) {
            a[d.DataLabel] = point.Equity
          }
        })

      } else {
        //make new obj
        let datum = {}
        datum.date = point.DateTime

        data.forEach((d) => {
          datum[d.DataLabel] = null
        })

        datum[d.DataLabel] = point.Equity
        formattedData.push(datum)
      }
    })
  });

  // sorting the array before copying the data if null
  sortByDate(formattedData)

  // If data is null, it uses the previous data
  formattedData.forEach((a, i) => {
    let datum = {}
    datum["date"] = new Date(a.date)

    let fillNullData = (key, value) => {
      if (key !== "date") {
        if (value !== null) {
          //Delete spaces in param names and add value if exists
          datum[key.replace(" ", "")] = value;
        } else {
          //Delete spaces in param names and add previous value
          datum[key.replace(" ", "")] = changedData[i - 1][key.replace(" ", "")];
        }
      }
    }
    useKeyAndValue(fillNullData, a)

    changedData.push(datum)
  })

  // assign to data, which is used by all d3
  data = changedData

  // Scale the range of the data
  x.domain(d3.extent(data, function (d) { return d.date; }));
  y.domain([0, d3.max(data, function (d) {
    let maxValue = []
    let findMax = (key, value) => {
      if (key !== "date") {
        maxValue.push(value)
      }
    }
    useKeyAndValue(findMax, d)
    return 1.1 * (Math.max(...maxValue));
  })]);

  let valueline = []

  // Creating lines and adding it to an array
  let newLines = (key, value) => {
    if (key !== "date") {
      valueline.push(d3.line()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d[key]); }))
    }
  }
  useKeyAndValue(newLines, data[0])

  // Drawing the lines from the valueline array
  function drawNewLines(v, d) {
    if (v.length === 0) {
      return
    }
    pcSvg.append("path")
      .data([d])
      .attr("class", "line")
      .attr("d", v[0])
      .style("stroke", getRandomColor())
    return drawNewLines(v.slice(1), d)
  }
  drawNewLines(valueline, data)

  // Add the X Axis
  pcSvg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .style("color", "white")

  // Add the Y Axis
  pcSvg.append("g")
    .call(d3.axisLeft(y))
    .style("color", "white")
}

/// SIMULATED TRADES
function plotHistory(data) {
  var table = document.getElementById("history")
  table.innerHTML = ""
  let row = table.insertRow()
  let tableHeader = ["Index","Raw Profit Perc","Entry Price","Exit Price","Risked Equity","Date","Position Size","Direction","Parameter"]
  tableHeader.forEach(t => {
    let newCell = row.insertCell()
    newCell.innerHTML = t
    newCell.className = "thead"
  })
  //for each param
  data.forEach((d) => {
    //for each trade history item in that param
    d.Data.forEach((s, i) => {
      let row = table.insertRow()
      row.insertCell().innerHTML = indexST
      row.insertCell().innerHTML = s.RawProfitPerc.toFixed(2)
      row.insertCell().innerHTML = s.EntryPrice.toFixed(2)
      row.insertCell().innerHTML = s.ExitPrice.toFixed(2)
      row.insertCell().innerHTML = s.RiskedEquity.toFixed(2)
      dateStrs = s.DateTime.split("T")
      row.insertCell().innerHTML = dateStrs[0] + "\n" + dateStrs[1]
      row.insertCell().innerHTML = s.PosSize.toFixed(2)
      row.insertCell().innerHTML = s.Direction
      row.style.color = "white"
      //param name
      let param = row.insertCell()
      param.innerHTML = d.DataLabel
      param.style.color = "white"

      //color row based on profitability
      var entry = parseFloat(s.EntryPrice)
      var exit = parseFloat(s.ExitPrice)
      if ((s.Direction == "LONG") && (exit > entry)) {
        row.style.backgroundColor = "#001204"
      } else if ((s.Direction == "LONG") && (exit < entry)) {
        row.style.backgroundColor = "#1a0000"
      }
      indexST += 1
    })
  })
}

// Helper Functions
function moveLeft() {
  let lBtn = document.getElementById("panCandlesLeftBtn")
  let rBtn = document.getElementById("panCandlesRightBtn")

  lBtn.style.display = "inline"
  candleDrawStartIndex -= candleDisplayNumber
  candleDrawEndIndex -= candleDisplayNumber
  if (candleDrawStartIndex <= 0) {
    lBtn.style.display = "none"
  }

  rBtn.style.display = "inline"
  
  drawChart(candleDrawStartIndex, candleDrawEndIndex)
}

function moveRight() {
  let lBtn = document.getElementById("panCandlesLeftBtn")
  let rBtn = document.getElementById("panCandlesRightBtn")
 
  rBtn.style.display = "inline"
  candleDrawStartIndex += candleDisplayNumber
  candleDrawEndIndex += candleDisplayNumber
  if (candleDrawEndIndex >= allCandles.length) {
    rBtn.style.display = "none"
  }

  lBtn.style.display = "inline"
  
  drawChart(candleDrawStartIndex, candleDrawEndIndex)
}

function getPickerDateTime(pickerID) {
  return document.getElementById(pickerID).value + ":00"
}

function getLocalTimezone() {
  return (-new Date().getTimezoneOffset() / 60) * 3600000
}

function tickerSelectChanged() {
  var s = document.getElementById("resSelect")
  var btn = document.getElementById("loadResBtn")
  if (s.value !== "") {
    btn.style.display = "inline"
  } else {
    btn.style.display = "none"
  }
}
tickerSelectChanged()
function processXAxisLabel(d, dates) {
  d = new Date(dates[d])

  //save date to make sure consecutive same dates don't show on axis label
  if (!xAxisDateExisting) {
    xAxisDateExisting = d
  }

  hours = d.getHours()
  minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
  amPM = hours < 13 ? 'am' : 'pm'
  // if (parseInt(hours)) {
  //   // return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
  //   let retLabel = hours + ':' + minutes + amPM
  //   //if date the same, don't show
  //   let dateStr = ""
  //   if (xAxisDateExisting.getDate() != d.getDate()) {
  //     //always show date with month
  //     dateStr = dateStr + ' ' + d.getDate() + ' ' + months[d.getMonth()]
  //     xAxisDateExisting = d
  //   }
  //   if (xAxisDateExisting.getFullYear() != d.getFullYear()) {
  //     dateStr = dateStr + ' ' + d.getFullYear()
  //     xAxisDateExisting = d
  //   }
  //   return retLabel + dateStr
  // }
    return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()

}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function sortByDate(arr) {
  // Sorting the array based on date from earlier to later
  arr.sort(function (a, b) {
    return new Date(new Date(a.date)) - new Date(new Date(b.date));
  });
}

function useKeyAndValue(func, obj) {
  for (const [key, value] of Object.entries(obj)) {
    func(key, value)
  }
}

function getParams(url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

//unused
function getMoreData() {
  wholeStartTime = getPickerDateTime("startDateTimePicker")
  wholeEndTime = getPickerDateTime("endDateTimePicker")

  let date1 = new Date(candlestickToShow[0].DateTime);
  let date2 = new Date(candlestickToShow[1].DateTime);
  let candleDuration = Math.abs(date2 - date1); //in ms

  let currentStartTime = new Date(candlestickToShow[0].DateTime);
  let newStartDate = new Date(Math.abs((new Date(currentStartTime)) - (newCandlesToFetch * candleDuration)) + getLocalTimezone())
  let endTime = new Date(Math.abs(candlestickToShow[candlestickToShow.length - 1].DateTime) + getLocalTimezone());
  let getURL = baseURL + "/candlestick?time_start=" + newStartDate.toISOString().split(".")[0] + "&time_end=" + endTime.toISOString().split(".")[0]

  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }

  axios
    .get(getURL, {
      headers: hd,
      // mode: "cors",
    })
    .then((res) => {
      drawChart(res.data)
    })
    .catch((error) => {
      console.log(error);
    });
}

//unused 
function horizontalScroll() {
  var indicators = ["a", "b", "c", "d", "e", "f", "g", "h", "i"]

  d3.select("#scroll")
    .call(d3.zoom().scaleExtent([0, 1])
      .interpolate(d3.interpolateLinear)
      .on("zoom", zoomed))

  // console.log(candlestickToShow)
  var divs = d3.select("#scroll").selectAll(".indicatorDivs").data(candlestickToShow)

  divs.enter()
    .append("div")
    .attr("class", "indicatorDivs")
    .style("display", "inline-block")
    .style("width", 150 + "px")
    .style("height", 150 + "px")
    .style("border", "1px solid green")
    .call(d3.drag().on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  var headers = d3.selectAll(".indicatorDivs").selectAll(".headers").data(function (d) { return [d] })
  headers.enter()
    .append("h2")
    .attr("class", "headers")
    .style("color", "yellow")
    .style("margin-left", "20px")
    .text(function (d) { return d })

  var x0 = 0
  var x1 = 0
  var deltax = 0
  var scroll0 = 0;
  var maxScroll = d3.select("#scroll").node().scrollWidth
}

function dragstarted() {
  //get initial x position
  x0 = d3.event.x
  scroll0 = d3.select("#scroll").node().scrollLeft
}

function dragged(d) {
  //calculate change in x, and the associated change in scrolling
  x1 = d3.event.x
  deltax = x1 - x0;

  //move scroller to starting scroll value + change in x
  //the Math.min is probably unneccesary since it will automatically
  //stop the scroller at the end of the div
  d3.select("#scroll").property("scrollLeft", Math.min(scroll0 + deltax, maxScroll))
}

function dragended(d) {
  d3.select(this).classed("active", false);
}

function zoomed() {
  // console.log(d3.event)
  d3.select("#scroll").property("scrollLeft", maxScroll * (1 - d3.event.transform.k))
}
