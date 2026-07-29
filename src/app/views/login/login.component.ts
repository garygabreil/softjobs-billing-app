import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { getControlError, markAllControlsTouched } from 'src/app/utils/form-validators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  currentYear = new Date().getFullYear();
  submitted = false;
  loginFailed = false;

  constructor(private router: Router) {
    this.loginForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {}

  fieldError(name: string): string {
    return getControlError(this.loginForm.get(name), name === 'username' ? 'Username' : 'Password');
  }

  login(): void {
    this.submitted = true;
    this.loginFailed = false;
    markAllControlsTouched(this.loginForm);

    if (this.loginForm.invalid) {
      return;
    }

    if (
      this.loginForm.value.password === 'admin' &&
      this.loginForm.value.username === 'admin'
    ) {
      this.router.navigateByUrl('home');
      localStorage.setItem('user', 'user_logged');
      return;
    }

    this.loginFailed = true;
  }
}
