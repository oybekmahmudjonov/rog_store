import { renderAppShell } from "./screens/app-shell.js";
import { bindAdminScreen } from "./screens/admin-screen.js";
import { initCatalogScreen } from "./screens/catalog-screen.js";
import { initDetailScreen } from "./screens/detail-screen.js";
import { initIntroScreen } from "./screens/intro-screen.js";
import { Toast } from "./components/toast.js";
import { installGlobalClientLogging, logClientError } from "./services/logger.js";
import { state } from "./store/state.js";
import { api } from "./services/api.js";

function initTelegramMiniApp() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return;
  }

  document.body.classList.add("is-telegram-miniapp");

  try {
    webApp.ready();
    webApp.expand();

    if (typeof webApp.requestFullscreen === "function") {
      webApp.requestFullscreen();
    }

    if (typeof webApp.disableVerticalSwipes === "function") {
      webApp.disableVerticalSwipes();
    }
  } catch (error) {
    logClientError("Failed to initialize Telegram Mini App", {
      message: error.message,
      stack: error.stack || null,
    });
  }
}

const root = document.getElementById("appShell");
root.innerHTML = renderAppShell();

const toast = new Toast(document.getElementById("toast"));
state.setToast(toast);
installGlobalClientLogging();
initTelegramMiniApp();

initIntroScreen();
initDetailScreen();
initCatalogScreen();
bindAdminScreen();

async function boot() {
  try {
    const products = await api.getProducts();
    state.setProducts(products);
  } catch (error) {
    console.error(error);
    logClientError("Failed to load laptops", {
      message: error.message,
      stack: error.stack || null,
    });
    toast.show("Mahsulotlarni yuklashda xato yuz berdi.");
  }
}

boot();
