// Examples of making different plot types with plotly-base.js
// These examples use underscorejs, but this is not required by Plotly's routines

function lineplot(divid) {
    var data = [{
        x: [1, 2, 3],
        y: [2, 3, 2]
    }];

    Plotly.plot(divid, data);
}

function scatter(divid) {
    var x = _.range(2, 16, 1),
        y = _.map(x, function(xi) {
            return Math.random() + 1;
        }),
        data = [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'markers',
            marker: {
                size: 16
            }
        }];

    Plotly.plot(divid, data);
}

function bubble(divid) {
    // You can use arrays for marker properties:
    //      size, color, symbol, and opacity
    // and marker.line properties:
    //      color and width

    // marker.color, marker.line.color and
    // marker.line.width arrays also work on
    // bar charts.

    var r = _.range(20),
        x = r.map(function(i) {
            return (i + 1) * (0.8 + 0.4 * Math.random());
        }),
        y = r.map(function(i) {
            return Math.sqrt((i + 1) *
                (0.8 + 0.4 * Math.random()));
        }),
        s = r.map(function(i) {
            return i + 5;
        }),
        c = r.map(function(i) {
            return 'hsl(' + (i * 18) + ',100,40)';
        }),
        data = [{
            x: x,
            y: y,
            mode: 'markers',
            marker: {
                size: s,
                color: c
            }
        }];

    Plotly.plot(divid, data);
}

function indiaxes(divid) {

    var data = [{
            "x": [1, 2, 3],
            "y": [4, 5, 6]
        }, {
            "x": [20, 30, 40],
            "y": [50, 60, 70],
            "xaxis": "x2",
            "yaxis": "y2"
        }],

        layout = {
            "xaxis": {
                "domain": [0, 0.45]
                    // i.e. let the first x-axis
                    // span the first 45% of the plot width
            },
            "xaxis2": {
                "domain": [0.55, 1]
                    // i.e. let the second x-axis
                    // span the latter 45% of the plot width
            },
            "yaxis2": {
                "anchor": "x2"
                    // i.e. bind the second y-axis
                    // to the start of the second x-axis
            }
        };

    Plotly.plot(divid, data, layout);
}

function coupledaxes(divid) {
    var data = [{
            "x": [1, 2, 3],
            "y": [2, 3, 4]
        }, {
            "x": [20, 30, 40],
            "y": [5, 5, 5],
            "xaxis": "x2",
            "yaxis": "y"
        }, {
            "x": [2, 3, 4],
            "y": [600, 700, 800],
            "xaxis": "x",
            "yaxis": "y3"
        }, {
            "x": [4, 5, 6],
            "y": [7, 8, 9],
            "xaxis": "x4",
            "yaxis": "y4"
        }],

        layout = {
            "xaxis": {
                "domain": [0, 0.4]
                    // let the first x-axis span
                    // the first 45% of the plot width
            },
            "yaxis": {
                "domain": [0, 0.4]
                    // and let the first y-axis span
                    // the first 40% of the plot height
            },
            "xaxis2": {
                "domain": [0.6, 1]
                    // and let the second x-axis span
                    // the latter 45% of the plot width
            },
            "yaxis3": {
                "domain": [0.6, 1],
            },
            "xaxis4": {
                "domain": [0.6, 1],
                "anchor": "y4"
                    // bind the vertical position of
                    // this axis to the start of yaxis4
            },
            "yaxis4": {
                "domain": [0.6, 1],
                "anchor": "x4"
                    // bind the horizontal position of
                    // this axis to the start of xaxis4
            },
            showlegend: false
        };
    Plotly.plot(divid, data, layout);

    $('#' + divid).append(
        "<div style='max-width:350px;'>Woah, hold up. \
Check out what's going on here: the bottom two plots share the \
same y-axis, the two stacked plots on the left share the same \
x-axis and the plot in the top right has its own x and y axes. \
Try zooming (click-and-drag), panning (shift-click-drag), \
auto-scaling (double-click), or axis panning (click-and-drag on \
the axes number lines) around in the different plots and see how \
the axes respond!</div>")
}

function doubleyaxis(divid) {
    var data = [{
            "x": [2, 3, 4],
            "y": [4, 5, 6],
            "yaxis": "y2",
            // ^^^ this will reference the
            // yaxis2 object in the layout object
            "name": "yaxis2 data"
        }, {
            "x": [1, 2, 3],
            "y": [40, 50, 60],
            "name": "yaxis data"
        }],
        layout = {
            "yaxis": {
                "title": "yaxis title" // optional
            },
            "yaxis2": {
                "title": "yaxis2 title", // optional
                "titlefont": {
                    "color": "rgb(148, 103, 189)"
                },
                "tickfont": {
                    "color": "rgb(148, 103, 189)"
                },
                "overlaying": "y",
                "side": "right"
            },
            "showlegend": false,
            "title": "Double Y Axis Example",
            "annotations": [{
                "text": "This plot is interactive!<br>\
            Try panning one of the axes<br>\
            (click-and-drag on the axes-borders)<br>\
            or zooming (click-and-drag) in the plot",
                "align": "left",
                "showarrow": false,
                "x": 0.05,
                "y": 0.93,
                "xref": "paper",
                "yref": "paper"
            }]
        };
    Plotly.plot(divid, data, layout);
}

function multiaxes(divid) {
    var c = ['#1f77b4', // muted blue
        '#ff7f0e', // safety orange
        '#2ca02c', // cooked asparagus green
        '#d62728', // brick red
        '#9467bd', // muted purple
        '#8c564b', // chestnut brown
        '#e377c2', // raspberry yogurt pink
        '#7f7f7f', // middle gray
        '#bcbd22', // curry yellow-green
        '#17becf'
    ]; // blue-teal

    var data = [{
            "x": [1, 2, 3],
            "y": [4, 5, 6],
            "name": "yaxis1 data"
        }, {
            "x": [2, 3, 4],
            "y": [5, 6, 7],
            "name": "yaxis2 data",
            "yaxis": "y2"
        }, {
            "x": [3, 4, 5],
            "y": [6, 7, 8],
            "name": "yaxis3 data",
            "yaxis": "y3"
        }, {
            "x": [4, 5, 6],
            "y": [7, 8, 9],
            "name": "yaxis4 data",
            "yaxis": "y4"
        }, {
            "x": [5, 6, 7],
            "y": [8, 9, 10],
            "name": "yaxis5 data",
            "yaxis": "y5"
        }, {
            "x": [6, 7, 8],
            "y": [9, 10, 11],
            "name": "yaxis6 data",
            "yaxis": "y6"
        }],
        layout = {
            "showlegend": false,
            "xaxis": {
                "domain": [0.3, 0.7]
            },
            "yaxis": {
                "title": "yaxis title",
                "titlefont": {
                    "color": c[0]
                },
                "tickfont": {
                    "color": c[0]
                }
            },
            "yaxis2": {
                "overlaying": "y",
                "side": "left",
                "anchor": "free",
                "position": 0.15,

                "title": "yaxis2 title",
                "titlefont": {
                    "color": c[1]
                },
                "tickfont": {
                    "color": c[1]
                }
            },
            "yaxis3": {
                "overlaying": "y",
                "side": "left",
                "anchor": "free",
                "position": 0,
                "title": "yaxis3 title",
                "titlefont": {
                    "color": c[2]
                },
                "tickfont": {
                    "color": c[2]
                }
            },
            "yaxis4": {
                "overlaying": "y",
                "side": "right",
                "anchor": "x",
                "title": "yaxis4 title",
                "titlefont": {
                    "color": c[3]
                },
                "tickfont": {
                    "color": c[3]
                }
            },
            "yaxis5": {
                "overlaying": "y",
                "side": "right",
                "anchor": "free",
                "position": 0.85,
                "title": "yaxis5 title",
                "titlefont": {
                    "color": c[4]
                },
                "tickfont": {
                    "color": c[4]
                }
            },
            "yaxis6": {
                "overlaying": "y",
                "side": "right",
                "anchor": "free",
                "position": 1.0,
                "title": "yaxis6 title",
                "titlefont": {
                    "color": c[5]
                },
                "tickfont": {
                    "color": c[5]
                }
            }
        }
    Plotly.plot(divid, data, layout);
}

function verticallystacked(divid) {
    var data = [{
            'x': [0, 1, 2],
            'y': [10, 11, 12]
        }, {
            'x': [2, 3, 4],
            'y': [100, 110, 120],
            'yaxis': 'y2'
        }, {
            'x': [3, 4, 5],
            'y': [1000, 1100, 1200],
            'yaxis': 'y3'
        }],
        layout = {
            'yaxis': {
                'domain': [0, 0.3]
            },
            'yaxis2': {
                'domain': [0.35, 0.65]
            },
            'yaxis3': {
                'domain': [0.7, 1]
            },
            'xaxis': {
                'zeroline': false
            },
            'legend': {
                'traceorder': 'reversed'
            },
            'showlegend': false
        };
    Plotly.plot(divid, data, layout);
}

