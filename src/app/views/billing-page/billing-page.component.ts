import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { InvoiceLineItem } from '../invoice-sheet/invoice-sheet.component';

@Component({
  selector: 'app-billing-page',
  templateUrl: './billing-page.component.html',
  styleUrls: ['./billing-page.component.css'],
})
export class BillingPageComponent implements OnInit {
  firebaseId = '';
  billing_date = '';
  billing_delivery_type = '';
  billing_destination = '';
  billing_grantTotal: number | string = 0;
  billing_netPay: number | string = 0;
  billing_uniqueNumber: number | string = '';
  billing_gst: number | string = 0;
  billing_is_gst: 'gst' | 'non-gst' = 'non-gst';
  customer_address = '';
  customer_city = '';
  customer_name = '';
  customer_phone_number = '';
  billing_product_information: InvoiceLineItem[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.firebaseId = this.activatedRoute.snapshot.params['id'];
    this.firestoreService.getInvoiceById(this.firebaseId).subscribe((invoice: any) => {
      this.customer_name = invoice.customer_name;
      this.customer_address = invoice.customer_address;
      this.customer_city = invoice.customer_city;
      this.customer_phone_number = invoice.customer_phone_number;
      this.billing_date = invoice.billing_date;
      this.billing_delivery_type = invoice.billing_delivery_type;
      this.billing_destination = invoice.billing_destination || invoice.customer_city;
      this.billing_grantTotal = invoice.billing_grantTotal;
      this.billing_netPay = invoice.billing_netPay;
      this.billing_uniqueNumber = invoice.billing_uniqueNumber;
      this.billing_product_information = invoice.billing_product_information;
      this.billing_gst = invoice.billing_gst;
      this.billing_is_gst = invoice.billing_is_gst || (Number(invoice.billing_gst) > 0 ? 'gst' : 'non-gst');
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  print(): void {
    window.print();
  }
}
