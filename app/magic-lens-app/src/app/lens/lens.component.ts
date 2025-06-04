import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  ElementRef,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GptService } from '../services/gpt.service';
import { KeyWordExplanationService } from '../services/key-word-explanation.service';
import { isPlatformBrowser } from '@angular/common';
import * as d3 from 'd3';
import { FormsModule } from '@angular/forms';
import * as marked from 'marked';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { FormatService } from '../services/format.service';
import * as bootstrap from 'bootstrap';
import { SummaryHelper } from '../utils/summary-helper';
import { CalculationService } from '../services/calculation.service';
import { DrawingHelpService } from '../services/drawing-help.service';
import { AdaptViewElementsService } from '../services/adapt-view-elements.service';
import { AuthorChartService } from '../services/author-chart.service';
import { Chart } from 'chart.js/auto';
import { InfoBoardData } from '../utils/infoBoard';

@Component({
  selector: 'app-lens',
  standalone: true,
  imports: [HttpClientModule, FormsModule, CommonModule],
  templateUrl: './lens.component.html',
  styleUrl: './lens.component.css',
})
export class LensComponent implements OnInit {
  @ViewChild('chartCanvas')
  chartCanvas!: ElementRef;
  chart!: Chart<'bar', number[], string>;
  // set the dimensions and margins of the graph
  private width: number;
  private height: number;
  private container: any;
  private allDataPoints: any;
  private xScale;
  private yScale;
  private baseCurrentLensRadius = 20;
  private lensStrokeWidth = 3;

