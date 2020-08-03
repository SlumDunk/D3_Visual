let data = [];
//construct parameters
for (let i = 0; i <= 20; i++) {
    let item = {};
    item.date = 5 * i;
    item.price = Math.floor(Math.random() * 600);
    data.push(item);
}

let margin2 = {top: 150, right: 10, bottom: 20, left: 40},
    height2 = 250 - margin2.top - margin2.bottom;

let x2 = d3.scale.ordinal().rangeBands([0, width], .1),
    y2 = d3.scale.linear().range([height2, 0]);

let xAxis2 = d3.svg.axis().scale(x2).orient("bottom");

x2.domain(data.map(function (d) {
    return d.date
}));

y2.domain([0, d3.max(data, function (d) {
    return d.price;
})]);

let offset = x2(10) - x2(5);

let brush_1 = d3.svg.brush()
    .x(x2)
    .on("brushend", brushed_1);

let brush_2 = d3.svg.brush()
    .x(x2)
    .on("brushend", brushed_2);

let brush_3 = d3.svg.brush()
    .x(x2)
    .on("brushend", brushed_3);

let svg = d3.select("#left-div-1").append("svg")
    .attr("width", width_1 + margin.left + margin.right)
    .attr("height", height_1 + margin.top + margin.bottom);

let context = svg.append("g").attr('id', 'parameter_context')
    .attr("class", "context");


let gap_y = 40, gap = 39;

//time parameter
context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);


