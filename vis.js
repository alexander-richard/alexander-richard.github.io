// Used the week 6 tutorial as a template to create these visualizations
// Used the tutorial at https://www.freshconsulting.com/d3-js-gradients-the-easy-way/ for the gradients
// Alexander Richard
// ID: 30009796

var margins = {top: 20, right: 20, bottom: 30, left: 80};
var totalWidth = 1600;
var totalHeight = 800;

var innerWidth = totalWidth - margins.left - margins.right;
var innerHeight = totalHeight - margins.top - margins.bottom;
function state() {
	let chart = d3.select("#state");
	makeInnerArea(chart);

	let data = d3.csv("Cyber Security Breaches.csv", function (d, i, names) {
		return {
			year: d['year'],
			affected: d["Individuals_Affected"],
			state: d["State"],
			loc: d["Location_of_Breached_Information"]
		};
	}).then(function (data) {
		//make sure data is parsed properly
		console.log(data);
		let stack = d3.stack()
			.keys(["affected"]);
		let series = stack(data);
		console.log(series);

		//setup scales
		let domain = data.map(d => (d.state));
		let xscale = d3.scaleBand(domain, [0, innerWidth])
			.padding(.1);

		let maxLow = Math.max(...data.map(d => (d.affected)));
		let maxMid = Math.max(...data.map(d => (d.affected)));
		let maxHigh = Math.max(...data.map(d => (d.affected)));
		console.log(`${maxHigh}, ${maxMid}, ${maxLow}`);
		console.log(maxHigh + maxMid + maxLow);

		let maxSum = Math.max(...data.map(d => (parseInt(d.affected))));
		console.log(maxSum);

		let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
			.nice();

		let classes = ["Individuals Affected"];
		let colors = d3.scaleOrdinal()
			.domain(classes)
			.range(d3.schemeAccent);


		var svg = d3.select("body").append("svg")
			.attr("width", 500)
			.attr("height", 300);

		var defs = svg.append("defs");

		var gradient = defs.append("linearGradient")
			.attr("id", "svgGradient")
			.attr("x1", "0%")
			.attr("x2", "0%")
			.attr("y1", "0%")
			.attr("y2", "100%");

		gradient.append("stop")
			.attr('class', 'start')
			.attr("offset", "0%")
			.attr("stop-color", "crimson")
			.attr("stop-opacity", 1);

		gradient.append("stop")
			.attr('class', 'end')
			.attr("offset", "100%")
			.attr("stop-color", "cyan")
			.attr("stop-opacity", 1);


		let age_group = chart.selectAll(".age_group").data(stack(data));
		//can probably skip but easier to see.
		let groupBars = age_group.enter().append("g") //should make three groups because three keys in data.
			.attr("class", "age_group")
			.attr("id", (d,i) => (i))
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("fill", "url(#svgGradient)")//(d,i) => (colors(i)))
		.merge(age_group)
			.selectAll(".bar").data(d => (d));



		groupBars.enter().append("rect")
			.attr("class", "bar")
		.merge(groupBars)
			.attr("x", (d,i) => (xscale(domain[i])))
			.attr("y", d => (yscale(d[1]))) //get the bottom, IE the first element
			.attr("width", xscale.bandwidth())
			.attr("height", d => (yscale(d[0]) - yscale(d[1])));


		// make axes in the promise block because scales are dependent on data.
		let xaxis = d3.axisBottom(xscale);
		let yaxis = d3.axisLeft(yscale);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("class", "axis")
			.attr("id", "yaxis")
			.call(yaxis);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top + innerHeight})`)
			.attr("class", "axis")
			.attr("id", "xaxis")
			.call(xaxis);

		//legend for the bars
		let legend = chart.append("g")
			.attr("class", "legend")
			.attr("transform", translate(margins.left + innerWidth, margins.top))
		.selectAll(".entry").data(classes);

		let entries = legend.enter().append("g")
			.attr("class", "entry")
			.attr("transform", (d,i) => (translate(-5, 20 *i + 5)))
			.attr("fill", "url(#svgGradient)");

		entries.append("rect")
			.attr("x", -20)
			.attr("y", 0)
			.attr("width", 20)
			.attr("height", 20);

		entries.append("text")
			.attr("text-anchor", "end")
			.attr("x", -25)
			.attr("y", 10)
			.attr("dy", ".5em")
			.attr("fill", "black")
			.text((d,i) => (classes[i]));

	});

	console.log(data); //show that d3.csv is async. This calls before anything in then
}

function year() {
	let chart = d3.select("#year");
	makeInnerArea(chart);

	let data = d3.csv("Cyber Security Breaches.csv", function (d, i, names) {
		return {
			year: d['year'],
			affected: d["Individuals_Affected"]
		};
	}).then(function (data) {
		//make sure data is parsed properly
		console.log(data);
		let stack = d3.stack()
			.keys(["affected"]);
		let series = stack(data);
		console.log(series);

		//setup scales
		let domain = data.map(d => (d.year));
		let xscale = d3.scaleBand(domain, [0, innerWidth])
			.padding(.1);

		let maxLow = Math.max(...data.map(d => (d.affected)));
		let maxMid = Math.max(...data.map(d => (d.affected)));
		let maxHigh = Math.max(...data.map(d => (d.affected)));
		console.log(`${maxHigh}, ${maxMid}, ${maxLow}`);
		console.log(maxHigh + maxMid + maxLow);

		let maxSum = Math.max(...data.map(d => (parseInt(d.affected))));
		console.log(maxSum);

		let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
			.nice();

		let classes = ["Individuals Affected"];
		let colors = d3.scaleOrdinal()
			.domain(classes)
			.range(d3.schemeAccent);

		let age_group = chart.selectAll(".age_group").data(stack(data));
		//can probably skip but easier to see.
		let groupBars = age_group.enter().append("g") //should make three groups because three keys in data.
			.attr("class", "age_group")
			.attr("id", (d,i) => (i))
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("fill", "url(#yearGradient)") //(d,i) => (colors(i)))
			.merge(age_group)
			.selectAll(".bar").data(d => (d));

		var svg = d3.select("body").append("svg")
			.attr("width", 500)
			.attr("height", 300);

		var defs = svg.append("defs");

		var gradient = defs.append("linearGradient")
			.attr("id", "yearGradient")
			.attr("x1", "0%")
			.attr("x2", "0%")
			.attr("y1", "0%")
			.attr("y2", "100%");

		gradient.append("stop")
			.attr('class', 'start')
			.attr("offset", "0%")
			.attr("stop-color", "darkblue")
			.attr("stop-opacity", 1);

		gradient.append("stop")
			.attr('class', 'end')
			.attr("offset", "100%")
			.attr("stop-color", "cyan")
			.attr("stop-opacity", 1);

		groupBars.enter().append("rect")
			.attr("class", "bar")
			.merge(groupBars)
			.attr("x", (d,i) => (xscale(domain[i])))
			.attr("y", d => (yscale(d[1]))) //get the bottom, IE the first element
			.attr("width", xscale.bandwidth())
			.attr("height", d => (yscale(d[0]) - yscale(d[1])));


		// make axes in the promise block because scales are dependent on data.
		let xaxis = d3.axisBottom(xscale);
		let yaxis = d3.axisLeft(yscale);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("class", "axis")
			.attr("id", "yaxis")
			.call(yaxis);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top + innerHeight})`)
			.attr("class", "axis")
			.attr("id", "xaxis")
			.call(xaxis);

		//legend for the bars
		let legend = chart.append("g")
			.attr("class", "legend")
			.attr("transform", translate(margins.left + innerWidth, margins.top))
			.selectAll(".entry").data(classes);

		let entries = legend.enter().append("g")
			.attr("class", "entry")
			.attr("transform", (d,i) => (translate(-5, 20 *i + 5)))
			.attr("fill", "url(#yearGradient)");

		entries.append("rect")
			.attr("x", -20)
			.attr("y", 0)
			.attr("width", 20)
			.attr("height", 20);

		entries.append("text")
			.attr("text-anchor", "end")
			.attr("x", -25)
			.attr("y", 10)
			.attr("dy", ".5em")
			.attr("fill", "black")
			.text((d,i) => (classes[i]));

	});

	console.log(data); //show that d3.csv is async. This calls before anything in then
}

