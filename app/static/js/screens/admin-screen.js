import { api } from "../services/api.js";
import { state } from "../store/state.js";

const ADMIN_PASS = "rog2024";
let adminLoggedIn = false;
let selectedFiles = [];
let editingProductId = null;
let cfg = {
  hasBotToken: false,
  hasChannelId: false,
  webhookUrl: "https://your-server.com/webhook",
};

function toast(message) {
  state.toast?.show(message);
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
  renderManageList(state.products);
  loadConfigFields();
  refreshConfig();
}

function loadConfigFields() {
  document.getElementById("botToken").value = cfg.hasBotToken ? "Configured in .env" : "Missing in .env";
  document.getElementById("channelId").value = cfg.hasChannelId ? "Configured in .env" : "Missing in .env";
  document.getElementById("wurl").textContent = cfg.webhookUrl || "https://your-server.com/webhook";
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

function renderManageList(products) {
  const container = document.getElementById("manageList");
  if (!products.length) {
    container.innerHTML = `<div class="manage-empty">Mahsulotlar yo'q</div>`;
    return;
  }

  container.innerHTML = products
    .map(
      (product) => `
        <div class="mitem">
          ${product.images?.length ? `<img class="mthumb" src="${product.images[0]}" alt="${product.name}">` : `<div class="mthumb thumb-placeholder">Laptop</div>`}
          <div class="minfo">
            <div class="mname">${product.name}</div>
            <div class="mprice">$${product.price} · #${product.id || "-"}</div>
          </div>
          <button class="bdel" data-edit-id="${product._docId}">Edit</button>
          <button class="bdel" data-delete-id="${product._docId}">Del</button>
        </div>
      `,
    )
    .join("");
}

function bindImagePreview() {
  const input = document.getElementById("fImgs");
  const previewGrid = document.getElementById("previewGrid");

  input.addEventListener("change", () => {
    selectedFiles = Array.from(input.files || []);
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
  });

  previewGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (!button) {
      return;
    }

    const removeIndex = Number(button.dataset.removeIndex);
    selectedFiles = selectedFiles.filter((_, index) => index !== removeIndex);
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change"));
  });
}

function clearForm() {
  selectedFiles = [];
  editingProductId = null;
  document.getElementById("productForm").reset();
  document.getElementById("previewGrid").innerHTML = "";
  document.getElementById("submitBtn").textContent = "✅ MAHSULOTNI QO'SHISH";
}

function fillForm(product) {
  editingProductId = product._docId;
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
  document.getElementById("submitBtn").textContent = "💾 MAHSULOTNI YANGILASH";
  selectedFiles = [];
  document.getElementById("previewGrid").innerHTML = "";
}

async function submitProduct(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const submitButton = document.getElementById("submitBtn");
  submitButton.disabled = true;
  const isEditing = Boolean(editingProductId);
  submitButton.textContent = isEditing ? "Updating..." : "Saving...";

  try {
    const saved = isEditing
      ? await api.updateProduct(editingProductId, formData)
      : await api.createProduct(formData);

    const nextProducts = isEditing
      ? state.products.map((item) => (item._docId === editingProductId ? saved : item))
      : [saved, ...state.products];

    state.setProducts(nextProducts);
    renderManageList(nextProducts);
    clearForm();
    toast(isEditing ? "Mahsulot yangilandi" : "Mahsulot saqlandi");
  } catch (error) {
    toast(`Error: ${error.message}`);
  } finally {
    submitButton.disabled = false;
    if (!isEditing) {
      submitButton.textContent = "✅ MAHSULOTNI QO'SHISH";
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
    renderManageList(state.products);
    toast("Mahsulot o'chirildi");
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
  document.getElementById("manageList").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const button = event.target.closest("[data-delete-id]");
    if (editButton) {
      const product = state.products.find((item) => item._docId === editButton.dataset.editId);
      if (product) {
        fillForm(product);
      }
      return;
    }
    if (button) {
      handleDelete(button.dataset.deleteId);
    }
  });

  bindImagePreview();

  state.subscribe((snapshot) => {
    if (adminLoggedIn) {
      renderManageList(snapshot.products);
    }
  });
}
