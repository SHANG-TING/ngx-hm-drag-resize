import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2, EventEmitter, Output } from '@angular/core';
import { forkJoin, fromEvent, Subscription } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

import { addStyle, NgxHmDragResizeService } from './ngx-hm-drag-resize.service';

@Directive({
  selector: '[ngx-hm-resizable]'
})
export class NgxHmResizableDirective implements AfterViewInit, OnDestroy {

  @Output() risizeComplete = new EventEmitter();
  private sub$: Subscription;
  private hm: HammerManager;

  constructor(
    private _elm: ElementRef,
    private _renderer: Renderer2,
    private _service: NgxHmDragResizeService
  ) { }

  ngAfterViewInit(): void {
    const btn = this._renderer.createElement('div') as HTMLElement;

    addStyle(this._renderer, btn, {
      'borderColor': 'transparent #00FF00 #00FF00 transparent',
      'borderStyle': 'solid solid solid solid',
      'borderWidth': '10px',
      'position': 'absolute',
      'bottom': '0',
      'right': '0',
      'cursor': 'nwse-resize',
      'visibility': 'hidden'
    });

    this._renderer.appendChild(this._elm.nativeElement, btn);

    this.hm = new Hammer(btn);

    this.sub$ = forkJoin(
      fromEvent(this._elm.nativeElement, 'mouseover').pipe(
        tap(e => btn.style.visibility = 'visible'),
      ),
      fromEvent(this._elm.nativeElement, 'mouseout').pipe(
        tap(e => btn.style.visibility = 'hidden')
      ),
      this._service.bindResize(this._elm.nativeElement, this.hm, this.risizeComplete)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.hm.destroy();
    this.sub$.unsubscribe();
  }
}
