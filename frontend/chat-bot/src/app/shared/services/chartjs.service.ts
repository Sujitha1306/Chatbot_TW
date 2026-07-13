import { Injectable, ViewChild, Directive } from '@angular/core';
import { Chart } from 'chart.js'
import { HttpClient } from '@angular/common/http';
import zoomPlugin from 'chartjs-plugin-zoom';

@Injectable({
  providedIn: 'root'
})
export class ChartjsService {
  public Options : any;
  public dataSets : any;

  constructor() {
    // this.getOption() 
    Chart.register(zoomPlugin);
    this.setDefault()
  }

  public bindChart(val) {
    this.getDataset(val['label'], val['dataset'], '#66FDEB');
    this.getOption();
    new Chart(val['chartId'], {
      type: 'line',
      data: this.dataSets,
      options : this.Options
    });
  }
  public setData(labels?,data?, label?, bgColor?, borderColor?) {
    this.dataSets['labels'] = labels;
    this.dataSets['datasets']['data'] = data;
    this.dataSets['datasets']['label'] = label;
    this.dataSets['datasets']['backgroundColor'] = bgColor ? bgColor : this.dataSets['datasets']['backgroundColor'];
    this.dataSets['datasets']['borderColor'] = borderColor ? borderColor: this.dataSets['datasets']['borderColor']; 
  }
  
  public setDefault() {
    this.dataSets = {
      labels: ['Room 1', 'Room 2', 'Room 3'],
      datasets: [{
        data : [12, 45, 20],
        label: 'Department',
        backgroundColor: '#66F2FD',
        borderColor : '#66F2FD',
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointStyle : 'circle'
      }]
    };
    this.Options = {
      maintainAspectRatio: false,
      responsive : true,
      legend: { 
        display: false,
        labels: { usePointStyle:true }
      },
      plugins: {
        datalabels : {
          display : false
        },
        filler: {
          propagate: false
        },
      },
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      scales: {
        xAxes: [{
          barPercentage: 0.3,
            gridLines: { 
            drawOnChartArea: false 
          },
          ticks: {
            beginAtZero: true,
            display: true,
          },
          scaleLabel: {
            labelString: 'Date',
            display: true
          }
        }],
        yAxes: [{
          barPercentage: 0.3,
          gridLines: { 
            drawOnChartArea: false 
          },
          ticks: {
            beginAtZero: true,
            display: true,
          },
          scaleLabel: {
            labelString: 'Count',
            display: true
          }
        }]
      },
      elements : {
        point : {
          radius : 0,
          pointStyle : 'triangle'
        },
        line: { tension: 0.4 }
      },
      
    }
  }
  public getDataset(label, dataset, bgColor) {
    return this.dataSets = {
      labels: label,
      datasets: [{
        data : dataset,
        label: 'Count',
        backgroundColor: bgColor,
        borderColor : '#66F2FD',
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointStyle : 'circle'
      }]
    }
  }
  public getOption(xName?, yName?, legend?, gridLine?) {
    this.setDefault();
    this.Options['legend'] = { display: legend, position: "right" }
    this.Options['scales']['xAxes'][0]['scaleLabel']['labelString'] = xName;
    this.Options['scales']['yAxes'][0]['scaleLabel']['labelString'] = yName;
    if(!gridLine) {
      this.Options['layout']['padding'] =  {
        left : 40, right : 40, top : 40, bottom: 40
      }
      this.Options['scales']['xAxes'][0]['ticks'] = {display : false};
      this.Options['scales']['xAxes'][0]['scaleLabel'] = {display : false};
      this.Options['scales']['xAxes'][0]['gridLines'] =  {color : '#ffffff00', zeroLineColor: '#ffffff00', drawOnChartArea: false};
      
      this.Options['scales']['yAxes'][0]['ticks'] = {display : false};
      this.Options['scales']['yAxes'][0]['scaleLabel'] = {display : false};
      this.Options['scales']['yAxes'][0]['gridLines'] =  {color : '#ffffff00', zeroLineColor: '#ffffff00', drawOnChartArea: false};
    }
    
    return this.Options;
    
  }
}
@Directive()
export class ChartNewService {

  constructor(protected httpClient: HttpClient) { }
  //public chartarray: any = [];

  canvas: any;
  ctx: any;
  options: any;

  @ViewChild('mychart') mychart;

  ngOnInit() {
    //setTimeout(this.createChart, 3000);
    //this.createChart;
  }

  testfunc() {
    console.log("HI");
  }



  createChart(type, data, labels, chartname, xlabel, ylabel, legend, stacked) {
    //console.log(document.getElementById("chart1"));
    //console.log("HI");
    //this.canvas = document.getElementById("chart1");
    //this.ctx = this.canvas.getContext('2d');
    //let ctx = <HTMLCanvasElement>document.getElementById('chart1');
    //console.log(ctx);
    let axis: boolean = true;
    if (type == "pie" || type == "doughnut" || type == "polarArea")
      axis = false;

    /*chartarray['type'] = type;
    chartarray['datasets'] = data;
    chartarray['labels'] = labels;
    chartarray['options'] = {
      maintainAspectRatio: true,
      responsive: true,
      title: {
        display: true,
        text: chartname
      },
      legend: {
        display: legend,
        position: "bottom"
      },
      scales: {
        xAxes: [{
          display: axis,
          //type: 'linear',
          position: 'bottom',
          ticks: { autoSkip: false, minRotation: 45, maxRotation: 45, },
          scaleLabel: {
            labelString: xlabel,
            display: true,
          }
        }],
        yAxes: [{
          //type: 'linear',
          display: axis,
          stacked: stacked,
          ticks: { beginAtZero: true },
          scaleLabel: {
            labelString: ylabel,
            display: true
          }
        }]
      }
    };*/
    //return this.chartarray;
    let chart = new Chart(chartname, {
      type: type,
      data: {
        labels: labels,
        datasets: data
      },
      options: {
        maintainAspectRatio: true,
        responsive: true,
        title: {
          display: true,
          text: chartname
        },
        legend: {
          display: legend,
          position: "bottom"
        },
        scales: {
          xAxes: [{
            display: axis,
            //type: 'linear',
            position: 'bottom',
            ticks: {  autoSkip: false, minRotation: 45, maxRotation: 45, },
            scaleLabel: {
              labelString: xlabel,
              display: true,
            }
          }],
          yAxes: [{
            //type: 'linear',
            display: axis,
            stacked: stacked,
            ticks: {beginAtZero: true},
            scaleLabel: {
              labelString: ylabel,
              display: true
            }
          }]
        }
      }
    });
    /*if (type == 'pie' || type == 'doughnut')
      return this.createPieChart(type, data, label, chartname, legend)
    else if (type == 'bar')
      return this.createBarChart()
    else if (type == 'horizontalBar')
      return this.createHorizontalBarChart()
    else if (type == 'line')
      return this.createLineChart()
    else if (type == 'polarArea')
      return this.createPolarChart()*/
  }

  public createPieChart(type, data, label, chartname, legend) {
    this.canvas = this.mychart.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    let chart = new Chart(this.ctx, {
      type: type,
      data: {
        labels: label,
        datasets: [{
          label: chartname,
          backgroundColor: "rgba(255, 99, 132,0.4)",
          borderColor: "rgb(255, 99, 132)",
          fill: true,
          data: data,
        }]
      }

    });
  }

}
