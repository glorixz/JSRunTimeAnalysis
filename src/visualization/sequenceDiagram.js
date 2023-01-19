import JsonData from '../../data/output.json' assert { type: 'json' };
import { highlightNodes } from "./flowDiagram.js";

let headerHeight = 30;
let margin = { top: headerHeight, right: 30, bottom: 50, left: 30 }; //margin between the svg and the inner graph

let gWidth; // width of the graph
let gHeight; // height of the graph

let labelTopPad = 5; // padding between header and labels
let labelHeight = 24;
let labelWidth = 60;
let labelBotPad = 5; // padding between labels and time=0

let funcLabels = [];

let xPad = 75; // distance between timelines

let defaultColours = ["#fa6565", "#56dc10", "#11b9d7", "#3570e1","#9d13ee"];
let currColour = 0;

let data = JsonData.data
// convert all time values from unix-milliseconds into
// zero-normalized milliseconds
let delta = data[0].time_start$;
if (delta !== 0) {
    for (let i = 0; i < data.length; i++) {
        data[i].time_start$ -= delta;
        data[i].time_end$ -= delta;
    }
}

let maxTime = 0; // the largest time value in the data
for (let i = 0; i < data.length; i++) {
    if (data[i].time_end$ > maxTime) {
        maxTime = data[i].time_end$;
    }
}

let defaultYScale = 350 / maxTime; // scale to apply to the time axis. Aim for 350-pixel height.
let yScale = defaultYScale;
let axisLPad = 20; // position of axis in relation to margin

let svg;
let tooltip;
extractLabels();
sequenceDiagram();
initZoom();

//=================================
//           FUNCTIONS
//=================================
/**
 * Main function of this file. Create a runtime diagram.
 */
function sequenceDiagram() {
    resizeGraphContainers();

    addHeader(d3.select("#myDiagramHeader"), gWidth/2 + margin.left, headerHeight*(2/3));
    addLabels(d3.select("#myDiagramLabels"));

    tooltip = d3.select("#myDiagram").append("div")
        .attr("class", "tooltip-sequence")
        .style("opacity", 0);
    renderData();
}

/**
 * Extract all the unique function names from the data
 */
function extractLabels() {
    let labels = new Set();
    for (let i = 0; i < data.length; i++) {
        let label = data[i].function_name$;
        if (label === undefined) { continue; }
        labels.add(label);
    }
    funcLabels = Array.from(labels);
}

/**
 * Set the width and height of the graph containers according to the data.
 * Updates gWidth and gHeight.
 */
function resizeGraphContainers() {
    gWidth = xPad * funcLabels.length;
    gHeight = labelBotPad + (yScale * maxTime);

    // append a svg object to the div. Initialize with default height and width
    let divRoot = d3.select("#myDiagram")
        .style("width", gWidth + margin.left + margin.right)
        .style("height", headerHeight + labelTopPad + labelHeight + gHeight + margin.bottom);
    svg = d3.select("#myDiagramSvg")
        .attr("width", divRoot.style('width'))
        .attr("height", gHeight + margin.bottom);
}

/**
 * Render data according to the current yScale.
 * Coordinates start at the bottom of the function labels.
 */
function renderData() {
    let timeLen = maxTime;
    let timeStartPos = labelBotPad;
    let timeEndPos = timeStartPos + yScale*timeLen;
    addTimelines(timeEndPos);
    addTimeAxis(timeStartPos, timeEndPos, timeLen);
    addData(timeStartPos);
}

/**
 * Append header to header svg
 * @param headerSvg
 * @param xLoc - x-Pos of text center, in relation to svg
 * @param yLoc - y-Pos of text bottom, in relation to svg
 */
function addHeader(headerSvg, xLoc, yLoc) {
    headerSvg.attr('width', d3.select("#myDiagram").style('width'))
        .attr('height', headerHeight);
    let gHead = headerSvg.append('g');
    gHead.append('text')
        .attr('x', xLoc)
        .attr('y', yLoc)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('Sequence diagram');
}

/**
 * Add timeline labels
 */
function addLabels(labelSvg) {
    labelSvg.attr('width', d3.select("#myDiagram").style('width'))
        .attr('height', labelTopPad + labelHeight + 1); // +1 to account for rect bolded border

    // Create a label for each function
    for (let i = 0; i < funcLabels.length; i++) {
        let labelData = parseRecursion(funcLabels[i]);
        let labelName = labelData[0];
        let fnNum = labelName.match(/_\d+/g) !== null ? labelName.split("_").at(-1) : "";
        let labelText = labelName.length > 10 ? labelName.substring(0, Math.max(9 - fnNum.length,0)) + "..." + fnNum : labelName;
        let labelMouseoverText = labelName;
        if (labelData.length > 1) {
            labelMouseoverText += " (Recursion depth: " + labelData[1] + ")";
        }

        let x = xPad + i * xPad;

        labelSvg.append("g") // label rectangle
            .attr("transform", "translate(" + x + "," + labelTopPad + ")")
            .attr("class", "class-rect")
            .append("rect")
            .attr("x", -labelWidth / 2)
            .attr("y", 0)
            .attr("width", labelWidth)
            .attr("height", labelHeight);

        labelSvg.append("g") //label text. Truncate if too long.
            .attr("transform", "translate(" + x + "," + labelTopPad + ")")
            .append("text")
            .attr("class", "class-label")
            .attr("text-anchor", "middle")
            .text(labelText)
            .attr("dy", "16px")
            .on('mouseover', function (d, i) { // show the full name and recursion data on mouseover
                tooltip.transition().duration(500).style("opacity", 1);
                tooltip.html(labelMouseoverText)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 15) + "px");
                highlightNodes([labelName], true);
            })
            .on('mouseout', function (d, i) {
                tooltip.transition().duration('50').style("opacity", 0)
                highlightNodes([labelName], false);
            });
    }
}

