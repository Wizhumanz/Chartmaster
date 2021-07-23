let baseURL = "http://localhost:8001"
let wsStatus = document.getElementById("wsStatus")

// link url
let copyLink

// Used for progress bar for loading and sharing
let loadHistory = false

// Slider
let slider = document.getElementById("chartSlider")
  slider.style.display = "none"

// Get parameters from a URL string
let userID = getParams(window.location.href).user
if (userID === undefined) {
  document.getElementById("undefinedUserErr").style.display = "block"
}

let shareID = getParams(window.location.href).share
if (shareID !== undefined) {
  document.getElementById("undefinedUserErr").style.display = "none"
  document.getElementById("startDateTimePicker").disabled = true
  document.getElementById("endDateTimePicker").disabled = true
  document.getElementById("tickerSelect").disabled = true
  document.getElementById("periodSelect").disabled = true
  document.getElementById("risk").disabled = true
  document.getElementById("leverage").disabled = true
  document.getElementById("size").disabled = true
  document.getElementById("modeTogglerBtn").style.display = "none"
  document.getElementById("chunkProcessTogglerBtn").style.display = "none"
  document.getElementById("saveCandles").style.display = "none"
  document.getElementById("candlesSelect").style.display = "none"
  document.getElementById("computeBtn").style.display = "none"
  document.getElementById("wsStatus").style.display = "none"
  document.getElementById("resSelect").style.display = "none"
}

// Hide Load Btn
var res = document.getElementById("loadResBtn")
res.style.display = "none"

// Histogram Btns
let histBins
let histIndex = 0
let u

// Progress bar
document.getElementById("progress").style.display = "none";

// Scan view
document.getElementById("scan").style.display = "none"

// Simulated Trades index
let indexST = 1

// Scan History index
let indexScan = 1

// History json name
var selectedRes

// Saved Candles in JSON
let retrieveCandles = false

// Disable btn until computeBacktest
document.getElementById("saveCandles").style.display = "none"

// Disable btns initially
document.getElementById("panCandlesLeftBtn").style.display = "none"
document.getElementById("panCandlesRightBtn").style.display = "none"

// SMAs
let checked1SMA = false
let checked2SMA = false
let checked3SMA = false
let checked4SMA = false
document.getElementById("legendLabel1SMA").style.display = "none"
document.getElementById("legendCheckbox1SMA").style.display = "none"
document.getElementById("legendLabel2SMA").style.display = "none"
document.getElementById("legendCheckbox2SMA").style.display = "none"
document.getElementById("legendLabel3SMA").style.display = "none"
document.getElementById("legendCheckbox3SMA").style.display = "none"
document.getElementById("legendLabel4SMA").style.display = "none"
document.getElementById("legendCheckbox4SMA").style.display = "none"

// EMAs
let checked1EMA = false
let checked2EMA = false
let checked3EMA = false
let checked4EMA = false
document.getElementById("legendLabel1EMA").style.display = "none"
document.getElementById("legendCheckbox1EMA").style.display = "none"
document.getElementById("legendLabel2EMA").style.display = "none"
document.getElementById("legendCheckbox2EMA").style.display = "none"
document.getElementById("legendLabel3EMA").style.display = "none"
document.getElementById("legendCheckbox3EMA").style.display = "none"
document.getElementById("legendLabel4EMA").style.display = "none"
document.getElementById("legendCheckbox4EMA").style.display = "none"

/// CANDLESTICKS
let candleDisplayNumber = 260
let candleDrawStartIndex = 0
let tickNumCandles = 10
let tickNumProfitX = 6
let tickNumProfitY = 8
let candlestickChartLabelFontSize = "13px"
let margin = { top: 10, right: 20, bottom: 205, left: 45 },
  w = 1050,
  h = 630;
let candlesViewBoxHeight = "1000"
let candlestickLabelStroke = "0.5px"
let pcFontSz = "14px"

//mobile display options
if (screen.availWidth < 700) {
  h = 1800
  margin.left = 140
  margin.top = 40
  candleDisplayNumber = 30
  tickNumCandles = 7
  candlestickChartLabelFontSize = "40px"
  candlesViewBoxHeight = "2200"
  candlestickLabelStroke = "3px"
  tickNumProfitX = 4
  tickNumProfitY = 7
  pcFontSz = "20px"
}

let candleDrawEndIndex = candleDisplayNumber
let allCandles = [] // all individual candles
let allProfitCurve = [] // all individual profits
let allSimTrades = [] // all individual trades
let allScatter = []

let wholeStartTime = getPickerDateTime("startDateTimePicker")
let wholeEndTime = getPickerDateTime("endDateTimePicker")
let newCandlesToFetch = 80 //used by obsolete getMoreData() 

let xAxisDateExisting
var dateFormat = d3.timeParse("%Y-%m-%dT%H:%M:%S");
let existingWSResID
let existingWSResIDPC
let existingWSResIDST

// Disable btns initially
document.getElementById("panCandlesLeftBtn").style.display = "none"
document.getElementById("panCandlesRightBtn").style.display = "none"

const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }

