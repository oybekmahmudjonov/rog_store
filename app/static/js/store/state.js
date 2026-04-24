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
    this.products = [...products].sort((left, right) => {
      const favoriteDelta = Number(Boolean(right.isFavorite)) - Number(Boolean(left.isFavorite));
      if (favoriteDelta !== 0) {
        return favoriteDelta;
      }

      const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
      return rightTime - leftTime;
    });
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
