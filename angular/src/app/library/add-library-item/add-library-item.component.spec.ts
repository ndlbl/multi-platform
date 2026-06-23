import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLibraryItemComponent } from './add-library-item.component';

describe('AddLibraryItemComponent', () => {
  let component: AddLibraryItemComponent;
  let fixture: ComponentFixture<AddLibraryItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLibraryItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddLibraryItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
