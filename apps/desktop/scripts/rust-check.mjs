import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const candidates = [
  process.env.CARGO,
  "cargo",
  path.join(homedir(), ".cargo/bin/cargo"),
].filter(Boolean);

let cargo = null;
for (const candidate of candidates) {
  const result = spawnSync(candidate, ["--version"], { encoding: "utf8" });
  if (result.status === 0) {
    cargo = candidate;
    break;
  }
  if (candidate.includes("/") && existsSync(candidate)) {
    cargo = candidate;
    break;
  }
}

if (!cargo) {
  console.error("Cargo not found on PATH or at ~/.cargo/bin/cargo.");
  process.exit(127);
}

const manifestPath = path.resolve(process.cwd(), "src-tauri/Cargo.toml");
const result = spawnSync(cargo, ["check", "--manifest-path", manifestPath], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
