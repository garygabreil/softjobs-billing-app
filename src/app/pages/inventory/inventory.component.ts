import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Firestore,
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
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

interface Bill {
  id: string;
  invoiceNo: string;
  customerName: string;
  address: string;
  date: string;
  items: BillItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  timestamp: any;
}

interface QuotationItem {
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

interface Quotation {
  id: string;
  quotationNo: string;
  customerName: string;
  customerEmail: string;
  date: string;
  validity: string;
  items: QuotationItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  timestamp: any;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2><i class="bi bi-archive me-2"></i>Inventory & Search</h2>
            <div>
              <button routerLink="/" class="btn btn-outline-primary">
                <i class="bi bi-arrow-left me-1"></i>Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="row mb-4">
        <div class="col-12">
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <button
                class="nav-link"
                [class.active]="activeTab === 'bills'"
                (click)="switchTab('bills')"
              >
                <i class="bi bi-file-earmark-text me-2"></i>Bills ({{
                  bills().length
                }})
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link"
                [class.active]="activeTab === 'quotations'"
                (click)="switchTab('quotations')"
              >
                <i class="bi bi-file-text me-2"></i>Quotations ({{
                  quotations().length
                }})
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="row mb-4">
        <div class="col-md-4 mb-3 mb-md-0">
          <input
            type="text"
            class="form-control"
            placeholder="Search by customer name, invoice/quotation number..."
            [(ngModel)]="searchQuery"
            (keyup)="performSearch()"
          />
        </div>
        <div class="col-md-2">
          <input
            type="date"
            class="form-control"
            [(ngModel)]="filterDate"
            (change)="performSearch()"
          />
        </div>
        <div class="col-md-2">
          <select
            class="form-select"
            [value]="itemsPerPage"
            (change)="onItemsPerPageChange($event)"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-warning w-100" (click)="clearFilters()">
            <i class="bi bi-arrow-clockwise me-1"></i>Clear
          </button>
        </div>
      </div>

      <!-- Bills Tab -->
      <div *ngIf="activeTab === 'bills'" class="row">
        <div class="col-12">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-file-earmark-text me-2"></i>Saved Bills
              </h5>
            </div>
            <div class="card-body">
              <div
                *ngIf="filteredBills().length === 0"
                class="text-center text-muted py-5"
              >
                <p>No bills found</p>
              </div>

              <div class="table-responsive" *ngIf="filteredBills().length > 0">
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Invoice No.</th>
                      <th>Customer Name</th>
                      <th>Address</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Grand Total</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let bill of paginatedBills()">
                      <td>
                        <strong>{{ bill.invoiceNo }}</strong>
                      </td>
                      <td>{{ bill.customerName }}</td>
                      <td>{{ bill.address }}</td>
                      <td>{{ bill.date }}</td>
                      <td>
                        <span class="badge bg-info">
                          {{ bill.items.length }} items
                        </span>
                      </td>
                      <td>
                        <strong>{{
                          bill.grandTotal | currency : 'INR'
                        }}</strong>
                      </td>
                      <td class="text-end">
                        <button
                          class="btn btn-sm btn-info me-2"
                          (click)="viewBillDetails(bill)"
                          title="View Details"
                        >
                          <i class="bi bi-eye"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-danger"
                          (click)="deleteBill(bill.id)"
                          title="Delete"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination Controls for Bills -->
              <div
                *ngIf="filteredBills().length > 0"
                class="d-flex justify-content-between align-items-center mt-3"
              >
                <small class="text-muted">
                  Showing {{ (currentBillPage - 1) * itemsPerPage + 1 }} to
                  {{
                    Math.min(
                      currentBillPage * itemsPerPage,
                      filteredBills().length
                    )
                  }}
                  of {{ filteredBills().length }} bills
                </small>
                <nav>
                  <ul class="pagination pagination-sm mb-0">
                    <li
                      class="page-item"
                      [class.disabled]="currentBillPage === 1"
                    >
                      <button
                        class="page-link"
                        (click)="prevBillPage()"
                        [disabled]="currentBillPage === 1"
                      >
                        Previous
                      </button>
                    </li>
                    <li
                      *ngFor="let page of billPageNumbers()"
                      class="page-item"
                      [class.active]="page === currentBillPage"
                      [class.disabled]="page === -1"
                    >
                      <button
                        class="page-link"
                        (click)="goToBillPage(page)"
                        [disabled]="page === -1"
                      >
                        {{ page === -1 ? '...' : page }}
                      </button>
                    </li>
                    <li
                      class="page-item"
                      [class.disabled]="currentBillPage === totalBillPages()"
                    >
                      <button
                        class="page-link"
                        (click)="nextBillPage()"
                        [disabled]="currentBillPage === totalBillPages()"
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quotations Tab -->
      <div *ngIf="activeTab === 'quotations'" class="row">
        <div class="col-12">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">
                <i class="bi bi-file-text me-2"></i>Saved Quotations
              </h5>
            </div>
            <div class="card-body">
              <div
                *ngIf="filteredQuotations().length === 0"
                class="text-center text-muted py-5"
              >
                <p>No quotations found</p>
              </div>

