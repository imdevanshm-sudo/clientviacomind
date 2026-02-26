const CONTENT_PATH = "/assets/data/site-content.json";

/** @type {any | null} */
let cachedContent = null;

async function loadContent() {
  if (cachedContent) return cachedContent;

  const response = await fetch(CONTENT_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load site content: ${response.status}`);
  }

  cachedContent = await response.json();
  return cachedContent;
}

function setText(root, selector, value) {
  if (!value) return;
  root.querySelectorAll(selector).forEach((el) => {
    el.textContent = value;
  });
}

function setLink(root, selector, href) {
  if (!href) return;
  root.querySelectorAll(selector).forEach((el) => {
    el.setAttribute("href", href);
    if (!el.textContent.trim()) {
      el.textContent = href.replace(/^mailto:|^tel:/, "");
    }
  });
}

function setJoinedText(root, selector, values, separator = " • ") {
  if (!Array.isArray(values) || values.length === 0) return;
  root.querySelectorAll(selector).forEach((el) => {
    el.textContent = values.join(separator);
  });
}

function setOfficeCards(root, selector, offices) {
  if (!Array.isArray(offices)) return;
  root.querySelectorAll(selector).forEach((el) => {
    el.innerHTML = offices
      .map(
        (office) =>
          `<article class="border-2 border-black bg-white p-4"><h3 class="text-sm font-bold uppercase">${office.city}</h3><p class="mt-2 text-sm text-gray-700">${office.address}</p></article>`
      )
      .join("");
  });
}

/**
 * Loads shared site content and binds common placeholders.
 * Supported selectors:
 * - [data-brand-name]
 * - [data-brand-tagline]
 * - [data-contact-email]
 * - [data-contact-phone]
 * - [data-contact-email-link]
 * - [data-contact-phone-link]
 * - [data-cities]
 * - [data-services]
 * - [data-industries]
 * - [data-office-cards]
 */
export async function hydrateSharedContent(root = document) {
  const content = await loadContent();

  setText(root, "[data-brand-name]", content.brand?.name);
  setText(root, "[data-brand-tagline]", content.brand?.tagline);

  const email = content.contacts?.leadEmail;
  const phone = content.contacts?.phones?.[0];

  setText(root, "[data-contact-email]", email);
  setText(root, "[data-contact-phone]", phone);
  setLink(root, "[data-contact-email-link]", email ? `mailto:${email}` : "");
  setLink(root, "[data-contact-phone-link]", phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : "");

  setJoinedText(root, "[data-cities]", content.cities);
  setJoinedText(root, "[data-services]", content.services);
  setJoinedText(root, "[data-industries]", content.industries);
  setOfficeCards(root, "[data-office-cards]", content.offices);

  return content;
}

export { loadContent as getSiteContent };
