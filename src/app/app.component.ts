import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'esone';
  constructor(private router: Router){}
  public goTo(route){
    this.router.navigate([`/${route}`]);
  }
}
