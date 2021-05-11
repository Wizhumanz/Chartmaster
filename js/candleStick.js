let baseURL = "http://localhost:8000"
let candlestickData = []
let addedData = []
let wholeStartTime = getPickerDateTime("startDateTimePicker")
let wholeEndTime = getPickerDateTime("endDateTimePicker")
let newCandlesToFetch = 80
let xAxisDateExisting


function connectWs() {
  wsConnLoading = true;
  if (true) {
    try {
      socket = new WebSocket("wss://ana-api.myika.co/ws/" + "5632499082330112");
      console.log("Attempting Connection...");
      setTimeout(() => (wsConnLoading = false), 1000);
    } catch (err) {
      console.log(err);
      setTimeout(() => (wsConnLoading = false), 1000);
    }
  } else {
    setTimeout(() => (wsConnLoading = false), 1000);
  }

  if (socket) {
    socket.onopen = () => {
      console.log("Successfully Connected");
      socket.send("Client connected");
      displaySocketIsClosed = false;

      //get request for TradeAction/trade histories
      const hds = {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
        Authorization: "trader",
      };
      axios
        .get("https://ana-api.myika.co/trades" + "?user=" + "5632499082330112", {
          headers: hds,
          mode: "cors",
        })
        .then((res) => {
          user.trades = res.data;
          storeUser.set(JSON.stringify(user));
          // console.log(res.status + " -- " + JSON.stringify(res.data));
        })
        .catch((error) => {
          console.log(error.response);
        });
    };

    socket.onclose = (event) => {
      console.log("Socket CLOSED Connection: ", event);
      displaySocketIsClosed = true;
    };

    socket.onerror = (error) => {
      console.log("Socket Error: ", error);
      displaySocketIsClosed = true;
    };

    socket.onmessage = (msg) => {
      console.log("WS server msg: " + msg.data);
      displaySocketIsClosed = false;
      //TODO: getting stringified trade action object, parse and put in store.js
      if (msg.data.includes("{")) {
        if (user.trades) {
          
          console.log(user.trades);
        }
      }
    };
  }
}

connectWs()

function computeBacktest() {
  let ticker = document.getElementById("tickerSelect").value
  let period = document.getElementById("periodSelect").value
  let startTime = new Date(Math.abs((new Date(getPickerDateTime("startDateTimePicker")))) + getLocalTimezone())
  let startTimeStr = startTime.toISOString().split(".")[0]
  let endTime = new Date(Math.abs((new Date(getPickerDateTime("endDateTimePicker")))) + getLocalTimezone())
  let endTimeStr = endTime.toISOString().split(".")[0]
  let getURL = baseURL + "/backtest?time_start=" + startTimeStr + "&time_end=" + endTimeStr + "&ticker=" + ticker + "&period=" + period + "&user=69696969696969420"

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
      // console.log(res)
      drawChart(res.data)
    })
    .catch((error) => {
      console.log(error);
    });
}

function getPickerDateTime(pickerID) {
  return document.getElementById(pickerID).value + ":00"
}

function getLocalTimezone() {
  return (-new Date().getTimezoneOffset() / 60) * 3600000
}

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
      // console.log(res)
      drawChart(res.data)
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

