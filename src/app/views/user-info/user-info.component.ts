import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css'],
})
export class UserInfoComponent implements OnInit {
  userCreationForm: FormGroup;
  progressBar: boolean = false;
  showAlertofPasswordMissMatch: boolean = false;
  @ViewChild('closeModal') dimissModelDuringInvoiceCreation?: ElementRef;

  constructor(private router: Router, private firestore: FirestoreService) {
    this.userCreationForm = new FormGroup({
      name: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      retype_password: new FormControl('', Validators.required),
      role: new FormControl(''),
      status: new FormControl(''),
    });
  }

  ngOnInit(): void {}
  goToHomePage() {
    this.router.navigateByUrl('/home');
  }
  async createUser() {
    this.progressBar = true;
    if (
      this.userCreationForm.value.password ===
      this.userCreationForm.value.retype_password
    ) {
      await this.firestore
        .createUserInsideFirestoreDB(this.userCreationForm.value)
        .then(async (success) => {
          this.progressBar = false;
          this.dimissModelDuringInvoiceCreation?.nativeElement.click();
          this.userCreationForm.reset();
        })
        .catch((err) => {
          alert(err.message);
        });
    } else {
      this.showAlertofPasswordMissMatch = true;
    }
  }
}
