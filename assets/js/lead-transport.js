const LEAD_QUEUE_KEY = "viacom.leads.queue.v1";
const LEAD_QUEUE_VERSION = 1;

/**
 * @typedef {Object} LeadPayload
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} inquiryType
 * @property {string} message
 * @property {string} sourcePath
 * @property {string} sourceHost
 * @property {string} submittedAt
 * @property {string=} serviceInterest
 * @property {string=} budgetRange
 * @property {string=} website
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * @typedef {Object} LeadSubmitResult
 * @property {"sent" | "fallback" | "queued"} status
 * @property {string=} reference
 */

/**
 * Stable transport interface for launch fallback and future API mode.
 */
export class LeadTransport {
  /**
   * @param {LeadPayload} payload
   * @returns {ValidationResult}
   */
  validate(payload) {
    return validateLeadPayload(payload);
  }

  /**
   * @param {LeadPayload} payload
   * @returns {Promise<LeadSubmitResult>}
   */
  async submit(payload) {
    void payload;
    throw new Error("submit() must be implemented by transport");
  }
}

/**
 * @param {LeadPayload} payload
 * @returns {ValidationResult}
 */
export function validateLeadPayload(payload) {
  const errors = [];

  if (!payload.fullName?.trim()) errors.push("Full name is required.");
  if (!payload.email?.trim()) errors.push("Email is required.");
  if (!payload.phone?.trim()) errors.push("Phone is required.");
  if (!payload.inquiryType?.trim()) errors.push("Inquiry type is required.");
  if (!payload.message?.trim()) errors.push("Project brief is required.");
  if (!payload.sourcePath?.trim()) errors.push("Source path is required.");
  if (!payload.sourceHost?.trim()) errors.push("Source host is required.");
  if (!payload.submittedAt?.trim()) errors.push("submittedAt is required.");

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push("Email format looks invalid.");
  }

  const digits = (payload.phone || "").replace(/\D/g, "");
  if (payload.phone && digits.length < 7) {
    errors.push("Phone format looks invalid.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {LeadPayload} payload
 */
export function queueLead(payload) {
  const queue = getQueuedLeads();
  const queuedLead = {
    version: LEAD_QUEUE_VERSION,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0
  };
  queue.push(queuedLead);
  localStorage.setItem(LEAD_QUEUE_KEY, JSON.stringify(queue));
  return queuedLead;
}

export function getQueuedLeads() {
  try {
    const raw = localStorage.getItem(LEAD_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearQueuedLeads() {
  localStorage.removeItem(LEAD_QUEUE_KEY);
}

/**
 * @param {LeadPayload} payload
 */
export function serializeLeadSummary(payload) {
  return [
    "New Viacom India inquiry",
    "",
    `Full Name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Inquiry Type: ${payload.inquiryType}`,
    `Service Interest: ${payload.serviceInterest || "-"}`,
    `Budget Range: ${payload.budgetRange || "-"}`,
    `Website: ${payload.website || "-"}`,
    "",
    "Project Brief:",
    payload.message,
    "",
    `Source Path: ${payload.sourcePath}`,
    `Source Host: ${payload.sourceHost}`,
    `Submitted At: ${payload.submittedAt}`
  ].join("\n");
}

/**
 * @param {LeadPayload} payload
 */
export function downloadLeadSummary(payload) {
  const content = serializeLeadSummary(payload);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `viacom-lead-${Date.now()}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function openFallbackUrl(url) {
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    return Boolean(win);
  } catch {
    return false;
  }
}

function normalizePhone(raw) {
  return (raw || "").replace(/[^\d]/g, "");
}

export class NoBackendFallbackTransport extends LeadTransport {
  constructor(options = {}) {
    super();
    this.email = options.email || "contact@viacomindia.com";
    this.whatsapp = options.whatsapp || "+919987773202";
    this.subjectPrefix = options.subjectPrefix || "Viacom India Lead";
  }

  async submit(payload) {
    const validation = this.validate(payload);
    if (!validation.valid) {
      return { status: "queued" };
    }

    const summary = serializeLeadSummary(payload);
    const subject = `${this.subjectPrefix}: ${payload.inquiryType}`;
    const mailto = `mailto:${this.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary)}`;
    const whatsappUrl = `https://wa.me/${normalizePhone(this.whatsapp)}?text=${encodeURIComponent(summary)}`;

    const mailOpened = openFallbackUrl(mailto);
    const waOpened = openFallbackUrl(whatsappUrl);

    if (!mailOpened && !waOpened) {
      const queued = queueLead(payload);
      return { status: "queued", reference: queued.createdAt };
    }

    return { status: "fallback", reference: "mailto-whatsapp" };
  }
}

export class ApiTransport extends LeadTransport {
  constructor(options = {}) {
    super();
    this.endpoint = options.endpoint || "/api/leads";
    this.fetchImpl = options.fetchImpl || window.fetch.bind(window);
  }

  async submit(payload) {
    const validation = this.validate(payload);
    if (!validation.valid) {
      return { status: "queued" };
    }

    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Lead API request failed with status ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));
    return {
      status: "sent",
      reference: data.leadId || data.id || "api-accepted"
    };
  }
}
