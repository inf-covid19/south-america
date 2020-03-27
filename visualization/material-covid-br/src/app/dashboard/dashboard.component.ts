import { Component, OnInit } from '@angular/core';
import PerfectScrollbar from 'perfect-scrollbar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    myCustomScrollbar: any;
  constructor() { }

  ngOnInit() {
      const self = this;
      this.myCustomScrollbar = document.getElementsByClassName('my-custom-scrollbar');
      // tslint:disable-next-line:forin
      for (const item in self.myCustomScrollbar) {
          const ps = new PerfectScrollbar(self.myCustomScrollbar[item]);

          const scrollbarY = self.myCustomScrollbar[item].querySelector('.ps__rail-y');

          self.myCustomScrollbar[item].onscroll = function () {
              scrollbarY.style.cssText = `top: ${this.scrollTop}px!important; height: 400px; right: ${-this.scrollLeft}px`;
          }
      };
  }

}
