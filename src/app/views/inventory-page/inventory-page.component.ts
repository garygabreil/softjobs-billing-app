import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { getControlError, markAllControlsTouched, minLengthTrimmed } from 'src/app/utils/form-validators';
import { SortDirection, compareValues, filterSuggestions, matchesSearch } from 'src/app/utils/list-utils';

type ProductRow = [string, Record<string, any>];
type ProductSortField = 'name' | 'date' | 'qty' | 'rate';

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory-page.component.html',
  styleUrls: ['./inventory-page.component.css'],
})
export class InventoryPageComponent implements OnInit {
  productForm: FormGroup;
  progressBar: boolean = false;
  progressBarForUpdation = false;
  rateForOneQuantity: any;
  allProductArray: ProductRow[] = [];
  progressBarForLoadingAllTheProducts: boolean = false;
  dateTime = new Date();
  uniqueProductId: any;
  totalNumberOfProducts: any;
  searchText = '';
  sortBy: ProductSortField = 'name';
  sortDir: SortDirection = 'asc';
  stockFilter: 'all' | 'in-stock' | 'low' | 'out' = 'all';
  submitted = false;

  @ViewChild('close') addNewProductModel?: ElementRef;
  @ViewChild('closeUpdateModel') closeEditProductModel?: ElementRef;

  constructor(
    private firestore: FirestoreService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.getAllTheProducts();
    this.progressBarForLoadingAllTheProducts = true;
    this.productForm = this.buildProductForm();
  }

  ngOnInit(): void {}

  buildProductForm(values: Record<string, unknown> = {}): FormGroup {
    return new FormGroup({
      product_name: new FormControl(values['product_name'] ?? '', [Validators.required, minLengthTrimmed(2)]),
      product_purchase_date: new FormControl(values['product_purchase_date'] ?? '', Validators.required),
      product_total_quantity: new FormControl(values['product_total_quantity'] ?? '', [Validators.required, Validators.min(1)]),
      product_total_rate: new FormControl(values['product_total_rate'] ?? '', [Validators.required, Validators.min(1)]),
      product_rate_for_one_quantity: new FormControl(values['product_rate_for_one_quantity'] ?? ''),
      product_creation_timestamp: new FormControl(values['product_creation_timestamp'] ?? this.dateTime),
      product_updation_timestamp: new FormControl(values['product_updation_timestamp'] ?? this.dateTime),
    });
  }

  filteredProducts(): ProductRow[] {
    let rows = [...this.allProductArray];

    if (this.stockFilter === 'out') {
      rows = rows.filter((product) => Number(product[1]['product_total_quantity']) <= 0);
    } else if (this.stockFilter === 'low') {
      rows = rows.filter((product) => {
        const qty = Number(product[1]['product_total_quantity']);
        return qty > 0 && qty <= 5;
      });
    } else if (this.stockFilter === 'in-stock') {
      rows = rows.filter((product) => Number(product[1]['product_total_quantity']) > 5);
    }

    if (this.searchText.trim()) {
      rows = rows.filter((product) =>
        matchesSearch(
          this.searchText,
          product[1]['product_name'],
          product[1]['product_purchase_date'],
          product[1]['product_total_quantity'],
          product[1]['product_total_rate']
        )
      );
    }

    return rows.sort((a, b) => {
      const av = this.getProductSortValue(a[1]);
      const bv = this.getProductSortValue(b[1]);
      return compareValues(av, bv, this.sortDir);
    });
  }

