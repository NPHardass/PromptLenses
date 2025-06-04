import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environment/environment.prod';
import { FormatService } from './format.service';

@Injectable({
  providedIn: 'root',
})
/**
 * Service for interacting with the OpenAI API
 */
export class GptService {
  openaiApiKey: string;
  httpClient: HttpClient;
  formatService: FormatService;
  
  constructor(httpClient: HttpClient, formatService: FormatService) { 
    this.httpClient = httpClient;
    this.formatService = formatService;
    // Load the OpenAI API key from the environment variables
    this.openaiApiKey = environment.OPENAI_API_KEY;
  }
  getSelectedResponseLength(responseLength: string) {
    let selectecdResponseLength=600;
    switch (responseLength) {
      case "medium":
        selectecdResponseLength = 300;
        break;
      case "long":
        selectecdResponseLength = 600;
        break;
      default:
        selectecdResponseLength = 600;
        break;
    }
    return selectecdResponseLength;
  }

  getSelectedRole(role: string) {
    let roles = {
      "expert": "You are talking to a person that is a computer scientist. You can expect that the person has already a great knowledge about visualization and knows some technical terms.",
      "newbie":"You are talking to a person that has no knowledge of computer science and is new to the field but is eager to learn about it. Talk in simple terms with the user.",
      "basic": "You are talking to a person."
    }
    let selectedRole = roles["basic"];
    if (role === "expert") {
      selectedRole = roles["expert"];
    }
    else if (role === "newbie") {
      selectedRole = roles["newbie"];
    }
    return selectedRole;
  }
  getSelectedTask(task: string) {
    let tasks = [
      "Summarize the main findings and themes across these abstracts in a concise form.",
      "Identify the common threads shared among these abstracts, highlighting their key insights.",
      "Highlight the single most significant discovery or insight for the visualization field gleaned from these abstracts.",
      "Identify and summarize the three most salient facts or discoveries for the visualization field from these abstracts.",
      "Are there any controversies or different views on a topic? It could very well be that there are none. If there are, explain what they are."
    ]
    let selectedTask=tasks[0];
    switch (task) {
      case "summary":
        selectedTask = tasks[0];
        break;
      case "similarities":
        selectedTask = tasks[1];
        break;
      case "one-fact":
        selectedTask = tasks[2];
        break;
      case "three-facts":
        selectedTask = tasks[3];
        break;
      case "controversies":
        selectedTask = tasks[4];
        break;
      default:
        selectedTask = tasks[0];
        break;
    }
    return selectedTask;
  }
  async getKeywords(aiResponse: string) {
    const role = (document.getElementById('role') as HTMLSelectElement).value;
    let prompt = "Return only the difficult technical terms that are used in this text. List each term on a new line without any additional text or explanation. Start each with a \"*\":\n";
    if(role == "expert") {
        prompt = "Return only difficult technical terms that are used in this text and that a regular computer scientist would not understand. List each term on a new line without any additional text or explanation. Start each with a \"*\":\n";
    } else if(role == "newbie") {
        prompt = "Return all the technical terms that are used in this text. List each term on a new line without any additional text or explanation. Start each with a \"*\":\n";
    }
    
    prompt = prompt + aiResponse;
    let keywords: string[]=[];
    let model = "gpt-4o-mini-2024-07-18";
   
    let keywordResponse= await this.sendGPTRequest(model, prompt);
    // Remove leading and trailing whitespace and split by "*"
    let items = keywordResponse.trim().split('*');
    // Remove empty items (caused by leading/trailing "*")
    keywords = items.filter((item: string) => item.trim() !== '');
    //remove items that are "-"
    keywords = keywords.filter((item: string) => item.trim() !== '-');
    // remove "\n" characters and whitespace
    keywords= keywords.map((keyword:string)=>keyword.replace(/\n/, '').trim());
    return keywords;
}
  // Function to generate chat message with abstracts
  async customPrompt(dataPointsInsideCircle: any) {
    var model = "gpt-4o-mini-2024-07-18";
    //model="gpt-4o-2024-08-06";
    //model="gpt-4o"
    const responseLength = (document.getElementById('response-length') as HTMLInputElement).value;
    const task = (document.getElementById('task-select') as HTMLSelectElement).value;
    const role = (document.getElementById('role') as HTMLSelectElement).value;

    if (dataPointsInsideCircle.length === 0) {
      return;
    }
    if (dataPointsInsideCircle.length > 350) {
      console.log("Please do not send more than 350 abstracts.");
      return;
    }
    const abstracts = this.formatService.getAbstractStringWithContextNumbers(dataPointsInsideCircle);
    let selectedRole= this.getSelectedRole(role);
    let selectedTask=this.getSelectedTask(task)
    let selectecdResponseLength= this.getSelectedResponseLength(responseLength);
    
    console.log("Selected Task:", selectedTask, "Selected Role:", selectedRole, "Selected Response Length:", selectecdResponseLength, "Model:", model);
    let prompt_task = "\n### Task Description \nPlease perform the following task with the above abstracts\n\
              1. "+ selectedTask + "\n\
              2. If you refer to abstracts, do it ONLY in this form!: '(Abstract 1)' or '(Abstract 3,5,12)' and so on."
    
    let taskNumber=3;
    if(task=="summary"){
      prompt_task = prompt_task+"\n"+taskNumber+". Please do not exceed "+ selectecdResponseLength + " words.\n";
      taskNumber++;
    }
    if(task=="controversies"){
      prompt_task = prompt_task+"\n"+taskNumber+". If there are no controversies or different views return 'No controversies between the abstracts.'";
      taskNumber++;
    }
    if(role!="basic"){
      prompt_task=prompt_task+"\n"+taskNumber+". "+selectedRole;
    }
    let prompt = "### Abstracts\n" + abstracts + prompt_task
    
    console.log("Prompt: ", prompt);
    let aiResponse= await this.sendGPTRequest(model, prompt, selectedRole);
    return aiResponse;
  }

  async sendGPTRequest(model:string="gpt-4o-mini-2024-07-18", prompt:string, selectedRole:string="You are talking to a person that has no knowledge of computer science. You should explain keywords when used",previousMessages: { role: string; content: string; }[] = []) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.openaiApiKey}`
    });
    const messages = [
      { role: 'system', content: 'As a research assistant. ' + selectedRole },
      ...previousMessages,
      { role: 'user', content: prompt },
    ];
    const body = {
      model: model,
      messages: messages,
    };

    try {
      const response = await this.httpClient.post<any>('https://api.openai.com/v1/chat/completions', body, { headers }).toPromise();
      const aiResponse = response.choices[0].message.content;
      return aiResponse;
    } catch (error) {
      console.error("Error sending data to OpenAI:", error);
    }
  }

  
}
