import { api } from "../services/api.js";
import { state } from "../store/state.js";

const ADMIN_PASS = "rog2024";
const DEFAULT_WEBHOOK_URL = "https://your-server.com/webhook";
const ADD_LABEL = "MAHSULOTNI QO'SHISH";
const UPDATE_LABEL = "MAHSULOTNI YANGILASH";

let adminLoggedIn = false;
let selectedFiles = [];
let editingProductId = null;
let removedImagePaths = [];
let cfg = {
  hasBotToken: false,
  hasChannelId: false,
  webhookUrl: DEFAULT_WEBHOOK_URL,
};
let currentAdminTab = "products";

function sortProducts(products) {
  return [...products].sort((left, right) => {
    const favoriteDelta = Number(Boolean(right.isFavorite)) - Number(Boolean(left.isFavorite));
    if (favoriteDelta !== 0) {
      return favoriteDelta;
    }

    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightTime - leftTime;
  });
}

function toast(message) {
  state.toast?.show(message);
}

function setAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.classList.toggle("on", button.dataset.adminTab === tab);
  });
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
    panel.classList.toggle("admin-panel-active", panel.dataset.adminPanel === tab);
  });
}

function syncSelectedFilesInput() {
  const input = document.getElementById("fImgs");
  const dataTransfer = new DataTransfer();
  selectedFiles.forEach((file) => dataTransfer.items.add(file));
  input.files = dataTransfer.files;
}

function renderManageList(products) {
  const container = document.getElementById("manageList");
  if (!products.length) {
    container.innerHTML = `<div class="manage-empty">Mahsulotlar yo'q</div>`;
    return;
  }

  container.innerHTML = products
    .map((product) => {
      const thumb = product.images?.length
        ? `<img class="mthumb" src="${product.images[0]}" alt="${product.name}">`
        : `<div class="mthumb thumb-placeholder">Laptop</div>`;

      return `
        <div class="mitem">
          ${thumb}
          <div class="minfo">
            <div class="mname">${product.name}</div>
            <div class="mprice">$${product.price} · #${product.id || "-"}</div>
          </div>
          <button class="bdel favorite-btn${product.isFavorite ? " on" : ""}" data-favorite-id="${product._docId}" data-favorite-state="${product.isFavorite ? "1" : "0"}" title="Tepaga chiqarish">
            ${product.isFavorite ? "★" : "☆"}
          </button>
          <button class="bdel" data-edit-id="${product._docId}">Edit</button>
          <button class="bdel" data-delete-id="${product._docId}">Del</button>
        </div>
      `;
    })
    .join("");
}