              <div
                class="table-responsive"
                *ngIf="filteredQuotations().length > 0"
              >
                <table class="table table-hover">
                  <thead class="table-light">
                    <tr>
                      <th>Quotation No.</th>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Date</th>
                      <th>Validity</th>
                      <th>Items</th>
                      <th>Grand Total</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let quotation of paginatedQuotations()">
                      <td>
                        <strong>{{ quotation.quotationNo }}</strong>
                      </td>
                      <td>{{ quotation.customerName }}</td>
                      <td>{{ quotation.customerEmail }}</td>
                      <td>{{ quotation.date }}</td>
                      <td>{{ quotation.validity }}</td>
                      <td>
                        <span class="badge bg-info">
                          {{ quotation.items.length }} items
                        </span>
                      </td>
                      <td>
                        <strong>{{
                          quotation.grandTotal | currency : 'INR'
                        }}</strong>
                      </td>
                      <td class="text-end">
                        <button
                          class="btn btn-sm btn-info me-2"
                          (click)="viewQuotationDetails(quotation)"
                          title="View Details"
                        >
                          <i class="bi bi-eye"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-danger"
                          (click)="deleteQuotation(quotation.id)"
                          title="Delete"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination Controls for Quotations -->
              <div
                *ngIf="filteredQuotations().length > 0"
                class="d-flex justify-content-between align-items-center mt-3"
              >
                <small class="text-muted">
                  Showing {{ (currentQuotationPage - 1) * itemsPerPage + 1 }} to
                  {{
                    Math.min(
                      currentQuotationPage * itemsPerPage,
                      filteredQuotations().length
                    )
                  }}
                  of {{ filteredQuotations().length }} quotations
                </small>
                <nav>
                  <ul class="pagination pagination-sm mb-0">
                    <li
                      class="page-item"
                      [class.disabled]="currentQuotationPage === 1"
                    >
                      <button
                        class="page-link"
                        (click)="prevQuotationPage()"
                        [disabled]="currentQuotationPage === 1"
                      >
                        Previous
                      </button>
                    </li>
                    <li
                      *ngFor="let page of quotationPageNumbers()"
                      class="page-item"
                      [class.active]="page === currentQuotationPage"
                      [class.disabled]="page === -1"
                    >
                      <button
                        class="page-link"
                        (click)="goToQuotationPage(page)"
                        [disabled]="page === -1"
                      >
                        {{ page === -1 ? '...' : page }}
                      </button>
                    </li>
                    <li
                      class="page-item"
                      [class.disabled]="
                        currentQuotationPage === totalQuotationPages()
                      "
                    >
                      <button
                        class="page-link"
                        (click)="nextQuotationPage()"
                        [disabled]="
                          currentQuotationPage === totalQuotationPages()
                        "
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div
      *ngIf="showDetails"
      class="modal d-block"
      style="background-color: rgba(0, 0, 0, 0.5);"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="bi me-2"></i>{{ detailsTitle }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              (click)="showDetails = false"
            ></button>
          </div>
          <div class="modal-body">
            <!-- Bill Details -->
            <div *ngIf="selectedBill">
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="text-muted">Invoice Number</h6>
                  <p>
                    <strong>{{ selectedBill.invoiceNo }}</strong>
                  </p>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted">Date</h6>
                  <p>
                    <strong>{{ selectedBill.date }}</strong>
                  </p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="text-muted">Customer Name</h6>
                  <p>
                    <strong>{{ selectedBill.customerName }}</strong>
                  </p>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted">Address</h6>
                  <p>
                    <strong>{{ selectedBill.address }}</strong>
                  </p>
                </div>
              </div>
              <h6 class="mb-3">Items</h6>
              <div class="table-responsive">
                <table class="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th>GST</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of selectedBill.items">
                      <td>{{ item.name }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ item.rate | currency : 'INR' }}</td>
                      <td>{{ item.amount | currency : 'INR' }}</td>
                      <td>{{ item.gstAmount | currency : 'INR' }}</td>
                      <td>
                        <strong>{{ item.total | currency : 'INR' }}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="row mt-3 pt-3 border-top">
                <div class="col-6 text-end">
                  <h6>Subtotal:</h6>
                </div>
                <div class="col-6">
                  <h6>{{ selectedBill.subtotal | currency : 'INR' }}</h6>
                </div>
                <div class="col-6 text-end">
                  <h6>Total GST:</h6>
                </div>
                <div class="col-6">
                  <h6>{{ selectedBill.totalGst | currency : 'INR' }}</h6>
                </div>
                <div class="col-6 text-end">
                  <h5 class="text-primary">Grand Total:</h5>
                </div>
                <div class="col-6">
                  <h5 class="text-primary">
                    {{ selectedBill.grandTotal | currency : 'INR' }}
                  </h5>
                </div>
              </div>
            </div>

