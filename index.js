'use-strict';

// path to where the csv data is located
let dataPath = "./data/dataEveryYear.csv";

// chart features
let xFeature = "time";
let yFeature = "pop_mlns";

// margin of the chart
let margin = { top: 50, left: 70, bottom: 20, right: 10 };

// axes length;
let width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

let parseTime = d3.timeParse("%Y");

// populates options on load
window.onload = function () {
  let countryOption = document.getElementById('country');
  d3.csv(dataPath)
    .then(data => populateOptions(data, countryOption));
}

// populates the data selections with available countries
function populateOptions(data, countryOption) {
  if (data.length > 0) {
    let uniqueCountries = new Set();
    for (let i = 0; i < data.length; i++) {
      let k = data[i];
      uniqueCountries.add(k['location']);
    }
    uniqueCountries.forEach(country => { countryOption.options[countryOption.options.length] = new Option(country); });
  }
}

function selectData() {
  let countryOption = document.getElementById('country');
  let country = countryOption.options[countryOption.selectedIndex].text;
  d3.selectAll("svg").remove();

  if (country != "Choose...") {
    svgContainer = d3.select("body")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    d3.csv(dataPath)
      .then(data => filterData(data, country))
      .then(dataSet => drawPlot(dataSet, xFeature, yFeature, country));
  }
}

function filterData(data, country) {
  let filteredData = data.filter(dataPoint => {
    if (country == 'All') return dataPoint;
    else return dataPoint['location'] == country;
  });
  return filteredData;
}

// draws the plot
function drawPlot(data, xFeature, yFeature, country) {
  let limits = getMinMax(data, yFeature);
  let scaleValues = drawAxes(data, limits);
  drawLabels(xFeature, yFeature);
  drawPoints(data, scaleValues, country);
}

// draws line and point plot
function drawPoints(data, scaleValues, country) {
  // mapping functions
  let x = scaleValues.xScale;
  let y = scaleValues.yScale;

  // make tooltip
  let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  let line = d3.line()
    .x((d) => x(parseTime(d[xFeature])))
    .y((d) => y(d[yFeature]));

  svgContainer.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);

  // // append dot to each datapoint
  svgContainer.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(parseTime(d[xFeature])))
    .attr('cy', (d) => y(d[yFeature]))
    .attr('r', 4)
    .attr('fill', 'rgb(0, 0, 0, 0)')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', '2')
    // add tooltip functionality to points
    .on("mouseover", (d) => {
      div.transition()
        .duration(200)
        .style("opacity", 1.0)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY) + "px");
      drawToolTip(d[xFeature]);
    })
    .on("mouseout", (d) => {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// draws the x axis and y axis labels
function drawLabels(xFeature, yFeature) {
  // x axis label
  svgContainer.append("text")
    .attr("transform", "translate(" + ((width + margin.left) / 2) + " ," + (height + margin.top) + ")")
    .style("text-anchor", "middle")
    .text("Time (Years)");

  // y axis label
  svgContainer.append("text")
    .attr("y", 15)
    .attr("x", - (margin.top + height) / 2)
    .attr("dy", "1em")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("Population (millions)");
}

// gridlines in x axis function
function drawXGrid(xScale) {
  return d3.axisBottom(xScale)
    .ticks(5)
}

// gridlines in y axis function
function drawYGrid(yScale) {
  return d3.axisLeft(yScale)
    .ticks(5)
}

// draws the chart axes
function drawAxes(data, limits) {

  // defining the x axis
  let xScale = d3.scaleTime()
    .domain(d3.extent(data, (d) => parseTime(d[xFeature])))
    .range([margin.left, width]);
  let xAxis = d3.axisBottom(xScale);

  // appending the x axis
  svgContainer.append("g")
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);

  // defining the y axis
  let yScale = d3.scaleLinear()
    .domain([limits.yMin, limits.yMax]).nice()
    .range([height, margin.top]);
  let yAxis = d3.axisLeft(yScale);

  // appending the y axis
  svgContainer.append("g")
    .attr('transform', 'translate(' + margin.left + ', 0)')
    .call(yAxis);

  // add the X gridlines
  svgContainer.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + height + ")")
    .call(drawXGrid(xScale)
      .tickSize(-height)
      .tickFormat("")
    );

  // add the Y gridlines
  svgContainer.append("g")
    .attr("class", "grid")
    .call(drawYGrid(yScale)
      .tickSize(-width)
      .tickFormat("")
    );

  // returns scale values
  return {
    xScale: xScale,
    yScale: yScale,
  };
}

// get min and max values from data
function getMinMax(filteredData, yFeature) {
  var yMin = Number.MAX_VALUE;
  var yMax = Number.MIN_VALUE;

  for (i = 0; i < filteredData.length; i++) {
    var k = filteredData[i];
    yMin = Math.min(k[yFeature], yMin);
    yMax = Math.max(k[yFeature], yMax);
  }

  return {
    yMin: yMin,
    yMax: yMax
  }
}

/*************** TOOLTIP FILTERED PLOT ***************/

// chart features
let xFeatureToolTip = "fertility_rate";
let yFeatureToolTip = "life_expectancy";
let zFeatureToolTip = "pop_mlns";

