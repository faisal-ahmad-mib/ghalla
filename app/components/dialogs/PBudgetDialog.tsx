/// <reference path="../../_includes.ts" />

import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button, Col, Modal, Form, FormGroup, FormControl, ControlLabel, Radio, Glyphicon } from 'react-bootstrap';

import { EntityFactory } from '../../persistence';
import { IISOCurrency, INumberFormat, IDataFormat } from '../../interfaces/formatters';
import { DataFormats, DateWithoutTime } from '../../utilities';
import * as catalogEntities from '../../interfaces/catalogEntities';

export interface PBudgetDialogProps { 

}

export interface PBudgetDialogState {

	showModal:boolean;
	isNewBudget:boolean;
	budgetEntity:catalogEntities.IBudget;
	dataFormat:IDataFormat;
}

const LabelStyle = {
	textAlign: "right",
	paddingRight: "0px"
}

const OptionContainer = {
	display: "flex",
	flexFlow: "row nowrap",
	justifyContent: "space-between",
	alignItems: "center"
}

const FormControlStyle = {
	borderColor: '#2FA2B5',
	borderTopWidth: '2px',
	borderBottomWidth: '2px',
	borderLeftWidth: '2px',
	borderRightWidth: '2px',
}

export class PBudgetDialog extends React.Component<PBudgetDialogProps, PBudgetDialogState> {

	private ctrlBudgetName:FormControl;
	private ctrlCurrency:FormControl;
	private ctrlNumberFormat:FormControl;
	private ctrlDateFormat:FormControl;

	constructor(props: any) {
        super(props);
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
		this.save = this.save.bind(this);
		this.onCurrencySelectionChange = this.onCurrencySelectionChange.bind(this);
		this.onNumberFormatSelectionChange = this.onNumberFormatSelectionChange.bind(this);
		this.setCurrencySymbolPlacementToBefore = this.setCurrencySymbolPlacementToBefore.bind(this);
		this.setCurrencySymbolPlacementToAfter = this.setCurrencySymbolPlacementToAfter.bind(this);
		this.setCurrencySymbolPlacementToNone = this.setCurrencySymbolPlacementToNone.bind(this);
		this.onDateFormatSelectionChange = this.onDateFormatSelectionChange.bind(this);
        this.state = { 
			showModal: false,
			isNewBudget: false,
			budgetEntity: null,
			dataFormat: null
		};
    }

	private hide():void {
		// Hide the modal, and set the account in state to null
		this.setState({ showModal:false, isNewBudget:false, budgetEntity:null, dataFormat:null });
	};

	private save():void {

		// Close the modal dialog
		this.hide();
	}

	public isShowing():boolean {
		return this.state.showModal;
	}

	public show(budgetEntity:catalogEntities.IBudget = null):void {

		var isNewBudget = false;
		if(!budgetEntity) {

			isNewBudget = true;
			budgetEntity = EntityFactory.createNewBudget();
		}

		this.setState({ 
			showModal: true,
			isNewBudget: isNewBudget,
			budgetEntity: budgetEntity,
			dataFormat: JSON.parse(budgetEntity.dataFormat) 
		});
	};

	private onCurrencySelectionChange(event:React.SyntheticEvent):void {

		// Get the selected currency index from the selection control
		var currencyIndex = parseInt((ReactDOM.findDOMNode(this.ctrlCurrency) as any).value);
		// Get the currency corresponding to this index
		var currency = DataFormats.currencies[currencyIndex];
		var dataFormat = DataFormats.locale_mappings[currency.default_locale];
		dataFormat = Object.assign({}, dataFormat);

		// Update the data format in the state
		var state = Object.assign({}, this.state);
		state.dataFormat = dataFormat;
		this.setState(state);
	}

	private onNumberFormatSelectionChange(event:React.SyntheticEvent):void {

		// Get the selected number format from the selection control
		var numberFormatIndex = parseInt((ReactDOM.findDOMNode(this.ctrlNumberFormat) as any).value);
		// Get the number format corresponding to this index
		var numberFormat = DataFormats.number_formats[numberFormatIndex];
		// Update the data format in the state from this numberFormat 
		var state = Object.assign({}, this.state);
		state.dataFormat.example_format = numberFormat.example_format;
		state.dataFormat.decimal_digits = numberFormat.decimal_digits;
		state.dataFormat.decimal_separator = numberFormat.decimal_separator;
		state.dataFormat.group_separator = numberFormat.group_separator;
		this.setState(state);
	}
	
