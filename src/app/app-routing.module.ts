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
  { component: HomePageComponent, path: '' },
  { component: HomePageComponent, path: 'home' },
  { component: BillingPageComponent, path: 'bills/:id' },
  { component: InventoryPageComponent, path: 'product-dashboard' },
  { component: BillingInfoComponent, path: 'billing-dashboard' },
  {
    component: ShowBillInformationComponent,
    path: 'view/:id',
  },
  {
    component: LoginComponent,
    path: 'login',
  },
  {
    component: UserInfoComponent,
    path: 'login-info',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
