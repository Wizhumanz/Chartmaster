
let baseURL = "http://localhost:8000"
let wsStatus = document.getElementById("wsStatus")

// Get parameters from a URL string
console.log(getParams(window.location.href).user)
let userID = getParams(window.location.href).user

// Simulated Trades index
let indexST = 1

// History json name
var selectedRes

// Disable btns initially
document.getElementById("panCandlesLeftBtn").style.display = "none"
document.getElementById("panCandlesRightBtn").style.display = "none"

/// CANDLESTICKS
let candleDisplayNumber = 170
let candleDrawStartIndex = 0
let tickNumCandles = 10
let tickNumProfitX = 6
let tickNumProfitY = 8
let candlestickChartLabelFontSize = "11px"
let margin = { top: 10, right: 20, bottom: 205, left: 45 },
  w = 1050,
  h = 700;
let candlesViewBoxHeight = "1000"
let candlestickLabelStroke = "1px"
let pcFontSz = "14px"

let labelXMove = 4
let labelYMove = 10
let candleWickWidth = 3

//mobile display options
if (screen.availWidth < 700) {
  h = 2 * screen.height
  margin.left = 140
  margin.top = 40
  labelXMove = 12
  labelYMove = 18
  candleWickWidth = 7
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
allCandles = [{ "DateTime": "2021-05-01T04:00:00", "Open": 58206.890625, "High": 58253.21875, "Low": 58206.890625, "Close": 58252.78125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:01:00", "Open": 58252.78125, "High": 58277.109375, "Low": 58232.73828125, "Close": 58273, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:02:00", "Open": 58271.03125, "High": 58271.03125, "Low": 58167.01953125, "Close": 58167.01953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:03:00", "Open": 58167.01953125, "High": 58181.33984375, "Low": 58100.80078125, "Close": 58118.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:04:00", "Open": 58118.01171875, "High": 58120, "Low": 58050, "Close": 58067.46875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:05:00", "Open": 58067.46875, "High": 58100, "Low": 58060.5, "Close": 58097.3203125, "StratEnterPrice": 57693, "StratExitPrice": 0, "Label": "▼ 57410.00 / 0.04" }, { "DateTime": "2021-05-01T04:06:00", "Open": 58096.8203125, "High": 58098.48046875, "Low": 58061.33984375, "Close": 58075.859375, "StratEnterPrice": 0, "StratExitPrice": 57711.7890625, "Label": "" }, { "DateTime": "2021-05-01T04:07:00", "Open": 58075.87109375, "High": 58123.94921875, "Low": 58073.76953125, "Close": 58120, "StratEnterPrice": 57784.8515625, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:08:00", "Open": 58120.01171875, "High": 58162.8984375, "Low": 58087.94140625, "Close": 58153.76953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:09:00", "Open": 58156.1796875, "High": 58190.19921875, "Low": 58153.6796875, "Close": 58190.19140625, "StratEnterPrice": 0, "StratExitPrice": 57769.140625, "Label": "▼ 57669.99" }, { "DateTime": "2021-05-01T04:10:00", "Open": 58190.19921875, "High": 58248.37109375, "Low": 58190.19140625, "Close": 58223.26953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:11:00", "Open": 58223.26953125, "High": 58264.7890625, "Low": 58216.6484375, "Close": 58249.51171875, "StratEnterPrice": 57848.19921875, "StratExitPrice": 0, "Label": "▼ 57742.96 / 0.11" }, { "DateTime": "2021-05-01T04:12:00", "Open": 58249.51171875, "High": 58277, "Low": 58230.859375, "Close": 58257.87109375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:13:00", "Open": 58257.87890625, "High": 58259.98828125, "Low": 58212.01171875, "Close": 58226.9609375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:14:00", "Open": 58227.62890625, "High": 58249.96875, "Low": 58206.73046875, "Close": 58215, "StratEnterPrice": 0, "StratExitPrice": 57949.640625, "Label": "▼ 57410.00" }, { "DateTime": "2021-05-01T04:15:00", "Open": 58215, "High": 58243.1796875, "Low": 58213.6484375, "Close": 58227.578125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:16:00", "Open": 58227.640625, "High": 58239.9609375, "Low": 58211.44921875, "Close": 58223.55078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:17:00", "Open": 58223.55078125, "High": 58229.75, "Low": 58137.28125, "Close": 58163.80078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:18:00", "Open": 58163.80078125, "High": 58163.80078125, "Low": 58107.671875, "Close": 58128.140625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:19:00", "Open": 58128.12890625, "High": 58146.48828125, "Low": 58075, "Close": 58135.359375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:20:00", "Open": 58135.359375, "High": 58168.1796875, "Low": 58117.91015625, "Close": 58141.03125, "StratEnterPrice": 57911.28125, "StratExitPrice": 0, "Label": "▼ 57789.42 / 0.10" }, { "DateTime": "2021-05-01T04:21:00", "Open": 58135.21875, "High": 58135.21875, "Low": 58083.828125, "Close": 58123.41015625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:22:00", "Open": 58123.41015625, "High": 58157.3984375, "Low": 58120, "Close": 58141.921875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:23:00", "Open": 58141.921875, "High": 58149.83984375, "Low": 58120, "Close": 58149.71875, "StratEnterPrice": 0, "StratExitPrice": 57975.76171875, "Label": "▼ 57789.42" }, { "DateTime": "2021-05-01T04:24:00", "Open": 58149.71875, "High": 58169.80859375, "Low": 58139.80078125, "Close": 58147.28125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:25:00", "Open": 58147.26953125, "High": 58150, "Low": 58122.98046875, "Close": 58130.08984375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:26:00", "Open": 58130.1015625, "High": 58140, "Low": 58119.05859375, "Close": 58136.05078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:27:00", "Open": 58136.05078125, "High": 58138.05078125, "Low": 58060, "Close": 58060.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:28:00", "Open": 58060.01171875, "High": 58089.48046875, "Low": 58000, "Close": 58005.78125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:29:00", "Open": 58005.7890625, "High": 58070, "Low": 58002.83984375, "Close": 58062.94140625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:30:00", "Open": 58062.94140625, "High": 58068.94921875, "Low": 58004.26171875, "Close": 58024.73046875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:31:00", "Open": 58024.73046875, "High": 58024.73046875, "Low": 57845.21875, "Close": 57895.33984375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:32:00", "Open": 57894.73046875, "High": 57939.94921875, "Low": 57875.91015625, "Close": 57918.96875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:33:00", "Open": 57919, "High": 57958.44921875, "Low": 57891.58984375, "Close": 57946.25, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:34:00", "Open": 57946.26171875, "High": 57948.9609375, "Low": 57888.109375, "Close": 57908.109375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:35:00", "Open": 57909.98828125, "High": 57912.3984375, "Low": 57817.359375, "Close": 57820, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:36:00", "Open": 57820, "High": 57847.2109375, "Low": 57722.87109375, "Close": 57780.12890625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:37:00", "Open": 57780.140625, "High": 57840.30078125, "Low": 57720, "Close": 57832.76171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:38:00", "Open": 57832.7890625, "High": 57876.62109375, "Low": 57826, "Close": 57862.26953125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:39:00", "Open": 57862.28125, "High": 57887.55859375, "Low": 57831.73046875, "Close": 57885.140625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:40:00", "Open": 57885.12890625, "High": 57900, "Low": 57877.21875, "Close": 57899.5, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:41:00", "Open": 57899.98828125, "High": 57941.05859375, "Low": 57899.25, "Close": 57927.4609375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:42:00", "Open": 57927.44921875, "High": 57950, "Low": 57918.87109375, "Close": 57920.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:43:00", "Open": 57920.01171875, "High": 57920.01171875, "Low": 57872, "Close": 57872, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:44:00", "Open": 57872.01171875, "High": 57926.5703125, "Low": 57870, "Close": 57910.828125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:45:00", "Open": 57913.19140625, "High": 57924.640625, "Low": 57872.7109375, "Close": 57880.55078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:46:00", "Open": 57880.55078125, "High": 57922.828125, "Low": 57826.328125, "Close": 57908.171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:47:00", "Open": 57907.4609375, "High": 57935.8984375, "Low": 57888.37890625, "Close": 57891.98046875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:48:00", "Open": 57891.98046875, "High": 57942.69921875, "Low": 57891.96875, "Close": 57942.55859375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:49:00", "Open": 57942.55859375, "High": 57980.5, "Low": 57914.51171875, "Close": 57974.01171875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:50:00", "Open": 57974.01953125, "High": 58049.30078125, "Low": 57970.921875, "Close": 58017.859375, "StratEnterPrice": 57866.140625, "StratExitPrice": 0, "Label": "▼ 57786.00 / 0.15" }, { "DateTime": "2021-05-01T04:51:00", "Open": 58016.87109375, "High": 58046.44140625, "Low": 58016.859375, "Close": 58040.03125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:52:00", "Open": 58036.37890625, "High": 58060, "Low": 58030, "Close": 58037.7890625, "StratEnterPrice": 0, "StratExitPrice": 57863.03125, "Label": "▼ 57600.08" }, { "DateTime": "2021-05-01T04:53:00", "Open": 58037.3203125, "High": 58041.69140625, "Low": 57959.2109375, "Close": 57994.859375, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:54:00", "Open": 57994.859375, "High": 58035.921875, "Low": 57990.12109375, "Close": 58023.78125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:55:00", "Open": 58027.71875, "High": 58045, "Low": 58009.671875, "Close": 58045, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:56:00", "Open": 58044.98046875, "High": 58127.328125, "Low": 58044.58984375, "Close": 58125.55078125, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:57:00", "Open": 58125.55859375, "High": 58138.37890625, "Low": 58078.75, "Close": 58117.19921875, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:58:00", "Open": 58117.2109375, "High": 58117.2109375, "Low": 58082.23828125, "Close": 58090.66015625, "StratEnterPrice": 0, "StratExitPrice": 0, "Label": "" }, { "DateTime": "2021-05-01T04:59:00", "Open": 58090.66015625, "High": 58121.8203125, "Low": 58057.9296875, "Close": 58100.6484375, "StratEnterPrice": 57787.28125, "StratExitPrice": 0, "Label": "▼ 57669.99 / 0.10" }, { "DateTime": "2021-05-01T05:00:00", "Open": 58100.26953125, "High": 58150, "Low": 58065.53125, "Close": 58079.328125, "StratEnterPrice": 0, "StratExitPrice": 57807.6484375, "Label": "" }]
drawChart(0, candleDisplayNumber)
allProfitCurve = [{ "DataLabel": "strat1", "Data": [{ "DateTime": "2021-05-01T00:06:00", "Equity": 503.2285777385159 }, { "DateTime": "2021-05-01T00:11:00", "Equity": 514.7956316711843 }, { "DateTime": "2021-05-01T00:20:00", "Equity": 521.1452918840314 }, { "DateTime": "2021-05-01T00:49:00", "Equity": 520.679704050146 }, { "DateTime": "2021-05-01T00:58:00", "Equity": 522.346204200011 }, { "DateTime": "2021-05-01T01:12:00", "Equity": 524.5089442514854 }, { "DateTime": "2021-05-01T01:14:00", "Equity": 520.8258235514659 }, { "DateTime": "2021-05-01T01:17:00", "Equity": 517.0176397972828 }, { "DateTime": "2021-05-01T01:27:00", "Equity": 520.2462175357987 }, { "DateTime": "2021-05-01T01:32:00", "Equity": 531.8132714684671 }, { "DateTime": "2021-05-01T01:41:00", "Equity": 538.1629316813141 }, { "DateTime": "2021-05-01T02:10:00", "Equity": 537.6973438474288 }, { "DateTime": "2021-05-01T02:18:00", "Equity": 539.7810684952456 }, { "DateTime": "2021-05-01T02:35:00", "Equity": 546.1505002909307 }, { "DateTime": "2021-05-01T02:38:00", "Equity": 542.3423165367476 }, { "DateTime": "2021-05-01T02:48:00", "Equity": 545.5708942752635 }, { "DateTime": "2021-05-01T02:53:00", "Equity": 557.1379482079319 }, { "DateTime": "2021-05-01T03:02:00", "Equity": 563.487608420779 }, { "DateTime": "2021-05-01T03:31:00", "Equity": 563.0220205868936 }, { "DateTime": "2021-05-01T03:40:00", "Equity": 564.6885207367586 }, { "DateTime": "2021-05-01T03:56:00", "Equity": 571.0579525324447 }, { "DateTime": "2021-05-01T03:59:00", "Equity": 567.2497687782616 }, { "DateTime": "2021-05-01T04:06:00", "Equity": 568.0464781422188 }, { "DateTime": "2021-05-01T04:09:00", "Equity": 566.1770846957861 }, { "DateTime": "2021-05-01T04:14:00", "Equity": 577.7441386284545 }, { "DateTime": "2021-05-01T04:23:00", "Equity": 584.0937988413016 }, { "DateTime": "2021-05-01T04:52:00", "Equity": 583.6282110074162 }] }]
drawPC(allProfitCurve)
allSimTrades = [{ "DataLabel": "strat1", "Data": [{ "DateTime": "2021-05-01T01:25:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57784.8515625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.1592074645104259 }, { "DateTime": "2021-05-01T01:27:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57769.140625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.13197549962733782 }, { "DateTime": "2021-05-01T01:32:00", "Direction": "LONG", "EntryPrice": 57693, "ExitPrice": 57949.640625, "PosSize": 0.042402826855123664, "RiskedEquity": 2446.3462897526497, "RawProfitPerc": 0.44483841193905677 }, { "DateTime": "2021-05-01T01:41:00", "Direction": "LONG", "EntryPrice": 57848.19921875, "ExitPrice": 57975.76171875, "PosSize": 0.11402694777476709, "RiskedEquity": 6596.253591180728, "RawProfitPerc": 0.22051248219089578 }, { "DateTime": "2021-05-01T02:10:00", "Direction": "LONG", "EntryPrice": 57866.140625, "ExitPrice": 57863.03125, "PosSize": 0.1497367907974264, "RiskedEquity": 8664.690193020082, "RawProfitPerc": -0.00537339274127546 }, { "DateTime": "2021-05-01T02:18:00", "Direction": "LONG", "EntryPrice": 57866.140625, "ExitPrice": 57807.6484375, "PosSize": 0.1497367907974264, "RiskedEquity": 8664.690193020082, "RawProfitPerc": -0.10108188807519942 }, { "DateTime": "2021-05-01T02:19:00", "Direction": "LONG", "EntryPrice": 57866.140625, "ExitPrice": 57803.5703125, "PosSize": 0.1497367907974264, "RiskedEquity": 8664.690193020082, "RawProfitPerc": -0.10812940317807829 }, { "DateTime": "2021-05-01T02:33:00", "Direction": "LONG", "EntryPrice": 57787.28125, "ExitPrice": 57619.859375, "PosSize": 0.10230792286941753, "RiskedEquity": 5912.096712958338, "RawProfitPerc": -0.2897209755823216 }, { "DateTime": "2021-05-01T02:35:00", "Direction": "LONG", "EntryPrice": 57609.19140625, "ExitPrice": 57640.609375, "PosSize": 0.20273213225103942, "RiskedEquity": 11679.234211047318, "RawProfitPerc": 0.05453638209994296 }, { "DateTime": "2021-05-01T02:38:00", "Direction": "LONG", "EntryPrice": 57609.19140625, "ExitPrice": 57710.73046875, "PosSize": 0.20273213225103942, "RiskedEquity": 11679.234211047318, "RawProfitPerc": 0.17625496907943766 }] }]
plotHistory(allSimTrades)

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
      console.log(res.data)
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
          console.log(msg.data)
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
    "risk": riskInput,
    "leverage": leverageInput,
    "size": sizeInput
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
      document.getElementById("shareResult").style = "display: block;"
    })
    .catch((error) => {
      console.log(error);
    });
}

