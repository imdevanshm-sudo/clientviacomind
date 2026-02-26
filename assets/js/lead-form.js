import { getSiteContent, hydrateSharedContent } from "/assets/js/site-content.js";
import {
  ApiTransport,
  NoBackendFallbackTransport,
  downloadLeadSummary,
  serializeLeadSummary,
  validateLeadPayload
} from "/assets/js/lead-transport.js";

function getEnv() {
  return window.__VIACOM_ENV__ || { leadMode: "fallback", apiBaseUrl: "", leadEndpoint: "/api/leads" };
}

function getLeadPayload(form) {
  const data = new FormData(form);

  return {
    fullName: (data.get("fullName") || "").toString().trim(),
    email: (data.get("email") || "").toString().trim(),
    phone: (data.get("phone") || "").toString().trim(),
    inquiryType: (data.get("inquiryType") || "").toString().trim(),
    message: (data.get("message") || "").toString().trim(),
    serviceInterest: (data.get("serviceInterest") || "").toString().trim(),
    budgetRange: (data.get("budgetRange") || "").toString().trim(),
    website: (data.get("website") || "").toString().trim(),
    sourcePath: window.location.pathname,
    sourceHost: window.location.host,
    submittedAt: new Date().toISOString()
  };
}

function renderErrors(errorBox, errors) {
  if (!errorBox) return;
  if (!errors.length) {
    errorBox.classList.add("hidden");
    errorBox.innerHTML = "";
    return;
  }

  errorBox.classList.remove("hidden");
  errorBox.innerHTML = `<ul class="list-disc pl-5">${errors.map((err) => `<li>${err}</li>`).join("")}</ul>`;
}

function setStatus(statusBox, message, mode = "info") {
  if (!statusBox) return;
  const base = "border-2 p-4 text-sm font-medium";
  const styleMap = {
    info: "border-black bg-white text-black",
    success: "border-green-700 bg-green-50 text-green-900",
    warn: "border-yellow-700 bg-yellow-50 text-yellow-900"
  };
  statusBox.className = `${base} ${styleMap[mode] || styleMap.info}`;
  statusBox.textContent = message;
  statusBox.classList.remove("hidden");
}

function resolveTransport(content) {
  const env = getEnv();

  if (env.leadMode === "api") {
    const endpoint = `${env.apiBaseUrl || ""}${env.leadEndpoint || "/api/leads"}`;
    return new ApiTransport({ endpoint });
  }

  return new NoBackendFallbackTransport({
    email: content.contacts?.leadEmail,
    whatsapp: content.contacts?.whatsapp,
    subjectPrefix: "Viacom India Lead"
  });
}

function wireSummaryActions({ fallbackBox, payload }) {
  if (!fallbackBox) return;

  const summary = serializeLeadSummary(payload);
  const summaryEl = fallbackBox.querySelector("[data-lead-summary]");
  if (summaryEl) summaryEl.textContent = summary;

  fallbackBox.dataset.currentLead = JSON.stringify(payload);

  if (fallbackBox.dataset.actionsBound === "true") return;

  const copyBtn = fallbackBox.querySelector("[data-copy-summary]");
  copyBtn?.addEventListener("click", async () => {
    let storedPayload = {};
    try {
      storedPayload = JSON.parse(fallbackBox.dataset.currentLead || "{}");
    } catch {
      storedPayload = {};
    }
    const currentSummary = serializeLeadSummary(storedPayload);
    try {
      await navigator.clipboard.writeText(currentSummary);
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy Summary";
      }, 1600);
    } catch {
      copyBtn.textContent = "Copy failed";
      setTimeout(() => {
        copyBtn.textContent = "Copy Summary";
      }, 1600);
    }
  });

  const downloadBtn = fallbackBox.querySelector("[data-download-summary]");
  downloadBtn?.addEventListener("click", () => {
    let storedPayload = {};
    try {
      storedPayload = JSON.parse(fallbackBox.dataset.currentLead || "{}");
    } catch {
      storedPayload = {};
    }
    downloadLeadSummary(storedPayload);
  });

  fallbackBox.dataset.actionsBound = "true";
}

export async function initLeadForm() {
  await hydrateSharedContent();
  const content = await getSiteContent();

  const form = document.querySelector("#lead-form");
  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");
  const errorBox = document.querySelector("#lead-errors");
  const statusBox = document.querySelector("#lead-status");
  const fallbackBox = document.querySelector("#lead-fallback");

  const transport = resolveTransport(content);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    renderErrors(errorBox, []);
    statusBox?.classList.add("hidden");
    fallbackBox?.classList.add("hidden");

    const payload = getLeadPayload(form);
    const validation = validateLeadPayload(payload);

    if (!validation.valid) {
      renderErrors(errorBox, validation.errors);
      setStatus(statusBox, "Please fix the highlighted issues and submit again.", "warn");
      return;
    }

    submitBtn?.setAttribute("disabled", "disabled");

    try {
      const result = await transport.submit(payload);

      if (result.status === "sent") {
        setStatus(statusBox, "Your request was submitted successfully.", "success");
        form.reset();
        return;
      }

      if (result.status === "fallback") {
        setStatus(
          statusBox,
          "Your email and WhatsApp fallback were opened. If nothing opened, use the manual contact block below.",
          "success"
        );
        fallbackBox?.classList.remove("hidden");
        wireSummaryActions({ fallbackBox, payload });
        return;
      }

      setStatus(
        statusBox,
        "We could not open your email/WhatsApp client. Your details are saved locally; use manual contact options below.",
        "warn"
      );
      fallbackBox?.classList.remove("hidden");
      wireSummaryActions({ fallbackBox, payload });
    } catch (error) {
      setStatus(
        statusBox,
        "Submission is temporarily unavailable. Use phone/email in the fallback section.",
        "warn"
      );
      fallbackBox?.classList.remove("hidden");
      wireSummaryActions({ fallbackBox, payload });
      console.error(error);
    } finally {
      submitBtn?.removeAttribute("disabled");
    }
  });
}