  sortByColumn(field: ProductSortField): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      return;
    }
    this.sortBy = field;
    this.sortDir = field === 'name' ? 'asc' : 'desc';
  }

  sortIcon(field: ProductSortField): string {
    if (this.sortBy !== field) {
      return 'unfold_more';
    }
    return this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  clearFilters(): void {
    this.searchText = '';
    this.sortBy = 'name';
    this.sortDir = 'asc';
    this.stockFilter = 'all';
  }

  searchSuggestions(): string[] {
    const items = this.allProductArray.flatMap((product) => [
      product[1]['product_name'],
      product[1]['product_purchase_date'],
      product[1]['product_total_quantity'],
      product[1]['product_total_rate'],
      product[1]['product_rate_for_one_quantity'],
    ]);
    return filterSuggestions(this.searchText, items, 20);
  }

  fieldError(name: string): string {
    return getControlError(this.productForm.get(name), this.fieldLabel(name));
  }

  async addNewProduct() {
    this.submitted = true;
    markAllControlsTouched(this.productForm);
    if (this.productForm.invalid) {
      return;
    }

    this.progressBar = true;
    await this.firestore
      .createProductInsideFirestoreDB({
        product_name: this.productForm.value.product_name,
        product_purchase_date: this.productForm.value.product_purchase_date,
        product_total_quantity: this.productForm.value.product_total_quantity,
        product_total_rate: this.productForm.value.product_total_rate,
        product_rate_for_one_quantity: this.productForm.value.product_rate_for_one_quantity,
        product_creation_timestamp: this.dateTime,
        product_updation_timestamp: null,
      })
      .then(async () => {
        this.addNewProductModel?.nativeElement.click();
        await this.snackBar.open('Success', 'Product added', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
      })
      .catch(async (error) => {
        this.addNewProductModel?.nativeElement.click();
        await this.snackBar.open('Error', error.message, {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
      });
    this.progressBar = false;
    this.submitted = false;
    this.productForm = this.buildProductForm();
  }

  async calculateOneQuantity() {
    const qty = Number(this.productForm.value.product_total_quantity);
    const rate = Number(this.productForm.value.product_total_rate);
    if (!qty || !rate) {
      return;
    }
    this.rateForOneQuantity = rate / qty;
    await this.productForm.get('product_rate_for_one_quantity')?.setValue(this.rateForOneQuantity);
  }

  async getAllTheProducts() {
    this.progressBarForLoadingAllTheProducts = true;
    await this.firestore.getAllProductFromFirestoreDB().subscribe((response: any) => {
      this.allProductArray = response.map((product: any) => {
        return [product.payload.doc.id, product.payload.doc.data()] as ProductRow;
      });
      this.totalNumberOfProducts = this.allProductArray.length;
      this.progressBarForLoadingAllTheProducts = false;
    });
  }

  async deleteProduct(id: any) {
    this.progressBarForLoadingAllTheProducts = true;
    await this.firestore
      .deleteProductById(id)
      .then(async () => {
        await this.snackBar.open('Success', 'Product deleted', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
        this.progressBarForLoadingAllTheProducts = false;
      })
      .catch(async (error) => {
        await this.snackBar.open('Error', error.message, {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
        this.progressBarForLoadingAllTheProducts = false;
      });
    this.progressBarForLoadingAllTheProducts = false;
  }

  async editProduct(id: any) {
    this.uniqueProductId = id;
    this.submitted = false;
    await this.firestore.getProductById(id).subscribe(async (res: any) => {
      this.productForm = this.buildProductForm(res);
    });
  }

  async updateProductById() {
    this.submitted = true;
    markAllControlsTouched(this.productForm);
    if (this.productForm.invalid) {
      return;
    }

    this.progressBarForUpdation = true;
    await this.firestore
      .updateProductByIdAndFormValues(this.uniqueProductId, {
        product_name: this.productForm.value.product_name,
        product_purchase_date: this.productForm.value.product_purchase_date,
        product_total_quantity: this.productForm.value.product_total_quantity,
        product_total_rate: this.productForm.value.product_total_rate,
        product_rate_for_one_quantity: this.productForm.value.product_rate_for_one_quantity,
        product_creation_timestamp: this.productForm.value.product_creation_timestamp,
        product_updation_timestamp: this.dateTime,
      })
      .then(async () => {
        this.closeEditProductModel?.nativeElement.click();
        await this.snackBar.open('Modification done', 'Product updated', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
      })
      .catch(async (error) => {
        this.closeEditProductModel?.nativeElement.click();
        await this.snackBar.open('Error', error.message, {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
      });
    this.progressBarForUpdation = false;
    this.submitted = false;
  }

  private getProductSortValue(data: Record<string, any>): string | number {
    switch (this.sortBy) {
      case 'date':
        return data['product_purchase_date'] || '';
      case 'qty':
        return Number(data['product_total_quantity']) || 0;
      case 'rate':
        return Number(data['product_rate_for_one_quantity']) || 0;
      case 'name':
      default:
        return data['product_name'] || '';
    }
  }

  private fieldLabel(name: string): string {
    const labels: Record<string, string> = {
      product_name: 'Product name',
      product_purchase_date: 'Purchase date',
      product_total_quantity: 'Quantity',
      product_total_rate: 'Total rate',
    };
    return labels[name] || name;
  }
}
