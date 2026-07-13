/*******************************************************************************
 * ======================================================================================================
 *                                     Copyright (C) 2019 Trackerwave Pvt Ltd.
 *                                             All rights reserved
 * ======================================================================================================
 * Notice:  All Rights Reserved.
 * This material contains the trade secrets and confidential business information of Trackerwave Pvt Ltd,
 * which embody substantial creative effort, design, ideas and expressions.  No part of this material may
 * be reproduced or transmitted in any form or by any means, electronic, mechanical, optical or otherwise
 * ,including photocopying and recording, or in connection with any information storage or retrieval
 * system, without written permission.
 *
 * www.trackerwave.com, Traceability and Change log maintained in Source Code Control System}
 * ======================================================================================================
******************************************************************************/
import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';
import 'chartjs-plugin-datalabels';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() { }
  public colour = ['#29cb97', '#84D1FA', '#8CEDCB', '#00bfa5','#05b8cc','#4ea0cc','#61ffdd', '#24f2bb', '#83cff7']
  public pieColour = ['#26a69a', '#65338B', '#4770B3', '#D21F75','#3B3689','#50AED3','#4BB24F', '#E57438', '#569DD2','#569D79','#58595B','#E4B031','#84D2F4','#CAD93F','#F5C8AF','#9AC4B3','#9E9EA2']
  public myChart: Chart;
  public drawChart(chartInfo){
    // console.log(chartInfo)
      // let chart : any;
      let chartOptions : any;
      let canvas= chartInfo.canvasId;
      let mychartConfig : any;
      if(chartInfo.type == 'pie') {
        if(chartInfo.canvasId == 'locationMR' || chartInfo.canvasId == 'doctorMR'){
          mychartConfig = {
              type: 'pie',
              data: {
                  labels: chartInfo.label,
                  datasets: [{
                      data: chartInfo.data,
                      backgroundColor: this.colour,
                  }]
              },
              options: {
                title: {
                  display: chartInfo.showTitle,
                  text: chartInfo.title,
                  fontSize: 14,
                  fontFamily:'Open Sans',
                  fontColor:'black'
                },
              responsive: true,
              maintainAspectRatio : false,
              
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true
        },
        onClick: function(e, legendItem) {
          let index = legendItem.index;
          let ci = this.chart;
          let meta = ci.getDatasetMeta(0)
          let alreadyHidden = meta.data[index].hidden;
          meta.data.forEach(function(e, i) {
            if (i !== index) {
              if(alreadyHidden === null){
                meta.data[i].hidden = false;
              }
              else{
                meta.data[i].hidden = true;
              }
            } else if (i === index) {
              if(alreadyHidden === null){
                meta.data[i].hidden = false;
              } else{
              meta.data[i].hidden = null;
              }
            }
          });
          ci.update();
        },
      },
                plugins: {
                  datalabels: {
                    display:  function(data) {
                      return data.dataset.data[data.dataIndex] > 0;
                    },
                    color: 'black',
                    align: 'end',
                    anchor: 'center',
                    font:
                      {
                        weight: 'bold'
                      }
                  }
                }
              }
            };
        } else{
          mychartConfig = {
            type: 'pie',
            data: {
                labels: chartInfo.label,
                datasets: [{
                    data: chartInfo.data,
                    backgroundColor: this.pieColour,
                }]
            },
            options: {
              title: {
                display: chartInfo.showTitle,
                text: chartInfo.title,
                fontSize: 14,
                fontFamily:'Open Sans',
                fontColor:'black'
              },
            responsive: true,
            maintainAspectRatio : false,
                legend: {position: 'top',
                labels: {
                  usePointStyle: true
                }
              },
              plugins: {
                datalabels: {
                  display:  function(data) {
                    return data.dataset.data[data.dataIndex] > 0;
                  },
                  color: 'black',
                  align: 'end',
                  anchor: 'center',
                  font:
                    {
                      weight: 'bold'
                    }
                }
              }
            }
          };
        }
      } else if(chartInfo.type == 'doughnut') {
        chartOptions = {
          title: {
            display: chartInfo.showTitle,
            text: chartInfo.title,
            fontSize: 14,
            fontFamily:'Open Sans',
            fontColor:'black'
          },
        responsive: true,
        maintainAspectRatio : false,
        legend: {position: 'left',
            labels: {
              usePointStyle: true
            }
          },
        plugins: {
            datalabels: {
              display:  function(data) {
                return data.dataset.data[data.dataIndex] > 0;
              },
              color: 'black',
              anchor: 'center',
              font:
                {
                  weight: 'bold'
                }
            }
          }
        }
        if(chartInfo.showAnimations )
        {
          chartOptions.animation = {
            animateScale: true,
            animateRotate: true,
            onComplete: function() {
              let dataLabel = document.getElementById('data-label');
              // dataLabel.innerHTML = 'Total : ' + chartInfo.total;
              // dataLabel.style.top = "110px";
              // dataLabel.style.left = "180px";
              // dataLabel.style.right = "50px";
            }
          }
        }
        mychartConfig = {
            type: 'doughnut',
            data: {
                labels: chartInfo.label,
                datasets: [{
                    data: chartInfo.data,
                    backgroundColor: this.colour,
                }]
            },
            options: chartOptions,
        };
      } else if(chartInfo.type == 'bar') {
        let showlegend = true;
        let chartType = 'bar';
        if(chartInfo.id == 'asset-misplaced' || chartInfo.id == 'asset-utilz' || chartInfo.id == 'othreq-move' || chartInfo.id == 'patientmove' || chartInfo.id == 'asset-move' || chartInfo.id == 'porter-perf'){
          showlegend = false;
        }
        // if(chartInfo.id == 'battery-summary')
        // {
        //   chartOptions = {
        //     title : {
        //       display : chartInfo.showTitle,
        //       text : chartInfo.title,
        //       position : 'top',
        //       fontSize: 14,
        //       fontFamily:'Open Sans',
        //       fontColor:'black'            },
        //     legend : {
        //       display : showlegend,
        //       position :'left',
        //       labels :{
        //         usePointStyle: true,
        //         fontSize : 12,
        //         fontColor: '#000000'
        //       },
        //     },
        //     responsive : true,
        //     maintainAspectRatio : false,
        //     scales : {
        //       xAxes : [{
        //         maxBarThickness: 50,
        //         autoSkip : false,
        //         categoryPercentage : 0.6,
        //         barPercentage : 1.0,
        //         gridLines : {display : false},
        //       }],
        //       yAxes : [{
        //         ticks : { beginAtZero : true},
        //         gridLines : { display : false},
        //         categoryPercentage : 1.0,
        //         barPercentage : 1.0,
        //       }]
        //     },
        //     plugins: {
        //       datalabels: {
        //         display:  function(canvas) {
        //           return canvas.dataset.data[canvas.dataIndex] > 0;
        //         },
        //         color: 'black',
        //         align: 'center',
        //         anchor: 'center',
        //         font:
        //         {
        //           weight: 'bold'
        //         }
        //       }
        //     }
        //   }
        //   console.log(chartInfo.data)
        //   mychartConfig = {
        //     type : 'bar',
        //     data : {
        //       labels : chartInfo.label,
        //       datasets : [{
        //         label: chartInfo.barLabel[0],
        //         backgroundColor: this.colour[0],
        //         data: [chartInfo.data[0]['active_count']],
        //       },{
        //         label: chartInfo.barLabel[1],
        //         backgroundColor: this.colour[1],
        //         data: [chartInfo.data[0]['inactive_count']],
        //       }]
        //     },
        //    options : chartOptions
        //   };
        // }
        //else{
        if(chartInfo.canvasId == 'nurseCall'){
          chartOptions = {
            title: {
                   display: chartInfo.showTitle,
                   text: chartInfo.title,
                   fontSize: 14,
                    fontFamily:'Open Sans',
                    fontColor:'black'
                 },
             legend : {
              display : showlegend,
             position : 'top',
              labels:{
                usePointStyle:true
              }
            },
             responsive : true,
             maintainAspectRatio : false,
             scales : {
               xAxes: [{
                 maxBarThickness : 30,
                 gridLines : {display : true,drawOnChartArea: false},
   
               }],
               yAxes: [{
                userCallback: function(label, index, labels) {
                  // when the floored value is the same as the value we have a whole number
                  if (Math.floor(label) === label) {
                      return label;
                  }
               },
               ticks: {
                beginAtZero: true,
                min: 0
              } ,
                 display: false,
                 gridLines : {display : true,drawOnChartArea: false},
               }]
             },
             plugins: {
               datalabels: {
                 display:  function(canvas) {
                   return canvas.dataset.data[canvas.dataIndex] > 0;
                 },
                 color: 'black',
                 align: 'center',
                 anchor: 'center',
                 font:
                 {
                   weight: 'bold'
                 }
               }
             }
           }
          mychartConfig =  {
             type : 'bar',
             data : {
               labels : chartInfo.label,
               datasets : [{
                 label: chartInfo.barLabel[0],
                 backgroundColor: this.colour[0],
                 data: chartInfo.data[0],
               },{
                label: chartInfo.barLabel[1],
                backgroundColor: this.colour[1],
                data: chartInfo.data[1],
              },{
                label: chartInfo.barLabel[2],
                backgroundColor: this.colour[2],
                data: chartInfo.data[2],
              }]
             },
            options : chartOptions
           };
        } else{
          chartOptions = {
            title: {
                   display: chartInfo.showTitle,
                   text: chartInfo.title,
                   padding:20,
                   fontSize: 14,
                    fontFamily:'Open Sans',
                    fontColor:'black'
                 },
             legend : {
              display : showlegend,
             position : 'top',
              labels:{
                usePointStyle:true
              }
            },
             responsive : true,
             maintainAspectRatio : false,
             scales : {
               xAxes: [{
                 maxBarThickness : 30,
                 gridLines : {display : true,drawOnChartArea: false},
                 scaleLabel :{display: false},
               }],
               yAxes: [{
               ticks: {
                userCallback: function(label, index, labels) {
                  // when the floored value is the same as the value we have a whole number
                  if (Math.floor(label) === label) {
                      return label;
                  }
                },
                beginAtZero: true,
                min: 0
              } ,
                 display: true,
                 gridLines : {display : true,drawOnChartArea: false},
               }]
             },
             plugins: {
               datalabels: {
                 display:  function(canvas) {
                   return canvas.dataset.data[canvas.dataIndex] > 0;
                 },
                 color: 'black',
                 align: 'end',
                 anchor: 'end',
                 font:
                 {
                   weight: 'bold'
                 }
               }
             }
           }
           if(chartInfo.id == 'emp-loc-rep'){
            //chartOptions.scales.xAxes[0].display =  false
            chartOptions.scales.xAxes[0].maxBarThickness =  10
            chartOptions.legend.display = false
          }
          if(chartInfo.id == 'OT-utilz'){
            if(chartInfo.canvasId == 'assetUtliz'){
              chartOptions.tooltips = {
                mode : 'x-axis',
                callbacks: {
                  label: function(tooltipItem) {
                    let ind = chartInfo.data.indexOf(tooltipItem.yLabel);
                    return chartInfo.tempLabel[ind];
                  }
                }
              };
              chartOptions.scales.yAxes[0].ticks= {
                callback: function(value, index, ticks) {
                    return value+'hr';
                }
              };
              chartOptions.scales.yAxes[0].display = true;
              chartOptions.plugins.datalabels.align = 'end';
              chartOptions.plugins.datalabels.anchor = 'end';
              chartOptions.plugins.datalabels.formatter = function(value,context){
                let ind = context.dataIndex;
                return chartInfo.tempLabel[ind];
              }
            } else if(chartInfo.canvasId == 'otRoomUtiliz'){
              chartOptions.scales.xAxes[0].ticks = {
                autoSkip: false,
               };
               chartOptions.scales.yAxes[0].display = true;
            } else {
              chartType = 'horizontalBar';
              chartOptions.scales.yAxes[0] = {maxBarThickness : 30,
                gridLines : {display : true,drawOnChartArea: false},};
              chartOptions.scales.xAxes[0] = {
                ticks: {
                beginAtZero: true,
                min: 0
                },
                gridLines : {display : true,drawOnChartArea: false},
              }
            }
          }
          if(chartInfo.canvasId == 'porterWaitlist'){
            chartOptions.title.fontSize = 20;
            chartOptions.scales.xAxes[0].scaleLabel.display = true;
            chartOptions.scales.xAxes[0].scaleLabel.labelString = "hours";
          }
          if(chartInfo.barLabel == undefined){
            chartOptions.legend.display = false
            mychartConfig = {
              type : chartType,
              data : {
                labels : chartInfo.label,
                datasets : [{
                  backgroundColor: this.colour[0],
                  data: chartInfo.data,
                }]
              },
              options : chartOptions
            };
          } else{
              mychartConfig = {
                  type : chartType,
                  data : {
                    labels : chartInfo.label,
                    datasets : [{
                      label: chartInfo.barLabel[0],
                      backgroundColor: this.colour[0],
                      data: chartInfo.data,
                      maxBarThickness : 30
                    }]
                  },
                options : chartOptions
              };
          }
        }
        //}
    } else if(chartInfo.type == 'stacked') {
        chartOptions = {
            responsive : true,
            maintainAspectRatio : false,
            title: {
              display: chartInfo.showTitle,
              text: chartInfo.title,
              padding:20,
              fontSize: 14,
              fontFamily:'Open Sans',
              fontColor:'black'
            },
           legend : {
              display : true,
              position : 'top',
              labels:{
                usePointStyle:true
              }
            },
            scales : {
              xAxes: [{
                stacked: true,
                gridLines : {display : true,drawOnChartArea: false},
                maxBarThickness : 30
              }],
              yAxes: [{
                display: true,
                stacked: true,
                gridLines : {display : false},
                ticks: {
                  beginAtZero: true,
                  userCallback: function(label, index, labels) {
                    // when the floored value is the same as the value we have a whole number
                    if (Math.floor(label) === label) {
                        return label;
                    }
                  },
                }
              }]
            },
            plugins: {
              datalabels: {
                display:  function(canvas) {
                  return canvas.dataset.data[canvas.dataIndex] > 0;
                },
                color: 'black',
                align: 'end',
                anchor: 'end',
                font:
                {
                  weight:'bold'
                }
              }  
            }
          }
        if(chartInfo.id == 'patient-status-op'){
          chartOptions.scales.yAxes.display = false;
          mychartConfig = {
            type : 'bar',
            data : {
              labels: chartInfo.label,
              datasets: [{
                label: "Total",
                type: "bar",
                backgroundColor: "#5CD6CC",
                data: chartInfo.data[0],
              }, {
                label: "Completed",
                type: "bar",
                stack: "Status",
                backgroundColor: '#84D1FA',  
                data: chartInfo.data[0],
              }, {
                label: "In Progress",
                type: "bar",
                stack: "Status",
                backgroundColor: '#8CEDCB',      
                data: chartInfo.data[0],
              }]
            },
            options: chartOptions
          }
          }  else if(chartInfo.id == 'porter-req-perf'){
            chartOptions.plugins.datalabels.display = false;
            mychartConfig = {
              type : 'bar',
              data : {
                labels: chartInfo.label,
                datasets: [{
                  label: chartInfo.barLabel[0],
                  type: "bar",
                  stack: "Status",
                  backgroundColor: "#64c195",
                  data: chartInfo.data[0],
                }, {
                  label: chartInfo.barLabel[1],
                  type: "bar",
                  stack: "Status",
                  backgroundColor: '#fdf37c',  
                  data: chartInfo.data[1],
                }, {
                  label: chartInfo.barLabel[2],
                  type: "bar",
                  stack: "Status",
                  backgroundColor: '#f4a972',      
                  data: chartInfo.data[2],
                }]
              },
              options: chartOptions
            }
          }else {
          mychartConfig = {
            type : 'bar',
            data : {
              labels : chartInfo.label,
              datasets: [{
                label: chartInfo.barLabel[0],
                backgroundColor: this.colour[0],
                borderColor: this.colour[0],
                data: chartInfo.data[0]
              }, {
                label: chartInfo.barLabel[1],
                backgroundColor: this.colour[1],
                borderColor: this.colour[1],
                data: chartInfo.data[1]
              }]
            },
            options:  chartOptions
          }
        }
      } else if(chartInfo.type == 'grouped') {
        let data: any;
      chartOptions =  {
        legend: {position: 'top',
        labels:{
          usePointStyle:true,
          fontSize:13,
          fontColor:'#000000'
        } ,  
      },
        title: {
          display: chartInfo.showTitle,
          text: chartInfo.title,
          padding:20,
          fontSize: 14,
          fontFamily:'Open Sans',
          fontColor:'black'
        },
        responsive : true, maintainAspectRatio : false,
        scales : {
          xAxes: [{
               maxBarThickness: 30,
               scaleLabel :{display: false},
               gridLines : {display : true,drawOnChartArea: false},
               categoryPercentage: 0.7,
               barPercentage: 0.6,
               ticks: {
                autoSkip: false
               }        
          }],
          yAxes: [{
               ticks : {
                      userCallback: function(label, index, labels) {
                        // when the floored value is the same as the value we have a whole number
                        if (Math.floor(label) === label) {
                            return label;
                        }
        
                    },
                    beginAtZero : true
               },
               gridLines : {display : true,drawOnChartArea: false},
               display: true,
          }]
       },
       plugins: {
          datalabels: {
            display:  function(canvas) {
              return canvas.dataset.data[canvas.dataIndex] > 0;
            },
            color: 'black',
            align: 'end',
            anchor: 'end',
            font:
            {
              weight: 'bold'
            }
          }
       }
      };
      if(chartInfo.id != 'roll-call' && chartInfo.id != 'staff-roll-call' && chartInfo.id != 'patient-status' && chartInfo.id != 'OT-utilz' && chartInfo.id != 'OT-wait' && chartInfo.id != 'ER-wait' && chartInfo.id != 'battery-summary' && chartInfo.id != 'staff-battery-summary' && chartInfo.id != 'patientmove' && chartInfo.id != 'othreq-move' && chartInfo.id != 'porter-req-summary' && chartInfo.id != 'porter-req-summary-bycat' && chartInfo.id != 'ambulance-summary' && chartInfo.id != 'asset-summary' && chartInfo.id != 'nurse-call-sum' && chartInfo.id != 'porter-waitlist' && chartInfo.id !='hk-summary' && chartInfo.id !='bk-summary' && chartInfo.id !='sc-summary' && chartInfo.id != 'patient-status-op'){
        data={
          labels: chartInfo.label,
          datasets: [{
            label: chartInfo.barLabel[0],
            type: "bar",
            backgroundColor: "#5CD6CC",
            data: chartInfo.data[0],
          }, {
            label: chartInfo.barLabel[1],
            type: "bar",
            stack: "Status",
            backgroundColor: '#84D1FA',  
            data: chartInfo.data[1],
          }, {
            label: chartInfo.barLabel[2],
            type: "bar",
            stack: "Status",
            backgroundColor: '#8CEDCB',      
            data: chartInfo.data[2],
          }]
        }
      } else if(chartInfo.canvasId == 'dateWiseSummary'){
        data= {
          labels: chartInfo.label,
          datasets: [{
            label: chartInfo.barLabel[0],
            type: "bar",
            backgroundColor: "#5CD6CC",
            data: chartInfo.data[0],
          }, {
            label: chartInfo.barLabel[1],
            type: "bar",
            backgroundColor: '#84D1FA',  
            data: chartInfo.data[1],
          }, {
            label: chartInfo.barLabel[2],
            type: "line",
            backgroundColor: '#65338B',  
            data: chartInfo.data[2],
            fill: false,
          } 
        ]
        }
      } else if(chartInfo.canvasId == 'requestCategorywiseSum'){
        chartOptions.title.fontSize = 14;
        chartOptions.scales.xAxes[0].maxBarThickness = 30;
        data={
          labels: chartInfo.label,
          datasets: [{
            label: chartInfo.barLabel[0],
            type: "bar",
            backgroundColor: "#29cb97",
            data: chartInfo.data[0],
            maxBarThickness: 30
          }, {
            label: chartInfo.barLabel[1],
            type: "bar",
            backgroundColor: '#ef5350',  
            data: chartInfo.data[1],
            maxBarThickness: 30
          }, {
            label: chartInfo.barLabel[2],
            type: "bar",
            backgroundColor: '#3b86ff',      
            data: chartInfo.data[2],
            maxBarThickness: 30
          },
          {
            label: chartInfo.barLabel[3],
            type: "bar",
            backgroundColor: '#71ddef',      
            data: chartInfo.data[3],
            maxBarThickness: 30
          }]
        }
      } else if(chartInfo.id == 'asset-summary'){
          data = {
            labels : chartInfo.label,
            datasets: [{
              label: 'Traceable',
              type : 'bar',
              backgroundColor: this.colour[0],
              data: chartInfo.data.active
            }, {
              label: 'Non-traceable',
              type : 'bar',
              backgroundColor: this.colour[1],
              data: chartInfo.data.inactive
            }]
          }
      } else{
          data= {
            labels: chartInfo.label,
            datasets: [{
              label: chartInfo.barLabel[0],
              type: "bar",
              backgroundColor: "#29cb97",
              data: chartInfo.data[0],
            }, {
              label: chartInfo.barLabel[1],
              type: "bar",
              backgroundColor: '#84D1FA',  
              data: chartInfo.data[1],
            } 
            ]
        }
        chartOptions.scales.yAxes[0].display = false;
      }
      if(chartInfo.id == 'patient-status-op'){
        chartOptions.scales.yAxes.display = false;
      } else if(chartInfo.canvasId == 'otherTimewiseMovement'){
        chartOptions.title.fontSize = 14;
        chartOptions.scales.xAxes[0].maxBarThickness = 30;
        chartOptions.scales.yAxes[0].display = true;
        chartOptions.scales.xAxes[0].scaleLabel.display = true;
        chartOptions.scales.xAxes[0].scaleLabel.labelString = "hours";
        chartOptions.plugins.datalabels.align = 'center';
        chartOptions.plugins.datalabels.anchor = 'center';
        chartOptions.plugins.datalabels.color = 'white';
        data.datasets[1].backgroundColor = '#ef5350';
      }
      mychartConfig = {
        type: 'bar',
        data : data,
        options: chartOptions
      };
      for(let i=0;i< mychartConfig?.data?.datasets.length;i++){
        mychartConfig.data.datasets[i]['maxBarThickness'] = 30;
      }
      } else if(chartInfo.type == 'stacked-grouped') {
      chartOptions =  {
        legend: {position: 'top',
        title: {
          display: chartInfo.showTitle,
          text: chartInfo.title,
          fontSize: 14,
          fontFamily:'Open Sans',
          fontColor:'black'
        },
            labels:{
              usePointStyle:true,
              fontSize:13,
              fontColor:'#000000'
            } ,    
            },
        responsive : true, maintainAspectRatio : false,
        scales : {
          xAxes: [{
               maxBarThickness: 30,
               gridLines : {display : true,drawOnChartArea: false},
  
          }],
          yAxes: [{
            userCallback: function(label, index, labels) {
              // when the floored value is the same as the value we have a whole number
              if (Math.floor(label) === label) {
                  return label;
              }
            },
               ticks : {
                    beginAtZero : true
               },
               gridLines : {display : true,drawOnChartArea: false},
               display: true,
          }]
       },
       plugins: {
          datalabels: {
            display:  function(canvas) {
              return canvas.dataset.data[canvas.dataIndex] > 0;
            },
            color: 'black',
            align: 'end',
            anchor: 'center',
            font:
            {
              weight: 'bold'
            }
          }
       }
      };
      mychartConfig = {
        type: 'bar',
        data: {
            labels: chartInfo.label,
            datasets: [{
              label: chartInfo.barLabel[0],
              type: "bar",
              backgroundColor: "#5CD6CC",
              data: chartInfo.data[0],
            }, {
              label: chartInfo.barLabel[1],
              type: "bar",
              stack: "stack1",
              backgroundColor: '#84D1FA',  
              data: chartInfo.data[1],
            }, {
              label: chartInfo.barLabel[2],
              type: "bar",
              stack: "stack1",
              backgroundColor: '#8CEDCB',      
              data: chartInfo.data[2],
            }]
          },
        options: chartOptions
      };  
      } else if(chartInfo.type == 'bar-line') {
        chartOptions = {
          title: {
                 display: chartInfo.showTitle,
                 text: chartInfo.title,
                 position: 'top',
                 fontSize: 15,
                  fontFamily:'Open Sans',
                  fontColor:'black'
               },
           legend : {
            display : chartInfo.showLegend,
            position : 'top',
            labels:{
              usePointStyle:true,
              fontSize:15,
              fontColor:'#000000'
            }
          },
           responsive : true,
           maintainAspectRatio : false,
           scales : {
             xAxes: [{
              autoSkip : false,
              gridLines : {display : true,drawOnChartArea: false},
              labelAutoFit: false,
              categoryPercentage: 1.0,
              barPercentage: 1.0,
              maxBarThickness : 30,
             }],
             yAxes: [{
              ticks : {
                beginAtZero : true,
                categoryPercentage: 1.0,
                barPercentage: 1.0
                //suggestedMin : 0,
                //suggestedMax : 150,
              },
              gridLines : {display : true,drawOnChartArea: false},
              labelAutoFit : false,
             }]
           },
           plugins: {
             datalabels: {
               display:  function(canvas) {
                 return canvas.dataset.data[canvas.dataIndex] > 0;
               },
               color: 'black',
               align: 'center',
               anchor: 'center',
               font:
               {
                 weight: 'bold'
               }
             }
           }
         }
         if(chartInfo.id == 'day_care'){
          mychartConfig = {
            type : 'bar',
            data : {
              labels : chartInfo.label,
              datasets : [{
                type : 'bar',
                backgroundColor: ['#03AAE8', '#00FF5A', '#FFC300', '#FF2200', '#019F96', '#8e5ea2', '#3cba9f', '#83B9FA', '#c45850', '#FFB347'],
                data: chartInfo.data[0],
              },
              {
                type : 'line',
                borderColor: '#c45850',
                fill: false,
                data: chartInfo.data[1],
              },
              {
                type : 'line',
                borderColor: '#8e5ea2',
                fill: false,
                data: chartInfo.data[2],
              },{
                type : 'line',
                borderColor: '#019F96',
                fill: false,
                data: chartInfo.data[3],
              }]
            },
           options : chartOptions
          };
         } else if(chartInfo.id == 'porter-req-perf'){
          mychartConfig = {
            type : 'bar',
            data : {
              labels : chartInfo.label,
              datasets : [{
                label: chartInfo.barLabel[1],
                type : 'line',
                borderColor: '#03AAE8',
                fill: false,
                data: chartInfo.data[1],
              },
              {
                label: chartInfo.barLabel[0],
                type : 'bar',
                backgroundColor: this.colour[0],
                data: chartInfo.data[0],
              }]
            },
          options : chartOptions
          };
       } else{
          mychartConfig =  {
          type : 'bar',
          data : {
            labels : chartInfo.label,
            datasets : [{
              label: chartInfo.barLabel[0],
              type : 'line',
              borderColor: '#c45850',
              fill: false,
              data: chartInfo.data,
              datalabels : {
                align : 'end',
                anchor : 'end',
              }
            },
            {
              label: chartInfo.barLabel[1],
              type : 'line',
              borderColor: '#8e5ea2',
              fill: false,
              data: chartInfo.data,
              datalabels : {
                align : 'end',
                anchor : 'center',
              }
            },{
              label: chartInfo.barLabel[2],
              type : 'line',
              borderColor: '#019F96',
              fill: false,
              data: chartInfo.data,
              datalabels : {
                align : 'end',
                anchor : 'start',
              }
            }]
          },
         options : chartOptions
        };
      }
      } else if(chartInfo.type == 'horizontal-stacked-bar') {
        let data: any;
        chartOptions = {
          tooltips: {
              enabled: true
          },
          scales: {
              xAxes: [
                {
                  position : 'top',
                  ticks: {
                      beginAtZero: true,
                      fontFamily: '\'Open Sans Bold\', sans-serif',
                      fontSize: 11
                  },
                  scaleLabel: {
                      display: false
                  },
                  gridLines: {display : true,drawOnChartArea: false},
                  stacked: true
                }
              ],
              yAxes: [{
                  maxBarThickness: 55,
                  gridLines: {display : true,drawOnChartArea: false,
                      color: '#fff',
                      zeroLineColor: '#fff',
                      zeroLineWidth: 0
                  },
                  ticks: {
                      fontFamily: '\'Open Sans Bold\', sans-serif',
                      fontSize: 11
                  },
                  stacked: true
              }]
          },
          legend: {
              display: true,
              position: 'right',
                labels: {
                  usePointStyle: true
                }
          },
          plugins: {
                    datalabels: {
                      display: function(canvas) {
                         return canvas.dataset.data[canvas.dataIndex] > 0;
                      },
                      align: 'center',
                      anchor: 'center',
                      color: 'black',
                      font:
                      {
                        weight: 'bold'
                      }
                    }
                 },
          pointLabelFontFamily : 'Quadon Extra Bold',
          scaleFontFamily : 'Quadon Extra Bold',
        };
        data = {
              labels: chartInfo.label,
              datasets: [{
                  label: chartInfo.barLabel[0],
                  backgroundColor: this.colour[0],
                  data: chartInfo.data[0]
                }, {
                  label: chartInfo.barLabel[1],
                  backgroundColor:this.colour[1],
                  data: chartInfo.data[1]
                }, {
                  label: chartInfo.barLabel[2],
                  backgroundColor: this.colour[3],
                  data: chartInfo.data[2]
                },
                {
                  label: chartInfo.barLabel[3],
                  backgroundColor: this.colour[3],
                  data: chartInfo.data[3]
                }
              ]
            };
    
         mychartConfig = {
          type: 'horizontalBar',
          data: data,
          options: chartOptions
        };
      } else if(chartInfo.type == 'line') {
        let data: any;
        if(chartInfo.id == 'asset-utilization'){
          chartOptions = {
            elements : {
              point : {
                radius : 5,
                pointStyle : 'circle'
              },
              line: {
                  tension: 0.000001
              }
            },
            legend: {
                display: true,
                position : 'top',
                labels:{
                  usePointStyle:true
                }
            },
            scales : {
              xAxes: [{
                ticks : {
                  beginAtZero : true,
                  maxTicksLimit : 10,
                  maxRotation : 0
                },
                scaleLabel : {
                  display : true,
                  labelString : '_',
                },
              }],
              yAxes: [{
                display : true,
                type: 'linear',
                ticks :{
                  beginAtZero : true,
                  max : 4,
                  stepSize: 1,
                  suggestedMax: Math.max.apply(Math, chartInfo.data) + 5,
                  callback: function(index) {
                    if(index == 1){
                      return 'OFF'
                    }else if(index == 2){
                      return 'SLEEP'
                    }else if(index == 3){
                      return 'IN USE'
                    }
                  }
                },
              }, 
            ]
            },
            responsive : true,
            interaction: {
              intersect: false,
              axis: 'x'
            },
            maintainAspectRatio: false,
            plugins: {
              datalabels : {
                display: false
              },
              filler: {
                   propagate: false
              },
            },
            title: {
                display: false,
                position : 'top',
                text: chartInfo.title,
                fontSize : 14
            },
            tooltips : {
              mode : 'x-axis',
              callbacks: {
                label: function(tooltipItem) {
                  if(tooltipItem.yLabel == 1){
                    return 'Status: OFF';
                  }else if(tooltipItem.yLabel == 2){
                    return 'Status: SLEEP'
                  }else if(tooltipItem.yLabel == 3){
                    return 'Status: IN USE'
                  }
                }
              }
            },
            hover : {
              mode : 'x-axis',
              animationDuration : 0
            }
          },
          data = {
            labels: chartInfo.label,
            datasets: [{
              data: chartInfo.data,
              label: 'Asset Utilization',
              backgroundColor: this.colour[3],
              borderColor : this.colour[3],
              steppedLine: 'before',
              stepped :true,
              fill: false
            }]
          }     
        } else{
        if(chartInfo.id == 'env-all-report'){
          chartOptions = {
            elements : {
              point : {
                radius : 5,
                pointStyle : 'triangle'
              },
              line: {
                  tension: 0.000001,
                  borderColor: 'rgba(75, 192, 192, 1)', // Set the color for the line
                  backgroundColor: 'rgba(75, 192, 192, 0.2)', // Set the background color
                  borderWidth: 2 ,
              }
            },
            legend: {
                display: true,
                position : 'top',
                labels:{
                  usePointStyle:true
                }
            },
            scales : {
              xAxes: [{
                ticks : {
                  beginAtZero : true,
                  maxTicksLimit : 10,
                  maxRotation : 0
                },
                scaleLabel : {
                  display : true,
                  labelString : '_',
                },
              }],
              yAxes: [{
                display : true,
                type: 'linear',
                ticks :{
                  // beginAtZero : true,
                  // maxTicksLimit : 10,
                  stepSize: 10,
                  suggestedMax: Math.max.apply(Math, chartInfo.data) + 5
                },
              }, 
            ]
            },
            spanGaps:true,
            responsive : true,
            maintainAspectRatio: false,
            plugins: {
              datalabels : {
                display:  false
              },
              filler: {
                   propagate: false
              },
            },
            title: {
                display: false,
                position : 'top',
                text: chartInfo.title,
                fontSize : 14
            },
            tooltips : {
              mode : 'x-axis',
            },
            hover : {
              mode : 'x-axis',
              animationDuration : 0
            }
          },
          data = {
            labels: chartInfo.label,
            datasets: [{
              data: chartInfo.data['Humidity'][0]['data'],
              label: chartInfo.data['Humidity'][0]['label']+' - Humidity',
              backgroundColor: this.colour[0],
              borderColor : this.colour[0],
              fill: false
            },
            // {
            //   data : chartInfo.data['Pressure'],
            //   label: 'Pressure',
            //   backgroundColor: "#4af7cf",
            //   borderColor : "#4af7cf",
            //   fill: false
            // },
            {
              data : chartInfo.data['Temperature'][0]['data'],
              label : chartInfo.data['Temperature'][0]['label']+' - Temperature',
              backgroundColor: this.colour[1],
              borderColor : this.colour[1],
              fill: false
            },
          ]
          }
          chartOptions.elements.point.pointStyle = 'circle';
          chartOptions.elements.point.radius = 4;
        } else{
          chartOptions = {
            elements : {
              point : {
                radius : 7,
                pointStyle : 'triangle'
              },
              line: {
                  tension: 0.000001
              }
            },
            legend: {
                display: true,
                position : 'top',
                labels:{
                  usePointStyle:true,
                  fontSize:15
                }
            },
            scales : {
              xAxes: [{
                ticks : {
                  beginAtZero : true,
                  maxTicksLimit : 10,
                  maxRotation : 0
                },
                scaleLabel : {
                  display : true,
                  labelString : '_',
                },
              }],
              yAxes: [{
                display : true,
                type: 'linear',
                ticks :{
                  // beginAtZero : true,
                  // maxTicksLimit : 10,
                  stepSize: 10,
                  suggestedMax: Math.max.apply(Math, chartInfo.data) + 5
                },
                scaleLabel : {
                  display : false,
                  labelString : '_',
                },
              }, 
            ]
            },
            responsive : true,
            maintainAspectRatio: false,
            plugins: {
              datalabels : { 
                display:  function(canvas) {
                  return canvas.dataset.data[canvas.dataIndex] > 0;
                }
              },
              filler: {
                  propagate: false
              },
            },
            title: {
                display: false,
                position : 'top',
                text: chartInfo.title,
                padding:20,
                fontSize: 14,
                fontFamily:'Open Sans',
                fontColor:'black'
            },
            tooltips : {
              mode : 'x-axis',
            },
            hover : {
              mode : 'x-axis',
              animationDuration : 0
            }
          };
        if(chartInfo.id == 'porter-perf-trend'){
          chartOptions.elements.point.pointStyle = 'circle';
          chartOptions.title.display = true;
          data = {
            labels: chartInfo.label,
            datasets: [{
              label: chartInfo.barLabel[0],
              data: chartInfo.data,
              backgroundColor: this.colour[3],
              borderColor : this.colour[3],
              fill: false
            },
          ]
          } 
        } else if(chartInfo.id == 'porter-daily'){
          chartOptions.elements.point.pointStyle = 'circle';
          chartOptions.title.display = true;
          chartOptions.legend.display = false;
          chartOptions.scales.xAxes[0].ticks.fontSize = 10;
          chartOptions.scales.xAxes[0].ticks.maxRotation = 45;
          chartOptions.scales.xAxes[0].scaleLabel.display = true;
          chartOptions.scales.xAxes[0].scaleLabel.labelString = "Date";
          chartOptions.scales.yAxes[0]['scaleLabel']['display'] = true;
          chartOptions.scales.yAxes[0]['scaleLabel']['labelString'] = "mins";
          data = {
            labels: chartInfo.label,
            datasets: [{
              data: chartInfo.data,
              backgroundColor: this.colour[3],
              borderColor : this.colour[3],
              pointBackgroundColor : '#b1ebe3',
              fill: false
            },
          ]
          } 
        } else if(chartInfo.id == 'sensor-utilz-byloc' || chartInfo.id == 'sensor-utilz-id' || chartInfo.id == 'sensor-water-leak'){
          chartOptions.elements.point.pointStyle = 'circle';
          chartOptions.elements.point.radius = 4;
          chartOptions.title.display = false;
          chartOptions.legend.display = true;
          chartOptions.plugins.datalabels.display = false;
          if(chartInfo.id == 'sensor-water-leak'){
            chartOptions.scales.yAxes=[{
              display : true,
              type: 'linear',
              ticks : {
                stepSize: false,
                suggestedMax: false,
                beginAtZero: true,
                userCallback: function(label, index, labels) {
                    if (Math.floor(label) === label) {
                        return label;
                    }
    
                },
            }}]
          }
          data = {
            labels: chartInfo.label,
            datasets: [{
              data: chartInfo.data,
              label: chartInfo.barLabel[0],
              backgroundColor: this.colour[3],
              borderColor : this.colour[3],
              fill: false
            },
          ]
          }
          if(chartInfo.id == 'sensor-utilz-byloc') {
            let chartValue = chartInfo.data;
            for(let i in chartValue) {
              chartValue[i]['backgroundColor'] = this.colour[i]
              chartValue[i]['borderColor'] = this.colour[i]
              chartValue[i]['fill'] = false
            }
            data['datasets'] = chartValue;
          } 
        } 
        else if((chartInfo.id == 'env-temp' || chartInfo.id == 'env-humid')){
          chartOptions = {
            elements: {
                point: {
                    radius: 4,  // Decrease radius to handle dense data points
                    pointStyle: 'circle' // You may switch to 'circle' for better readability
                },
                line: {
                    tension: 0.1 // Adjust tension for smoother lines
                }
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    fontSize: 12 // Decrease font size for better space management
                }
            },
            scales: {
                x: {
                    type: 'category', 
                    position: 'bottom',
                    ticks: {
                        beginAtZero: true,
                        maxTicksLimit: 10, // Increase the limit for large datasets
                        maxRotation: 0,
                        autoSkip: true, // Auto-skips some labels to avoid overlap
                        autoSkipPadding: 10 // Padding for skipped labels
                    },
                    title: {
                        display: true,
                        text: 'X Axis Label'
                    }
                },
                y: {
                    type: 'linear',
                    ticks: {
                        beginAtZero: true,
                        stepSize: 10,
                        suggestedMax: Math.max(...chartInfo.data) + 10,
                        autoSkip: true, // Auto-skips some labels to avoid overlap
                        autoSkipPadding: 10 // Padding for skipped labels
                    },
                    title: {
                        display: true,
                        text: 'Y Axis Label'
                    }
                }
            },
            spanGaps:true,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: false,
                filler: {
                    propagate: false
                },
                tooltip: {
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function (tooltipItem) {
                            return tooltipItem.dataset.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            },
            title: {
                display: false,
                position: 'top',
                text: chartInfo.title,
                padding: 10,
                font: {
                    size: 14,
                    family: 'Open Sans',
                    color: 'black'
                }
            },
            hover: {
                mode: 'nearest',
                intersect: false,
                animationDuration: 0
            }
        };
          data = {
            labels: chartInfo.label
          }
          // const updatedArray = chartInfo['data'].map(item => ({
          //   ...item,
          //   backgroundColor: "#f55b89",
          //   borderColor: "#f55b89",
          //   fill: false,
          //   data: item['data'].map(i => i != null?String(i): i)
          // }));
          // data['datasets'] = updatedArray;
          let chartValue = chartInfo.data;
            for(let i in chartValue) {
              chartValue[i]['backgroundColor'] = this.colour[i]
              chartValue[i]['borderColor'] = this.colour[i]
              chartValue[i]['fill'] = false
            }
            data['datasets'] = chartValue;
        chartOptions.elements.point.pointStyle = 'circle';
        chartOptions.elements.point.radius = 4;
        }
        else{
          data = {
            labels: chartInfo.label,
            datasets: [{
              data: chartInfo.data,
              label: chartInfo.dataLabel,
              backgroundColor: this.colour[3],
              borderColor : this.colour[3],
              fill: false
            },
            {
              data : chartInfo.minimum,
              label: 'Minimum : '+chartInfo.minimum[0],
              borderDash: [10,5],
              backgroundColor: "#a2a3a3",
              borderColor : "#a2a3a3",
              fill: false
            },
            {
              data : chartInfo.maximum,
              label : 'Maximum : '+chartInfo.maximum[0],
              borderDash: [10,5],
              backgroundColor: "#a2a3a3",
              borderColor : "#a2a3a3",
              fill: false
            },
          ]
          } 
        }
      }
        }
        mychartConfig = {
          type: 'line',
          data: data,
          options: chartOptions
        };
        if(chartInfo.id == 'sensor-utilz-byloc') {
          mychartConfig = {
            type: 'line',
            data: data
          };
        }
      } 
      if(mychartConfig.options.hasOwnProperty('plugins') == false) {
        mychartConfig.options['plugins'] = {};
      }  
      mychartConfig.options['plugins']['title'] =  {
        display: chartInfo.showTitle,
        text: chartInfo.title,
        padding: 20,
        color: 'black',
        font: {
          size: 14,
          family: 'Open Sans',
        }
      }
           // ***** UPDATED CHART SERVICE BY UPDATING OTHER INSTANCES OF CHARTS WITH SAME ID ***** //
      Object.entries(Chart.instances).forEach(([canvasId, instance]) => {
        if (instance.canvas.id === chartInfo.canvasId) {
          // Optional: Update config if needed
          // instance[1].chart.config = mychartConfig; // Access instance using index 1
      
          instance.destroy(); // Access instance using index 1
        }
      });
      this.myChart = new Chart(chartInfo.canvasId, mychartConfig);
}
  public getChartOption() {
    return {
      responsive: true, maintainAspectRatio: false,
      animation: {
        onComplete: function () {
          const chartInstance = this.chart,
            ctx = chartInstance.ctx;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          this.data.datasets.forEach(function (dataset, i) {
            const meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              const data = dataset.data[index];
              ctx.fillText(data, bar._model.x, bar._model.y - 5);
            });
          });
        }
      },
      tooltips: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        bodyFontColor: '#000',
        borderColor: '#999',
        borderWidth: 1,
        caretPadding: 15,
        colorBody: '#000',
        displayColors: false,
        enabled: true,
        intersect: true,
        mode: 'x',
        titleFontColor: '#000',
        titleMarginBottom: 10,
        xPadding: 10,
        yPadding: 10,
      },
      title: {
        text: 'Location Utilization',
        display: false
      },
      plugins: {
        datalabels: {
          align: function (context) {
            const index = context.dataIndex;
            const value = context.dataset.data[index];
            const invert = Math.abs(value) <= 1;
            return value < 1 ? 'end' : 'start';
          },
          anchor: 'end',
          backgroundColor: null,
          borderColor: null,
          borderRadius: 4,
          borderWidth: 1,
          color: '#223388',
          font: {
            size: 11,
            weight: 600
          },
          offset: 4,
          padding: 0,
          formatter: function (value) {
            return Math.round(value * 10) / 10;
          }
        }
      },
      legend: { position: 'bottom' },
      scales: {
        xAxes: [{
          barPercentage: 0.5,
          // position: 'top',
          // ticks: { beginAtZero: true, stepValue: 7, callback: function (value) { if (value % 1 === 0) { return value; } } },
          display: true,
          gridLines: {display : true,drawOnChartArea: false,
            color: '#eeeeee'
          },
          scaleLabel: {
            display: true,
            labelString: 'Location'
          }
        }],
        yAxes: [{
          // barPercentage: 0.5,
          ticks: { beginAtZero: true, stepValue: 7, callback: function (value) { if (value % 1 === 0) { return value; } } },
          display: true,
          gridLines: {display : true,drawOnChartArea: false,
            // color: '#eeeeee'
          },
          scaleLabel: {
            display: true,
            labelString: 'Time (Mins)'
          }
        }]
      }
    };
  }
}
