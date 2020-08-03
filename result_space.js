/**
 * create a sankey graph
 * */
function create_sankey(json) {
    let old_svg = d3.select("#sankey-plot");
    if (old_svg != undefined) {
        old_svg.remove();
    }

    prev_json = JSON.parse(JSON.stringify(json));
    chart = d3.select("#middle-top-div").append("svg").attr("id", "sankey-plot").chart("Sankey.Path");
    let svg = d3.select("#middle-top-div")[0][0].lastChild;
    let g = svg.firstChild;
    g.setAttribute("transform", "translate(" + 10 + "," + 10 + ")");

    chart
        .name(label)
        .colorNodes(function (name, node) {
            return color_sankey(node, 1) || colors.fallback;
        })
        .colorLinks(function (link) {
            return color_sankey(link.source, 4) || color_sankey(link.target, 1) || colors.fallback;
        })
        .nodeWidth(15)
        .nodePadding(10)
        .spread(true)
        .iterations(0)
        .draw(json);

    nodes = d3.selectAll('.node');
    links = d3.selectAll('.link');
    link_map = d3.map();
    target_link_map = d3.map();
    source_link_map = d3.map();
    linkArray = links[0];
    linkArray.forEach(function (element) {
        let data = element.__data__;
        let sourceId = data.source.id;
        let targetId = data.target.id;
        let key = sourceId.concat('#', targetId);
        link_map.set(key, element);
        let targetLinkArray;
        if (target_link_map.get(targetId) == null) {
            targetLinkArray = new Array();
            targetLinkArray.push(element);
        } else {
            targetLinkArray = target_link_map.get(targetId);
            targetLinkArray.push(element);
        }
        target_link_map.set(targetId, targetLinkArray);
        let sourceLinkArray;
        if (source_link_map.get(sourceId) == null) {
            sourceLinkArray = new Array();
            sourceLinkArray.push(element);
        } else {
            sourceLinkArray = source_link_map.get(sourceId);
            sourceLinkArray.push(element);
        }
        source_link_map.set(sourceId, sourceLinkArray);
    });

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
}


/**render the center div start------------------------------------------------------------------------------------------------------**/

d3.json("./data/wiki_full.json", function (error, json) {
    create_sankey(json);
});

function label(node) {
    return node.name.replace(/\s*\(.*?\)$/, '');
}

function color_sankey(node, depth) {
    let id = node.id.replace(/(_score)?(_\d+)?$/, '');
    if (colors[id]) {
        return colors[id];
    } else if (depth > 0 && node.targetLinks && node.targetLinks.length == 1) {
        return color(node.targetLinks[0].source, depth - 1);
    } else {
        return null;
    }
}

/**render the center div end------------------------------------------------------------------------------------------------------**/

/**
 * function that is registered to listen to select event
 */
function on_change() {
    reset_parameter_points();
    reset_parameter();
    let tp = $('#tp_select option:selected').val();
    let tp_node = 'TP_' + tp;
    let tn = $('#tn_select option:selected').val();
    let tn_node = 'TN_' + tn;
    let fp = $('#fp_select option:selected').val();
    let fp_node = 'FP_' + fp;
    let fn = $('#fn_select option:selected').val();
    let fn_node = 'FN_' + fn;

    let link_list = new Array();
    link_list.push({'source': tp_node, 'target': tn_node});
    link_list.push({'source': tn_node, 'target': fp_node});
    link_list.push({'source': fp_node, 'target': fn_node});
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
    create_sankey(current_json);
    filterLinks = links.filter(function (path) {
        let anotherSourceId = path.source.id;
        let anotherTargetId = path.target.id;
        return !in_array(anotherSourceId + '#' + anotherTargetId, link_array);
    });

    links.style('opacity', 1);
    filterLinks.style('opacity', 0.02);


    //release memory
    //要移除的旧的link
    remove_links = null;
    //上一次保存下来的link
    prev_link_array = null;
    //要显示的link
    link_array = null;
    filterLinks = null;

    //request data
    axios.get(server_url + '/wiki/params/', {
        params: {
            fp: fp,
            tp: tp,
            fn: fn,
            tn: tn
        }
    }).then(function (response) {
        let result = response.data;
        console.log(result.time);
        if (result.time.length == 0) {
            console.log('there is no combinations of parameter that can reach target result');
        } else {
            let len = result.time.length;
            let time_range = result.time;
            let good_range = result.good;
            let bad_range = result.bad;
            let parameters = result.parameter_keys;

            time_start = time_range[0] >= 5 ? time_range[0] - 5 : 0;
            time_end = time_range[len - 1] >= 100 ? time_range[len - 1] : (time_range[len - 1] + 5 >= 100 ? 100 : time_range[len - 1] + 5);
            good_start = good_range[0] >= 5 ? good_range[0] - 5 : 0;
            good_end = good_range[len - 1] >= 100 ? good_range[len - 1] : (good_range[len - 1] + 5 >= 100 ? 100 : good_range[len - 1] + 5);
            bad_start = bad_range[0] >= 5 ? bad_range[0] - 5 : 0;
            bad_end = bad_range[len - 1] >= 100 ? bad_range[len - 1] : (bad_range[len - 1] + 5 >= 100 ? 100 : bad_range[len - 1] + 5);

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
            //render points in scatter plot in parameter space
            old_attributes.splice(0, old_attributes.length);
            parameters.forEach(function (key) {
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
            });
        }


    }).catch(function (error) {
        console.log(error);
    });

}