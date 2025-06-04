import { Injectable } from '@angular/core';
import { CalculationService } from './calculation.service';
import * as d3 from 'd3';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
@Injectable({
  providedIn: 'root'
})

/**
 * This service is responsible for drawing elements on the plot and highlighting including the infoBoard
 */
export class DrawingHelpService {
  clusterDataPointsMap: Map<string, Set<number>>=new Map<string, Set<number>>();
  clusterLabelNumberDict: { [clusterLabel: string]: number; }={};
  infoBoardGroup: any;
  calculationService = new CalculationService();
  allDataPoints: any[] = [];
  clusterIdColorDict: { [clusterId: number]: string; }={};
  constructor(private sanitizer: DomSanitizer) { }

  
  setClusterDataPointsMap(clusterDataPointsMap: Map<string, Set<number>>) {
    this.clusterDataPointsMap = clusterDataPointsMap;
  }
  setClusterLabelNumberDict(clusterLabelNumberDict: { [clusterLabel: string]: number; }) {
    this.clusterLabelNumberDict = clusterLabelNumberDict;
  }
  setAllDataPoints(allDataPoints: any[]) {
    this.allDataPoints = allDataPoints;
  }

  addClusterLabel(clusterName: string,x:any,y:any,showStaticClusterLabels:boolean, innerPlotSvg:any) {
    // Get all data points in the cluster
    let clusterDataPoints = this.allDataPoints.filter(
      (dataPoint: { label: string }) => dataPoint.label === clusterName
    );

    // Calculate the mean x and y coordinates
    let sumX = 0,
      sumY = 0;
    clusterDataPoints.forEach((dataPoint: { x: number; y: number }) => {
      sumX += dataPoint.x;
      sumY += dataPoint.y;
    });

    let centerX = x(sumX / clusterDataPoints.length);
    let centerY = y(sumY / clusterDataPoints.length);

    let cleanedClusterNameString = clusterName
      .replace(/\s+/g, '')
      .toLowerCase();

    // Add the label at the center
    [centerX,centerY]=this.manualLabelAdjustment(centerX, centerY, cleanedClusterNameString);
    
    innerPlotSvg
      .append('text')
      .attr('class', 'staticClusterLabel')
      .attr('id', 'clusterLabel' + cleanedClusterNameString)
      .attr('x', centerX)
      .attr('y', centerY)
      .text(clusterName)
      .style('font-size', '7px')
      .style('font-weight', 'bold')
      .style('fill', 'black')
      .style('pointer-events', 'none')
      .style('visibility', showStaticClusterLabels ? 'visible' : 'hidden');
  }

  manualLabelAdjustment(centerX: number, centerY: number, cleanedClusterNameString: string) {
    if(cleanedClusterNameString=="vascular"){
      centerY=centerY-5;
    }
    if(cleanedClusterNameString=="colonography"){
      centerX=centerX-20;
      centerY=centerY+8;
    }
    if(cleanedClusterNameString=="associations"){
      centerY=centerY-5;
    }
    if(cleanedClusterNameString=="sampling"){
      centerY=centerY-5;
    }
    if(cleanedClusterNameString=="emotionrecognition"){
      centerX=centerX-15;
    }
    if(cleanedClusterNameString=="datatransformation"){
      centerX=centerX-15;
      centerY=centerY+5;
    }
    if(cleanedClusterNameString=="augmentedreality"){
      centerX=centerX-5;
    }
    if(cleanedClusterNameString=="set-typeddata"){
      centerX=centerX-15;
    }
    if(cleanedClusterNameString=="cartography"){
      centerX=centerX-10;
    }
    if(cleanedClusterNameString=="topologicalanalysis"){
      centerX=centerX-5;
    }
    if(cleanedClusterNameString=="eye-tracking"){
      centerX=centerX-10;
    }
    if(cleanedClusterNameString=="time-series"){
      centerY=centerY-5;
    }
    if(cleanedClusterNameString=="vortices"){
      centerX=centerX-5;
    }
    if(cleanedClusterNameString=="biochemistry"){
      centerY=centerY+3;
    }
    if(cleanedClusterNameString=="rendering"){
      centerY=centerY+5;
      centerX=centerX-5;
    }
    if(cleanedClusterNameString=="parallelrendering"){
      centerX=centerX-15;
    }
    return [centerX,centerY];
  }