function drawChart(prices) {
  // //debug
  // prices.forEach(c => {
  //   if ((c.Label != "") || (c.StratEnterPrice != "") || (c.StratExitPrice != "")) {
  //     console.log(c)
  //   }
  // })

  //reset chart
  d3.selectAll("#container > *").remove();

  candlestickData = prices
  // console.log(candlestickData)

  const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }
  // if (addedData.length !== 0) {
  //   candlestickData = [...addedData, ...candlestickData]
  // }
  var dateFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S");
  for (var i = 0; i < candlestickData.length; i++) {
    candlestickData[i].DateTime = dateFormat(candlestickData[i].DateTime)
  }

  const margin = { top: 20, right: 20, bottom: 205, left: 70 },
    w = 1050,
    h = 680;

  var svg = d3.select("#container")
    // .attr("width", "100%")
    // .attr("height", "110%")
    // .attr("padding-bottom", "3rem")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 1200 1200")
    .classed("svg-content", true)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var width = 500;
  var height = 500;

  // var kms = d3.select("#container")
  //   .append("svg")
  //   .attr("width", width)
  //   .attr("height", height);
  // //Create and append rectangle element

  // svg.append("rect")
  //   .attr("x", 0)
  //   .attr("y", 0)
  //   .attr("width", 200)
  //   .attr("height", 100)
  //   .attr("fill", "yellow")
  //   .attr("id", "doge")


  let dates = _.map(candlestickData, 'DateTime');

  var xmin = d3.min(candlestickData.map(r => r.DateTime.getTime()));
  var xmax = d3.max(candlestickData.map(r => r.DateTime.getTime()));
  var xScale = d3.scaleLinear().domain([-1, dates.length])
    .range([0, w])
  var xDateScale = d3.scaleQuantize().domain([0, dates.length]).range(dates)
  let xBand = d3.scaleBand().domain(d3.range(-1, dates.length)).range([0, w]).padding(0.3)
  var xAxis = d3.axisBottom()
    .scale(xScale)
    // .attr("font-size", "5px")
    .tickFormat(function (d) {
      return processXAxisLabel(d, dates)
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
        if (d >= 0 && d <= dates.length - 1) {
          return processXAxisLabel(d, dates)
        }
      })
    )

    candles.attr("x", (d, i) => xScaleZ(i) - (xBand.bandwidth() * t.k) / 2)
      .attr("width", xBand.bandwidth() * t.k);

    stems.attr("x1", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);
    stems.attr("x2", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);
      
    console.log(stems.selectAll(".stem")._parents[0].x1.baseVal.value)
    
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
      filtered = _.filter(candlestickData, d => ((d.DateTime >= xmin) && (d.DateTime <= xmax)))
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
        console.log(stemsXArray[0])

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

      //  console.log(parseInt(kms.select("#doge").attr("x"))+300)
      //  console.log(kms.select(".gg").attr("x"))
      // stems.selectAll(".stem")._parents.forEach(e => {
      //   console.log(e.x1.baseVal.value)
      // });
      // console.log(stems.selectAll(".stem")._parents[0].x1.baseVal.value)
      stemsXArray.forEach((x,i) => {
        if ((mouse[0] > (x - 2)) && (mouse[0] < (x + 2))) {
          document.getElementById("ohlcDisplay").innerHTML = `Open: ${prices[i].Open} High: ${prices[i].High} Low: ${prices[i].Low} Close: ${prices[i].Close}`
        } 
      })

      // d3.selectAll(".mouse-per-line")
      //   .attr("transform", function (d, i) {
      //     console.log(width / mouse[0])
      //     var xDate = x.invert(mouse[0]),
      //       bisect = d3.bisector(function (d) { return d.date; }).right;
      //     idx = bisect(d.values, xDate);

      //     var beginning = 0,
      //       end = lines[i].getTotalLength(),
      //       target = null;

      //     while (true) {
      //       target = Math.floor((beginning + end) / 2);
      //       pos = lines[i].getPointAtLength(target);
      //       if ((target === end || target === beginning) && pos.x !== mouse[0]) {
      //         break;
      //       }
      //       if (pos.x > mouse[0]) end = target;
      //       else if (pos.x < mouse[0]) beginning = target;
      //       else break; //position found
      //     }

      //     d3.select(this).select('text')
      //       .text(y.invert(pos.y).toFixed(2));

      //     return "translate(" + mouse[0] + "," + pos.y + ")";
      //   });
    });
}

function drawChartInit() {
  let firstGetURL = baseURL + "/candlestick?time_start=" + wholeStartTime + "&time_end=" + wholeEndTime
  d3.json(firstGetURL).then(function (prices) {
    drawChart(prices)
  });
}
drawChartInit();

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





function horizontalScroll() {
  var indicators = ["a", "b", "c", "d", "e", "f", "g", "h", "i"]

  d3.select("#scroll")
    .call(d3.zoom().scaleExtent([0, 1])
      .interpolate(d3.interpolateLinear)
      .on("zoom", zoomed))

  console.log(candlestickData)
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
  //      	console.log(d3.event)
  d3.select("#scroll").property("scrollLeft", maxScroll * (1 - d3.event.transform.k))
}
