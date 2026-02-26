import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const htmlFiles = [
  "index.html",
  "services/index.html",
  "work/index.html",
  "works/index.html",
  "quote/index.html",
  "about-us/index.html",
  "contactus/index.html",
  "creators/index.html",
  "vi-network/index.html",
  "privacy-policy/index.html",
  "terms-and-condition/brand-terms-and-conditions/index.html",
  "terms-and-condition/creator-term-conditions/index.html"
];

const URL_PATTERN = /https?:\/\/[^"')\s]+/g;

function timeoutSignal(ms) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms).unref?.();
  return controller.signal;
}

async function collectUrls() {
  const found = new Set();

  for (const file of htmlFiles) {
    const fullPath = resolve(process.cwd(), file);
    const content = await readFile(fullPath, "utf8");
    const matches = content.match(URL_PATTERN) || [];
    matches.forEach((url) => found.add(url));
  }

  return [...found];
}

async function checkUrl(url) {
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: timeoutSignal(9000) });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: timeoutSignal(9000) });
    }
    return { url, ok: response.ok, status: response.status };
  } catch (error) {
    return { url, ok: null, error: error.message };
  }
}

const urls = await collectUrls();
const results = await Promise.all(urls.map((url) => checkUrl(url)));

const broken = results.filter((item) => item.ok === false);
const unreachable = results.filter((item) => item.ok === null);

for (const item of broken) {
  console.error(`BROKEN ${item.status}: ${item.url}`);
}

for (const item of unreachable) {
  console.warn(`UNREACHABLE: ${item.url} (${item.error})`);
}

if (broken.length > 0) {
  process.exit(1);
}

console.log(`Checked ${results.length} external URLs. Broken: ${broken.length}. Unreachable: ${unreachable.length}.`);
