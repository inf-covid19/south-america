import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapchartComponent } from './mapchart.component';

describe('MapchartComponent', () => {
  let component: MapchartComponent;
  let fixture: ComponentFixture<MapchartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapchartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