function type() {
	let chart = d3.select("#type");
	makeInnerArea(chart);

	let data = d3.csv("Cyber Security Breaches.csv", function (d, i, names) {
		return {
			year: d['year'],
			affected: d["Individuals_Affected"],
			state: d["State"],
			type: d["Type_of_Breach"]
		};
	}).then(function (data) {
		//make sure data is parsed properly
		console.log(data);
		let stack = d3.stack()
			.keys(["affected"]);
		let series = stack(data);
		console.log(series);

		//setup scales
		let domain = data.map(d => (d.type));
		let xscale = d3.scaleBand(domain, [0, innerWidth])
			.padding(.1);

		let maxLow = Math.max(...data.map(d => (d.affected)));
		let maxMid = Math.max(...data.map(d => (d.affected)));
		let maxHigh = Math.max(...data.map(d => (d.affected)));
		console.log(`${maxHigh}, ${maxMid}, ${maxLow}`);
		console.log(maxHigh + maxMid + maxLow);

		let maxSum = Math.max(...data.map(d => (parseInt(d.affected))));
		console.log(maxSum);

		let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
			.nice();

		let classes = ["Individuals Affected"];
		let colors = d3.scaleOrdinal()
			.domain(classes)
			.range(d3.schemeAccent);


		var svg = d3.select("body").append("svg")
			.attr("width", 500)
			.attr("height", 300);

		var defs = svg.append("defs");

		var gradient = defs.append("linearGradient")
			.attr("id", "typeGradient")
			.attr("x1", "0%")
			.attr("x2", "0%")
			.attr("y1", "0%")
			.attr("y2", "100%");

		gradient.append("stop")
			.attr('class', 'start')
			.attr("offset", "0%")
			.attr("stop-color", "purple")
			.attr("stop-opacity", 1);

		gradient.append("stop")
			.attr('class', 'end')
			.attr("offset", "100%")
			.attr("stop-color", "pink")
			.attr("stop-opacity", 1);


		let age_group = chart.selectAll(".age_group").data(stack(data));
		//can probably skip but easier to see.
		let groupBars = age_group.enter().append("g") //should make three groups because three keys in data.
			.attr("class", "age_group")
			.attr("id", (d,i) => (i))
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("fill", "url(#typeGradient)")//(d,i) => (colors(i)))
			.merge(age_group)
			.selectAll(".bar").data(d => (d));



		groupBars.enter().append("rect")
			.attr("class", "bar")
			.merge(groupBars)
			.attr("x", (d,i) => (xscale(domain[i])))
			.attr("y", d => (yscale(d[1]))) //get the bottom, IE the first element
			.attr("width", xscale.bandwidth())
			.attr("height", d => (yscale(d[0]) - yscale(d[1])));


		// make axes in the promise block because scales are dependent on data.
		let xaxis = d3.axisBottom(xscale);
		let yaxis = d3.axisLeft(yscale);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("class", "axis")
			.attr("id", "yaxis")
			.call(yaxis);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top + innerHeight})`)
			.attr("class", "axis")
			.attr("id", "xaxis")
			.call(xaxis);

		//legend for the bars
		let legend = chart.append("g")
			.attr("class", "legend")
			.attr("transform", translate(margins.left + innerWidth, margins.top))
			.selectAll(".entry").data(classes);

		let entries = legend.enter().append("g")
			.attr("class", "entry")
			.attr("transform", (d,i) => (translate(-5, 20 *i + 5)))
			.attr("fill", "url(#typeGradient)");

		entries.append("rect")
			.attr("x", -20)
			.attr("y", 0)
			.attr("width", 20)
			.attr("height", 20);

		entries.append("text")
			.attr("text-anchor", "end")
			.attr("x", -25)
			.attr("y", 10)
			.attr("dy", ".5em")
			.attr("fill", "black")
			.text((d,i) => (classes[i]));

	});

	console.log(data); //show that d3.csv is async. This calls before anything in then
}

function gradient() {
	let chart = d3.select("#gradient");
	makeInnerArea(chart);

	let data = d3.csv("Cyber Security Breaches.csv", function (d, i, names) {
		return {
			year: d['year'],
			affected: d["Individuals_Affected"],
			state: d["State"],
			type: d["Type_of_Breach"]
		};
	}).then(function (data) {
		//make sure data is parsed properly
		console.log(data);
		let stack = d3.stack()
			.keys(["affected"]);
		let series = stack(data);
		console.log(series);

		//setup scales
		let domain = data.map(d => (d.year));
		let xscale = d3.scaleBand(domain, [0, innerWidth])
			.padding(.1);

		let maxLow = Math.max(...data.map(d => (d.affected)));
		let maxMid = Math.max(...data.map(d => (d.affected)));
		let maxHigh = Math.max(...data.map(d => (d.affected)));
		console.log(`${maxHigh}, ${maxMid}, ${maxLow}`);
		console.log(maxHigh + maxMid + maxLow);

		let maxSum = Math.max(...data.map(d => (parseInt(d.affected))));
		console.log(maxSum);

		let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
			.nice();

		let classes = ["Individuals Affected"];
		let colors = d3.scaleOrdinal()
			.domain(classes)
			.range(d3.schemeAccent);

		let age_group = chart.selectAll(".age_group").data(stack(data));
		//can probably skip but easier to see.
		let groupBars = age_group.enter().append("g") //should make three groups because three keys in data.
			.attr("class", "age_group")
			.attr("id", (d,i) => (i))
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("fill", (d,i) => (colors(i)))
			.merge(age_group)
			.selectAll(".bar").data(d => (d));


		groupBars.enter().append("rect")
			.attr("class", "bar")
			.merge(groupBars)
			.attr("x", (d,i) => (xscale(domain[i])))
			.attr("y", d => (yscale(d[1]))) //get the bottom, IE the first element
			.attr("width", xscale.bandwidth())
			.attr("height", d => (yscale(d[0]) - yscale(d[1])));


		// make axes in the promise block because scales are dependent on data.
		let xaxis = d3.axisBottom(xscale);
		let yaxis = d3.axisLeft(yscale);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top})`)
			.attr("class", "axis")
			.attr("id", "yaxis")
			.call(yaxis);

		chart.append("g")
			.attr("transform", `translate(${margins.left}, ${margins.top + innerHeight})`)
			.attr("class", "axis")
			.attr("id", "xaxis")
			.call(xaxis);

		//legend for the bars
		let legend = chart.append("g")
			.attr("class", "legend")
			.attr("transform", translate(margins.left + innerWidth, margins.top))
			.selectAll(".entry").data(classes);

		let entries = legend.enter().append("g")
			.attr("class", "entry")
			.attr("transform", (d,i) => (translate(-5, 20 *i + 5)))
			.attr("fill", (d,i) => (colors(i)));

		entries.append("rect")
			.attr("x", -20)
			.attr("y", 0)
			.attr("width", 20)
			.attr("height", 20);

		entries.append("text")
			.attr("text-anchor", "end")
			.attr("x", -25)
			.attr("y", 10)
			.attr("dy", ".5em")
			.attr("fill", "black")
			.text((d,i) => (classes[i]));

	});

	console.log(data); //show that d3.csv is async. This calls before anything in then
}



function makeInnerArea(chart) {
	chart.append("rect")
		.attr("class", "inner")
		.attr("x", margins.left)
		.attr("y", margins.top)
		.attr("width", innerWidth)
		.attr("height", innerHeight)
		.attr("fill", "white");
}

function translate(x, y) {
	return `translate (${x}, ${y})`;
}