function insets(divid) {
    var data = [{
            "x": [1, 2, 3],
            "y": [4, 3, 2]
        }, {
            "x": [20, 30, 40],
            "y": [30, 40, 50],
            "xaxis": "x2",
            "yaxis": "y2"
        }],
        layout = {
            "xaxis2": {
                "domain": [0.6, 0.95],
                "anchor": "y2"
            },
            "yaxis2": {
                "domain": [0.6, 0.95],
                "anchor": "x2"
            },
            "showlegend": false
        };
    Plotly.plot(divid, data, layout);
}

function twodhistogram(divid) {
    x0 = d3.range(200).map(d3.random.irwinHall(10));
    y0 = d3.range(200).map(d3.random.normal(5));
    data = [{
            "x": x0,
            "y": y0,
            "type": "histogram2d"
        }, {
            "y": y0,
            "type": "histogram",
            "xaxis": "x2",
            "yaxis": "y",
            "orientation": "h",
            "marker": {
                "color": "rgb(31, 119, 180)"
            }
        }, {
            "x": x0,
            "type": "histogram",
            "xaxis": "x",
            "yaxis": "y3",
            "marker": {
                "color": "rgb(31, 119, 180)"
            }
        }],
        layout = {
            "showlegend": false,
            "xaxis": {
                "domain": [0, 0.8],
                "showgrid": false,
                "showline": false,
                "zeroline": false
            },
            "yaxis": {
                "domain": [0, 0.8],
                "showgrid": false,
                "showline": false,
                "zeroline": false
            },
            "xaxis2": {
                "domain": [0.82, 1.0],
                "showgrid": false,
                "showline": false,
                "zeroline": false,
                "nticks": 3
            },
            "yaxis3": {
                "domain": [0.82, 1.0],
                "showgrid": false,
                "showline": false,
                "zeroline": false,
                "nticks": 3
            }
        }
    Plotly.plot(divid, data, layout)
}

function clickcallback(divid) {
    var x = _.range(2, 16, 1),
        y = _.map(x, function(xi) {
            return Math.random() + 1;
        }),
        data = [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'markers',
            marker: {
                size: 16
            }
        }],
        layout = {
            hovermode: 'closest'
        };

    Plotly.plot(divid, data, layout);

    $('#' + divid).bind('plotly_click',
        function(event, data) {
            var pts = '';
            for (var i = 0; i < data.points.length; i++) {
                pts = 'x = ' + data.points[i].x + '\ny = ' +
                    data.points[i].y.toPrecision(4) + '\n\n';
            }
            alert('Closest point clicked:\n\n' + pts);
        });
}

function zoomcallback(divid) {
    var x = _.range(1, 40, 1),
        y = _.map(x, function(xi) {
            return Math.random() + 1;
        }),
        data = [{
            x: x,
            y: y
        }];

    Plotly.plot(divid, data);

    $('#' + divid).bind('plotly_relayout',
        function(event, eventdata) {
            console.log('ZOOM!', event, eventdata);
            console.log('x-axis start:',
                eventdata['xaxis.range[0]']);
            console.log('x-axis end:',
                eventdata['xaxis.range[1]']);
        });
}

function hovercallback(divid) {
    var x = _.range(2, 16, 1),
        y1 = _.map(x, function(xi) {
            return Math.random() + 1;
        }),
        y2 = _.map(x, function(xi) {
            return Math.random() + 1;
        }),
        data = [{
            x: x,
            y: y1,
            type: 'scatter',
            name: 'Trial 1',
            mode: 'markers',
            marker: {
                size: 16
            }
        }, {
            x: x,
            y: y2,
            type: 'scatter',
            name: 'Trial 2',
            mode: 'markers',
            marker: {
                size: 16
            }
        }];

    Plotly.plot(divid, data);

    $('#' + divid)
        .append('<div id="hoverinfo" style="margin-left:80px;"></div>')
        .bind('plotly_hover', function(event, data) {
            var infotext = data.points.map(function(d) {
                return d.data.name +
                    ': x= ' + d.x +
                    ', y= ' + d.y.toPrecision(3);
            });
            $('#hoverinfo').html(infotext.join('<br/>'));
        })
        .bind('plotly_unhover', function(event, data) {
            $('#hoverinfo').html('');
        });
}

function manualhover(divid) {
    var x = _.range(2, 16, 1),
        y1 = _.map(x, function(xi) {
            return Math.random() + 1;
        }),
        y2 = _.map(x, function(xi) {
            return Math.random() + 1;
        }),
        data = [{
            x: x,
            y: y1,
            type: 'scatter',
            name: 'Trial 1',
            mode: 'markers',
            marker: {
                size: 16
            }
        }, {
            x: x,
            y: y2,
            type: 'scatter',
            name: 'Trial 2',
            mode: 'markers',
            marker: {
                size: 16
            }
        }];

    Plotly.plot(divid, data);

    $('#' + divid)
        .bind('plotly_beforehover', function() {
            return false;
        })
        .append(
            '<div id="hoverbutton" style="margin-left:80px;">' +
            '<button>Go!</button>' +
            '</div>');
    $('#hoverbutton button').click(function() {
        var curve1 = Math.floor(Math.random() * 2),
            curve2 = Math.floor(Math.random() * 2),
            point1 = Math.floor(Math.random() * 14),
            point2 = Math.floor(Math.random() * 14);
        Plotly.Fx.hover(divid, [{
            curveNumber: curve1,
            pointNumber: point1
        }, {
            curveNumber: curve2,
            pointNumber: point2
        }]);
    });
}

function hideshow(divid) {
    var x1 = d3.range(1000).map(d3.random.normal(6)),
        x2 = d3.range(1000).map(d3.random.normal(9)),
        layout = {
            yaxis: {
                zeroline: false
            },
            barmode: 'overlay',
            showlegend: false
        },
        data = [{
            x: x1,
            type: 'histogram',
            opacity: 0.5,
            marker: {
                color: 'fuchsia'
            }
        }, {
            x: x2,
            type: 'histogram',
            opacity: 0.5,
            marker: {
                color: '#FFD966'
            }
        }];

    Plotly.plot(divid, data, layout);

    $('#' + divid).append(
        '<div class="hideshow" id="left" ' +
        'style="margin-left:80px;">' +
        '<button style=";background:fuchsia;">' +
        'Toggle Fuchsia</button></div>' +
        '<div class="hideshow" id="right" ' +
        'style="margin-left:80px;">' +
        '<button style="background:#FFD966;">' +
        'Toggle Yellow</button></div>');
    $('.hideshow button').click(function() {
        var btn_id = this.parentNode.id,
            i = (btn_id === 'left') ? 0 : 1,
            vis = document.getElementById(divid).data[i].visible;
        if (vis === undefined) vis = true;
        Plotly.restyle(divid, 'visible', !vis, i);
    });
}

function multiscatter(divid) {
    var x = _.range(2, 16, 0.5),
        y1 = _.map(x, function(xi) {
            return Math.random();
        }),
        y2 = _.map(x, function(xi) {
            return Math.random();
        }),
        y3 = _.map(x, function(xi) {
            return Math.random();
        }),
        data = [{
            x: x,
            y: y1,
            type: 'scatter',
            mode: 'markers',
            opacity: 0.6,
            line: {
                'color': 'rgb(241, 194, 50)'
            },
            marker: {
                'line': {
                    'width': 2
                },
                'size': 12
            }
        }, {
            x: x,
            y: y2,
            type: 'scatter',
            mode: 'markers',
            opacity: 0.6,
            line: {
                'color': 'rgb(191, 125, 241)'
            },
            marker: {
                'line': {
                    'width': 2
                },
                'size': 12
            }
        }, {
            x: x,
            y: y3,
            type: 'scatter',
            mode: 'markers',
            opacity: 0.6,
            line: {
                'color': 'rgb(44, 160, 44)'
            },
            marker: {
                'line': {
                    'width': 2
                },
                'size': 12
            }
        }],
        layout = {
            showlegend: false,
            xaxis: {
                zeroline: false,
                showgrid: false
            },
            yaxis: {
                zeroline: false,
                showgrid: false
            }
        };
    Plotly.plot(divid, data, layout);
}

