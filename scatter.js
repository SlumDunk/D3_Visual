let margin = {top: 50, right: 300, bottom: 50, left: 50},
    outerWidth = 1050,
    outerHeight = 500,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

let x = d3.scale.linear()
    .range([0, width]).nice();

let y = d3.scale.linear()
    .range([height, 0]).nice();

let xCat = "x",
    yCat = "y",
    colorCat = "classification";


let cValue = function (d) {
    if (d.classification == 'TN' || d.classification == 'FN') {
        return 'Vandal User';
    } else {
        return 'Benign User';
    }
    // return d.classification;
};

axios.get('http://127.0.0.1:8000/wiki/data', {
    params: {
        time_start: 5,
        time_end: 10,
        good_start: 5,
        good_end: 10,
        bad_start: 5,
        bad_end: 10
    }
}).then(function (response) {
    let data = response.data;

    let xMax = d3.max(data, function (d) {
            return d[xCat];
        }) * 1.05,
        xMin = d3.min(data, function (d) {
            return d[xCat];
        }),
        yMax = d3.max(data, function (d) {
            return d[yCat];
        }) * 1.05,
        yMin = d3.min(data, function (d) {
            return d[yCat];
        });

    xMin = xMin > 0 ? 0 : xMin;
    yMin = yMin > 0 ? 0 : yMin;

    x.domain([xMin, xMax]);
    y.domain([yMin, yMax]);

    let xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(-height);

    let yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(-width);

    let color = d3.scale.category10();

    let tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(function (d) {
            return xCat + ": " + d[xCat] + "<br>" + yCat + ": " + d[yCat];
        });

    let zoomBeh = d3.behavior.zoom()
        .x(x)
        .y(y)
        .scaleExtent([0, 500])
        .on("zoomend", zoom);

    let svg = d3.select("#scatter")
        .append("svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoomBeh);

    svg.call(tip);

    // Lasso functions to execute while lassoing
    let lasso_start = function () {
        lasso.items()
            .attr("r", 3) // reset size
            .style("fill", null) // clear all of the fills
            .classed({"not_possible": true, "selected": false}); // style as not possible
    };

    let lasso_draw = function () {
        // Style the possible dots
        lasso.items().filter(function (d) {
            return d.possible === true
        }).classed({"not_possible": false, "possible": true});

        // Style the not possible dot
        lasso.items().filter(function (d) {
            return d.possible === false
        }).classed({"not_possible": true, "possible": false});
    };

    let lasso_end = function () {
        // Reset the color of all dots
        lasso.items()
            .style("fill", function (d) {
                return color(cValue(d));
            });

        // Style the selected dots
        lasso.items().filter(function (d) {
            return d.selected === true
        }).classed({"not_possible": false, "possible": false})
            .attr("r", 7)
            .style("fill", function (d) {
                return 'red';
            });
        ;

        // Reset the style of the not selected dots
        lasso.items().filter(function (d) {
            return d.selected === false
        }).classed({"not_possible": false, "possible": false})
            .attr("r", 3.5)
            .style("fill", function (d) {
                return 'yellow';
            });

    };

// Create the area where the lasso event can be triggered
    let lasso_area = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("opacity", 0);

// Define the lasso
    let lasso = d3.lasso()
        .closePathDistance(75) // max distance for the lasso loop to be closed
        .closePathSelect(true) // can items be selected by closing the path?
        // .hoverSelect(true) // can items by selected by hovering over them?
        .area(lasso_area) // area where the lasso can be started
        .on("start", lasso_start) // lasso start function
        .on("draw", lasso_draw) // lasso draw function
        .on("end", lasso_end); // lasso end function

// Init the lasso on the svg:g that contains the dots
    svg.call(lasso);


    svg.append("g")
        .classed("x axis", true)
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .classed("label", true)
        .attr("x", width)
        .attr("y", margin.bottom - 10)
        .style("text-anchor", "end")
        .text(xCat);

    svg.append("g")
        .classed("y axis", true)
        .call(yAxis)
        .append("text")
        .classed("label", true)
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(yCat);


    let circles = svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .classed("dot", true)
        .attr("r", function (d) {
            return 3.5;
        })
        .attr("transform", transform)
        .style("fill", function (d) {
            return color(cValue(d));
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

    lasso.items(circles);

    let legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .classed("legend", true)
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("circle")
        .attr("r", 3.5)
        .attr("cx", width + 20)
        .attr("fill", color);

    legend.append("text")
        .attr("x", width + 26)
        .attr("dy", ".35em")
        .text(function (d) {
            return d;
        });

    d3.select("input").on("click", change);

    function change() {
        xCat = "x";
        xMax = d3.max(data, function (d) {
            return d[xCat];
        });
        xMin = d3.min(data, function (d) {
            return d[xCat];
        });

        zoomBeh.x(x.domain([xMin, xMax])).y(y.domain([yMin, yMax]));

        let svg = d3.select("#scatter").transition();

        svg.select(".x.axis").duration(750).call(xAxis).select(".label").text(xCat);

        objects.selectAll(".dot").transition().duration(1000).attr("transform", transform);
    }

    function zoom() {
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);

        svg.selectAll(".dot")
            .attr("transform", transform);
    }

    function transform(d) {
        return "translate(" + x(d[xCat]) + "," + y(d[yCat]) + ")";
    }

});

// d3.csv("./data/cereal.csv", function (data) {
//
//     }
// );
