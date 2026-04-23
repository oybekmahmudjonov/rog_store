import { renderCard } from "../components/cards.js";
import { filterProducts } from "../services/filters.js";
import { state } from "../store/state.js";
import { openDetail } from "./detail-screen.js";

function buyNow(product) {
  const message = `Salom! ${product.name} (#${product.id}) ga qiziqaman. Narx: $${product.price}`;
  window.open(`https://t.me/rogadmin?text=${encodeURIComponent(message)}`, "_blank");
}

export function initCatalogScreen() {
  const catalog = document.getElementById("catalog");
  const statCount = document.getElementById("statCount");
  const emptyState = document.getElementById("emptyState");
  const filterBar = document.getElementById("filterBar");

  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) {
      return;
    }

    filterBar.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("on"));
    button.classList.add("on");
    state.setFilter(button.dataset.filter);
  });

  catalog.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    const card = event.target.closest("[data-product-id]");
    const productId = actionButton?.dataset.productId || card?.dataset.productId;
    if (!productId) {
      return;
    }

    const product = state.products.find((item) => item._docId === productId);
    if (!product) {
      return;
    }

    if (actionButton?.dataset.action === "buy") {
      event.stopPropagation();
      buyNow(product);
      return;
    }

    openDetail(productId, state.products);
  });

  state.subscribe((snapshot) => {
    const filtered = filterProducts(snapshot.products, snapshot.currentFilter);
    statCount.textContent = snapshot.products.length;
    emptyState.hidden = filtered.length > 0;
    catalog.innerHTML = filtered.map((product, index) => renderCard(product, index)).join("");
  });
}
