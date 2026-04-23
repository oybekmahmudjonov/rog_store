export class Toast {
  constructor(element) {
    this.element = element;
    this.timeoutId = null;
  }

  show(message) {
    this.element.textContent = message;
    this.element.classList.add("on");
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.element.classList.remove("on");
    }, 3200);
  }
}