//default display
// allCandles = [{ "DateTime": "2021-05-01T04:00:00", "Open": 58206.890625, "High": 58253.21875, "Low": 58206.890625, "Close": 58252.78125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:01:00", "Open": 58252.78125, "High": 58277.109375, "Low": 58232.73828125, "Close": 58273, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:02:00", "Open": 58271.03125, "High": 58271.03125, "Low": 58167.01953125, "Close": 58167.01953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:03:00", "Open": 58167.01953125, "High": 58181.33984375, "Low": 58100.80078125, "Close": 58118.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:04:00", "Open": 58118.01171875, "High": 58120, "Low": 58050, "Close": 58067.46875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:05:00", "Open": 58067.46875, "High": 58100, "Low": 58060.5, "Close": 58097.3203125, "StratEnterPrice": 57693, "StratExitPrice": 0, "Label": "▼ 57410.00 / 0.04" }, { "DateTime": "2021-05-01T04:06:00", "Open": 58096.8203125, "High": 58098.48046875, "Low": 58061.33984375, "Close": 58075.859375, "StratEnterPrice": 0, "StratExitPrice": 57711.7890625, "Label": "" }, { "DateTime": "2021-05-01T04:07:00", "Open": 58075.87109375, "High": 58123.94921875, "Low": 58073.76953125, "Close": 58120, "StratEnterPrice": 57784.8515625, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:08:00", "Open": 58120.01171875, "High": 58162.8984375, "Low": 58087.94140625, "Close": 58153.76953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:09:00", "Open": 58156.1796875, "High": 58190.19921875, "Low": 58153.6796875, "Close": 58190.19140625, "StratEnterPrice": 0, "StratExitPrice": 57769.140625, "Label": "▼ 57669.99" }, { "DateTime": "2021-05-01T04:10:00", "Open": 58190.19921875, "High": 58248.37109375, "Low": 58190.19140625, "Close": 58223.26953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:11:00", "Open": 58223.26953125, "High": 58264.7890625, "Low": 58216.6484375, "Close": 58249.51171875, "StratEnterPrice": 57848.19921875, "StratExitPrice": 0, "Label": "▼ 57742.96 / 0.11" }, { "DateTime": "2021-05-01T04:12:00", "Open": 58249.51171875, "High": 58277, "Low": 58230.859375, "Close": 58257.87109375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:13:00", "Open": 58257.87890625, "High": 58259.98828125, "Low": 58212.01171875, "Close": 58226.9609375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:14:00", "Open": 58227.62890625, "High": 58249.96875, "Low": 58206.73046875, "Close": 58215, "StratEnterPrice": 0, "StratExitPrice": 57949.640625, "Label": "▼ 57410.00" }, { "DateTime": "2021-05-01T04:15:00", "Open": 58215, "High": 58243.1796875, "Low": 58213.6484375, "Close": 58227.578125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:16:00", "Open": 58227.640625, "High": 58239.9609375, "Low": 58211.44921875, "Close": 58223.55078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:17:00", "Open": 58223.55078125, "High": 58229.75, "Low": 58137.28125, "Close": 58163.80078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:18:00", "Open": 58163.80078125, "High": 58163.80078125, "Low": 58107.671875, "Close": 58128.140625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:19:00", "Open": 58128.12890625, "High": 58146.48828125, "Low": 58075, "Close": 58135.359375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:20:00", "Open": 58135.359375, "High": 58168.1796875, "Low": 58117.91015625, "Close": 58141.03125, "StratEnterPrice": 57911.28125, "StratExitPrice": 0, "Label": "▼ 57789.42 / 0.10" }, { "DateTime": "2021-05-01T04:21:00", "Open": 58135.21875, "High": 58135.21875, "Low": 58083.828125, "Close": 58123.41015625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:22:00", "Open": 58123.41015625, "High": 58157.3984375, "Low": 58120, "Close": 58141.921875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:23:00", "Open": 58141.921875, "High": 58149.83984375, "Low": 58120, "Close": 58149.71875, "StratEnterPrice": 0, "StratExitPrice": 57975.76171875, "Label": "▼ 57789.42" }, { "DateTime": "2021-05-01T04:24:00", "Open": 58149.71875, "High": 58169.80859375, "Low": 58139.80078125, "Close": 58147.28125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:25:00", "Open": 58147.26953125, "High": 58150, "Low": 58122.98046875, "Close": 58130.08984375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:26:00", "Open": 58130.1015625, "High": 58140, "Low": 58119.05859375, "Close": 58136.05078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:27:00", "Open": 58136.05078125, "High": 58138.05078125, "Low": 58060, "Close": 58060.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:28:00", "Open": 58060.01171875, "High": 58089.48046875, "Low": 58000, "Close": 58005.78125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:29:00", "Open": 58005.7890625, "High": 58070, "Low": 58002.83984375, "Close": 58062.94140625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:30:00", "Open": 58062.94140625, "High": 58068.94921875, "Low": 58004.26171875, "Close": 58024.73046875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:31:00", "Open": 58024.73046875, "High": 58024.73046875, "Low": 57845.21875, "Close": 57895.33984375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:32:00", "Open": 57894.73046875, "High": 57939.94921875, "Low": 57875.91015625, "Close": 57918.96875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:33:00", "Open": 57919, "High": 57958.44921875, "Low": 57891.58984375, "Close": 57946.25, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:34:00", "Open": 57946.26171875, "High": 57948.9609375, "Low": 57888.109375, "Close": 57908.109375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:35:00", "Open": 57909.98828125, "High": 57912.3984375, "Low": 57817.359375, "Close": 57820, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:36:00", "Open": 57820, "High": 57847.2109375, "Low": 57722.87109375, "Close": 57780.12890625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:37:00", "Open": 57780.140625, "High": 57840.30078125, "Low": 57720, "Close": 57832.76171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:38:00", "Open": 57832.7890625, "High": 57876.62109375, "Low": 57826, "Close": 57862.26953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:39:00", "Open": 57862.28125, "High": 57887.55859375, "Low": 57831.73046875, "Close": 57885.140625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:40:00", "Open": 57885.12890625, "High": 57900, "Low": 57877.21875, "Close": 57899.5, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:41:00", "Open": 57899.98828125, "High": 57941.05859375, "Low": 57899.25, "Close": 57927.4609375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:42:00", "Open": 57927.44921875, "High": 57950, "Low": 57918.87109375, "Close": 57920.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:43:00", "Open": 57920.01171875, "High": 57920.01171875, "Low": 57872, "Close": 57872, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:44:00", "Open": 57872.01171875, "High": 57926.5703125, "Low": 57870, "Close": 57910.828125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:45:00", "Open": 57913.19140625, "High": 57924.640625, "Low": 57872.7109375, "Close": 57880.55078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:46:00", "Open": 57880.55078125, "High": 57922.828125, "Low": 57826.328125, "Close": 57908.171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:47:00", "Open": 57907.4609375, "High": 57935.8984375, "Low": 57888.37890625, "Close": 57891.98046875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:48:00", "Open": 57891.98046875, "High": 57942.69921875, "Low": 57891.96875, "Close": 57942.55859375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:49:00", "Open": 57942.55859375, "High": 57980.5, "Low": 57914.51171875, "Close": 57974.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:50:00", "Open": 57974.01953125, "High": 58049.30078125, "Low": 57970.921875, "Close": 58017.859375, "StratEnterPrice": 57866.140625, "StratExitPrice": 0, "Label": "▼ 57786.00 / 0.15" }, { "DateTime": "2021-05-01T04:51:00", "Open": 58016.87109375, "High": 58046.44140625, "Low": 58016.859375, "Close": 58040.03125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:52:00", "Open": 58036.37890625, "High": 58060, "Low": 58030, "Close": 58037.7890625, "StratEnterPrice": 0, "StratExitPrice": 57863.03125, "Label": "▼ 57600.08" }, { "DateTime": "2021-05-01T04:53:00", "Open": 58037.3203125, "High": 58041.69140625, "Low": 57959.2109375, "Close": 57994.859375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:54:00", "Open": 57994.859375, "High": 58035.921875, "Low": 57990.12109375, "Close": 58023.78125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:55:00", "Open": 58027.71875, "High": 58045, "Low": 58009.671875, "Close": 58045, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:56:00", "Open": 58044.98046875, "High": 58127.328125, "Low": 58044.58984375, "Close": 58125.55078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:57:00", "Open": 58125.55859375, "High": 58138.37890625, "Low": 58078.75, "Close": 58117.19921875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:58:00", "Open": 58117.2109375, "High": 58117.2109375, "Low": 58082.23828125, "Close": 58090.66015625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:59:00", "Open": 58090.66015625, "High": 58121.8203125, "Low": 58057.9296875, "Close": 58100.6484375, "StratEnterPrice": 57787.28125, "StratExitPrice": 0, "Label": "▼ 57669.99 / 0.10" }, { "DateTime": "2021-05-01T05:00:00", "Open": 58100.26953125, "High": 58150, "Low": 58065.53125, "Close": 58079.328125, "StratEnterPrice": 0, "StratExitPrice": 57807.6484375, "Label": "" }]
// drawChart(0, candleDisplayNumber)
allProfitCurve = [{ "DataLabel": "strat1", "Data": [{ "DateTime": "2021-05-01T00:06:00", "Equity": 503.2285777385159 }, { "DateTime": "2021-05-01T00:11:00", "Equity": 514.7956316711843 }, { "DateTime": "2021-05-01T00:20:00", "Equity": 521.1452918840314 }, { "DateTime": "2021-05-01T00:49:00", "Equity": 520.679704050146 }, { "DateTime": "2021-05-01T00:58:00", "Equity": 522.346204200011 }, { "DateTime": "2021-05-01T01:12:00", "Equity": 524.5089442514854 }, { "DateTime": "2021-05-01T01:14:00", "Equity": 520.8258235514659 }, { "DateTime": "2021-05-01T01:17:00", "Equity": 517.0176397972828 }, { "DateTime": "2021-05-01T01:27:00", "Equity": 520.2462175357987 }, { "DateTime": "2021-05-01T01:32:00", "Equity": 531.8132714684671 }, { "DateTime": "2021-05-01T01:41:00", "Equity": 538.1629316813141 }, { "DateTime": "2021-05-01T02:10:00", "Equity": 537.6973438474288 }, { "DateTime": "2021-05-01T02:18:00", "Equity": 539.7810684952456 }, { "DateTime": "2021-05-01T02:35:00", "Equity": 546.1505002909307 }, { "DateTime": "2021-05-01T02:38:00", "Equity": 542.3423165367476 }, { "DateTime": "2021-05-01T02:48:00", "Equity": 545.5708942752635 }, { "DateTime": "2021-05-01T02:53:00", "Equity": 557.1379482079319 }, { "DateTime": "2021-05-01T03:02:00", "Equity": 563.487608420779 }, { "DateTime": "2021-05-01T03:31:00", "Equity": 563.0220205868936 }, { "DateTime": "2021-05-01T03:40:00", "Equity": 564.6885207367586 }, { "DateTime": "2021-05-01T03:56:00", "Equity": 571.0579525324447 }, { "DateTime": "2021-05-01T03:59:00", "Equity": 567.2497687782616 }, { "DateTime": "2021-05-01T04:06:00", "Equity": 568.0464781422188 }, { "DateTime": "2021-05-01T04:09:00", "Equity": 566.1770846957861 }, { "DateTime": "2021-05-01T04:14:00", "Equity": 577.7441386284545 }, { "DateTime": "2021-05-01T04:23:00", "Equity": 584.0937988413016 }, { "DateTime": "2021-05-01T04:52:00", "Equity": 583.6282110074162 }] }]
drawPC(allProfitCurve)
// allSimTrades = [{ "DataLabel": "strat1", "Data": [{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 },{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 }, { "DateTime": "2021-05-01T01:27:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57769.140625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.13197549962733782 }, { "DateTime": "2021-05-01T01:32:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57949.640625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.44483841193905677 }, { "DateTime": "2021-05-01T01:41:00", "Direction": "LONG", "EntryPrice": 57848.19921875, "ExitPrice": 57975.76171875, "PosSize": 0.11402694777476709, "RiskedEquity": 6596.253591180728, "RawProfitPerc": 0.22051248219089578 }, { "DateTime": "2021-05-01T02:10:00", "Direction": "LONG", "EntryPrice": 57866.140625, "ExitPrice": 57863.03125, "PosSize": 0.1497367907974264, "RiskedEquity": 8664.690193020082, "RawProfitPerc": -0.00537339274127546 }, { "DateTime": "2021-05-01T02:18:00", "Direction": "LONG", "EntryPrice": 57866.140625, "ExitPrice": 57807.6484375, "PosSize": 0.1497367907974264, "RiskedEquity": 8664.690193020082, "RawProfitPerc": -0.10108188807519942 }, { "DateTime": "2021-05-01T02:19:00", "Direction": "LONG", "EntryPrice": 57866.140625, "ExitPrice": 57803.5703125, "PosSize": 0.1497367907974264, "RiskedEquity": 8664.690193020082, "RawProfitPerc": -0.10812940317807829 }, { "DateTime": "2021-05-01T02:33:00", "Direction": "LONG", "EntryPrice": 57787.28125, "ExitPrice": 57619.859375, "PosSize": 0.10230792286941753, "RiskedEquity": 5912.096712958338, "RawProfitPerc": -0.2897209755823216 }, { "DateTime": "2021-05-01T02:35:00", "Direction": "LONG", "EntryPrice": 57609.19140625, "ExitPrice": 57640.609375, "PosSize": 0.20273213225103942, "RiskedEquity": 11679.234211047318, "RawProfitPerc": 0.05453638209994296 }, { "DateTime": "2021-05-01T02:38:00", "Direction": "LONG", "EntryPrice": 57609.19140625, "ExitPrice": 57710.73046875, "PosSize": 0.20273213225103942, "RiskedEquity": 11679.234211047318, "RawProfitPerc": 0.17625496907943766 }] }]
// plotHistory(allSimTrades)

