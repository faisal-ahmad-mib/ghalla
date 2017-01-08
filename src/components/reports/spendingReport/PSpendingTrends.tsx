/// <reference path="../../../_includes.ts" />

import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

const pattern = require('patternomaly');
const { Chart } = require('chart.js');

import { UIConstants } from '../../../constants';
import { IReportState } from '../../../interfaces/state';
import { DataFormatter, DateWithoutTime, SimpleObjectMap } from '../../../utilities';
import { ISpendingReportItemData } from '../../../interfaces/reports';
import { SpendingReportData } from './SpendingReportData';

export interface PSpendingTrendsProps {
	dataFormatter:DataFormatter;
	reportState:IReportState;
	masterCategoryId:string;
	reportData:SpendingReportData;
}

const ChartContainerStyle:React.CSSProperties = {
	flex: "1 1 auto",
	display: "flex",
	width: "100%",
	height: "100%",
	justifyContent: "center",
	alignItems: "center",
	minWidth: UIConstants.ReportsChartMinWidth
}

export class PSpendingTrends extends React.Component<PSpendingTrendsProps, {}> {

	private chart:any;
	private refCanvas:HTMLCanvasElement;

	private initializeChart(props:PSpendingTrendsProps) {

		var element = ReactDOM.findDOMNode(this.refCanvas) as any;
      	var ctx = element.getContext("2d");
		var dataFormatter = props.dataFormatter;

		this.chart = new Chart(ctx, {
			type: 'bar',
			data: this.buildDataObject(props),
			options: {
				layout: {
					padding: {top:100, bottom:100, left:25, right:25}
				},
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
						stacked: true
					}],
					yAxes: [{
						stacked: true,
						ticks: {
							callback: (value, index, values)=>{
								return dataFormatter.formatCurrency(value);
							}
						}
					}],
		        },
				tooltips: {
					position: "nearest",
					displayColors: false,
					backgroundColor: "#F5F6F8",
					titleFontColor: "#000000",
					bodyFontColor: "#000000",
					bodyFontSize: 16,
					bodyFontStyle: "bold",
					footerFontColor: "#000000",
					callbacks: {
						title: (tooltipItems, data)=>{
							var tooltipItem = tooltipItems[0];
							var title = data.datasets[tooltipItem.datasetIndex].label;
							return title;
						},
						label: (tooltipItem, data)=>{
							var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
							var formattedValue = dataFormatter.formatCurrency(value);
							return formattedValue;
						},
						footer: (tooltipItems, data)=>{

							var tooltipItem = tooltipItems[0];
							if(tooltipItem.datasetIndex == 0) {
								// We are currently hovering over the totals line chart
								// Instead of showing the percentage of total value, we are going to show the month name
								var monthString = "01/" + tooltipItem.xLabel;
								var date = DateWithoutTime.createFromString(monthString, "DD/MM/YYYY");
								return date.format("MMM YYYY");
							}
							else {
								var sumOfAllValues = _.reduce(data.datasets, (sum, dataset:any)=>{
									return sum + dataset.data[tooltipItem.index];
								}, 0);

								var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
								var percentage = value == 0 ? 0 : value/sumOfAllValues*100;
								return `${Math.round(percentage*100)/100}% of Total`;	
							}
						}
					}
				},
			}
		});
	}

	private buildDataObject(props:PSpendingTrendsProps):any {

		var reportData = props.reportData;
		var data = {
			labels: reportData.getAllMonthNames(),
			datasets: this.buildDatasets(props)
		};

		return data;
	}

	private updateDataObject(props:PSpendingTrendsProps):void {

		var reportData = props.reportData;
		var labels = reportData.getAllMonthNames();
		var datasets = this.buildDatasets(props);
		// Update the chart data with these new values
		this.chart.data.labels = labels;
		this.chart.data.datasets = datasets;
	}

	private buildDatasets(props:PSpendingTrendsProps):Array<any> {

		var reportData = props.reportData;
		let datasets:Array<any> = [];
		// First add a dataset for the line chart
		let dataSet = {
			type: 'line',
			fill: false,
			lineTension: 0,
			label: 'Total Spending',
			borderColor: "#333333",
			pointBorderWidth: 2,
			pointBorderColor: "#333333",
			pointBackgroundColor: "#E5F5F9",
			pointHoverBackgroundColor: "#E5F5F9",
			pointRadius: 6,
			pointHoverRadius: 6,
			data: reportData.getMonthlyTotalValues()
		};
		datasets.push(dataSet);

		// Add dataset for each item in the report data
		var itemIds = reportData.getOverallSortedItemIds();
		var itemNames = reportData.getOverallSortedItemNames();
		var colors = UIConstants.ChartColors;

		for(var i:number = 0; i < itemIds.length; i++) {

			var itemId = itemIds[i];
			var monthlyItemValues = reportData.getMonthlyValuesForItem(itemId);
			var color = colors[i];
			// We want a colors array of the same length as the values array. Would contain the same color as this 
			// item is going to be represented by the same color in all months.
			var backgroundColors:Array<string> = [];
			var borderColors:Array<string> = [];
			var hoverBackgroundColors:Array<string> = [];
			var hoverBorderColors:Array<string> = [];
			for(var k:number = 0; k < monthlyItemValues.length; k++) {
				backgroundColors.push(color);
				borderColors.push(color);
				hoverBackgroundColors.push(color);
				hoverBorderColors.push(color);
			}

			let dataSet = {
				label: itemNames[i],
				backgroundColor: backgroundColors,
				borderColor: borderColors,
				hoverBackgroundColor: hoverBackgroundColors,
				hoverBorderColor: hoverBorderColors,
				borderWidth: 1,
				data: monthlyItemValues
			};

			datasets.push(dataSet);
		}

		return datasets;
	}

	public componentDidMount():void {

		this.initializeChart(this.props);
	}

	public componentWillUnmount():void {

		var chart = this.chart;
      	chart.destroy();
	}

	public componentWillReceiveProps(nextProps:PSpendingTrendsProps):void {

		this.updateDataObject(nextProps);
		this.chart.update();
	}

	public render() {

		return (
			<div style={ChartContainerStyle}>
				<canvas 
					style={{width: "100%", height: "100%"}}
					ref={(c)=> this.refCanvas = c }
				/>
			</div>
		);
	}
}