  drag: any;
  zoom: any;
  innerPlotSvg: any;
  currentLens: any;
  centerLensButton: any;
  currentZoomTransform = d3.zoomIdentity;
  dataPointsInsideCircle: any;
  oldSummaryWithKeywordsMarked: any;
  baseDataPointsSize = 3;
  currentDataPointsSize=this.baseDataPointsSize;
  baseDataPointsStrokeWidth:number = this.baseDataPointsSize/3.5;
  dataPointsStrokeWidth = this.baseDataPointsStrokeWidth;
  clusterLabelTextSize = 20;
  clusters: unknown[] | undefined;
  subclusters: unknown[] | undefined;
  clustersColored: Set<string>;
  showStaticClusterLabels: boolean = false;
  showInfoBoard: boolean = true;
  outerPlotSvg: any;
  clusterDataPointsMap!: Map<string, Set<number>>;
  clusterPointsAlreadyExplored: { [key: string]: Set<number> } = {};
  oldAiResponse: any;
  oldLensPosition = { x: 0, y: 0, r: 0 };
  oldDragEndPosition=[0,0];
  adjustedStrokeWidth: number = 2;
  responseFieldSelection: any;
  oldLens: any;
  gptService: GptService;
  keywordsExplanationService: KeyWordExplanationService;
  summaryWithKeywordsMarked: { text: string; isKeyword: boolean }[] = [];
  customPromptWithKeywordsMarked: { text: string; isKeyword: boolean }[] = [];
  keywords: Set<string>; // Your array of keywords
  keywordsExplanationDict: { [key: string]: string } = {};
  keywordsExplanationUiMessage: any;
  clusterLabelNumberDict: { [clusterLabel: string]: number } = {};
  clusterIdColorDict: { [clusterId: number]: string } = {};
  showQuickSummary: boolean = true;
  detailedAiResponsePromise: Promise<string>;
  customAiResponseWithKeywordsHtml: SafeHtml = '';
  quickAiResponseWithKeywordsHtml: SafeHtml = '';
  quickOldAiResponseWithKeywordsHtml: SafeHtml = '';
  singleArticleSummary: any;
  singleArticleFull: any;
  currentArticleSelected: any;
  baseMarkerCircleStrokeWidth: number = this.baseDataPointsStrokeWidth * 2;
  markerCircleStrokeWidth = this.baseMarkerCircleStrokeWidth;
  baseMarkerCircleRadius = this.baseDataPointsSize * 1.75;
  markerCircleRadius = this.baseMarkerCircleRadius;
  markerCircleForAuthorsRadius: number = this.baseMarkerCircleRadius * 1.5;
  markerCircleArticleIds: Set<number>;
  currentKeywordInExplanationField: string | undefined;
  oldLensDrawn: boolean = false;
  initialKeywordCombinationTags: string[] = [];
  keywordCombinationTags: string[] = [];
  selectedTags: string[] = [];
  customInputKeyword: string = '';
  priorShortResponseHtmlWithLinks: string = '';
  SummaryHelper: SummaryHelper;
  calculationService: CalculationService;
  drawHelpService: DrawingHelpService;
  adaptViewElementsService: AdaptViewElementsService;
  textToPointLinkDataPoints: any;
  authorTitleHtml: string = '';
  authorDescriptionHtml:SafeHtml="";
  showDynamicInfoBoard: boolean = true;
  currentAuthorSelected: string="";
  authorFilePath: string='../assets/datasets/authors_descriptions.json';
  minLensRadius: number = 1.25;
  maxLensRadius: number = 40;
  formattedFullArticleHtml: SafeHtml = '<h5>Could not load full article</h5>';
  safeArticleUrl:SafeUrl="could not load url";
  currentInfoBoardData: InfoBoardData;
  oldInfoBoardData: InfoBoardData;
  newInfoBoardData: InfoBoardData;
  infoBoardBarPadding:number=80;
  /**
   *  make sure to only run on the browser platform and not on node itsself because document is not defined
   *  ssr is disabled for that purpose aswell in the angular.json development section
   */
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    private formatService: FormatService,
    private renderer: Renderer2,
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    private piechartService: AuthorChartService
  ) {
    this.piechartService = new AuthorChartService();
    this.drawHelpService = new DrawingHelpService(sanitizer);
    this.formatService = new FormatService();
    this.gptService = new GptService(httpClient, formatService);
    this.keywordsExplanationService = new KeyWordExplanationService(
      httpClient,
      formatService
    );
    this.calculationService = new CalculationService();
    this.SummaryHelper = new SummaryHelper(httpClient);
    this.adaptViewElementsService = new AdaptViewElementsService();

    this.currentInfoBoardData= new InfoBoardData(0,0,0,0,0,0,0,[],0,[],0);
    this.oldInfoBoardData= new InfoBoardData(0,0,0,0,0,0,0,[],0,[],0);
    this.newInfoBoardData = new InfoBoardData(0,0,0,0,0,0,0,[],0,[],0);

    this.clustersColored = new Set<string>();
    this.detailedAiResponsePromise = new Promise((resolve, reject) => {
      // This promise needs initally to be unresolved
    });

    this.keywordsExplanationUiMessage = 'No explanations yet';
    this.keywords = new Set<string>();
    this.markerCircleArticleIds = new Set<number>();
    this.quickAiResponseWithKeywordsHtml = 'Short summary here';
    d3.select('#quick-ai-response-with-keywords').style('display', 'none');

    const windowHeight=window.innerHeight
    this.width = windowHeight*0.8;
    this.height = windowHeight*0.8;

    // global x and y axis of the graph
    this.xScale = d3.scaleLinear().domain([0, 12]).range([0, this.width]);
    this.yScale = d3.scaleLinear().domain([0, 12]).range([this.height, 0]);

    this.container = d3.select('#my_dataviz');
    this.responseFieldSelection = d3.select('#response_field');
  }
  

  createChart(articleIdsOfAuthor: number[]) {
    let clusterLabelMap = new Map<string, number>();
    let articlesOfAuthors: any[] = [];
    this.allDataPoints.forEach((point: any) => {
      if (articleIdsOfAuthor.includes(point.id)) {
        articlesOfAuthors.push(point);
      }
    });
    for (let article of articlesOfAuthors) {
      if (clusterLabelMap.has(article.label)) {
        if (clusterLabelMap.get(article.label) != null) {
          clusterLabelMap.set(
            article.label,
            (clusterLabelMap.get(article.label) || 0) + 1
          );
        }
      } else {
        clusterLabelMap.set(article.label, 1);
      }
    }
    let chartCanvas = document.getElementById(
      'chartCanvas'
    ) as HTMLCanvasElement;
    if (chartCanvas == null) return;
    let clusterLabels: string[] = Array.from(clusterLabelMap.keys());
    let clusterNumbers: number[] = Array.from(clusterLabelMap.values());
    this.chart = this.piechartService.createBarChart(
      chartCanvas,
      clusterLabels,
      clusterNumbers,
      this.clusterIdColorDict,
      this.clusterLabelNumberDict
    ) as Chart<'bar', number[], string>;
  }

  ngOnInit(): void {
    this.formatService.loadData(this.authorFilePath);
    if (isPlatformBrowser(this.platformId)) {
      this.addOptionsButtons();
      this.defineDragBehavior();
      this.createDataVizSvg();
      this.createTooltip();
      this.insertData();
      this.createLens();
      this.addZoomBehavior();
      this.addHoverListeners();
      this.addDoubleClickListenerToSvg();
      this.sliderInitialization();
    }
  }
  addDoubleClickListenerToSvg() {
    const self = this;
    this.outerPlotSvg.on('dblclick', function(event:any) {
      const [x, y] = d3.pointer(event, self.innerPlotSvg.node()); // Get the current mouse position
      // Check if the double-click happened on a point
      let domainX= self.xScale.invert(x);
      let domainY= self.yScale.invert(y);
      let invertedDataPointSize=self.xScale.invert(self.currentDataPointsSize);
      let dataPointsInClickRange =
      self.calculationService.checkDataPointsInCircle(
        domainX,
        domainY,
        invertedDataPointSize,
        self.allDataPoints
      );
      let closestPoint=dataPointsInClickRange[0];
      dataPointsInClickRange.forEach((d: any) => {
        if(self.calculationService.getSquareDistance(domainX,domainY,closestPoint.x,closestPoint.y)>self.calculationService.getSquareDistance(domainX,domainY,d.x,d.y)){
          closestPoint=d;
        }
      });
      if(closestPoint!=null){
        self.pointInfo(closestPoint.id);   
      }
    });
  }
  
  resetToStandardKeywordCombinationTags() {
    let extraElements: string[] = [];
    const initialKeywordCombinationTagsSet = new Set(
      this.initialKeywordCombinationTags
    );
    this.keywordCombinationTags.forEach((keyword: string) => {
      if (!initialKeywordCombinationTagsSet.has(keyword)) {
        extraElements.push(keyword);
      }
    });

    this.keywordCombinationTags = [...this.initialKeywordCombinationTags];
  }
  addKeyword(): void {
    if (
      this.customInputKeyword.trim() &&
      !this.keywordCombinationTags.includes(this.customInputKeyword)
    ) {
      this.keywordCombinationTags.push(this.customInputKeyword.trim());
      this.customInputKeyword = '';
    }
  }
  openBroadSearchModal(): void {
    const modalElement = document.getElementById('broadSearchModal');
    if (modalElement == null) return;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
  openLensOptionsModal(): void {
    const modalElement = document.getElementById('lensOptionsModal');
    if (modalElement == null) return;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  removeChip(tag: string, isModal: boolean = false): void {
    if (isModal) {
      this.keywordCombinationTags = this.keywordCombinationTags.filter(
        (t) => t !== tag
      );
    } else {
      this.selectedTags = this.selectedTags.filter((t) => t !== tag);
    }
  }

  customSearchForKeywords(): void {
    // Show the selected tags on the page
    this.selectedTags = [...this.keywordCombinationTags];
    // Remove the marking when hovering over keywords briefly for usability
    // when a user wants to move their mouse towards the graph and accidently moves over a keyword in the text
    this.disableKeywordHoverListenersBriefly();
    this.markArticlesWithPartWords(this.selectedTags);
    

  }
  defineDragBehavior() {
    const self = this;
    this.drag = d3
      .drag()
      .on('drag', function (event) {
        self.dragged(event, this);
      })
      .on('end', this.dragEnded);
  }

  retrieveClusters() {
    // Get a list of unique clusters and subclusters
    this.clusters = [...new Set(this.allDataPoints.map((d: any) => d.cluster))];
    this.subclusters = [
      ...new Set(this.allDataPoints.map((d: any) => d.subcluster)),
    ];
  }
  removePreviousMovingInfoBoard() {
    this.outerPlotSvg.select('#new-info-board').remove();
  }

  createMovingInfoBoard(pictureX: number, pictureY: number) {
    this.removePreviousMovingInfoBoard();
    this.drawHelpService.removeClusterHighlighting(this.innerPlotSvg);
    if (this.dataPointsInsideCircle==null|| this.dataPointsInsideCircle.length == 0) {
      return;
    }
    // Filter out noise points and count points per cluster
    let clusterCounts: { [key: string]: number } = {};
    let clustersInLens = new Set<string>();

    this.dataPointsInsideCircle.forEach(
      (d: {
        id: number;
        cluster: number;
        subcluster: number;
        label: string;
      }) => {
        if (!(d.cluster === -1 || d.subcluster === -1)) {
          if (!clusterCounts[d.label]) {
            clusterCounts[d.label] = 0;
          }
          clusterCounts[d.label]++;
          clustersInLens.add(d.label);
          this.clusterPointsAlreadyExplored[d.label].add(d.id);
        }
      }
    );

    for (let clusterName of clustersInLens.values()) {
      // Add Cluster Labels if all points in the cluster have been explored and not already labeled
      if (
        this.clusterDataPointsMap.get(clusterName)?.size ==
        this.clusterPointsAlreadyExplored[clusterName].size
      ) {
        let cleanedClusterNameString = clusterName
          .replace(/\s+/g, '')
          .replace(/[()]/g, '')
          .toLowerCase();
        if (
          this.innerPlotSvg
            .select('#clusterLabel' + cleanedClusterNameString)
            .node() == null
        ) {
          this.drawHelpService.addClusterLabel(
            clusterName,
            this.xScale,
            this.yScale,
            this.showStaticClusterLabels,
            this.innerPlotSvg
          );
        }
      }
      this.clustersColored.add(clusterName);
      this.drawHelpService.clusterHighlight(
        clusterName,
        this.dataPointsStrokeWidth,
        this.innerPlotSvg
      );
    }

    if (!this.showInfoBoard) {
      return;
    }

    this.infoBoardDataProcessing(clusterCounts, pictureX, pictureY);
  }

  infoBoardDataProcessing(
    clusterCounts: { [key: string]: number },
    lensX: number,
    lensY: number
  ) {
    // Dont want to have the noise points as part of the cluster, so use this instead of this.dataPointsInsideCircle.length
    let totalDataPoints = Object.values(clusterCounts).reduce(
      (acc, count) => acc + count,
      0
    );

    // Calculate the ratios and sort by descending ratio
    let clusterRatios = Object.keys(clusterCounts)
      .map((label) => ({
        label: label,
        ratio: clusterCounts[label] / totalDataPoints,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    // Calculate the width and height of the background rect
    let maxLabelLength = Math.max(...clusterRatios.map((d) => d.label.length));

    let fontSize = 20;
    let spaceBetweenLabels = fontSize * 1.8;
    let rectXPadding = 15;
    let rectWidth = maxLabelLength * fontSize * 0.58 + rectXPadding; // Approximate width of the longest label
    let rectHeight = clusterRatios.length * spaceBetweenLabels + 15; // Total height based on number of labels

    // Calculate the width of the bars
    let barMaxWidth = 50; // Set a fixed max width for the bars

    // Option 1: static infoBoard
    let rectX = 5;
    let rectY = 15;
    //Option 2: dynamic infoBoard moving with the lens
    if (this.showDynamicInfoBoard) {
      // Calculate the position of the rect based on the lens position and the zoom factor
      let radius:number=Number(this.currentLens.attr("r"));
      // For visualization purposes place the info board not exactly at the edge of the square of radius
      let partOfRadius=radius*0.8;
      let radiusAccountedForZoom=partOfRadius*this.currentZoomTransform.k;
      rectX = lensX+radiusAccountedForZoom;
      rectY = lensY-radiusAccountedForZoom-rectHeight;
    }

    this.saveInfoBoardData(rectX,rectY,rectXPadding,rectWidth,rectHeight,barMaxWidth,fontSize,clusterRatios,totalDataPoints,clusterCounts,spaceBetweenLabels);

    this.drawHelpService.drawInfoBoardForLens(
      rectX,
      rectY,
      rectXPadding,
      rectWidth,
      rectHeight,
      barMaxWidth,
      fontSize,
      clusterRatios,
      totalDataPoints,
      clusterCounts,
      spaceBetweenLabels,
      this.infoBoardBarPadding,
      this.outerPlotSvg,
      false
    );
  }
  saveInfoBoardData(rectX:number,rectY:number,rectXPadding: number, rectWidth: number, rectHeight: number, barMaxWidth: number, fontSize: number, clusterRatios: { label: string; ratio: number; }[], totalDataPoints: number, clusterCounts: { [key: string]: number; }, spaceBetweenLabels: number) {
    this.currentInfoBoardData= new InfoBoardData(rectX,rectY,rectXPadding,rectWidth,rectHeight,barMaxWidth,fontSize,clusterRatios,totalDataPoints,clusterCounts,spaceBetweenLabels);
  }

  // Define the dragged
  dragged = (event: any, circle: any) => {
    if (this.showQuickSummary) {
      if (this.oldLensDrawn) {
        this.removeOldLens();
      }
      this.drawOldLens();
    }
    if (
      this.outerPlotSvg.select('#quick-summary-rect').node() != null &&
      this.outerPlotSvg.select('#quick-summary-text').node() != null
    ) {
      this.outerPlotSvg.select('#quick-summary-rect').remove();
      this.outerPlotSvg.select('#quick-summary-text').remove();
    }
    // Get pointer position relative to the margins of the graph
    var [newX, newY] = d3.pointer(event, this.innerPlotSvg.node()); 
    this.currentLens.attr('cx', newX).attr('cy', newY);
    this.updateLensAccess(this.xScale.invert(newX), this.yScale.invert(newY));
  };

  dragEnded = (event: any) => {
    let currentLensPosition=[Number(this.currentLens.attr('cx')),Number(this.currentLens.attr('cy'))];
    let squareDistance= this.calculationService.getSquareDistance(this.oldDragEndPosition[0],this.oldDragEndPosition[1],currentLensPosition[0],currentLensPosition[1]);
    // Only update the quick summary if the lens has moved
    // this prevents the quick summary from being created if an article is double clicked
    if(squareDistance>0){
      if (this.showQuickSummary) {
        this.oldInfoBoardData=this.newInfoBoardData;
        this.newInfoBoardData=this.currentInfoBoardData;
        this.removeOldLensInfoBoard();
        this.createQuickSummary();
      }
    }
    // Update the old drag end position
    this.oldDragEndPosition=[currentLensPosition[0],currentLensPosition[1]];
  };
  async createQuickSummary() {
    if (
      this.dataPointsInsideCircle == null ||
      this.dataPointsInsideCircle.length == 0 ||
      this.dataPointsInsideCircle.length > 150
    ) {
      return;
    }
    document.getElementById("showDetailedSummaryButton")?.removeAttribute('disabled');
    d3.select('#quick-ai-response-with-keywords').style('display', 'none');
    d3.select('#custom-ai-response-with-keywords-container').style('display', 'none');
    this.smoothScroll("singleArticleInfoContainerShort");
    this.adaptViewElementsService.showQuickSpinner();
    // load the old summary until the summary with bolded keywords is applied later in construct
    this.quickOldAiResponseWithKeywordsHtml =
      this.quickAiResponseWithKeywordsHtml;
    if (this.oldLensPosition.x != 0) {
      this.displayQuickOldSummary();
    }
    this.oldLensPosition = this.SummaryHelper.saveCirclePosition(
      this.currentLens.attr('cx'),
      this.currentLens.attr('cy'),
      this.currentLens.attr('r')
    );

    try {
      const quickTask = (document.getElementById('quick-task-select') as HTMLSelectElement).value;
      let quickAiResponse="No quick response could be generated";
      if(quickTask==="one-fact"){
        this.detailedAiResponsePromise = this.SummaryHelper.importantFactLogic(
          this.dataPointsInsideCircle
        );
        quickAiResponse = await this.SummaryHelper.importantFactLogicShort(
          this.dataPointsInsideCircle
        );
      }
      else if(quickTask==="summary"){
        this.detailedAiResponsePromise = this.SummaryHelper.summaryLogic(
          this.dataPointsInsideCircle
        );
        quickAiResponse = await this.SummaryHelper.summaryLogicShort(
          this.dataPointsInsideCircle
        );
      }
      else{
        console.log("Quick task could not be found")
        return;
      }
      
      this.quickAiResponseWithKeywordsHtml = this.sanitizer.bypassSecurityTrustHtml("<p>"+quickAiResponse+"</p>");
      this.adaptViewElementsService.hideQuickSpinner();
      d3.select('#quick-ai-response-with-keywords').style('display', 'block');

      await this.summaryWithKeywords(quickAiResponse);
    } catch (error) {
      console.error('Error in createQuickSummary:', error);
      this.adaptViewElementsService.hideQuickSpinner();
    }
  }

  async summaryWithKeywords(aiResponse: string) {
    let currentKeywords = await this.gptService.getKeywords(aiResponse);
    currentKeywords=this.formatService.applyBlackList(currentKeywords);
    let currentKeywordsSet = new Set(currentKeywords);
    for (let keyword of this.keywords) {
      for (let currentKeyword of currentKeywordsSet) {
        if (this.formatService.isSimilar(currentKeyword, keyword)) {
          currentKeywordsSet.delete(currentKeyword);
        }
      }
    }
    this.constructShortResponseHtmlWithKeywords(aiResponse, currentKeywords);
    currentKeywords.forEach((keyword: string) => {
      this.keywords.add(keyword);
    });
    let newPartKeywordsExplanationDict: { [key: string]: Promise<string> } =
      this.SummaryHelper.explainKeywordsWithPreviousMessage(
        aiResponse,
        currentKeywordsSet
      );
    // Wait for all explanations to be generated
    const explanationPromises = Object.entries(newPartKeywordsExplanationDict).map(
      async ([keyword, explanationPromise]) => {
        try {
          const explanation = await explanationPromise;
          this.keywordsExplanationDict[keyword] = explanation;
        } catch (error) {
          console.error(`Error getting explanation for '${keyword}':`, error);
        }
      }
    );
    await Promise.all(explanationPromises);
    d3.select('#quick-ai-response-with-keywords').style('display', 'block');
  }

  async constructResponseHtmlWithKeywords(
    aiResponse: string,
    keywords: string[]
  ) {
    let htmlString: string = await marked.parse(aiResponse);
    let responseHtmlWithLinks =
      await this.keywordsExplanationService.markKeywordsInHtml(
        htmlString,
        keywords
      );
    return responseHtmlWithLinks;
  }
  async constructShortResponseHtmlWithKeywords(
    aiResponse: string,
    keywords: string[]
  ) {
    let htmlString: string = await marked.parse(aiResponse);
    let shortResponseHtmlWithLinks =
      await this.keywordsExplanationService.markKeywordsInHtml(
        htmlString,
        keywords
      );
    // show reoccuring keywords in old and new response as bold text
    // Load the html with bolded words for the keywords that are the same in both texts
    let shortResponseHtmlWithLinksAndBoldText =
      this.keywordsExplanationService.markReoccuringKeywordsInHtml(
        shortResponseHtmlWithLinks,
        this.priorShortResponseHtmlWithLinks
      );
    this.quickAiResponseWithKeywordsHtml =
      this.sanitizer.bypassSecurityTrustHtml(
        shortResponseHtmlWithLinksAndBoldText
      );
    let oldShortResponseHtmlWithLinksAndBoldText =
      this.keywordsExplanationService.markReoccuringKeywordsInHtml(
        this.priorShortResponseHtmlWithLinks,
        shortResponseHtmlWithLinks
      );
    this.quickOldAiResponseWithKeywordsHtml =
      this.sanitizer.bypassSecurityTrustHtml(
        oldShortResponseHtmlWithLinksAndBoldText
      );
    this.priorShortResponseHtmlWithLinks = shortResponseHtmlWithLinks;
  }

  removeKeywordMarkerCirclesButtonClick() {
    this.drawHelpService.removeKeywordMarkerCircles(this.innerPlotSvg);
  }
  markArticlesWithExactWordOnHover(keyword: string) {
    this.drawHelpService.removeKeywordMarkerCircles(this.innerPlotSvg);
    this.markerCircleArticleIds =
      this.SummaryHelper.searchAbstractsForExactKeyword(
        keyword,
        this.allDataPoints
      );
    for (let articleId of this.markerCircleArticleIds) {
      this.drawHelpService.markerCirclePointContainingKeyword(
        articleId,
        this.xScale,
        this.yScale,
        this.markerCircleRadius,
        this.markerCircleStrokeWidth,
        this.innerPlotSvg
      );
    }
  }
  markArticlesWithExactWord() {
    this.disableKeywordHoverListenersBriefly();
    if (this.currentKeywordInExplanationField == undefined) return;
    this.drawHelpService.removeKeywordMarkerCircles(this.innerPlotSvg);
    this.markerCircleArticleIds =
      this.SummaryHelper.searchAbstractsForExactKeyword(
        this.currentKeywordInExplanationField,
        this.allDataPoints
      );
    for (let articleId of this.markerCircleArticleIds) {
      this.drawHelpService.markerCirclePointContainingKeyword(
        articleId,
        this.xScale,
        this.yScale,
        this.markerCircleRadius,
        this.markerCircleStrokeWidth,
        this.innerPlotSvg
      );
    }
  }
  markArticlesWithPartWords(selectedPartKeywords: string[]) {
    if (this.currentKeywordInExplanationField == undefined) return;
    this.drawHelpService.removeKeywordMarkerCircles(this.innerPlotSvg);
    this.markerCircleArticleIds =
      this.SummaryHelper.searchAbstractsForPartKeyword(
        selectedPartKeywords,
        this.allDataPoints
      );
    for (let articleId of this.markerCircleArticleIds) {
      this.drawHelpService.markerCirclePointContainingKeyword(
        articleId,
        this.xScale,
        this.yScale,
        this.markerCircleRadius,
        this.markerCircleStrokeWidth,
        this.innerPlotSvg
      );
    }
  }

  ngAfterViewInit() {
    this.cdr.detectChanges(); 
  }

  ngOnChanges() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Attach hover event handlers
    const abstractElements = this.el.nativeElement.querySelectorAll(
      'a[data-inside-lens-abstract-number]'
    );

    abstractElements.forEach((element: HTMLElement) => {
      const abstractInsideLensNumber = Number(
        element.getAttribute('data-inside-lens-abstract-number')
      );
      this.renderer.listen(element, 'mouseenter', (event) =>
        this.onHoverAbstractInsideLens(abstractInsideLensNumber)
      );
      this.renderer.listen(element, 'mouseleave', (event) =>
        this.onLeaveAbstractInsideLens(abstractInsideLensNumber)
      );
    });
    const keywordElements =
      this.el.nativeElement.querySelectorAll('a[data-keyword]');

    keywordElements.forEach((element: HTMLElement) => {
      let keyword = element.getAttribute('data-keyword');
      if (keyword != null) {
        this.renderer.listen(element, 'mouseenter', (event) =>
          this.onHoverKeyword(keyword)
        );
        this.renderer.listen(element, 'mouseleave', (event) =>
          this.onLeaveKeyword()
        );
      }
    });

    
  }
  onLeaveKeyword() {
    this.drawHelpService.removeKeywordMarkerCircles(this.innerPlotSvg);
  }
  onHoverKeyword(keyword: string) {
    this.markArticlesWithExactWordOnHover(keyword);
  }
  disableKeywordHoverListenersBriefly() {
    const keywordElements =
      this.el.nativeElement.querySelectorAll('a[data-keyword]');
    keywordElements.forEach((element: HTMLElement) => {
      element.style.pointerEvents = 'none';
    });

    let timeoutInMilliseconds=3000
    setTimeout(() => {
      keywordElements.forEach((element: HTMLElement) => {
        element.style.pointerEvents = 'auto';
      });
    }, timeoutInMilliseconds);
  }

  onHoverAbstractInsideLens(abstractInsideLensNumber: number): void {
    this.convertContextArticleNumberToArticleId(abstractInsideLensNumber);
  }

  onLeaveAbstractInsideLens(abstractInsideLensNumber: number): void {
    let articleId = this.convertContextArticleNumberToArticleId(
      abstractInsideLensNumber
    );
  }

  async writeAuthorShortDescription(author:string){
    let filePath = this.authorFilePath;
    let description:string = await this.formatService.getDescriptionShortByAuthor(filePath,author);
    let co_authorsString= await this.formatService.getFormattedCoAuthors(filePath,author);
    this.authorDescriptionHtml=this.sanitizer.bypassSecurityTrustHtml(await marked.parse(description)+`<br> ${co_authorsString}`);
  }
  async writeAuthorLongDescription(author:string){
    let filePath =this.authorFilePath;
    let description:string = await this.formatService.getDescriptionLongByAuthor(filePath,author);
    let co_authorsString= await this.formatService.getFormattedCoAuthors(filePath,author);
    this.authorDescriptionHtml=this.sanitizer.bypassSecurityTrustHtml(await marked.parse(description)+`<br> ${co_authorsString}`);
  }
  onAuthorNameClick(event: MouseEvent) {
    event.preventDefault();
    let target = event.target as HTMLElement;
    if (target.tagName === 'A' && target.hasAttribute('data-author')) {
      let author = target.getAttribute('data-author');
      if (author == null) return;
      this.currentAuthorSelected = author;
      this.removeAuthorDescriptionContainer();
      let articleIdsOfAuthor = this.calculationService.getArticlesOfAuthor(
        author,
        this.allDataPoints
      );
      if (articleIdsOfAuthor.length == 0) return;
      let articleGrammarString = 'articles';
      if (articleIdsOfAuthor.length == 1) {
        articleGrammarString = 'article';
      }
      this.authorTitleHtml = `<p><b>${author}</b> contributed to <b>${articleIdsOfAuthor.length}</b> ${articleGrammarString}</p>`;
      this.createChart(articleIdsOfAuthor);
      this.writeAuthorShortDescription(author);
      d3.select('#author-description-container').style('display', 'block');
      this.removeLongAuthorDescriptionButtonClick();
      this.smoothScroll("author-description-container");

      articleIdsOfAuthor.forEach((id: number) => {
        this.drawHelpService.markerCirclePointOfAuthors(
          id,
          this.xScale,
          this.yScale,
          this.markerCircleForAuthorsRadius,
          this.markerCircleStrokeWidth,
          this.innerPlotSvg
        );
      });
    }
  }
  async onWordClick(event: MouseEvent) {
    event.preventDefault();
    let target = event.target as HTMLElement;
    // If the clicked element is not an 'A' tag, check if its parent is
    // used for the case of bold text inside tag
    if (target.tagName !== 'A') {
      const parent = target.closest('a');
      if (parent) {
        target = parent as HTMLElement;
      }
    }
    if (target.tagName === 'A' && target.hasAttribute('data-keyword')) {
      const keyword = target.getAttribute('data-keyword');
      if (keyword == null) return;
      // Reset of prior selected tags
      this.selectedTags = [];
      this.drawHelpService.removeKeywordMarkerCircles(this.innerPlotSvg);
      this.createKeywordTags(keyword);
      this.currentKeywordInExplanationField = keyword;
      const capitalizedKeyword =
        keyword.charAt(0).toUpperCase() + keyword.slice(1);
      d3.select('#keyword-explanation-field-container').style(
        'display',
        'block'
      );
      let explanation = this.keywordsExplanationDict[keyword];
      this.keywordsExplanationUiMessage =
        '<b>' + capitalizedKeyword + ':</b><br>' + marked.parse(explanation);
      this.smoothScroll("keyword-explanation-field-container");
  
    }
    if (
      target.tagName === 'A' &&
      target.hasAttribute('data-inside-lens-abstract-number')
    ) {
      if (target.getAttribute('data-inside-lens-abstract-number') == null)
        return;
      const abstractInsideLensNumber: number = Number(
        target.getAttribute('data-inside-lens-abstract-number')
      );
      let articleId = this.convertContextArticleNumberToArticleId(
        abstractInsideLensNumber
      );
      this.pointInfo(articleId);
    }
  }
  // Retrieve the article id from points in the lens
  // id starts at 0 but chat gpt starts counting at 1
  convertContextArticleNumberToArticleId(abstractInsideLensNumber: number) {
    return this.textToPointLinkDataPoints[abstractInsideLensNumber - 1].id;
  }

  createKeywordTags(keyword: string) {
    let keywordCombinations = [];
    // transform keyword string to array of words
    let keywordArray = keyword.split(' ');
    for (let i = 0; i < keywordArray.length; i++) {
      let basicWord = keywordArray[i].toString();
      keywordCombinations.push(basicWord);
      let restWord = '';
      for (let j = i + 1; j < keywordArray.length; j++) {
        restWord = restWord + ' ' + keywordArray[j].toString();
        let newWord = basicWord + restWord;
        keywordCombinations.push(newWord);
      }
    }
    this.keywordCombinationTags = keywordCombinations;
    // we dont want a reference to the same array so the initial keywords dont change
    this.initialKeywordCombinationTags = [...keywordCombinations];
  }
  displayQuickOldSummary() {
    let quickOldSummaryField = d3.select('#quick-old-summary-field');
    quickOldSummaryField.style('display', 'block');
    this.oldSummaryWithKeywordsMarked = this.summaryWithKeywordsMarked;
  }
  removeOldLens() {
    if (this.innerPlotSvg.select('#oldLens').node() != null) {
      this.innerPlotSvg.select('#oldLens').remove();
    }
  }
  drawOldLens() {
    this.oldLens = this.innerPlotSvg
      .append('circle')
      .attr('id', 'oldLens')
      .attr('data-typeOfCircle', 'lens')
      .attr('cx', this.oldLensPosition.x)
      .attr('cy', this.oldLensPosition.y)
      .attr('r', this.oldLensPosition.r)
      .style('fill', 'transparent')
      .style('pointer-events', 'none')
      .style('stroke', '#686868')
      .style('stroke-width', this.adjustedStrokeWidth)
      .style('transition', 'stroke-width 0.3s')
    this.oldLensDrawn = true;
    
  }

  addHoverListeners(): void {
    // Select the summary fields
    const quickSummaryField = d3.select('#quick-summary-field');
    const quickOldSummaryField = d3.select('#quick-old-summary-field');

    // Add hover event listeners to quick-summary-field
    quickSummaryField.on('mouseover', () =>
      this.highlightLens(this.currentLens)
    );
    quickSummaryField.on('mouseout', () =>
      this.unhighlightLens(this.currentLens)
    );

    // Add hover event listeners to quick-old-summary-field
    quickOldSummaryField.on('mouseover', () => {
      this.highlightLens(this.oldLens);
      if(this.showInfoBoard){
        if(this.showDynamicInfoBoard){
          this.hideNewInfoBoard();
        }
        this.drawOldLensInfoBoard();
      }
    });
    quickOldSummaryField.on('mouseout', () =>{
      this.unhighlightLens(this.oldLens);
      this.removeOldLensInfoBoard();
      this.showNewInfoBoard();
    });
  }
  removeOldLensInfoBoard(){
    this.outerPlotSvg.select('#old-info-board').remove();
  }
  showNewInfoBoard(){
    this.outerPlotSvg.select('#new-info-board').attr("visibility","visible");
  }
  hideNewInfoBoard(){
    this.outerPlotSvg.select('#new-info-board').attr("visibility","hidden");
  }
  drawNewLensInfoBoardOnSwitchToggle(){
    this.outerPlotSvg.select('#old-info-board')?.remove();
    let rectX=this.width-this.oldInfoBoardData.rectWidth-this.oldInfoBoardData.barMaxWidth-this.infoBoardBarPadding;
    let rectY=this.height-this.oldInfoBoardData.rectHeight;
    let oldLensPoint=this.currentZoomTransform.apply([Number(this.oldLens.attr("cx")),Number(this.oldLens.attr("cy"))]);
    if (this.showDynamicInfoBoard) {
      // Calculate the position of the rect based on the lens position and the zoom factor
      let oldLensRadius:number=Number(this.oldLens.attr("r"));
      // For visualization purposes place the info board not exactly at the edge of the square of radius
      let partOfRadius=oldLensRadius*0.8;
      let radiusAccountedForZoom=partOfRadius*this.currentZoomTransform.k;
      rectX=oldLensPoint[0]+radiusAccountedForZoom;
      rectY=oldLensPoint[1]-radiusAccountedForZoom-this.oldInfoBoardData.rectHeight;
      }
    this.drawHelpService.drawInfoBoardForLens(
      rectX,
      rectY,
      this.oldInfoBoardData.rectXPadding,
      this.oldInfoBoardData.rectWidth,
      this.oldInfoBoardData.rectHeight,
      this.oldInfoBoardData.barMaxWidth,
      this.oldInfoBoardData.fontSize,
      this.oldInfoBoardData.clusterRatios,
      this.oldInfoBoardData.totalDataPoints,
      this.oldInfoBoardData.clusterCounts,
      this.oldInfoBoardData.spaceBetweenLabels,
      this.infoBoardBarPadding,
      this.outerPlotSvg,
      true
    );
  }
  drawOldLensInfoBoard(){
    this.outerPlotSvg.select('#old-info-board')?.remove();
    let rectX=this.width-this.oldInfoBoardData.rectWidth-this.oldInfoBoardData.barMaxWidth-this.infoBoardBarPadding;
    let rectY=this.height-this.oldInfoBoardData.rectHeight;
    let oldLensPoint=this.currentZoomTransform.apply([Number(this.oldLens.attr("cx")),Number(this.oldLens.attr("cy"))]);
    if (this.showDynamicInfoBoard) {
      // Calculate the position of the rect based on the lens position and the zoom factor
      let oldLensRadius:number=Number(this.oldLens.attr("r"));
      // For visualization purposes place the info board nearer to the circle and not exactly at the edge of the square of radius
      let partOfRadius=oldLensRadius*0.8;
      let radiusAccountedForZoom=partOfRadius*this.currentZoomTransform.k;
      rectX=oldLensPoint[0]+radiusAccountedForZoom;
      rectY=oldLensPoint[1]-radiusAccountedForZoom-this.oldInfoBoardData.rectHeight;
      }
    this.drawHelpService.drawInfoBoardForLens(
      rectX,
      rectY,
      this.oldInfoBoardData.rectXPadding,
      this.oldInfoBoardData.rectWidth,
      this.oldInfoBoardData.rectHeight,
      this.oldInfoBoardData.barMaxWidth,
      this.oldInfoBoardData.fontSize,
      this.oldInfoBoardData.clusterRatios,
      this.oldInfoBoardData.totalDataPoints,
      this.oldInfoBoardData.clusterCounts,
      this.oldInfoBoardData.spaceBetweenLabels,
      this.infoBoardBarPadding,
      this.outerPlotSvg,
      true
    );
  }

  highlightLens(
    circle: d3.Selection<SVGCircleElement, unknown, null, undefined>
  ): void {
    if (circle.node() != null) {
      circle.style('stroke-width', this.adjustedStrokeWidth * 2);
      circle.style('fill', 'rgba(255, 255, 0, 0.2)');
    }
  }

  unhighlightLens(
    circle: d3.Selection<SVGCircleElement, unknown, null, undefined>
  ): void {
    if (circle.node() != null) {
      circle.style('stroke-width', this.adjustedStrokeWidth);
      circle.style('fill', 'transparent');
    }
  }

  updateLensSize() {
    const slider = document.getElementById('lensSizeSlider') as HTMLInputElement;
    const sliderValue = slider.valueAsNumber;

    const updatedCircleRadius = this.calculationService.sliderValueToRadius(sliderValue,this.minLensRadius,this.maxLensRadius);
  
    // Update the lens size based on the slider value
    this.setCircleSize(updatedCircleRadius);
    this.updateLensAccess(
      this.xScale.invert(this.currentLens.attr('cx')),
      this.yScale.invert(this.currentLens.attr('cy'))
    );
  }
  


  /*
   * Color data points based on cluster and subcluster
   * Mark the ones colored
   * Only iterate over dataPoints if there some points are not explored yet
   */
  colorDataPoints() {
    this.dataPointsInsideCircle.forEach(
      (d: { cluster: any; subcluster?: any }) => {
        if (!(d.cluster === -1 || d.subcluster === -1)) {
          this.innerPlotSvg
            .selectAll('.cluster' + d.cluster)
            .filter((point: any) => this.dataPointsInsideCircle.includes(point))
            .attr('data-colored', true)
            .style('fill', this.clusterIdColorDict[d.cluster]);
        }
      }
    );
  }
  updateLensAccess(domainX: number, domainY: number) {
    let domainRadius = this.xScale.invert(this.currentLens.attr('r'));
    this.dataPointsInsideCircle =
      this.calculationService.checkDataPointsInCircle(
        domainX,
        domainY,
        domainRadius,
        this.allDataPoints
      );
    let lensPoint = [
      Number(this.currentLens.attr('cx')),
      Number(this.currentLens.attr('cy')),
    ];
    let shiftedLensPoint = this.currentZoomTransform.apply([lensPoint[0], lensPoint[1]]);
    let shiftedX = shiftedLensPoint[0];
    let shiftedY = shiftedLensPoint[1];
    this.createMovingInfoBoard(shiftedX, shiftedY);
    this.colorDataPoints();
  }
  zoomed(event: any) {
    // Get the transform object from the event
    const transform = event.transform;
    this.currentZoomTransform = transform;

    this.innerPlotSvg.attr('transform', transform);

    // For dynamic info board
    let lensPoint = [
      Number(this.currentLens.attr('cx')),
      Number(this.currentLens.attr('cy')),
    ];
    let shiftedLensPoint = transform.apply(lensPoint);
    let shiftedX = shiftedLensPoint[0];
    let shiftedY = shiftedLensPoint[1];
    this.createMovingInfoBoard(shiftedX, shiftedY);

    this.updateGraphElementsSizes();
  }

  updateGraphElementsSizes() {
    this.setDataPointsStrokeWidth();
    this.setDataPointsSize();
    this.setLensStrokeWidth();
    this.setMarkerCircleSizes();
  }
  setDataPointsStrokeWidth(){
    this.dataPointsStrokeWidth =
    this.baseDataPointsStrokeWidth / this.currentZoomTransform.k;
  }
  setMarkerCircleSizes() {
    this.markerCircleStrokeWidth =
      this.baseMarkerCircleStrokeWidth / this.currentZoomTransform.k;
    this.markerCircleRadius =
      this.baseMarkerCircleRadius / this.currentZoomTransform.k;
    this.markerCircleForAuthorsRadius = this.markerCircleRadius * 1.5;
    this.innerPlotSvg
      .selectAll(`[data-typeOfCircle='markerKeywordAbstracts']`)
      .style('stroke-width', this.markerCircleStrokeWidth);
    this.innerPlotSvg
      .selectAll(`[data-typeOfCircle='markerKeywordAbstracts']`)
      .style('r', this.markerCircleRadius);
    this.innerPlotSvg
      .selectAll(`[data-typeOfCircle='markerAuthors']`)
      .style('stroke-width', this.markerCircleStrokeWidth);
    this.innerPlotSvg
      .selectAll(`[data-typeOfCircle='markerAuthors']`)
      .style('r', this.markerCircleForAuthorsRadius);
  }

  centerLens() {
    // Calculate the center based on the current zoom transform
    const centerX =
      (-this.currentZoomTransform.x + this.width / 2) /
      this.currentZoomTransform.k;
    const centerY =
      (-this.currentZoomTransform.y + this.height / 2) /
      this.currentZoomTransform.k;
    this.currentLens.attr('cx', centerX).attr('cy', centerY);

    let adjustedSize =this.baseCurrentLensRadius / this.currentZoomTransform.k;
    if(adjustedSize>this.maxLensRadius){
      adjustedSize=this.maxLensRadius;
    }
    else if(adjustedSize<this.minLensRadius){
      adjustedSize=this.minLensRadius;
    }
    this.setCircleSize(adjustedSize);
    const slider = document.getElementById('lensSizeSlider') as HTMLInputElement;
    const newSliderValue = this.calculationService.radiusToSliderValue(adjustedSize,this.minLensRadius,this.maxLensRadius);
    slider.value = newSliderValue.toString();
    this.updateLensAccess(
      this.xScale.invert(centerX),
      this.yScale.invert(centerY)
    );
  }

  createTooltip() {
    this.singleArticleSummary = d3.select('#singleArticleSummary');
    this.singleArticleFull = d3.select('#singleArticleFull');
  }

  insertData() {
    let spectral_cluster ='../assets/datasets/full-data_spectral-clustering_translated_metadata.json';
    this.clusterDataPointsMap = new Map<string, Set<number>>(); // Map to hold cluster datapoints

    d3.json(spectral_cluster).then((data: any) => {
      // Extract data points and cluster information
      this.allDataPoints = data.map(
        (
          d: {
            id: number;
            x: number;
            y: number;
            text: string;
            cluster: number;
            subcluster?: number;
            label: string;
            summary: string;
            title: string;
            authors: string[];
            link: string;
          },
          index: number
        ) => {
          this.clusterLabelNumberDict[d.label] = d.cluster;
          // Add datapoint id to the corresponding cluster set in the map
          if (!this.clusterDataPointsMap.has(d.label)) {
            this.clusterPointsAlreadyExplored[d.label] = new Set<number>();
            this.clusterDataPointsMap.set(d.label, new Set<number>());
          }
          this.clusterDataPointsMap.get(d.label)?.add(d.id);
          this.drawHelpService.setClusterDataPointsMap(
            this.clusterDataPointsMap
          );

          return {
            id: d.id,
            x: d.x,
            y: d.y,
            abstractText: d.text,
            cluster: d.cluster,
            subcluster: d.subcluster,
            label: d.label,
            abstractSummary: d.summary,
            authors: d.authors,
            title: d.title,
            link: d.link,
          };
        }
      );
      this.retrieveClusters();

      this.drawHelpService.setAllDataPoints(this.allDataPoints);
      this.drawHelpService.setClusterLabelNumberDict(
        this.clusterLabelNumberDict
      );
      this.clusterIdColorDict =
        this.drawHelpService.defineColorScalesAndColorDict(this.allDataPoints);
      // Add dots
      this.innerPlotSvg
        .selectAll('circle')
        .data(this.allDataPoints)
        .enter()
        .append('circle')
        .attr('data-typeOfCircle', 'dataPoint')
        .attr('data-pointId', (d: { id: number }) => d.id)
        .attr('data-clickedArticle', false)
        .attr('data-colored', false)
        .attr('class', (d: { cluster: any }) => 'cluster' + d.cluster)
        .attr('cx', (d: { x: any }) => this.xScale(d.x))
        .attr('cy', (d: { y: any }) => this.yScale(d.y))
        .attr('r', this.baseDataPointsSize)
        .attr('stroke-width', this.dataPointsStrokeWidth)
        .style('fill', 'black')
        .style('stroke', 'none')
        .style('pointer-events', 'none')
        .on("dblclick", (event: any, d: any) => this.pointInfo(d.id));
    });
  }

  pointInfo(id: number) {
    this.currentArticleSelected = this.allDataPoints[id];
    d3.select('#singleArticleInfoContainerShort').style('display', 'block');
    this.drawHelpService.highlightSingleDataPoint(
      id,
      this.dataPointsStrokeWidth,
      this.innerPlotSvg
    );
  }

  createLens() {
    this.currentLens = this.innerPlotSvg
      .append('circle')
      .attr('id', 'currentLens')
      .attr('data-typeOfCircle', 'lens')
      .attr('cx', this.xScale(1)) // initial x position
      .attr('cy', this.yScale(1)) // initial y position
      .attr('r', this.baseCurrentLensRadius)
      .style('fill', 'transparent')
      .style('stroke', 'green') // set stroke color
      .style('stroke-width', this.lensStrokeWidth + 'px') // set stroke width
      .style('transition', 'stroke-width 0.3s')
      .style('cursor', 'pointer')
      .call(this.drag);
  }

  setCircleSize(circleSize: number) {
    this.currentLens.attr('r', circleSize);
  }
  createDataVizSvg() {
    this.outerPlotSvg = d3
      .select('#my_dataviz')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.innerPlotSvg = this.outerPlotSvg
      .append('g');

  }
  addOptionsButtons() {
    this.centerLensButton = d3.select('#centerLens');
  }

  addZoomBehavior() {
    const self = this;
    this.zoom = d3
      .zoom()
      .scaleExtent([0.5, 30]) // Set the minimum and maximum zoom scale
      .translateExtent([[this.width*(-0.2),this.height*(-0.3)],[this.width*1.75,this.height*1.5]])
      .on('zoom', function (event) {
        self.zoomed(event);
      })

    this.outerPlotSvg.call(this.zoom)
    .on("dblclick.zoom", null); // Apply zoom behavior to the container without double click zoom
  }

  /*
   * Set the size of the stroke width based on the zoom level
   */
  setLensStrokeWidth() {
    this.adjustedStrokeWidth =
      this.lensStrokeWidth / this.currentZoomTransform.k;
    this.currentLens.style('stroke-width', this.adjustedStrokeWidth + 'px');
    if (this.oldLens != null) {
      this.oldLens.style('stroke-width', this.adjustedStrokeWidth + 'px');
    }
  }
  /*
   * Set the size of the data points based on the zoom level
   */
  setDataPointsSize() {
    this.currentDataPointsSize = this.baseDataPointsSize / this.currentZoomTransform.k;
      this.innerPlotSvg
        .selectAll("circle[data-typeOfCircle='dataPoint']")
        .attr('r', this.currentDataPointsSize)
        .attr('stroke-width',this.dataPointsStrokeWidth);
  }
  async promptChatGPT() {
    if(this.dataPointsInsideCircle==undefined || this.dataPointsInsideCircle.length==0){
      return
    }
    this.adaptViewElementsService.showDetailedAiResponseSpinner();
    let aiResponse = await this.gptService.customPrompt(
      this.dataPointsInsideCircle
    );
    this.customAiResponseWithKeywordsHtml =
      this.sanitizer.bypassSecurityTrustHtml(
        this.textToPointLinking(marked.parse(aiResponse))
      );
    let customAiResponseWithKeywordsHtmlRaw =
      this.customPromptWithKeywords(aiResponse);
    customAiResponseWithKeywordsHtmlRaw.then((response) => {
      this.customAiResponseWithKeywordsHtml =
        this.sanitizer.bypassSecurityTrustHtml(
          this.textToPointLinking(response)
        );
      this.cdr.detectChanges(); // Detect changes after updating content
      this.attachEventListeners(); // Re-attach event listeners to the new content
    });
    
    this.adaptViewElementsService.hideDetailedAiResponseSpinner();
  }

  textToPointLinking(htmlText: any) {
    var linkedHtml = '<p>Abstract linking fail</p>';
    if (htmlText == '') return linkedHtml;
    linkedHtml = htmlText;
    this.textToPointLinkDataPoints = this.dataPointsInsideCircle;

    // Pattern to match abstract citation formats
    const abstractPattern =
      /(\S*\s*)(\(?\s*)(?:Abstract|Abstracts?)\s*(\d+(?:\s*[,&]\s*\d+)*(?:\s*(?:and|&)\s*\d+)?)\s*(\)?)(\S*)/gi;


    // 'match' parameter is important to keep for replacing matches in regex
    return linkedHtml.replace(
      abstractPattern,
      (
        match,
        precedingChar,
        openBracket,
        numbers,
        closeBracket,
        trailingChars
      ) => {
        const isInParentheses =
          openBracket.trim() === '(' || closeBracket.trim() === ')';
        const isStartOfSentence =
          !precedingChar.trim() || precedingChar.trim().endsWith('.');

        // Process each number to get the corresponding author citation
        const processedParts = numbers
          .split(/\s*[,&]\s*|\s+and\s+/)
          .map((part: string) => {
            const num = part.trim();
            if (/^\d+$/.test(num)) {
              const articleId = this.convertContextArticleNumberToArticleId(
                Number(num)
              );
              const authors = this.allDataPoints[articleId].authors;
              if (authors && authors.length > 0) {
                const firstAuthor = authors[0].split(' ').pop(); // Get the last name of the first author
                return `<a href="#singleArticleInfoContainerShort" data-inside-lens-abstract-number="${num}">${firstAuthor} et al.</a>`;
              }
              return num; // If no authors found, return the original number
            }
            return part;
          });

        // Join the processed parts
        let result = processedParts.join(', ');
        // Add parentheses if the original was in parentheses
        if (isInParentheses) {
          result = `(${result})`;
        } else {
          result = isStartOfSentence
            ? `${result}'s article`
            : ` ${result}'s article`;
        }
        // Check if the next character is a letter
        const nextCharIsLetter = /^[a-zA-Z]/.test(trailingChars);
        // Add space only if the next character is a letter
        if (nextCharIsLetter) {
          result += ' ';
        }
        // Append any trailing characters that followed the abstract numbers without spaces
        if (trailingChars) {
          result += trailingChars;
        }
        return precedingChar + result;
      }
    );
  }

  async customPromptWithKeywords(aiResponse: string) {
    let currentKeywords = await this.gptService.getKeywords(aiResponse);
    currentKeywords = this.formatService.applyBlackList(currentKeywords);
    let currentKeywordsSet = new Set(currentKeywords);
    for(let keyword of this.keywords){
      for(let currentKeyword of currentKeywords){
        if(this.formatService.isSimilar(currentKeyword,keyword)){
          currentKeywordsSet.delete(keyword);
        }
      }
    }
    let customAiResponseWithKeywordsHtmlRaw =
      await this.constructResponseHtmlWithKeywords(aiResponse, currentKeywords);
    currentKeywords.forEach((keyword: string) => {
      this.keywords.add(keyword);
    });
    let newPartKeywordsExplanationDict: { [key: string]: Promise<string> } =
      this.SummaryHelper.explainKeywordsWithPreviousMessage(
        aiResponse,
        currentKeywordsSet
      );
    // Wait for all explanations to be generated
    const explanationPromises = Object.entries(newPartKeywordsExplanationDict).map(
      async ([keyword, explanationPromise]) => {
        try {
          const explanation = await explanationPromise;
          this.keywordsExplanationDict[keyword] = explanation;
        } catch (error) {
          console.error(`Error getting explanation for '${keyword}':`, error);
        }
      }
    );
    await Promise.all(explanationPromises);

    d3.select('#custom-ai-response-with-keywords-container').style('display', 'block');
    return customAiResponseWithKeywordsHtmlRaw;
  }
  toggleQuickSummary() {
    this.showQuickSummary = !this.showQuickSummary;
    if(this.showQuickSummary){
      document.getElementById("quick-task-select")?.removeAttribute('disabled');
    }
    else{
      d3.select('#quick-summary-field').style('display', 'none');
      d3.select('#quick-old-summary-field').style('display', 'none');
      document.getElementById("quick-task-select")?.setAttribute('disabled','true'); 
      this.removeOldLens();     
    }
  }
  toggleInfoBoardButtonClick() {
    // Toggle the visibility of the info board
    this.showInfoBoard = !this.showInfoBoard;
    let infoBoard = this.outerPlotSvg.select('#new-info-board');
    if (this.showInfoBoard) {
      // If no info board exists draw a new one
      if (infoBoard.node() == null) {
        let lensPoint = [
          Number(this.currentLens.attr('cx')),
          Number(this.currentLens.attr('cy')),
        ];
        let shiftedLensPoint = this.currentZoomTransform.apply([lensPoint[0], lensPoint[1]]);
        let shiftedX = shiftedLensPoint[0];
        let shiftedY = shiftedLensPoint[1];
        this.createMovingInfoBoard(shiftedX, shiftedY);
      }
      else{
        infoBoard.style('visibility', 'visible');
      }
    } else {
      infoBoard.style('visibility', 'hidden');
    }
  }
  toggleStaticClusterLabelsButtonClick() {
    this.showStaticClusterLabels =
      this.adaptViewElementsService.toggleStaticClusterLabels(
        this.showStaticClusterLabels,
        this.outerPlotSvg
      );
  }
  toggleDynamicInfoBoard() {
    this.showDynamicInfoBoard = !this.showDynamicInfoBoard;
    let lensPoint = [
      Number(this.currentLens.attr('cx')),
      Number(this.currentLens.attr('cy')),
    ];
    let shiftedLensPoint = this.currentZoomTransform.apply([lensPoint[0], lensPoint[1]]);
    let shiftedX = shiftedLensPoint[0];
    let shiftedY = shiftedLensPoint[1];
    this.createMovingInfoBoard(shiftedX, shiftedY);
  }
  async showDetailedSummary() {
    document.getElementById("showDetailedSummaryButton")?.setAttribute('disabled','true');
    this.adaptViewElementsService.showDetailedAiResponseSpinner();
    await this.detailedAiResponsePromise.then((detailedAiResponse: string) => {
      this.customAiResponseWithKeywordsHtml =
        this.sanitizer.bypassSecurityTrustHtml(
          this.textToPointLinking(marked.parse(detailedAiResponse))
        );
      let customAiResponseWithKeywordsHtmlRaw =
        this.customPromptWithKeywords(detailedAiResponse);
      customAiResponseWithKeywordsHtmlRaw.then((response) => {
        this.customAiResponseWithKeywordsHtml =
          this.sanitizer.bypassSecurityTrustHtml(
            this.textToPointLinking(response)
          );
        this.cdr.detectChanges(); // Detect changes after updating content
        this.attachEventListeners(); // Re-attach event listeners to the new content
      });
      this.adaptViewElementsService.hideDetailedAiResponseSpinner();
    });
  }
  sliderInitialization() {
    // Initialize the slider with the current lens size
    const slider = document.getElementById('lensSizeSlider') as HTMLInputElement;
    const initialSliderValue = this.calculationService.radiusToSliderValue(this.currentLens.attr('r'),this.minLensRadius,this.maxLensRadius);
    slider.value = initialSliderValue.toString();

    // Add event listener for mouse wheel scroll
    slider.addEventListener('wheel', (event) => this.handleWheelScroll(event));
    // Add event listener for slider input
    slider.addEventListener('input', () => this.updateLensSize());
  }
  handleWheelScroll(event: WheelEvent) {
    const slider = document.getElementById('lensSizeSlider') as HTMLInputElement;
    let sliderValue = slider.valueAsNumber;
  
    // Adjust the slider value based on the scroll direction
    if (event.deltaY < 0) {
      // Scrolling up
      sliderValue += slider.step ? parseFloat(slider.step) : 1;
    } else if (event.deltaY > 0) {
      // Scrolling down
      sliderValue -= slider.step ? parseFloat(slider.step) : 1;
    }
  
    // Ensure the value remains within the slider's min and max
    sliderValue = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), sliderValue));
  
    // Update the slider's value and trigger the input event to update the lens size
    slider.value = sliderValue.toString();
    this.updateLensSize(); // Trigger the same function as slider input change
  
    // Prevent the default scrolling behavior
    event.preventDefault();
  }
  showFullArticle(currentArticleSelected: any) {
    if (currentArticleSelected == null) {
      return
    }
    let authors = currentArticleSelected.authors.map((author: string) => {
      return `<a href="#author-description-container" data-author="${author}">${author}</a>`;
    }).join(', ');
    let title = currentArticleSelected.title;
    let abstractText = currentArticleSelected.abstractText;
    let clusterLabel= currentArticleSelected.label;
    let clusterColor=this.drawHelpService.getColorForLabel(clusterLabel);
    let formattedHtml = `<h6>${title}</h6><p>${authors}<br><strong style='color: ${clusterColor};'>${clusterLabel}</strong><br><br>${abstractText}</p>`;
    this.safeArticleUrl = this.sanitizer.bypassSecurityTrustUrl(currentArticleSelected.link);
    this.formattedFullArticleHtml= this.sanitizer.bypassSecurityTrustHtml(formattedHtml);
    d3.select("#singleArticleInfoContainerShort").style("display", "none");
    d3.select("#singleArticleInfoContainerFull").style("display", "block");
    this.smoothScroll("singleArticleInfoContainerFull");
  }
  showFullArticleButtonClick() {
    this.showFullArticle(this.currentArticleSelected);
  }
  showSummaryOfArticleButtonClick() {
    this.drawHelpService.showSummaryOfArticle();
  }
  showLongAuthorDescriptionButtonClick(){
    this.writeAuthorLongDescription(this.currentAuthorSelected);
    d3.select('#showLongAuthorDescriptionButton').style('display', 'none');
    d3.select('#removeLongAuthorDescriptionButton').style('display','block');
  }
  removeLongAuthorDescriptionButtonClick(){
    this.writeAuthorShortDescription(this.currentAuthorSelected);
    d3.select('#showLongAuthorDescriptionButton').style('display', 'block');
    d3.select('#removeLongAuthorDescriptionButton').style('display','none');
  }
  removeKeywordExplanationField() {
    this.drawHelpService.removeKeywordMarkerCircles(this.innerPlotSvg);
    d3.select('#keyword-explanation-field-container').style('display', 'none');
  }
  removeAuthorDescriptionContainer() {
    //Remove the chart
    if (this.chart != null) {
      this.chart.destroy();
    }
    this.drawHelpService.removeAuthorMarkerCircles(this.innerPlotSvg);
    d3.select('#author-description-container').style('display', 'none');
  }
  removeSingleArticleInfoContainer() {
    let selectedDataPoint= this.innerPlotSvg.selectAll(`[data-pointId="${this.currentArticleSelected.id}"]`);
    this.drawHelpService.unhighlightSingleDataPoint(selectedDataPoint);
    d3.select('#singleArticleInfoContainerShort').style('display', 'none');
    d3.select('#singleArticleInfoContainerFull').style('display', 'none');
  }
  removeCustomAiResponseContainer(){
    d3.select('#custom-ai-response-with-keywords-container').style('display', 'none');
    document.getElementById("showDetailedSummaryButton")?.removeAttribute('disabled');
  }
  onTaskSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    if((selectedValue != "summary")){
      document.getElementById('response-length')?.setAttribute('disabled', 'true');
    }
    else{
      document.getElementById('response-length')?.removeAttribute('disabled');
    }
  }
  smoothScroll(divId:string){
    // Scroll to the single article info container smoothly
    const element = document.getElementById(divId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
