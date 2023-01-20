import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';

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
  allProductArray: [] = [];
  progressBarForLoadingAllTheProducts: boolean = false;
  dateTime = new Date();
  uniqueProductId: any;
  totalNumberOfProducts: any;
  searchText = '';

  @ViewChild('close') addNewProductModel?: ElementRef;
  @ViewChild('closeUpdateModel') closeEditProductModel?: ElementRef;

  constructor(
    private firestore: FirestoreService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.getAllTheProducts();
    this.progressBarForLoadingAllTheProducts = true;

    this.productForm = new FormGroup({
      product_name: new FormControl('', Validators.required),
      product_purchase_date: new FormControl('', Validators.required),
      product_total_quantity: new FormControl('', Validators.required),
      product_total_rate: new FormControl('', Validators.required),
      product_rate_for_one_quantity: new FormControl(),
      product_creation_timestamp: new FormControl(this.dateTime),
      product_updation_timestamp: new FormControl(this.dateTime),
    });
  }

  ngOnInit(): void {}

  goToHomePage() {
    this.router.navigateByUrl('home');
  }

  // add new prodcut
  async addNewProduct() {
    this.progressBar = true;
    await this.firestore
      .createProductInsideFirestoreDB({
        product_name: this.productForm.value.product_name,
        product_purchase_date: this.productForm.value.product_purchase_date,
        product_total_quantity: this.productForm.value.product_total_quantity,
        product_total_rate: this.productForm.value.product_total_rate,
        product_rate_for_one_quantity:
          this.productForm.value.product_rate_for_one_quantity,
        product_creation_timestamp: this.dateTime,
        product_updation_timestamp: null,
      })
      .then(async (success) => {
        this.progressBar = true;
        this.addNewProductModel?.nativeElement.click();
        await this.snackBar.open('Success', 'Product added', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
      })
      .catch(async (error) => {
        this.progressBar = true;
        this.addNewProductModel?.nativeElement.click();
        await this.snackBar.open('Error', error.message, {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
      });
    this.progressBar = false;
    this.productForm.reset();
  }

  //calculate quantity
  async calculateOneQuantity() {
    this.rateForOneQuantity =
      this.productForm.value.product_total_rate /
      this.productForm.value.product_total_quantity;

    await this.productForm
      .get('product_rate_for_one_quantity')
      ?.setValue(this.rateForOneQuantity);
  }

  //get all products
  async getAllTheProducts() {
    this.progressBarForLoadingAllTheProducts = true;
    await this.firestore
      .getAllProductFromFirestoreDB()
      .subscribe((response: any) => {
        this.progressBarForLoadingAllTheProducts = true;
        this.allProductArray = response.map((product: any) => {
          this.progressBarForLoadingAllTheProducts = true;

          return [product.payload.doc.id, product.payload.doc.data()];
        });
        this.totalNumberOfProducts = this.allProductArray.length;
        this.progressBarForLoadingAllTheProducts = false;
      });
  }

  // delete product
  async deleteProduct(id: any) {
    this.progressBarForLoadingAllTheProducts = true;
    await this.firestore
      .deleteProductById(id)
      .then(async (success) => {
        this.progressBarForLoadingAllTheProducts = true;
        await this.snackBar.open('Success', 'Product deleted', {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
        this.progressBarForLoadingAllTheProducts = false;
      })
      .catch(async (error) => {
        this.progressBarForLoadingAllTheProducts = true;
        await this.snackBar.open('Error', error.message, {
          duration: 3000,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
        });
        this.progressBarForLoadingAllTheProducts = false;
      });
    this.progressBarForLoadingAllTheProducts = false;
  }

  // update product by id
  async editProduct(id: any) {
    this.uniqueProductId = id;
    await this.firestore.getProductById(id).subscribe(async (res: any) => {
      this.productForm = new FormGroup({
        product_name: new FormControl(res.product_name),
        product_purchase_date: new FormControl(res.product_purchase_date),
        product_total_quantity: new FormControl(res.product_total_quantity),
        product_total_rate: new FormControl(res.product_total_rate),
        product_rate_for_one_quantity: new FormControl(
          res.product_rate_for_one_quantity
        ),
        product_creation_timestamp: new FormControl(
          res.product_creation_timestamp
        ),
        product_updation_timestamp: new FormControl(),
      });
    });
  }

  // update product
  async updateProductById() {
    this.progressBarForUpdation = true;
    await this.firestore
      .updateProductByIdAndFormValues(this.uniqueProductId, {
        product_name: this.productForm.value.product_name,
        product_purchase_date: this.productForm.value.product_purchase_date,
        product_total_quantity: this.productForm.value.product_total_quantity,
        product_total_rate: this.productForm.value.product_total_rate,
        product_rate_for_one_quantity:
          this.productForm.value.product_rate_for_one_quantity,
        product_creation_timestamp:
          this.productForm.value.product_creation_timestamp,
        product_updation_timestamp: this.dateTime,
      })
      .then(async (success) => {
        this.progressBarForLoadingAllTheProducts = true;
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
    this.progressBarForLoadingAllTheProducts = false;
  }
}
