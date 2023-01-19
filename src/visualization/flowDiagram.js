import JsonData from '../../data/output.json' assert { type: 'json' };
let data = JsonData.data;
let nodes = [];
let nodesCount = 0;
let nodesNameList = [];
let jsonCondMap = JsonData.conditionalMap;
let condMap = new Map(Object.entries(jsonCondMap));

let defaultScale = 0.6;

let edges = [];
let IDMaps = new Map();
let parentsMaps = new Map();

// remove recursion data from function names
// e.g. 1_recusivefn_73 -> recusivefn_73
function cleanFnName(fnName) {
    if (fnName.match(/\d+_.+/g)) {
        return fnName.slice(fnName.indexOf('_') + 1);
    }
    return fnName;
}

function jsonToFlowDiagramNode(data) {
    let parents = [];
    data.forEach(item => {
        let currNode = {};

        let functionName = cleanFnName(item.function_name$);
        let parentName = cleanFnName(item.parent_name$);

        if (!nodesNameList.includes(functionName)) {
            nodesNameList.push(functionName);
            if (item.control$.length === 0) {
                currNode = {
                    id: nodesCount,
                    label: functionName,
                    shape: "circle",
                    parent: parentName,
                    name: functionName,
                    ctrlContext: item.control$,
                }
                nodesCount++;
                nodes.push(currNode);
                IDMaps.set(currNode.name, currNode.id);
                parentsMaps.set(currNode.name , [parentName]);
            } else {
                parents.push(parentName);
                currNode = {
                    id: nodesCount,
                    label: functionName,
                    shape: "circle",
                    parent: parentName,
                    name: functionName,
                    ctrlContext: item.control$,
                }
                nodesCount++;
                nodes.push(currNode);
                IDMaps.set(currNode.name, currNode.id);
                parentsMaps.set(currNode.name , [parentName]);
                item.control$.forEach(element => {
                    if (!nodesNameList.includes(element[0])) {
                        nodesNameList.push(element[0]);
                        currNode = {
                            id: nodesCount,
                            label: element[0],
                            shape: "diamond",
                            parent: "null",
                            name: element[0],
                            ctrlContext: [],
                            parentList: [],
                            details: condMap.get(element[0])
                        }
                        nodesCount++;
                        nodes.push(currNode);
                        IDMaps.set(currNode.name, currNode.id);
                        parentsMaps.set(currNode.name , [parentName]);
                    }
                })

            }
        } else {
            let currParents = parentsMaps.get(functionName)
            if (currParents || currParents.length > 0 && parentName) {
                if (!currParents.includes(parentName)) {
                    currParents.push(parentName);
                    parentsMaps.set(functionName, currParents);
                }
            }

        }
        
    })
}

function edgesGenerator(nodes) {
    let pointFrom;
    let edge;
    nodes.forEach(node => {
        if (node.parent != "" && node.parent != "null" && node.ctrlContext.length == 0) {
            pointFrom = IDMaps.get(node.parent);

            edge = {
            source: pointFrom,
            target: node.id,
            };
            edges.push(edge);
        }

        if (node.parent && node.parent != "null" && node.ctrlContext.length !== 0) {
            let currParentsList = parentsMaps.get(node.name);
            for (let i = 0; i < currParentsList.length; i++) {
                const parentId = IDMaps.get(currParentsList[i]);
                const currId = IDMaps.get(node.ctrlContext[0][0]);
                edge = {
                    source: parentId,
                    target: currId
                }
                edges.push(edge);
            }
            for (let i = 0; i < node.ctrlContext.length; i++) {
                let condition = "";
                const currId = IDMaps.get(node.ctrlContext[i][0]);
                if (node.ctrlContext[i].length > 1) {
                    condition = node.ctrlContext[i][1];
                }

                if (node.ctrlContext[i].length == 1) {
                    edge = {
                        source: currId,
                        target: currId
                    }

                    edges.push(edge);
                }

                // reach the end of the list
                if (i ==  node.ctrlContext.length - 1) {
                    edge = {
                        source: currId,
                        target: node.id,
                        label: condition,
                    }
                    edges.push(edge);
                } else {
                    edge = {
                        source: currId,
                        target: IDMaps.get(node.ctrlContext[i + 1][0]),
                        label: condition,
                    }
                    edges.push(edge);
                }
            }
        }
    });
}


