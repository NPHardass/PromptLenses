import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Handles all calculations for the magic lens
 */
export class CalculationService {

  constructor() { }

  // Define a  to check if a point is inside the draggable circle, use squared distance for faster calculation
  isInsideCircle(
    pointX: number,
    pointY: number,
    circleX: number,
    circleY: number,
    circleRadius: number
  ) {
    const distanceSquare = this.getSquareDistance(pointX, pointY, circleX, circleY);
    return distanceSquare <= circleRadius ** 2;
  }
  // Use this  to check which data points are inside the draggable circle
  checkDataPointsInCircle(
    circleX: number,
    circleY: number,
    circleRadius: number,
    allDataPoints: any[]
  ) {
    const dataPointsInsideCircle = allDataPoints.filter(
      (d: { x: number; y: number }) => {
        return this.isInsideCircle(d.x, d.y, circleX, circleY, circleRadius);
      }
    );
    return dataPointsInsideCircle;
  }
  // Helper function to calculate distance between two points
  getDistance = (point1: any, point2: any) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  getSquareDistance = (firstPointX: number, firstPointY: number, secondPointX: number, secondPointY: number) => {
    let squareDistance = (firstPointX - secondPointX) ** 2 + (firstPointY - secondPointY) ** 2;
    return squareDistance;
  };
  getArticlesOfAuthor(author:string,allDataPoints:any){
    let articleIdsOfAuthor: number[]=[];
    allDataPoints.forEach((point:any)=>{
      if(point.authors.includes(author)){
        articleIdsOfAuthor.push(point.id)
      }
    });
    return articleIdsOfAuthor;
  }
  radiusToSliderValue(radius: number, minLensRadius:number, maxLensRadius:number): number {
    // Convert the radius to a logarithmic scale value (0-100)
    const logMin = Math.log10(minLensRadius);
    const logMax = Math.log10(maxLensRadius);
    const logRadius = Math.log10(radius);
  
    return ((logRadius - logMin) / (logMax - logMin)) * 100;
  }
  
  sliderValueToRadius(value: number, minLensRadius:number,maxLensRadius:number): number {
    // Convert the slider value back to the corresponding radius using logarithmic scale
    const logMin = Math.log10(minLensRadius);
    const logMax = Math.log10(maxLensRadius);
    const logRadius = logMin + ((value / 100) * (logMax - logMin));
  
    return Math.pow(10, logRadius);
  }
}