function renderNewImages() {
  const previewGrid = document.getElementById("previewGrid");
  previewGrid.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const item = document.createElement("div");
      item.className = "pitem";
      item.innerHTML = `
        <img src="${event.target?.result}" alt="${file.name}">
        <button class="prm" type="button" data-remove-index="${index}">X</button>
      `;
      previewGrid.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

function renderExistingImages(product) {
  const container = document.getElementById("existingImages");
  const imageItems = (product?.imageItems || []).filter((item) => !removedImagePaths.includes(item.path));
  if (!imageItems.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <label class="fl">Mavjud rasmlar</label>
    <div class="existing-grid">
      ${imageItems
        .map(
          (item) => `
            <div class="pitem existing-item">
              <img src="${item.url}" alt="${product.name}">
              <button class="prm" type="button" data-remove-existing="${item.path}">X</button>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function loadConfigFields() {
  document.getElementById("botToken").value = cfg.hasBotToken ? "Configured in .env" : "Missing in .env";
  document.getElementById("channelId").value = cfg.hasChannelId ? "Configured in .env" : "Missing in .env";
  document.getElementById("wurl").textContent = cfg.webhookUrl || DEFAULT_WEBHOOK_URL;
}

async function refreshConfig() {
  try {
    const response = await api.getConfig();
    cfg = response.telegram;
    loadConfigFields();
  } catch (error) {
    toast(`Config yuklanmadi: ${error.message}`);
  }
}

function openAdmin() {
  document.getElementById("adminOverlay").classList.add("on");
  document.body.style.overflow = "hidden";
  if (adminLoggedIn) {
    showDashboard();
  }
}

function closeAdmin() {
  document.getElementById("adminOverlay").classList.remove("on");
  document.body.style.overflow = "";
}

function showDashboard() {
  document.getElementById("adminLogin").hidden = true;
  document.getElementById("adminDash").hidden = false;
  setAdminTab("products");
  renderManageList(state.products);
  loadConfigFields();
  refreshConfig();
}

function clearForm() {
  selectedFiles = [];
  editingProductId = null;
  removedImagePaths = [];
  document.getElementById("productForm").reset();
  document.getElementById("previewGrid").innerHTML = "";
  document.getElementById("existingImages").innerHTML = "";
  document.getElementById("submitBtn").textContent = ADD_LABEL;
  syncSelectedFilesInput();
  setAdminTab("form");
}

function fillForm(product) {
  editingProductId = product._docId;
  removedImagePaths = [];
  selectedFiles = [];
  syncSelectedFilesInput();

  const form = document.getElementById("productForm");
  form.elements.productId.value = product.id || "";
  form.elements.name.value = product.name || "";
  form.elements.price.value = product.price || "";
  form.elements.warranty.value = product.warranty || "1 Yil";
  form.elements.cpu.value = product.cpu || "";
  form.elements.ram.value = product.ram || "";
  form.elements.gpu.value = product.gpu || "";
  form.elements.ssd.value = product.ssd || "";
  form.elements.screen.value = product.screen || "";
  form.elements.os.value = product.os || "";
  form.elements.features.value = (product.features || []).join(", ");
  form.elements.note.value = product.note || "";
  form.elements.desc.value = product.desc || "";
  form.elements.isFavorite.checked = Boolean(product.isFavorite);
  document.getElementById("submitBtn").textContent = UPDATE_LABEL;
  document.getElementById("previewGrid").innerHTML = "";
  renderExistingImages(product);
  setAdminTab("form");
}

function bindImagePreview() {
  const input = document.getElementById("fImgs");
  const previewGrid = document.getElementById("previewGrid");

  input.addEventListener("change", () => {
    selectedFiles = Array.from(input.files || []);
    renderNewImages();
  });

  previewGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (!button) {
      return;
    }

    const removeIndex = Number(button.dataset.removeIndex);
    selectedFiles = selectedFiles.filter((_, index) => index !== removeIndex);
    syncSelectedFilesInput();
    renderNewImages();
  });
}

async function submitProduct(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  if (removedImagePaths.length) {
    formData.set("removedImagePaths", removedImagePaths.join(","));
  }

  const submitButton = document.getElementById("submitBtn");
  submitButton.disabled = true;
  const isEditing = Boolean(editingProductId);
  submitButton.textContent = isEditing ? "Updating..." : "Saving...";

  try {
    const saved = isEditing
      ? await api.updateProduct(editingProductId, formData)
      : await api.createProduct(formData);

    const nextProducts = sortProducts(
      isEditing
        ? state.products.map((item) => (item._docId === editingProductId ? saved : item))
        : [saved, ...state.products],
    );

    state.setProducts(nextProducts);
    clearForm();
    toast(isEditing ? "Mahsulot yangilandi" : "Mahsulot saqlandi");
  } catch (error) {
    toast(`Error: ${error.message}`);
  } finally {
    submitButton.disabled = false;
    if (!isEditing) {
      submitButton.textContent = ADD_LABEL;
    }
  }
}

async function handleDelete(productId) {
  const product = state.products.find((item) => item._docId === productId);
  if (!product) {
    return;
  }

  const confirmed = window.confirm(`"${product.name}" ni o'chirishni tasdiqlaysizmi?`);
  if (!confirmed) {
    return;
  }

  try {
    await api.deleteProduct(productId);
    state.setProducts(state.products.filter((item) => item._docId !== productId));
    if (editingProductId === productId) {
      clearForm();
    }
    toast("Mahsulot o'chirildi");
  } catch (error) {
    toast(`Error: ${error.message}`);
  }
}

async function handleFavorite(productId, nextValue) {
  try {
    const updated = await api.setFavorite(productId, nextValue);
    const nextProducts = sortProducts(
      state.products.map((item) => (item._docId === productId ? updated : item)),
    );
    state.setProducts(nextProducts);

    if (editingProductId === productId) {
      const refreshed = nextProducts.find((item) => item._docId === productId);
      if (refreshed) {
        fillForm(refreshed);
      }
    }

    toast(nextValue ? "Mahsulot tepaga biriktirildi" : "Mahsulot oddiy tartibga qaytdi");
  } catch (error) {
    toast(`Error: ${error.message}`);
  }
}

async function handleWebhook() {
  try {
    const response = await api.saveWebhook();
    cfg = { ...cfg, webhookUrl: response.url };
    loadConfigFields();
    toast("Webhook URL .env orqali boshqariladi");
  } catch (error) {
    toast(`Config error: ${error.message}`);
  }
}

export function bindAdminScreen() {
  document.getElementById("openAdminBtn").addEventListener("click", openAdmin);
  document.getElementById("cancelAdminBtn").addEventListener("click", closeAdmin);
  document.getElementById("closeAdminBtn").addEventListener("click", closeAdmin);

  document.getElementById("loginBtn").addEventListener("click", () => {
    const passwordInput = document.getElementById("adminPass");
    if (passwordInput.value === ADMIN_PASS) {
      adminLoggedIn = true;
      showDashboard();
      return;
    }

    passwordInput.style.borderColor = "var(--rog-red)";
    toast("Noto'g'ri parol");
    window.setTimeout(() => {
      passwordInput.style.borderColor = "";
    }, 1500);
  });

  document.getElementById("adminPass").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      document.getElementById("loginBtn").click();
    }
  });

  document.getElementById("webhookBtn").addEventListener("click", handleWebhook);
  document.getElementById("resetBtn").addEventListener("click", clearForm);
  document.getElementById("productForm").addEventListener("submit", submitProduct);
  document.getElementById("adminMobileTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-tab]");
    if (!button) {
      return;
    }
    setAdminTab(button.dataset.adminTab);
  });
  document.getElementById("existingImages").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-existing]");
    if (!button) {
      return;
    }

    removedImagePaths.push(button.dataset.removeExisting);
    const product = state.products.find((item) => item._docId === editingProductId);
    if (product) {
      renderExistingImages(product);
    }
  });

  document.getElementById("manageList").addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite-id]");
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (favoriteButton) {
      handleFavorite(favoriteButton.dataset.favoriteId, favoriteButton.dataset.favoriteState !== "1");
      return;
    }

    if (editButton) {
      const product = state.products.find((item) => item._docId === editButton.dataset.editId);
      if (product) {
        fillForm(product);
      }
      return;
    }

    if (deleteButton) {
      handleDelete(deleteButton.dataset.deleteId);
    }
  });

  bindImagePreview();
  setAdminTab(currentAdminTab);

  state.subscribe((snapshot) => {
    if (!adminLoggedIn) {
      return;
    }

    renderManageList(snapshot.products);
    if (editingProductId) {
      const product = snapshot.products.find((item) => item._docId === editingProductId);
      if (product) {
        renderExistingImages(product);
      }
    }
  });
}
