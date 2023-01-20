import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore/';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from 'src/environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomePageComponent } from './views/home-page/home-page.component';
import { BillingPageComponent } from './views/billing-page/billing-page.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { InventoryPageComponent } from './views/inventory-page/inventory-page.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { SearchPipe } from './pipes/search.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StringSlicePipe } from './pipes/string-slice.pipe';
import { BillingInfoComponent } from './views/billing-info/billing-info.component';
import { MatListModule } from '@angular/material/list';
import { ShowBillInformationComponent } from './views/show-bill-information/show-bill-information.component';
import { LoginComponent } from './views/login/login.component';
import { UserInfoComponent } from './views/user-info/user-info.component';

@NgModule({
  declarations: [
    StringSlicePipe,
    AppComponent,
    HomePageComponent,
    BillingPageComponent,
    InventoryPageComponent,
    SearchPipe,
    BillingInfoComponent,
    ShowBillInformationComponent,
    LoginComponent,
    UserInfoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFirestoreModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatListModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