function markers(divid) {
    var x = _.range(2.5, 4, 0.1),
        y1 = _.map(x, function(xi) {
            return Math.pow(xi, 2);
        }),
        y2 = _.map(x, function(xi) {
            return Math.pow(xi, 2.4);
        }),
        y3 = _.map(x, function(xi) {
            return Math.pow(xi, 2.8);
        }),
        y4 = _.map(x, function(xi) {
            return Math.pow(xi, 3.2);
        }),
        y5 = _.map(x, function(xi) {
            return Math.pow(xi, 3.6);
        }),
        data = [{
            x: x,
            y: y1,
            name: 'Circle',
            opacity: 0.6,
            marker: {
                size: 12
            }
        }, {
            x: x,
            y: y2,
            name: 'Square',
            mode: 'lines+markers',
            marker: {
                symbol: 'square',
                size: 12
            },
            opacity: 0.6
        }, {
            x: x,
            y: y3,
            name: 'Diamond',
            mode: 'lines+markers',
            marker: {
                symbol: 'diamond',
                size: 12
            },
            opacity: 0.6
        }, {
            x: x,
            y: y4,
            name: 'Cross',
            mode: 'lines+markers',
            marker: {
                symbol: 'cross',
                size: 12
            },
            opacity: 0.6
        }, {
            x: x,
            y: y5,
            name: 'Triangle',
            mode: 'lines+markers',
            marker: {
                symbol: 'triangle',
                size: 12
            },
            opacity: 0.6
        }],
        legend = {
            bgcolor: 'rgba(102, 102, 102, 0.15)',
            bordercolor: 'rgba(0, 0, 0, 0)',
            x: 100,
            y: 1
        },
        layout = {
            legend: legend,
            margin: {
                r: 5
            },
            yaxis: {
                autorange: false,
                range: [2, 60]
            }
        };

    Plotly.plot(divid, data, layout);
}

function timeseries(divid) {
    // Plotly understands dates and times in
    // format YYYY-MM-DD HH:MM:SS (ie, 2009-10-04 22:23:00)
    var x = _.range(0, 60, 1),
        t = _.map(x, function(xi) {
            var day = new Date();
            day.setDate(day.getDate() + xi);
            return unix_to_mysql(day);
        }),
        y = _.map(x, function(xi) {
            return xi + (10 * Math.random());
        });
    layout = {
        xaxis: {
            tickangle: 45,
            nticks: 15
        },
        yaxis: {
            zeroline: false
        }
    };

    Plotly.plot(divid, [{
        x: t,
        y: y
    }], layout);
}

function multiline(divid) {
    var x = _.range(0, 0.2, 0.001),
        y1 = _.map(x, function(xi) {
            return Math.sin(140 * xi);
        }),
        y2 = _.map(x, function(xi) {
            return Math.sin(100 * xi) / 2;
        }),
        data = [{
            x: x,
            y: y1,
            opacity: 0.7,
            line: {
                width: 6
            }
        }, {
            x: x,
            y: y2,
            opacity: 0.7,
            line: {
                width: 6,
                dash: 'dash'
            }
        }],
        layout = {
            showlegend: false,
            xaxis: {
                zeroline: false
            },
            yaxis: {
                zeroline: false
            }
        };

    Plotly.plot(divid, data, layout);
}

function barchart(divid) {
    var x = ['Bears', 'Lions', 'Tigers', 'Giraffes', 'Zebras'],
        y = [1000, 800, 600, 400, 100];

    Plotly.plot(divid, [{
        x: x,
        y: y,
        type: 'bar'
    }]);
}

function horizontalbar(divid) {
    var y = ['Mon', 'Tues', 'Wed', 'Thurs', 'Friday'],
        x = [70, 80, 100, 60, 40];

    Plotly.plot(divid, [{
        x: x,
        y: y,
        type: 'bar',
        orientation: 'h'
    }]);
    Plotly.relayout(divid, 'yaxis.reverse', true);
}

function groupchart(divid) {
    var x = ['Bears', 'Lions', 'Tigers', 'Giraffes', 'Zebras'],
        y1 = [10, 8, 6, 4, 1],
        y2 = [4, 7, 9, 3, 2],
        y3 = [1, 2.5, 6, 3, 4],
        data = [{
            x: x,
            y: y1,
            type: 'bar',
            name: 'LA Zoo'
        }, {
            x: x,
            y: y2,
            type: 'bar',
            name: 'DC Zoo'
        }, {
            x: x,
            y: y3,
            type: 'bar',
            name: 'SF Zoo'
        }],
        layout = {
            barmode: 'group'
        };

    Plotly.plot(divid, data, layout);
}

function stackchart(divid) {
    var x = ['Bears', 'Lions', 'Tigers', 'Giraffes', 'Zebras'],
        y1 = [10, 8, 6, 4, 1],
        y2 = [4, 7, 9, 3, 2],
        y3 = [1, 2.5, 6, 3, 4],
        data = [{
            x: x,
            y: y1,
            type: 'bar',
            name: 'LA Zoo'
        }, {
            x: x,
            y: y2,
            type: 'bar',
            name: 'DC Zoo'
        }, {
            x: x,
            y: y3,
            type: 'bar',
            name: 'SF Zoo'
        }],
        layout = {
            barmode: 'stack',
            legend: {
                traceorder: 'reversed'
            }
        };

    Plotly.plot(divid, data, layout);
}

function logplot(divid) {
    var x = _.range(0, 10, 0.3),
        y = _.map(x, function(xi) {
            return 100 - Math.exp(xi);
        }),
        layout = {
            xaxis: {
                type: 'log'
            },
            yaxis: {
                type: 'log'
            }
        },
        data = [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'markers+lines'
        }];

    Plotly.plot(divid, data, layout);
}

function overlaidarea(divid) {

    var x = _.range(0, 10, 0.1),
        y1 = _.map(x, function(xi) {
            return Math.exp(-(xi - 4) * (xi - 4));
        }),
        y2 = _.map(x, function(xi) {
            return 2 * Math.exp(-(xi - 2) * (xi - 2));
        }),
        y3 = _.map(x, function(xi) {
            return 1.5 * Math.exp(-(xi - 6) * (xi - 6));
        }),
        layout = {
            showlegend: false,
            xaxis: {
                /*range:[0,8],
                autorange:false,*/
                zeroline: false
            },
            yaxis: {
                range: [0.05, 2.2],
                autorange: false,
                type: 'linear',
                zeroline: false
            }
        },
        data = [{
            x: x,
            y: y1,
            'fill': 'tozero'
        }, {
            x: x,
            y: y2,
            'fill': 'tozero'
        }, {
            x: x,
            y: y3,
            'fill': 'tozero'
        }];

    Plotly.plot(divid, data, layout);
}

function stackarea(divid) {
    var x = _.range(1, 10, 0.3),
        y1 = _.map(x, function(xi) {
            return xi + Math.random();
        }),
        y2 = _.map(x, function(xi) {
            return xi - Math.random() + 5;
        }),
        y3 = _.map(x, function(xi) {
            return xi - Math.random() + 10;
        }),
        y4 = _.map(x, function(xi) {
            return xi - Math.random() + 15;
        }),
        legend = {
            bgcolor: 'rgba(102, 102, 102, 0.15)',
            bordercolor: 'rgba(0, 0, 0, 0)',
            x: 100,
            y: 1,
            traceorder: 'reversed'
        },
        layout = {
            margin: {
                r: 5
            },
            legend: legend
        },
        data = [{
            x: x,
            y: y1,
            fill: 'tonexty'
        }, {
            x: x,
            y: y2,
            fill: 'tonexty'
        }, {
            x: x,
            y: y3,
            fill: 'tonexty'
        }, {
            x: x,
            y: y4,
            fill: 'tonexty'
        }];

    Plotly.plot(divid, data, layout);
}

function stylelegend(divid) {
    var x = _.range(10e-3, 1.5, 0.01),
        y1 = _.map(x, function(xi) {
            return 1e-2 * (1 / xi);
        }),
        y2 = _.map(x, function(xi) {
            return 2e-2 * (1 / xi);
        }),
        y3 = _.map(x, function(xi) {
            return 4e-2 * (1 / xi);
        }),
        y4 = _.map(x, function(xi) {
            return 6e-2 * (1 / xi);
        }),
        data = [{
            x: x,
            y: y1
        }, {
            x: x,
            y: y2
        }, {
            x: x,
            y: y3
        }, {
            x: x,
            y: y4
        }],
        legend = {
            bgcolor: 'rgba(102, 102, 102, 0.15)',
            bordercolor: 'rgba(0, 0, 0, 0)'
        },
        layout = {
            legend: legend,
            xaxis: {
                zeroline: false,
                range: [0.01, 0.6],
                autorange: false
            },
            yaxis: {
                zeroline: false,
                range: [0, 2],
                autorange: false,
                type: 'linear'
            }
        };

    Plotly.plot(divid, data, layout);
}

