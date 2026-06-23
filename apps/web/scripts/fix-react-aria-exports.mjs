import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exportsRoot = path.join(__dirname, "..", "node_modules", "react-aria", "dist", "exports");

const walk = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    const targetPath = fullPath.slice(0, -3) + ".mjs";
    if (fs.existsSync(targetPath)) {
      continue;
    }

    fs.copyFileSync(fullPath, targetPath);
  }
};

if (!fs.existsSync(exportsRoot)) {
  console.log("[fix-react-aria-exports] react-aria not found, skip.");
  process.exit(0);
}

walk(exportsRoot);
console.log("[fix-react-aria-exports] react-aria .mjs export files ensured.");
