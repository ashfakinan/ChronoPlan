/**
 * dragAutoScroll.ts
 * High-performance, frame-budgeted auto-scroller for touch & pointer drag operations.
 * Automatically scrolls containers and the viewport when a finger or pointer
 * approaches or extends past the boundary edges.
 */

export interface AutoScrollOptions {
  threshold?: number; // Distance in pixels from edge where scrolling begins (default: 80)
  maxSpeed?: number;  // Max pixels per frame to scroll (default: 20)
  scrollContainer?: HTMLElement | null; // Specific scroll container (e.g. table wrapper)
  scrollWindow?: boolean; // Whether to scroll the window if container can't scroll further (default: true)
  onTargetCheck?: (x: number, y: number) => void; // Callback to re-detect target under stationary finger
  onDirectionChange?: (directions: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }) => void;
}

export class DragAutoScroller {
  private threshold: number;
  private maxSpeed: number;
  private scrollContainer: HTMLElement | null = null;
  private scrollWindow: boolean;
  private onTargetCheck?: (x: number, y: number) => void;
  private onDirectionChange?: (dirs: { up: boolean; down: boolean; left: boolean; right: boolean }) => void;

  private isRunning = false;
  private animFrameId: number | null = null;
  private currentX = 0;
  private currentY = 0;

  private activeDirections = { up: false, down: false, left: false, right: false };

  constructor(options: AutoScrollOptions = {}) {
    this.threshold = options.threshold ?? 80;
    this.maxSpeed = options.maxSpeed ?? 20;
    this.scrollContainer = options.scrollContainer ?? null;
    this.scrollWindow = options.scrollWindow ?? true;
    this.onTargetCheck = options.onTargetCheck;
    this.onDirectionChange = options.onDirectionChange;
  }

  public setContainer(container: HTMLElement | null) {
    this.scrollContainer = container;
  }

  public updatePointer(clientX: number, clientY: number) {
    this.currentX = clientX;
    this.currentY = clientY;

    if (!this.isRunning) {
      this.start();
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.updateDirections(false, false, false, false);
  }

  private updateDirections(up: boolean, down: boolean, left: boolean, right: boolean) {
    if (
      this.activeDirections.up !== up ||
      this.activeDirections.down !== down ||
      this.activeDirections.left !== left ||
      this.activeDirections.right !== right
    ) {
      this.activeDirections = { up, down, left, right };
      this.onDirectionChange?.(this.activeDirections);
    }
  }

  private tick = () => {
    if (!this.isRunning) return;

    let scrolledX = 0;
    let scrolledY = 0;

    let dirUp = false;
    let dirDown = false;
    let dirLeft = false;
    let dirRight = false;

    // 1. Check Container bounds if present
    const container = this.scrollContainer || document.getElementById('planner-matrix-scroll');

    if (container) {
      const rect = container.getBoundingClientRect();
      const edgeThreshold = Math.min(this.threshold, rect.width / 4, rect.height / 4);

      // Check vertical within container
      if (this.currentY >= rect.top && this.currentY <= rect.bottom) {
        if (this.currentY < rect.top + edgeThreshold) {
          const ratio = Math.max(0, Math.min(1, (rect.top + edgeThreshold - this.currentY) / edgeThreshold));
          const speed = Math.round(ratio * this.maxSpeed);
          if (container.scrollTop > 0) {
            container.scrollTop -= speed;
            scrolledY -= speed;
            dirUp = true;
          }
        } else if (this.currentY > rect.bottom - edgeThreshold) {
          const ratio = Math.max(0, Math.min(1, (this.currentY - (rect.bottom - edgeThreshold)) / edgeThreshold));
          const speed = Math.round(ratio * this.maxSpeed);
          const maxScroll = container.scrollHeight - container.clientHeight;
          if (container.scrollTop < maxScroll) {
            container.scrollTop += speed;
            scrolledY += speed;
            dirDown = true;
          }
        }
      }

      // Check horizontal within container
      if (this.currentX >= rect.left && this.currentX <= rect.right) {
        if (this.currentX < rect.left + edgeThreshold) {
          const ratio = Math.max(0, Math.min(1, (rect.left + edgeThreshold - this.currentX) / edgeThreshold));
          const speed = Math.round(ratio * this.maxSpeed);
          if (container.scrollLeft > 0) {
            container.scrollLeft -= speed;
            scrolledX -= speed;
            dirLeft = true;
          }
        } else if (this.currentX > rect.right - edgeThreshold) {
          const ratio = Math.max(0, Math.min(1, (this.currentX - (rect.right - edgeThreshold)) / edgeThreshold));
          const speed = Math.round(ratio * this.maxSpeed);
          const maxScroll = container.scrollWidth - container.clientWidth;
          if (container.scrollLeft < maxScroll) {
            container.scrollLeft += speed;
            scrolledX += speed;
            dirRight = true;
          }
        }
      }
    }

    // 2. Viewport / Window scrolling (fallback & full screen boundary assistance)
    if (this.scrollWindow) {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const vpThreshold = Math.min(this.threshold, vh / 6, vw / 6);

      // Viewport Top
      if (this.currentY < vpThreshold) {
        const ratio = Math.max(0, Math.min(1, (vpThreshold - this.currentY) / vpThreshold));
        const speed = Math.round(ratio * this.maxSpeed);
        if (window.scrollY > 0) {
          window.scrollBy(0, -speed);
          scrolledY -= speed;
          dirUp = true;
        }
      } else if (this.currentY > vh - vpThreshold) {
        // Viewport Bottom
        const ratio = Math.max(0, Math.min(1, (this.currentY - (vh - vpThreshold)) / vpThreshold));
        const speed = Math.round(ratio * this.maxSpeed);
        window.scrollBy(0, speed);
        scrolledY += speed;
        dirDown = true;
      }

      // Viewport Left (for narrow screens)
      if (this.currentX < vpThreshold) {
        const ratio = Math.max(0, Math.min(1, (vpThreshold - this.currentX) / vpThreshold));
        const speed = Math.round(ratio * this.maxSpeed);
        if (window.scrollX > 0) {
          window.scrollBy(-speed, 0);
          scrolledX -= speed;
          dirLeft = true;
        }
      } else if (this.currentX > vw - vpThreshold) {
        // Viewport Right
        const ratio = Math.max(0, Math.min(1, (this.currentX - (vw - vpThreshold)) / vpThreshold));
        const speed = Math.round(ratio * this.maxSpeed);
        window.scrollBy(speed, 0);
        scrolledX += speed;
        dirRight = true;
      }
    }

    this.updateDirections(dirUp, dirDown, dirLeft, dirRight);

    // If we scrolled, elements moved under the stationary finger!
    // Trigger element check so drop target updates continuously.
    if (scrolledX !== 0 || scrolledY !== 0) {
      this.onTargetCheck?.(this.currentX, this.currentY);
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  };
}