function poslegendin(divid) {
    var x = ['Bears', 'Lions', 'Tigers', 'Giraffes', 'Zebras'],
        y1 = [10, 8, 5, 4, 1],
        y2 = [4, 7, 4, 3, 9],
        y3 = [1, 2.5, 3, 3.5, 7],
        data = [{
            x: x,
            y: y1,
            type: 'bar',
            name: 'LA Zoo'
        }, {
            x: x,
            y: y2,
            type: 'bar',
            name: 'DC Zoo'
        }, {
            x: x,
            y: y3,
            type: 'bar',
            name: 'SF Zoo'
        }],
        legend = {
            bgcolor: 'rgba(102, 102, 102, 0.15)',
            bordercolor: 'rgba(0, 0, 0, 0)',
            x: 0.6,
            y: 0.9,
            xanchor: 'center',
            yanchor: 'middle'
        },
        layout = {
            legend: legend,
            barmode: 'group'
        };

    Plotly.plot(divid, data, layout);
}

function poslegendout(divid) {
    var x = _.range(10e-3, 1.5, 0.01),
        y1 = _.map(x, function(xi) {
            return 1e-2 * (1 / xi);
        }),
        y2 = _.map(x, function(xi) {
            return 2e-2 * (1 / xi);
        }),
        y3 = _.map(x, function(xi) {
            return 4e-2 * (1 / xi);
        }),
        y4 = _.map(x, function(xi) {
            return 6e-2 * (1 / xi);
        }),
        data = [{
            x: x,
            y: y1
        }, {
            x: x,
            y: y2
        }, {
            x: x,
            y: y3
        }, {
            x: x,
            y: y4
        }],

        legend = {
            bgcolor: 'rgba(102, 102, 102, 0.15)',
            bordercolor: 'rgba(0, 0, 0, 0)',
            x: 1.02,
            y: 1,
            xanchor: 'left'
        },
        layout = {
            legend: legend,
            margin: {
                r: 5
            },
            xaxis: {
                range: [0.01, 0.6],
                autorange: false
            },
            yaxis: {
                range: [0, 2],
                autorange: false,
                type: 'linear',
                zeroline: false
            }
        };

    Plotly.plot(divid, data, layout);
}

function histogram(divid) {
    var x = d3.range(1000).map(d3.random.irwinHall(10)),
        layout = {
            yaxis: {
                zeroline: false
            }
        };
    Plotly.plot(divid, [{
        x: x,
        type: 'histogram'
    }], layout);
}

function overhist(divid) {
    var x1 = d3.range(1000).map(d3.random.normal(6)),
        x2 = d3.range(1000).map(d3.random.normal(9)),
        layout = {
            yaxis: {
                zeroline: false
            },
            barmode: 'overlay',
            showlegend: false
        };
    data = [{
        x: x1,
        type: 'histogram',
        opacity: 0.5
    }, {
        x: x2,
        type: 'histogram',
        opacity: 0.5
    }];
    Plotly.plot(divid, data, layout);
}

function stackhist(divid) {
    var x1 = d3.range(1000).map(d3.random.normal(5)),
        x2 = d3.range(1000).map(d3.random.normal(5)),
        layout = {
            yaxis: {
                zeroline: false
            },
            barmode: 'stack',
            showlegend: false,
            bargap: 0
        };
    d = [{
        x: x1,
        type: 'histogram'
    }, {
        x: x2,
        type: 'histogram'
    }];

    Plotly.plot(divid, d, layout);
}

function ebarbar(divid) {
    var x = ['Trial 1', 'Trial 2', 'Trial 3'],
        control = {
            x: x,
            y: [3, 6, 4],
            name: 'Control',
            type: 'bar',
            error_y: {
                type: 'data',
                array: [1, 0.5, 0.7],
                visible: true,
                color: 'black'
            }
        },
        exp = {
            x: x,
            y: [4, 7, 3],
            name: 'Experiemnt',
            type: 'bar',
            error_y: {
                type: 'data',
                array: [0.5, 1, 0.8],
                visible: true,
                color: 'black'
            }
        },
        layout = {
            barmode: 'group'
        };

    Plotly.plot(divid, [control, exp], layout);
}

function ebarline(divid) {
    var x = ['Trial 1', 'Trial 2', 'Trial 3'],
        control = {
            x: x,
            y: [3, 6, 3],
            name: 'Control',
            error_y: {
                type: 'data',
                array: [1, 0.5, 0.7],
                visible: true,
                color: 'black'
            }
        },
        exp = {
            x: x,
            y: [4, 3, 5],
            name: 'Experiment',
            error_y: {
                type: 'data',
                array: [0.5, 1, 0.8],
                visible: true,
                color: 'black'
            }
        },
        layout = {
            yaxis: {
                zeroline: false
            }
        };

    Plotly.plot(divid, [control, exp], layout);
}

function ebarstyle(divid) {
    var x = ['Trial 1', 'Trial 2', 'Trial 3'],
        control = {
            x: x,
            y: [3, 6, 3],
            name: 'Control',
            error_y: {
                type: 'data',
                array: [1, 0.5, 0.7],
                opacity: 0.85,
                thickness: 2,
                visible: true,
                width: 4,
                color: 'rgb(31,119,180)'
            },
            line: {
                color: 'rgb(rgb(31, 114, 225)',
                dash: 'solid'
            }
        },
        exp = {
            x: x,
            y: [7, 3, 5],
            name: 'Experiment',
            error_y: {
                type: 'data',
                array: [0.5, 1, 0.8],
                opacity: 0.85,
                thickness: 2,
                visible: true,
                width: 4,
                color: 'rgb(31,119,180)'
            },
            line: {
                color: 'rgb(245, 25, 252)',
                dash: 'solid'
            }
        };

    Plotly.plot(divid, [control, exp]);
}

function boxplot(divid) {
    var box1 = {
            'y': [1, 2, 4, 5, 8, 3, 6, 5, 2, 4],
            type: 'box',
            name: 'Sample A'
        },
        box2 = {
            'y': [1, 2, 3, 4, 3, 2, 1, 3, 3, 2],
            type: 'box',
            name: 'Sample B'
        };

    Plotly.plot(divid, [box1, box2]);
}

function jitter(divid) {
    var box = {
        y: d3.range(50).map(d3.random.irwinHall(10)),
        type: 'box',
        boxpoints: 'all',
        jitter: 0.3,
        pointpos: -1.8,
        name: 'Irwin Hall Distribution'
    };

    Plotly.plot(divid, [box], {});
}

function boxstyle(divid) {
    var data = [],
        xlabels = ['Volkswagen', 'Tesla', 'BMW'];
    for (var i = 0; i < xlabels.length; i++) {
        var box = {
            'y': d3.range(20).map(d3.random.irwinHall(10)),
            name: xlabels[i],
            type: 'box',
            boxpoints: 'all', // 'all', 'outliers', or false
            jitter: 0.3, // horizontal spread of the 'jitter'
            pointpos: -1.8,
            fillcolor: 'rgba(255, 255, 255, 0)',
            line: {
                'color': 'rgb(0, 0, 255)'
            },
            marker: {
                'color': 'rgba(255, 255, 255, 0)',
                line: {
                    'color': 'rgba(255, 0, 0, 0.5)',
                    'width': 2
                }
            }
        };
        data.push(box);
    }
    var layout = {
        showlegend: false
    };

    Plotly.plot(divid, data, layout);
}

function heatmap(divid) {
    var x = ['Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday'
        ],
        y = ['Morning', 'Afternoon', 'Evening'],
        z = [
            [1, 20, 30, 50, 1],
            [20, 1, 60, 80, 30],
            [30, 60, 1, -10, 20]
        ],
        data = [{
            x: x,
            y: y,
            z: z,
            type: 'heatmap'
        }];
    Plotly.plot(divid, data);
    Plotly.relayout(divid, 'yaxis.reverse', true);
}

function datesheatmap(divid) {
    var x = _.range(0, 30, 1),
        t = _.map(x, function(xi) {
            var day = new Date();
            day.setDate(day.getDate() + xi);
            return unix_to_mysql(day);
        }),
        y = ['9AM', '12PM', '3PM', '6PM', '9PM'],
        z = [];
    for (var i = 0; i < y.length; i++) {
        z.push(
            d3.range(t.length).map(d3.random.normal(10))
        );
    }
    var data = [{
            x: t,
            y: y,
            z: z,
            type: 'heatmap'
        }],
        layout = {
            xaxis: {
                nticks: 15,
                tickangle: 45
            }
        };

    $('#' + divid).width(500);

    Plotly.plot(divid, data, layout);
}

