import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { BillingComponent } from './pages/billing/billing.component';
import { QuotationComponent } from './pages/quotation/quotation.component';
import { InventoryComponent } from './pages/inventory/inventory.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'billing', component: BillingComponent },
  { path: 'quotation', component: QuotationComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: '**', redirectTo: '' },
];
