
let baseURL = "http://localhost:8000"
var wsStatus = document.getElementById("wsStatus")

/// CANDLESTICKS

let candleDisplayIndex = 0
let lBtn = document.getElementById("panCandlesLeftBtn")
lBtn.style.display = "none"
let allCandles = [] // all individual candles
var displayCandlesChunks = [] // chunks of candles for display

let addedData = []
let wholeStartTime = getPickerDateTime("startDateTimePicker")
let wholeEndTime = getPickerDateTime("endDateTimePicker")
let newCandlesToFetch = 80

let xAxisDateExisting
var dateFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S");
const margin = { top: 30, right: 20, bottom: 205, left: 70 },
  w = 1050,
  h = 680;
let existingCandlesWSResID

let result = []

const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }

function loadResult() {
  let getURL = "http://localhost:8000/backtestHistory?user=5632499082330112"
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
    socket = new WebSocket("ws://localhost:8000/ws-cm/" + "5632499082330112");
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
      var dataObj
      if (msg.data.includes("\"") || msg.data.includes("{") || msg.data.includes("}")) {
        dataObj = JSON.parse(msg.data)
      }

      //update chart data based on data type
      //candlestick
      if (dataObj != undefined
        && dataObj.Data != undefined
        && parseFloat(dataObj.Data[0].Open) > 0) {
        //check if concat needed, or new data
        if (existingCandlesWSResID === "" || existingCandlesWSResID !== dataObj.ResultID) {
          allCandles = dataObj.Data
          //if canldestick chart empty
          if (!displayCandlesChunks || displayCandlesChunks.length == 0) {
            displayCandlesChunks = splitDisplayData(dataObj.Data)
            drawChart()
          }
          //save res id so next messages with same ID will be concatenated with existing data
          existingCandlesWSResID = dataObj.ResultID
        } else {
          //add new data to existing array
          dataObj.Data.forEach(newData => {
            allCandles.push(newData)
          })
          displayCandlesChunks = splitDisplayData(allCandles)
          drawChart()
        }
      }
      // console.log(dataObj.Data)
      // console.log(dataObj.Data[0].Data[0].EntryPrice)
      //profit curve
      if (dataObj != undefined
        // && dataObj.Data
        // && dataObj.Data.length > 0
        && parseFloat(dataObj.Data[0].Data[0].Equity) > 0) {
        drawPC(dataObj.Data)
      }

      //sim trades
      if (dataObj != undefined
        // && dataObj.Data
        // && dataObj.Data.length > 0
        && parseFloat(dataObj.Data[0].Data[0].EntryPrice) > 0) {
        plotHistory(dataObj.Data)
      }
    };
  }
}
connectWs()

function splitDisplayData(data) {
  //split candles into display chunks
  let retChunks = []
  let newChunk = []
  let desiredChunkSize = 100
  let currentChunkSz = 0
  for (var i = 0; i < data.length; i += 1) {
    currentChunkSz += 1

    if ((currentChunkSz > desiredChunkSize) || (i === (data.length - 1))) {
      // console.log("pushing chunk" + newChunk)
      retChunks.push(newChunk)
      currentChunkSz = 0
      newChunk = []
    }

    // console.log("pushing data" + data)
    newChunk.push(data[i])
  }
  // console.log(retChunks)
  return retChunks;
}

function moveLeft() {
  let lBtn = document.getElementById("panCandlesLeftBtn")
  let rBtn = document.getElementById("panCandlesRightBtn")

  if (candleDisplayIndex - 1 < 0) {
    //update left btn style
    lBtn.style.display = "none"
  } else {
    lBtn.style.display = "inline"
    candleDisplayIndex -= 1
    if (candleDisplayIndex - 1 < 0) {
      lBtn.style.display = "none"
    }
  }

  if (candleDisplayIndex < displayCandlesChunks.length) {
    rBtn.style.display = "inline"
  }
  drawChart()
}
function moveRight() {
  let lBtn = document.getElementById("panCandlesLeftBtn")
  let rBtn = document.getElementById("panCandlesRightBtn")
  if (candleDisplayIndex + 1 >= displayCandlesChunks.length) {
    rBtn.style.display = "none"
  } else {
    rBtn.style.display = "inline"
    candleDisplayIndex += 1
    if (candleDisplayIndex + 1 >= displayCandlesChunks.length) {
      rBtn.style.display = "none"
    }
  }

  if (candleDisplayIndex >= 1) {
    lBtn.style.display = "inline"
  }

  drawChart()
}

function computeBacktest() {
  let ticker = document.getElementById("tickerSelect").value
  let period = document.getElementById("periodSelect").value
  let startTime = new Date(Math.abs((new Date(getPickerDateTime("startDateTimePicker")))) + getLocalTimezone())
  let startTimeStr = startTime.toISOString().split(".")[0]
  let endTime = new Date(Math.abs((new Date(getPickerDateTime("endDateTimePicker")))) + getLocalTimezone())
  let endTimeStr = endTime.toISOString().split(".")[0]
  let getURL = baseURL + "/backtest?time_start=" + startTimeStr + "&time_end=" + endTimeStr + "&ticker=" + ticker + "&period=" + period + "&user=5632499082330112" + "&candlePacketSize=100"

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
      // console.log(res.data)
    })
    .catch((error) => {
      console.log(error);
    });
}

