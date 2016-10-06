/// <reference path="../../../_includes.ts" />

import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { PHeaderRow } from './PHeaderRow';
import { PMasterCategoryRow } from './PMasterCategoryRow';
import { PSubCategoryRow } from './PSubCategoryRow';

import { SubCategoriesArray } from '../../../collections';
import { DateWithoutTime, SimpleObjectMap } from '../../../utilities';
import { IEntitiesCollection, ISimpleEntitiesCollection, IBudgetState } from '../../../interfaces/state';
import * as budgetEntities from '../../../interfaces/budgetEntities';

export interface PMonthlyBudgetProps {
	currentMonth:DateWithoutTime;
	entitiesCollection:IEntitiesCollection;
	editingSubCategory:string;
	selectedSubCategories:Array<string>;
	selectedSubCategoriesMap:SimpleObjectMap<boolean>;
	selectedMasterCategoriesMap:SimpleObjectMap<boolean>;
	// Local UI state updation functions
	selectSubCategory:(subCategory:budgetEntities.ISubCategory, unselectAllOthers:boolean, setAsEditing:boolean)=>void;
	unselectSubCategory:(subCategory:budgetEntities.ISubCategory)=>void;
	selectMasterCategory:(masterCategory:budgetEntities.IMasterCategory, unselectAllOthers:boolean)=>void;
	unselectMasterCategory:(masterCategory:budgetEntities.IMasterCategory)=>void;
	selectSubCategoryForEditing:(subCategoryId:string)=>void;
	selectNextSubCategoryForEditing:()=>void;
	selectPreviousSubCategoryForEditing:()=>void;
	showCreateCategoryDialog:(masterCategoryId:string, element:HTMLElement)=>void;
	showSubCategoryEditDialog:(subCategoryId:string, element:HTMLElement)=>void;
	showMasterCategoryEditDialog:(masterCategoryId:string, element:HTMLElement)=>void;
	showCoverOverspendingDialog:(subCategoryId:string, amountToCover:number, element:HTMLElement, placement?:string)=>void;
	showMoveMoneyDialog:(subCategoryId:string, amountToMove:number, element:HTMLElement, placement?:string)=>void;
	// Dispatcher Functions
	updateEntities:(entities:ISimpleEntitiesCollection)=>void;
}

const MonthlyBudgetContainerStyle = {
	flex: "1 1 auto",
	minWidth: "600px",
	backgroundColor: "#FFFFFF",
	borderColor: "#DFE4E9",
	borderStyle: "solid",
	borderTopWidth: "1px",
	borderBottomWidth: "0px",
	borderRightWidth: "1px",
	borderLeftWidth: "0px"
}

const MonthlyBudgetSubContainerStyle = {
	width: "100%",
	height: "100%",
	display: "flex",
	flexFlow: 'column nowrap',
	overflowY: "scroll"
}

export class PMonthlyBudget extends React.Component<PMonthlyBudgetProps, {}> {

	constructor(props: any) {
        super(props);
	}

	private getBudgetRows(masterCategory:budgetEntities.IMasterCategory, 
							subCategoriesArray:SubCategoriesArray,
							monthlySubCategoryBudgetsMap:SimpleObjectMap<budgetEntities.IMonthlySubCategoryBudget>,
							createSubCategoryRows:boolean = true):JSX.Element {

		var masterCategoryRow:JSX.Element;
		var subCategoryRows:Array<JSX.Element> = [];
		var monthlySubCategoryBudgets:Array<budgetEntities.IMonthlySubCategoryBudget> = [];

		var subCategories = subCategoriesArray.getVisibleNonTombstonedSubCategoriesForMasterCategory(masterCategory.entityId);
		_.forEach(subCategories, (subCategory)=>{

			var monthlySubCategoryBudget = monthlySubCategoryBudgetsMap[subCategory.entityId];
			monthlySubCategoryBudgets.push(monthlySubCategoryBudget);

			if(createSubCategoryRows) {

				var subCategoryRow = (
					<PSubCategoryRow key={subCategory.entityId} 
						subCategory={subCategory} monthlySubCategoryBudget={monthlySubCategoryBudget}
						editingSubCategory={this.props.editingSubCategory}
						selectedSubCategories={this.props.selectedSubCategories} 
						selectedSubCategoriesMap={this.props.selectedSubCategoriesMap}
						selectSubCategory={this.props.selectSubCategory}
						unselectSubCategory={this.props.unselectSubCategory}
						selectSubCategoryForEditing={this.props.selectSubCategoryForEditing}
						selectNextSubCategoryForEditing={this.props.selectNextSubCategoryForEditing}
						selectPreviousSubCategoryForEditing={this.props.selectPreviousSubCategoryForEditing}
						showSubCategoryEditDialog={this.props.showSubCategoryEditDialog}
						showCoverOverspendingDialog={this.props.showCoverOverspendingDialog}
						showMoveMoneyDialog={this.props.showMoveMoneyDialog}
						updateEntities={this.props.updateEntities} />
				);
				subCategoryRows.push(subCategoryRow);
			}
		});

		masterCategoryRow = (
				<PMasterCategoryRow
					key={masterCategory.entityId} 
					masterCategory={masterCategory} 
					subCategories={subCategories} 
					monthlySubCategoryBudgets={monthlySubCategoryBudgets}
					selectedMasterCategoriesMap={this.props.selectedMasterCategoriesMap}
					selectMasterCategory={this.props.selectMasterCategory}
					unselectMasterCategory={this.props.unselectMasterCategory}
					showMasterCategoryEditDialog={this.props.showMasterCategoryEditDialog}
					showCreateCategoryDialog={this.props.showCreateCategoryDialog}>
					{subCategoryRows}
				</PMasterCategoryRow>
		);

		return masterCategoryRow;
	}