function getAllShareResults() {
  return new Promise((resolve, reject) => {
    let hd = {
      // "Content-Type": "application/json",
      // Authorization: user.password,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    }
    axios
      .get(baseURL + "/getallshareresults?user=" + userID, {
        headers: hd,
        mode: "cors",
      })
      .then((res) => {
        resolve(res.data)
      })
      .catch((error) => {
        console.log(error);
      });
  })
}

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
      mode: "cors",
    })
    .then((res) => {
      let sel = document.getElementById('resSelect');
      let opt = document.createElement('option');
      sel.length = 0
      opt.appendChild(document.createTextNode("History..."));
      sel.appendChild(opt);
      res.data.forEach((l) => {
        // get reference to select element
        let sel = document.getElementById('resSelect');
        // create new option element
        let opt = document.createElement('option');
        // create text node to add to option element (opt)
        getAllShareResults().then((result) => {
          if (result.includes(l.split(".")[0])) {
            opt.appendChild(document.createTextNode(l + " (Shared)"));
          } else {
            opt.appendChild(document.createTextNode(l));
          }
        })

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

function loadSavedCandles() {
  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }
  axios
    .get(baseURL + "/savedCandlesHistory?user=" + userID, {
      headers: hd,
      mode: "cors",
    })
    .then((res) => {
      let sel = document.getElementById('candlesSelect');
      let opt = document.createElement('option');
      sel.length = 0

      opt.appendChild(document.createTextNode("Candles..."));
      sel.appendChild(opt);
      // console.log(res.data)
      if (res.data != null) {
        res.data.forEach((l) => {
          // get reference to select element
          let sel = document.getElementById('candlesSelect');
          // create new option element
          let opt = document.createElement('option');
          // create text node to add to option element (opt)

          opt.appendChild(document.createTextNode(l));

          // set value property of opt
          opt.value = l.split(".")[0];
          // add opt to end of select box (sel)
          sel.appendChild(opt);
        })
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

loadSavedCandles()

function loadProgressBar(progress) {
  document.getElementById("progress").style.display = "block";
  document.getElementById("progressBar").style = `width: ${progress}%`
  if (progress >= 98) {
    setTimeout(() => {
      document.getElementById("progress").style.display = "none";
    }, 1000)
  }
}

function connectWs(id) {
  wsStatus.innerText = "Loading websockets..."
  var socket
  try {
    socket = new WebSocket("ws://localhost:8001/ws-cm/" + "5632499082330112");
    console.log(socket)
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

      // Progress bar
      if (JSON.parse(msg.data) != undefined && parseFloat(JSON.parse(msg.data).Data[0].Progress) > 0) {
        loadProgressBar(JSON.parse(msg.data).Data[0].Progress)
      }

      // Scatter plot
      if (JSON.parse(msg.data) != undefined && JSON.parse(msg.data).Data[0].Duration > 0) {
        //check if concat needed, or new data
        // console.log(JSON.parse(msg.data))

        if (existingWSResIDPC === "" || existingWSResIDPC !== JSON.parse(msg.data).ResultID) {
          allScatter = JSON.parse(msg.data).Data

          indexScan = 1
          //if candlestick chart empty
          d3.selectAll("#scatterPlot > *").remove();
          d3.selectAll("#selectButtonY > *").remove();
          d3.selectAll("#selectButtonX > *").remove();
          d3.selectAll("#histogram > *").remove();
          scanHistory(allScatter)
          drawScatterPlot(allScatter)
          histogram(allScatter)
          //save res id so next messages with same ID will be concatenated with existing data
          existingWSResIDPC = JSON.parse(msg.data).ResultID
        } else {

          indexScan = 1
          //add new data to existing array
          allScatter = allScatter.concat(JSON.parse(msg.data).Data)

          d3.selectAll("#scatterPlot > *").remove();
          d3.selectAll("#selectButtonY > *").remove();
          d3.selectAll("#selectButtonX > *").remove();
          d3.selectAll("#histogram > *").remove();
          scanHistory(allScatter)
          drawScatterPlot(allScatter)
          histogram(allScatter)
        }
      }

      //candlestick
      if (JSON.parse(msg.data) != undefined && parseFloat(JSON.parse(msg.data).Data[0].Open) > 0) {
        candleChartSlider()
      
        //check if concat needed, or new data
        if (existingWSResID === "" || existingWSResID !== JSON.parse(msg.data).ResultID) {
          allCandles = JSON.parse(msg.data).Data

          //if candlestick chart empty
          drawChart(0, candleDisplayNumber)
          volumeGraph(0, candleDisplayNumber)
          if (candleDisplayNumber < allCandles.length) {
            //show right arrow btn
            document.getElementById("panCandlesRightBtn").style.display = "inline"
          }

          //save res id so next messages with same ID will be concatenated with existing data
          existingWSResID = JSON.parse(msg.data).ResultID
        } else {
          //add new data to existing array
          JSON.parse(msg.data).Data.forEach(newData => {
            allCandles.push(newData)
          })
          if (candleDisplayNumber < allCandles.length) {
            //show right arrow btn
            document.getElementById("panCandlesRightBtn").style.display = "inline"
          }
          drawChart(0, candleDisplayNumber)
          volumeGraph(0, allCandles.slice(start, end))
        }
        if (loadHistory) {
          loadProgressBar(100)
        }
      }

      //profit curve
      if (JSON.parse(msg.data) != undefined && (JSON.parse(msg.data).Data[0].Data != null) && parseFloat(JSON.parse(msg.data).Data[0].Data[0].Equity) > 0) {

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
        if (loadHistory) {
          loadProgressBar(70)
        }
      }

      //sim trades
      if (((JSON.parse(msg.data) != undefined) && (JSON.parse(msg.data).Data[0].Data != null) && (parseFloat(JSON.parse(msg.data).Data[0].Data[0].EntryPrice) > 0))) {
        if (existingWSResIDST === "" || existingWSResIDST !== JSON.parse(msg.data).ResultID) {
          allSimTrades = JSON.parse(msg.data).Data
          //if candlestick chart empty
          indexST = 1
          d3.selectAll("#history > *").remove();

          plotHistory(JSON.parse(msg.data).Data)

          //save res id so next messages with same ID will be concatenated with existing data
          existingWSResIDST = JSON.parse(msg.data).ResultID
        } else {
          //add new data to existing array
          indexST = 1
          allSimTrades[0].Data = allSimTrades[0].Data.concat(JSON.parse(msg.data).Data[0].Data)
          d3.selectAll("#history > *").remove();

          plotHistory(allSimTrades)
        }
        if (loadHistory) {
          loadProgressBar(80)
        }
      }
    };
  }
}
connectWs(userID)
// Progress bar reset
loadHistory = false

let riskInput
let leverageInput
let sizeInput
getInputValues()

function computeBacktest() {
  //clear charts
  allCandles = []
  allProfitCurve = []
  allSimTrades = []
  plotHistory(allSimTrades)

  let ticker = document.getElementById("tickerSelect").value
  let period = document.getElementById("periodSelect").value
  let startTimeStr = new Date(Math.abs((new Date(getPickerDateTime("startDateTimePicker")))) + getLocalTimezone()).toISOString().split(".")[0]
  let endTimeStr = new Date(Math.abs((new Date(getPickerDateTime("endDateTimePicker")))) + getLocalTimezone()).toISOString().split(".")[0]

  allCandles = [] // all individual candles
  displayCandlesChunks = [] // chunks of candles for display

  let operation = (document.getElementById("modeTogglerBtn").innerHTML === "Switch to Scan Mode") ? "BACKTEST" : "SCAN"
  let chunkProcessOption = (document.getElementById("chunkProcessTogglerBtn").innerHTML === "Switch to Waterfall") ? "RAINDROPS" : "WATERFALL"

  let backendInfo = {
    "process": chunkProcessOption,
    "retrieveCandles": retrieveCandles,
    "operation": operation,
    "ticker": ticker,
    "period": period,
    "time_start": startTimeStr,
    "time_end": endTimeStr,
    "candlePacketSize": "80",
    "user": userID,
    "risk": document.getElementById('risk').value,
    "leverage": document.getElementById('leverage').value,
    "size": document.getElementById('size').value
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
      mode: "cors",
    })
    .then(() => {
      selectedRes = document.getElementById('startDateTimePicker').value + ":00~" + document.getElementById('endDateTimePicker').value + ":00(" + document.getElementById('periodSelect').value + ", " + document.getElementById('tickerSelect').value + ")"
      if (!retrieveCandles) {
        document.getElementById("saveCandles").style.display = "block"
      }
      setTimeout(() => {
        loadResult()
        document.getElementById("shareResult").style = "display: inline;"
      }, 1000)
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
  }
  function leverageFunc(e) {
    leverageInput = e.target.value;
  }
  function sizeFunc(e) {
    sizeInput = e.target.value;
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
      mode: "cors",
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
  selectedRes = s.value
  loadHistory = true

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
      mode: "cors",
    })
    .then((res) => {
      document.getElementById("risk").value = res.data[0]
      document.getElementById("leverage").value = res.data[1]
      document.getElementById("size").value = res.data[2]
      document.getElementById("shareResult").style = "display: block;"
    })
    .catch((error) => {
      console.log(error);
    });
}

function shareResult() {
  var titleText = document.getElementById("shareTitle").value
  var descText = document.getElementById("shareDesc").value

  // var s = document.getElementById("resSelect")
  // selectedRes = s.value

  let result = {
    "title": titleText,
    "description": descText,
    "resultFileName": selectedRes,
    "userID": userID
  }

  let hd = {
    // "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }
  axios
    .post(baseURL + "/shareresult", result, {
      headers: hd,
      mode: "cors",
    })
    .then((res) => {
      copyLink = "http://127.0.0.1:5500/index.html?share=" + res.data.shareID
      document.getElementById("copyLink").style = "display: block;"
      document.getElementById("shareBtn").style = "display: none;"
    })
    .catch((error) => {
      console.log(error);
    });
}

function sharedLink() {
  if (getParams(window.location.href).share) {
    let shareLink = getParams(window.location.href).share
    loadHistory = true
    let hd = {
      // "Content-Type": "application/json",
      // Authorization: user.password,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    }
    axios
      .get(baseURL + "/getshareresult?share=" + shareLink, {
        headers: hd,
        // mode: "cors",
      })
      .then((res) => {
        var startTimeInput = document.getElementById("startDateTimePicker")
        var endTimeInput = document.getElementById("endDateTimePicker")
        var periodInput = document.getElementById("periodSelect")
        var tickerInput = document.getElementById("tickerSelect")
        document.getElementById("risk").value = parseFloat(res.data[0])
        document.getElementById("leverage").value = parseFloat(res.data[1])
        document.getElementById("size").value = parseFloat(res.data[2])
        var selectedOptionText = res.data[3]
      
        startTimeInput.value = selectedOptionText.substring(0, selectedOptionText.indexOf("~")).replace("_", "T").slice(0, -3)
        endTimeInput.value = selectedOptionText.substring(selectedOptionText.indexOf("~") + 1, selectedOptionText.indexOf("(")).replace("_", "T").slice(0, -3)
        periodInput.value = selectedOptionText.substring(selectedOptionText.indexOf("(") + 1, selectedOptionText.indexOf(","))
        tickerInput.value = selectedOptionText.substring(selectedOptionText.indexOf(" ") + 1, selectedOptionText.indexOf(")"))
      })
      .catch((error) => {
        console.log(error);
      });

    let randomID = Date.now().toString().concat(generateString(20))
    connectWs(randomID)
  }
}

sharedLink()

function saveCandlesToJson() {
  setTimeout(() => {
    loadResult()
    document.getElementById("saveCandles").style.display = "none"
  }, 500)
  let hd = {
    "Content-Type": "application/json",
    // Authorization: user.password,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  }
  axios
    .post(baseURL + "/saveCandlesToJson", allCandles, {
      headers: hd,
      mode: "cors",
    })
    .then((res) => {
    })
    .catch((error) => {
      console.log(error);
    });
}

function drawChart(start, end) {
  // Show Legend for SMA
  document.getElementById('legendLabel1SMA').style.display = "block"
  document.getElementById('legendCheckbox1SMA').style.display = "block"
  document.getElementById('legendLabel2SMA').style.display = "block"
  document.getElementById('legendCheckbox2SMA').style.display = "block"
  document.getElementById('legendLabel3SMA').style.display = "block"
  document.getElementById('legendCheckbox3SMA').style.display = "block"
  document.getElementById('legendLabel4SMA').style.display = "block"
  document.getElementById('legendCheckbox4SMA').style.display = "block"

  // Show Legend for EMA
  document.getElementById('legendLabel1EMA').style.display = "block"
  document.getElementById('legendCheckbox1EMA').style.display = "block"
  document.getElementById('legendLabel2EMA').style.display = "block"
  document.getElementById('legendCheckbox2EMA').style.display = "block"
  document.getElementById('legendLabel3EMA').style.display = "block"
  document.getElementById('legendCheckbox3EMA').style.display = "block"
  document.getElementById('legendLabel4EMA').style.display = "block"
  document.getElementById('legendCheckbox4EMA').style.display = "block"

  let candlesToShow = allCandles.slice(start, end)
  // console.log(JSON.stringify(candlesToShow))
  if (!candlesToShow || candlesToShow.length == 0) {
    return
  }

  //reset chart
  d3.selectAll("#container > *").remove();

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

  var svg = d3.select("#container")
    // .attr("width", "100%")
    // .attr("height", "110%")
    // .attr("padding-bottom", "3rem")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 1200 " + candlesViewBoxHeight)
    .classed("svg-content", true)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top * 2 + ")")

  var xmin = d3.min(dateTimes);
  var xmax = d3.max(dateTimes);
  var xScale = d3.scaleLinear().domain([-1, dateTimes.length])
    .range([0, w])
  var xDateScale = d3.scaleQuantize().domain([0, dateTimes.length]).range(dateTimes)
  let xBand = d3.scaleBand().domain(d3.range(-1, dateTimes.length)).range([0, w]).padding(0.3)
  var xAxis = d3.axisBottom()
    .scale(xScale).ticks(tickNumCandles)
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

  var smaValues = []
  for (var i = 1; i < 5; i++) {
    smaValues.push(...candlesToShow.map(r => r["sma"+i.toString()]).filter(s => s !== 0))
  }

  var emaValues = []
  for (var i = 1; i < 5; i++) {
    emaValues.push(...candlesToShow.map(r => r["ema"+i.toString()]).filter(e => e !== 0))
  }

  var ymin = d3.min(candlesToShow.map(r => r.Low).concat(emaValues).concat(smaValues));
  var ymax = d3.max(candlesToShow.map(r => r.High).concat(emaValues).concat(smaValues));
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

  // SMAs
  let sma1 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "lightblue")
    .style("stroke-width", 1)
    .style("stroke-dasharray", ("2, 5"))
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? yScale(candlesToShow[i-1].sma1) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? yScale(d.sma1) : null);

  document.getElementById('legendCheckbox1SMA').addEventListener('change', function () {
    checked1SMA = this.checked
    if (checked1SMA) {
      sma1.style("display", "block");
    } else {
      sma1.style("display", "none");
    }
  })

  if (checked1SMA) {
    sma1.style("display", "block");
  } else {
    sma1.style("display", "none");
  }

  let sma2 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "chartreuse")
    .style("stroke-width", 1)
    .style("stroke-dasharray", ("2, 5"))
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? yScale(candlesToShow[i-1].sma2) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? yScale(d.sma2) : null);

  document.getElementById('legendCheckbox2SMA').addEventListener('change', function () {
    checked2SMA = this.checked
    if (checked2SMA) {
      sma2.style("display", "block");
    } else {
      sma2.style("display", "none");
    }
  })

  if (checked2SMA) {
    sma2.style("display", "block");
  } else {
    sma2.style("display", "none");
  }

  let sma3 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "orange")
    .style("stroke-width", 1)
    .style("stroke-dasharray", ("2, 5"))
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? yScale(candlesToShow[i-1].sma3) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? yScale(d.sma3) : null);

  document.getElementById('legendCheckbox3SMA').addEventListener('change', function () {
    checked3SMA = this.checked
    if (checked3SMA) {
      sma3.style("display", "block");
    } else {
      sma3.style("display", "none");
    }
  })

  if (checked3SMA) {
    sma3.style("display", "block");
  } else {
    sma3.style("display", "none");
  }

  let sma4 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "red")
    .style("stroke-width", 1)
    .style("stroke-dasharray", ("2, 5"))
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? yScale(candlesToShow[i-1].sma4) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? yScale(d.sma4) : null);

  document.getElementById('legendCheckbox4SMA').addEventListener('change', function () {
    checked4SMA = this.checked
    if (checked4SMA) {
      sma4.style("display", "block");
    } else {
      sma4.style("display", "none");
    }
  })

  if (checked4SMA) {
    sma4.style("display", "block");
  } else {
    sma4.style("display", "none");
  }

  // EMAs
  let ema1 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "lightblue")
    .style("stroke-width", 1)
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? yScale(candlesToShow[i-1].ema1) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? yScale(d.ema1) : null);

  document.getElementById('legendCheckbox1EMA').addEventListener('change', function () {
    checked1EMA = this.checked
    if (checked1EMA) {
      ema1.style("display", "block");
    } else {
      ema1.style("display", "none");
    }
  })

  if (checked1EMA) {
    ema1.style("display", "block");
  } else {
    ema1.style("display", "none");
  }

  let ema2 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "chartreuse")
    .style("stroke-width", 1)
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? yScale(candlesToShow[i-1].ema2) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? yScale(d.ema2) : null);

  document.getElementById('legendCheckbox2EMA').addEventListener('change', function () {
    checked2EMA = this.checked
    if (checked2EMA) {
      ema2.style("display", "block");
    } else {
      ema2.style("display", "none");
    }
  })

  if (checked2EMA) {
    ema2.style("display", "block");
  } else {
    ema2.style("display", "none");
  }

  let ema3 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "orange")
    .style("stroke-width", 1)
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? yScale(candlesToShow[i-1].ema3) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? yScale(d.ema3) : null);

  document.getElementById('legendCheckbox3EMA').addEventListener('change', function () {
    checked3EMA = this.checked
    if (checked3EMA) {
      ema3.style("display", "block");
    } else {
      ema3.style("display", "none");
    }
  })

  if (checked3EMA) {
    ema3.style("display", "block");
  } else {
    ema3.style("display", "none");
  }

  let ema4 = chartBody.selectAll("g.line")
    .data(candlesToShow)
    .enter()
    .append('line')
    .style("stroke", "red")
    .style("stroke-width", 1)
    .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? xScale(i-1) - xBand.bandwidth() / 2 : null)
    .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? yScale(candlesToShow[i-1].ema4) : null)
    .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? xScale(i) - xBand.bandwidth() / 2 : null)
    .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? yScale(d.ema4) : null);

  document.getElementById('legendCheckbox4EMA').addEventListener('change', function () {
    checked4EMA = this.checked
    if (checked4EMA) {
      ema4.style("display", "block");
    } else {
      ema4.style("display", "none");
    }
  })

  if (checked4EMA) {
    ema4.style("display", "block");
  } else {
    ema4.style("display", "none");
  }

  // Add index to Price Array
  candlesToShow.map(p => p["index"] = candlesToShow.indexOf(p))

  // Create Label Top
  let labelXMoveTop = 4
  let labelYMoveTop = 10
  let labelTextTop = chartBody.selectAll("labelTextTop")
    .data(candlesToShow.filter((p) => { return p.LabelTop !== "" }))
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.index) - labelXMoveTop - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.High) - labelYMoveTop)
    .attr("stroke", "white")
    .attr("fill", "white")
    .attr("stroke-width", candlestickLabelStroke)
    .attr("font-family", "Courier")
    .attr("font-size", candlestickChartLabelFontSize)
    .attr("font-weight", "bold")
    .attr("z-index", "100")
    .text(d => d.LabelTop);

  // Create Label Middle
  let labelXMoveMid = 7
  let labelTextMid = chartBody.selectAll("labelTextMid")
    .data(candlesToShow.filter((p) => { return p.LabelMiddle !== "" }))
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.index) - labelXMoveMid - xBand.bandwidth() / 2)
    .attr("y", d => yScale((d.Open + d.Close) / 2))
    .attr("stroke", "white")
    .attr("fill", "white")
    .attr("stroke-width", candlestickLabelStroke)
    .attr("font-family", "Courier")
    .attr("font-size", candlestickChartLabelFontSize)
    .attr("font-weight", "bold")
    .attr("z-index", "100")
    .text(d => d.LabelMiddle);

  // Create Label Bottom
  let labelXMoveBot = 4
  let labelYMoveBot = 30
  let labelTextBot = chartBody.selectAll("labelTextBot")
    .data(candlesToShow.filter((p) => { return p.LabelBottom !== "" }))
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.index) - labelXMoveBot - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.Low) + labelYMoveBot)
    .attr("stroke", "white")
    .attr("fill", "white")
    .attr("stroke-width", candlestickLabelStroke)
    .attr("font-family", "Courier")
    .attr("font-size", candlestickChartLabelFontSize)
    .attr("font-weight", "bold")
    .attr("z-index", "100")
    .text(d => d.LabelBottom);

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

  let entryLine = chartBody.selectAll("entryLine")
    .data(candlesToShow.filter((p) => { return p.StratEnterPrice != 0 }))
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.StratEnterPrice) + pointerYMove)
    .attr("width", pointerWidth + 6)
    .attr("height", 2)
    .attr("fill", "white")

  // let exitLine
  // candlesToShow.filter((p) => { return p.StratExitPrice != 0 }).forEach((c) => {
  //   if (c.StratExitPrice.length > 1) {
  //     c.StratExitPrice.forEach((g) => {
  //       exitLine = chartBody.selectAll("exitLine")
  //         .data(candlesToShow.filter((p) => { return p.StratExitPrice.length != 0 }))
  //         .enter()
  //         .append("rect")
  //         .attr("x", (d) => xScale(c.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2)
  //         .attr("y", (d) => yScale(g) + pointerYMove)
  //         .attr("width", pointerWidth + 6)
  //         .attr("height", 2)
  //         .attr("fill", "white")
  //       // .attr("transform", "rotate(" + rotateAngle + "," + 20 + "," + 20 + ")");
  //     })
  //   } else {
  //     exitLine = chartBody.selectAll("exitLine")
  //       .data(candlesToShow.filter((p) => { return p.StratExitPrice.length != 0 }))
  //       .enter()
  //       .append("rect")
  //       .attr("x", (d) => xScale(c.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2)
  //       .attr("y", (d) => yScale(c.StratExitPrice[0]) + pointerYMove)
  //       .attr("width", pointerWidth + 6)
  //       .attr("height", 2)
  //       .attr("fill", "white")
  //   }
  // })

  // exitLine = chartBody.selectAll("exitLine")
  // .data(candlesToShow.filter((p) => { return p.StratExitPrice.length != 0 }))
  // .enter()
  // .append("rect")
  // .attr("x", (d) => xScale(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2)
  // // .attr("y", d => console.log(d))
  // .attr("y", d => yScale(d.StratExitPrice) + pointerYMove)
  // .attr("width", pointerWidth+6)
  // .attr("height", 2)
  // .attr("fill", "white")

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


  let stemsXArray = []
  stems.selectAll(".stem")._parents.forEach(e => {
    stemsXArray.push(e.x1.baseVal.value)
  });

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
      d3.axisBottom(xScaleZ).ticks(tickNumCandles).tickFormat((d, e, target) => {
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
    labelTextTop.attr("x", (d, i) => xScaleZ(d.index) - labelXMoveTop - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
    labelTextMid.attr("x", (d, i) => xScaleZ(d.index) - labelXMoveMid - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
    labelTextBot.attr("x", (d, i) => xScaleZ(d.index) - labelXMoveBot - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)

    // Pointers X Zooming
    enterPointer.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
    exitPointer.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
    entryLine.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)
    // exitLine.attr("x", (d, i) => xScaleZ(d.index) - pointerWidth / 2 - pointerXMove - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5)

    // SMAs
    sma1
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

    sma2
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

    sma3
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

    sma4
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

    // EMAs
    ema1
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

    ema2
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

    ema3
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

    ema4
      .attr("x1", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? xScaleZ(i-1) - xBand.bandwidth() / 2 : null)
      .attr("x2", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? xScaleZ(i) - xBand.bandwidth() / 2 : null)

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
      labelTextTop.transition().duration(100)
        .attr("y", (d) => yScale(d.High) - labelYMoveTop)
      labelTextMid.transition().duration(100)
        .attr("y", (d) => yScale((d.Open + d.Close) / 2))
      labelTextBot.transition().duration(100)
        .attr("y", (d) => yScale(d.Low) + labelYMoveBot)

      // Pointers Y Zooming
      enterPointer.transition().duration(100)
        .attr("y", (d) => yScale(d.Low) + labelYMoveTop)
      exitPointer.transition().duration(100)
        .attr("y", (d) => yScale(d.Low) + labelYMoveTop)
      entryLine.transition().duration(100)
        .attr("y", (d) => yScale(d.StratEnterPrice) + labelYMoveTop)

      // SMAs
      sma1.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? yScale(candlesToShow[i-1].sma1) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma1 !== 0 ? yScale(d.sma1) : null);

      sma2.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? yScale(candlesToShow[i-1].sma2) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma2 !== 0 ? yScale(d.sma2) : null);

      sma3.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? yScale(candlesToShow[i-1].sma3) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma3 !== 0 ? yScale(d.sma3) : null);

      sma4.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? yScale(candlesToShow[i-1].sma4) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].sma4 !== 0 ? yScale(d.sma4) : null);

      // EMAs
      ema1.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? yScale(candlesToShow[i-1].ema1) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema1 !== 0 ? yScale(d.ema1) : null);

      ema2.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? yScale(candlesToShow[i-1].ema2) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema2 !== 0 ? yScale(d.ema2) : null);

      ema3.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? yScale(candlesToShow[i-1].ema3) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema3 !== 0 ? yScale(d.ema3) : null);

      ema4.transition().duration(100)      
        .attr("y1", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? yScale(candlesToShow[i-1].ema4) : null)
        .attr("y2", (d, i) => i !== 0 && candlesToShow[i-1].ema4 !== 0 ? yScale(d.ema4) : null);

      // candlesToShow.filter((p) => { return p.StratExitPrice != 0 }).forEach((c) => {
      //   c.StratExitPrice.forEach((g) => {
      //     console.log(g)
      //     exitLine.transition().duration(100)
      //       .attr("y", (d) => yScale(g) + labelYMoveTop)
      //   })
      // })


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
        if ((mouse[0] > (x - 4)) && (mouse[0] < (x + 4))) {
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

function volumeGraph(start, end) {
  //reset chart
  d3.selectAll("#volumeGraph > *").remove();

  let data = allCandles.slice(start, end)
  let data1 = []
  let data2 = []
  let data3 = []
  let allVolAverage = []
  data.forEach(d => {
    data1.push({"VolumeAverage": d.VolumeAverage[0], "DateTime": d.DateTime})
    data2.push({"VolumeAverage": d.VolumeAverage[1], "DateTime": d.DateTime})
    data3.push({"VolumeAverage": d.VolumeAverage[2], "DateTime": d.DateTime})

    if (d.VolumeAverage[0] != undefined) {
      allVolAverage.push(d.VolumeAverage[0])
    }
    if (d.VolumeAverage[1] != undefined) {
      allVolAverage.push(d.VolumeAverage[1])
    }
    if (d.VolumeAverage[2] != undefined) {
      allVolAverage.push(d.VolumeAverage[2])
    }
  })
  let volumeData = [{"key": "Data1", "values": data1}, {"key": "Data2", "values": data2}, {"key": "Data3", "values": data3}]

  // console.log(data1[0]["DateTime"], data3[data3.length - 1]["DateTime"])
  // console.log(d3.extent(data, function(d) { return d.DateTime; }))
 
  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 20, bottom: 205, left: 45},
  width = 860 - margin.left - margin.right,
  height = 800 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#volumeGraph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

  // group the data: I want to draw one line per group
  // var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
  // .key(function(d) { return d.name;})
  // .entries(data);

  // Add X axis --> it is a date format
  var x = d3.scaleTime()
  .domain(d3.extent(data, function(d) { return d.DateTime; }))
  .range([ 0, width ]);
  svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x).ticks(5))
  .style("color", "white")
  .attr("stroke", "white")

  // Add Y axis
  var y = d3.scaleLinear()
  .domain([0, d3.max(allVolAverage)])
  .range([ height, 0 ]);
  svg.append("g")
  .call(d3.axisLeft(y))
  .style("color", "white")
  .attr("stroke", "white")

  // color palette
  var res = volumeData.map(function(d){ return d.key }) // list of group names
  var color = d3.scaleOrdinal()
  .domain(res)
  .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

  // Draw the line
  svg.selectAll(".line")
    .data(volumeData)
    .enter()
    .append("path")
      .attr("fill", "none")
      .attr("stroke", function(d){ return color(d.key) })
      .attr("stroke-width", 1.5)
      .attr("d", function(d){
        return d3.line()
          .x(function(d) { return x(d.DateTime); })
          .y(function(d,i) { return y(d.VolumeAverage != undefined? d.VolumeAverage : 0); })
          (d.values)
      })
}

