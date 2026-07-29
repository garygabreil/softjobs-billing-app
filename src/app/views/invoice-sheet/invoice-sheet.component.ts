import { Component, Input } from '@angular/core';

export interface InvoiceLineItem {
  billing_product_name: string;
  billing_quantity: number | string;
  billing_rate: number | string;
  billing_total_amount: number | string;
  billing_unit?: string;
}

@Component({
  selector: 'app-invoice-sheet',
  templateUrl: './invoice-sheet.component.html',
  styleUrls: ['./invoice-sheet.component.css'],
})
export class InvoiceSheetComponent {
  @Input() customer_name = '';
  @Input() customer_address = '';
  @Input() customer_city = '';
  @Input() customer_phone_number = '';
  @Input() billing_date = '';
  @Input() billing_uniqueNumber: number | string = '';
  @Input() billing_delivery_type = '';
  @Input() billing_destination = '';
  @Input() billing_grantTotal: number | string = 0;
  @Input() billing_netPay: number | string = 0;
  @Input() billing_gst: number | string = 0;
  @Input() billing_is_gst: 'gst' | 'non-gst' | boolean | string = 'non-gst';
  @Input() billing_product_information: InvoiceLineItem[] = [];

  readonly gstin = '33ADYPT1004G1ZJ';
  readonly rowCount = 15;
  readonly Math = Math;

  get isGstBill(): boolean {
    if (this.billing_is_gst === true || this.billing_is_gst === 'gst') {
      return true;
    }
    if (this.billing_is_gst === false || this.billing_is_gst === 'non-gst') {
      return false;
    }
    return Number(this.billing_gst) > 0;
  }

  get emptyRows(): number[] {
    const used = this.billing_product_information?.length ?? 0;
    const count = Math.max(0, this.rowCount - used);
    return Array.from({ length: count }, (_, i) => i);
  }

  get grandTotal(): number {
    return Number(this.isGstBill ? this.billing_netPay : this.billing_grantTotal) || 0;
  }

  get rupeesPart(): string {
    return Math.floor(this.grandTotal).toString();
  }

  get paisePart(): string {
    return Math.round((this.grandTotal - Math.floor(this.grandTotal)) * 100)
      .toString()
      .padStart(2, '0');
  }

  get customerLine(): string {
    return [this.customer_name, this.customer_address, this.customer_city, this.customer_phone_number]
      .filter(Boolean)
      .join(', ');
  }

  unitFor(item: InvoiceLineItem): string {
    return item.billing_unit || 'Nos';
  }

  formatAmount(value: number | string): string {
    const num = Number(value);
    if (Number.isNaN(num)) {
      return '0.00';
    }
    return num.toFixed(2);
  }

  rupeesFrom(value: number | string): string {
    return Math.floor(Number(value) || 0).toString();
  }

  paiseFrom(value: number | string): string {
    const num = Number(value) || 0;
    return Math.round((num - Math.floor(num)) * 100)
      .toString()
      .padStart(2, '0');
  }
}
