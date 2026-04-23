async function sendClientLog(level, message, context = {}) {
  try {
    await fetch("/api/client-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        level,
        message,
        context,
      }),
    });
  } catch (error) {
    console.error("Failed to send client log", error);
  }
}

export function installGlobalClientLogging() {
  window.addEventListener("error", (event) => {
    sendClientLog("error", event.message || "Unhandled window error", {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    sendClientLog("error", "Unhandled promise rejection", {
      reason: typeof reason === "object" ? JSON.stringify(reason, Object.getOwnPropertyNames(reason)) : String(reason),
      stack: reason?.stack || null,
    });
  });
}

export function logClientError(message, context = {}) {
  console.error(message, context);
  sendClientLog("error", message, context);
}