/// PROFIT CURVE
function drawPC(data) {
  //  Calculate starting, ending, and Growth
  document.getElementById("startingCapital").innerHTML = data[0].Data[0].Equity.toFixed(2)

  data.forEach(function (d) {
    d.Data.forEach(function (point) {
      document.getElementById("endingCapital").innerHTML = point.Equity.toFixed(2)
    })
  })

  document.getElementById("growth").innerHTML = ((document.getElementById("endingCapital").innerHTML - document.getElementById("startingCapital").innerHTML) / document.getElementById("startingCapital").innerHTML * 100).toFixed(3) + "%"

  // console.log(JSON.stringify(data))
  d3.selectAll("#profit > *").remove();
  var pcMargin = { top: 0, right: 20, bottom: 30, left: 45 },
    width = 600 - pcMargin.left - pcMargin.right,
    height = 300 - pcMargin.top - pcMargin.bottom;

  //mobile display options
  if (screen.availWidth < 700) {
    width = 600 - pcMargin.left - pcMargin.right;
    height = 400 - pcMargin.top - pcMargin.bottom;
  }

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
  y.domain([d3.min(data, function (d) {
    let minValue = []
    let findMin = (key, value) => {
      if (key !== "date") {
        minValue.push(value)
      }
    }
    useKeyAndValue(findMin, d)
    return 0.85 * (Math.min(...minValue));
  })
    , d3.max(data, function (d) {
      let maxValue = []
      let findMax = (key, value) => {
        if (key !== "date") {
          maxValue.push(value)
        }
      }
      useKeyAndValue(findMax, d)
      return 1.03 * (Math.max(...maxValue));
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
    .style("font-size", pcFontSz)
    .call(d3.axisBottom(x).ticks(tickNumProfitX))
    .style("color", "white")
    .attr("stroke", "white")

  // Add the Y Axis
  pcSvg.append("g")
    .call(d3.axisLeft(y).ticks(tickNumProfitY))
    .style("color", "white")
    .style("font-size", pcFontSz)
    .attr("stroke", "white")

  // This allows to find the closest X index of the mouse:
  var bisect = d3.bisector(function(d) { return d.date; }).left;

  // Create the circle that travels along the curve of chart
  var focus = pcSvg
    .append('g')
    .append('circle')
      .style("fill", "none")
      .attr("stroke", "white")
      .attr('r', 8.5)
      .style("opacity", 0)

  // Add the line
  pcSvg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function(d) { return x(d.date) })
      .y(function(d) { return y(d.strat1) })
      )

  // Create a rect on top of the svg area: this rectangle recovers mouse position
  pcSvg
    .append('rect')
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('width', width)
    .attr('height', height)
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseout);


  // What happens when the mouse move -> show the annotations at the right positions.
  function mouseover() {
    focus.style("opacity", 1)
  }

  function mousemove() {
    // recover coordinate we need
    var x0 = x.invert(d3.mouse(this)[0]);
    var i = bisect(data, x0, 0);
    selectedData = data[i]
    focus
      .attr("cx", x(selectedData.date))
      .attr("cy", y(selectedData.strat1))
    document.getElementById("profitText").innerText = "Date: "+ selectedData.date + "\nProfit: " + selectedData.strat1
    document.getElementById("profitText").style = "color: white"
    }
  function mouseout() {
    focus.style("opacity", 0)
  }
}

/// SIMULATED TRADES
function plotHistory(data) {
  if (data === undefined || !data.length || data.length === 0) {
    var table = document.getElementById("history")
    table.innerHTML = ""
    // let row = table.insertRow()
    // let tableHeader = ["Index", "Profit", "Raw Profit Perc", "Entry Price", "Exit Price", "Risked Equity", "Date", "Fees", "Position Size", "Direction", "Parameter"]
    // tableHeader.forEach(t => {
    //   let newCell = row.insertCell()
    //   newCell.innerHTML = t
    //   newCell.className = "thead"
    // })
    document.getElementById("numOfRows").innerHTML = "(0)"
    return
  }

  // Number of rows
  document.getElementById("numOfRows").innerHTML = "Total: (" + data[0].Data.length.toString() + ")" + " / Entries: " + "(" + data[0].Data.filter((d) => { return d.EntryDateTime.length != 0 }).length.toString() + ")"

  var tableHeader = document.getElementById("history")
  tableHeader.innerHTML = ""
  let row = tableHeader.insertRow()
  let tableHeaderEle = ["EntryDateTime", "ExitDateTime", "Profit($)", "Position Size", "Exit Price", "Raw Profit(%)", "Entry Price", "Risked Equity", "Fees($)", "Direction", "pivotLowsToEnter", "maxDurationCandles", "slPerc", "slCooldownCandles", "tpSingle", "Index", "Parameter"]

  tableHeaderEle.forEach(t => {
    let newCell = row.insertCell()
    newCell.innerHTML = t
    newCell.className = "thead"
  })

  var table = document.getElementById("history")

  //for each param
  data.forEach((d) => {
    //for each trade history item in that param
    d.Data.forEach((s, i) => {
      let row = table.insertRow()
      row.insertCell().innerHTML = s.EntryDateTime
      row.insertCell().innerHTML = s.ExitDateTime
      row.insertCell().innerHTML = s.Profit != undefined ? s.Profit.toFixed(4) : s.Profit
      row.insertCell().innerHTML = s.PosSize != undefined ? s.PosSize.toFixed(6) : s.PosSize
      row.insertCell().innerHTML = s.ExitPrice != undefined ? s.ExitPrice.toFixed(2) : s.ExitPrice
      row.insertCell().innerHTML = s.RawProfitPerc != undefined ? s.RawProfitPerc.toFixed(2) : s.RawProfitPerc
      row.insertCell().innerHTML = s.EntryPrice != undefined ? s.EntryPrice.toFixed(4) : s.EntryPrice
      row.insertCell().innerHTML = s.RiskedEquity != undefined ? s.RiskedEquity.toFixed(3) : s.RiskedEquity
      row.insertCell().innerHTML = s.TotalFees != undefined ? s.TotalFees.toFixed(3) : s.TotalFees
      row.insertCell().innerHTML = s.Direction
      row.insertCell().innerHTML = s.Settings["pivotLowsToEnter"]
      row.insertCell().innerHTML = s.Settings["maxDurationCandles"]
      row.insertCell().innerHTML = s.Settings["slPerc"]
      row.insertCell().innerHTML = s.Settings["slCooldownCandles"]
      row.insertCell().innerHTML = s.Settings["tpSingle"]
      row.insertCell().innerHTML = indexST
      row.style.color = "white"
      //param name
      let param = row.insertCell()
      param.innerHTML = d.DataLabel
      param.style.color = "white"

      //color row based on profitability
      var entry = parseFloat(s.EntryPrice)
      var exit = parseFloat(s.ExitPrice)
      if (s.RawProfitPerc > 0) {
        row.style.backgroundColor = "#005e03"
      } else if (s.RawProfitPerc < 0) {
        row.style.backgroundColor = "#ad0000"
      }
      indexST += 1
    })
  })
}

/// SCAN HISTORY
function scanHistory(data) {
  if (data === undefined || !data.length || data.length === 0) {
    var table = document.getElementById("scanHistory")
    table.innerHTML = ""
    let row = table.insertRow()
    let tableHeader = ["Index", "Entry Time", "Entry Trade Open Candle", "Entry Last PL Index", "Actual Entry Index", "Extent Time", "Duration", "Growth", "Break Index"]
    tableHeader.forEach(t => {
      let newCell = row.insertCell()
      newCell.innerHTML = t
      newCell.className = "thead"
    })
    document.getElementById("scanNumOfRows").innerHTML = "(0)"
    return
  }

  // Number of rows
  document.getElementById("scanNumOfRows").innerHTML = "(" + data.length.toString() + ")"

  var table = document.getElementById("scanHistory")
  table.innerHTML = ""
  let row = table.insertRow()
  let tableHeader = ["Checkbox", "Entry Time", "Growth", "FirstLastPriceDiff", "AvgPivotsPriceDiffPerc", "FirstLastDuration", "EndAction", "MaxDrawdownTrailExtent(%)", "Duration to Extent(candles)", "Entry Index", "ExtentTime", "BreakTime", "Max Raw Drawdown (%)", "Last PL Index", "Break Index", "i"]
  tableHeader.forEach(t => {
    let newCell = row.insertCell()
    newCell.innerHTML = t
    newCell.className = "thead"
  })

  let removedData = data

  //for each param
  data.forEach((s) => {
    // creating checkbox element
    var checkbox = document.createElement('input');

    // Assigning the attributes to created checkbox
    checkbox.type = "checkbox";
    checkbox.value = "value";
    checkbox.class = "checkBoxTable";
    checkbox.id = s.EntryTime;
    checkbox.checked = true

    // If checkbox is unchecked, remove the data and display. If it's checked, add the data and display.
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        data.forEach((s) => {
          if (s.EntryTime == checkbox.id) {
            removedData.push(s)
            d3.selectAll("#scatterPlot > *").remove();
            d3.selectAll("#selectButtonY > *").remove();
            d3.selectAll("#selectButtonX > *").remove();
            d3.selectAll("#histogram > *").remove();
            drawScatterPlot(removedData)
            histogram(removedData)
          }
        })
      } else {
        data.forEach((s) => {
          if (s.EntryTime == checkbox.id) {
            removedData = removedData.filter(d => {
              return d != s
            })
            d3.selectAll("#scatterPlot > *").remove();
            d3.selectAll("#selectButtonY > *").remove();
            d3.selectAll("#selectButtonX > *").remove();
            d3.selectAll("#histogram > *").remove();
            drawScatterPlot(removedData)
            histogram(removedData)
          }
        })
      }
    });

    //for each trade history item in that param
    let row = table.insertRow()
    row.insertCell().appendChild(checkbox)
    row.insertCell().innerHTML = s.EntryTime
    row.insertCell().innerHTML = s.Growth.toFixed(4)
    row.insertCell().innerHTML = s.FirstLastEntryPivotPriceDiffPerc > 0 ? s.FirstLastEntryPivotPriceDiffPerc.toFixed(4) : s.FirstLastEntryPivotPriceDiffPerc
    row.insertCell().innerHTML = s.AveragePriceDiffPercEntryPivots > 0 ? s.AveragePriceDiffPercEntryPivots.toFixed(4) : s.AveragePriceDiffPercEntryPivots
    row.insertCell().innerHTML = s.FirstToLastEntryPivotDuration
    row.insertCell().innerHTML = s.EndAction
    row.insertCell().innerHTML = s.TrailingMaxDrawdownPercTillExtent
    row.insertCell().innerHTML = s.Duration
    row.insertCell().innerHTML = s.ActualEntryIndex
    row.insertCell().innerHTML = s.ExtentTime
    row.insertCell().innerHTML = s.BreakTime
    row.insertCell().innerHTML = s.MaxDrawdownPerc.toFixed(3)
    row.insertCell().innerHTML = s.EntryLastPLIndex
    row.insertCell().innerHTML = s.BreakIndex
    row.insertCell().innerHTML = indexScan

    row.style.color = "white"

    indexScan += 1
  })
}
var selectedOptionX

