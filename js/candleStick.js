
let baseURL = "http://localhost:8000"
let candlestickData = []
let addedData = []
let wholeStartTime = getPickerDateTime("startDateTimePicker")
let wholeEndTime = getPickerDateTime("endDateTimePicker")
let newCandlesToFetch = 80

function getPickerDateTime(pickerID) {
  return document.getElementById(pickerID).value + ":00"
}

function getMoreData() {
  wholeStartTime = getPickerDateTime("startDateTimePicker")
  wholeEndTime = getPickerDateTime("endDateTimePicker")
  console.log(wholeStartTime)
  console.log(wholeEndTime)

  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }

  let date1 = new Date(candlestickData[0].DateTime);
  let date2 = new Date(candlestickData[1].DateTime);
  let candleDuration = Math.abs(date2 - date1); //in ms

  let currentStartTime = new Date(candlestickData[0].DateTime);
  let newStartDate = new Date(Math.abs((new Date(currentStartTime)) - (newCandlesToFetch * candleDuration)))
  let endTime = new Date(candlestickData[candlestickData.length - 1].DateTime);
  console.log(currentStartTime)
  console.log(endTime)

  let getURL = baseURL + "/candlestick?time_start=" + newStartDate.toISOString().split(".")[0] + "&time_end=" + endTime.toISOString().split(".")[0]
  console.log(getURL)

  axios
    .get(getURL, {
      headers: hd,
      // mode: "cors",
    })
    .then((res) => {
      console.log(res)
      addedData = [...res.data]
      drawChart()
    })
    .catch((error) => {
      console.log(error);
    });
}

