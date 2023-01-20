import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Observable, map, startWith } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  providers: [DatePipe],
})
export class HomePageComponent implements OnInit {
  console = console;
  //date
  @ViewChild('billing_date') billingDate?: ElementRef;
  @ViewChild('close') dimissModelDuringInvoiceCreation?: ElementRef;

  timestamp = new Date();
  invoiceUniqueNumber: any;
  invoiceCreationTimestamp: any = this.datePipe.transform(
    this.timestamp,
    'dd-MMM-yyyy HH:mm:ss'
  );
  invoiceCreationDate: any = this.datePipe.transform(
    this.timestamp,
    'yyyy-MM-dd'
  );

  grantTotal: any;
  invoiceForm: FormGroup;
  quotationForm: FormGroup;
  productForm?: FormArray;
  productListArray: any[] = [];
  gst_amount: any;
  net_amount: any;
  showGST: any;
  showAddProductItemButton: boolean = false;
  progressbarForSavingInvoice: boolean = false;
  invoiceSaved: boolean = false;
  hiddenNewInvoiceButton: boolean = false;
  firebaseDocumentIdForInvoiceGeneration: any;
  gstAmount: any;
  newGstAmount: any;
  totalProductQuantity: any;
  selectedQuantity: any;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private firestore: FirestoreService,
    private snackBar: MatSnackBar
  ) {
    this.getAlltheProductList();
    this.showAddProductItemButton = false;
    // Invoice Form
    this.invoiceForm = this.fb.group({
      system_time: new FormControl(
        this.invoiceCreationTimestamp,
        Validators.required
      ),
      customer_name: new FormControl('', Validators.required),
      customer_phone_number: new FormControl('', Validators.required),
      customer_address: new FormControl('', Validators.required),
      customer_city: new FormControl('', Validators.required),
      billing_date: new FormControl(
        this.invoiceCreationDate,
        Validators.required
      ),
      billing_uniqueNumber: new FormControl(
        this.invoiceUniqueNumber,
        Validators.required
      ),
      billing_delivery_type: new FormControl('', Validators.required),
      billing_grantTotal: new FormControl('', Validators.required),
      billing_netPay: new FormControl(''),
      billing_gst: new FormControl(''),
      billing_status: new FormControl('', Validators.required),
      billing_product_information: this.fb.array([
        this.fb.group({
          billing_product_name: new FormControl('', Validators.required),
          billing_quantity: new FormControl(''),
          billing_rate: new FormControl(''),
          billing_total_amount: new FormControl(''),
        }),
      ]),
    });
    // Quotation Form
    this.quotationForm = this.fb.group({
      system_time: new FormControl(
        this.invoiceCreationTimestamp,
        Validators.required
      ),
      customer_name: new FormControl('', Validators.required),
      customer_phone_number: new FormControl('', Validators.required),
      customer_address: new FormControl('', Validators.required),
      customer_city: new FormControl('', Validators.required),
      quotation_date: new FormControl(
        this.invoiceCreationDate,
        Validators.required
      ),
      quotation_uniqueNumber: new FormControl(
        this.invoiceUniqueNumber,
        Validators.required
      ),
      quotation_delivery_type: new FormControl('', Validators.required),
      quotation_grantTotal: new FormControl('', Validators.required),
      quotation_netPay: new FormControl(''),
      quotation_gst: new FormControl(''),
      quotation_status: new FormControl('', Validators.required),
      quotation_product_information: this.fb.array([
        this.fb.group({
          quotation_product_name: new FormControl('', Validators.required),
          quotation_quantity: new FormControl(''),
          quotation_rate: new FormControl(''),
          quotation_total_amount: new FormControl(''),
        }),
      ]),
    });
  }

  async getAlltheProductList() {
    await this.firestore.getAllProductFromFirestoreDB().subscribe((result) => {
      this.productListArray = result.map((product) => {
        return [product.payload.doc.data(), product.payload.doc.id];
      });
    });
  }

  uniqueValueGeneration() {
    this.invoiceUniqueNumber = Math.floor(Math.random() * 100000 + 1);
    this.invoiceForm.controls['billing_uniqueNumber'].setValue(
      this.invoiceUniqueNumber
    );
  }

  newProductItemForm() {
    this.showAddProductItemButton = false;
    this.productForm = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;

    this.productForm.push(this.generateNewProductRow());
  }

  generateNewProductRow() {
    return this.fb.group({
      billing_product_name: new FormControl(''),
      billing_quantity: new FormControl(''),
      billing_rate: new FormControl(''),
      billing_total_amount: new FormControl(''),
    });
  }

  get productsItem() {
    return this.invoiceForm.get('billing_product_information') as FormArray;
  }

  async removeProductItem(i: any) {
    var billing_product_information = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    billing_product_information.removeAt(i);
    await this.checkProductFormArray(i);
    await this.calculateGST();
    await this.calculateGrandTotal();
    if (i === 0) {
      await this.invoiceForm.get('billing_grantTotal')?.setValue(0);
      await this.invoiceForm.get('billing_netPay')?.setValue(0);
    }
  }

  async saveInvoices() {
    this.progressbarForSavingInvoice = true;
    await this.firestore
      .createInvoiceInsideFirestoreDB(this.invoiceForm.value)
      .then(async (invoice) => {
        this.firebaseDocumentIdForInvoiceGeneration = invoice.id;
        this.invoiceSaved = true;
        this.progressbarForSavingInvoice = false;
      })
      .catch(async (error) => {
        alert(error.message);
      });

    this.progressbarForSavingInvoice = false;

    //this.invoiceForm.reset();
  }
  resetInvoiceForm() {
    this.invoiceSaved = false;
    this.firebaseDocumentIdForInvoiceGeneration = '';
    this.newGstAmount = 0;
    this.uniqueValueGeneration();
    this.invoiceForm = this.fb.group({
      system_time: new FormControl(
        this.invoiceCreationTimestamp,
        Validators.required
      ),
      customer_name: new FormControl('', Validators.required),
      customer_phone_number: new FormControl('', Validators.required),
      customer_address: new FormControl('', Validators.required),
      customer_city: new FormControl('', Validators.required),
      billing_date: new FormControl(
        this.invoiceCreationDate,
        Validators.required
      ),
      billing_uniqueNumber: new FormControl(
        this.invoiceUniqueNumber,
        Validators.required
      ),
      billing_delivery_type: new FormControl('', Validators.required),
      billing_grantTotal: new FormControl('', Validators.required),
      billing_netPay: new FormControl(''),
      billing_gst: new FormControl(''),
      billing_status: new FormControl('', Validators.required),
      billing_product_information: this.fb.array([
        this.fb.group({
          billing_product_name: new FormControl('', Validators.required),
          billing_quantity: new FormControl(''),
          billing_rate: new FormControl(''),
          billing_total_amount: new FormControl(''),
        }),
      ]),
    });
  }

  ngOnInit(): void {
    this.invoiceForm.controls['billing_date'].setValue(
      this.invoiceCreationDate
    );
  }

  async getProductDetailsByOnOptionSelected(index: any, id: any) {
    var firebaseUniqueKey = id.substr(id.length - 20);

    await this.firestore
      .getProductById(firebaseUniqueKey)
      .subscribe((result: any) => {
        this.totalProductQuantity = result.product_total_quantity;
        var arrayControl = this.invoiceForm.get(
          'billing_product_information'
        ) as FormArray;
        arrayControl.at(index).get('billing_quantity')?.setValue(1);
        arrayControl
          .at(index)
          .get('billing_rate')
          ?.setValue(
            parseFloat(result.product_rate_for_one_quantity).toFixed(2)
          );
        var get_bill_rate = this.invoiceForm.get(
          'billing_product_information'
        ) as FormArray;
        var rate = get_bill_rate.at(index).get('billing_rate')?.value;
        var qua = get_bill_rate.at(index).get('billing_quantity')?.value;
        this.calculatePriceBasedOnQuantity(index, rate, qua);
        this.calculateGrandTotal();
        this.setGrantTotal();
        this.calculateGST();
      });
  }
  calculatePriceBasedOnQuantity(index: any, quantity: any, rate: any) {
    var totalAmountPerProductAndQuantity: any = quantity * rate;
    var getQuantityOfItemsSelected = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    getQuantityOfItemsSelected
      .at(index)
      .get('billing_total_amount')
      ?.setValue(parseFloat(totalAmountPerProductAndQuantity).toFixed(2));
    this.invoiceForm
      .get('billing_grantTotal')
      ?.setValue(parseFloat(this.grantTotal).toFixed(2));
    this.setGrantTotal();
    this.calculateGST();
  }
  changeOnQuantity(index: any, quantity: any) {
    var billing_product_information = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;

    var rate = billing_product_information.at(index).get('billing_rate')?.value;
    var totalAmountPerProductAndQuantity: any = quantity * rate;
    var TotalRate = billing_product_information
      .at(index)
      .get('billing_total_amount')
      ?.setValue(parseFloat(totalAmountPerProductAndQuantity).toFixed(2));
    this.setGrantTotal();
    this.calculateGST();
    this.stockUpdateBasedOnQuantity(index);
  }
  changeOnRate(index: any, rate: any) {
    var billing_product_information = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    var quantity = billing_product_information
      .at(index)
      .get('billing_quantity')?.value;
    var totalAmountPerProductAndQuantity: any = quantity * rate;
    var TotalQu = billing_product_information
      .at(index)
      .get('billing_total_amount')
      ?.setValue(parseFloat(totalAmountPerProductAndQuantity).toFixed(2));
    this.setGrantTotal();
    this.calculateGST();
  }

  calculateGrandTotal() {
    var value: any = 0;

    const billing_product_information = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    // console.log(billing_product_information);
    billing_product_information.controls.forEach((element, index) => {
      // console.log(Number(element.value['billing_total_amount']));
      // console.log(value + Number(element.value['billing_total_amount']));

      value = value + Number(element.value['billing_total_amount']);
      this.grantTotal = value;
    });
    this.setGrantTotal();
    this.calculateGST();
  }

  stockUpdateBasedOnQuantity(index: any) {
    var billing_product_information = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    var quantity = billing_product_information
      .at(index)
      .get('billing_quantity')?.value;

    //console.log(this.totalProductQuantity - quantity);
  }

  calculateGST() {
    this.showGST = true;
    this.gstAmount = (this.grantTotal * 18) / 100;
    this.newGstAmount = Number(parseFloat(this.gstAmount).toFixed(2));
    this.invoiceForm.get('billing_gst')?.setValue(this.newGstAmount);

    this.gst_amount = (this.grantTotal * 18) / 100 + this.grantTotal;
    this.net_amount = this.gst_amount;
    this.setGrantTotal();
    this.invoiceForm
      .get('billing_netPay')
      ?.setValue(parseFloat(this.net_amount).toFixed(2));
  }
  clearGSTCalculation() {
    this.gstAmount = 0;
    this.newGstAmount = 0;
    this.gst_amount = this.grantTotal;
    this.net_amount = this.gst_amount;
    this.setGrantTotal();
    this.invoiceForm
      .get('billing_netPay')
      ?.setValue(parseFloat(this.net_amount).toFixed(2));
    this.invoiceForm
      .get('billing_gst')
      ?.setValue(parseFloat(this.newGstAmount).toFixed(2));
  }

  GoToBillPage() {
    this.router.navigateByUrl('bills');
  }

  goToInventoryPage() {
    this.router.navigateByUrl('product-dashboard');
  }

  checkProductFormArray(i: any) {
    if (Number(i) === 0) {
      this.showAddProductItemButton = true;
    }
    if (Number(i) >= 1) {
      this.showAddProductItemButton = false;
    }
  }

  setGrantTotal() {
    this.invoiceForm
      .get('billing_grantTotal')
      ?.setValue(parseFloat(this.grantTotal).toFixed(2));
  }

  async generateInvoice() {
    await this.dimissModelDuringInvoiceCreation?.nativeElement.click();
    // await this.router.navigate([
    //   '/bills',
    //   this.firebaseDocumentIdForInvoiceGeneration,
    // ]);
  }

  goToBillingInfoPage() {
    this.router.navigateByUrl('/billing-dashboard');
  }

  goToUserInfoPage() {
    this.router.navigateByUrl('/login-info');
  }
}