function colorheatmap(divid) {
    // colorscales can be arrays of [fraction,color] as below
    // or a number of preset strings that match the Plotly GUI:
    // Greys, YIGnBu, Greens, YIOrRd, Bluered, RdBu, Picnic,
    // Rainbow, Portland, Jet, Hot, Blackbody, Earth, Electric
    var x = _.range(0, 30, 1),
        t = _.map(x, function(xi) {
            var day = new Date();
            day.setDate(day.getDate() + xi);
            return unix_to_mysql(day);
        }),
        y = ['9AM', '12PM', '3PM', '6PM', '9PM'],
        z = [],
        c = [
            [0, 'rgb(0,0,255)'],
            [0.1, 'rgb(51,153,255)'],
            [0.2, 'rgb(102,204,255)'],
            [0.3, 'rgb(153,204,255)'],
            [0.4, 'rgb(204,204,255)'],
            [0.5, 'rgb(255,255,255)'],
            [0.6, 'rgb(255,204,255)'],
            [0.7, 'rgb(255,153,255)'],
            [0.8, 'rgb(255,102,204)'],
            [0.9, 'rgb(255,102,102)'],
            [1, 'rgb(255,0,0)']
        ];
    for (var i = 0; i < y.length; i++) {
        z.push(
            d3.range(t.length).map(d3.random.normal(10))
        );
    }
    var data = [{
            x: t,
            y: y,
            z: z,
            type: 'heatmap',
            scl: c
        }],
        layout = {
            xaxis: {
                nticks: 15
            }
        };

    $('#' + divid).width(500);

    Plotly.plot(divid, data, layout);
}

function logheatmap(divid) {
    var x = _.range(0, 30, 1),
        y = ['9AM', '12PM', '3PM', '6PM', '9PM'],
        z = [];
    for (var i = 0; i < y.length; i++) {
        z.push(
            d3.range(x.length).map(d3.random.normal(10))
        );
    }
    var data = [{
            x: x,
            y: y,
            z: z,
            type: 'heatmap'
        }],
        layout = {
            xaxis: {
                type: 'log'
            }
        };

    $('#' + divid).width(500);

    Plotly.plot(divid, data, layout);
}

function diffraction(divid) {
    var x = _.range(0, 1000, 2),
        y1 = _.map(x, function(xi) {
            return Math.exp(-0.0001 * Math.pow((xi - 400), 2));
        }),
        y2 = _.map(x, function(xi) {
            return 2 * Math.exp(-0.0001 * Math.pow((xi - 200), 2));
        }),
        y3 = _.map(x, function(xi) {
            return 1.5 * Math.exp(-0.0001 * Math.pow((xi - 600), 2));
        }),

        legend = {
            bgcolor: 'rgba(102, 102, 102, 0.15)',
            bordercolor: 'rgba(0, 0, 0, 0)',
            x: 0.5,
            y: 0.95
        },

        layout = {
            plot_bgcolor: 'rgba(217, 217, 217, 0.5)',
            xaxis: {
                range: [10, 800],
                autorange: false,
                ticklen: 0,
                gridcolor: 'rgb(255, 255, 255)',
                zeroline: false,
                linecolor: 'rgba(0, 0, 0, 0)',
                linewidth: 0.1,
                title: 'Wavelength (nm)',
                nticks: 14
            },
            yaxis: {
                type: 'linear',
                range: [0, 2.4],
                autorange: false,
                ticklen: 0,
                gridcolor: 'rgb(255, 255, 255)',
                zeroline: false,
                linecolor: 'rgba(0, 0, 0, 0)',
                linewidth: 0.1,
                title: 'Response'
            },
            title: 'Diffraction Peaks',
            legend: legend
        },

        data = [{
            x: x,
            y: y1,
            'fill': 'tozero',
            name: 'Peak 1'
        }, {
            x: x,
            y: y2,
            'fill': 'tozero',
            name: 'Peak 2'
        }, {
            x: x,
            y: y3,
            'fill': 'tozero',
            name: 'Peak 3'
        }];

    Plotly.plot(divid, data, layout);
}

function basicanno(divid) {
    var x = _.range(1, 40, 1),
        y = _.map(x, function(xi) {
            return (Math.random() + 0.2) * 2;
        }),
        anno = {
            text: 'O<sub>2</sub> leak in chamber',
            x: 21,
            y: 8.5,
        },
        layout = {
            annotations: [anno],
            yaxis: {
                range: [0.7, 14],
                autorange: false,
                showgrid: false
            },
            xaxis: {
                showgrid: false
            }
        };
    y[20] = 8;

    Plotly.plot(divid, [{
        x: x,
        y: y
    }], layout);
}

function annosymbols(divid) {
    var x = _.range(0, 50, 1),
        y = _.map(x, function(xi) {
            return (Math.random() + 0.2) * 2;
        });
    y[10] += 1;
    y[20] += 1;
    y[30] += 1;
    y[40] += 1;
    var a1 = {
            text: 't=10',
            x: 10,
            y: y[10],
            arrowcolor: "rgb(44, 160, 44)",
            arrowhead: 8,
            arrowwidth: 2.5,
            ax: -1,
            ay: -40
        },
        a2 = {
            text: 't=20',
            x: 20,
            y: y[20] + 0.5,
            arrowcolor: "rgb(227, 119, 194))",
            arrowhead: 4,
            arrowwidth: 2.5,
            ax: -1,
            ay: -40
        },
        a3 = {
            text: 't=30',
            x: 30,
            y: y[30],
            arrowcolor: "rgb(148, 103, 189)",
            arrowhead: 6,
            arrowwidth: 2.5,
            ax: -1,
            ay: -40
        },
        a4 = {
            text: 'Lift off!',
            x: 40,
            y: y[40],
            arrowcolor: "rgb(23, 190, 207)",
            arrowhead: 7,
            arrowwidth: 2.5,
            ax: -1,
            ay: -40
        },
        layout = {
            annotations: [a1, a2, a3, a4],
            yaxis: {
                range: [-2, 8],
                autorange: false,
                showgrid: false,
                zeroline: false
            },
            xaxis: {
                showgrid: false,
                zeroline: false
            }
        };
    Plotly.plot(divid, [{
        x: x,
        y: y,
        opacity: 0.5
    }], layout);
}

function annocaption(divid) {
    var x = _.range(1, 40, 1),
        y = _.map(x, function(xi) {
            return (Math.random() * 3) + 4;
        }),
        yt = _.map(x, function(xi) {
            return 7;
        }),
        yb = _.map(x, function(xi) {
            return 4;
        }),
        anno = {
            text: 'Average Power: 3.2 kW',
            x: 0.05,
            y: 0.05,
            xref: "paper",
            yref: "paper",
            showarrow: false,
            font: {
                family: 'Times New Roman',
                size: 16,
                color: 'green'
            }
        },
        layout = {
            annotations: [anno],
            yaxis: {
                range: [3, 8],
                autorange: false,
                showgrid: false
            },
            xaxis: {
                showgrid: false
            },
            showlegend: false
        },
        l = {
            color: 'rgb(214, 39, 40)',
            dash: 'dash'
        },
        data = [{
            x: x,
            y: y
        }, {
            x: x,
            y: yt,
            line: l
        }, {
            x: x,
            y: yb,
            line: l
        }];

    Plotly.plot(divid, data, layout);
}

function us_exports(divid) {
    var x = [1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002,
        2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012
    ];
    var data = [{
        x: x,
        y: [219, 146, 112, 127, 124, 180, 236, 207, 236, 263,
            350, 430, 474, 526, 488, 537, 500, 439
        ],
        name: "Rest of world",
        type: "bar",
        marker: {
            color: "rgb(55, 83, 109)"
        }
    }, {
        x: x,
        y: [16, 13, 10, 11, 28, 37, 43, 55, 56, 88, 105,
            156, 270, 299, 340, 403, 549, 499
        ],
        name: "China",
        type: "bar",
        marker: {
            color: "rgb(26, 118, 255)"
        }
    }];

    var layout = {
        title: "",
        xaxis: {
            linecolor: "rgba(0, 0, 0, 0)",
            dtick: 2,
            ticks: "outside",
            ticklen: 6,
            tickwidth: 1,
            tickcolor: "rgb(230, 230, 230)",
            tickangle: 45,
            showticklabels: true,
            showgrid: false,
            autorange: true,
            tickmode: 'linear',
            zeroline: true,
            zerolinecolor: "rgb(112, 112, 112)",
            zerolinewidth: 1,
            tickfont: {
                size: 14,
                color: "rgb(107, 107, 107)"
            }
        },
        yaxis: {
            range: [0, 700],
            linecolor: "rgba(0, 0, 0, 0)",
            dtick: 200,
            ticks: "",
            showticklabels: true,
            showgrid: true,
            gridcolor: "rgb(231, 231, 231)",
            gridwidth: 2,
            autorange: false,
            tickmode: 'linear',
            zeroline: true,
            zerolinecolor: "rgb(112, 112, 112)",
            zerolinewidth: 1.5,
            title: "USD (millions)",
            titlefont: {
                size: 16,
                color: "rgb(107, 107, 107)"
            },
            tickfont: {
                size: 14,
                color: "rgb(107, 107, 107)"
            }
        },
        legend: {
            bgcolor: "rgba(255, 255, 255, 0)",
            bordercolor: "rgba(0, 0, 0, 0)",
            font: {
                family: "\"Palatino Linotype\", serif",
                size: 14,
                color: "rgb(67, 67, 67)"
            },
            y: 0.856,
            x: -0.025
        },
        margin: {
            l: 80,
            r: 80,
            t: 80,
            b: 100,
            pad: 2
        },
        barmode: "group",
        bargap: 0.15,
        bargroupgap: 0.1,
        font: {
            family: "\"Palatino Linotype\", serif",
            size: 12,
            color: "#000"
        },
        annotations: [{
            text: "US export of plastic scrap",
            font: {
                color: "rgb(57, 85, 110)",
                size: 16
            },
            xref: "paper",
            yref: "paper",
            showarrow: false,
            y: 0.98,
            x: 0.01
        }],
        showlegend: true
    };

    Plotly.plot(divid, data, layout);
}

