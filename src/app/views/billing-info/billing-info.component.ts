import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { SortDirection, compareValues, filterSuggestions, matchesSearch } from 'src/app/utils/list-utils';

interface InvoiceData {
  billing_uniqueNumber?: number | string;
  billing_status?: string;
  billing_is_gst?: string;
  billing_delivery_type?: string;
  billing_date?: string;
  billing_netPay?: number | string;
  customer_name?: string;
  customer_phone_number?: string;
}

type InvoiceRow = [InvoiceData, string];
type BillSortField = 'date' | 'amount' | 'invoice' | 'customer';

@Component({
  selector: 'app-billing-info',
  templateUrl: './billing-info.component.html',
  styleUrls: ['./billing-info.component.css'],
})
export class BillingInfoComponent implements OnInit {
  invoiceArray: InvoiceRow[] = [];
  searchText = '';
  gstFilter: 'all' | 'gst' | 'non-gst' = 'all';
  deliveryFilter = 'all';
  sortBy: BillSortField = 'date';
  sortDir: SortDirection = 'desc';

  readonly deliveryOptions = ['all', 'direct', 'courier', 'quotation', 'customer_point'];

  constructor(private router: Router, private firestore: FirestoreService) {}

  ngOnInit(): void {
    this.firestore.getAllInvoiceFromFirestoreDB().subscribe((response) => {
      this.invoiceArray = response.map((invoice) => {
        return [invoice.payload.doc.data(), invoice.payload.doc.id] as InvoiceRow;
      });
    });
  }

  filterInvoices(status: string): InvoiceRow[] {
    let rows = this.invoiceArray.filter((invoice) => invoice[0].billing_status === status);

    if (this.gstFilter !== 'all') {
      rows = rows.filter((invoice) => invoice[0].billing_is_gst === this.gstFilter);
    }

    if (this.deliveryFilter !== 'all') {
      rows = rows.filter((invoice) => invoice[0].billing_delivery_type === this.deliveryFilter);
    }

    if (this.searchText.trim()) {
      rows = rows.filter((invoice) => {
        const data = invoice[0];
        return matchesSearch(
          this.searchText,
          data.billing_uniqueNumber,
          data.customer_name,
          data.customer_phone_number,
          data.billing_date,
          data.billing_delivery_type,
          data.billing_is_gst
        );
      });
    }

    return [...rows].sort((a, b) => {
      const av = this.getSortValue(a[0]);
      const bv = this.getSortValue(b[0]);
      return compareValues(av, bv, this.sortDir);
    });
  }

  sortByColumn(field: BillSortField): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      return;
    }
    this.sortBy = field;
    this.sortDir = field === 'customer' ? 'asc' : 'desc';
  }

  sortIcon(field: BillSortField): string {
    if (this.sortBy !== field) {
      return 'unfold_more';
    }
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  clearFilters(): void {
    this.searchText = '';
    this.gstFilter = 'all';
    this.deliveryFilter = 'all';
    this.sortBy = 'date';
    this.sortDir = 'desc';
  }

  searchSuggestions(): string[] {
    const items: string[] = [];
    for (const [data] of this.invoiceArray) {
      items.push(
        String(data.billing_uniqueNumber ?? ''),
        String(data.customer_name ?? ''),
        String(data.customer_phone_number ?? ''),
        String(data.billing_date ?? ''),
        String(data.billing_delivery_type ?? ''),
        String(data.billing_is_gst ?? '')
      );
    }
    return filterSuggestions(this.searchText, items, 20);
  }

  viewBill(id: string): void {
    this.router.navigate(['/view', id]);
  }

  printBill(id: string): void {
    this.router.navigate(['/view', id], { queryParams: { print: '1' } });
  }

  private getSortValue(data: InvoiceData): string | number {
    switch (this.sortBy) {
      case 'amount':
        return Number(data.billing_netPay) || 0;
      case 'invoice':
        return Number(data.billing_uniqueNumber) || 0;
      case 'customer':
        return data.customer_name || '';
      case 'date':
      default:
        return data.billing_date || '';
    }
  }
}
