// Used the week 6 tutorial as a template to create these visualizations
// Used the tutorial at https://www.freshconsulting.com/d3-js-gradients-the-easy-way/ for the gradients
// Alexander Richard and Montek Parmar


var margins = {top: 20, right: 20, bottom: 30, left: 80};
var totalWidth = 1600;
var totalHeight = 800;

var innerWidth = totalWidth - margins.left - margins.right;
var innerHeight = totalHeight - margins.top - margins.bottom;

var ppl_affected = [];



// data modified from https://github.com/charliesmart/d3-square-tile-map/blob/master/square-tile-map.js
var states = [["AK", 0, 72],["AL",504,432,],["AR",360,360,],["AZ",144,360],["CA",72,288],["CO",216,288], ["CT",720,216],["DC",648,360],["DE",720,288],["FL",648,504],["GA",576,432],["HI",72,504], ["IA",360,216],["ID",144,144],["IL",432,144],["IN",432,216],["KS",288,360],["KY",432,288], ["LA",360,432],["MA",720,144],["MD",648,288],["ME",792.8,0],["MI",504,144],["MN",360,144], ["MO",360,288],["MS",432,432],["MT",216,144],["NC",504,360],["ND",288,144],["NE",288,288],[ "NH",792.8,72],["NJ",648,216],["NM",216,360],["NV",144,216],["NY",648,144],["OH",504, 216], ["OK",288,432],["OR",72,216],["PA",576,216],["RI",792.8,216],["SC",576,360],["SD",288,216], ["TN",432,360],["TX",288,504],["UT",144,288],["VA",576,288],["VT",720,72],["WA",72,144],["WI",432,72],[ "WV",504,288],["WY",216,216]];


function loadvis() {
	document.getElementById("startBtn").remove();
	storeAffected();
	setTimeout(loadMap(), 100000);
}


// template taken from https://www.visualcinnamon.com/2013/07/self-organizing-maps-creating-hexagonal.html
async function loadMap() {

	let chart = d3.select("#state");
	makeInnerArea(chart);

	//The maximum radius the hexagons can have to still fit the screen
	var hexRadius = 25;

	//Calculate the center position of each hexagon
	var points = [];
	for (var i = 0; i < states.length; i++) {
		points.push([states[i][1] + 60, states[i][2] + 60]);
	}

	//Create SVG element
	var svg = d3.select("#state").append("svg")
		.attr("width", totalWidth + margins.left + margins.right)
		.attr("height", totalHeight + margins.top + margins.bottom)
		.append("g")
		.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

	//Set the hexagon radius
	var hexbin = d3.hexbin().radius(hexRadius);



	//Draw the hexagons
	svg.append("g")
		.selectAll(".hexagon")
		.data(hexbin(points))
		.enter().append("path")
		.attr("class", "hexagon")
		.attr("d", function (d) {
			return "M" + d.x + "," + d.y + hexbin.hexagon();
		})
		.attr("stroke", "grey")
		.attr("stroke-width", "1px")
		.style("fill", (d,i) => hexColor(i))
		.on("mouseover", (d,i) => mousehover(i))
		.on("mouseout", clearInfo);


	svg.append("rect")
		.attr("x", totalWidth - 600)
		.attr("y", 0)
		.attr("width", 500)
		.attr("height", 750)
		.style("fill", "rgb(10,10,10)");

	svg.append("rect")
		.attr("x", totalWidth - 560)
		.attr("y", 50)
		.attr("width", 200)
		.attr("height", 225)
		.style("fill", "rgb(32,32,32)");

	svg.append("text")
		.attr("x", totalWidth - 510)
		.attr("y", 100)
		.attr("fill", "rgb(150,150,150)")
		.attr("font-family", "arial")
		.attr("font-size", "40px")
		.text("State");

	svg.append("rect")
		.attr("x", totalWidth - 335)
		.attr("y", 50)
		.attr("width", 200)
		.attr("height", 225)
		.style("fill", "rgb(32,32,32)");

	svg.append("text")
		.attr("x", totalWidth - 330)
		.attr("y", 100)
		.attr("fill", "rgb(150,150,150)")
		.attr("font-family", "arial")
		.attr("font-size", "40px")
		.text("Number of");

	svg.append("text")
		.attr("x", totalWidth - 310)
		.attr("y", 140)
		.attr("fill", "rgb(150,150,150)")
		.attr("font-family", "arial")
		.attr("font-size", "40px")
		.text("Infected");

	svg.append("text")
		.attr("text-anchor", "end")
		.attr("x", 575)
		.attr("y", 50)
		.attr("fill", "rgb(150,150,150)")
		.attr("font-family", "arial")
		.attr("font-size", "25px")
		.text("Cyber Breaches in the United States of America");

	svg.append("circle")
		.attr("cx",180)
		.attr("cy",707)
		.attr("r", 6)
		.style("fill", "rgb(150,0,0)")

	svg.append("text")
		.attr("x", 195)
		.attr("y", 709)
		.text("# Affected > 1,000,000")
		.style("font-size", "20px")
		.style("font-family", "Arial")
		.style("fill", "rgb(150,150,150)")
		.attr("alignment-baseline","middle")

	svg.append("circle")
		.attr("cx",430)
		.attr("cy",707)
		.attr("r", 6)
		.style("fill", "rgb(225,145,0)")

	svg.append("text")
		.attr("x", 445)
		.attr("y", 709)
		.text("# Affected > 100,000 ")
		.style("font-size", "20px")
		.style("font-family", "Arial")
		.style("fill", "rgb(150,150,150)")
		.attr("alignment-baseline","middle")

	svg.append("circle")
		.attr("cx",662)
		.attr("cy",707)
		.attr("r", 6)
		.style("fill", "rgb(225,225,0)")

	svg.append("text")
		.attr("x", 677)
		.attr("y", 709)
		.text("# Affected > 0")
		.style("font-size", "20px")
		.style("font-family", "Arial")
		.style("fill", "rgb(150,150,150)")
		.attr("alignment-baseline","middle")

}

