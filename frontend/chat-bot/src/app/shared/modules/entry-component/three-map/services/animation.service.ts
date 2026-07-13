import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AnimationService {
    private animationId: number | null = null;
    private animationCallback: (() => void) | null = null;

    startAnimation(callback: () => void): void {
        this.animationCallback = callback;
        this.animate();
    }

    private animate = (): void => {
        this.animationId = requestAnimationFrame(this.animate);
        if (this.animationCallback) {
            this.animationCallback();
        }
    };

    stopAnimation(): void {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.animationCallback = null;
    }

    getAnimationId(): number | null {
        return this.animationId;
    }
}