// margin of the chart
let marginToolTip = { top: 50, left: 70, bottom: 20, right: 10 };

// axes length;
let widthToolTip = 480 - marginToolTip.left - marginToolTip.right,
  heightToolTip = 300 - marginToolTip.top - marginToolTip.bottom;

// draws title of tooltip chart
function drawTitleToolTip(year) {
  svg.append("text")
    .attr("x", (widthToolTip / 2))
    .attr("y", marginToolTip.top / 2)
    .attr("text-anchor", "middle")
    .text("World Life Expectancy and Fertility Rate in " + year);
}

// starts drawing the tooltip
function drawToolTip(year) {
  d3.selectAll(".tooltip-svg").remove();

  svg = d3.select(".tooltip")
    .append("svg")
    .attr("class", "tooltip-svg")
    .attr("width", widthToolTip + marginToolTip.left + marginToolTip.right)
    .attr("height", heightToolTip + marginToolTip.top + marginToolTip.bottom);

  drawTitleToolTip(year);

  d3.csv(dataPath)
    .then(data => filterDataToolTip(data, year))
    .then(dataSet => drawPlotToolTip(dataSet, xFeatureToolTip, yFeatureToolTip));
}

function filterDataToolTip(data, year) {
  let filteredData = data.filter(dataPoint => {
    return dataPoint['time'] == year;
  });
  return filteredData;
}

// draws the plot
function drawPlotToolTip(data, xFeatureToolTip, yFeatureToolTip) {
  let limits = getMinMaxToolTip(data, xFeatureToolTip, yFeatureToolTip);
  let scaleValues = drawAxesToolTip(data, limits);
  drawLabelsToolTip(xFeatureToolTip, yFeatureToolTip);
  drawPointsToolTip(data, scaleValues, zFeatureToolTip);
}

function drawPointsToolTip(filteredData, scaleValues, zFeatureToolTip) {
  let zData = filteredData.map((row) => +row[zFeatureToolTip]);
  let zLimits = d3.extent(zData);
  // make size scaling function for population
  let zScale = d3.scaleLinear()
    .domain([zLimits[0], zLimits[1]])
    .range([3, 20]);

  // mapping functions
  let x = scaleValues.xScale;
  let y = scaleValues.yScale;

  // append data to SVG and plot as points
  svg.selectAll('.dot2')
    .data(filteredData)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d[xFeatureToolTip]))
    .attr('cy', (d) => y(d[yFeatureToolTip]))
    .attr('r', (d) => zScale(d[zFeatureToolTip]))
    .attr('fill', "steelblue")
    .attr('fill-opacity', 0.8)
}

// format numbers
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// draws the x axis and y axis labels
function drawLabelsToolTip() {
  // x axis label
  svg.append("text")
    .attr("transform", "translate(" + ((widthToolTip + marginToolTip.left) / 2) + " ," + (heightToolTip + marginToolTip.top) + ")")
    .style("text-anchor", "middle")
    .text("Fertility Rate");

  // y axis label
  svg.append("text")
    .attr("y", 15)
    .attr("x", - (marginToolTip.top + heightToolTip) / 2)
    .attr("dy", "1em")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text("Life Expectancy");
}

// draws the chart axes
function drawAxesToolTip(filteredData, limits) {
  // defining the x axis
  let xScale = d3.scaleLinear()
    .domain([limits.xMin, limits.xMax]).nice()
    .range([marginToolTip.left, widthToolTip]);
  let xAxis = d3.axisBottom(xScale);

  // appending the x axis
  svg.append("g")
    .attr('transform', 'translate(0, ' + heightToolTip + ')')
    .call(xAxis);

  // defining the y axis
  let yScale = d3.scaleLinear()
    .domain([limits.yMin, limits.yMax]).nice()
    .range([heightToolTip, marginToolTip.top]);
  let yAxis = d3.axisLeft(yScale);

  // appending the y axis
  svg.append("g")
    .attr('transform', 'translate(' + marginToolTip.left + ', 0)')
    .call(yAxis);

  // returns scale values
  return {
    xScale: xScale,
    yScale: yScale,
  };
}

// get min and max values from data
function getMinMaxToolTip(filteredData, xFeatureToolTip, yFeatureToolTip) {
  var xMin = Number.MAX_VALUE;
  var xMax = Number.MIN_VALUE;
  var yMin = Number.MAX_VALUE;
  var yMax = Number.MIN_VALUE;

  for (i = 0; i < filteredData.length; i++) {
    var k = filteredData[i];
    xMin = Math.ceil(Math.min(k[xFeatureToolTip], xMin) * 20) / 20;
    xMax = Math.ceil(Math.max(k[xFeatureToolTip], xMax) * 20) / 20;
    yMin = Math.ceil(Math.min(k[yFeatureToolTip], yMin) * 20) / 20;
    yMax = Math.ceil(Math.max(k[yFeatureToolTip], yMax) * 20) / 20;
  }

  return {
    xMin: xMin,
    xMax: xMax,
    yMin: yMin,
    yMax: yMax
  }
}