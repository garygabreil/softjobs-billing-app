import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore) {}

  /* database service to create Products inside firestore*/
  createProductInsideFirestoreDB(doc: any) {
    return this.firestore.collection('Products').add(doc);
  }

  /* get all Product from firestore database */
  getAllProductFromFirestoreDB() {
    return this.firestore.collection('Products').snapshotChanges();
  }

  /* get Product by id */
  getProductById(id: any) {
    return this.firestore.collection('Products').doc(id).valueChanges();
  }

  /* update Product by id and form values */
  updateProductByIdAndFormValues(id: any, Product: any) {
    return this.firestore.collection('Products').doc(id).update(Product);
  }

  /* delete Product by id */
  deleteProductById(id: any) {
    return this.firestore.collection('Products').doc(id).delete();
  }

  //invoice
  /* database service to create Products inside firestore*/
  createInvoiceInsideFirestoreDB(doc: any) {
    return this.firestore.collection('invoices').add(doc);
  }

  /* get all Product from firestore database */
  getAllInvoiceFromFirestoreDB() {
    return this.firestore.collection('invoices').snapshotChanges();
  }

  /* get Product by id */
  getInvoiceById(id: any) {
    return this.firestore.collection('invoices').doc(id).valueChanges();
  }

  /* update Product by id and form values */
  updateInvoiceByIdAndFormValues(id: any, Product: any) {
    return this.firestore.collection('invoices').doc(id).update(Product);
  }

  /* delete Product by id */
  deleteInvoiceById(id: any) {
    return this.firestore.collection('invoices').doc(id).delete();
  }

  //user
  /* database service to create user inside firestore*/
  createUserInsideFirestoreDB(doc: any) {
    return this.firestore.collection('user').add(doc);
  }

  /* get all user from firestore database */
  getAllUserFromFirestoreDB() {
    return this.firestore.collection('user').snapshotChanges();
  }

  /* get user by id */
  getUserById(id: any) {
    return this.firestore.collection('user').doc(id).valueChanges();
  }

  /* update user by id and form values */
  updateUserByIdAndFormValues(id: any, Product: any) {
    return this.firestore.collection('user').doc(id).update(Product);
  }

  /* delete user by id */
  deleteUseryId(id: any) {
    return this.firestore.collection('user').doc(id).delete();
  }
}
