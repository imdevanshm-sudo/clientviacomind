const DEFAULT_VIDEO_ID = "HDcG6zPha90";

function getEmbedUrl(videoId) {
  const safeId = encodeURIComponent(videoId || DEFAULT_VIDEO_ID);
  return `https://www.youtube.com/embed/${safeId}?autoplay=1&rel=0&modestbranding=1`;
}

export function initShowreelModal() {
  const modal = document.querySelector("[data-showreel-modal]");
  if (!modal) return;

  const frame = modal.querySelector("[data-showreel-frame]");
  if (!(frame instanceof HTMLIFrameElement)) return;

  const openButtons = [...document.querySelectorAll("[data-showreel-open]")];
  const closeButtons = [...modal.querySelectorAll("[data-showreel-close]")];
  const videoId = modal.dataset.videoId || DEFAULT_VIDEO_ID;

  let previousActiveElement = null;

  function openModal(event) {
    event?.preventDefault();
    previousActiveElement = document.activeElement;
    frame.src = getEmbedUrl(videoId);
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    closeButtons[0]?.focus();
  }

  function closeModal() {
    frame.src = "";
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
    if (previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus();
    }
  }

  openButtons.forEach((button) => button.addEventListener("click", openModal));
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (modal.classList.contains("hidden")) return;
    closeModal();
  });
}
