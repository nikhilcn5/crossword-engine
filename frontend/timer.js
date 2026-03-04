export class PuzzleTimer {
  constructor(onTick) {
    this.onTick = onTick;
    this.elapsedSeconds = 0;
    this.interval = null;
  }

  start() {
    this.stop();
    this.elapsedSeconds = 0;
    this.onTick(this.format());
    this.interval = setInterval(() => {
      this.elapsedSeconds += 1;
      this.onTick(this.format());
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  format() {
    const minutes = String(Math.floor(this.elapsedSeconds / 60)).padStart(2, '0');
    const seconds = String(this.elapsedSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