function prognostics(divid) {
    var x0 = _.range(0, 0.5, 0.05),
        y0 = _.map(x0, function(xi) {
            return Math.pow(xi, 2);
        }),
        y1 = _.map(x0, function(xi) {
            return Math.pow(xi, 2) + 0.14 * Math.random() - 0.07;
        }),
        y2 = _.map(x0, function(xi) {
            return 0.1 * Math.random();
        }),
        x3 = _.range(0.505, 1, 0.025),
        y3 = _.map(x3, function(xi) {
            return Math.pow(xi, 2);
        }),
        y4 = _.map(x3, function(xi) {
            return 0.1 + Math.pow(xi, 2);
        }),
        y5 = _.map(x3, function(xi) {
            return -0.1 + Math.pow(xi, 2);
        }),
        y6 = _.map(x3, function(xi) {
            return Math.pow(xi, 2) + 0.5 * Math.random() - 0.2;
        }),
        data = [{
            x: x0,
            y: y1,
            name: "Trials",
            mode: "markers",
            marker: {
                size: 6
            },
            type: "scatter",
            error_y: {
                visible: true,
                type: "data",
                array: y2
            }
        }, {
            x: x0,
            y: y0,
            name: "Fit",
            mode: "lines"
        }, {
            x: x3,
            y: y6,
            name: "Validation",
            mode: "markers",
            marker: {
                opacity: 0.9,
                size: 6
            }
        }, {
            x: x3,
            y: y3,
            name: "Model",
            mode: "lines"
        }, {
            x: x3,
            y: y4,
            line: {
                dash: "dash",
                width: 1
            },
            mode: "lines",
            name: "Upper Bound"
        }, {
            x: x3,
            y: y5,
            name: "Lower Bound",
            mode: "lines",
            line: {
                dash: "dash",
                width: 1
            },
            fill: "tonexty"
        }],
        layout = {
            title: "Material Prognostics",
            xaxis: {
                showgrid: false,
                title: "Time (h)",
                zeroline: false
            },
            yaxis: {
                zeroline: false,
                title: "Stress (Pa)"
            },
            legend: {
                bgcolor: "rgba(255, 255, 255, 0.7)",
                bordercolor: "rgba(0, 0, 0, 0)",
                y: 1,
                x: 0
            },
            font: {
                color: "rgb(15, 15, 15)"
            },
            showlegend: true
        };

    Plotly.plot(divid, data, layout);
}

function scatter3d(divid) {
    var x = new Array(1000),
        y = new Array(1000),
        z = new Array(1000);

    for(var i = 0; i < 1000; i++) {
        x[i] = Math.random() + Math.random() + Math.random() + 0.5;
        y[i] = Math.random() + Math.random() + Math.random();
        z[i] = Math.random() + Math.random() + Math.random();
    }

    var data = [{
        x: x, y: y, z: z, type: 'scatter3d', mode: 'markers'
    },{
        x: y, y: z, z: x, type: 'scatter3d', mode: 'markers'
    }];

    Plotly.plot(divid, data, {});
}

function surface3d(divid) {
    var x = _.range(-10, 10.05, 0.1),
        y = x,
        z = new Array(x.length);

    for(var i = 0; i < x.length; i++) {
        var row = new Array(y.length);
        for(var j = 0; j < y.length; j++) {
            var z0 = 1 + 50 / (x[i]*x[i] + y[j]*y[j] + 10);
            row[j] = z0 * (1 + (Math.random() - Math.random()) / 10);
        }
        z[i] = row;
    }

    var data = [{
        x: x, y: y, z: z, type: 'surface'
    }];

    Plotly.plot(divid, data, {});
}

function scattergeomarkers(divid) {
    // By default, geographic data is loaded asynchronously from
    // the topojson subdirectory located at the root of the plotlyjs directory.
    //
    // To remove this asynchronous step, include:
    // <script type="text/javascript" src="topojson/plotly-geo-assets.min.js"></script>
    // after "plotly.min.js".
    // Note that this bundle is quite large.
    // Serving it from a network is not recommended.
    //
    // If you choose to rename or move the topojson subdirectory, include
    // <script>PLOTLYENV={TOPOJSON_URL:"path/to/topojson/"};</script>
    // after "plotly.min.js"

    var data = [{
        type: 'scattergeo',
        mode: 'markers+text',
        text: [
            'Montreal', 'Toronto', 'Vancouver', 'Calgary', 'Edmonton',
            'Ottawa', 'Halifax', 'Victoria', 'Winnepeg', 'Regina'
        ],
        lon: [
            -73.57, -79.24, -123.06, -114.1, -113.28,
            -75.43, -63.57, -123.21, -97.13, -104.6
        ],
        lat: [
            45.5, 43.4, 49.13, 51.1, 53.34, 45.24,
            44.64, 48.25, 49.89, 50.45
        ],
        marker: {
            size: 7,
            color: [
                '#bebada', '#fdb462', '#fb8072', '#d9d9d9', '#bc80bd',
                '#b3de69', '#8dd3c7', '#80b1d3', '#fccde5', '#ffffb3'
            ],
            line: {
                width: 1
            }
        },
        name: 'Canadian cities',
        textposition: [
            'top right', 'top left', 'top center', 'bottom right', 'top right',
            'top left', 'bottom right', 'bottom left', 'top right', 'top right'
        ],
    }];

    var layout = {
        title: 'Canadian cities',
        font: {
            family: 'Droid Serif, serif',
            size: 6
        },
        titlefont: {
            size: 16
        },
        geo: {
            scope: 'north america',
            resolution: 50,
            lonaxis: {
                'range': [-130, -55]
            },
            lataxis: {
                'range': [40, 70]
            },
            showrivers: true,
            rivercolor: '#fff',
            showlakes: true,
            lakecolor: '#fff',
            showland: true,
            landcolor: '#EAEAAE',
            countrycolor: '#d3d3d3',
            countrywidth: 1.5,
            subunitcolor: '#d3d3d3'
        }
    };

    Plotly.plot(divid, data, layout);
}

function scattergeolines(divid) {
    var colors = ['rgb(213,62,79)', 'rgb(254,224,139)', 'rgb(102,194,165)'],
    lon = _.range(-180, 180, 0.5),
    data = [];

    for(var i = 0; i < colors.length; i++) {
        data.push({
            type: 'scattergeo',
            mode: 'lines',
            lon: lon,
            lat: _.map(lon, function(loni) {
                return 15*(i+1) * Math.sin(4 * loni * Math.PI / 180) + 15;
            }),
            line: {
                color: colors[i]
            }
        });
    }

    var layout = {
        geo: {
            projection: {
                type: 'orthographic',
                rotation: {
                    lon: -100,
                    lat: 40
                },
            },
            showocean: true,
            oceancolor: 'rgb(0, 255, 255)',
            showland: true,
            landcolor: 'rgb(230, 145, 56)',
            showlakes: true,
            lakecolor: 'rgb(0, 255, 255)',
            showcountries: true,
            lonaxis: {
                showgrid: true,
                gridcolor: 'rgb(102, 102, 102)'
            },
            lataxis: {
                showgrid: true,
                gridcolor: 'rgb(102, 102, 102)'
            }
        }
    };

    Plotly.plot(divid, data, layout);
}

function scattergeobubbles(divid) {
    var data = [{
        type: 'scattergeo',
        mode: 'markers',
        locations: ['FRA', 'DEU', 'RUS', 'ESP'],
        marker: {
            size: [20, 30, 15, 10],
            color: [10, 20, 40, 50],
            cmin: 0,
            cmax: 50,
            colorscale: 'Greens',
            colorbar: {
                title: 'Some rate',
                ticksuffix: '%',
                showticksuffix: 'last'
            },
            line: {
                color: 'black'
            }
        },
        name: 'europe data'
    }];

    var layout = {
        'geo': {
            'scope': 'europe',
            'resolution': 50
        }
    };

    Plotly.plot(divid, data, layout);
}

