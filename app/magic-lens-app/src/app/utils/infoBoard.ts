export class InfoBoardData{
    rectX:number;
    rectY:number;
    rectXPadding:number;
    rectWidth:number;
    rectHeight:number;
    barMaxWidth:number;
    fontSize:number;
    clusterRatios: { label: string; ratio: number; }[]
    totalDataPoints:number;
    clusterCounts: { [key: string]: number; };
    spaceBetweenLabels:any;

    constructor(rectX:number,rectY:number,rectXPadding:number, rectWidth:number, rectHeight:number, barMaxWidth:number, fontSize:number, clusterRatios:any, totalDataPoints:any, clusterCounts:any, spaceBetweenLabels:any){
        this.rectX=rectX;
        this.rectY=rectY;
        this.rectXPadding = rectXPadding;
        this.rectWidth = rectWidth;
        this.rectHeight = rectHeight;
        this.barMaxWidth = barMaxWidth;
        this.fontSize = fontSize;
        this.clusterRatios = clusterRatios;
        this.totalDataPoints = totalDataPoints;
        this.clusterCounts = clusterCounts;
        this.spaceBetweenLabels = spaceBetweenLabels;
    }
}