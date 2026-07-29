import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './views/home-page/home-page.component';
import { BillingPageComponent } from './views/billing-page/billing-page.component';
import { InventoryPageComponent } from './views/inventory-page/inventory-page.component';
import { BillingInfoComponent } from './views/billing-info/billing-info.component';
import { ShowBillInformationComponent } from './views/show-bill-information/show-bill-information.component';
import { LoginComponent } from './views/login/login.component';
import { UserInfoComponent } from './views/user-info/user-info.component';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'home', component: HomePageComponent },
  { path: 'bills/:id', component: BillingPageComponent },
  { path: 'product-dashboard', component: InventoryPageComponent },
  { path: 'billing-dashboard', component: BillingInfoComponent },
  { path: 'view/:id', component: ShowBillInformationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'login-info', component: UserInfoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