function getExchanges() {
  let getURL = baseURL + "/getChartmasterTickers"

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

function loadBacktestRes() {
  var s = document.getElementById("resSelect")
  var selectedRes = s.value
  let getURL = baseURL + `/backtestHistory/${selectedRes}?user=5632499082330112&candlePacketSize=100`

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

function processXAxisLabel(d, dates) {
  d = new Date(dates[d])
  //save date to make sure consecutive same dates don't show on axis label
  if (!xAxisDateExisting) {
    xAxisDateExisting = d
  }

  hours = d.getHours()
  minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
  amPM = hours < 13 ? 'am' : 'pm'
  if (parseInt(hours)) {
    // return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
    let retLabel = hours + ':' + minutes + amPM
    //if date the same, don't show
    let dateStr = ""
    if (xAxisDateExisting.getDate() != d.getDate()) {
      //always show date with month
      dateStr = dateStr + ' ' + d.getDate() + ' ' + months[d.getMonth()]
      xAxisDateExisting = d
    }
    if (xAxisDateExisting.getFullYear() != d.getFullYear()) {
      dateStr = dateStr + ' ' + d.getFullYear()
      xAxisDateExisting = d
    }
    return retLabel + dateStr
    // return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
  }
}

function drawChart() {
  let candlesToShow = displayCandlesChunks[candleDisplayIndex]

  if (!candlesToShow || candlesToShow.length == 0) {
    return
  }
  let candlestickData = []
  for (const p of candlesToShow) {
    candlestickData.push(p)
  }
  // displayCandlesChunks.forEach(chunk => {
  //   chunk.forEach(c => {
  //     console.log(typeof(c.DateTime))
  //   })
  // })

  //reset chart
  d3.selectAll("#container > *").remove();

  //build datetime array
  let dateTimes = []
  let candlestickDataDateFormatObject = candlesToShow.slice()
  for (var i = 0; i < candlestickData.length; i++) {
    let add = dateFormat(candlestickData[i].DateTime)
    dateTimes.push(add)
    candlestickDataDateFormatObject[i].DateTime = add
  }

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

  var ymin = d3.min(candlestickData.map(r => r.Low));
  var ymax = d3.max(candlestickData.map(r => r.High));
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
    .data(candlestickData)
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
  candlestickData.map(p => p["index"] = candlestickData.indexOf(p))

  // Create Label
  let labelXMove = 4
  let labelYMove = 10
  let labelText = chartBody.selectAll("labelText")
    .data(candlestickData.filter((p) => { return p.Label !== "" }))
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
    .data(candlestickData.filter((p) => { return p.StratEnterPrice != 0 }))
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.Low) + pointerYMove)
    .attr("width", pointerWidth)
    .attr("height", pointerHeight)
    .attr("fill", "chartreuse")

  let exitPointer = chartBody.selectAll("exitPointer")
    .data(candlestickData.filter((p) => { return p.StratExitPrice != 0 }))
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
    .data(candlestickData)
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
      filtered = _.filter(candlestickDataDateFormatObject, d => ((d.DateTime >= xmin) && (d.DateTime <= xmax)))
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
          document.getElementById("ohlcDisplay").innerHTML = `O <span>${candlestickData[i].Open}</span> <br>H <span>${candlestickData[i].High}</span> <br>L <span>${candlestickData[i].Low}</span> <br>C <span>${candlestickData[i].Close}</span>`
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

/// SIMULATED TRADES

function plotHistory(data) {
  var table = document.getElementById("history")
  //for each param
  data.forEach((d) => {
    //for each trade history item in that param
    d.Data.forEach((s, i) => {
      let row = table.insertRow()
      row.insertCell().innerHTML = parseInt(JSON.stringify(i)) + 1

      row.insertCell().innerHTML = s.RawProfitPerc
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
        row.style.backgroundColor = "#002405"
      } else if ((s.Direction == "LONG") && (exit < entry)) {
        row.style.backgroundColor = "#240000"
      }
    })
  })
}

//unused
function getMoreData() {
  wholeStartTime = getPickerDateTime("startDateTimePicker")
  wholeEndTime = getPickerDateTime("endDateTimePicker")

  let date1 = new Date(candlestickData[0].DateTime);
  let date2 = new Date(candlestickData[1].DateTime);
  let candleDuration = Math.abs(date2 - date1); //in ms

  let currentStartTime = new Date(candlestickData[0].DateTime);
  let newStartDate = new Date(Math.abs((new Date(currentStartTime)) - (newCandlesToFetch * candleDuration)) + getLocalTimezone())
  let endTime = new Date(Math.abs(candlestickData[candlestickData.length - 1].DateTime) + getLocalTimezone());
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

  // console.log(candlestickData)
  var divs = d3.select("#scroll").selectAll(".indicatorDivs").data(candlestickData)

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
