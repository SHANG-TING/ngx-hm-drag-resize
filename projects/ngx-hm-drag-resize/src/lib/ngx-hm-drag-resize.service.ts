import { EventEmitter, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';
import { finalize, switchMap, take, takeUntil, tap } from 'rxjs/operators';

// tslint:disable-next-line:import-blacklist


/**
 * Example
<div #continer style="width: 500px; height:500px; position: absolute; left:50px; top:50px; border:1px solid white">

  <div style="position: relative;">

      <div hm-draggable [hm-draggable-container]="continer"
           hm-resize style="width:200px;height:200px;background:chocolate">
          sdadasd
        </div>
  </div>

</div>
 */
@Injectable({
  providedIn: 'root'
})
export class NgxHmDragResizeService {

  private resize$ = new Subject();

  private _renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  bindDrag(
    elm: HTMLElement,
    hm: HammerManager,
    container: HTMLElement,
    dragComplete: EventEmitter<any>): Observable<any> {

    hm.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    const panStart$ = fromEvent(hm, 'panstart');
    const panMove$ = fromEvent(hm, 'panmove');
    const panEnd$ = fromEvent(hm, 'panend');

    return panStart$.pipe(
      switchMap((p: HammerInput) => {
        const cursor = elm.style.cursor;
        // set grabbing
        this._renderer.setStyle(elm, 'cursor', 'grabbing');
        this._renderer.setStyle(elm, 'cursor', '-webkit-grabbing');
        // Get the starting point on pan-start
        // don't use getBoundingClientRect, because the container maybe has some style on it
        const startPoint = {
          left: parseFloat(elm.style.left) || 0,
          top: parseFloat(elm.style.top) || 0,
        };

        let containerZero: ClientRect | DOMRect;

        if (container) {
          containerZero = container.getBoundingClientRect();
        }
        let goPoint;
        // Create observable to handle pan-move and stop on pan-end
        return panMove$.pipe(
          tap((e: HammerInput) => {

            goPoint = {
              left: startPoint.left + e.deltaX,
              top: startPoint.top + e.deltaY,
              width: e.target.offsetWidth,
              height: e.target.offsetHeight
            };

            if (container) {
              goPoint = this.getMovePoint(goPoint, containerZero);
            }
            addStyle(this._renderer, elm, {
              left: `${goPoint.left}px`,
              top: `${goPoint.top}px`
            });
          }),
          takeUntil(panEnd$.pipe(
            tap(() => {
              if (goPoint) {
                dragComplete.emit({
                  left: goPoint.left,
                  top: goPoint.top
                });
              }
            })
          )),
          // when resize, cancel this event
          takeUntil(this.resize$),
          // reset to
          finalize(() => {
            this._renderer.setStyle(elm, 'cursor', '-webkit-grab');
            this._renderer.setStyle(elm, 'cursor', 'grab');
          })
        );
      })
    );
  }

  private getMovePoint(
    startPoint: {
      left: number;
      top: number;
      width: number,
      height: number
    },
    containerZero: ClientRect | DOMRect) {

    const elmRightBottom = {
      left: startPoint.left + startPoint.width,
      top: startPoint.top + startPoint.height
    };

    if (startPoint.left < 0) {
      startPoint.left = 0;
    } else if (elmRightBottom.left > containerZero.width) {
      startPoint.left = containerZero.width - startPoint.width;
    }

    if (startPoint.top < 0) {
      startPoint.top = 0;
    } else if (elmRightBottom.top > containerZero.height) {
      startPoint.top = containerZero.height - startPoint.height;
    }
    return startPoint;
  }

  private getDistance(goPoint: { x: number; y: number; }) {
    return Math.sqrt(
      Math.pow(goPoint.x, 2) + Math.pow(goPoint.y, 2)
    );
  }

  bindResize(
    container: HTMLElement,
    hm: HammerManager,
    risizeComplete: EventEmitter<any>): Observable<any> {

    hm.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    const panStart$ = fromEvent(hm, 'panstart');
    const panMove$ = fromEvent(hm, 'panmove');
    const panEnd$ = fromEvent(hm, 'panend');

    return panStart$.pipe(
      switchMap(() => {
        // Get the starting point on pan-start
        const boundingClientRect = container.getBoundingClientRect();

        // because the trigger event is overlapping, stop the resize event when resize start
        this.resize$.next();

        // Create observable to handle pan-move and stop on pan-end
        return panMove$.pipe(
          tap((pmEvent: HammerInput) => {
            addStyle(this._renderer, container, {
              height: `${pmEvent.center.y - boundingClientRect.top}px`,
              width: `${pmEvent.center.x - boundingClientRect.left}px`,
            });
          }),
          takeUntil(panEnd$.pipe(
            tap(() => risizeComplete.emit({
              height: container.clientHeight,
              width: container.clientWidth,
            }))
          ))
        );
      })
    );
  }

}

export function addStyle(_renderer: Renderer2, elm: HTMLElement, style: { [key: string]: string | number }) {
  if (style) {
    Object.keys(style).forEach((key) => {
      const value = style[key];
      _renderer.setStyle(elm, key, value);
    });
  }
}
