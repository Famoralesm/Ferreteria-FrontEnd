import { Component } from '@angular/core';
import { HistoryOrders, HistoryProducts, HistoryCustomers, HistoryUsers, HistorySuppliers } from '../shared/history-module-components';

type HistoryTab='orders'|'products'|'customers'|'users'|'suppliers';
@Component({selector:'app-history',standalone:true,imports:[HistoryOrders,HistoryProducts,HistoryCustomers,HistoryUsers,HistorySuppliers],templateUrl:'./history.html',styleUrl:'./history.scss'})
export class History{activeTab:HistoryTab='orders';selectTab(tab:HistoryTab):void{this.activeTab=tab;}}
