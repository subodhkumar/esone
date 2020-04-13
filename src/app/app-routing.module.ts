import { RouteThreeComponent } from './route-three/route-three.component';
import { RouteTwoComponent } from './route-two/route-two.component';
import { RouteOneComponent } from './route-one/route-one.component';
import { HomeComponent } from './home/home.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: "full",
    component: HomeComponent
  },
  {
    path: 'route1',
    component: RouteOneComponent
  },
  {
    path: 'route2',
    component: RouteTwoComponent
  },
  {
    path: 'route3',
    component: RouteThreeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