/**
 * Add vertical lines for the timelines
 * @param timeEndPos
 */
function addTimelines(timeEndPos) {
    // Create a timeline for each function
    for (let i = 0; i < funcLabels.length; i++) {
        let x = xPad + i * xPad;
        svg.append("line")
            .style("stroke", "#888")
            .attr("x1", x)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", timeEndPos);
    }
}

/**
 * Add a time axis.
 * @param timeStartPos
 * @param timeEndPos
 * @param timeLen
 */
function addTimeAxis(timeStartPos, timeEndPos, timeLen) {
    let yscale = d3.scaleLinear()
        .domain([0, timeLen])
        .range([timeStartPos, timeEndPos]);

    let y_axis = d3.axisLeft(yscale)
        .ticks(Math.max(yScale/defaultYScale *4, 1)); // increase when scale is finer

    svg.append("g")
        .attr("transform", "translate("+ (margin.left + axisLPad) +", "+ 0 +")")
        .call(y_axis)
}

/**
 * Populate the diagram with data.
 * @param timeStartPos
 */
function addData(timeStartPos) {
    let hLen = 5; // length of the horizontal cap on top of the line

    for (let i = 0; i < data.length; i++) {
        let labelInd = funcLabels.indexOf(data[i].function_name$);
        let x = xPad + labelInd * xPad;
        let startPos = timeStartPos + yScale * data[i].time_start$;

        let tooltipText = "start: " + data[i].time_start$ + " end: " + data[i].time_end$;

        let ctrlContextNodes = [parseRecursion(data[i].function_name$)[0]] // the current function call's control context
        for (let c = 0; c < data[i].control$.length; c++) {
            ctrlContextNodes.push(data[i].control$[c][0]);
        }

        let dataContainer = svg.append("g");

        let lineElement = dataContainer.append("g")
            .append("line") // vertical line
            .attr("class", "data-line")
            .style("stroke", defaultColours[currColour])
            .style("stroke-width", 3)
            .attr("x1", x)
            .attr("y1", startPos)
            .attr("x2", x)
            .attr("y2", timeStartPos + (data[i].time_end$* yScale));

        // add mouseover behaviour to a wider invisible line overtop of the actual line
        dataContainer.append("g")
            .append("line")
            .style("stroke", defaultColours[currColour])
            .style("stroke-width", 20)
            .style("opacity", 0)
            .attr("x1", x)
            .attr("y1", startPos)
            .attr("x2", x)
            .attr("y2", timeStartPos + (data[i].time_end$* yScale))
            .on('mouseover', function (d, i) {
                // fade out slightly when moused over
                lineElement.transition().duration('50').attr('opacity', '.6')
                // make tooltip visible
                tooltip.transition().duration(50).style("opacity", 1);
                tooltip.html(tooltipText)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 15) + "px");
                highlightNodes(ctrlContextNodes, true);
            })
            .on('mouseout', function (d, i) {
                lineElement.transition().duration('50').attr('opacity', '1')
                tooltip.transition().duration('50').style("opacity", 0)
                highlightNodes(ctrlContextNodes, false);
            });

        dataContainer.append("line") // horizontal line cap
            .style("stroke", defaultColours[currColour])
            .style("stroke-width", 3)
            .attr("x1", x - hLen)
            .attr("y1", startPos)
            .attr("x2", x + hLen)
            .attr("y2", startPos);

        // draw a line to the parent function if there is one
        if (data[i].parent_name$) { // not null, undefined, or empty string
            let pInd = funcLabels.indexOf(data[i].parent_name$);
            let xDotStart = (pInd > labelInd) ? x + hLen : x - hLen;
            dataContainer.append("line") // long dotted line to the parent function
                .style("stroke", defaultColours[currColour])
                .style("stroke-width", 1)
                .attr("x1", xDotStart)
                .attr("y1", startPos)
                .attr("x2", xPad + pInd * xPad)
                .attr("y2", startPos);

            dataContainer.append("circle") // small dot to indicate the line endpoint on the parent
                .style("fill", "black")
                .attr("r", 2)
                .attr("cx", xPad + pInd * xPad)
                .attr("cy", startPos);
        }
    }
}

/**
 * Add functionality to zoom in on the time axis by scrolling.
 */
function initZoom() {
    let zoom = d3.zoom()
        .scaleExtent([0.1, 5]) // minimum and maximum scale factor
        .on('zoom', handleZoom);

    d3.select("#myDiagramSvg")
        .call(zoom);
}

/**
 * Event handler for zooming
 */
function handleZoom() {
    let transform = d3.event.transform;
    // apply transform to the chart axis and re-render
    yScale = defaultYScale * transform.k;
    d3.select("#myDiagramSvg").selectAll("*").remove();
    resizeGraphContainers();
    renderData();
}

/**
 * Given a function name, separate out the recursion depth data.
 * Return [<cleaned fn name>, <recursive depth>]
 * E.g. 2_recursiveFn_123 -> ["recursiveFn_123", "2"]
 * @param fnName - string
 */
function parseRecursion(fnName) {
    let res = [];
    if (fnName.match(/\d+_.+/g)) {
        res.push(fnName.slice(fnName.indexOf('_') + 1));
        res.push(fnName.substring(0, fnName.indexOf('_')));
    } else {
        res.push(fnName);
    }
    return res;
}