function choroplethworld(divid) {
    var data = [{
        type: 'choropleth',
        locationmode: 'country names',
        locations: [
            'Belarus', 'Moldova', 'Lithuania', 'Russia', 'Romania', 'Ukraine',
            'Andorra', 'Hungary', 'Czech Republic', 'Slovakia', 'Portugal',
            'Serbia', 'Grenada', 'Poland', 'Latvia', 'Finland', 'South Korea',
            'France', 'Australia', 'Croatia', 'Ireland', 'Luxembourg', 'Germany',
            'Slovenia', 'United Kingdom', 'Denmark', 'Bulgaria', 'Spain',
            'Belgium', 'South Africa', 'New Zealand', 'Gabon', 'Namibia',
            'Switzerland', 'Saint Lucia', 'Austria', 'Estonia', 'Greece',
            'Kazakhstan', 'Canada', 'Nigeria', 'Netherlands', 'Uganda',
            'Rwanda', 'Chile', 'Argentina', 'Burundi', 'United States',
            'Cyprus', 'Sweden', 'Venezuela', 'Paraguay', 'Brazil',
            'Sierra Leone', 'Montenegro', 'Belize', 'Cameroon', 'Botswana',
            'Saint Kitts and Nevis', 'Guyana', 'Peru', 'Panama', 'Niue',
            'Palau', 'Norway', 'Tanzania', 'Georgia', 'Uruguay', 'Angola',
            'Laos', 'Japan', 'Mexico', 'Ecuador', 'Dominica', 'Iceland',
            'Thailand', 'Bosnia and Herzegovina', 'Sao Tome and Principe', 'Malta',
            'Albania', 'Bahamas', 'Dominican Republic', 'Mongolia',
            'Cape Verde', 'Barbados', 'Burkina Faso', 'Italy',
            'Trinidad and Tobago', 'China', 'Macedonia',
            'Saint Vincent and the Grenadines', 'Equatorial Guinea',
            'Suriname', 'Vietnam', 'Lesotho', 'Haiti', 'Cook Islands',
            'Colombia', 'Ivory Coast', 'Bolivia', 'Swaziland',
            'Zimbabwe', 'Seychelles', 'Cambodia', 'Puerto Rico',
            'Netherlands Antilles', 'Philippines', 'Costa Rica',
            'Armenia', 'Cuba', 'Nicaragua', 'Jamaica', 'Ghana',
            'Liberia', 'Uzbekistan', 'Chad', 'United Arab Emirates',
            'Kyrgyzstan', 'India', 'Turkmenistan', 'Kenya', 'Ethiopia',
            'Honduras', 'Guinea-Bissau', 'Zambia', 'Republic of the Congo',
            'Guatemala', 'Central African Republic', 'North Korea',
            'Sri Lanka', 'Mauritius', 'Samoa',
            'Democratic Republic of the Congo', 'Nauru',
            'Gambia', 'Federated States of Micronesia', 'El Salvador',
            'Fiji', 'Papua New Guinea', 'Kiribati', 'Tajikistan',
            'Israel', 'Sudan', 'Malawi', 'Lebanon',
            'Azerbaijan', 'Mozambique', 'Togo', 'Nepal',
            'Brunei', 'Benin', 'Singapore', 'Turkey', 'Madagascar',
            'Solomon Islands', 'Tonga', 'Tunisia', 'Tuvalu', 'Qatar',
            'Vanuatu', 'Djibouti', 'Malaysia', 'Syria',
            'Maldives', 'Mali', 'Eritrea', 'Algeria', 'Iran', 'Oman',
            'Brunei', 'Morocco', 'Jordan', 'Bhutan', 'Guinea',
            'Burma', 'Afghanistan', 'Senegal', 'Indonesia', 'Timor-Leste',
            'Iraq', 'Somalia', 'Egypt', 'Niger', 'Yemen', 'Comoros',
            'Saudi Arabia', 'Bangladesh', 'Kuwait', 'Libya', 'Mauritania', 'Pakistan'
        ],
        z: [
            '17.5', '16.8', '15.4', '15.1', '14.4', '13.9', '13.8', '13.3',
            '13', '13', '12.9', '12.6', '12.5', '12.5', '12.3', '12.3',
            '12.3', '12.2', '12.2', '12.2', '11.9', '11.9', '11.8', '11.6',
            '11.6', '11.4', '11.4', '11.2', '11', '11', '10.9', '10.9',
            '10.8', '10.7', '10.4', '10.3', '10.3', '10.3', '10.3', '10.2',
            '10.1', '9.9', '9.8', '9.8', '9.6', '9.3', '9.3', '9.2', '9.2',
            '9.2', '8.9', '8.8', '8.7', '8.7', '8.7', '8.5', '8.4', '8.4',
            '8.2', '8.1', '8.1', '8', '8', '7.9', '7.7', '7.7', '7.7', '7.6',
            '7.5', '7.3', '7.2', '7.2', '7.2', '7.1', '7.1', '7.1', '7.1', '7.1',
            '7', '7', '6.9', '6.9', '6.9', '6.9', '6.8', '6.8', '6.7', '6.7',
            '6.7', '6.7', '6.6', '6.6', '6.6', '6.6', '6.5', '6.4', '6.4',
            '6.2', '6', '5.9', '5.7', '5.7', '5.6', '5.5', '5.4', '5.4',
            '5.4', '5.4', '5.3', '5.2', '5', '4.9', '4.8', '4.7', '4.6', '4.4',
            '4.3', '4.3', '4.3', '4.3', '4.3', '4.2', '4', '4', '4',
            '3.9', '3.8', '3.8', '3.7', '3.7', '3.6', '3.6', '3.6', '3.5',
            '3.4', '3.3', '3.2', '3', '3', '3', '2.8', '2.8', '2.7', '2.5',
            '2.4', '2.3', '2.3', '2.3', '2.2', '2.1', '2.1', '2', '2',
            '1.8', '1.7', '1.6', '1.5', '1.5', '1.5', '1.4', '1.3', '1.3',
            '1.2', '1.2', '1.1', '1.1', '1', '1', '0.9', '0.9', '0.9', '0.7',
            '0.7', '0.7', '0.7', '0.7', '0.6', '0.6', '0.6', '0.5', '0.5', '0.4',
            '0.3', '0.3', '0.2', '0.2', '0.2', '0.1', '0.1', '0.1', '0.1'
        ],
    }];

    var layout = {
        title: 'Pure alcohol consumption<br>among adults (age 15+) in 2010',
        geo: {
            projection: {
                type: 'robinson'
            }
        }
    };

    Plotly.plot(divid, data, layout);
}

