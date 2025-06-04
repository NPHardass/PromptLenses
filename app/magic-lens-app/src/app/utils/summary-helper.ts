import { FormatService } from '../services/format.service';
import { GptService } from '../services/gpt.service';
import { HttpClient } from '@angular/common/http';
import { KeyWordExplanationService } from '../services/key-word-explanation.service';

/**
 * Helper class for generating AI summaries and explanations
 */
export class SummaryHelper {

  formatService: FormatService;
  gptService: GptService;
  keywordsExplanationService: KeyWordExplanationService;
  allDataPoints: any[]=[];
  
  constructor(httpClient: HttpClient) {
    this.formatService = new FormatService();
    this.gptService = new GptService(httpClient, this.formatService);
    this.keywordsExplanationService = new KeyWordExplanationService(httpClient,this.formatService);
  }

  importantFactLogic(dataPointsInsideCircle:any[]){
    const abstracts = this.formatService.getAbstractStringWithContextNumbers(dataPointsInsideCircle);
    const role = (document.getElementById('role') as HTMLSelectElement).value;
    let selectedRole= this.gptService.getSelectedRole(role);
    let prompt_task = "\n### Task Description \nPlease perform the following task with the above abstracts\n\
              1. Identify and summarize the three most salient facts or discoveries for the visualization field from these abstracts.\n\
              2. If you refer to abstracts, do it ONLY in this form!: '(Abstract 1)' or '(Abstract 3,5,12)' and so on.";
    if(role!="basic"){
      prompt_task= prompt_task+"\n3. "+this.gptService.getSelectedRole(role);
    }
    let prompt = '### Abstracts\n' + abstracts + prompt_task;
    //let model="gpt-4o-2024-08-06";
    let model="gpt-4o-mini-2024-07-18";
    let aiResponse = this.gptService.sendGPTRequest(model, prompt, selectedRole);

    return aiResponse;
  }
  importantFactLogicShort(dataPointsInsideCircle:any[]){
    const abstracts = this.formatService.getAbstractString(dataPointsInsideCircle);
    const role = (document.getElementById('role') as HTMLSelectElement).value;
    let selectedRole= this.gptService.getSelectedRole(role);
    let prompt_task = "\n### Task Description \nPlease perform the following task with the above abstracts\n\
              Highlight the single most significant/interesting discovery or insight for the visualization field from all these abstracts in one SHORT sentence in total."
    if(role!="basic"){
      prompt_task= prompt_task+"\n "+this.gptService.getSelectedRole(role);
    }
    let prompt = '### Abstracts\n' + abstracts + prompt_task;
    let model="gpt-4o-mini-2024-07-18"; 
    let aiResponse = this.gptService.sendGPTRequest(model, prompt, selectedRole);

    return aiResponse;
  }
  summaryLogic(dataPointsInsideCircle:any[],responseLength=600){
    const abstracts = this.formatService.getAbstractStringWithContextNumbers(dataPointsInsideCircle);
    const role = (document.getElementById('role') as HTMLSelectElement).value;
    let selectedRole= this.gptService.getSelectedRole(role);
    let prompt_task = "\n### Task Description \nPlease perform the following tasks with the above abstracts\n\
              1. Summarize the main findings and themes across these abstracts in a concise form.\n\
              2. Please do not exceed "+ responseLength + " words.\n\
              3. If you refer to abstracts, do it ONLY in this form!: '(Abstract 1)' or '(Abstract 3,5,12)' and so on.";
    if(role!="basic"){
      prompt_task= prompt_task+"\n4. "+this.gptService.getSelectedRole(role);
    }
    let prompt = '### Abstracts\n' + abstracts + prompt_task;
    //let model="gpt-4o-2024-08-06";
    let model="gpt-4o-mini-2024-07-18";
    let aiResponse = this.gptService.sendGPTRequest(model,prompt, selectedRole);

    return aiResponse;
  }
  summaryLogicShort(dataPointsInsideCircle:any[]){
    const abstracts = this.formatService.getAbstractString(dataPointsInsideCircle);
    const role = (document.getElementById('role') as HTMLSelectElement).value;
    let selectedRole= this.gptService.getSelectedRole(role);
    let prompt_task =
      '\n### Task Description\n Summarize the main findings and themes across these abstracts in one SHORT sentence.';
    if(role!="basic"){
      prompt_task= prompt_task+this.gptService.getSelectedRole(role);
    }
    let prompt = '### Abstracts\n' + abstracts + prompt_task;
    let model="gpt-4o-mini-2024-07-18";
    let aiResponse = this.gptService.sendGPTRequest(model, prompt, selectedRole);

    return aiResponse;
  }
  explainKeywordsWithPreviousMessage(aiResponse: string, keywords: Set<string>){
    let previousMessages: { role: string; content: string; }[] = [];
    let previousMessage={role:"assistant",content:aiResponse};
    previousMessages.push(previousMessage);
    return this.explainKeywords(previousMessages,keywords);
  }
  explainKeywords(previousMessages: { role: string; content: string; }[], keywords: Set<string>): { [key: string]: Promise<string> } {
    let keywordsExplanationDict: { [key: string]: Promise<string> } = {};
    const role = (document.getElementById('role') as HTMLSelectElement).value;
    let selectedRole = this.gptService.getSelectedRole(role);
    
    keywords.forEach((keyword) => {
      let prompt = "Explain this word in one or two sentences, consider the context of before: " + keyword;
      let model="gpt-4o-mini-2024-07-18";
      keywordsExplanationDict[keyword] = this.gptService.sendGPTRequest(model, prompt, selectedRole, previousMessages)
        .then(explanation => {
          return explanation;
        })
        .catch(error => {
          console.error(`Error explaining '${keyword}':`, error);
          return `Error: ${error.message}`;
        });
    });
  
    return keywordsExplanationDict;
  }
  private generateKeywordVariations(keyword: string): string[] {
    let variations: string[] = [keyword]; // Always include the original keyword

    // Generate potential variations
    if (keyword.endsWith('s')) {
      variations.push(keyword.slice(0, -1)); // Possible singular
    } else {
      variations.push(keyword + 's'); // Possible plural
    }

    // Handle potential -y to -ies transformation
    if (keyword.endsWith('y')) {
      variations.push(keyword.slice(0, -1) + 'ies');
    } else if (keyword.endsWith('ies')) {
      variations.push(keyword.slice(0, -3) + 'y');
    }

    let normalizedVariations: string[] = [];
    for(let variation of variations){
      normalizedVariations.push(this.formatService.toLowerCaseAndDashesToUnderscore(variation));
    }
    return normalizedVariations;
  }

