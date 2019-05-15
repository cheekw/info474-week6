'use-strict';

// path to where the csv data is located
let dataPath = "./data/dataEveryYear.csv";

// chart features
let xFeature = "fertility_rate";
let yFeature = "life_expectancy";
let zFeature = "pop_mlns";

let binThreshold = -1;

// margin of the chart
let margin = { top: 50, left: 70, bottom: 20, right: 10 };

// axes length;
let width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// populates options on load
window.onload = function () {
  let yearOption = document.getElementById('year');
  let countryOption = document.getElementById('country');
  d3.csv(dataPath)
    .then(data => populateOptions(data, yearOption, countryOption));
}

function selectPrev() {
  var select = document.getElementById('year');
  if (select.selectedIndex > 0) {
    select.selectedIndex--;
  }
  selectData()
}

function selectNext() {
  var select = document.getElementById('year');
  console.log(select.length);
  if (select.selectedIndex < select.length - 1) {
    select.selectedIndex++;
  }
  selectData();
}

// populates the data selections with available years from data source
function populateOptions(data, yearOption, countryOption) {
  if (data.length > 0) {
    let uniqueYears = new Set();
    let uniqueCountries = new Set();
    for (let i = 0; i < data.length; i++) {
      let k = data[i];
      uniqueYears.add(k['time']);
      uniqueCountries.add(k['location']);
      console.log(k['location']);
    }
    console.log(uniqueCountries);
    uniqueYears.forEach(year => { yearOption.options[yearOption.options.length] = new Option(year); });
    uniqueCountries.forEach(country => { countryOption.options[countryOption.options.length] = new Option(country); });
  }
}

function selectData() {
  let yearOption = document.getElementById('year');
  let year = yearOption.options[yearOption.selectedIndex].text;
  d3.selectAll("svg").remove();

  if (year !== 'Choose...') {

    svgContainer = d3.select("body")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    d3.csv(dataPath)
      .then(data => filterYear(data, year))
      .then(dataSet => drawPlot(dataSet, xFeature, yFeature));
  }
}

function filterYear(data, year) {
  let filteredData = data.filter(dataPoint => {
    return dataPoint['time'] == year;
  });
  return [data, filteredData];
}

// draws the plot
function drawPlot(dataSet, xFeature, yFeature) {
  let rawData = dataSet[0];
  let filteredData = dataSet[1];
  let limits = getMinMax(rawData, xFeature, yFeature);
  let scaleValues = drawAxes(rawData, limits);
  drawLabels(xFeature, yFeature);
  drawPoints(filteredData, scaleValues, zFeature);
}

function drawPoints(filteredData, scaleValues, zFeature) {
  let zData = filteredData.map((row) => +row[zFeature]);
  let zLimits = d3.extent(zData);
  // make size scaling function for population
  let zScale = d3.scaleLinear()
    .domain([zLimits[0], zLimits[1]])
    .range([3, 20]);

  // mapping functions
  let x = scaleValues.xScale;
  let y = scaleValues.yScale;

  // make tooltip
  let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // append data to SVG and plot as points
  svgContainer.selectAll('.dot')
    .data(filteredData)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d[xFeature]))
    .attr('cy', (d) => y(d[yFeature]))
    .attr('r', (d) => zScale(d[zFeature]))
    .attr('fill', "steelblue")
    // add tooltip functionality to points
    .on("mouseover", (d) => {
      div.transition()
        .duration(200)
        .style("opacity", .9);
      div.html("Country: " + d.location + "<br/>" + "Population: " + numberWithCommas(d[zFeature] * 1000000))
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", (d) => {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// format numbers
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// draws the x axis and y axis labels
function drawLabels(xFeature, yFeature) {
  // x axis label
  svgContainer.append("text")
    .attr("transform", "translate(" + ((width + margin.left) / 2) + " ," + (height + margin.top) + ")")
    .style("text-anchor", "middle")
    .text(xFeature);

  // y axis label
  svgContainer.append("text")
    .attr("y", 15)
    .attr("x", - (margin.top + height) / 2)
    .attr("dy", "1em")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "middle")
    .text(yFeature);
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
function drawAxes(filteredData, limits) {
  // defining the x axis
  let xScale = d3.scaleLinear()
    .domain([limits.xMin, limits.xMax]).nice()
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
function getMinMax(filteredData, xFeature, yFeature) {
  var xMin = Number.MAX_VALUE;
  var xMax = Number.MIN_VALUE;
  var yMin = Number.MAX_VALUE;
  var yMax = Number.MIN_VALUE;

  for (i = 0; i < filteredData.length; i++) {
    var k = filteredData[i];
    xMin = Math.ceil(Math.min(k[xFeature], xMin) * 20) / 20;
    xMax = Math.ceil(Math.max(k[xFeature], xMax) * 20) / 20;
    yMin = Math.ceil(Math.min(k[yFeature], yMin) * 20) / 20;
    yMax = Math.ceil(Math.max(k[yFeature], yMax) * 20) / 20;
  }

  return {
    xMin: xMin,
    xMax: xMax,
    yMin: yMin,
    yMax: yMax
  }
}