	private setCurrencySymbolPlacementToBefore():void {

		var state = Object.assign({}, this.state);
		state.dataFormat.display_symbol = true;
		state.dataFormat.symbol_first = true;
		this.setState(state);
	}

	private setCurrencySymbolPlacementToAfter():void {

		var state = Object.assign({}, this.state);
		state.dataFormat.display_symbol = true;
		state.dataFormat.symbol_first = false;
		this.setState(state);
	}

	private setCurrencySymbolPlacementToNone():void {

		var state = Object.assign({}, this.state);
		state.dataFormat.display_symbol = false;
		this.setState(state);
	}

	private onDateFormatSelectionChange(event:React.SyntheticEvent):void {
	
		// Get the selected date format from the selection control
		var dateFormat = (ReactDOM.findDOMNode(this.ctrlDateFormat) as any).value;
		// Update the date format in the state
		var state = Object.assign({}, this.state);
		state.dataFormat.date_format = dateFormat;
		this.setState(state);
	}

	private getBudgetNameControl():JSX.Element {

		return (
			<FormGroup>
				<Col componentClass={ControlLabel} sm={4} style={LabelStyle}>
					Budget Name:
				</Col>
				<Col sm={8} style={{paddingLeft:"6px"}}>
					<FormControl ref={(c)=> {this.ctrlBudgetName = c;}} type="text" style={FormControlStyle} />
				</Col>
			</FormGroup>
		);
	}

	private getCurrencySelectionControl():JSX.Element {

		// Get the current data format from the state
		var dataFormat:IDataFormat = this.state.dataFormat;
		var selectedValue = "";

		var commonCurrencyNodes:Array<JSX.Element> = [];
		var allCurrencyNodes:Array<JSX.Element> = [];
		for(var i:number = 0; i < DataFormats.currencies.length; i++) {
			var currency:IISOCurrency = DataFormats.currencies[i];
			var currencyLabel = `${currency.english_name} - ${currency.iso_code}`;
			if(currency.isCommon)
				commonCurrencyNodes.push(<option key={currency.iso_code} label={currencyLabel}>{i}</option>);
			else
				allCurrencyNodes.push(<option key={currency.iso_code} label={currencyLabel}>{i}</option>);

			// If this is the selected value, save it's index to set as the selected value in the list
			if(currency.iso_code == dataFormat.iso_code)
				selectedValue = i.toString();
		}
		
		return (
			<FormGroup>
				<Col componentClass={ControlLabel} sm={4} style={LabelStyle}>
					Currency:
				</Col>
				<Col sm={8} style={{paddingLeft:"6px"}}>
					<FormControl ref={(c)=> {this.ctrlCurrency = c;}} value={selectedValue} componentClass="select" style={FormControlStyle} onChange={this.onCurrencySelectionChange}>
						<optgroup label="Common Currencies">
							{commonCurrencyNodes}
						</optgroup>
						<optgroup label="All Currencies">
							{allCurrencyNodes}
						</optgroup>
					</FormControl>
				</Col>
			</FormGroup>
		);
	}

	private getNumberFormatSelectionControl():JSX.Element {

		// Get the current data format from the state
		var dataFormat:IDataFormat = this.state.dataFormat;
		var selectedValue = "";

		var allNumberFormatNodes:Array<JSX.Element> = [];
		for(var i:number = 0; i < DataFormats.number_formats.length; i++) {
			var numberFormat:INumberFormat = DataFormats.number_formats[i];
			allNumberFormatNodes.push(<option key={numberFormat.example_format} label={numberFormat.example_format}>{i}</option>);

			// If this is the selected value, save it's index to set as the selected value in the list
			if(numberFormat.example_format == dataFormat.example_format)
				selectedValue = i.toString();
		}

		return (
			<FormGroup>
				<Col componentClass={ControlLabel} sm={4} style={LabelStyle}>
					Number Format:
				</Col>
				<Col sm={8} style={{paddingLeft:"6px"}}>
					<FormControl ref={(c)=> {this.ctrlNumberFormat = c;}} value={selectedValue} componentClass="select" style={FormControlStyle} onChange={this.onNumberFormatSelectionChange}>
						{allNumberFormatNodes}
					</FormControl>
				</Col>
			</FormGroup>
		);		
	}

