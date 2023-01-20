import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-billing-info',
  templateUrl: './billing-info.component.html',
  styleUrls: ['./billing-info.component.css'],
})
export class BillingInfoComponent implements OnInit {
  invoiceArray: any[] = [];

  constructor(private router: Router, private firestore: FirestoreService) {}

  ngOnInit(): void {
    this.firestore.getAllInvoiceFromFirestoreDB().subscribe((response) => {
      this.invoiceArray = response.map((invoice) => {
        return [invoice.payload.doc.data(), invoice.payload.doc.id];
      });
    });
  }

  goToHomePage() {
    this.router.navigateByUrl('/home');
  }

  viewBill(id: any) {
    console.log(id);
  }
}
