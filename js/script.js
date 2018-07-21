
console.log("HELLO")

var margin = {top: 20, right: 20, bottom: 50, left: 50},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseTime = d3.timeParse("%d/%m/%Y %H:%M");
	bisectDate = d3.bisector(function(d) { return d.dt; }).left;
	formatValue = d3.format(",.2f"),
    formatCurrency = function(d) { return "£" + formatValue(d); };

// initial x-scale
var x = d3.scaleTime()
		  .range([0, width]);

//initial y-scale
var y = d3.scaleLinear()
		  .range([height, 0]);

// initial d3.line() object
var priceSeries = d3.line()
	.defined(function(d) { return d.price != 0; })
	.x(function(d) { return x(d.dt); })
	.y(function(d) { return y(d.price); });

// svg element
svg = d3.select('#chart')
    .append("svg:svg")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append("svg:g")
	.attr("id","group")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Hovertool element holder
var focus = svg.append("g") 
			   .style("display", "none")	


               
// Get the data
d3.csv("data/data.csv").then(function(data) {

    console.log("HERE")
	// format the data
	data.forEach(function(d,i) {
		d.dt = parseTime(d.dt);
		d.price = +d.price;
	});

	// Scale the range of the data
	var date_max = d3.max(data, function(d) { return d.dt; });
	console.log("Date range: ", d3.extent(data, function(d) { return d.dt; }));
	console.log("Price range: ", d3.extent(data, function(d) { return +d.price; }));	
	x.domain(d3.extent(data, function(d) { return d.dt; }));
	y.domain(d3.extent(data, function(d) { return d.price; }));
	
	// Zoom variable [defines how far you can zoom (scaleExtent) and pan (translateExtent)]
	var zoom = d3.zoom()
    .scaleExtent([0.75, 15000])
    .translateExtent([[-10000, -10000], [10000, 10000]])
    .on("zoom", zoomed);	
	
	// x-axis variable
	var xAxis = d3.axisBottom(x)
		.ticks((width + 2) / (height + 2) * 5)
		.tickSize(-height)
		.tickPadding(10);
	
	// y-axis variable
	var yAxis = d3.axisRight(y)
		.ticks(5)
		.tickSize(width)
		.tickPadding(- 20 - width);
	
	// g-element for storing x-axis gridlines
	var gX = svg.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	// y-element for storing y-axis gridlines
	var gY = svg.append("g")
		.attr("class", "axis axis--y")
		.call(yAxis);
	
	// Clip path to prevent shapes 'leaking' outside chart body
	svg.append("defs").append("clipPath")
		.attr("id", "clip")
	  .append("rect")
		.attr("width", width)
		.attr("height", height);
	
	var chartBody = svg.append("g")
					   .attr("class", "chartBody")
					   .attr("clip-path", "url(#clip)");
	
	// mapping of data to line using the priceSeries function
	chartBody.append("svg:path")
		.data([data])
		.attr("class","line")
		.attr("d", priceSeries);
	
	// appening a circle object to hovertool placeholder
	focus.append("circle")
		.attr("class", "y")
		.style("fill", "none")
		.style("stroke", "steelblue")
		.attr("r", 4)
		.attr("clip-path", "url(#clip)");	
	
	// appending text next to circle hovertool
	focus.append("text")
		  .attr("dy", ".35em")
		  .attr("clip-path", "url(#clip)");
	
	// appending of rect to svg on which to call zoom method
	svg.append("rect")
		.attr("id","rect")
		.attr("width", width)
		.attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mouseMove);
	
	// g element to store actual x-axis
	var xAxisLine = svg.append("g")
					   .attr("transform", "translate(0," + height + ")")
					   .call(d3.axisBottom(x).ticks(0));
	
	// element to store actual y-axis
	var yAxisLine = svg.append("g")
					   .call(d3.axisLeft(y).ticks(0));
	
	// x-axis label
	svg.append("text")             
	  .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
	  .style("font-size","12px")
	  .style("font-family", "sans-serif")
	  .style("text-anchor", "middle")
	  .text("Date/Time");
	 
	// y-axis label
	svg.append("text")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 0 - margin.left/1.2)
		  .attr("x",0 - (height / 2))
		  .attr("dy", "1em")
		  .style("font-size","12px")
		  .style("text-anchor", "middle")
		  .text("Price");
	
	// call zoom function on #rect
	d3.select("#rect").call(zoom);
	
	// assign zoom reset on click of button
	d3.select("button").on("click", resetted);
	
	// mouseDate function. Returns the data for 
	// the corresponding point over which the cursor 
	// is currently placed.
	function mouseDate(scale) {
		var g = d3.select("#group")._groups[0][0]
		var x0 = scale.invert(d3.mouse(g)[0])
		i = bisectDate(data, x0, 1)
		d0 = data[i - 1];
		if (d0.dt === date_max) {
			d = d0;
		}
		else {
			var d1 = data[i]
			d = x0 - d0.dt > d1.dt- x0 ? d1 : d0;
		}
		return d;
	}
	
	// mouseMove function accesses #rect via this
	// defines movement of hovertool after extracting
	// current zoom extent parameters and applies
	// these to circle and text objects
	function mouseMove() {
		var transform = d3.zoomTransform(this);
		var xt = transform.rescaleX(x), yt = transform.rescaleY(y);
		d = mouseDate(xt);
		focus.select("circle.y")
			.attr('cx', function() {
									return transform.applyX(x(d.dt));
								})
			.attr('cy', function() {
									return transform.applyY(y(d.price));
								});
		focus.select("text")
			 .text(formatCurrency(d.price))
			 .attr('x', function() {
									return transform.applyX(x(d.dt))+10;
			 })
			 .attr('y', function() {
									return transform.applyY(y(d.price));
			 });
	}
	
	// zoomed function to define behaviour of d3.zoom()
	// rescales x and y axis & gridlines
	// rescales the price series
	// rescales the hovertool and accompanying text
	function zoomed() {
	  a = mouseDate(x);
	  gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
	  gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
	  var t = d3.event.transform, xt = t.rescaleX(x), yt = t.rescaleY(y)
	  svg.select(".line")
		 .attr("d",priceSeries.x(function(d) { return xt(d.dt);})
	   				      	  .y(function(d) { return yt(d.price);}));
		
		focus.select("circle.y")
			 .classed("zoomed", true)
			 .attr("id","one")
			 .attr('cx', function() {return t.applyX(x(d.dt)); })
			 .attr('cy', function() {return t.applyY(y(d.price)); });				
		focus.select("text")
			 .text(formatCurrency(d.price))
			 .attr('x', function() { return t.applyX(x(d.dt))+10;})
			 .attr('y',function() {return t.applyY(y(d.price)); });
	}
	
	// function defining behaviour on click of the reset button
	function resetted() {
	  d3.select("#rect").transition()
		  .duration(750)
		  .call(zoom.transform, d3.zoomIdentity);
	}
	
});