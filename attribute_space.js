/**
 * 创建hexbins
 * */
function create_hexbins(svg, index) {
    let hex_bin_r, hex_bin_d;
    hex_bin_r = 15;
    hex_bin_d = 14.5;


    let hexbin = d3.hexbin()
        .size([400, 400])
        .radius(hex_bin_r);

    let hexagon = svg.append("g")
        .attr("class", "hexagons")
        .attr('id', 'hexagon')
        .attr('width', width)
        .attr('height', height)
        .style('z-index', -1)
        .selectAll("path")
        .data(hexbin(user_points))
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
                let type = {'classification': classification};
                return color_scale(cValue(type));
            }
        });
}


function render_scatter_plot() {
    d3.select('#bottom-div-right').style('opacity', '0');
    $('#user_1_checkbox').prop("checked", true);
    $('#user_2_checkbox').prop("checked", true);
    $('#user_3_checkbox').prop("checked", true);
    $('#user_4_checkbox').prop("checked", true);
    //clear the old data
    user_points.splice(0, user_points.length);
    let old_svg = d3.select("#scatter-plot");
    if (old_svg != undefined) {
        old_svg.remove();
    }

    d3.select("#reset").style('opacity', 0)

    let x = d3.scale.linear()
        .range([0, width]).nice();

    let y = d3.scale.linear()
        .range([height, 0]).nice();

    let xCat = "x",
        yCat = "y";


    axios.get(server_url + '/wiki/data', {
        params: {
            time_start: time_start,
            time_end: time_end,
            good_start: good_start,
            good_end: good_end,
            bad_start: bad_start,
            bad_end: bad_end
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
        let r_scale = d3.scale.linear().range([0.5, 10]);
        let rMax = d3.max(data, function (d) {
                return d['attribute'];
            }),
            rMin = d3.min(data, function (d) {
                return d['attribute'];
            });
        r_scale.domain([rMin, rMax]);
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

        let zoomBeh = d3.behavior.zoom()
            .x(x)
            .y(y)
            .scaleExtent([0, 500])
            .on("zoomend", zoom);

        let svg = d3.select("#bottom-div-left").append("svg").attr("id", "scatter-plot")
            .attr("width", outerWidth + 60)
            .attr("height", outerHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let tp_points = new Array();
        let tn_points = new Array();
        let fp_points = new Array();
        let fn_points = new Array();
        data.forEach(function (d) {
                // console.log(d);
                if (d.classification == 'TP') {
                    tp_points.push([x(d.x), y(d.y), d.classification]);
                } else if (d.classification == 'TN') {
                    tn_points.push([x(d.x), y(d.y), d.classification]);
                } else if (d.classification == 'FP') {
                    fp_points.push([x(d.x), y(d.y), d.classification]);
                } else if (d.classification == 'FN') {
                    fn_points.push([x(d.x), y(d.y), d.classification]);
                }
                user_points.push([x(d.x), y(d.y), d.classification]);
            }
        );

        source_points.set('TP', tp_points);
        source_points.set('TN', tn_points);
        source_points.set('FP', fp_points);
        source_points.set('FN', fn_points);

        let index = $('#index_select option:selected').val();

        create_hexbins(svg, index);


        // Lasso functions to execute while lassoing
        let lasso_start = function () {
            lasso.items()
                .attr("r", function (d) {
                    return r_scale(d.attribute);
                }) // reset size
                .style("fill", null) // clear all of the fills
                .classed({"not_possible": true, "selected": false}); // style as not possible
        };

        let lasso_draw = function () {
            // Style the possible dots
            lasso.items().filter(function (d) {
                return d.possible === true
            })
                .classed({"not_possible": false, "possible": true});

            // Style the not possible dot
            lasso.items().filter(function (d) {
                return d.possible === false
            })
                .classed({"not_possible": true, "possible": false});
        };

        let lasso_end = function () {
            reset_parameter();
            initiate_slide_window();
            reset_parameter_points();
            // Reset the color of all dots
            lasso.items()
                .style("fill", function (d) {
                    return color_scale(cValue(d));
                });

            // Style the selected dots
            lasso.items().filter(function (d) {
                return d.selected === true
            })
                .classed({"not_possible": false, "possible": false})
                .style('fill', 'yellow')
                .attr("r", 15);

            // Reset the style of the not selected dots
            lasso.items().filter(function (d) {
                return d.selected === false
            })
                .classed({"not_possible": false, "possible": false})
                .attr("r", function (d) {
                    return r_scale(d.attribute);
                });

            let selected_items = lasso.items().filter(function (d) {
                return d.selected === true
            });
            let selected_points = selected_items[0];
            let user_ids = new Array();
            selected_points.forEach(function (item) {
                let opacity = $('#' + item.id).css('opacity');
                if (opacity == 0) {
                    return;
                }

                console.log(item.attributes['user_id'].value);
                user_ids.push(item.attributes['user_id'].value);
            })
            console.log(user_ids);
            axios.get(server_url + '/wiki/params/range', {
                params: {
                    user_ids: JSON.stringify(user_ids),
                }
            }).then(function (response) {
                let data = response.data;
                console.log(data);

                time_start = data.time_param >= 5 ? data.time_param - 5 : 0;
                time_end = data.time_param >= 100 ? data.time_param : (data.time_param + 5 >= 100 ? 100 : data.time_param + 5);
                good_start = data.good_edit_param >= 5 ? data.good_edit_param - 5 : 0;
                good_end = data.good_edit_param >= 100 ? data.good_edit_param : (data.good_edit_param + 5 >= 100 ? 100 : data.good_edit_param + 5);
                bad_start = data.bad_edit_param >= 5 ? data.bad_edit_param - 5 : 0;
                bad_end = data.bad_edit_param >= 100 ? data.bad_edit_param : (data.bad_edit_param + 5 >= 100 ? 100 : data.bad_edit_param + 5);

                render_parameter_range(time_start, time_end, good_start, good_end, bad_start, bad_end);

                let time_points = new Array();
                let good_points = new Array();
                let bad_points = new Array();
                for (let i = 0; i < len; i++) {
                    time_points.push({'x': data.time_param, 'y': gap_y * 1.6});
                    good_points.push({'x': data.good_edit_param, 'y': gap_y * 1.6});
                    bad_points.push({'x': data.bad_edit_param, 'y': gap_y * 1.6});
                }
                render_points(time_points, good_points, bad_points);

                //render points in scatter plot in parameter space
                old_attributes.splice(0, old_attributes.length);
                let key = data.time_param + '#' + data.good_edit_param + '#' + data.bad_edit_param;

                let id = parameter_position_map.get(key);
                if (id != undefined) {

                    old_attributes.push({
                        'id': id,
                        'r': $('#' + id).attr('r'),
                        'style': $('#' + id).attr('style')
                    });

                    d3.select('#' + id).style('fill', 'red')
                        .attr("r", 7);
                }
                //update the result place
                query_link();
            }).catch(function (error) {
                console.log(error);
            });

        };


        // Create the area where the lasso event can be triggered
        let lasso_area = svg.append("rect").attr('id', 'lasso_rect')
            .attr("width", width)
            .attr("height", height)
            .style("opacity", 0);

        // Define the lasso
        let lasso = d3.lasso()
            .closePathDistance(75) // max distance for the lasso loop to be closed
            .closePathSelect(true) // can items be selected by closing the path?
            .hoverSelect(true) // can items by selected by hovering over them?
            .area(lasso_area) // area where the lasso can be started
            .on("start", lasso_start) // lasso start function
            .on("draw", lasso_draw) // lasso draw function
            .on("end", lasso_end); // lasso end function

        // Init the lasso on the svg:g that contains the dots
        svg.call(lasso);
        svg.call(zoomBeh);


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

        let objects = svg.append("svg")
            .classed("objects", true)
            .attr("width", width)
            .attr("height", height);

        objects.append("svg:line")
            .classed("axisLine hAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0)
            .attr("transform", "translate(0," + height + ")");

        objects.append("svg:line")
            .classed("axisLine vAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height);

        objects.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("id", function (d, i) {
                return "dot_" + d.classification + '_' + i;
            })
            .classed("dot", true)
            .attr("r", function (d) {
                return r_scale(d.attribute);
                // return 3.5;
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
                return color_scale(cValue(d));
            })
            .on("mouseover", function (d) {
                let x = d3.event.pageX;
                let y = d3.event.pageY;
                axios.get(server_url + '/wiki/user', {
                    params: {
                        row_id: d.user,
                    }
                }).then(function (response) {
                    let user = response.data;
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(user)
                        .style("left", (x + 5) + "px")
                        .style("top", (y - 28) + "px");
                });
            })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        lasso.items(d3.selectAll(".dot"));

        let legend = svg.selectAll(".legend")
            .data(color_scale.domain())
            .enter().append("g")
            .classed("legend", true)
            .attr("transform", function (d, i) {
                let value;
                if (d == trueBenign) {
                    value = 'TP';
                } else if (d == falseBenign) {
                    value = 'FP';
                } else if (d == trueVandal) {
                    value = 'TN';
                } else {
                    value = 'FN';
                }
                if (i == 0) {
                    $('#user_1_checkbox').val(value);
                } else if (i == 1) {
                    $('#user_2_checkbox').val(value);
                } else if (i == 2) {
                    $('#user_3_checkbox').val(value);
                } else {
                    $('#user_4_checkbox').val(value);
                }
                return "translate(0," + (i * 20 + 5) + ")";
            });

        legend.append("circle")
            .attr("r", 3.5)
            .attr("cx", width + 20)
            .attr("fill", color_scale);

        legend.append("text")
            .attr("x", width + 26)
            .attr("dy", ".4em")
            .text(function (d) {
                return d;
            });

        let indication = svg.append('g').classed('legend', true).attr("cx", width + 20).attr('transform', 'translate(0,80)');
        indication.append('text').attr("x", width + 20).attr("dy", "4em").text('Hexbin Index');


        d3.select('#as-title').style('opacity', 1);
        d3.select("#reset").style('opacity', 1).on("click", change);
        d3.select('#bottom-div-right').style('opacity', '1');

        function change() {
            xCat = "x";
            xMax = d3.max(data, function (d) {
                return d[xCat];
            });
            xMin = d3.min(data, function (d) {
                return d[xCat];
            });

            zoomBeh.x(x.domain([xMin, xMax])).y(y.domain([yMin, yMax]));

            let d = d3.select("#scatter");

            let svg = d3.select("#scatter").transition();

            svg.select(".x.axis").duration(750).call(xAxis).select(".label").text(xCat);

            objects.selectAll(".dot").transition().duration(1000)
                .attr("cx", function (d) {
                    return x(d.x);
                })
                .attr("cy", function (d) {
                    return y(d.y);
                });
            // attr("transform", transform);
            d3.select('#hexagon').style("opacity", 1);
            lasso.items()
                .style("fill", function (d) {
                    return color_scale(cValue(d));
                });
            lasso.items()
                .classed({"not_possible": false, "possible": false})
                .attr("r", function (d) {
                    return r_scale(d.attribute);
                });
        }

        function zoom() {
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            svg.selectAll(".dot")
                .attr("cx", function (d) {
                    return x(d.x);
                })
                .attr("cy", function (d) {
                    return y(d.y);
                })
            // .attr("transform", transform);
            d3.select('#hexagon').style("opacity", 0);
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
 * 更新hexbins
 * */
function update_hexbins(index) {
    let hex_bin_r = 15, hex_bin_d = 14.5;


    let hexbin = d3.hexbin()
        .size([400, 400])
        .radius(hex_bin_r);

    $('#hexagon').empty();

    d3.select('#hexagon').selectAll("path")
        .data(hexbin(user_points))
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
                console.log(classification);
                let type = {'classification': classification};
                return color_scale(cValue(type));
            }
        });
}


/**
 * 修改背景图层的颜色
 */
function bg_change() {
    $('#reset').trigger('click');
    let index = $('#index_select option:selected').val();
    update_hexbins(index);

}

/**
 * filter user points
 */
function filter_uers() {
    // let check_items = $('input:checkbox:checked');
    let check_items = $('.user_checkbox:checked');
    if (check_items == undefined) {
        return;
    }
    for (let i = 0; i < check_items.length; i++) {
        let type = check_items[i].value;
        let expression = '[id^=' + 'dot_' + type + ']';
        $(expression).each(function () {
            $(this).attr('user-flag', 1);
        }).css('opacity', 1);
    }
    $('.dot').filter(function () {
        let flag = $(this).attr('user-flag');
        return flag == undefined;
    }).css('opacity', 0);

    user_points.splice(0, user_points.length);
    for (let i = 0; i < check_items.length; i++) {
        let type = check_items[i].value;
        let expression = '[id^=' + 'dot_' + type + ']';
        $(expression).each(function () {
            $(this).removeAttr('user-flag');
        });
        source_points.get(type).forEach(function (d) {
            user_points.push(d);
        });
    }
    let index = $('#index_select option:selected').val();
    update_hexbins(index);
}