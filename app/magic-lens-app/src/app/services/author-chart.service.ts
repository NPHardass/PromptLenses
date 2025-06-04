import { Injectable } from '@angular/core';
import Chart from 'chart.js/auto';

@Injectable({
  providedIn: 'root'
})
/**
 * Create the topics distribution chart for an author
 */
export class AuthorChartService {
  constructor() { }

  createBarChart(
    canvas: HTMLCanvasElement, 
    labels: string[], 
    data: number[], 
    clusterIdColorDict: { [clusterId: number]: string },
    clusterLabelNumberDict: { [clusterLabel: string]: number }
  ): Chart {
    const backgroundColors = labels.map(label => {
      const clusterId = clusterLabelNumberDict[label];
      return clusterIdColorDict[clusterId] || '#000000'; // Default to black if no color is found
    });

    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Article Count',
          data: data,
          backgroundColor: backgroundColors,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Articles'
            },
            ticks: {
              stepSize: 1,
              precision: 0
            }
          },
          x: {
            title: {
              display: false,
              text: 'Clusters'
            }
          }
        },
        plugins: {
          tooltip: {
            enabled:true
          },
          legend: {
            display: false,
          },
          title: {
            display: false,
            text: 'Article Labels Distribution'
          }
        }
      }
    });
  }
}