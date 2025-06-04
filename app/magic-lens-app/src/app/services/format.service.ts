import { Injectable } from '@angular/core';
import * as d3 from 'd3';

interface AuthorItem {
  name: string;
  descriptionLong: string;
  descriptionShort: string;
  co_authors: string[];
}

@Injectable({
  providedIn: 'root'
})
/**
 * Service for formatting strings and loading author data
 */
export class FormatService {
  private authorIndex: Map<string, AuthorItem> = new Map();
  private loadedFilePath: string | null = null;

  constructor() {}

  applyBlackList(words: string[]): string[] {
    let blackList = ["abstract", "visual","visualize", "visualization", "data", "techniques", "analyze","connection","analysis","system"];
    let filteredWords = words.filter((word) => {
        let normalizedWord = this.normalizeString(word);
        // Check both singular and plural forms
        let singularWord = normalizedWord.endsWith('s') ? normalizedWord.slice(0, -1) : normalizedWord;
        return !blackList.includes(normalizedWord) && !blackList.includes(singularWord);
    });
    return filteredWords;
  }
  normalizeString(s: string): string {
    return s.toLowerCase().replace(/[- ]/g, '_');
  }
  toLowerCaseAndDashesToUnderscore(s: string): string {
    return s.toLowerCase().replace(/[-]/g, '_');
  }
  isSimilar(word1: string, word2: string): boolean {
    const normWord1 = this.normalizeString(word1);
    const normWord2 = this.normalizeString(word2);
    if(normWord1===normWord2){
      return true;
    }
    return false;
  }

  async loadData(filePath: string): Promise<void> {
    if (this.loadedFilePath === filePath) return;

    const authorData:any = await d3.json(filePath);
    this.authorIndex.clear();
    for (const item of authorData) {
      let authorItem: AuthorItem={name: item.name, descriptionShort: item.description_short, descriptionLong: item.description_long, co_authors: item.co_authors};
      this.authorIndex.set(item.name, authorItem);
    }
    this.loadedFilePath = filePath;
  }

  private async ensureDataLoaded(filePath: string): Promise<void> {
    if (this.loadedFilePath !== filePath) {
      await this.loadData(filePath);
    }
  }

  private async getDescriptionByAuthor(filePath: string, author: string, type: 'long' | 'short'): Promise<string> {
    await this.ensureDataLoaded(filePath);
    const authorItem = this.authorIndex.get(author);
    if (!authorItem) {
      return `No ${type} description found`;
    }
    return type === 'long' ? authorItem.descriptionLong : authorItem.descriptionShort;
  }

  async getDescriptionLongByAuthor(filePath: string, author: string): Promise<string> {
    return this.getDescriptionByAuthor(filePath, author, 'long');
  }

  async getDescriptionShortByAuthor(filePath: string, author: string): Promise<string> {
    return this.getDescriptionByAuthor(filePath, author, 'short');
  }
  async getCoAuthorsByAuthor(filePath: string, author: string): Promise<string[]> {
    await this.ensureDataLoaded(filePath);
    const authorItem = this.authorIndex.get(author);
    if (!authorItem) {
      return [];
    }
    return authorItem.co_authors;
  }
  async getFormattedCoAuthors(filePath: string, author: string): Promise<string> { 
    let co_authors:string[]=await this.getCoAuthorsByAuthor(filePath,author);
    console.log(co_authors);
    let authorsLinks = co_authors.map((author: string) => {
      return `<a href="#author-description-container" data-author="${author}">${author}</a>`;
    }).join(', ');
    console.log(authorsLinks);
    let co_authorsMessage:string= "This author published only on his own";
    if(authorsLinks.length>0) {
      co_authorsMessage=`<b>Co-authors that published with the author: </b>${authorsLinks}`
    }
    return co_authorsMessage;
    
  }

  getAbstractString(dataPointsInsideCircle:any):string{
    let abstracts= dataPointsInsideCircle.map((point: { abstractText: string }) =>
      `Abstract:\n${point.abstractText}`
    ).join('\n---\n');
    return abstracts;
  }
  // start count at 1 for human usability on screen
  getAbstractStringWithContextNumbers(dataPointsInsideCircle:any):string{
    let abstracts= dataPointsInsideCircle.map((point: { abstractText: string,authors:string[] },count:number) =>
      `Abstract ${count+1}:\n${point.abstractText}`
    ).join('\n---\n');
    return abstracts;
  }
  getAbstractStringWithIds(dataPointsInsideCircle:any):string{
    let abstracts= dataPointsInsideCircle.map((point: { abstractText: string, id: string }) =>
      `Abstract ${point.id}:\n${point.abstractText}`
    ).join('\n---\n');
    return abstracts;
  }
  
}
