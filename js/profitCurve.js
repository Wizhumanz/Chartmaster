// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 30, left: 30 },
  width = 900 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// parse the date / time
var parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the 1st line
var valueline = d3.line()
  .x(function (d) { return x(d.date); })
  .y(function (d) { return y(d.close); });

// define the 2nd line
var valueline2 = d3.line()
  .x(function (d) { return x(d.date); })
  .y(function (d) { return y(d.open); });

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#profit").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.json("http://localhost:8000/profitCurve").then(function (data) {
  let formattedData = []
  let changedData = []

  // format the data. Change data from the backend to usuable form
  data.forEach(function (d) {
    d.Data.forEach(function (point) {
      if (formattedData.map((a) => {return a.date}).includes(point.Date)) {
        //add point.Equity to existing obj
        formattedData.forEach((a) => {
          if (a.date == point.Date) {
            a[d.DataLabel] = point.Equity
          }
        })
        
      } else {
        //make new obj
        let datum = {}
        datum.date = point.Date
        datum["Param 1"] = null
        datum["Param 2"] = null
        datum["Param 3"] = null
        datum[d.DataLabel] = point.Equity
        formattedData.push(datum)
      }
    })
  });

  // If data is null, it uses the previous data
  formattedData.forEach((a, i) => {
    let datum = {}
    datum["date"] = new Date(a.date)
    if (a["Param 1"] !== null) {
      datum.close = a["Param 1"];
    } else {
      datum.close = changedData[i-1].close;
    }
    if (a["Param 2"] !== null) {
      datum.open = a["Param 2"];
    } else {
      datum.open = changedData[i-1].open;
    }
    changedData.push(datum)
  })

  // Sorting the array based on date from earlier to later
  data = changedData.sort(function(a,b){
    return new Date(a.date) - new Date(b.date);
  });

  // Scale the range of the data
  x.domain(d3.extent(data, function (d) { return d.date; }));
  y.domain([0, d3.max(data, function (d) {
    return Math.max(d.close, d.open);
  })]);

  // Add the valueline path.
  svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", valueline);

  // Add the valueline2 path.
  svg.append("path")
    .data([data])
    .attr("class", "line")
    .style("stroke", "red")
    .attr("d", valueline2);

  // Add the X Axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .style("color", "white")

  // Add the Y Axis
  svg.append("g")
    .call(d3.axisLeft(y))
    .style("color", "white")
});