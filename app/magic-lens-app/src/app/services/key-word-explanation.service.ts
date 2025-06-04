import { Injectable } from '@angular/core';
import { GptService } from './gpt.service';
import { HttpClient} from '@angular/common/http';
import { FormatService } from './format.service';

@Injectable({
  providedIn: 'root'
})
/**
 * Service for marking keywords in AI responses and bolding them
 */
export class KeyWordExplanationService {
  gptService: GptService;
  httpClient: HttpClient;
  formatService: FormatService;

  constructor(httpClient: HttpClient, formatService: FormatService) {
    this.httpClient = httpClient;
    this.formatService = formatService;
    this.gptService = new GptService(httpClient, formatService);
  }

  markReoccuringKeywordsInHtml(
    shortResponseHtmlWithLinks: string,
    priorShortResponseHtmlWithLinks: string
  ): string {
    // Helper function to extract keywords from HTML string
    function extractKeywords(html: string): string[] {
      const regex = /data-keyword="([^"]+)"/g;
      const matches = html.match(regex);
      return matches ? matches.map((match) => match.split('"')[1]) : [];
    }

    // Extract keywords from both texts
    const keywords1 = extractKeywords(shortResponseHtmlWithLinks);
    const keywords2 = extractKeywords(priorShortResponseHtmlWithLinks);

    // Find common keywords (including similar ones)
    const commonKeywords = keywords1.filter((keyword1) =>
      keywords2.some((keyword2) => this.formatService.isSimilar(keyword1, keyword2))
    );

    // Apply bolding to the first HTML string
    return this.boldCommonKeywords(commonKeywords, shortResponseHtmlWithLinks);
  }

  // Function to bold common keywords while preserving links
  boldCommonKeywords(commonKeywords: string[], html: string): string {
    return html.replace(
      /(<a\s+[^>]*data-keyword="([^"]+)"[^>]*>)([^<]+)(<\/a>)/g,
      (match, openingTag, keyword, content, closingTag) => {
        if (
          commonKeywords.some((commonKeyword) =>
            this.formatService.isSimilar(keyword, commonKeyword)
          )
        ) {
          return `${openingTag}<strong>${content}</strong>${closingTag}`;
        }
        return match;
      }
    );
  }

  async markKeywordsInHtml(
    aiResponseHtml: string,
    keywords: string[]
  ): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(aiResponseHtml, 'text/html');

    // Function to reconstruct HTML with keywords marked
    const markKeywordsInHtml = (node: ChildNode) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || '';
        let result = '';
        let currentIndex = 0;

        while (currentIndex < text.length) {
          let matchFound = false;
          for (const keyword of keywords) {
            const remainingText = text.substr(currentIndex);
            if (
              this.formatService.isSimilar(remainingText.substr(0, keyword.length), keyword)
            ) {
              const span = document.createElement('a');
              span.setAttribute('href', '#keyword-explanation-field-container');
              span.setAttribute('data-keyword', keyword);
              span.textContent = remainingText.substr(0, keyword.length);
              result += span.outerHTML;
              currentIndex += keyword.length;
              matchFound = true;
              break;
            }
          }
          if (!matchFound) {
            result += text[currentIndex];
            currentIndex++;
          }
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = result;
        return Array.from(tempDiv.childNodes);
      }
      node.childNodes.forEach((child) => {
        const markedChildNodes = markKeywordsInHtml(child);
        if (markedChildNodes) {
          child.replaceWith(...markedChildNodes);
        }
      });
      return null;
    };

    const body = doc.body;
    markKeywordsInHtml(body);
    return body.innerHTML;
  }

  escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
