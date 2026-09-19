/**
 * 全站文字动画调度器：保证一屏内只有一个入场主角在播放
 * 优先级：Banner C (3) > Cascade D (2) > Lamp F (1)
 */

interface ActiveClaim {
  id: string;
  priority: number;
  resolve: (canPlay: boolean) => void;
  timer: NodeJS.Timeout;
}

class TextChoreographer {
  private currentOwner: { id: string; priority: number } | null = null;
  private queue: ActiveClaim[] = [];

  /**
   * 申请入场播放权。如果当前有正在播放的动画，则排队，最多等待 timeoutMs (默认 1200ms)
   */
  public claim(
    id: string,
    priority: number,
    timeoutMs: number = 1200
  ): Promise<boolean> {
    if (typeof window === "undefined") {
      return Promise.resolve(true);
    }

    // 如果当前空闲，直接获得播放权
    if (!this.currentOwner) {
      this.currentOwner = { id, priority };
      return Promise.resolve(true);
    }

    // 若当前占用者就是自己，继续
    if (this.currentOwner.id === id) {
      return Promise.resolve(true);
    }

    // 否则进入排队，并挂载超时保护（最多等 1200ms）
    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // 超时强制放行，保证文字不会永久等待
          this.removeFromQueue(id);
          this.currentOwner = { id, priority };
          resolve(true);
        }
      }, timeoutMs);

      const claimEntry: ActiveClaim = {
        id,
        priority,
        resolve: (canPlay) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve(canPlay);
          }
        },
        timer,
      };

      // 按优先级插入队列（高优先级排前面）
      const insertIdx = this.queue.findIndex((q) => q.priority < priority);
      if (insertIdx === -1) {
        this.queue.push(claimEntry);
      } else {
        this.queue.splice(insertIdx, 0, claimEntry);
      }
    });
  }

  /**
   * 释放播放权，唤醒队列中的下一个等待者
   */
  public release(id: string): void {
    if (this.currentOwner && this.currentOwner.id === id) {
      this.currentOwner = null;
    }
    this.removeFromQueue(id);

    if (this.queue.length > 0 && !this.currentOwner) {
      const next = this.queue.shift();
      if (next) {
        this.currentOwner = { id: next.id, priority: next.priority };
        next.resolve(true);
      }
    }
  }

  private removeFromQueue(id: string) {
    const idx = this.queue.findIndex((q) => q.id === id);
    if (idx !== -1) {
      clearTimeout(this.queue[idx].timer);
      this.queue.splice(idx, 1);
    }
  }
}

export const choreographer = new TextChoreographer();