function choroplethusa(divid) {
    var data = [{
        type: 'choropleth',
        locationmode: 'USA-states',
        locations: [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT',
            'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
            'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA',
            'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV',
            'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH',
            'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN',
            'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ],
        z: [
            1390.63, 13.31, 1463.17, 3586.02, 16472.88, 1851.33,
            259.62, 282.19, 3764.09, 2860.84, 401.84, 2078.89,
            8709.48, 5050.23, 11273.76, 4589.01, 1889.15, 1914.23,
            278.37, 692.75, 248.65, 3164.16, 7192.33, 2170.8, 3933.42,
            1718, 7114.13, 139.89, 73.06, 500.4, 751.58, 1488.9,
            3806.05, 3761.96, 3979.79, 1646.41, 1794.57, 1969.87, 31.59,
            929.93, 3770.19, 1535.13, 6648.22, 453.39, 180.14, 1146.48,
            3894.81, 138.89, 3090.23, 349.69
        ],
        zmin: 0,
        zmax: 17000,
        colorscale: [
            [0, 'rgb(242,240,247)'], [0.2, 'rgb(218,218,235)'],
            [0.4, 'rgb(188,189,220)'], [0.6, 'rgb(158,154,200)'],
            [0.8, 'rgb(117,107,177)'], [1, 'rgb(84,39,143)']
        ],
        colorbar: {
            title: 'Millions USD',
            thickness: 0.2
        },
        marker: {
            'line': {
                'color': 'rgb(255,255,255)',
                'width': 2
            }
        }
    }];

    var layout = {
        title: '2011 US Agriculture Exports by State',
        'geo': {
            scope: 'usa',
            showlakes: true,
            lakecolor: 'rgb(255, 255, 255)'
        },
    };

    Plotly.plot(divid, data, layout);
}

// ---> ~ ~ ~ <---

window.onload = function() {

    loadsection('lineplots');

    $('ul.navlist li:not(".lead")>a').click(function() {
        var divid = this.getAttribute("data-divid");
        if ($('#' + divid).length === 0) {
            // graph doesn't exist yet, need to create that graph section
            var section = getplotsection(divid);
            if (section === false) return;
            loadsection(section);
        }
        var top = $('#' + divid).position().top;
        scrollTo(0, Number(top) - 100);
        return false;
    });

    $('#jsdocs_loading').hide();
    $('#jsdocs_contents').fadeIn();

    $(window).scroll(function() {
        if ($(window).scrollTop() >= $(document).height() - $(window).height() * 1.5) {
            loadsection();
        }
    });

    $('p[data-type]').click(function() {
        selectPlotType(this);
    });
    selectPlotType($('p[data-type="scatter"]')[0]);
};

function selectPlotType(el) {
    var typeEl = $(el),
        type = typeEl.attr('data-type');
    // select this plot type
    typeEl.addClass('selected');
    typeEl.siblings().removeClass('selected');
    // show options relevant to this plot type
    typeEl.closest('dl').children('dt').each(function() {
        var showOption = $(this).hasClass('alltypes') || $(this).hasClass(type);
        $(this).add($(this).next('dd')).toggle(showOption);
    });
    // show information relevant to this plot type
    typeEl.closest('dl').find('.sometypes').each(function() {
        $(this).toggle($(this).hasClass(type));
    });
}

// given the div id for a plot, return the name of the plot section
// Example: stackchart [plot id] ---> barcharts [section id]
function getplotsection(plotid) {
    var plots = allplots();
    for (var i = 0; i < plots.length; i++) {
        var section = plots[i].section,
            key = Object.keys(plots[i])[0],
            divid = plots[i][key];

        if (plotid == divid) {
            return section;
        }
    }
    return false;
}

// find the first graph section that does not exist
function nextsection() {

    var existingplots = [];
    $('div.jsdocs-plot-container').each(function(i, v) {
        var newclasses = $(v).attr('class').split(/\s+/);
        for (var k = 0; k < newclasses.length; k++) {
            if (existingplots.indexOf(newclasses[k]) < 0 && newclasses[k] !== 'jsdocs-plot-container') {
                existingplots.push(newclasses[k]);
            }
        }
    });

    var plots = allplots();

    for (var i = 0; i < plots.length; i++) {
        var section = plots[i].section;
        if (existingplots.indexOf(section) < 0) {
            return section;
        }
    }

    return false;
}

// add a new graph section
function loadsection(new_section) {

    if (new_section === undefined) {
        new_section = nextsection();
        if (new_section === false) {
            return;
        }
    }

    var plots = allplots();

    for (var i = 0; i < plots.length; i++) {
        var section = plots[i].section;
        if (section === new_section) {
            var key = Object.keys(plots[i])[0],
                func = plots[i][key],
                divid = plots[i][key],
                html = '<hr class="push">' +
                '<a href="#" class="back-to-top">BACK TO TOP</a>' +
                '<h2 class="beta heading">' + key + '</h2>';
            if (divid.substr(0, 3) == 'api') {
                $('body').append(html);
                $('#' + divid + '-template').appendTo('body')
                    .css('display', 'block')
                    .attr('id', divid);
            } else {
                html +=
                    '<div id="' + divid + '" class="jsdocs-plot-container ' + section + '"></div>' +
                    '<div class="js_code_container">' +
                    '<pre class="prettyprint lang-js jsdocs">' +
                    window[func].toString().replace(/</g, '&lt;') + '</pre></div>';
                $('body').append(html);
                window[func](divid); // call the function
            }

        }
    }
    $('.back-to-top').click(function() {
        scrollTo(0, 0);
        return false;
    });
    prettyPrint();
}

function allplots() {
    // return dictionary of all plots
    // dictionary struction:
    // { [Title of example] : [id of div for example], section : [category of example, all undercase and no spaces] }

    var plots = [
        // line plots
        {
            'Line Plot': 'lineplot',
            section: 'lineplots'
        }, {
            'Time Series': 'timeseries',
            section: 'lineplots'
        }, {
            'Multiple Line Plots': 'multiline',
            section: 'lineplots'
        }, {
            'Log Plot': 'logplot',
            section: 'lineplots'
        },
        // subplots I
        {
            'Independent Axes<br>(Zoom & Pan the subplots independently)': 'indiaxes',
            section: 'subplotsI'
        }, {
            'Coupled Axes (Zoom & Pan the subplots jointly)': 'coupledaxes',
            section: 'subplotsI'
        },
        // subplots II
        {
            'Vertically Stacked': 'verticallystacked',
            section: 'subplotsII'
        }, {
            'Insets': 'insets',
            section: 'subplotsII'
        }, {
            '2d Histogram': 'twodhistogram',
            section: 'subplotsII'
        },
        // Multiaxes
        {
            'Double Y-Axis': 'doubleyaxis',
            section: 'multi'
        }, {
            'Multiple Y-Axis': 'multiaxes',
            section: 'multi'
        },
        // callbacks
        {
            'Click on Points': 'clickcallback',
            section: 'callbacks'
        }, {
            'Zoom Callback (Click-drag zooms in; double-click zooms out)': 'zoomcallback',
            section: 'callbacks'
        }, {
            'Hover on Points': 'hovercallback',
            section: 'callbacks'
        }, {
            'Manual Hover': 'manualhover',
            section: 'callbacks'
        }, {
            'Hide / Show': 'hideshow',
            section: 'callbacks'
        },
        // scatter plots
        {
            'Scatter Plot': 'scatter',
            section: 'scatterplots'
        }, {
            'Multiple Scatter Plots': 'multiscatter',
            section: 'scatterplots'
        }, {
            'Marker Types': 'markers',
            section: 'scatterplots'
        }, {
            'Bubble Chart': 'bubble',
            section: 'scatterplots'
        },
        // bar charts
        {
            'Bar Chart': 'barchart',
            section: 'barcharts'
        }, {
            'Horizontal Bar Chart': 'horizontalbar',
            section: 'barcharts'
        }, {
            'Grouped Bar Chart': 'groupchart',
            section: 'barcharts'
        }, {
            'Stacked Bar Chart': 'stackchart',
            section: 'barcharts'
        },
        // annotations
        {
            'Annotation': 'basicanno',
            section: 'annotations'
        }, {
            'Annotation Symbols': 'annosymbols',
            section: 'annotations'
        }, {
            'Captions': 'annocaption',
            section: 'annotations'
        },
        // area plots
        {
            'Stacked Area Plot': 'stackarea',
            section: 'areaplots'
        }, {
            'Overlaid Area Plot': 'overlaidarea',
            section: 'areaplots'
        },
        // legends
        {
            'Styling the Legend': 'stylelegend',
            section: 'legends'
        }, {
            'Position Legend inside Plot': 'poslegendin',
            section: 'legends'
        }, {
            'Position Legend outside Plot': 'poslegendout',
            section: 'legends'
        },
        // histograms
        {
            'Basic Histogram': 'histogram',
            section: 'histograms'
        }, {
            'Overlaid Histograms': 'overhist',
            section: 'histograms'
        }, {
            'Stacked Histograms': 'stackhist',
            section: 'histograms'
        },
        // error bars
        {
            'Error Bars - Bar Charts': 'ebarbar',
            section: 'errorbars'
        }, {
            'Error Bars - Line Plots': 'ebarline',
            section: 'errorbars'
        }, {
            'Error Bar Styling': 'ebarstyle',
            section: 'errorbars'
        },
        // box plots
        {
            'Box Plot': 'boxplot',
            section: 'boxplots'
        }, {
            'Box Plot with Jitter': 'jitter',
            section: 'boxplots'
        }, {
            'Box Plot Styling': 'boxstyle',
            section: 'boxplots'
        },
        // heatmaps
        {
            'Heatmap': 'heatmap',
            section: 'heatmaps'
        }, {
            'Heatmap with Dates': 'datesheatmap',
            section: 'heatmaps'
        }, {
            'Custom Heatmap Colors': 'colorheatmap',
            section: 'heatmaps'
        }, {
            'Semilog Heatmap': 'logheatmap',
            section: 'heatmaps'
        },
        // 3D
        {
            '3D Scatter': 'scatter3d',
            section: '3d'
        },
        {
            '3D Surface': 'surface3d',
            section: '3d'
        },
        // Geo
        {
            'Scatter points above North America': 'scattergeomarkers',
            section: 'scattergeo'

        },
        {
            'Lines on a orthographic map': 'scattergeolines',
            section: 'scattergeo'

        },
        {
            'Bubble above European country centroids': 'scattergeobubbles',
            section: 'scattergeo'

        },
        {
            'World countries choropleth': 'choroplethworld',
            section: 'choropleth'

        },
        {
            'USA states choropleth': 'choroplethusa',
            section: 'choropleth'

        },
        // full examples
        {
            'Diffraction Peaks': 'diffraction',
            section: 'fullystyled'
        }, {
            'US Exports': 'us_exports',
            section: 'fullystyled'
        }, {
            'Material Prognostics': 'prognostics',
            section: 'fullystyled'
        }
    ];

    return plots;
}

// Single value UNIX to mySQL timestamp conversion
function unix_to_mysql(unix_timestamp) {
    return d3.time.format('%Y-%m-%d %H:%M:%S')(new Date(unix_timestamp));
}
