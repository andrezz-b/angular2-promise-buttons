import {Angular2PromiseButtonModule} from '../../../angular2-promise-buttons/src';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    Angular2PromiseButtonModule
      .forRoot({
        // handleCurrentBtnOnly: true,
      }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
