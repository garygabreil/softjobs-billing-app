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
  deleteDoc,
  query,
  onSnapshot,
} from '@angular/fire/firestore';

interface Product {
  id?: string;
  name: string;
  hsnCode: string;
  description: string;
  rate: number;
  quantity: number;
  gstPercentage: number;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2><i class="bi bi-box-seam me-2"></i>Products Management</h2>
            <button routerLink="/" class="btn btn-outline-primary">
              <i class="bi bi-arrow-left me-1"></i>Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <!-- Loading Progress -->
      <div *ngIf="isLoading()" class="card shadow mb-4">
        <div class="card-body">
          <div class="progress">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              style="width: 100%"
            >
              Loading products...
            </div>
          </div>
        </div>
      </div>

      <!-- Add Product Form -->
      <div class="card shadow mb-4">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">
            <i class="bi bi-plus-circle me-2"></i>Add New Product
          </h5>
        </div>
        <div class="card-body">
          <!-- Add Progress Bar -->
          <div *ngIf="isAdding()" class="progress mb-3">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              style="width: 100%"
            >
              Adding product...
            </div>
          </div>
          <form
            (ngSubmit)="addProduct()"
            #productForm="ngForm"
            [class.opacity-50]="isAdding()"
            [style.pointerEvents]="isAdding() ? 'none' : 'auto'"
          >
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Product Name</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="newProduct.name"
                  name="name"
                  required
                  [disabled]="isAdding()"
                />
              </div>
              <div class="col-md-2 mb-3">
                <label class="form-label">HSN Code</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="newProduct.hsnCode"
                  name="hsnCode"
                  required
                  [disabled]="isAdding()"
                />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Description</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="newProduct.description"
                  name="description"
                  [disabled]="isAdding()"
                />
              </div>
              <div class="col-md-2 mb-3">
                <label class="form-label">Quantity</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newProduct.quantity"
                  name="quantity"
                  required
                  min="0"
                  [disabled]="isAdding()"
                />
              </div>
            </div>
            <div class="row">
              <div class="col-md-3 mb-3">
                <label class="form-label">Rate (₹)</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newProduct.rate"
                  name="rate"
                  required
                  step="0.01"
                  min="0"
                  [disabled]="isAdding()"
                />
              </div>
              <div class="col-md-3 mb-3">
                <label class="form-label">GST %</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newProduct.gstPercentage"
                  name="gstPercentage"
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  [disabled]="isAdding()"
                />
              </div>
              <div class="col-md-6 mb-3 d-flex align-items-end">
                <button
                  type="submit"
                  class="btn btn-success me-2"
                  [disabled]="!productForm.form.valid || isAdding()"
                >
                  <i class="bi bi-save me-1"></i
                  >{{ isAdding() ? 'Adding...' : 'Add Product' }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="resetForm()"
                  [disabled]="isAdding()"
                >
                  <i class="bi bi-x-circle me-1"></i>Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Products List -->
      <div class="card shadow">
        <div class="card-header bg-primary text-white">
          <div class="row align-items-center">
            <div class="col-md-6">
              <h5 class="mb-0">
                Product Inventory ({{ products().length }} total,
                {{ filteredProducts().length }} displayed)
              </h5>
            </div>
            <div class="col-md-6">
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  class="form-control"
                  placeholder="Search products..."
                  [(ngModel)]="searchTerm"
                  (input)="updateSearch()"
                />
                <button class="btn btn-outline-secondary" type="button">
                  <i class="bi bi-search"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div *ngIf="isLoading()" class="text-center py-5">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div
            *ngIf="!isLoading() && filteredProducts().length === 0"
            class="alert alert-info"
          >
            No products found. Add your first product above!
          </div>
          <div
            class="table-responsive"
            *ngIf="!isLoading() && filteredProducts().length > 0"
          >
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Product Name</th>
                  <th>HSN Code</th>
                  <th>Description</th>
                  <th>Rate (₹)</th>
                  <th>Quantity</th>
                  <th>GST %</th>
                  <th>Total Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let product of paginatedProducts">
                  <td>{{ product.name }}</td>
                  <td>{{ product.hsnCode }}</td>
                  <td>{{ product.description }}</td>
                  <td>{{ product.rate | currency : 'INR' }}</td>
                  <td>
                    <input
                      type="number"
                      class="form-control form-control-sm"
                      style="width: 80px;"
                      [value]="product.quantity"
                      (change)="updateQuantity(product.id!, $event)"
                      [disabled]="isUpdating()"
                    />
                  </td>
                  <td>{{ product.gstPercentage }}%</td>
                  <td>
                    {{ product.rate * product.quantity | currency : 'INR' }}
                  </td>
                  <td>
                    <button
                      class="btn btn-sm btn-outline-primary me-2"
                      (click)="startEdit(product)"
                      [disabled]="isEditing() || isDeleting()"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      (click)="deleteProduct(product.id!)"
                      [disabled]="isDeleting()"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <nav class="mt-4" *ngIf="totalPages > 1">
              <ul class="pagination justify-content-center">
                <li class="page-item" [class.disabled]="currentPage() === 1">
                  <button
                    class="page-link"
                    (click)="prevPage()"
                    [disabled]="currentPage() === 1"
                  >
                    Previous
                  </button>
                </li>
                <li
                  class="page-item"
                  *ngFor="let page of [].constructor(totalPages); let i = index"
                  [class.active]="currentPage() === i + 1"
                >
                  <button class="page-link" (click)="goToPage(i + 1)">
                    {{ i + 1 }}
                  </button>
                </li>
                <li
                  class="page-item"
                  [class.disabled]="currentPage() === totalPages"
                >
                  <button
                    class="page-link"
                    (click)="nextPage()"
                    [disabled]="currentPage() === totalPages"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <!-- Edit Product Modal -->
      <div
        *ngIf="isEditing()"
        class="modal d-block"
        style="background: rgba(0, 0, 0, 0.5)"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Product</h5>
              <button
                type="button"
                class="btn-close"
                (click)="cancelEdit()"
                [disabled]="isUpdating()"
              ></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="mb-3">
                  <label class="form-label">Product Name</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="newProduct.name"
                    name="name"
                    [disabled]="isUpdating()"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">HSN Code</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="newProduct.hsnCode"
                    name="hsnCode"
                    [disabled]="isUpdating()"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <input
                    type="text"
                    class="form-control"
                    [(ngModel)]="newProduct.description"
                    name="description"
                    [disabled]="isUpdating()"
                  />
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Rate (₹)</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="newProduct.rate"
                      name="rate"
                      step="0.01"
                      min="0"
                      [disabled]="isUpdating()"
                    />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Quantity</label>
                    <input
                      type="number"
                      class="form-control"
                      [(ngModel)]="newProduct.quantity"
                      name="quantity"
                      min="0"
                      [disabled]="isUpdating()"
                    />
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">GST %</label>
                  <input
                    type="number"
                    class="form-control"
                    [(ngModel)]="newProduct.gstPercentage"
                    name="gstPercentage"
                    step="0.01"
                    min="0"
                    max="100"
                    [disabled]="isUpdating()"
                  />
                </div>
              </form>
              <div *ngIf="isUpdating()" class="progress">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style="width: 100%"
                >
                  Updating...
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="cancelEdit()"
                [disabled]="isUpdating()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="saveEdit()"
                [disabled]="isUpdating()"
              >
                {{ isUpdating() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProductsComponent implements OnInit {
  private firestore = inject(Firestore);

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  isLoading = signal(true);
  isAdding = signal(false);
  isUpdating = signal(false);
  isDeleting = signal(false);
  isEditing = signal(false);
  editingProductId = signal<string | null>(null);

  // Search and filter
  searchTerm = signal('');
  filterBy = signal('all'); // all, name, hsn, rate

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 5;

  newProduct: Product = {
    name: '',
    hsnCode: '',
    description: '',
    rate: 0,
    quantity: 0,
    gstPercentage: 18,
  };

  ngOnInit() {
    this.loadProducts();
  }

  get paginatedProducts(): Product[] {
    const filtered = this.filteredProducts();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts().length / this.itemsPerPage);
  }

  updateSearch() {
    this.currentPage.set(1);
    this.applyFilters();
  }

  updateFilter() {
    this.currentPage.set(1);
    this.applyFilters();
  }

  applyFilters() {
    const search = this.searchTerm().toLowerCase();
    const all = this.products();

    let filtered = all;

    if (search) {
      filtered = all.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(search) ||
          p.hsnCode.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search);
        return matchesSearch;
      });
    }

    this.filteredProducts.set(filtered);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update((page) => page + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
    }
  }

