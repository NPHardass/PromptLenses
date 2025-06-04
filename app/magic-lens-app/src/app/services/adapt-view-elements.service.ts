import { Injectable } from '@angular/core';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
/**
 * Service for adapting the visibility of elements in the view
 */
export class AdaptViewElementsService {

  constructor() { }
  
  toggleStaticClusterLabels(showStaticClusterLabels: boolean, outerPlotSvg: any) {
    // Toggle the visibility of the static cluster labels
    showStaticClusterLabels = !showStaticClusterLabels;
    let staticClusterLabels = outerPlotSvg.selectAll(
      '.staticClusterLabel'
    );
    if (showStaticClusterLabels) {
      staticClusterLabels.style('visibility', 'visible');
    } else {
      staticClusterLabels.style('visibility', 'hidden');
    }
    return showStaticClusterLabels;
  }

  showDetailedAiResponseSpinner() {
    d3.select('#custom-ai-response-with-keywords-container').style('display', 'none');
    d3.select('#detailedSpinner').style('display', 'block');
  }
  hideDetailedAiResponseSpinner() {
    d3.select('#custom-ai-response-with-keywords-container').style('display', 'block');
    d3.select('#detailedSpinner').style('display', 'none');
  }
  showQuickSpinner() {
    d3.select('#quick-summary-field').style('display', 'none');
    d3.select('#quickSpinner').style('display', 'block');
  }
  hideQuickSpinner() {
    d3.select('#quickSpinner').style('display', 'none');
    d3.select('#quick-summary-field').style('display', 'block');
  }
  showKeywordSpinner() {
    d3.select('#keywordSpinner').style('display', 'block');
  }
  hideKeywordSpinner() {
    d3.select('#keywordSpinner').style('display', 'none');
  }
  
  
}
