import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const routeDirs = [
  "pages",
  "services",
  "work",
  "works",
  "quote",
  "timeline",
  "about-us",
  "contactus",
  "creators",
  "vi-network",
  "privacy-policy",
  "terms-and-condition"
];

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "assets"), { recursive: true });

await cp(resolve(root, "index.html"), resolve(dist, "index.html"));
await cp(resolve(root, "assets"), resolve(dist, "assets"), { recursive: true });
for (const dir of routeDirs) {
  await cp(resolve(root, dir), resolve(dist, dir), { recursive: true });
}

console.log("Build complete: dist/");
