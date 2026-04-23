class AppState {
  constructor() {
    this.products = [];
    this.currentFilter = "all";
    this.listeners = new Set();
    this.toast = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this));
  }

  setProducts(products) {
    this.products = products;
    this.notify();
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.notify();
  }

  setToast(toast) {
    this.toast = toast;
  }
}

export const state = new AppState();
