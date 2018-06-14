import 'hammerjs';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgxHmDragResizeModule } from 'ngx-hm-drag-resize';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxHmDragResizeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