  removeKeywordMarkerCircles(innerPlotSvg:any) {
    innerPlotSvg.selectAll("circle[data-typeOfCircle='markerKeywordAbstracts']").remove();
  }
  removeAuthorMarkerCircles(innerPlotSvg:any) {
    innerPlotSvg.selectAll("circle[data-typeOfCircle='markerAuthors']").remove();
  }
  markerCirclePointContainingKeyword(id: number,xScale:any,yScale:any,markerCircleRadius:number,markerCircleStrokeWidth:number, innerPlotSvg:any) {
    let point = this.allDataPoints.find((d: any) => d.id == id);
    if (point) {
      let pointX = xScale(point.x);
      let pointY = yScale(point.y);
      let markerCircle = innerPlotSvg
        .append('circle')
        .attr('data-typeOfCircle', 'markerKeywordAbstracts');
      markerCircle.attr("cx", pointX);
      markerCircle.attr("cy", pointY);
      markerCircle.attr("r", markerCircleRadius);
      markerCircle.attr("fill", "none");
      markerCircle.attr("stroke", "red");
      markerCircle.attr("stroke-width", markerCircleStrokeWidth);
    }
  }
  markerCirclePointOfAuthors(id: number,xScale:any,yScale:any,markerCircleRadius:number,markerCircleStrokeWidth:number, innerPlotSvg:any) {
    let point = this.allDataPoints.find((d: any) => d.id == id);
    if (point) {
      let pointX = xScale(point.x);
      let pointY = yScale(point.y);
      let markerCircle = innerPlotSvg
        .append('circle')
        .attr('data-typeOfCircle', 'markerAuthors');
      markerCircle.attr("cx", pointX);
      markerCircle.attr("cy", pointY);
      markerCircle.attr("r", markerCircleRadius);
      markerCircle.attr("fill", "none");
      markerCircle.attr("stroke", "blue");
      markerCircle.attr("stroke-width", markerCircleStrokeWidth);
    }
  }

  clusterHighlight(cluster: string,dataPointsStrokeWidth:number,innerPlotSvg:any) {
    // Add outline to cluster points in the same color as the color of the cluster
    let clusterDataPoints = [
      ...(this.clusterDataPointsMap.get(cluster)?.values() || []),
    ];
    this.allDataPoints.forEach(
      (d: { id: number; cluster: any; subcluster: any; label: string }) => {
        if (clusterDataPoints.includes(d.id)) {
          innerPlotSvg
            .selectAll('.cluster' + d.cluster)
            .filter(`[data-clickedArticle="false"]`)
            .attr("data-highlightedCluster",true)
            .style(
              'stroke',
              this.clusterIdColorDict[d.cluster]
            )
            .style('stroke-width', dataPointsStrokeWidth);
            let clusters=innerPlotSvg.selectAll('.cluster' + d.cluster);
            let points=clusters.filter(`[data-clickedArticle="false"]`);
        }
      }
    );
    
  }
  removeClusterHighlighting(innerPlotSvg:any) {
    // Remove outline from all points
    innerPlotSvg
      .selectAll("circle[data-typeOfCircle='dataPoint']")
      .attr("data-highlightedCluster",false)
      .style('stroke', 'none');
  }

  unhighlightSingleDataPoint(oldHighlightedPoint: any) {
    oldHighlightedPoint.attr("data-clickedArticle", false);
    if (oldHighlightedPoint.attr("data-colored") == "false") {
      oldHighlightedPoint.style('fill', "black");
      oldHighlightedPoint.style('stroke', "none");
      return;
    }
    oldHighlightedPoint.style('stroke', "none");
    let oldHighlightedPointId = oldHighlightedPoint.attr("data-pointId");
    let clusterOfPoint = this.allDataPoints[oldHighlightedPointId].cluster;
    let oldColor=this.clusterIdColorDict[clusterOfPoint];
    oldHighlightedPoint.style('fill', oldColor);
    if(oldHighlightedPoint.attr("data-highlightedCluster")=="true"){
      oldHighlightedPoint.style('stroke', oldColor);
    }
  }