svg.append("text")
    .attr("transform",
        "translate(" + (width / 2) + " ," +
        (height2 + margin.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("Time");


context.append("g")
    .attr("class", "x brush_1")
    .call(brush_1)
    .selectAll("rect")
    .attr("y", gap_y)
    .attr("height", height2 - gap);

//good edit parameter
context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height2 * 2 + ")")
    .call(xAxis2);


svg.append("text")
    .attr("transform",
        "translate(" + (width / 2) + " ," +
        (height2 * 2 + margin.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("Good_Edit");

context.append("g")
    .attr("class", "x brush_2")
    .call(brush_2)
    // .call(brush_2.extent,[0,60])
    .selectAll("rect")
    .attr("y", height2 + gap_y)
    .attr("height", height2 - gap);

//bad edit parameter
context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height2 * 3 + ")")
    .call(xAxis2);


svg.append("text")
    .attr("transform",
        "translate(" + (width / 2) + " ," +
        (height2 * 3 + margin.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("Bad_Edit");

context.append("g")
    .attr("class", "x brush_3")
    .call(brush_3)
    // .call(brush_3.extent,[0,60])
    .selectAll("rect")
    .attr("y", height2 * 2 + gap_y)
    .attr("height", height2 - gap);

/**
 * first brush
 * */
function brushed_1() {
    brush_end(1);
}

/**
 * second brush
 * */
function brushed_2() {
    brush_end(2);

}

/**
 * third brush
 * */
function brushed_3() {
    brush_end(3);

}

/**
 * query link according to the combinations of parameters
 * */
function query_link(json_ids) {
    if (json_ids == undefined) {
        json_ids = ''
    }
    axios.get(server_url + '/wiki/model/result', {
        params: {
            time_start: time_start,
            time_end: time_end,
            good_start: good_start,
            good_end: good_end,
            bad_start: bad_start,
            bad_end: bad_end,
            ids: json_ids,

        }
    }).then(function (response) {
        let link_list = response.data;
        if (link_list.length == 0) {
            return;
        }
        //add new link
        //要移除的旧的link
        let remove_links = new Array();
        //上一次保存下来的link
        let prev_link_array = new Array();
        //要显示的link
        let link_array = new Array();
        let filterLinks;

        if (count > 0) {
            let len = prev_json.links.length;
            for (let i = len - count; i < len; i++) {
                let link = prev_json.links[i];
                remove_links.push(link.source + '#' + link.target);
            }
            prev_json.links.splice(prev_json.links.length - count, count);
            count = 0;
        }
        //获取要保留的link
        links.filter(function (path) {
            if (!in_array(node_map.get(path.source.id) + '#' + node_map.get(path.target.id), remove_links)) {
                prev_link_array.push(path.source.id + '#' + path.target.id);
            }
        });

        //遍历返回的link，获取要新添加的Link
        link_list.forEach(function (element) {
            if (!in_array(element.source + '#' + element.target, prev_link_array)) {
                prev_json.links.push({
                    'source': node_map.get(element.source),
                    'target': node_map.get(element.target),
                    'value': 100
                });
                count++;
            }
            link_array.push(element.source + '#' + element.target);
        })

        current_json = JSON.parse(JSON.stringify(prev_json));
        chart.draw(current_json);

        nodes = d3.selectAll('.node');
        links = d3.selectAll('.link');

        nodes.on("mouseover", function (data) {

        });
        links.on("mouseover", function (data) {

        });
        links.on("mouseout", function (data) {
            // links.style('opacity', 1);
        });
        nodes.on("mouseout", function (data) {
            // links.style('opacity', 1);
        });

        filterLinks = links.filter(function (path) {
            let anotherSourceId = path.source.id;
            let anotherTargetId = path.target.id;
            return !in_array(anotherSourceId + '#' + anotherTargetId, link_array);
        });

        links.style('opacity', 1);
        filterLinks.style('opacity', 0.02);

        //要移除的旧的link
        remove_links = null;
        //上一次保存下来的link
        prev_link_array = null;
        //要显示的link
        link_array = null;
        filterLinks = null;
        console.log(link_list);
        let tp = link_list[0]['source'];
        let tn = link_list[1]['source'];
        let fp = link_list[2]['source'];
        let fn = link_list[2]['target'];

        tp = tp.substring(3);
        tn = tn.substring(3);
        fp = fp.substring(3);
        fn = fn.substring(3);

        $('#tp_select').val(tp);
        $('#tn_select').val(tn);
        $('#fp_select').val(fp);
        $('#fn_select').val(fn);
    }).catch(function (error) {
        console.log(error);
    });
}

/**
 * 刷子滑动结束后的动作
 * */
function brush_end(flag) {
    //clean points in the slide window chart
    reset_parameter();
    let brush;
    if (flag == 1) {
        brush = brush_1;
    }

    if (flag == 2) {
        brush = brush_2;
    }

    if (flag == 3) {
        brush = brush_3;
    }

    let selected;
    selected = x2.domain()
        .filter(function (d) {
            // console.log(d);
            return (brush.extent()[0] <= x2(d)) && (x2(d) <= brush.extent()[1]);
        });

    let start;
    let end;

    if (brush.extent()[0] != brush.extent()[1]) {//adjust the range
        start = selected[0] - (x2(selected[0]) >= brush.extent()[0] ? 5 : 0);
        end = selected[selected.length - 1] + (x2(selected[selected.length - 1]) >= brush.extent()[1] ? 0 : 5);
    } else {
        start = 0;
        end = data.length;
    }
    // console.log(start + "#" + end);

    if (flag == 1) {
        time_start = start;
        time_end = end;
    }

    if (flag == 2) {
        good_start = start;
        good_end = end;
    }

    if (flag == 3) {
        bad_start = start;
        bad_end = end;
    }

    //request data
    query_link();
    render_scatter_plot();

}

/**
 * initiate the slide window
 * */
function initiate_slide_window() {
    d3.selectAll(".extent").attr('width', x2(10) - x2(0));
    d3.selectAll(".extent").attr('x', x2(0) + offset / 2);
    brush_1.extent([x2(10), x2(0)]);
    brush_2.extent([x2(10), x2(0)]);
    brush_3.extent([x2(10), x2(0)]);
}

//set the default range
initiate_slide_window();

create_parameter_scatter_plot();

/**
 * create scatter plot for parameter space
 * */
function create_parameter_scatter_plot() {
    $('#param_1_checkbox').prop("checked", true);
    $('#param_2_checkbox').prop("checked", true);
    $('#param_3_checkbox').prop("checked", true);
    let old_svg = d3.select("#param-scatter-plot");
    if (old_svg != undefined) {
        old_svg.remove();
    }

    // d3.select("#reset_parameter_2").style('opacity', 0)

    let xCat = "x",
        yCat = "y";


    let cValue = function (d) {
        if (d.classification == 'P') {
            return 'Position';
        } else if (d.classification == 'FN') {
            return 'False Vandal';
        } else if (d.classification == 'TP') {
            return 'True Positive';
        } else {
            return 'False Positive';
        }
    };

    axios.get(server_url + '/wiki/param/position', {
        params: {}
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

        xMin = xMin > 0 ? 0 : xMin - 200;
        yMin = yMin > 0 ? 0 : yMin - 200;

        xMax = xMax + 200;
        yMax = yMax + 200;

        // let custom_height = width_1 * (yMax - yMin) / (xMax - xMin);
        // console.log(xMax-xMin);
        // console.log(yMax-yMin);
        //
        // console.log('hello' + custom_height);
        // console.log('word'+height_1)
        let x = d3.scale.linear()
            .range([0, width_1]).nice();

        let y = d3.scale.linear()
            .range([height_1, 0]).nice();

        x.domain([xMin, xMax]);
        y.domain([yMin, yMax]);

        let xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(-height_1);

        let yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(-width_1);


        let _40_points = new Array();
        let _60_points = new Array();
        let _80_points = new Array();
        let _100_points = new Array();
        data.forEach(function (d) {
                // console.log(d);
                if (d.val <= 40) {
                    _40_points.push([x(d.x), y(d.y), d.val]);
                    param_points.push([x(d.x), y(d.y), 40]);
                } else if (d.val > 40 && d.val <= 60) {
                    _60_points.push([x(d.x), y(d.y), d.val]);
                    param_points.push([x(d.x), y(d.y), 60]);
                } else if (d.val > 60 && d.val <= 80) {
                    _80_points.push([x(d.x), y(d.y), d.val]);
                    param_points.push([x(d.x), y(d.y), 80]);
                } else if (d.val > 80 && d.val <= 100) {
                    _100_points.push([x(d.x), y(d.y), d.val]);
                    param_points.push([x(d.x), y(d.y), 100]);
                }
            }
        );

        param_source_points.set('40', _40_points);
        param_source_points.set('60', _60_points);
        param_source_points.set('80', _80_points);
        param_source_points.set('100', _100_points);

        let zoomBeh = d3.behavior.zoom()
            .x(x)
            .y(y)
            .scaleExtent([0, 500])
            .on("zoomend", zoom);

        let svg = d3.select("#left-div-2-left").append("svg").attr("id", "param-scatter-plot")
            .attr("width", outerWidth + 50)
            .attr("height", outerHeight_1)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let index = $('#param_index_select option:selected').val();

        create_param_hexbins(svg, index);

        // Lasso functions to execute while lassoing
        let lasso_start = function () {
            lasso_left.items()
                .attr("r", 3.5) // reset size
                .style("fill", null) // clear all of the fills
                .classed({"not_possible": true, "selected": false}); // style as not possible
        };

        let lasso_draw = function () {
            // Style the possible dots
            lasso_left.items().filter(function (d) {
                return d.possible === true
            })
                .classed({"not_possible": false, "possible": true});

            // Style the not possible dot
            lasso_left.items().filter(function (d) {
                return d.possible === false
            })
                .classed({"not_possible": true, "possible": false});
        };

        let lasso_end = function () {
            reset_parameter();
            initiate_slide_window();
            // Reset the color of all dots
            lasso_left.items()
                .style("fill", function (d) {
                    return color_radius(param_cValue(d));
                });
            let copy_selected_points = lasso_left.items().filter(function (d) {
                return d.selected === true;
            })[0];
            old_attributes.splice(0, old_attributes.length);
            copy_selected_points.forEach(function (point) {
                let id = point.attributes['id'].nodeValue;
                let r = point.attributes['r'].nodeValue;
                let style = point.attributes['style'].nodeValue;
                old_attributes.push({
                    'id': id,
                    'r': r,
                    'style': style
                });

            });


            // Style the selected dots
            lasso_left.items().filter(function (d) {
                return d.selected === true;
            })
                .classed({"not_possible": false, "possible": false})
                .style('fill', function(d){
                    if(d.user_id<16031){
                        return 'red';
                    }else{//it is sample data
                        return 'yellow';
                    }
                })
                .attr("r", 7);

            // Reset the style of the not selected dots
            lasso_left.items().filter(function (d) {
                return d.selected === false
            })
                .classed({"not_possible": false, "possible": false})
                .attr("r", 3.5);

            let selected_items = lasso_left.items().filter(function (d) {
                return d.selected === true
            });
            let selected_points = selected_items[0];
            let ids = new Array();
            selected_points.forEach(function (item) {
                let opacity = $('#' + item.id).css('opacity');
                if (opacity == 0) {
                    return;
                } else {
                    console.log(item.attributes['user_id'].value);
                    ids.push(item.attributes['user_id'].value);
                }
            });
            // console.log(ids);
            let json_ids = JSON.stringify(ids);
            axios.get(server_url + '/wiki/param/ids', {
                params: {
                    ids: json_ids,
                }
            }).then(function (response) {
                let result = response.data;
                console.log(result);
                if (result.time.length == 0) {
                    console.log('there is no combinations of parameter that can reach target result');
                } else {
                    let len = result.time.length;
                    let time_range = result.time;
                    let good_range = result.good;
                    let bad_range = result.bad;

                    time_start = time_range[0] >= 5 ? time_range[0] - 5 : 0;
                    time_end = time_range[time_range.length - 1] >= 100 ? time_range[time_range.length - 1] : (time_range[time_range.length - 1] + 5 >= 100 ? 100 : time_range[time_range.length - 1] + 5);
                    good_start = good_range[0] >= 5 ? good_range[0] - 5 : 0;
                    good_end = good_range[good_range.length - 1] >= 100 ? good_range[good_range.length - 1] : (good_range[good_range.length - 1] + 5 >= 100 ? 100 : good_range[good_range.length - 1] + 5);
                    bad_start = bad_range[0] >= 5 ? bad_range[0] - 5 : 0;
                    bad_end = bad_range[bad_range.length - 1] >= 100 ? bad_range[bad_range.length - 1] : (bad_range[bad_range.length - 1] + 5 >= 100 ? 100 : bad_range[bad_range.length - 1] + 5);

                    render_parameter_range(time_start, time_end, good_start, good_end, bad_start, bad_end);

                    let time_points = new Array();
                    let good_points = new Array();
                    let bad_points = new Array();
                    for (let i = 0; i < len; i++) {
                        time_points.push({'x': time_range[i], 'y': gap_y * 1.6});
                        good_points.push({'x': good_range[i], 'y': gap_y * 1.6});
                        bad_points.push({'x': bad_range[i], 'y': gap_y * 1.6});
                    }
                    render_points(time_points, good_points, bad_points);
                    query_link(json_ids);
                    render_scatter_plot();
                }
                svg.trigger("scroll");
            }).catch(function (error) {
                console.log(error);
            });

        };


        // Create the area where the lasso event can be triggered
        let lasso_area_left = svg.append("rect")
            .attr("width", width_1)
            .attr("height", height_1)
            .style("opacity", 0);

        // Define the lasso
        let lasso_left = d3.lasso()
            .closePathDistance(75) // max distance for the lasso loop to be closed
            .closePathSelect(true) // can items be selected by closing the path?
            .hoverSelect(true) // can items by selected by hovering over them?
            .area(lasso_area_left) // area where the lasso can be started
            .on("start", lasso_start) // lasso start function
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function

        // Init the lasso on the svg:g that contains the dots
        svg.call(lasso_left);
        svg.call(zoomBeh);

        svg.append("g")
            .classed("x axis", true)
            .attr("transform", "translate(0," + height_1 + ")")
            .call(xAxis)
            .append("text")
            .classed("label", true)
            .attr("x", width_1)
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

        let objects = svg.append("svg")
            .classed("objects", true)
            .attr("width", width_1)
            .attr("height", height_1);

        objects.append("svg:line")
            .classed("axisLine hAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width_1)
            .attr("y2", 0)
            .attr("transform", "translate(0," + height_1 + ")");

        objects.append("svg:line")
            .classed("axisLine vAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height_1);

        objects.selectAll(".param_dot")
            .data(data)
            .enter().append("circle")
            .attr("id", function (d, i) {
                let tag = '';
                if (d.val <= 40) {
                    tag = 40;
                } else if (d.val > 40 && d.val <= 60) {
                    tag = 60;
                } else if (d.val > 60 && d.val <= 80) {
                    tag = 80;
                } else if (d.val > 80 && d.val <= 100) {
                    tag = 100;
                }
                let id = "param_dot_" + tag + '_' + i;
                // axios.get(server_url + '/wiki/param', {
                //     params: {
                //         row_id: d.user,
                //     }
                // }).then(function (response) {
                //     let data = response.data;
                //     let key = data.time_param + '#' + data.good_edit_param + '#' + data.bad_edit_param;
                //     parameter_position_map.set(key, id);
                // });


                return id;
            })
            .classed("param_dot", true)
            .attr("r", function (d) {
                return 3.5;
            })
            .attr("cx", function (d) {
                return x(d.x);
            })
            .attr("cy", function (d) {
                return y(d.y);
            })
            .attr("user_id", function (d) {
                return d.user;
            })
            .style("fill", function (d) {
                // return color(cValue(d));
                return color_radius(param_cValue(d));
            })
            .on("mouseover", function (d) {
                let x = d3.event.pageX;
                let y = d3.event.pageY;
                axios.get(server_url + '/wiki/param', {
                    params: {
                        row_id: d.user,
                    }
                }).then(function (response) {
                    let data = response.data;
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html('time:' + data.time_param + "<br />" + 'good_edit:' + data.good_edit_param + "<br />"
                        + 'bad_edit:' + data.bad_edit_param)
                        .style("left", (x + 5) + "px")
                        .style("top", (y - 28) + "px");
                });
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        let legend = svg.selectAll(".legend")
            .data(color_radius.domain())
            .enter().append("g")
            .classed("legend", true)
            .attr("transform", function (d, i) {
                let value;
                if(d=='poor'){
                    value=40;
                }
                else if (d == 'average') {
                    value = 60;
                } else if (d == 'good') {
                    value = 80;
                } else {
                    value = 100;
                }
                if (i == 0) {
                    $('#param_1_checkbox').val(value);
                    $('#param_1_checkbox').css('opacity', 1);
                    $('#param_1_checkbox').attr('checked', 'checked');
                } else if (i == 1) {
                    $('#param_2_checkbox').val(value);
                    $('#param_2_checkbox').css('opacity', 1);
                    $('#param_2_checkbox').attr('checked', 'checked');
                } else if(i==2) {
                    $('#param_3_checkbox').val(value);
                    $('#param_3_checkbox').css('opacity', 1);
                    $('#param_3_checkbox').attr('checked', 'checked');
                }else{
                    $('#param_4_checkbox').val(value);
                    $('#param_4_checkbox').css('opacity', 1);
                    $('#param_4_checkbox').attr('checked', 'checked');
                }
                return "translate(0," + (i * 20 + 5) + ")";
            });

        legend.append("circle")
            .attr("r", 3.5)
            .attr("cx", width + 20)
            .attr("fill", color_radius);

        legend.append("text")
            .attr("x", width + 26)
            .attr("dy", ".4em")
            .text(function (d) {
                return d;
            });

        let indication = svg.append('g').classed('legend', true).attr("cx", width + 20).attr('transform', 'translate(0,60)');
        indication.append('text').attr("x", width + 20).attr("dy", "4em").text('Hexbin Index');

        lasso_left.items(d3.selectAll(".param_dot"));

        d3.select("#reset_parameter_2").style('opacity', 1).on("click", change);
        d3.select("#left-div-2-right").style('display', 'block');

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

            objects.selectAll(".param_dot").transition().duration(1000)
                .attr("cx", function (d) {
                    return x(d.x);
                })
                .attr("cy", function (d) {
                    return y(d.y);
                });
            // attr("transform", transform);
            reset_parameter_points();
            reset_slide_window();
            d3.select('#param_hexagon').style("opacity", 1);
        }

        function zoom() {
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            svg.selectAll(".param_dot")
                .attr("cx", function (d) {
                    return x(d.x);
                })
                .attr("cy", function (d) {
                    return y(d.y);
                })
            // .attr("transform", transform);
            d3.select('#param_hexagon').style("opacity", 0);
        }

        function transform(d) {
            // console.log(d);
            let x_pos = x(d[xCat]);
            let y_pos = y(d[yCat]);
            return "translate(" + x_pos + "," + y_pos + ")";
        }

    }).catch(function (error) {
        console.log(error);
    });

}

/**
 * render the range of parameter
 * */
function render_parameter_range(time_start, time_end, good_start, good_end, bad_start, bad_end) {
    let extent_1 = d3.select(".brush_1")[0][0].childNodes[1];
    let extent_2 = d3.select(".brush_2")[0][0].childNodes[1];
    let extent_3 = d3.select(".brush_3")[0][0].childNodes[1];

    time_end = Math.floor(time_end / 5) * 5 + 5 >= 100 ? 100 : Math.floor(time_end / 5)  * 5 + 5;
    time_start = Math.floor(time_start / 5) * 5;
    console.log(x2(time_end));
    console.log(x2(time_start));

    extent_1.setAttribute('x', x2(time_start) + offset / 2);
    extent_1.setAttribute('width', x2(time_end) - x2(time_start));
    brush_1.extent([x2(time_start), x2(time_end)]);
    // console.log(x2(good_end) - x2(good_start))
    extent_2.setAttribute('x', x2(good_start) + offset / 2);
    extent_2.setAttribute('width', x2(good_end) - x2(good_start));
    brush_2.extent([x2(good_start), x2(good_end)]);
    // console.log(x2(bad_end) - x2(bad_start))
    extent_3.setAttribute('x', x2(bad_start) + offset / 2);
    extent_3.setAttribute('width', x2(bad_end) - x2(bad_start));
    brush_3.extent([x2(bad_start), x2(bad_end)]);
}

/**
 * 创建hexbins in parameter space
 * */
function create_param_hexbins(svg, index) {
    let hex_bin_r, hex_bin_d;

    hex_bin_r = 10;
    hex_bin_d = 9.5;

    let hexbin = d3.hexbin()
        .size([400, 400])
        .radius(hex_bin_r);

    let hexagon = svg.append("g")
        .attr("class", "hexagons")
        .attr('id', 'param_hexagon')
        .attr('width', width)
        .attr('height', height)
        .style('z-index', -1)
        .selectAll("path")
        .data(hexbin(param_points))
        .enter().append("path")
        .attr("id", function (d, i) {
            return "hexbin_" + i;
        })
        .attr("d", hexbin.hexagon(hex_bin_d))
        .classed('hexbin', true)
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .style("fill", function (d) {
            if (index == 'density') {
                return color_hex(d.length);
            } else {
                // console.log(d);
                let class_count = new d3.map();
                for (let i = 0; i < d.length; i++) {
                    let key = d[i][2];
                    let value = class_count.get(key);
                    if (value == undefined || value == 0) {
                        class_count.set(key, 1);
                    } else {
                        class_count.set(key, value + 1);
                    }
                }
                let max_value = 0;
                let classification;
                class_count.forEach(function (key, value) {
                    max_value = Math.max(max_value, value);
                    if (max_value == value) {
                        classification = key;
                    }
                })

                let type = {'val': classification};
                return color_radius(param_cValue(type));
            }
        });
}

/**
 * render points in parameter space
 */
function render_points(time_points, good_points, bad_points) {

    let context = d3.select("#parameter_context");

    // time_points = [{'x': 10, 'y': gap_y * 1.6}]

    context.selectAll(".point")
        .data(time_points)
        .enter().append("circle")
        .classed("point", true)
        .attr("r", function (d) {
            return 3.5;
        })
        .attr("cx", function (d) {
            let x=((x2(10)-x2(5))/5)*d.x+x2(0);
            return x + offset / 2;
        })
        .attr("cy", function (d) {
            return d.y;
        })
        .style("fill", function (d) {
            if(d.x%5==0) {
                return 'red';
            }else{
                return 'orange';
            }
        });

    // good_points = [{'x': 10, 'y': gap_y * 1.6}]

    context.selectAll(".point_2")
        .data(good_points)
        .enter().append("circle")
        .classed("point", true)
        .attr("r", function (d) {
            return 3.5;
        })
        .attr("cx", function (d) {
            return x2(d.x) + offset / 2;
        })
        .attr("cy", function (d) {
            return d.y + height2;
        })
        .style("fill", function (d) {
            return 'red';
        });

    // bad_points = [{'x': 10, 'y': gap_y * 1.6}]

    context.selectAll(".point_3")
        .data(bad_points)
        .enter().append("circle")
        .classed("point", true)
        .attr("r", function (d) {
            return 3.5;
        })
        .attr("cx", function (d) {
            return x2(d.x) + offset / 2;
        })
        .attr("cy", function (d) {
            console.log(d.y);
            return d.y + height2 * 2;
        })
        .style("fill", function (d) {
            return 'red';
        });
}


function reset_slide_window() {
    reset_parameter();
    initiate_slide_window();
}

/**
 * listener on reset button in parameter space
 */
function reset_parameter() {
    $('.point').remove();
    reset_parameter_points();
}

/**
 * 更新hexbins in parameter space
 * */
function update_param_hexbins(index) {
    let hex_bin_r = 10, hex_bin_d = 9.5;


    let hexbin = d3.hexbin()
        .size([400, 400])
        .radius(hex_bin_r);

    $('#param_hexagon').empty();

    d3.select('#param_hexagon').selectAll("path")
        .data(hexbin(param_points))
        .enter().append("path")
        .attr("id", function (d, i) {
            return "hexbin_" + i;
        })
        .attr("d", hexbin.hexagon(hex_bin_d))
        .classed('hexbin', true)
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .style("fill", function (d) {
            if (index == 'density') {
                return color_hex(d.length);
            } else {
                let class_count = new d3.map();
                for (let i = 0; i < d.length; i++) {
                    let key = d[i][2];
                    let value = class_count.get(key);
                    if (value == undefined || value == 0) {
                        class_count.set(key, 1);
                    } else {
                        class_count.set(key, value + 1);
                    }
                }
                let max_value = 0;
                let classification;
                class_count.forEach(function (key, value) {
                    max_value = Math.max(max_value, value);
                    if (max_value == value) {
                        classification = key;
                    }
                })
                let type = {'val': classification};
                return color_radius(param_cValue(type));
            }
        });
}


/**
 * 过滤参数点
 */
function filter_parameters() {
    let check_items = $('.param_checkbox:checked');
    if (check_items == undefined) {
        return;
    }
    for (let i = 0; i < check_items.length; i++) {
        let type = check_items[i].value;
        let expression = '[id^=' + 'param_dot_' + type + '_]';
        $(expression).each(function () {
            $(this).attr('user-flag', 1);
        }).css('opacity', 1);
    }
    $('.param_dot').filter(function () {
        let flag = $(this).attr('user-flag');
        return flag == undefined || flag != 1;
    }).css('opacity', 0);

    param_points.splice(0, param_points.length);
    for (let i = 0; i < check_items.length; i++) {
        let type = check_items[i].value;
        let expression = '[id^=' + 'param_dot_' + type + '_]';
        $(expression).each(function () {
            $(this).removeAttr('user-flag');
        });
        param_source_points.get(type).forEach(function (d) {
            param_points.push(d);
        });
    }
    let index = $('#param_index_select option:selected').val();
    update_param_hexbins(index);
}

/**
 * function to change the background of hexbins in parameter space
 */
function param_bg_change() {
    $('#reset_parameter_2').trigger('click');
    let index = $('#param_index_select option:selected').val();
    update_param_hexbins(index);
}

/**
 * reset parameter points in parameter space
 */
function reset_parameter_points() {
    console.log('reset begin---------------------------');
    console.log(old_attributes);
    old_attributes.forEach(function (point) {
        let id = '#' + point['id'];
        let r = point['r'];
        let style = point['style'];
        $(id).attr('r', r);
        $(id).attr('style', style);
    })
    console.log('reset end-----------------------------');
}

