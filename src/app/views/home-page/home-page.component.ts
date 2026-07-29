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
import {
  getControlError,
  markAllControlsTouched,
  minLengthTrimmed,
  phoneValidator,
} from 'src/app/utils/form-validators';

interface InvoiceCustomer {
  customer_name: string;
  customer_phone_number: string;
  customer_address: string;
  customer_city: string;
  sourceId?: string;
}

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

  grantTotal = 0;
  invoiceForm: FormGroup;
  quotationForm: FormGroup;
  productForm?: FormArray;
  productListArray: any[] = [];
  customerList: InvoiceCustomer[] = [];
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
  activeCustomerField: 'phone' | 'name' | null = null;
  readonly customerSearchMinChars = 2;
  readonly customerSearchLimit = 12;
  productRowSuggestOpen: Record<number, boolean> = {};
  rowProductDraft: Record<number, string> = {};
  activeProductRowIndex: number | null = null;
  readonly productSearchMinChars = 2;
  readonly productSearchLimit = 12;
  invoiceSubmitted = false;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private firestore: FirestoreService,
    private snackBar: MatSnackBar
  ) {
    this.getAlltheProductList();
    this.loadCustomers();
    this.showAddProductItemButton = false;
    this.invoiceForm = this.buildInvoiceForm();
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

  buildInvoiceForm(): FormGroup {
    return this.fb.group({
      system_time: new FormControl(this.invoiceCreationTimestamp, Validators.required),
      customer_name: new FormControl('', [Validators.required, minLengthTrimmed(2)]),
      customer_phone_number: new FormControl('', [Validators.required, phoneValidator]),
      customer_address: new FormControl('', [Validators.required, minLengthTrimmed(5)]),
      customer_city: new FormControl('', Validators.required),
      billing_date: new FormControl(this.invoiceCreationDate, Validators.required),
      billing_uniqueNumber: new FormControl(this.invoiceUniqueNumber, Validators.required),
      billing_delivery_type: new FormControl('', Validators.required),
      billing_destination: new FormControl(''),
      billing_is_gst: new FormControl('non-gst', Validators.required),
      billing_grantTotal: new FormControl('', [Validators.required, Validators.min(1)]),
      billing_netPay: new FormControl(''),
      billing_gst: new FormControl(''),
      billing_status: new FormControl('', Validators.required),
      billing_product_information: this.fb.array([this.generateNewProductRow()]),
    });
  }

  productNameFromValue(value: string): string {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      return '';
    }
    const match = this.productListArray.find(
      (product) => `${product[0]?.product_name} ${product[1]}` === trimmed
    );
    return match ? String(match[0]?.product_name || '') : trimmed;
  }

  resolveProductSelection(raw: string): string | null {
    const trimmed = (raw || '').trim();
    if (!trimmed) {
      return null;
    }

    const exact = this.productListArray.find(
      (product) => `${product[0]?.product_name} ${product[1]}` === trimmed
    );
    if (exact) {
      return `${exact[0]?.product_name} ${exact[1]}`;
    }

    const byName = this.productListArray.filter(
      (product) =>
        String(product[0]?.product_name || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (byName.length === 1) {
      return `${byName[0][0]?.product_name} ${byName[0][1]}`;
    }

    const partial = this.productListArray.filter((product) =>
      String(product[0]?.product_name || '')
        .toLowerCase()
        .includes(trimmed.toLowerCase())
    );
    if (partial.length === 1) {
      return `${partial[0][0]?.product_name} ${partial[0][1]}`;
    }

    return null;
  }

  closeSuggestLater(callback: () => void): void {
    setTimeout(callback, 150);
  }

  closeCustomerSuggest(): void {
    this.closeSuggestLater(() => {
      this.activeCustomerField = null;
    });
  }

  onCustomerPhoneFocus(): void {
    this.activeCustomerField = 'phone';
  }

  onCustomerNameFocus(): void {
    this.activeCustomerField = 'name';
  }

  onCustomerPhoneInput(value: string): void {
    this.activeCustomerField = 'phone';
    const digits = this.normalizePhone(value);
    if (digits.length === 10) {
      const customer = this.findCustomerByPhone(digits);
      if (customer) {
        this.fillCustomer(customer);
        this.activeCustomerField = null;
      }
    }
  }

  onCustomerNameInput(value: string): void {
    this.activeCustomerField = 'name';
    const customer = this.findCustomerByName(value);
    if (customer && value.trim().toLowerCase() === customer.customer_name.trim().toLowerCase()) {
      this.fillCustomer(customer);
      this.activeCustomerField = null;
    }
  }

  normalizePhone(phone: string): string {
    return String(phone || '').replace(/\D/g, '').slice(0, 10);
  }

  activeCustomerSearch(): {
    items: InvoiceCustomer[];
    total: number;
    truncated: boolean;
    needsMoreChars: boolean;
  } {
    if (!this.activeCustomerField) {
      return { items: [], total: 0, truncated: false, needsMoreChars: true };
    }
    const phoneQuery = String(this.invoiceForm.get('customer_phone_number')?.value || '');
    const nameQuery = String(this.invoiceForm.get('customer_name')?.value || '');
    return this.searchCustomers(phoneQuery, nameQuery);
  }

  customerMatchesSearch(customer: InvoiceCustomer, phoneQuery: string, nameQuery: string): boolean {
    const phoneDigits = this.normalizePhone(phoneQuery);
    const nameText = nameQuery.trim().toLowerCase();
    const nameDigits = this.normalizePhone(nameQuery);
    const customerPhone = this.normalizePhone(customer.customer_phone_number);
    const customerName = customer.customer_name.trim().toLowerCase();

    if (phoneDigits.length >= this.customerSearchMinChars && customerPhone.includes(phoneDigits)) {
      return true;
    }
    if (nameText.length >= this.customerSearchMinChars && customerName.includes(nameText)) {
      return true;
    }
    if (nameDigits.length >= this.customerSearchMinChars && customerPhone.includes(nameDigits)) {
      return true;
    }
    const phoneText = phoneQuery.trim().toLowerCase();
    if (phoneText.length >= this.customerSearchMinChars && customerName.includes(phoneText)) {
      return true;
    }
    return false;
  }

  searchCustomers(phoneQuery: string, nameQuery: string): {
    items: InvoiceCustomer[];
    total: number;
    truncated: boolean;
    needsMoreChars: boolean;
  } {
    const phoneDigits = this.normalizePhone(phoneQuery);
    const nameText = nameQuery.trim();
    const nameDigits = this.normalizePhone(nameQuery);
    const phoneText = phoneQuery.trim();
    const hasQuery =
      phoneDigits.length >= this.customerSearchMinChars ||
      phoneText.length >= this.customerSearchMinChars ||
      nameText.length >= this.customerSearchMinChars ||
      nameDigits.length >= this.customerSearchMinChars;

    if (!hasQuery) {
      return { items: [], total: 0, truncated: false, needsMoreChars: true };
    }

    const matches = this.customerList.filter((customer) =>
      this.customerMatchesSearch(customer, phoneQuery, nameQuery)
    );

    return {
      items: matches.slice(0, this.customerSearchLimit),
      total: matches.length,
      truncated: matches.length > this.customerSearchLimit,
      needsMoreChars: false,
    };
  }

  pickCustomer(customer: InvoiceCustomer): void {
    this.fillCustomer(customer);
    this.activeCustomerField = null;
  }

  closeProductRowSuggest(index: number): void {
    this.closeSuggestLater(() => {
      this.setRowSuggestOpen(index, false);
      if (this.activeProductRowIndex === index) {
        this.activeProductRowIndex = null;
      }
    });
  }

  onProductRowFocus(index: number): void {
    this.activeProductRowIndex = index;
    this.setRowSuggestOpen(index, true);
  }

  activeRowProductSearch(): {
    items: string[];
    total: number;
    truncated: boolean;
    needsMoreChars: boolean;
  } {
    if (this.activeProductRowIndex === null) {
      return { items: [], total: 0, truncated: false, needsMoreChars: true };
    }
    return this.searchProducts(this.getRowProductDisplay(this.activeProductRowIndex));
  }

  searchProducts(raw: string): {
    items: string[];
    total: number;
    truncated: boolean;
    needsMoreChars: boolean;
  } {
    const query = this.productNameFromValue(raw || '').trim().toLowerCase();
    if (query.length < this.productSearchMinChars) {
      return { items: [], total: 0, truncated: false, needsMoreChars: true };
    }

    const matches = this.productListArray.filter((product) =>
      String(product[0]?.product_name || '')
        .toLowerCase()
        .includes(query)
    );

    const items = matches
      .slice(0, this.productSearchLimit)
      .map((product) => String(product[0]?.product_name || '').trim())
      .filter(Boolean);

    return {
      items,
      total: matches.length,
      truncated: matches.length > this.productSearchLimit,
      needsMoreChars: false,
    };
  }

  rowProductSuggestions(raw: string): string[] {
    return this.searchProducts(raw).items;
  }

  setRowSuggestOpen(index: number, open: boolean): void {
    this.productRowSuggestOpen[index] = open;
  }

  isRowSuggestOpen(index: number): boolean {
    return !!this.productRowSuggestOpen[index];
  }

  onProductRowInput(index: number, value: string): void {
    this.rowProductDraft[index] = value;
    this.productsItem.at(index).get('billing_product_name')?.setValue(value);
    this.setRowSuggestOpen(index, true);
  }

  getRowProductDisplay(index: number): string {
    if (this.rowProductDraft[index] !== undefined) {
      return this.rowProductDraft[index];
    }
    return this.productNameFromValue(
      String(this.productsItem.at(index).get('billing_product_name')?.value || '')
    );
  }

  clearRowProductDraft(index: number): void {
    delete this.rowProductDraft[index];
  }

  pickProductRow(index: number, name: string): void {
    this.setRowSuggestOpen(index, false);
    this.activeProductRowIndex = null;
    this.clearRowProductDraft(index);
    this.onProductFieldChange(index, name);
  }

  onProductFieldChange(index: number, raw: string): void {
    const resolved = this.resolveProductSelection(raw);
    if (!resolved) {
      return;
    }
    this.clearRowProductDraft(index);
    const row = this.productsItem.at(index);
    row.get('billing_product_name')?.setValue(resolved);
    this.getProductDetailsByOnOptionSelected(index, resolved);
    this.calculateGrandTotal();
  }

  fieldError(name: string): string {
    return getControlError(this.invoiceForm.get(name), this.invoiceFieldLabel(name));
  }

  productRowError(index: number, name: string): string {
    const row = (this.invoiceForm.get('billing_product_information') as FormArray).at(index);
    return getControlError(row.get(name), this.productFieldLabel(name));
  }

  invoiceFieldLabel(name: string): string {
    const labels: Record<string, string> = {
      customer_name: 'Customer name',
      customer_phone_number: 'Phone',
      customer_address: 'Address',
      customer_city: 'City',
      billing_delivery_type: 'Delivery mode',
      billing_destination: 'Destination',
      billing_status: 'Status',
      billing_grantTotal: 'Grand total',
    };
    return labels[name] || name;
  }

  productFieldLabel(name: string): string {
    const labels: Record<string, string> = {
      billing_product_name: 'Product',
      billing_quantity: 'Quantity',
      billing_rate: 'Rate',
    };
    return labels[name] || name;
  }

  updateDestinationValidators(): void {
    const destination = this.invoiceForm.get('billing_destination');
    if (this.invoiceForm.get('billing_is_gst')?.value === 'gst') {
      destination?.setValidators([Validators.required, minLengthTrimmed(2)]);
    } else {
      destination?.clearValidators();
      destination?.setValue('');
    }
    destination?.updateValueAndValidity();
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
      billing_product_name: new FormControl('', Validators.required),
      billing_quantity: new FormControl('', [Validators.required, Validators.min(1)]),
      billing_rate: new FormControl('', [Validators.required, Validators.min(0.01)]),
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
    await this.applyTaxIfNeeded();
    await this.calculateGrandTotal();
    if (i === 0) {
      await this.invoiceForm.get('billing_grantTotal')?.setValue(0);
      await this.invoiceForm.get('billing_netPay')?.setValue(0);
    }
  }

  async saveInvoices() {
    this.invoiceSubmitted = true;
    markAllControlsTouched(this.invoiceForm);
    this.updateDestinationValidators();

    if (this.invoiceForm.invalid) {
      this.snackBar.open('Please fix the highlighted fields', 'Close', { duration: 3000 });
      return;
    }

    this.progressbarForSavingInvoice = true;
    await this.saveCustomerIfNew();
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
    this.invoiceSubmitted = false;
    this.firebaseDocumentIdForInvoiceGeneration = '';
    this.newGstAmount = 0;
    this.grantTotal = 0;
    this.activeCustomerField = null;
    this.productRowSuggestOpen = {};
    this.rowProductDraft = {};
    this.activeProductRowIndex = null;
    this.uniqueValueGeneration();
    this.invoiceForm = this.buildInvoiceForm();
    this.updateDestinationValidators();
  }

  onBillTypeChange(): void {
    this.updateDestinationValidators();
    if (this.invoiceForm.get('billing_is_gst')?.value === 'gst') {
      this.calculateGST();
      return;
    }
    this.clearGSTCalculation();
    this.showGST = false;
  }

  shouldApplyGst(): boolean {
    return this.invoiceForm.get('billing_is_gst')?.value === 'gst';
  }

  applyTaxIfNeeded(): void {
    if (this.shouldApplyGst()) {
      this.calculateGST();
      return;
    }
    this.clearGSTCalculation();
  }

  ngOnInit(): void {
    this.invoiceForm.controls['billing_date'].setValue(
      this.invoiceCreationDate
    );
    this.invoiceForm.get('billing_grantTotal')?.setValue('0.00');
    this.invoiceForm.get('billing_netPay')?.setValue('0.00');
  }

  safeAmount(value: unknown): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  }

  formatAmount(value: unknown): string {
    return this.safeAmount(value).toFixed(2);
  }

  displayAmount(controlName: 'billing_grantTotal' | 'billing_netPay'): string {
    return this.formatAmount(this.invoiceForm.get(controlName)?.value);
  }

  loadCustomers(): void {
    this.firestore.getAllCustomersFromFirestoreDB().subscribe((response) => {
      const fromDb = response.map((row: any) => {
        const data = row.payload.doc.data();
        return {
          customer_name: String(data.customer_name || ''),
          customer_phone_number: String(data.customer_phone_number || ''),
          customer_address: String(data.customer_address || ''),
          customer_city: String(data.customer_city || ''),
          sourceId: row.payload.doc.id as string,
        } as InvoiceCustomer;
      });
      this.mergeCustomers(fromDb);
    });

    this.firestore.getAllInvoiceFromFirestoreDB().subscribe((response) => {
      const fromInvoices = response.map((row: any) => {
        const data = row.payload.doc.data();
        return {
          customer_name: String(data.customer_name || ''),
          customer_phone_number: String(data.customer_phone_number || ''),
          customer_address: String(data.customer_address || ''),
          customer_city: String(data.customer_city || ''),
        } as InvoiceCustomer;
      });
      this.mergeCustomers(fromInvoices);
    });
  }

  mergeCustomers(rows: InvoiceCustomer[]): void {
    const byPhone = new Map<string, InvoiceCustomer>();
    for (const customer of [...this.customerList, ...rows]) {
      const phone = this.normalizePhone(customer.customer_phone_number);
      const key = phone || `${customer.customer_name.trim().toLowerCase()}|${customer.customer_address.trim().toLowerCase()}`;
      if (!key) {
        continue;
      }
      const existing = byPhone.get(key);
      if (!existing || (!existing.sourceId && customer.sourceId)) {
        byPhone.set(key, customer);
      }
    }
    this.customerList = [...byPhone.values()].sort((a, b) =>
      a.customer_name.localeCompare(b.customer_name)
    );
  }

  findCustomerByName(name: string): InvoiceCustomer | undefined {
    const normalized = name.trim().toLowerCase();
    return this.customerList.find(
      (customer) => customer.customer_name.trim().toLowerCase() === normalized
    );
  }

  findCustomerByPhone(phone: string): InvoiceCustomer | undefined {
    const normalized = this.normalizePhone(phone);
    if (!normalized) {
      return undefined;
    }
    return this.customerList.find(
      (customer) => this.normalizePhone(customer.customer_phone_number) === normalized
    );
  }

  fillCustomer(customer: InvoiceCustomer): void {
    this.invoiceForm.patchValue({
      customer_name: customer.customer_name,
      customer_phone_number: this.normalizePhone(customer.customer_phone_number),
      customer_address: customer.customer_address,
      customer_city: customer.customer_city,
    });
  }

  onCustomerNamePick(value: string): void {
    const customer = this.findCustomerByName(value);
    if (customer) {
      this.fillCustomer(customer);
    }
  }

  onCustomerPhonePick(value: string): void {
    const customer = this.findCustomerByPhone(value);
    if (customer) {
      this.fillCustomer(customer);
    }
  }

  isNewCustomer(): boolean {
    const name = String(this.invoiceForm.get('customer_name')?.value || '').trim();
    const phone = this.normalizePhone(String(this.invoiceForm.get('customer_phone_number')?.value || ''));
    if (!name && !phone) {
      return false;
    }
    if (phone && this.findCustomerByPhone(phone)) {
      return false;
    }
    if (name && this.findCustomerByName(name)) {
      return false;
    }
    return Boolean(name && phone);
  }

  async saveCustomerIfNew(): Promise<void> {
    if (!this.isNewCustomer()) {
      return;
    }
    const payload = {
      customer_name: String(this.invoiceForm.get('customer_name')?.value || '').trim(),
      customer_phone_number: this.normalizePhone(
        String(this.invoiceForm.get('customer_phone_number')?.value || '')
      ),
      customer_address: String(this.invoiceForm.get('customer_address')?.value || '').trim(),
      customer_city: String(this.invoiceForm.get('customer_city')?.value || '').trim(),
      created_at: new Date().toISOString(),
    };
    if (!payload.customer_name || !payload.customer_phone_number) {
      return;
    }
    try {
      const docRef = await this.firestore.createCustomerInsideFirestoreDB(payload);
      this.mergeCustomers([{ ...payload, sourceId: docRef.id }]);
    } catch (error: any) {
      console.error('Failed to save customer', error);
    }
  }

  async getProductDetailsByOnOptionSelected(index: any, id: any) {
    const firebaseUniqueKey = String(id || '').substr(String(id).length - 20);
    if (!firebaseUniqueKey) {
      return;
    }

    await this.firestore
      .getProductById(firebaseUniqueKey)
      .subscribe((result: any) => {
        this.totalProductQuantity = result.product_total_quantity;
        const arrayControl = this.invoiceForm.get(
          'billing_product_information'
        ) as FormArray;
        const rate = this.safeAmount(result.product_rate_for_one_quantity);
        arrayControl.at(index).get('billing_quantity')?.setValue(1);
        arrayControl
          .at(index)
          .get('billing_rate')
          ?.setValue(rate > 0 ? rate.toFixed(2) : '');
        const quantity = this.safeAmount(arrayControl.at(index).get('billing_quantity')?.value);
        this.calculatePriceBasedOnQuantity(index, quantity, rate);
      });
  }

  calculatePriceBasedOnQuantity(index: any, quantity: any, rate: any) {
    const qty = this.safeAmount(quantity);
    const unitRate = this.safeAmount(rate);
    const lineTotal = qty * unitRate;
    const billingProductInformation = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    billingProductInformation
      .at(index)
      .get('billing_total_amount')
      ?.setValue(lineTotal.toFixed(2));
    this.calculateGrandTotal();
  }

  changeOnQuantity(index: any, quantity: any) {
    const billingProductInformation = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    const rate = this.safeAmount(billingProductInformation.at(index).get('billing_rate')?.value);
    const qty = this.safeAmount(quantity);
    billingProductInformation
      .at(index)
      .get('billing_total_amount')
      ?.setValue((qty * rate).toFixed(2));
    this.calculateGrandTotal();
    this.stockUpdateBasedOnQuantity(index);
  }

  changeOnRate(index: any, rate: any) {
    const billingProductInformation = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    const qty = this.safeAmount(billingProductInformation.at(index).get('billing_quantity')?.value);
    const unitRate = this.safeAmount(rate);
    billingProductInformation
      .at(index)
      .get('billing_total_amount')
      ?.setValue((qty * unitRate).toFixed(2));
    this.calculateGrandTotal();
  }

  calculateGrandTotal() {
    let value = 0;
    const billingProductInformation = this.invoiceForm.get(
      'billing_product_information'
    ) as FormArray;
    billingProductInformation.controls.forEach((element) => {
      value += this.safeAmount(element.value['billing_total_amount']);
    });
    this.grantTotal = value;
    this.setGrantTotal();
    this.applyTaxIfNeeded();
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
    if (!this.shouldApplyGst()) {
      this.clearGSTCalculation();
      return;
    }
    this.showGST = true;
    const subtotal = this.safeAmount(this.grantTotal);
    this.gstAmount = (subtotal * 18) / 100;
    this.newGstAmount = Number(this.gstAmount.toFixed(2));
    this.invoiceForm.get('billing_gst')?.setValue(this.newGstAmount);
    this.net_amount = subtotal + this.newGstAmount;
    this.setGrantTotal();
    this.invoiceForm.get('billing_netPay')?.setValue(this.net_amount.toFixed(2));
  }

  clearGSTCalculation() {
    this.showGST = false;
    this.gstAmount = 0;
    this.newGstAmount = 0;
    const subtotal = this.safeAmount(this.grantTotal);
    this.net_amount = subtotal;
    this.setGrantTotal();
    this.invoiceForm.get('billing_netPay')?.setValue(subtotal.toFixed(2));
    this.invoiceForm.get('billing_gst')?.setValue('0.00');
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
    const total = this.safeAmount(this.grantTotal);
    this.grantTotal = total;
    this.invoiceForm.get('billing_grantTotal')?.setValue(total.toFixed(2));
    if (!this.showGST) {
      this.invoiceForm.get('billing_netPay')?.setValue(total.toFixed(2));
    }
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
