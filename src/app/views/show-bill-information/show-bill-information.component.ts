import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-show-bill-information',
  templateUrl: './show-bill-information.component.html',
  styleUrls: ['./show-bill-information.component.css'],
})
export class ShowBillInformationComponent implements OnInit {
  firebaseId: any;

  billing_date: any;
  billing_delivery_type: any;
  billing_grantTotal: any;
  billing_netPay: any;
  billing_uniqueNumber: any;
  billing_gst: any;
  customer_address: any;
  customer_city: any;
  customer_name: any;
  customer_phone_number: any;
  system_time: any;
  billing_status: any;
  billing_product_information: any[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.firebaseId = this.activatedRoute.snapshot.params['id'];
    this.firestoreService
      .getInvoiceById(this.firebaseId)
      .subscribe((invoice: any) => {
        this.customer_name = invoice.customer_name;
        this.customer_address = invoice.customer_address;
        this.customer_city = invoice.customer_city;
        this.customer_phone_number = invoice.customer_phone_number;
        this.billing_date = invoice.billing_date;
        this.billing_delivery_type = invoice.billing_delivery_type;
        this.billing_grantTotal = invoice.billing_grantTotal;
        this.billing_netPay = invoice.billing_netPay;
        this.billing_uniqueNumber = invoice.billing_uniqueNumber;
        this.billing_product_information = invoice.billing_product_information;
        this.billing_gst = invoice.billing_gst;
        this.billing_status = invoice.billing_status;
      });
  }

  goToHome() {
    this.router.navigateByUrl('/billing-dashboard');
  }
}
