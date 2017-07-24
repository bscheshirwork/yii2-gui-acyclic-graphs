/*global d3, routes, modelOptions, tipFunction, messages*/
var json,
    w = document.getElementById("d3container").clientWidth / 1.05,
    h = window.innerHeight - 115,
    rectW = 120,
    rectH = 50;

(function ($) {
    d3.xhr(routes.items).get(function (error, XMLHttpRequest) {

        json = JSON.parse(XMLHttpRequest.response);

        var zoomListener = d3.behavior.zoom().on("zoom", zoom);

        var vis = d3.select("#d3container").append("svg:svg")
            .attr("width", w)
            .attr("height", h);

        var unmarkNodesFunc = function () {
            linksGroup
                .selectAll(selectorLinks)
                .classed('childLink', false);

            nodesGroup.selectAll(selectorNodes).classed('unmarked-node', false);
            $('input[name=search-input]').val(null);
            d3.select("#infoItem").html('');
            nodesGroup.selectAll(selectorNodes).classed('active-node', false);
        };

        var detectedNodeFunc = function (detectedNode) {

            var nodesMarked = [];

            if (detectedNode) {

                linksGroup
                    .selectAll(selectorLinks)
                    .classed('childLink', function (l) {
                        if (detectedNode === l.target) {
                            nodesMarked.push(l.target.index);
                            return true;
                        }
                        return false;

                    });

                nodesGroup.selectAll(selectorNodes).classed('unmarked-node', function (d) {
                    return (nodesMarked.indexOf(d.index) === -1);
                });

                d3.select("#infoItem").html(JSON.stringify(detectedNode));

                nodesGroup.selectAll(selectorNodes).classed('active-node', function (d) {
                    return d.index === detectedNode.index;
                });

            } else {
                unmarkNodesFunc();
            }
        };

        vis.append("svg:defs").selectAll("marker")
            .data(["marker"])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -3 10 6")
            .attr("refX", 10)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M10,-3L0,0L10,3");

        vis.append('text')
            .attr('dx', w - messages.caption1.toString().length * 7)
            .attr('dy', 20)
            .attr('class', 'btn-marks')
            .text(messages.caption1)
            .on('click', unmarkNodesFunc);

        vis.append('text')
            .attr('dx', 10)
            .attr('dy', 25)
            .attr('class', 'label-coordinates')
            .on('click', function () {
                center(force.nodes());
            });

        vis.append('path').attr('d', 'M 5 40 L 5 5').attr('class', 'link').attr("marker-start", "url(#marker)");
        vis.append('path').attr('d', 'M 50 5 L 5 5').attr('class', 'link').attr("marker-start", "url(#marker)");

        if (tipFunction) {
            /* Initialize tooltip */
            var tip = d3.tip().attr('class', 'd3-tip').html(tipFunction);
            /* Invoke the tip in the context of your visualization */
            vis.call(tip);
        }

        var mainGroup = vis.append('g');

        var linksGroup = mainGroup.append("svg:g").attr('id', 'linksGroup');
        var nodesGroup = mainGroup.append("svg:g").attr("id", "nodesGroup");

        var selectorLinks = '#linksGroup path.link';
        var selectorNodes = '#nodesGroup g.node';

        function zoom() {
            d3.select('.label-coordinates').text(Math.round(d3.event.translate[0] * 100) / 100 + ' , ' + Math.round(d3.event.translate[1] * 100) / 100);
            mainGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        function center(nodes) {
            var xArray = nodes.map(function (d) {
                return d.x;
            });
            var minX = d3.min(xArray);
            var maxX = d3.max(xArray);

            var scaleMin = Math.abs(w / (maxX - minX + 2 * rectW));
            if (scaleMin > 1 || isNaN(scaleMin)) {
                scaleMin = 1;
            }
            var startX = -scaleMin;
            var startY = 100;

            d3.select('.label-coordinates').text(Math.round(startX * 100) / 100 + ' , ' + Math.round(startY * 100) / 100);
            mainGroup.attr("transform", "translate(" + [startX, startY] + ")scale(" + scaleMin + ")");
            zoomListener.translate([startX, startY]);
            zoomListener.scale(scaleMin);
            zoomListener.scaleExtent([scaleMin, 1]);
            vis.call(zoomListener).on("dblclick.zoom", null);
        }

        var showSummary = function (answer) {
            var message = answer.responseJSON.message;
            var $form = $(modelOptions.formSelector);
            var data = $form.data('yiiActiveForm'),
                $summary = $form.find(data.settings.errorSummary),
                $ul = $summary.find('ul').empty();
            if ($summary.length && message.length) {
                var error = $('<li/>');
                if (data.settings.encodeErrorSummary) {
                    error.text(message);
                } else {
                    error.html(message);
                }
                $ul.append(error);
                $summary.toggle($ul.find('li').length > 0);
            }
        };

        var eachPk = function (f) {
            $.each(modelOptions.pk, f);
        };

        var nodeIndex = function (node) {
            var i = '';
            eachPk(function (index, pk) {
                i = i + '_' + node[pk];
            });
            return i;
        };

        var nodes = function () {

            var level, nodesLocal = [];
            var mark = 1;
            var unmark = 1;

            json.links.forEach(function (d) {
                if (nodesLocal[d.source] === undefined) {
                    nodesLocal[d.source] = 0;
                }
                nodesLocal[d.source] += 1;
            });

            level = d3.max(nodesLocal) + 1;

            json.nodes.forEach(function (n, i) {

                if (nodesLocal[i]) {
                    n.x = rectW * 1.5 * mark;
                    n.y = rectH * (level - nodesLocal[i]);
                    mark++;
                } else {
                    n.x = rectW * 1.5 * unmark;

                    if (i % 3 === 0) {
                        n.y = rectH * level * 2.5;
                    }
                    else if (i % 2 === 0) {
                        n.y = rectH * level * 2;
                    }
                    else {
                        n.y = rectH * level * 1.5;
                    }

                    unmark++;
                }

                n.fixed = true;
            });


            return json.nodes;
        };

        var links = function () {
            return json.links;
        };

        var force = window.self.force = d3.layout.force()
            .nodes(nodes())
            .links(links())
            .linkDistance(function (link) {
                return h / 3;
            })
            .linkStrength(1)
            // .gravity(2)
            .chargeDistance(rectW * 20)
            .charge(-7000)
            // .friction(0)
            .size([w, h])
            .on("tick", tick)
            .start();

        var setLinks = function (data) {

            var links = linksGroup.selectAll(selectorLinks)
                .data(data, function (d) {
                    return d.source.index + "-" + d.target.index;
                });

            links.enter()
                .append("svg:path")
                .attr('class', 'link')
                .attr("marker-start", function (d) {
                    return "url(#marker)";
                });

            links
                .on('dblclick', deleteLink)
                .on("click", function (d, i) {
                    d3.select("#infoItem").html(JSON.stringify(d));
                });

            links.exit().remove();
        };

        var setNodes = function (data) {
            var nodes = nodesGroup.selectAll(selectorNodes)
                .data(data, function (d) {
                    return nodeIndex(d);
                });

            var group = nodes.enter()
                .append('g')
                .attr("class", "node")

            group.append('rect')
                .attr('class', 'icon')
                .attr("x", -rectW / 2)
                .attr("y", -rectH / 2)
                .attr("width", rectW)
                .attr("height", rectH)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
            ;

            group.append("svg:text")
                .attr("class", "nodetext")
                .text(function (d, i) {
                    return (d[modelOptions.title].length < 20) ? d[modelOptions.title] : d[modelOptions.title].toString().substring(0, 10) + '...';
                }).style("text-anchor", "middle");


            group.call(node_drag)
                .on("click", function (d) {
                    detectedNodeFunc(d);
                })
                .on("dblclick", function (d) {
                    $.each(modelOptions.formElementsSelectors, function (key, value) {
                        $(value).val(d[key] ? d[key] : '');
                    });
                });

            nodes.exit().remove();
        };

        var node_drag = d3.behavior.drag()
            .on("dragstart", dragstart)
            .on("drag", dragmove)
            .on("dragend", dragend);

        var dragTarget = null;

        var addLink = function (sourceIndex, targetIndex) {
            var isInside = false;
            var cross = false;

            json.links.forEach(function (d) {
                if (d.source.index === sourceIndex && d.target.index === targetIndex) {
                    isInside = true;
                }
                if (d.target.index === sourceIndex && d.source.index === targetIndex) {
                    cross = true;
                }
            });

            if (!isInside) { // (!isInside && !cross) for one-direction

                $.post(routes.addChild, {
                    "source": force.nodes()[sourceIndex],
                    "target": force.nodes()[targetIndex]
                }).success(function (data) {
                    json.links.push({
                        "source": force.nodes()[sourceIndex],
                        "target": force.nodes()[targetIndex]
                    });

                    force.stop();

                    setLinks(json.links);

                    force.start();
                }).error(showSummary);
            }
        };

        function deleteLink(datum, index) {
            if (confirm(messages.confirm1)) {

                $.post(routes.removeChild, {
                    "source": json.links[index].source,
                    "target": json.links[index].target
                }).success(function (data) {
                    console.log(data);
                }).error(showSummary);

                json.links.splice(index, 1);

                force.stop();

                setLinks(json.links);

                force.start();
            }
        }

        function dragstart(d, i) {
            zoomListener.on('zoom', null);
        }

        function dragmove(d, i) {
            dragTarget = null;
            d.px += d3.event.dx;
            d.py += d3.event.dy;
            d.x += d3.event.dx;
            d.y += d3.event.dy;

            d3.selectAll(".scopeCircle").remove();

            force.nodes().forEach(function (target) {
                if (nodeIndex(target) !== nodeIndex(d)) {
                    if (Math.sqrt(Math.pow((target.x - d.x), 2) + Math.pow((target.y - d.y), 2)) < 60) {
                        dragTarget = target;
                        var selector = d3.selectAll(selectorNodes).filter(function (d) {
                            return nodeIndex(d) === nodeIndex(target);
                        });
                        selector.append("svg:circle").attr("r", rectW).attr("class", "scopeCircle");
                    }
                }
            });
            tick(d3.event);
        }

        function dragend(d, i) {
            if (dragTarget !== null) {
                addLink(dragTarget.index, i);
                d3.selectAll(".scopeCircle").remove();
                d.fixed = false;
            }
            else {
                d.fixed = true;
            }
            zoomListener.on("zoom", zoom);
        }

        function tick(event) {

            var nodesTick = d3.selectAll(selectorNodes);
            var linksTick = d3.selectAll(selectorLinks);

            nodesTick.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            var map = [];

            force.links().forEach(
                function (d) {
                    var source = d.source;
                    var target = d.target;
                    var sni = nodeIndex(d.source),
                        tni = nodeIndex(d.target);

                    function around() {

                        function items() {
                            {
                                this.items = [];

                                this.parentOnEast = false;

                                this.sortItems = function () {
                                    var parentOnEast = this.parentOnEast;

                                    this.items.sort(function (a, b) {
                                        if (parentOnEast) {
                                            return d3.descending(a.x, b.x);
                                        }

                                        return d3.ascending(a.x, b.x);
                                    });
                                };

                                this.length = function () {
                                    if (this.items.length === 1) {
                                        return 2;
                                    }
                                    return this.items.length;
                                };

                                this.index = function (ni) {
                                    var index = null;
                                    this.items.forEach(function (item, i) {
                                        if (nodeIndex(item) === ni) {
                                            index = i + 1;
                                        }
                                    });
                                    return index;
                                };
                            }
                        }

                        this.northwest = new items();
                        this.northwest.parentOnEast = true;

                        this.northeast = new items();

                        this.southeast = new items();

                        this.southwest = new items();
                        this.southwest.parentOnEast = true;
                    }

                    if (map[sni] === undefined) {
                        map[sni] = new around();
                    }

                    if (map[tni] === undefined) {
                        map[tni] = new around();
                    }

                    if (source.y < target.y) {
                        if (source.x < target.x) {
                            map[sni].southeast.items.push(target);
                            map[tni].northwest.items.push(source);
                            map[sni].southeast.sortItems();
                            map[tni].northwest.sortItems();
                        }
                        else {
                            map[sni].southwest.items.push(target);
                            map[tni].northeast.items.push(source);
                            map[sni].southwest.sortItems();
                            map[tni].northeast.sortItems();
                        }
                    }
                    else {
                        if (source.x < target.x) {
                            map[sni].northeast.items.push(target);
                            map[tni].southwest.items.push(source);
                            map[sni].northeast.sortItems();
                            map[tni].southwest.sortItems();
                        }
                        else {
                            map[sni].northwest.items.push(target);
                            map[tni].southeast.items.push(source);
                            map[sni].northwest.sortItems();
                            map[tni].southeast.sortItems();
                        }
                    }
                }
            );

            linksTick.attr("d", function (d) {

                var x1 = d.source.x,
                    x2 = d.target.x,
                    y1 = d.source.y,
                    y2 = d.target.y,
                    dy = rectH / 2,
                    dx = rectW / 2,
                    da = 10;
                var sni = nodeIndex(d.source),
                    tni = nodeIndex(d.target);

                var Mx, Vy, Hx;

                if (d.source.y < d.target.y) {

                    if (d.source.x < d.target.x) {
                        Mx = x1 + dx / map[sni].southeast.length() * map[sni].southeast.index(tni);
                        Vy = y1 + 2 * dy * (map[sni].southeast.length() - map[sni].southeast.index(tni) + 1);
                        Hx = x2 - dx / map[tni].northwest.length() * map[tni].northwest.index(sni);
                    }
                    else {
                        Mx = x1 - dx / map[sni].southwest.length() * map[sni].southwest.index(tni);
                        Vy = y1 + 2 * dy * (map[sni].southwest.length() - map[sni].southwest.index(tni) + 1);
                        Hx = x2 + dx / map[tni].northeast.length() * map[tni].northeast.index(sni);
                    }

                    return [
                        "M", Mx, y1 + dy + da,
                        "V", Vy,
                        "H", Hx,
                        "V", y2 - dy
                    ].join(" ");

                }
                else {


                    if (d.source.x < d.target.x) {
                        Mx = x1 + dx / map[sni].northeast.length() * map[sni].northeast.index(tni);
                        Vy = y1 - 2 * dy * (map[sni].northeast.length() - map[sni].northeast.index(tni) + 1);
                        Hx = x2 - dx / map[tni].southwest.length() * map[tni].southwest.index(sni);
                    }
                    else {
                        Mx = x1 - dx / map[sni].northwest.length() * map[sni].northwest.index(tni);
                        Vy = y1 - 2 * dy * (map[sni].northwest.length() - map[sni].northwest.index(tni) + 1);
                        Hx = x2 + dx / map[tni].southeast.length() * map[tni].southeast.index(sni);
                    }

                    return [
                        "M", Mx, y1 - dy - da,
                        "V", Vy,
                        "H", Hx,
                        "V", y2 + dy
                    ].join(" ");
                }
            });
        }

        $(modelOptions.formButtonsSelectors.submit).on('click', function () {
            $.post(routes.saveItem, $(modelOptions.formSelector).serialize())
                .success(function (answer) {
                    if (answer.errors) {
                        var errors = answer.errors;
                        $(modelOptions.formSelector).yiiActiveForm('updateMessages', errors, true);
                    } else {
                        var node = answer.item;
                        if (!answer.isNew) {
                            $.each(json.nodes, function (i, n) {
                                if (nodeIndex(n) === nodeIndex(node)) {
                                    $.each(modelOptions.formElementsSelectors, function (key, value) {
                                        json.nodes[i][key] = node[key];
                                    });
                                }
                            });

                            d3.selectAll("text.nodetext").text(function (d, i) {
                                return (nodeIndex(d) === nodeIndex(node) ? node[modelOptions.title] : d[modelOptions.title]);
                            });
                        }
                        else {
                            force.nodes().push(node);
                            setNodes(force.nodes());
                            force.start();
                            center(force.nodes());
                        }
                    }
                }).error(showSummary);
        });

        $(modelOptions.formButtonsSelectors.delete).on('click', function () {
            var $pkCheck = true;
            eachPk(function (index, pk) {
                $pkCheck = $pkCheck && $(modelOptions.formElementsSelectors[pk]).val();
            });
            if ($pkCheck) {
                $.post(routes.deleteItem, $(modelOptions.formSelector).serialize())
                    .success(function (data) {
                        window.location.reload();
                    }).error(showSummary);
            } else {
                alert(messages.hint1);
            }

        });

        var goSearch = function () {
            var nodeTitle = $('input[name=search-input]').val();
            var detectedNode;
            force.nodes().forEach(function (n, i) {
                if (n[modelOptions.title] === nodeTitle) {
                    detectedNode = n;
                }
            });
            detectedNodeFunc(detectedNode);
        };

        $('button[name=search-btn]').on('click', goSearch);

        $('input[name=search-input]').keyup(function (e) {
            if (e.keyCode === 13) {
                goSearch();
            }
        });

        setLinks(json.links);
        setNodes(json.nodes);
        center(json.nodes);
    });
})(jQuery);