// Scatter plot
function drawScatterPlot(data) {
  data.forEach((e) => {
    e["EntryDate"] = new Date(Math.abs((new Date(e.EntryTime))))
    e["ExtentDate"] = new Date(Math.abs((new Date(e.ExtentTime))))
    e.Entry = new Date(Math.abs((new Date(e.EntryTime)))).getHours() + (new Date(Math.abs((new Date(e.EntryTime)))).getMinutes() / 60)
    e.Extent = new Date(Math.abs((new Date(e.ExtentTime)))).getHours() + (new Date(Math.abs((new Date(e.ExtentTime)))).getMinutes() / 60)
    // - getLocalTimezone()
  })
  // set the dimensions and margins of the graph
  var margin = { top: 10, right: 100, bottom: 30, left: 50 },
    width = 750 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#scatterPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // List of groups (here I have one group per column)
  var YOptions = ["Growth", "Duration", "TrailingMaxDrawdownPercTillExtent", "EntryDate", "ExtentDate", "Entry", "Extent", "MaxDrawdownPerc", "FirstLastEntryPivotPriceDiffPerc", "FirstToLastEntryPivotDuration", "AveragePriceDiffPercEntryPivots"]
  var XOptions = ["Duration", "TrailingMaxDrawdownPercTillExtent", "MaxDrawdownPerc", "Entry", "EntryDate", "ExtentDate", "Extent", "Growth", "FirstLastEntryPivotPriceDiffPerc", "FirstToLastEntryPivotDuration", "AveragePriceDiffPercEntryPivots"]

  let currentY = YOptions[0]
  let currentX = XOptions[0]

  // Window variables
  let startWindow = document.getElementById("startWindow")
  let endWindow = document.getElementById("endWindow")
  let startValue
  let endValue

  // Data for bargraph
  let barData = data

  // add the options to the button
  d3.select("#selectButtonY")
    .selectAll('myOptionsY')
    .data(YOptions)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button

  d3.select("#selectButtonX")
    .selectAll('myOptionsX')
    .data(XOptions)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button

  // Add X axis --> it is a date format
  var x = d3.scaleLinear()
    .domain(d3.extent(data.map((d) => { return d[currentX] })))
    .range([0, width]);
  var xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .attr("stroke", "white")
    .attr("font-size", "13px")

  // Add Y axis
  var y = d3.scaleLinear()
    .domain(d3.extent(data.map((d) => { return d[currentY] })))
    .range([height, 0]);
  var yAxis = svg.append("g")
    .call(d3.axisLeft(y))
    .attr("stroke", "white")
    .attr("font-size", "12px")

  // Initialize dots with group a
  var dot = svg
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr("cx", function (d) { return x(+d[currentX]) })
    .attr("cy", function (d) { return y(+d[currentY]) })
    .attr("r", 2)
    .style("fill", "#ff3bdb")


  // A function that update the chart
  function updateY(selectedGroup) {
    // Create new data with the selection?
    var dataFilter = data.map(function (d) { return { x: d[currentX], y: d[selectedGroup] } })
    // Give these new data to update line
    // line
    //     .datum(dataFilter)
    //     .transition()
    //     .duration(1000)
    //     .attr("d", d3.line()
    //       .x(function(d) { return x(+d.time) })
    //       .y(function(d) { return y(+d.value) })
    //     )

    // Add Y axis
    if (selectedGroup == "EntryDate" || selectedGroup == "ExtentDate") {
      y = d3.scaleTime()
        .domain(d3.extent(dataFilter.map((d) => { return d.y })))
        .range([height, 0]);
    } else {
      y = d3.scaleLinear()
        .domain(d3.extent(dataFilter.map((d) => { return d.y })))
        .range([height, 0]);
    }

    yAxis.transition().duration(1000).call(d3.axisLeft(y))

    dot
      .data(dataFilter)
      .transition()
      .duration(1000)
      .attr("cx", function (d) { return x(+d.x) })
      .attr("cy", function (d) { return y(+d.y) })

    currentY = selectedGroup
    calculateBarGraph(barData)
  }

  function updateX(selectedGroup, start = 0, end = 100000) {
    // Create new data with the selection?
    var dataFilter = data.map(function (d) { return { x: d[selectedGroup], y: d[currentY] } }).filter((d) => { return d.x >= start && d.x <= end })

    // Add X axis
    if (selectedGroup == "EntryDate" || selectedGroup == "ExtentDate") {
      x = d3.scaleTime()
        .domain(d3.extent(dataFilter.map((d) => { return d.x })))
        .range([0, width]);
    } else {
      x = d3.scaleLinear()
        .domain(d3.extent(dataFilter.map((d) => { return d.x })))
        .range([0, width]);
    }

    xAxis.transition().duration(1000).call(d3.axisBottom(x))

    // Deleting the old dots and making new ones
    d3.selectAll("circle").remove()

    svg
      .selectAll('circle')
      .data(dataFilter)
      .enter()
      .append('circle')
      .attr("cx", function (d) { return x(parseFloat(d.x)) })
      .attr("cy", function (d) { return y(parseFloat(d.y)) })
      .attr("r", 2)
      .style("fill", "#ff3bdb")

    currentX = selectedGroup
    barData = data.filter((d) => { return d[selectedGroup] >= start && d[selectedGroup] <= end })
    calculateBarGraph(barData)
  }

  var selectedOptionY
  // When the button is changed, run the updateChart function
  d3.select("#selectButtonY").on("change", function (d) {
    // recover the option that has been chosen
    selectedOptionY = d3.select(this).property("value")
    // run the updateChart function with this selected option
    updateY(selectedOptionY)
  })

  var selectedOptionX = "Duration"
  d3.select("#selectButtonX").on("change", function (d) {
    // Clean all window values
    startWindow.value = ""
    endWindow.value = ""
    startValue = null
    endValue = null

    // recover the option that has been chosen
    selectedOptionX = d3.select(this).property("value")
    // run the updateChart function with this selected option
    updateX(selectedOptionX)
  })

  // Create bar graph
  let chunkNumElement = document.getElementById("chunkNum")
  let minimumYElement = document.getElementById("minimumY")
  let chunkNum = 30
  let minimumY = 2
  calculateBarGraph(barData)

  chunkNumElement.addEventListener('change', function () {
    chunkNum = chunkNumElement.value
    calculateBarGraph(barData)
  })

  minimumYElement.addEventListener('change', function () {
    minimumY = minimumYElement.value
    calculateBarGraph(barData)
  })

  function calculateBarGraph(dataBarGraph) {
    let dataPoints = dataBarGraph.map(function (d) { return { x: parseFloat(d[currentX]), y: parseFloat(d[currentY]) } })
    let chunkRange = parseFloat((d3.max(dataBarGraph.map(d => { return d[currentX] })) / chunkNum).toFixed(2))
    let chunkStart = 0
    let chunkEnd = chunkRange
    let barGraphData = []
    let floatPrecision = 1000000

    // Loop until the end of xAxis
    while (true) {
      let filteredX = dataPoints.filter((d) => { return d.x >= chunkStart && d.x <= chunkEnd })
      let barGraphObj = {}
      barGraphObj.y = filteredX.filter((d) => { return d.y >= minimumY }).length / filteredX.length * 100
      barGraphObj.x = chunkStart + "~" + chunkEnd
      barGraphData.push(barGraphObj)

      if (((parseFloat(chunkEnd * floatPrecision + chunkRange * floatPrecision) / floatPrecision).toFixed(2)) > parseFloat((chunkRange * floatPrecision * chunkNum / floatPrecision).toFixed(2))) {
        break
      }

      chunkStart = chunkEnd
      chunkEnd = parseFloat(((chunkEnd * floatPrecision + chunkRange * floatPrecision) / floatPrecision).toFixed(2))
    }
    barGraph(barGraphData)
  }

  startWindow.addEventListener('change', function () {
    startValue = startWindow.value
    updateWindow()
  })

  endWindow.addEventListener('change', function () {
    endValue = endWindow.value
    updateWindow()
  })

  function updateWindow() {
    if (parseFloat(startValue) < parseFloat(endValue)) {
      updateX(selectedOptionX, startValue, endValue)
    }
  }
}