            <!-- Quotation Details -->
            <div *ngIf="selectedQuotation">
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="text-muted">Quotation Number</h6>
                  <p>
                    <strong>{{ selectedQuotation.quotationNo }}</strong>
                  </p>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted">Date</h6>
                  <p>
                    <strong>{{ selectedQuotation.date }}</strong>
                  </p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="text-muted">Customer Name</h6>
                  <p>
                    <strong>{{ selectedQuotation.customerName }}</strong>
                  </p>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted">Email</h6>
                  <p>
                    <strong>{{ selectedQuotation.customerEmail }}</strong>
                  </p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="text-muted">Validity</h6>
                  <p>
                    <strong>{{ selectedQuotation.validity }}</strong>
                  </p>
                </div>
              </div>
              <h6 class="mb-3">Items</h6>
              <div class="table-responsive">
                <table class="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th>GST</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of selectedQuotation.items">
                      <td>{{ item.name }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ item.rate | currency : 'INR' }}</td>
                      <td>{{ item.amount | currency : 'INR' }}</td>
                      <td>{{ item.gstAmount | currency : 'INR' }}</td>
                      <td>
                        <strong>{{ item.total | currency : 'INR' }}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="row mt-3 pt-3 border-top">
                <div class="col-6 text-end">
                  <h6>Subtotal:</h6>
                </div>
                <div class="col-6">
                  <h6>{{ selectedQuotation.subtotal | currency : 'INR' }}</h6>
                </div>
                <div class="col-6 text-end">
                  <h6>Total GST:</h6>
                </div>
                <div class="col-6">
                  <h6>{{ selectedQuotation.totalGst | currency : 'INR' }}</h6>
                </div>
                <div class="col-6 text-end">
                  <h5 class="text-primary">Grand Total:</h5>
                </div>
                <div class="col-6">
                  <h5 class="text-primary">
                    {{ selectedQuotation.grandTotal | currency : 'INR' }}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .nav-link {
        cursor: pointer;
        font-weight: 300;
      }
      .nav-link.active {
        border-bottom: 3px solid #007bff;
      }
      .table {
        font-weight: 300;
      }
      .card-header {
        font-weight: 300;
      }
      h2,
      h5,
      h6 {
        font-weight: 300;
      }
      .btn {
        font-weight: 300;
      }
      .modal.d-block {
        display: block;
      }
    `,
  ],
})
export class InventoryComponent implements OnInit {
  private firestore = inject(Firestore);
  Math = Math;

  bills = signal<Bill[]>([]);
  quotations = signal<Quotation[]>([]);

  activeTab: 'bills' | 'quotations' = 'bills';
  searchQuery: string = '';
  filterDate: string = '';
  showDetails: boolean = false;
  detailsTitle: string = '';

  // Pagination properties
  itemsPerPage: number = 10;
  currentBillPage: number = 1;
  currentQuotationPage: number = 1;

  selectedBill: Bill | null = null;
  selectedQuotation: Quotation | null = null;

  filteredBills = signal<Bill[]>([]);
  filteredQuotations = signal<Quotation[]>([]);

  ngOnInit() {
    this.loadBills();
    this.loadQuotations();
  }

  loadBills() {
    try {
      const q = query(collection(this.firestore, 'bills'));
      onSnapshot(
        q,
        (snapshot) => {
          const bills: Bill[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            bills.push({
              id: doc.id,
              invoiceNo: data.invoiceNo || '',
              customerName: data.customerName || '',
              address: data.address || '',
              date: data.date || '',
              items: data.items || [],
              subtotal: data.subtotal || 0,
              totalGst: data.totalGst || 0,
              grandTotal: data.grandTotal || 0,
              timestamp: data.timestamp,
            });
          });
          console.log('✓ Bills loaded:', bills.length);
          this.bills.set(bills);
          this.performSearch();
        },
        (error: any) => {
          console.error('✗ Error loading bills:', error);
        }
      );
    } catch (error) {
      console.error('✗ Error setting up listener:', error);
    }
  }

  loadQuotations() {
    try {
      const q = query(collection(this.firestore, 'quotations'));
      onSnapshot(
        q,
        (snapshot) => {
          const quotations: Quotation[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            quotations.push({
              id: doc.id,
              quotationNo: data.quotationNo || '',
              customerName: data.customerName || '',
              customerEmail: data.customerEmail || '',
              date: data.date || '',
              validity: data.validity || '',
              items: data.items || [],
              subtotal: data.subtotal || 0,
              totalGst: data.totalGst || 0,
              grandTotal: data.grandTotal || 0,
              timestamp: data.timestamp,
            });
          });
          console.log('✓ Quotations loaded:', quotations.length);
          this.quotations.set(quotations);
          this.performSearch();
        },
        (error: any) => {
          console.error('✗ Error loading quotations:', error);
        }
      );
    } catch (error) {
      console.error('✗ Error setting up listener:', error);
    }
  }

  performSearch() {
    let filteredBills = this.bills();
    let filteredQuotations = this.quotations();

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filteredBills = filteredBills.filter(
        (bill) =>
          bill.invoiceNo.toLowerCase().includes(query) ||
          bill.customerName.toLowerCase().includes(query)
      );
      filteredQuotations = filteredQuotations.filter(
        (quotation) =>
          quotation.quotationNo.toLowerCase().includes(query) ||
          quotation.customerName.toLowerCase().includes(query)
      );
    }

    if (this.filterDate) {
      filteredBills = filteredBills.filter(
        (bill) => bill.date === this.filterDate
      );
      filteredQuotations = filteredQuotations.filter(
        (quotation) => quotation.date === this.filterDate
      );
    }

    this.filteredBills.set(filteredBills);
    this.filteredQuotations.set(filteredQuotations);

    // Reset to first page and update paginated data
    this.currentBillPage = 1;
    this.currentQuotationPage = 1;
    this.updatePaginatedBills();
    this.updatePaginatedQuotations();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterDate = '';
    this.performSearch();
  }

  onItemsPerPageChange(event: any) {
    this.itemsPerPage = parseInt(event.target.value, 10);
    this.performSearch();
  }

  switchTab(tab: 'bills' | 'quotations') {
    this.activeTab = tab;
    this.showDetails = false;
  }

  viewBillDetails(bill: Bill) {
    this.selectedBill = bill;
    this.selectedQuotation = null;
    this.detailsTitle = `Invoice ${bill.invoiceNo}`;
    this.showDetails = true;
  }

  viewQuotationDetails(quotation: Quotation) {
    this.selectedQuotation = quotation;
    this.selectedBill = null;
    this.detailsTitle = `Quotation ${quotation.quotationNo}`;
    this.showDetails = true;
  }

  async deleteBill(billId: string) {
    if (confirm('Are you sure you want to delete this bill?')) {
      try {
        await deleteDoc(doc(this.firestore, 'bills', billId));
        console.log('✓ Bill deleted successfully');
        alert('Bill deleted successfully!');
        this.showDetails = false;
      } catch (error) {
        console.error('✗ Error deleting bill:', error);
        alert('Error deleting bill. Please try again.');
      }
    }
  }

  async deleteQuotation(quotationId: string) {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteDoc(doc(this.firestore, 'quotations', quotationId));
        console.log('✓ Quotation deleted successfully');
        alert('Quotation deleted successfully!');
        this.showDetails = false;
      } catch (error) {
        console.error('✗ Error deleting quotation:', error);
        alert('Error deleting quotation. Please try again.');
      }
    }
  }

  // Pagination computed signals and methods
  paginatedBills = signal<Bill[]>([]);
  paginatedQuotations = signal<Quotation[]>([]);

  totalBillPages(): number {
    return Math.ceil(this.filteredBills().length / this.itemsPerPage);
  }

  totalQuotationPages(): number {
    return Math.ceil(this.filteredQuotations().length / this.itemsPerPage);
  }

  billPageNumbers(): number[] {
    const total = this.totalBillPages();
    const current = this.currentBillPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }

    return pages;
  }

  quotationPageNumbers(): number[] {
    const total = this.totalQuotationPages();
    const current = this.currentQuotationPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }

    return pages;
  }

  updatePaginatedBills() {
    const start = (this.currentBillPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedBills.set(this.filteredBills().slice(start, end));
  }

  updatePaginatedQuotations() {
    const start = (this.currentQuotationPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedQuotations.set(this.filteredQuotations().slice(start, end));
  }

  prevBillPage() {
    if (this.currentBillPage > 1) {
      this.currentBillPage--;
      this.updatePaginatedBills();
    }
  }

  nextBillPage() {
    if (this.currentBillPage < this.totalBillPages()) {
      this.currentBillPage++;
      this.updatePaginatedBills();
    }
  }

  goToBillPage(page: number) {
    if (page > 0 && page <= this.totalBillPages()) {
      this.currentBillPage = page;
      this.updatePaginatedBills();
    }
  }

  prevQuotationPage() {
    if (this.currentQuotationPage > 1) {
      this.currentQuotationPage--;
      this.updatePaginatedQuotations();
    }
  }

  nextQuotationPage() {
    if (this.currentQuotationPage < this.totalQuotationPages()) {
      this.currentQuotationPage++;
      this.updatePaginatedQuotations();
    }
  }

  goToQuotationPage(page: number) {
    if (page > 0 && page <= this.totalQuotationPages()) {
      this.currentQuotationPage = page;
      this.updatePaginatedQuotations();
    }
  }
}