  searchAbstractsForExactKeyword(keyword: string, allDataPoints: any[]): Set<number> {
    let articleIds: Set<number> = new Set();
    let keywordVariations = this.generateKeywordVariations(keyword);

    // Create regex pattern for all variations
    const regexPattern = new RegExp(`\\b(${keywordVariations.join('|')})\\b`, 'i');

    allDataPoints.forEach((article: any) => {
      const normalizedAbstract = this.formatService.toLowerCaseAndDashesToUnderscore(article.abstractText);
      if (regexPattern.test(normalizedAbstract)) {
        articleIds.add(article.id);
      }
    });

    return articleIds;
  }

  searchAbstractsForPartKeyword(keywords: string[], allDataPoints: any[]): Set<number> {
    let articleIds: Set<number> = new Set();
    let allKeywordVariations: string[] = [];

    for (let keyword of keywords) {
      allKeywordVariations.push(...this.generateKeywordVariations(keyword));
    }

    // Create regex pattern for all variations of all keywords
    const regexPattern = new RegExp(allKeywordVariations.map(kw => `\\b${kw}\\b`).join('|'), 'i');

    allDataPoints.forEach((article: any) => {
      const normalizedAbstract = this.formatService.toLowerCaseAndDashesToUnderscore(article.abstractText);
      if (regexPattern.test(normalizedAbstract)) {
        articleIds.add(article.id);
      }
    });

    return articleIds;
  }

  // get the current position and radius of the draggable circle
  saveCirclePosition(currentLensX:number,currentLensY:number,currentLensR:number): { x: number; y: number; r: number; } {
    return { x: currentLensX, y: currentLensY, r: currentLensR };
  }
  
}