  loadProducts() {
    try {
      this.isLoading.set(true);
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
              description: data.description || '',
              rate: data.rate || 0,
              quantity: data.quantity || 0,
              gstPercentage: data.gstPercentage || 0,
            });
          });
          //console.log('✓ Products loaded:', products.length, products);
          this.products.set(products);
          this.applyFilters();
          this.isLoading.set(false);
        },
        (error: any) => {
          console.error('✗ Error loading products:', error);
          this.isLoading.set(false);
        }
      );
    } catch (error) {
      console.error('✗ Error setting up listener:', error);
      this.isLoading.set(false);
    }
  }

  async addProduct() {
    try {
      this.isAdding.set(true);
      const productsRef = collection(this.firestore, 'products');
      await addDoc(productsRef, this.newProduct);
      //console.log('✓ Product added successfully');
      this.resetForm();
    } catch (error) {
      //console.error('✗ Error adding product:', error);
      alert('Error adding product: ' + (error as any).message);
    } finally {
      this.isAdding.set(false);
    }
  }

  async updateQuantity(productId: string, event: Event) {
    try {
      this.isUpdating.set(true);
      const input = event.target as HTMLInputElement;
      const newQuantity = parseInt(input.value);

      if (!isNaN(newQuantity)) {
        const productRef = doc(this.firestore, 'products', productId);
        await updateDoc(productRef, { quantity: newQuantity });
        console.log('✓ Quantity updated');
      }
    } catch (error) {
      console.error('✗ Error updating quantity:', error);
    } finally {
      this.isUpdating.set(false);
    }
  }

  async deleteProduct(productId: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        this.isDeleting.set(true);
        const productRef = doc(this.firestore, 'products', productId);
        await deleteDoc(productRef);
        console.log('✓ Product deleted');
      } catch (error) {
        console.error('✗ Error deleting product:', error);
      } finally {
        this.isDeleting.set(false);
      }
    }
  }

  startEdit(product: Product) {
    this.editingProductId.set(product.id || null);
    this.newProduct = { ...product };
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.editingProductId.set(null);
    this.isEditing.set(false);
    this.resetForm();
  }

  async saveEdit() {
    if (!this.editingProductId()) return;

    try {
      this.isUpdating.set(true);
      const productRef = doc(
        this.firestore,
        'products',
        this.editingProductId()!
      );
      const { id, ...updateData } = this.newProduct;
      await updateDoc(productRef, updateData);
      console.log('✓ Product updated successfully');
      this.cancelEdit();
    } catch (error) {
      console.error('✗ Error updating product:', error);
      alert('Error updating product: ' + (error as any).message);
    } finally {
      this.isUpdating.set(false);
    }
  }

  resetForm() {
    this.newProduct = {
      name: '',
      hsnCode: '',
      description: '',
      rate: 0,
      quantity: 0,
      gstPercentage: 18,
    };
  }
}