jsonToFlowDiagramNode(data);
edgesGenerator(nodes);

// Create graph Object
let g = new dagreD3.graphlib.Graph();
g.setGraph({
    rankdir: 'TB',
    align: 'DL',
    nodesep: 50,
    edgesep: 100,
    ranksep: 30,
    marginx: 50,
    marginy: 0,
});
nodes.forEach(item => {
    if (item.shape === "diamond") {
        g.setNode(item.id, {
            label: item.label,
            shape: item.shape,
            style: "fill:#FFFFFF; stroke:#000000",
            labelStyle: "fill:#000000",
            detail: item.details
        });
    } else {
        g.setNode(item.id, {
            label: item.label,
            shape: item.shape,
            style: "fill:#FFFFFF; stroke:#000000",
            labelStyle: "fill:#000000",
            detail: item.details
        });
    }
})
edges.forEach(item => {
    g.setEdge(item.source, item.target, {
        label: item.label,
        style: "fill:#FFFFFF;stroke:#0000FF;stroke-width:2px;background-color:rgba(220,38,38,0.2);",
        labelStyle: "fill:##0000FF",
        arrowhead: "vee",
        arrowheadStyle: "fill:#f66"
    })
})
// create the render
let render = new dagreD3.render();

// select a svg and add a g element for a container.
let svg = d3.select('#flowDiagramSvg')
let svgGroup = svg.append('g');

// render the flow diagram.
render(svgGroup, g);

// // drag and zoom
// let zoom = d3.zoom()
//     .on("zoom", function () {
//         svgGroup.attr("transform", d3.event.transform);
//     });
// svg.call(zoom);

//Create the tooltip
function createTooltip() {
    return d3.select('#flowDiagram')
        .append('div')
        .classed('tooltip', true)
        .style('opacity', 0)
        .style('display', 'none');
}
let tooltip = createTooltip();
//tooltip display
function tipVisible(textContent) {
    tooltip.transition()
        .duration(400)
        .style('opacity', 0.9)
        .style('display', 'block');
    tooltip.html(textContent)
        .style('left', (d3.event.pageX + 15) + 'px')
        .style('top', (d3.event.pageY + 15) + 'px');
}
//tooltip hiding
function tipHidden() {
    tooltip.transition()
        .duration(400)
        .style('opacity', 0)
        .style('display', 'none');
}

export function highlightNodes(nodesList, highlightBool) {
    if (nodesList.length === 0) return;
    nodes.forEach(node => {
        if (nodesList.includes((node.name))) {
            if (highlightBool) {
                g.setNode(node.id, {
                    label: node.label,
                    shape: node.shape,
                    style: "fill:#FFFF00; stroke:#000000",
                    labelStyle: "fill:#000000",
                    detail: node.details
                });
            } else {
                g.setNode(node.id, {
                    label: node.label,
                    shape: node.shape,
                    style: "fill:#FFFFFF; stroke:#000000",
                    labelStyle: "fill:#000000",
                    detail: node.details
                });
            }
        }
    })

    render(svgGroup, g);
}


svgGroup.selectAll("g.node")
    .on("mouseover", function (v) {
        tipVisible(g.node(v).detail);
    })
    .on("mouseout", function (v) {
        tipHidden();
    })

// Center and rescale the graph
// var xCenterOffset = (svg.attr('width') - g.graph().width) / 2;
svgGroup.attr('transform', 'translate(0, 5)' + ' scale('+ defaultScale +')');
svg.attr('height', g.graph().height + 40);