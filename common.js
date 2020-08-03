//define the tooltip to show the detail information
var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0.0);

//define the margin information
var margin = {top: 25, right: 50, bottom: 25, left: 50},
    outerWidth = 600,
    outerHeight = 600,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom,
    outerHeight_1 = 350,
    width_1 = outerWidth - margin.left - margin.right,
    height_1 = outerHeight_1 - margin.top - margin.bottom;

var colors = {
    'TP': 'orange',
    'TN': 'green',
    'FP': 'red',
    'FN': 'blue',
    'fallback': '#9f9fa3',

};
var link;
var nodes;
var links;
var link_map;
var target_link_map;
var source_link_map;
var linkArray;

var chart;
var prev_json;
var current_json;
//the new links be added last time
var count = 0;

var node_map = d3.map();
var parameter_position_map = d3.map();

var len = 20;
for (var i = 0; i < len; i++) {
    var val = i * 5 + 5;
    var tp_key = 'TP_' + val;
    var tn_key = 'TN_' + val;
    var fp_key = 'FP_' + val;
    var fn_key = 'FN_' + val;

    node_map.set(tp_key, i);
    node_map.set(tn_key, i + len);
    node_map.set(fp_key, i + 2 * len);
    node_map.set(fn_key, i + 3 * len);
}

var time_start = 0;
var time_end = 10;

var good_start = 0;
var good_end = 10;

var bad_start = 0;
var bad_end = 10;


var param_cValue = function (d) {
    if (d.val <= 40) {
        return 'poor';
    } else if (d.val > 40 && d.val <= 60) {
        return 'average';
    } else if (d.val > 60 && d.val <= 80) {
        return 'good';
    } else if (d.val > 80 && d.val <= 100) {
        return 'excellent';
    }
};

var color_radius = d3.scale.category10();

var old_attributes = new Array();


var color_hex = d3.scale.linear()
    .domain([0, 10])
    .range(["white", "steelblue"])
    .interpolate(d3.interpolateLab);

var trueVandal = 'True Vandal';
var falseVandal = 'False Vandal';
var trueBenign = 'True Benign';
var falseBenign = 'False Benign';

var cValue = function (d) {
    if (d.classification == 'TN') {
        return trueVandal;
    } else if (d.classification == 'FN') {
        return falseVandal;
    } else if (d.classification == 'TP') {
        return trueBenign;
    } else {
        return falseBenign;
    }
};

var color_scale = d3.scale.category10();
//store the source points of user in attribute space
var source_points = d3.map();
//store the points who are rendered in attribute space
var user_points = new Array();

//store the source points of parameter in parameter space
var param_source_points = d3.map();
//store the points who are rendered in parameter space
var param_points = new Array();


/**
 * assert whether the target string in the array
 * @param stringToSearch
 * @param arrayToSearch
 * @returns {boolean}
 */
function in_array(stringToSearch, arrayToSearch) {
    for (let i = 0; i < arrayToSearch.length; i++) {
        let item = arrayToSearch[i].toString();
        if (item == stringToSearch) {
            console.log(stringToSearch);
            return true;
        }
    }
    return false;
}