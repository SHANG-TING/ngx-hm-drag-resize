import { AfterViewInit, Directive, ElementRef, OnDestroy, Renderer2, Input, Output, EventEmitter } from '@angular/core';
import { forkJoin, fromEvent, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { addStyle, NgxHmDragResizeService } from './ngx-hm-drag-resize.service';

@Directive({
  selector: '[ngx-hm-draggable]'
})
export class NgxHmDraggableDirective implements AfterViewInit, OnDestroy {

  @Input('hm-draggable-container') container: HTMLElement;
  @Output() dragComplete = new EventEmitter();

  private sub$: Subscription;

  private hm: HammerManager;

  constructor(
    private _elm: ElementRef,
    private _renderer: Renderer2,
    private _service: NgxHmDragResizeService) { }

  ngAfterViewInit(): void {
    const elm = this._elm.nativeElement as HTMLElement;

    this.hm = new Hammer(elm);

    this.sub$ = forkJoin(
      fromEvent(this._elm.nativeElement, 'mouseover').pipe(
        tap(e => elm.style.backgroundColor = '#fcfda9'),
      ),
      fromEvent(this._elm.nativeElement, 'mouseout').pipe(
        tap(e => elm.style.backgroundColor = '')
      ),
      this._service.bindDrag(elm, this.hm, this.container, this.dragComplete),

    ).subscribe();
  }

  ngOnDestroy(): void {
    this.hm.destroy();
    this.sub$.unsubscribe();
  }
}