  highlightSingleDataPoint(id: number,dataPointsStrokeWidth:number, innerPlotSvg: any) {
    // If the point is already highlighted, unhighlight it and remove the info container
    let oldHighlightedPoint = innerPlotSvg.selectAll(`[data-clickedArticle="true"]`);
    if (!oldHighlightedPoint.empty()) {
      let oldHighlightedPointId = oldHighlightedPoint.attr("data-pointId");
      this.unhighlightSingleDataPoint(oldHighlightedPoint);
      if (oldHighlightedPointId == id) {
        d3.select("#singleArticleInfoContainerShort").style("display", "none");
        d3.select("#singleArticleInfoContainerFull").style("display", "none");
        return;
      }
    }
    let point = innerPlotSvg.selectAll(`[data-pointId="${id}"]`);
    point.attr("data-clickedArticle", true);
    point.style("fill", "#FFD700")
    point.style("stroke", "#FFD700")
    point.style("stroke-width", dataPointsStrokeWidth);
    this.writeSingleArticleInfoText(id);

    // Scroll to the single article info container
    let divId="singleArticleInfoContainerShort";
    const element = document.getElementById(divId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }

  }
  writeSingleArticleInfoText(id: number) {
    let articleAbstractSummary = this.allDataPoints[id].abstractSummary;
    let clusterLabel = this.allDataPoints[id].label;
    let title= this.allDataPoints[id].title;
    let authors = this.allDataPoints[id].authors.map((author: string) => {
      return `<a href="#author-description-container" data-author="${author}">${author}</a>`;
    }).join(', ');
    let clusterColor=this.getColorForLabel(clusterLabel);
    var message = `<h6>${title}</h6><p>${authors} <br><strong style='color: ${clusterColor};'>${clusterLabel}</strong><br><br>${articleAbstractSummary} </p>`;
    let singleArticleSummary = d3.select("#singleArticleSummary");
    singleArticleSummary.html(message)
    this.showSummaryOfArticle();
  }
  
  showSummaryOfArticle() {
    d3.select("#singleArticleInfoContainerShort").style("display", "block");
    d3.select("#singleArticleInfoContainerFull").style("display", "none");
  }

  defineColorScalesAndColorDict(allDataPoints: any[]) {
    // no blue shade, reserved for bar chart
    const customColors = [
      "#9467bd", // Purple
      "#8c564b", // Brown
      "#e377c2", // Pink
      "#7f7f7f", // Gray
      "#bcbd22", // Olive
      "#98df8a", // Light Green
      "#c5b0d5",  // Light Purple
      "#D2691E", // Chocolate
      "#ff9896", // Salmon
      "#800000", // Dark red
      "#ff7f0e", // Orange
      "#86AB89", // Cyan 
      //"#2f7b27", // Dark Green
      //"#20B2AA", // Light Sea Green
      //"#2ca02c", // Green
    ];


    // Initialize an empty dictionary for cluster colors
    let clusterIdColorDict: { [clusterId: number]: string } = {}
    // Calculate centroids for each cluster
    let clusterCentroids: any = {};
    let clusterPoints: any = {};

    for (let point of allDataPoints) {
      const clusterId = point.cluster;
      if (!clusterCentroids[clusterId]) {
        clusterCentroids[clusterId] = { x: 0, y: 0, count: 0 };
        clusterPoints[clusterId] = [];
      }
      clusterCentroids[clusterId].x += point.x;
      clusterCentroids[clusterId].y += point.y;
      clusterCentroids[clusterId].count += 1;
      clusterPoints[clusterId].push(point);
    }

    for (let clusterId in clusterCentroids) {
      clusterCentroids[clusterId].x /= clusterCentroids[clusterId].count;
      clusterCentroids[clusterId].y /= clusterCentroids[clusterId].count;
    }

    // Not fixed. Change based on need
    let threshold = 2.25

    // Assign colors ensuring no two adjacent clusters share the same color
    for (let clusterId in clusterCentroids) {
      let usedColors = [];
      let currentCentroid = clusterCentroids[clusterId];

      // Check adjacent clusters within a threshold distance
      for (let otherClusterId in clusterCentroids) {
        if (clusterId !== otherClusterId) {
          let otherCentroid = clusterCentroids[otherClusterId];
          if (this.calculationService.getSquareDistance(currentCentroid.x, currentCentroid.y, otherCentroid.x, otherCentroid.y) < (threshold ** 2)) {
            if (clusterIdColorDict[Number(otherClusterId)]) {
              usedColors.push(clusterIdColorDict[Number(otherClusterId)]);
            }
          }
        }
      }

      // Assign a color that is not used by adjacent clusters
      for (let color of customColors) {
        if (!usedColors.includes(color)) {
          clusterIdColorDict[Number(clusterId)] = color;
          break;
        }
      }
    }
    this.clusterIdColorDict = clusterIdColorDict;
    return clusterIdColorDict;
  }

