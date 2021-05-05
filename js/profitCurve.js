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
  console.log(JSON.stringify(data[0]))

  jsonTest = [
    {
      date: "2021-01-01",
      param1: 9,
      param2: 2,
      param3: 1,
    },
    {
      date: "2021-01-02",
      param1: 4,
      param2: 1,
      param3: 4,
    },
    {
      date: "2021-01-04",
      param1: 6,
      param2: 3,
      param3: 2,
    },
    {
      date: "2021-01-05",
      param1: 5,
      param2: 6,
      param3: 8,
    },
    {
      date: "2021-01-09",
      param1: 2,
      param2: 4,
      param3: 6,
    }]
  data = jsonTest

  // format the data
  //for each param
  data.forEach(function (d) {
    //for each point in param's line
    data.Data.forEach(function (point) {
      let dateExists = false
      if (dateExists) {
        //add point.Equity to existing obj
      } else {
        //make new obj
        //add point.Equity
      }
    })

    d.date = parseTime(d.date)
    d.close = +d.param1;
    d.open = +d.param2;
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