// Second Graph for scatterplot
function barGraph(data) {
  d3.selectAll("#barGraph > *").remove();
  // set the dimensions and margins of the graph
  var margin = { top: 10, right: 30, bottom: 55, left: 40 },
    width = 850 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#barGraph")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // X axis
  var x = d3.scaleBand()
    .range([0, width])
    .domain(data.map(function (d) { return d.x; }))
    .padding(0.2);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")
    .attr("stroke", "white")
    .attr("fill", "white")
    .style("font", "10px times")


  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(data.map((d) => { return d.y }))])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y))
    .attr("stroke", "white")


  // Bars
  svg.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function (d) { return x(d.x); })
    .attr("width", x.bandwidth())
    .attr("fill", "#f5ff63")
    // no bar at the beginning thus:
    .attr("height", function (d) { return height - y(0); }) // always equal to 0
    .attr("y", function (d) { return y(0); })

  // Animation
  svg.selectAll("rect")
    .transition()
    .duration(800)
    .attr("y", function (d) { return y(d.y); })
    .attr("height", function (d) { return height - y(d.y); })
    .delay(function (d, i) { return (i * 100) })

}

// HISTOGRAM
function histogram(data) {
  // set the dimensions and margins of the graph
  var margin = { top: 10, right: 30, bottom: 30, left: 40 },
    width = 800 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#histogram")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");


  // X axis: scale and draw:
  var x = d3.scaleLinear()
    .domain([Math.floor(d3.min(data, function (d) { return +d.Growth })), Math.ceil(d3.max(data, function (d) { return +d.Growth }))])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
    .range([0, width])
  var xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .attr("stroke", "white")


  // Y axis: initialization
  var y = d3.scaleLinear()
    .range([height, 0]);
  var yAxis = svg.append("g")
    .attr("stroke", "white")
    .attr("font-size", "18px")

  // A function that builds the graph for a specific value of bin
  function update(nBin) {

    // set the parameters for the histogram
    var histogram = d3.histogram()
      .value(function (d) { return d.Growth; })   // I need to give the vector of value
      .domain(x.domain())  // then the domain of the graphic
      .thresholds(x.ticks(nBin)); // then the numbers of bins

    var bins = histogram(data)

    histBins = bins
    if (histIndex === 0) {
      document.getElementById("histRange").innerText = histBins[histIndex].x0 + " to " + histBins[histIndex].x1
      document.getElementById("histFrequency").innerText = histBins[histIndex].length
    }

    // Y axis: update now that we know the domain
    y.domain([0, d3.max(bins, function (d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    yAxis
      .transition()
      .duration(0)
      .call(d3.axisLeft(y));

    // x.domain([0, d3.max(bins, function(d) { return d.Growth; })]);   // d3.hist has to be called before the Y axis obviously
    xAxis
      .transition()
      .duration(0)
      .call(d3.axisBottom(x).ticks(nBin));

    // Join the rect with the bins data
    u = svg.selectAll("rect")
      .data(bins)

    // Manage the existing bars and eventually the new ones:
    u
      .enter()
      .append("rect") // Add a new rect for each new elements
      .merge(u) // get the already existing elements as well
      .transition() // and apply changes to all of them
      .duration(0)
      .attr("x", 1)
      .attr("transform", function (d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
      .attr("width", function (d) { return Math.abs(x(d.x1) - x(d.x0) - 1); })
      .attr("height", function (d) { return height - y(d.length); })
      .style("fill", function (d) { return d == histBins[histIndex] ? "#fff94d" : "#00a123" })

    // If less bar in the new histogram, I delete the ones not in use anymore
    u
      .exit()
      .remove()

  }


  // Initialize with 10 bins
  update(document.getElementById("nBin").value)


  // Listen to the button -> update if user change it
  d3.select("#nBin").on("input", function () {
    histIndex = 0
    update(+this.value);
  });

  // });
}

function histMoveRight() {
  if (histIndex + 1 < histBins.length) {
    histIndex += 1
    document.getElementById("histRange").innerText = histBins[histIndex].x0 + " to " + histBins[histIndex].x1
    document.getElementById("histFrequency").innerText = histBins[histIndex].length
    d3.selectAll("#histogram > *").remove();
    histogram(allScatter)
  }
}

function histMoveLeft() {
  if (histIndex - 1 >= 0) {
    histIndex -= 1
    document.getElementById("histRange").innerText = histBins[histIndex].x0 + " to " + histBins[histIndex].x1
    document.getElementById("histFrequency").innerText = histBins[histIndex].length
    d3.selectAll("#histogram > *").remove();
    histogram(allScatter)
  }
}

// Helper Functions
function showScanResults() {
  if (document.getElementById("modeTogglerBtn").innerHTML === "Switch to Scan Mode") {
    document.getElementById("strategy").style.display = "none"
    document.getElementById("scan").style.display = "block"
    document.getElementById("modeTogglerBtn").innerHTML = "Switch to Compute Mode"
  } else {
    document.getElementById("strategy").style.display = "block"
    document.getElementById("scan").style.display = "none"
    document.getElementById("modeTogglerBtn").innerHTML = "Switch to Scan Mode"
  }
}

function chunkProcessOption() {
  if (document.getElementById("chunkProcessTogglerBtn").innerHTML === "Switch to Waterfall") {
    document.getElementById("chunkProcessTogglerBtn").innerHTML = "Switch to Rain Drops"
  } else {
    document.getElementById("chunkProcessTogglerBtn").innerHTML = "Switch to Waterfall"
  }
}

function moveLeft() {
  let lBtn = document.getElementById("panCandlesLeftBtn")
  let rBtn = document.getElementById("panCandlesRightBtn")

  let slider = document.getElementById("chartSlider")
  slider.value = candleDrawStartIndex / (allCandles.length - candleDisplayNumber/2) * 100

  lBtn.style.display = "inline"
  candleDrawStartIndex -= candleDisplayNumber / 2
  candleDrawEndIndex -= candleDisplayNumber / 2
  if (candleDrawStartIndex <= 0) {
    lBtn.style.display = "none"
  }

  rBtn.style.display = "inline"

  drawChart(candleDrawStartIndex, candleDrawEndIndex)
  volumeGraph(candleDrawStartIndex, candleDrawEndIndex)
}

function moveRight() {
  let lBtn = document.getElementById("panCandlesLeftBtn")
  let rBtn = document.getElementById("panCandlesRightBtn")

  let slider = document.getElementById("chartSlider")
  slider.value = candleDrawEndIndex / (allCandles.length - candleDisplayNumber/2) * 100

  rBtn.style.display = "inline"
  candleDrawStartIndex += candleDisplayNumber / 2
  candleDrawEndIndex += candleDisplayNumber / 2
  if (candleDrawEndIndex >= allCandles.length) {
    rBtn.style.display = "none"
  }

  lBtn.style.display = "inline"

  drawChart(candleDrawStartIndex, candleDrawEndIndex)
  volumeGraph(candleDrawStartIndex, candleDrawEndIndex)
}

function candleChartSlider() {
  let slider = document.getElementById("chartSlider")
  slider.style.display = "inline"
  slider.addEventListener('change', function () {
    let sliderDisplayNumber = Math.round((allCandles.length - candleDisplayNumber) * (slider.value / 100))
    candleDrawStartIndex = sliderDisplayNumber
    candleDrawEndIndex = candleDisplayNumber + sliderDisplayNumber

    // console.log(candleDrawEndIndex, allCandles.length)
    if (candleDrawEndIndex >= allCandles.length) {
      document.getElementById("panCandlesRightBtn").style.display = "none"
    } else if (candleDrawStartIndex == 0) {
      document.getElementById("panCandlesLeftBtn").style.display = "none"
    }

    drawChart(candleDrawStartIndex, candleDrawEndIndex)
    volumeGraph(candleDrawStartIndex, candleDrawEndIndex)
  })
}

function getPickerDateTime(pickerID) {
  return document.getElementById(pickerID).value + ":00"
}

function getLocalTimezone() {
  return (-new Date().getTimezoneOffset() / 60) * 3600000
}

function tickerSelectChanged() {
  historyLoadChanged()
  var res = document.getElementById("resSelect")
  var computeBtn = document.getElementById("computeBtn")
  var btn = document.getElementById("loadResBtn")
  if (res.value !== "History...") {
    btn.style.display = "block"
    computeBtn.style.display = "none"
  } else {
    btn.style.display = "none"
    computeBtn.style.display = "block"
  }
}

function saveCandlesChanged() {
  var selectedOption = document.getElementById("candlesSelect")
  var selectedOptionText = selectedOption.options[selectedOption.selectedIndex].text;

  var startTimeInput = document.getElementById("startDateTimePicker")
  var endTimeInput = document.getElementById("endDateTimePicker")
  var periodInput = document.getElementById("periodSelect")
  var tickerInput = document.getElementById("tickerSelect")

  startTimeInput.value = selectedOptionText.substring(0, selectedOptionText.indexOf("~")).replace("_", "T").slice(0, -3)
  endTimeInput.value = selectedOptionText.substring(selectedOptionText.indexOf("~") + 1, selectedOptionText.indexOf("(")).replace("_", "T").slice(0, -3)
  periodInput.value = selectedOptionText.substring(selectedOptionText.indexOf("(") + 1, selectedOptionText.indexOf(","))
  tickerInput.value = selectedOptionText.substring(selectedOptionText.indexOf(" ") + 1, selectedOptionText.indexOf(")"))

  retrieveCandles = true
}
saveCandlesChanged()

function historyLoadChanged() {
  var selectedOption = document.getElementById("resSelect")
  var selectedOptionText = selectedOption.options[selectedOption.selectedIndex].text;

  var startTimeInput = document.getElementById("startDateTimePicker")
  var endTimeInput = document.getElementById("endDateTimePicker")
  var periodInput = document.getElementById("periodSelect")
  var tickerInput = document.getElementById("tickerSelect")

  startTimeInput.value = selectedOptionText.substring(0, selectedOptionText.indexOf("~")).replace("_", "T").slice(0, -3)
  endTimeInput.value = selectedOptionText.substring(selectedOptionText.indexOf("~") + 1, selectedOptionText.indexOf("(")).replace("_", "T").slice(0, -3)
  periodInput.value = selectedOptionText.substring(selectedOptionText.indexOf("(") + 1, selectedOptionText.indexOf(","))
  tickerInput.value = selectedOptionText.substring(selectedOptionText.indexOf(" ") + 1, selectedOptionText.indexOf(")"))

  retrieveCandles = true
}

function processXAxisLabel(d, dates) {
  d = new Date(dates[d])
  if (d.toString() !== "Invalid Date") {
    // console.log(d)

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

}

function generateString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let result = ' ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.substring(1);
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
      mode: "cors",
    })
    .then((res) => {
      drawChart(res.data)
    })
    .catch((error) => {
      console.log(error);
    });
}

// Copy to clipboard
function clipBoard() {
  navigator.clipboard.writeText(copyLink).then(() => {
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copied!"
    }
  )
}

function outFunc() {
  var tooltip = document.getElementById("myTooltip");
  tooltip.innerHTML = "Copy to clipboard";
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