function shareResult() {
  var titleText = document.getElementById("shareTitle").value
  var descText = document.getElementById("shareDesc").value
  console.log(titleText, descText)

  let result = {
    "title": titleText,
    "description": descText,
    "resultFileName": selectedRes,
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
      console.log(res.data)
    })
    .catch((error) => {
      console.log(error);
    });
}

function drawChart(start, end) {
  console.log(start + " - " + end)
  let candlesToShow = allCandles.slice(start, end)
  // console.log(JSON.stringify(candlesToShow))
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
    .attr("stroke", d => (d.Open === d.Close) ? "white" : (d.Open > d.Close) ? "red" : "darkgreen")
    .attr("stroke-width", candleWickWidth)
    .attr("z-index", "-1");

  // Create Label
  let labelText = chartBody.selectAll("labelText")
    .data(candlesToShow.filter((p) => { return p.Label !== "" }))
    .enter()
    .append("text")
    .attr("x", (d) => xScale(d.index) - labelXMove - xBand.bandwidth() / 2)
    .attr("y", d => yScale(d.High) - labelYMove)
    .attr("stroke", "white")
    .attr("fill", "white")
    .attr("stroke-width", candlestickLabelStroke)
    .attr("font-family", "Courier")
    .attr("font-size", candlestickChartLabelFontSize)
    .attr("font-weight", "bold")
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

/// PROFIT CURVE
function drawPC(data) {
  // console.log(JSON.stringify(data))
  d3.selectAll("#profit > *").remove();
  var pcMargin = { top: 0, right: 20, bottom: 30, left: 45 },
    width = 550 - pcMargin.left - pcMargin.right,
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
    .style("font-size", pcFontSz)
    .call(d3.axisBottom(x).ticks(tickNumProfitX))
    .style("color", "white")
  // Add the Y Axis
  pcSvg.append("g")
    .call(d3.axisLeft(y).ticks(tickNumProfitY))
    .style("color", "white")
    .style("font-size", pcFontSz)
}

/// SIMULATED TRADES
function plotHistory(data) {
  // console.log(JSON.stringify(data))
  var table = document.getElementById("history")
  table.innerHTML = ""
  let row = table.insertRow()
  let tableHeader = ["Index", "Raw Profit Perc", "Entry Price", "Exit Price", "Risked Equity", "Date", "Position Size", "Direction", "Parameter"]
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
      row.insertCell().innerHTML = dateStrs[0] + " | " + dateStrs[1]
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
        row.style.backgroundColor = "#002e03"
      } else if ((s.Direction == "LONG") && (exit < entry)) {
        row.style.backgroundColor = "#540000"
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