  drawInfoBoardForLens(
    rectX: number,
    rectY: number,
    rectXPadding: number,
    rectWidth: number,
    rectHeight: number,
    barMaxWidth: number,
    fontSize: number,
    clusterRatios: { label: string; ratio: number }[],
    totalDataPoints: number,
    clusterCounts: { [key: string]: number },
    spaceBetweenLabels: number,
    barPadding:number,
    outerPlotSvg: any,
    oldLens:boolean
  ) {

    this.infoBoardGroup = outerPlotSvg
    .append('g')
    .attr('class', 'info-board');
    if(oldLens){
      this.infoBoardGroup.attr("id","old-info-board");
    }
    else{
      this.infoBoardGroup.attr("id","new-info-board");
    }
    this.drawRectangle(
      rectX,
      rectY,
      rectWidth,
      rectHeight,
      barMaxWidth,
      barPadding
    );
    this.drawTextBackground(rectX,rectY,fontSize);
    this.drawText(rectX, rectY, totalDataPoints, fontSize);
    this.drawLabelsAndBars(
      rectX,
      rectY,
      rectXPadding,
      rectWidth,
      fontSize,
      clusterRatios,
      barMaxWidth,
      clusterCounts,
      spaceBetweenLabels
    );
  }

  drawTextBackground(
    rectX: number,
    rectY: number,
    fontSize: number,
  ) {
    this.infoBoardGroup
      .append('rect')
      .attr('id', 'text-background')
      .attr('x', rectX)
      .attr('y', rectY - fontSize*0.8) // Position it slightly above the text
      .attr('width', fontSize*8 )
      .attr('height', fontSize*0.8) // Make it slightly taller than the text
      .style('fill', 'lightgrey')
      .style('opacity', 0.85);
  }

  drawRectangle(
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number,
    barMaxWidth: number,
    barPadding:number
  ) {
    this.infoBoardGroup
      .append('rect')
      .attr('id', 'cluster-label-rect')
      .attr('x', rectX) // Slight offset for padding
      .attr('y', rectY)
      .attr('width', rectWidth + barMaxWidth + barPadding) // Adjust width to include bars and percentages
      .attr('height', rectHeight) // Add some padding to the height
      .style('fill', 'lightgrey')
      .style('opacity', 0.85); // Adjust opacity if needed
  }

  drawText(
    rectX: number,
    rectY: number,
    totalDataPoints: number,
    fontSize: number,
  ) {
    this.infoBoardGroup
      .append('text')
      .attr('x', rectX)
      .attr('y', rectY)
      .text('Of ' + totalDataPoints + ' abstracts in the lens:')
      .style('font-size', fontSize * 0.6 + 'px')
      .style('font-weight', 'bold')
      .style('fill', 'black');
  }

  drawLabelsAndBars(
    rectX: number,
    rectY: number,
    rectXPadding: number,
    rectWidth: number,
    fontSize: number,
    clusterRatios: { label: string; ratio: number }[],
    barMaxWidth: number,
    clusterCounts: { [key: string]: number },
    spaceBetweenLabels: number
  ) {
    let marginForFirstLabel = fontSize * 1.2;
    for (let i = 0; i < clusterRatios.length; i++) {
      let yOffset = i * spaceBetweenLabels + marginForFirstLabel; // Proper space between labels
      let labelTextString = clusterRatios[i].label;
      let labelPercentageString =
        (clusterRatios[i].ratio * 100).toFixed(0) + '%';
      let labelRatio = clusterRatios[i].ratio;

      this.drawLabel(
        rectX,
        rectY,
        rectXPadding,
        yOffset,
        labelTextString,
        fontSize
      );
      this.drawBar(
        rectX,
        rectY,
        rectXPadding,
        rectWidth,
        yOffset,
        labelTextString,
        labelRatio,
        fontSize,
        barMaxWidth,
        clusterCounts,
        spaceBetweenLabels
      );
      this.drawPercentage(
        rectX,
        rectY,
        rectXPadding,
        rectWidth,
        yOffset,
        labelPercentageString,
        fontSize,
        labelRatio,
        barMaxWidth
      );
      this.drawClusterRatioText(
        rectX,
        rectY,
        rectXPadding,
        rectWidth,
        yOffset,
        labelTextString,
        fontSize,
        barMaxWidth,
        clusterCounts
      );
    }
  }