	public render() {

		var masterCategoryRow:JSX.Element; 
		var masterCategoryRows:Array<JSX.Element> = [];

		var masterCategoriesArray = this.props.entitiesCollection.masterCategories;
		var subCategoriesArray = this.props.entitiesCollection.subCategories;
		var monthlySubCategoryBudgetsArray = this.props.entitiesCollection.monthlySubCategoryBudgets;

		if(masterCategoriesArray) {

			// Get the MonthlySubCategoryBudget entities for the current month
			var monthString = this.props.currentMonth.toISOString();
			var monthlySubCategoryBudgets = monthlySubCategoryBudgetsArray.getMonthlySubCategoryBudgetsByMonth(monthString);
			// Create a map of these monthly subcategory budget entities by subCategoryId
			var monthlySubCategoryBudgetsMap:SimpleObjectMap<budgetEntities.IMonthlySubCategoryBudget> = {};
			_.forEach(monthlySubCategoryBudgets, (monthlySubCategoryBudget)=>{
				monthlySubCategoryBudgetsMap[monthlySubCategoryBudget.subCategoryId] = monthlySubCategoryBudget;
			});

			// Add the Debt Payment master category row at the top, provided we have any debt categories
			var debtPaymentMasterCategory = masterCategoriesArray.getDebtPaymentMasterCategory();
			var debtPaymentSubCategories = subCategoriesArray.getVisibleNonTombstonedSubCategoriesForMasterCategory(debtPaymentMasterCategory.entityId);
			if(debtPaymentSubCategories.length > 0) {
				masterCategoryRow = this.getBudgetRows(debtPaymentMasterCategory, subCategoriesArray, monthlySubCategoryBudgetsMap);
				masterCategoryRows.push(masterCategoryRow);
			}

			// Iterate through the rest of the master categories and create rows for them
			_.forEach(masterCategoriesArray, (masterCategory)=>{
				// Skip the Internal Master Categories
				if(masterCategory.isTombstone == 0 && masterCategory.isHidden == 0 && !masterCategory.internalName) {

					masterCategoryRow = this.getBudgetRows(masterCategory, subCategoriesArray, monthlySubCategoryBudgetsMap);
					masterCategoryRows.push(masterCategoryRow);
				}
			});

			// If there are hidden master categories or subcategories, then we are going to show a row
			// for the HiddenMasterCategory as well
			var hiddenSubCategories = subCategoriesArray.getHiddenSubCategories();
			if(hiddenSubCategories.length > 0) {

				var hiddenMasterCategory = masterCategoriesArray.getHiddenMasterCategory();
				masterCategoryRow = this.getBudgetRows(hiddenMasterCategory, subCategoriesArray, monthlySubCategoryBudgetsMap, false);
				masterCategoryRows.push(masterCategoryRow);
			}
		}

    	return (
			<div style={MonthlyBudgetContainerStyle}>
				<PHeaderRow />
				<div style={MonthlyBudgetSubContainerStyle}>
					{masterCategoryRows}
				</div>
			</div>
		);
  	}
}