function hexColor(index) {
	if (ppl_affected[index] > 1000000) {
		return("rgb(150,0,0)");
	} else if (ppl_affected[index] < 100000) {
		return("rgb(255, 225, 0)");
	} else if (ppl_affected[index] <= 1000000 && ppl_affected[index] >= 100000) {
		return("rgb(255, 145, 0)");
	} else {
		return("rgb(255, 255, 255)");
	}
}

function storeAffected() {
	d3.csv("newcyberSecurityBreaches.csv").then(function(data) {
		data.forEach(function(d) {
			d["Individuals_Affected"] = +d["Individuals_Affected"];
		});

		var ind_aff = 0;
		for (var i = 0; i < states.length; i++) {
			if (ppl_affected.length == states.length) {
				break;
			}
			for (var j = 0; j < data.length; j++) {
				if (data[j]["State"] === states[i][0]) {
					ind_aff += data[j]["Individuals_Affected"];
				}
			}
			ppl_affected.push(ind_aff);
			ind_aff = 0;
		}

	});
}

function mousehover(index) {
	var svg = d3.select("#state").append("svg")
		.attr("width", totalWidth + margins.left + margins.right)
		.attr("height", totalHeight + margins.top + margins.bottom)
		.append("g")
		.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

	svg.append("text")
		.attr("id", "stateStat")
		.attr("x", totalWidth - 510)
		.attr("y", 225)
		.attr("fill", "rgb(150,150,150)")
		.attr("font-family", "arial")
		.attr("font-size", "70px")
		.text(states[index][0]);

		svg.append("text")
		.attr("id", "attackStat")
		.attr("x", totalWidth - 290)
		.attr("y", 215)
		.attr("fill", "rgb(150,150,150)")
		.attr("font-family", "arial")
		.attr("font-size", "30px")
		.text(ppl_affected[index]);


		var minibox = svg.append("svg")
			.attr("id", "minibox")
			.attr("x", "1025")
			.attr("y", "350")
			.attr("width", 1600)
			.attr("height", 600)
			.append("g")


		makeBarGraph(index);

			minibox.append("rect")
				.attr("class", "lg")
				.style('fill', "rgb(32,32,32)");

}

function clearInfo() {
	document.getElementById("stateStat").remove();
	document.getElementById("attackStat").remove();
	document.getElementById("minibox").remove();

}

function makeInnerArea(chart) {
	chart.append("rect")
		.attr("class", "inner")
		.attr("x", margins.left)
		.attr("y", margins.top)
		.attr("width", innerWidth)
		.attr("height", innerHeight)
		.attr("fill", "rgb(19,32,38)");
}

function translate(x, y) {
	return `translate (${x}, ${y})`;
}


function makeBarGraph(index) {
	//sources used for function: https://bl.ocks.org/d3noob/8952219, https://www.tutorialsteacher.com/d3js/create-bar-chart-using-d3js
	var margin = {top: 40, right: 20, bottom: 40, left: 70},
		width = 460 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;

	var x = d3.scaleBand()
		.range([0, width])
		.padding(0.1);

	var y = d3.scaleLinear()
		.range([height, 0]);


	var svg = d3.select("#minibox").append("svg")
		.attr("id", "barGraphh")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)


		.append("g")
		.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");


	data = d3.csv("newcyberSecurityBreaches.csv", function(d, i, names) {
		return {

			state: d['State'],
			year: +d.year,
			numAffected: +d["Individuals_Affected"],


	};
	}).then(function (data){

		x.domain(data.map(function(d) { return d.year; }));
		y.domain([0, d3.max(data, function(d) { return d.numAffected; })]);

		svg.selectAll(".bar")

			.data(data.filter(function(d){									//filter technique found at https://www.d3-graph-gallery.com/graph/basic_datamanipulation.html
				return d.state === states[index][0]}))
			.enter().append("rect")
			.attr("class", "bar")
			.style('fill', 'rgb(255, 145, 0)')
			.attr("x", function(d) { return x(d.year); })
			.attr("width", x.bandwidth())
			.attr("y", function(d) { return y(d.numAffected); })
			.attr("height", function(d) { return height - y(d.numAffected); });


		svg.append("g")
			.attr("transform", "translate(0," + height + ")")
			.attr("class", "axisColourX")
			.call(d3.axisBottom(x));

		svg.append("text")
			.attr("transform",
				"translate(" + (width/2) + " ," +
				(height + margin.top - 5) + ")")
			.style("text-anchor", "middle")
			.style("font", "12px Arial")
			.attr("fill", "rgb(150,150,150)")
			.text("Year");

		//axis sources: https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e
		svg.append("g")
			.attr("class", "axisColourY")
			.call(d3.axisLeft(y));

		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.style("font", "12px Arial")
			.attr("fill", "rgb(150,150,150)")
			.text("# of Individuals Affected");


	});


}

