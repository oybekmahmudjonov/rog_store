export function initIntroScreen() {
  const intro = document.getElementById("intro");
  const app = document.getElementById("app");
  const skipButton = document.getElementById("skipIntroBtn");
  const introVideo = document.getElementById("introVideo");
  const defaultIntroVideo = "/static/media/intro.mp4";
  let hasLaunched = false;
  let introStarted = false;

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

  async function startIntroPlayback() {
    if (introStarted) {
      return;
    }
    introStarted = true;

    introVideo.src = defaultIntroVideo;
    introVideo.currentTime = 0;
    introVideo.volume = 1;
    introVideo.classList.add("on");

    try {
      introVideo.muted = false;
      await introVideo.play();
    } catch {
      // Most mobile browsers block autoplay with audio. Fall back to muted playback
      // so the intro still runs smoothly instead of appearing frozen.
      introVideo.muted = true;
      try {
        await introVideo.play();
      } catch {
        // Leave the frame visible if the browser blocks all autoplay.
      }
    }
  }

  startIntroPlayback();
  introVideo.addEventListener("ended", launchApp);
  intro.addEventListener("click", launchApp);
  skipButton.addEventListener("click", launchApp);
}
