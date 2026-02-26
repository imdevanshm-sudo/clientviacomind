import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const routesPath = resolve(process.cwd(), "assets/data/legacy-routes.json");
const routes = JSON.parse(await readFile(routesPath, "utf8"));

const missing = [];

for (const route of routes) {
  const path = route.new_page;
  if (path === "/") continue;

  const fsPath = path.endsWith("/") ? `${path}index.html` : `${path}/index.html`;
  const target = resolve(process.cwd(), `.${fsPath}`);

  try {
    await readFile(target, "utf8");
  } catch {
    missing.push({ route: route.old_path, target: fsPath });
  }
}

if (missing.length > 0) {
  console.error("Missing route targets:");
  for (const item of missing) {
    console.error(`- ${item.route} -> ${item.target}`);
  }
  process.exit(1);
}

console.log(`Verified ${routes.length} legacy route mappings.`);
