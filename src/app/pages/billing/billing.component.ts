import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  onSnapshot,
} from '@angular/fire/firestore';

interface BillItem {
  productId: string;
  name: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  gstPercentage: number;
  amount: number;
  gstAmount: number;
  total: number;
}

interface Product {
  id: string;
  name: string;
  hsnCode: string;
  rate: number;
  quantity: number;
  gstPercentage: number;
}

import { LogoComponent } from '../../components/logo/logo.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  template: `
    <div *ngIf="!showPrintView()" class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2><i class="bi bi-receipt me-2"></i>Billing System</h2>
            <div>
              <button routerLink="/" class="btn btn-outline-primary me-2">
                <i class="bi bi-arrow-left me-1"></i>Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Left Column: Customer & Product Selection -->
        <div class="col-lg-6 mb-4">
          <div class="card shadow mb-4">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-person me-2"></i>Customer Details
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label"
                    >Customer Name <span class="text-danger">*</span></label
                  >
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="customerName"
                    required
                    #customerNameInput="ngModel"
                  />
                  <div
                    *ngIf="
                      customerNameInput.invalid && customerNameInput.touched
                    "
                    class="text-danger small mt-1"
                  >
                    Customer name is required
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label"
                    >Address <span class="text-danger">*</span></label
                  >
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="address"
                    required
                    #addressInput="ngModel"
                  />
                  <div
                    *ngIf="addressInput.invalid && addressInput.touched"
                    class="text-danger small mt-1"
                  >
                    Address is required
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Invoice No.</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="invoiceNo"
                    [value]="invoiceNo"
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Date</label>
                  <input type="date" class="form-control" [(ngModel)]="date" />
                </div>
                <div class="col-12 mb-3">
                  <label class="form-label">Terms of Delivery</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="termsOfDelivery"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-cart-plus me-2"></i>Add Products to Bill
              </h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-8">
                  <label class="form-label">Select Product</label>
                  <select
                    class="form-select"
                    [(ngModel)]="selectedProductId"
                    (change)="onProductSelect()"
                  >
                    <option value="">-- Select Product --</option>
                    <option
                      *ngFor="let product of products()"
                      [value]="product.id"
                    >
                      {{ product.name }} (Stock: {{ product.quantity }}) -
                      {{ product.rate | currency : 'INR' }}
                    </option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Quantity</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="selectedQuantity"
                    min="1"
                  />
                </div>
              </div>
              <button
                class="btn btn-success w-100"
                (click)="addToBill()"
                [disabled]="!selectedProductId || selectedQuantity <= 0"
              >
                <i class="bi bi-plus-circle me-1"></i>Add to Bill
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Bill Items -->
        <div class="col-lg-6">
          <div class="card shadow h-100">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-receipt me-2"></i>Bill Items</h5>
            </div>
            <div class="card-body">
              <div class="bill-items-container">
                <div
                  *ngIf="billItems.length === 0"
                  class="text-center text-muted py-4"
                >
                  <p>No items added yet</p>
                </div>
                <div
                  *ngFor="let item of billItems; let i = index"
                  class="bill-item-card"
                >
                  <div class="bill-item-header">
                    <div class="item-sno">{{ i + 1 }}</div>
                    <div class="item-name">{{ item.name }}</div>
                    <button
                      class="btn btn-sm btn-danger ms-auto"
                      (click)="removeItem(i)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                  <div class="bill-item-details">
                    <div class="item-detail">
                      <label>HSN</label>
                      <span>{{ item.hsnCode }}</span>
                    </div>
                    <div class="item-detail">
                      <label>Qty</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        [(ngModel)]="item.quantity"
                        (change)="updateItem(i)"
                      />
                    </div>
                    <div class="item-detail">
                      <label>Rate</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        [(ngModel)]="item.rate"
                        (change)="updateItem(i)"
                      />
                    </div>
                    <div class="item-detail">
                      <label>Amount</label>
                      <span>{{ item.amount | currency : 'INR' }}</span>
                    </div>
                    <div class="item-detail">
                      <label>GST</label>
                      <span>{{ item.gstAmount | currency : 'INR' }}</span>
                    </div>
                    <div class="item-detail">
                      <label>Total</label>
                      <span class="total-amount">{{
                        item.total | currency : 'INR'
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Totals -->
              <div class="mt-4 pt-3 border-top">
                <div class="row">
                  <div class="col-6 text-end">
                    <strong>Subtotal:</strong>
                  </div>
                  <div class="col-6">
                    {{ subtotal | currency : 'INR' }}
                  </div>
                </div>
                <div class="row">
                  <div class="col-6 text-end">
                    <strong>Total GST:</strong>
                  </div>
                  <div class="col-6">
                    {{ totalGst | currency : 'INR' }}
                  </div>
                </div>
                <div class="row">
                  <div class="col-6 text-end">
                    <strong>Grand Total:</strong>
                  </div>
                  <div class="col-6">
                    <h5>{{ grandTotal | currency : 'INR' }}</h5>
                  </div>
                </div>
              </div>

              <!-- Save Bill Button with Progress -->
              <div class="mt-4">
                <button
                  *ngIf="!isSaved()"
                  class="btn btn-primary w-100"
                  (click)="saveBill()"
                  [disabled]="
                    billItems.length === 0 ||
                    isSaving() ||
                    !customerName.trim() ||
                    !address.trim()
                  "
                >
                  <span *ngIf="!isSaving()"
                    ><i class="bi bi-save me-1"></i>Save Bill & Update
                    Inventory</span
                  >
                  <span *ngIf="isSaving()">
                    <span
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Saving...
                  </span>
                </button>
                <div *ngIf="isSaving()" class="progress mt-2">
                  <div
                    class="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style="width: 100%;"
                  ></div>
                </div>

                <!-- Print Button - Only shown after invoice is saved -->
                <button
                  *ngIf="isSaved()"
                  class="btn btn-success w-100 me-2"
                  (click)="printBill()"
                  style="display: inline-block; width: calc(50% - 5px);"
                >
                  <i class="bi bi-printer me-1"></i>Print Invoice
                </button>
                <br />
                <br />

                <button
                  *ngIf="isSaved()"
                  class="btn btn-warning w-100"
                  (click)="newInvoice()"
                  style="display: inline-block; width: calc(50% - 5px);"
                >
                  <i class="bi bi-file-plus me-1"></i>New Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Print View -->
    <div *ngIf="showPrintView()" class="print-view-container">
      <div class="print-view">
        <div class="print-header">
          <button
            class="btn btn-outline-secondary"
            (click)="showPrintView.set(false)"
          >
            <i class="bi bi-x me-1"></i>Close Print View
          </button>
          <button class="btn btn-primary" (click)="safePrint()">
            <i class="bi bi-printer me-1"></i>Print
          </button>
        </div>
        <div class="print-content">
          <div class="invoice-container">
            <!-- Header with Logo and Company Details -->
            <div class="invoice-header-section">
              <div class="header-left">
                <div class="logo-container">
                  <app-logo width="50" height="50"></app-logo>
                </div>
                <div class="company-name">SOFTJOBS</div>
                <div class="company-desc">
                  Computer Sales & Services, Toner Refilling, Online Entry,<br />Printer
                  Service
                </div>
                <div class="company-address">
                  65B Katchery road, Satya Sweets Opps,<br />
                  Kallakurichi-606 202
                </div>
                <div class="company-contact">
                  Gmail: jtittus&#64;gmail.com, Tel: 04151-290013, Cell.:
                  9994740907
                </div>
              </div>
              <div class="header-right">
                <div class="invoice-title">
                  INVOICE CUM DELIVERY CHALLAN<br />CASH / CREDIT BILL
                </div>
                <table class="invoice-details">
                  <tr>
                    <td class="label">Invoice No.:</td>
                    <td class="value">{{ invoiceNo }}</td>
                  </tr>
                  <tr>
                    <td class="label">Date:</td>
                    <td class="value">{{ date }}</td>
                  </tr>
                  <tr>
                    <td class="label">GST No.:</td>
                    <td class="value">33ADYPT1004G1ZJ</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Customer Details -->
            <div class="customer-section">
              <table class="customer-table">
                <tr>
                  <td class="label">Customer Name:</td>
                  <td class="value">{{ customerName }}</td>
                </tr>
                <tr>
                  <td class="label">Address:</td>
                  <td class="value">{{ address }}</td>
                </tr>
                <tr>
                  <td class="label">Terms / of Delivery:</td>
                  <td class="value">{{ termsOfDelivery }}</td>
                </tr>
              </table>
            </div>

            <!-- Items Table -->
            <div class="items-section">
              <table class="items-table">
                <thead>
                  <tr>
                    <th class="col-sno">S.No</th>
                    <th class="col-desc">Description of Goods</th>
                    <th class="col-qty">Quantity</th>
                    <th class="col-rate">Rate</th>
                    <th class="col-per">Per</th>
                    <th class="col-amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of billItems; let i = index">
                    <td class="col-sno">{{ i + 1 }}</td>
                    <td class="col-desc">
                      <strong>{{ item.name }}</strong
                      ><br />
                      HSN: {{ item.hsnCode }}
                    </td>
                    <td class="col-qty">{{ item.quantity }}</td>
                    <td class="col-rate">{{ item.rate | number : '1.2-2' }}</td>
                    <td class="col-per">-</td>
                    <td class="col-amount">
                      {{ item.total | number : '1.2-2' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td class="label">Grand Total</td>
                  <td class="value">₹ {{ grandTotal | number : '1.2-2' }}</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div class="invoice-footer">
              <div class="footer-left">
                <div class="signature">___________________</div>
                <div class="signature-label">Authorized Signature</div>
              </div>
              <div class="footer-right">
                <div class="company-stamp">For SOFTJOBS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .print-view-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100% !important;
        height: 100% !important;
        background: #f5f5f5 !important;
        z-index: 9999 !important;
        overflow-y: auto !important;
        padding: 20px !important;
        display: block !important;
      }
      .print-view {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        display: block;
      }
      .print-header {
        padding: 15px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        gap: 10px;
        position: sticky;
        top: 0;
        z-index: 10000;
      }
      .print-content {
        padding: 20px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        display: block;
        width: 100%;
      }
      .invoice-container {
        border: 2px solid #000;
        padding: 15px;
        page-break-inside: avoid;
      }
      .invoice-header-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 15px;
        border-bottom: 1px solid #000;
        padding-bottom: 10px;
      }
      .header-left {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .logo-container {
        width: 50px;
        height: 50px;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .company-name {
        font-weight: bold;
        font-size: 14px;
      }
      .company-desc {
        font-size: 10px;
        line-height: 1.3;
      }
      .company-address {
        font-size: 10px;
        line-height: 1.3;
      }
      .company-contact {
        font-size: 10px;
      }
      .header-right {
        text-align: right;
      }
      .invoice-title {
        font-weight: bold;
        font-size: 11px;
        line-height: 1.4;
        margin-bottom: 8px;
      }
      .invoice-details {
        width: 100%;
        font-size: 10px;
      }
      .invoice-details td {
        padding: 2px 0;
      }
      .invoice-details .label {
        font-weight: bold;
        width: 50%;
      }
      .invoice-details .value {
        text-align: right;
      }
      .customer-section {
        margin-bottom: 10px;
      }
      .customer-table {
        width: 100%;
        font-size: 10px;
      }
      .customer-table tr {
        border-bottom: 1px solid #ddd;
      }
      .customer-table td.label {
        font-weight: bold;
        width: 30%;
        padding: 3px 5px;
      }
      .customer-table td.value {
        padding: 3px 5px;
      }
      .items-section {
        margin-bottom: 10px;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .items-table th {
        border: 1px solid #000;
        padding: 5px;
        text-align: left;
        font-weight: bold;
        background: #f9f9f9;
      }
      .items-table td {
        border: 1px solid #000;
        padding: 5px;
      }
      .col-sno {
        width: 8%;
        text-align: center;
      }
      .col-desc {
        width: 37%;
      }
      .col-qty {
        width: 12%;
        text-align: center;
      }
      .col-rate {
        width: 15%;
        text-align: right;
      }
      .col-per {
        width: 10%;
        text-align: center;
      }
      .col-amount {
        width: 18%;
        text-align: right;
      }
      .totals-section {
        margin-bottom: 10px;
      }
      .totals-table {
        width: 100%;
        font-size: 11px;
      }
      .totals-table tr {
        border-bottom: 2px solid #000;
      }
      .totals-table .label {
        font-weight: bold;
        width: 70%;
        padding: 5px;
        text-align: right;
      }
      .totals-table .value {
        font-weight: bold;
        width: 30%;
        padding: 5px;
        text-align: right;
      }
      .invoice-footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin-top: 15px;
        font-size: 10px;
      }
      .footer-left {
        text-align: left;
      }
      .footer-right {
        text-align: right;
      }
      .signature {
        margin-top: 20px;
        border-top: 1px solid #000;
        padding-top: 3px;
        height: 30px;
      }
      .signature-label {
        margin-top: 3px;
        font-size: 9px;
      }
      .company-stamp {
        margin-top: 20px;
        font-weight: bold;
      }
      .bill-items-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .bill-item-card {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 12px;
        background: #f9fafb;
      }
      .bill-item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e0e0e0;
      }
      .item-sno {
        background: #007bff;
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        font-size: 12px;
        flex-shrink: 0;
      }
      .item-name {
        font-weight: 300;
        font-size: 14px;
        flex: 1;
      }
      .bill-item-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
      }
      .item-detail {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .item-detail label {
        font-size: 11px;
        color: #999;
        font-weight: 300;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .item-detail span {
        font-size: 13px;
        font-weight: 300;
        color: #333;
      }
      .item-detail input {
        font-size: 13px;
        padding: 6px 8px;
        font-weight: 300;
      }
      .total-amount {
        font-weight: 400;
        color: #007bff;
        font-size: 14px;
      }
      body,
      .table,
      .btn,
      .card-header,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        font-weight: 300;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .print-view-container,
        .print-view-container * {
          visibility: visible;
        }
        .print-header {
          display: none !important;
        }
        .print-view-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white;
          padding: 0;
          margin: 0;
        }
        .print-view {
          max-width: 100%;
          margin: 0;
          background: white;
        }
        .print-content {
          padding: 10mm;
        }
        .invoice-container {
          border: 2px solid #000;
          padding: 15px;
          page-break-inside: avoid;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  ],
})
export class BillingComponent implements OnInit {
  window = typeof window !== 'undefined' ? window : null;
  private firestore = inject(Firestore);

  products = signal<Product[]>([]);
  billItems: BillItem[] = [];
  isSaving = signal(false);
  isPrinting = signal(false);
  showPrintView = signal(false);
  isSaved = signal(false);

  customerName: string = '';
  address: string = '';
  invoiceNo: string = '';
  date: string = new Date().toISOString().split('T')[0];
  termsOfDelivery: string = '';

  selectedProductId: string = '';
  selectedQuantity: number = 1;
  selectedProduct: Product | null = null;

  get subtotal(): number {
    return this.billItems.reduce((sum, item) => sum + item.amount, 0);
  }

  get totalGst(): number {
    return this.billItems.reduce((sum, item) => sum + item.gstAmount, 0);
  }

  get grandTotal(): number {
    return this.subtotal + this.totalGst;
  }

  ngOnInit() {
    this.invoiceNo = this.generateInvoiceNo();
    this.getProducts();
  }

  generateInvoiceNo(): string {
    return 'INV-' + Math.floor(1000 + Math.random() * 9000);
  }

  getProducts() {
    try {
      const q = query(collection(this.firestore, 'products'));
      onSnapshot(
        q,
        (snapshot) => {
          const products: Product[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            products.push({
              id: doc.id,
              name: data.name || '',
              hsnCode: data.hsnCode || '',
              rate: data.rate || 0,
              quantity: data.quantity || 0,
              gstPercentage: data.gstPercentage || 0,
            });
          });
          //console.log('✓ Products loaded:', products.length);
          this.products.set(products);
        },
        (error: any) => {
          console.error('✗ Error loading products:', error);
        }
      );
    } catch (error) {
      console.error('✗ Error setting up listener:', error);
    }
  }

  async onProductSelect() {
    if (this.selectedProductId) {
      const productRef = doc(
        this.firestore,
        'products',
        this.selectedProductId
      );
      const productSnap = await getDoc(productRef);
      this.selectedProduct = productSnap.exists()
        ? ({ id: productSnap.id, ...productSnap.data() } as Product)
        : null;
    }
  }

  addToBill() {
    if (this.selectedProduct && this.selectedQuantity > 0) {
      if (this.selectedProduct.quantity < this.selectedQuantity) {
        alert(
          `Insufficient stock! Available: ${this.selectedProduct.quantity}`
        );
        return;
      }

      const item: BillItem = {
        productId: this.selectedProduct.id,
        name: this.selectedProduct.name,
        hsnCode: this.selectedProduct.hsnCode,
        quantity: this.selectedQuantity,
        rate: this.selectedProduct.rate,
        gstPercentage: this.selectedProduct.gstPercentage,
        amount: 0,
        gstAmount: 0,
        total: 0,
      };

      this.calculateItem(item);
      this.billItems.push(item);

      this.selectedProductId = '';
      this.selectedQuantity = 1;
      this.selectedProduct = null;
    }
  }

  calculateItem(item: BillItem) {
    item.amount = item.quantity * item.rate;
    item.gstAmount = (item.amount * item.gstPercentage) / 100;
    item.total = item.amount + item.gstAmount;
  }

  updateItem(index: number) {
    const item = this.billItems[index];
    this.calculateItem(item);
  }

  removeItem(index: number) {
    this.billItems.splice(index, 1);
  }

  async saveBill() {
    // Validation
    if (!this.customerName || !this.customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!this.address || !this.address.trim()) {
      alert('Please enter address');
      return;
    }
    if (this.billItems.length === 0) {
      alert('Please add at least one item to the bill');
      return;
    }

    try {
      this.isSaving.set(true);

      const billData = {
        customerName: this.customerName,
        invoiceNo: this.invoiceNo,
        date: this.date,
        address: this.address,
        termsOfDelivery: this.termsOfDelivery,
        items: this.billItems,
        subtotal: this.subtotal,
        totalGst: this.totalGst,
        grandTotal: this.grandTotal,
        timestamp: new Date(),
      };

      const billsRef = collection(this.firestore, 'bills');
      await addDoc(billsRef, billData);
      //console.log('✓ Bill saved successfully');

      for (const item of this.billItems) {
        const productRef = doc(this.firestore, 'products', item.productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const currentQty = productSnap.data()['quantity'];
          const newQty = currentQty - item.quantity;
          await updateDoc(productRef, { quantity: newQty });
        }
      }
      // console.log('✓ Inventory updated successfully');

      alert('Bill saved successfully! Inventory updated.');
      this.isSaved.set(true);
      this.isSaving.set(false);
    } catch (error) {
      console.error('✗ Error saving bill:', error);
      this.isSaving.set(false);
      alert('Error saving bill. Please try again.');
    }
  }

  resetForm() {
    this.billItems = [];
    this.customerName = '';
    this.address = '';
    this.invoiceNo = this.generateInvoiceNo();
    this.date = new Date().toISOString().split('T')[0];
    this.termsOfDelivery = '';
    this.selectedProductId = '';
    this.selectedQuantity = 1;
    this.selectedProduct = null;
    this.isSaved.set(false);
    this.showPrintView.set(false);
    //console.log('✓ Form reset successfully');
  }

  printBill() {
    if (!this.isSaved()) {
      alert('Please save the bill before printing.');
      return;
    }
    // console.log('✓ Preparing to print');
    this.showPrintView.set(true);
    // Trigger print dialog immediately and close preview after
    setTimeout(() => {
      this.safePrint();
      // Close print view after print dialog appears
      setTimeout(() => {
        this.showPrintView.set(false);
      }, 500);
    }, 100);
  }

  safePrint() {
    if (this.window && typeof this.window.print === 'function') {
      this.window.print();
    }
  }

  newInvoice() {
    // console.log('✓ Creating new invoice');
    this.resetForm();
    this.isSaved.set(false);
  }
}