	private getCurrencySymbolPlacementControl():JSX.Element {

		// Get the current data format from the state
		var dataFormat:IDataFormat = this.state.dataFormat;
		var example_format = dataFormat.example_format;
		var currencySymbol = dataFormat.currency_symbol; 
		var beforeAmountExample = `${currencySymbol}${example_format}`;
		var afterAmountExample = `${example_format}${currencySymbol}`;
		var noneExample = `${example_format}`;

		return (
			<FormGroup>
				<Col componentClass={ControlLabel} sm={4} style={LabelStyle}>
					Currency Placement:
				</Col>
				<Col sm={8} style={{paddingLeft:"6px"}}>
					<div style={OptionContainer}>
						<Radio checked={dataFormat.display_symbol && dataFormat.symbol_first} onChange={this.setCurrencySymbolPlacementToBefore}>Before amount</Radio>
						{beforeAmountExample}
					</div>
					<div style={OptionContainer}>
						<Radio checked={dataFormat.display_symbol && !dataFormat.symbol_first} onChange={this.setCurrencySymbolPlacementToAfter}>After amount</Radio>
						{afterAmountExample}
					</div>
					<div style={OptionContainer}>
						<Radio checked={!dataFormat.display_symbol} onChange={this.setCurrencySymbolPlacementToNone}>Don't display symbol</Radio>
						{noneExample}
					</div>
				</Col>
			</FormGroup>
		);
	}

	private getDateFormatSelectionControl():JSX.Element {

		// Get the current data format from the state
		var dataFormat:IDataFormat = this.state.dataFormat;

		var currentDate = DateWithoutTime.createForToday();
		var allDateFormatNodes:Array<JSX.Element> = [];
		_.forEach(DataFormats.date_formats, (dateFormat:string)=>{
			allDateFormatNodes.push(<option key={dateFormat} label={currentDate.format(dateFormat)}>{dateFormat}</option>);
		});

		return (
			<FormGroup>
				<Col componentClass={ControlLabel} sm={4} style={LabelStyle}>
					Date Format:
				</Col>
				<Col sm={8} style={{paddingLeft:"6px"}}>
					<FormControl ref={(c)=> {this.ctrlDateFormat = c;}} value={dataFormat.date_format} componentClass="select" style={FormControlStyle} onChange={this.onDateFormatSelectionChange}>
						{allDateFormatNodes}
					</FormControl>
				</Col>
			</FormGroup>
		);		
	}
	public render() {

		if(this.state.showModal) {

			var dialogTitle = this.state.isNewBudget ? "Create a new budget" : "Budget Settings";
			var saveButtonLabel = this.state.isNewBudget ? "Create Budget" : "Apply Settings";
			var budgetNameControl = this.getBudgetNameControl();
			var currencySelectionControl = this.getCurrencySelectionControl();
			var numberFormatSelectionControl = this.getNumberFormatSelectionControl();
			var currencyPlacementControl = this.getCurrencySymbolPlacementControl();
			var dateFormatSelectionControl = this.getDateFormatSelectionControl();

			return (
				<Modal show={this.state.showModal} animation={true} onHide={this.hide} backdrop="static" keyboard={false} dialogClassName="create-budget-dialog">
					<Modal.Header bsClass="modal-header">
						<Modal.Title>{dialogTitle}</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<Form horizontal>
							{budgetNameControl}
							{currencySelectionControl}
							{numberFormatSelectionControl}
							{currencyPlacementControl}
							{dateFormatSelectionControl}
						</Form>
					</Modal.Body>
					<Modal.Footer>
						<Button className="dialog-secondary-button" onClick={this.hide}>
							Cancel&nbsp;<Glyphicon glyph="remove-sign" />
						</Button>
						<Button className="dialog-primary-button" onClick={this.save}>
							{saveButtonLabel}&nbsp;<Glyphicon glyph="ok-sign" />
						</Button>
					</Modal.Footer>
				</Modal>
			);
		}
		else {
			return <div />;
		}
	}
}
