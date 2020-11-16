function kernelDensityEstimator(kernel, x) {
  return function(sample) {
      return x.map(function(x) {
        return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
    });
  };
}

function epanechnikov(bandwidth) {
    return x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
}

function kdeShow(divName, values) {

    var numHistBins = 30;
    var bandwith = 7;
    var margin = {top: 20, right: 30, bottom: 30, left: 40};
    var width = 960 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    var histogram = d3.layout.histogram()
        .frequency(false)
        .bins(numHistBins)
        (values);

    var x = d3.scale.linear()
        .domain([40, 100])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, d3.max(histogram, d => d.length) / values.length])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format("%"));

    var line = d3.svg.line()
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); });

    var svg = d3.select(divName).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    var kde = kernelDensityEstimator(epanechnikov(bandwith), x.ticks(100));

    svg.selectAll(".bar")
        .data(histogram)
        .enter().insert("rect", ".axis")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.x) + 1; })
        .attr("y", function(d) { return y(d.y); })
        .attr("width", x(histogram[0].dx + histogram[0].x) - x(histogram[0].x) - 1)
        .attr("height", function(d) { return height - y(d.y); });

    svg.append("path")
        .datum(kde(values))
        .attr("class", "line")
        .attr("d", line);
};
