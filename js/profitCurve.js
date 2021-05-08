// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 30, left: 40 },
  width = 900 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

// parse the date / time
var parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

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
      if (formattedData.map((a) => {return a.date}).includes(point.DateTime)) {
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
          datum[key.replace(" ", "")] = changedData[i-1][key.replace(" ", "")];
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
    let findMax = (key,value) => {
      if (key !== "date") {
        maxValue.push(value)
      }
    }
    useKeyAndValue(findMax,d)
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
  function drawNewLines(v,d) {
    if (v.length === 0) {
      return
    }
      svg.append("path")
      .data([d])
      .attr("class", "line")
      .attr("d", v[0])
      .style("stroke", getRandomColor())
    return drawNewLines(v.slice(1), d)
  }
  drawNewLines(valueline, data)

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
   arr.sort(function(a,b){
    return new Date(new Date(a.date)) - new Date(new Date(b.date));
  });
}

function useKeyAndValue(func, obj) {
  for (const [key, value] of Object.entries(obj)) {
    func(key, value)
  }
}