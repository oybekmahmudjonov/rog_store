export function initIntroScreen() {
  const intro = document.getElementById("intro");
  const app = document.getElementById("app");
  const skipButton = document.getElementById("skipIntroBtn");
  const introVideo = document.getElementById("introVideo");
  const defaultIntroVideo = "/static/media/intro.mp4";
  let hasLaunched = false;

  function launchApp() {
    if (hasLaunched) {
      return;
    }
    hasLaunched = true;

    intro.style.transition = "opacity .6s";
    intro.style.opacity = "0";
    window.setTimeout(() => {
      intro.style.display = "none";
      app.classList.add("on");
    }, 600);
  }

  introVideo.src = defaultIntroVideo;
  introVideo.classList.add("on");

  intro.addEventListener("click", launchApp);
  skipButton.addEventListener("click", launchApp);
  window.setTimeout(launchApp, 2900);
}