  drawLabel(
    rectX: number,
    rectY: number,
    rectXPadding: number,
    yOffset: number,
    labelTextString: string,
    fontSize: number,
  ) {
    // Define a method or logic to choose a color based on the label
    let circleColor = this.getColorForLabel(labelTextString); // Assuming this method exists and returns a color

    // Draw a circle before the label text
    this.infoBoardGroup
      .append('circle')
      .attr('cx', rectX + rectXPadding - 10) // Position the circle 10px to the left of the label text
      .attr('cy', rectY + yOffset - fontSize / 3) // Vertically center the circle with the label text
      .attr('r', fontSize / 4) // Radius of the circle, adjust as needed
      .style('fill', circleColor);

    // Draw the label text as before
    this.infoBoardGroup
      .append('text')
      .attr('x', rectX + rectXPadding)
      .attr('y', rectY + yOffset)
      .text(labelTextString)
      .style('font-size', fontSize + 'px')
      .style('fill', 'black');
  }

  getColorForLabel(labelTextString: string): string {
    let clusterNumber: number = this.clusterLabelNumberDict[labelTextString];
    let color = this.clusterIdColorDict[clusterNumber];
    return color;
  }

  drawBar(
    rectX: number,
    rectY: number,
    rectXPadding: number,
    rectWidth: number,
    yOffset: number,
    labelTextString: string,
    labelRatio: number,
    fontSize: number,
    barMaxWidth: number,
    clusterCounts: { [key: string]: number },
    spaceBetweenLabels: number,
  ) {
    let barWidth = labelRatio * barMaxWidth;
    let totalPointsInCluster =
      this.clusterDataPointsMap.get(labelTextString)?.size || 0;
    let saturationRatio: number = 0;
    if (clusterCounts[labelTextString] > 0) {
      saturationRatio = clusterCounts[labelTextString] / totalPointsInCluster;
    }
    let color = d3.interpolateBlues(saturationRatio);
    this.infoBoardGroup
      .append('rect')
      .attr('class', 'bar')
      .attr('id', labelTextString)
      .attr('x', rectX + rectXPadding + rectWidth) // Position to the right of the label
      .attr('y', rectY + yOffset - spaceBetweenLabels * 0.375)
      .attr('width', barWidth)
      .attr('height', fontSize * 0.7)
      .style('fill', color);
  }

  drawPercentage(
    rectX: number,
    rectY: number,
    rectXPadding: number,
    rectWidth: number,
    yOffset: number,
    labelPercentageString: string,
    fontSize: number,
    labelRatio: number,
    barMaxWidth: number
  ) {
    let barWidth = labelRatio * barMaxWidth;
    this.infoBoardGroup
      .append('text')
      .attr('x', rectX + rectXPadding + rectWidth + barWidth + 15) // Position to the right of the bar
      .attr('y', rectY + yOffset)
      .text(labelPercentageString)
      .style('font-size', fontSize + 'px')
      .style('fill', 'black');
  }

  drawClusterRatioText(
    rectX: number,
    rectY: number,
    rectXPadding: number,
    rectWidth: number,
    yOffset: number,
    labelTextString: string,
    fontSize: number,
    barMaxWidth: number,
    clusterCounts: { [key: string]: number }
  ) {
    let totalPointsInCluster =
      this.clusterDataPointsMap.get(labelTextString)?.size || 0;
    let clusterRatioText =
      clusterCounts[labelTextString] +
      ' of ' +
      totalPointsInCluster +
      ' abstracts are in the lens';
    this.infoBoardGroup
      .append('text')
      .attr('x', rectX + rectXPadding)
      .attr('y', rectY + yOffset + fontSize * 0.6)
      .text(clusterRatioText)
      .style('font-size', fontSize / 2 + 'px')
      .style('fill', 'black');
  }
}