function drawChart() {
  d3.selectAll("#container > *").remove();

  let firstGetURL = baseURL + "/candlestick?time_start=" + wholeStartTime + "&time_end=" + wholeEndTime
  d3.json(firstGetURL).then(function (prices) {
    candlestickData = prices
    
    const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }
    if (addedData.length !== 0) {
      prices = [...addedData, ...prices]
    }
    var dateFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S");
    for (var i = 0; i < prices.length; i++) {
      prices[i].DateTime = dateFormat(prices[i].DateTime)
    }

    const margin = { top: 35, right: 65, bottom: 205, left: 70 },
      w = 1100,
      h = 700;

    var svg = d3.select("#container")
      // .attr("width", "100%")
      // .attr("height", "110%")
      // .attr("padding-bottom", "3rem")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 1200 1200")
      .classed("svg-content", true)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    let dates = _.map(prices, 'DateTime');

    var xmin = d3.min(prices.map(r => r.DateTime.getTime()));
    var xmax = d3.max(prices.map(r => r.DateTime.getTime()));
    var xScale = d3.scaleLinear().domain([-1, dates.length])
      .range([0, w])
    var xDateScale = d3.scaleQuantize().domain([0, dates.length]).range(dates)
    let xBand = d3.scaleBand().domain(d3.range(-1, dates.length)).range([0, w]).padding(0.3)
    var xAxis = d3.axisBottom()
      .scale(xScale)
      .tickFormat(function (d) {
        d = new Date(dates[d])
        hours = d.getHours()
        minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
        amPM = hours < 13 ? 'am' : 'pm'
        return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
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

    var ymin = d3.min(prices.map(r => r.Low));
    var ymax = d3.max(prices.map(r => r.High));
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
      .data(prices)
      .enter()
      .append("rect")
      .attr('x', (d, i) => xScale(i) - xBand.bandwidth())
      .attr("class", "candle")
      .attr('y', d => yScale(Math.max(d.Open, d.Close)))
      .attr('width', xBand.bandwidth())
      .attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)))
      .attr("fill", d => (d.Open === d.Close) ? "silver" : (d.Open > d.Close) ? "red" : "green")

    //trying to make a rectangle------------
    var width = 1000;
    var height = 1000;

    //Create SVG element
    var shapes = d3.selectAll("#container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    //creating a horizontal line to show when strategy is in trade-----------
    shapes.append("rect")
      .attr("x", 200)
      .attr("y", 620)
      .attr("width", 5000)
      .attr("height", 10)
      .attr("fill", "yellow")


    let labelXMove = 0
    let labelYMove = 10
    prices.map(p => p["index"] = prices.indexOf(p))
    console.log(prices.map(p => p.StratEnterPrice))

    // let label = chartBody.selectAll("g.line")
    //   .data(prices.filter((p) => {return p.Label !== ""}))
    //   .enter()
    //   .append("rect")
    //   .attr("x", (d, i) => xScale(d.index) -40 - xBand.bandwidth() / 2)
    //   .attr("y", d => yScale(d.High) - 100)
    //   .attr("width", 80)
    //   .attr("height", 80)
    //   .attr("stroke", "red")

    let labelText = chartBody.selectAll("labelText")
      .data(prices.filter((p) => {return p.Label !== ""}))
      .enter()
      .append("text")
      .attr("x", (d, i) => xScale(d.index) - labelXMove - xBand.bandwidth() / 2)
      .attr("y", d => yScale(d.High) - labelYMove)
      .attr("stroke", "steelblue")
      .attr("font-family", "sans-serif")
      .attr("font-size", "24px")
      .text(d => d.Label);

    let pointerWidth = 10
    // Enter and Exit Pointers
    let enterPointer = chartBody.selectAll("enterPointer")
      .data(prices.filter((p) => {return p.StratEnterPrice != 0}))
      .enter()
      .append("rect")
      .attr("x", (d, i) => xScale(d.index) - pointerWidth/2 - labelXMove - xBand.bandwidth() / 2)
      .attr("y", d => yScale(d.Low) + labelYMove)
      .attr("width", pointerWidth)
      .attr("height", 40)
      .attr("fill", "pink")

    let exitPointer = chartBody.selectAll("exitPointer")
      .data(prices.filter((p) => {return p.StratExitPrice != 0}))
      .enter()
      .append("rect")
      .attr("x", (d, i) => xScale(d.index) - pointerWidth/2 - labelXMove - xBand.bandwidth() / 2)
      .attr("y", d => yScale(d.Low) + labelYMove)
      .attr("width", pointerWidth)
      .attr("height", 40)
      .attr("fill", "purple")

    // draw high and low
    let stems = chartBody.selectAll("g.line")
      .data(prices)
      .enter()
      .append("line")
      .attr("class", "stem")
      .attr("x1", (d, i) => xScale(i) - xBand.bandwidth() / 2)
      .attr("x2", (d, i) => xScale(i) - xBand.bandwidth() / 2)
      .attr("y1", d => yScale(d.High))
      .attr("y2", d => yScale(d.Low))
      .attr("stroke", d => (d.Open === d.Close) ? "white" : (d.Open > d.Close) ? "red" : "green");

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
      .on('zoom.end', zoomend);

    svg.call(zoom)

    function zoomed() {
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
            d = new Date(dates[d])
            hours = d.getHours()
            minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
            amPM = hours < 13 ? 'am' : 'pm'
            return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
          }
        })
      )

      candles.attr("x", (d, i) => xScaleZ(i) - (xBand.bandwidth() * t.k) / 2)
        .attr("width", xBand.bandwidth() * t.k);
      stems.attr("x1", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);
      stems.attr("x2", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);


      

      //Create and append rectangle element
      // label.attr("x", (d, i) => xScaleZ(d.index)-40 - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
      labelText.attr("x", (d, i) => xScaleZ(d.index) - labelXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
      enterPointer.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth/2 - labelXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
      exitPointer.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth/2 - labelXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)


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
        filtered = _.filter(prices, d => ((d.DateTime >= xmin) && (d.DateTime <= xmax)))
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

        // shapes.transition()
        //   .duration(100)
        //   .attr("y", (d) => yScale(Math.max(d.Open, d.Close)))
        //   .attr("height", d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)));

        // label.transition().duration(100)
        //   .attr("y", (d) => yScale(d.High) - 100)

        labelText.transition().duration(100)
          .attr("y", (d) => yScale(d.High) - labelYMove)
        enterPointer.transition().duration(100)
          .attr("y", (d) => yScale(d.Low) + labelYMove)
        exitPointer.transition().duration(100)
          .attr("y", (d) => yScale(d.Low) + labelYMove)

        gY.transition().duration(100).call(d3.axisLeft().scale(yScale));

      }, 50)

    }
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
}

drawChart();

