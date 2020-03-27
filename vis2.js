//Montek Parmar
//30024222
//Tutorial code was used as Template
//Additional Tutorials: https://blockbuilder.org/1Cr18Ni9/bfadecc96183c48d13b7b90bcf358a61

var margins = {top: 20, right: 20, bottom: 30, left: 80};
var totalWidth = 1600;
var totalHeight = 800;

var innerWidth = totalWidth - margins.left - margins.right;
var innerHeight = totalHeight - margins.top - margins.bottom;
function hoverNum() {
	let chart = d3.select("#hoverNum");
	makeInnerArea(chart);

	let data = d3.csv("cyberSecurityBreaches.csv", function (d, i, names) {
		return {
			year: d['year'],
			state: d['State'],
			numAffected: d["Individuals_Affected"],
			loc: d["Location_of_Breached_Information"],

		};
	}).then(function (data) {

		let stack = d3.stack()
			.keys(["numAffected"]);
		let series = stack(data);
		console.log(series);


		//setup scales
		let domain = data.map(d => (d.state));
		let xscale = d3.scaleBand(domain, [0, innerWidth])
			.padding(.1);

		let maxSum = Math.max(...data.map(d => (parseFloat(d.numAffected))));

		let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
			.nice();

		let classes = ["Number of Affected Indivduals"];

		//leave
		let colors = d3.scaleOrdinal()
			.domain(classes)
			.range(d3.schemeAccent);



		let numAff = chart.selectAll(".Individuals_Affected")
			.data(series);


		var tooltip = d3.select("body")
			.append("div")
			.style("position", "absolute")
			.style("z-index", "10")
			.style("visibility", "hidden")

			.text("Number of Cases");

			console.log("NUM AFF: " + numAff);


		let groupBars = numAff.enter().append("g")
			//enter stuff
			.attr("class", "Individuals_Affected")
			.attr("id", (d, i) => (classes[i]))
			.attr("transform", translate(margins.left, margins.top))
			.attr("fill", (d, i) => (colors(i)))
			.merge(numAff)
			.on("mouseover", function(){return tooltip.style("visibility", "visible");})
			.on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
			.on("mouseout", function(){return tooltip.style("visibility", "hidden");})
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



	});

	console.log(data); //show that d3.csv is async. This calls before anything in then
}


function col() {
	let chart = d3.select("#col");
	makeInnerArea(chart);

	let data = d3.csv("cyberSecurityBreaches.csv", function (d, i, names) {
		return {
			year: d['year'],
			loc: d["Location_of_Breached_Information"],
			state: d['State'],
			numAffected: d["Individuals_Affected"],

		};
	}).then(function (data) {

		let stack = d3.stack()
			.keys(["numAffected"]);
		let series = stack(data);
		console.log(series);



		//setup scales
		let domain = data.map(d => (d.state));
		let xscale = d3.scaleBand(domain, [0, innerWidth])
			.padding(.1);

		let maxSum = Math.max(...data.map(d => (parseFloat(d.numAffected))));

		let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
			.nice();

		let classes = ["Number of Affected Individuals"];

		//leave
		let colors = d3.scaleOrdinal()
			.domain(classes)
			.range(d3.schemeAccent);



		let numAff = chart.selectAll(".Individuals_Affected")
			.data(series);


		var tooltip = d3.select("body")
			.append("div")
			.style("position", "absolute")
			.style("z-index", "10")
			.style("visibility", "hidden")

			.text("Number of Cases");

		console.log("NUM AFF: " + numAff);


		let groupBars = numAff.enter().append("g")
			//enter stuff
			.attr("class", "Individuals_Affected")
			.attr("id", (d, i) => (classes[i]))
			.attr("transform", translate(margins.left, margins.top))
			.attr("fill", (d, i) => (colors(i)))
			.merge(numAff)
			.on("mouseover", function(){tooltip.text(d.numAffected);return tooltip.style("visibility", "visible");})
			.on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
			.on("mouseout", function(){return tooltip.style("visibility", "hidden");})
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



	});

}

function hoverGlow() {
    let chart = d3.select("#hoverGlow");
    makeInnerArea(chart);

    let data = d3.csv("cyberSecurityBreaches.csv", function (d, i, names) {
        return {
            year: d['year'],
            state: d['State'],
            numAffected: d["Individuals_Affected"],
            loc: d["Location_of_Breached_Information"],

        };
    }).then(function (data) {

        let stack = d3.stack()
            .keys(["numAffected"]);
        let series = stack(data);
        console.log(series);




        //setup scales
        let domain = data.map(d => (d.state));
        let xscale = d3.scaleBand(domain, [0, innerWidth])
            .padding(.1);

        let maxSum = Math.max(...data.map(d => (parseFloat(d.numAffected))));

        let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
            .nice();

        let classes = ["Number of Affected Indivduals"];

        //leave
        let colors = d3.scaleOrdinal()
            .domain(classes)
            .range(d3.schemeDark2);



        let numAff = chart.selectAll(".Individuals_Affected")
            .data(series);


        var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")

            .text("Number of Cases");

        console.log("NUM AFF: " + numAff);


        let groupBars = numAff.enter().append("g")
            //enter stuff
            .attr("class", "Individuals_Affected")
            .attr("id", (d, i) => (classes[i]))
            .attr("transform", translate(margins.left, margins.top))
            .attr("fill", (d, i) => (colors(i)))
            .merge(numAff)
            .on("mouseover", function() {
                d3.select(this)
                    .attr("fill", "red");
            })
            .on("mouseout", function(d, i) {
                d3.select(this).attr("fill", function(){
                    return "" + colors(i) + "";
                });

                }
            )

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



    });

    console.log(data);
}

function numAffectYear() {
    let chart = d3.select("#numAffectYear");
    makeInnerArea(chart);

    let data = d3.csv("cyberSecurityBreaches.csv", function (d, i, names) {
        return {
            year: d['year'],
            state: d['State'],
            numAffected: d["Individuals_Affected"],
            loc: d["Location_of_Breached_Information"],

        };
    }).then(function (data) {

        let stack = d3.stack()
            .keys(["numAffected"]);
        let series = stack(data);
        console.log(series);




        //setup scales
        let domain = data.map(d => (d.year));
        let xscale = d3.scaleBand(domain, [0, innerWidth])
            .padding(.1);

        let maxSum = Math.max(...data.map(d => (parseFloat(d.numAffected))));

        let yscale = d3.scaleLinear([0,maxSum], [innerHeight, 0])
            .nice();

        let classes = ["Number of Affected Indivduals"];

        //leave
        let colors = d3.scaleOrdinal()
            .domain(classes)
            .range(d3.schemeDark2);



        let numAff = chart.selectAll(".Individuals_Affected")
            .data(series);


        var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")

            .text("Number of Cases");

        console.log("NUM AFF: " + numAff);


        let groupBars = numAff.enter().append("g")
            //enter stuff
            .attr("class", "Individuals_Affected")
            .attr("id", (d, i) => (classes[i]))
            .attr("transform", translate(margins.left, margins.top))
            .attr("fill", (d, i) => (colors(i)))
            .merge(numAff)
            .on("mouseover", function() {
                d3.select(this)
                    .attr("fill", "red");
            })
            .on("mouseout", function(d, i) {
                    d3.select(this).attr("fill", function(){
                        return "" + colors(i) + "";
                    });

                }
            )

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



    });

    console.log(data); //show that d3.csv is async. This calls before anything in then
}

function type(d) {
    d.frequency = +d.frequency;
    return d;
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
