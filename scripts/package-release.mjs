import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
if (git("status", "--porcelain").trim())
  throw Error("Commit project changes before packaging.");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(pkg.version))
  throw Error("Invalid release version");
const files = git("ls-tree", "-rz", "--name-only", "HEAD")
  .split("\0")
  .filter(Boolean);
if (
  files.some((file) =>
    /^(?:\.env$|local-data\/|node_modules\/|work\/|output\/releases\/)/.test(
      file,
    ),
  )
)
  throw Error("Private/generated directory is tracked; packaging refused.");
let secret = "";
try {
  secret = (
    readFileSync(".env", "utf8").match(/^AI_API_KEY\s*=\s*(.+)$/m)?.[1] || ""
  )
    .trim()
    .replace(/^['"]|['"]$/g, "");
} catch {}
for (const file of files) {
  const content = execFileSync("git", ["show", "HEAD:" + file], {
    maxBuffer: 80 * 1024 * 1024,
  });
  if (secret.length > 10 && content.includes(Buffer.from(secret)))
    throw Error(
      "Configured API key found in tracked content; packaging refused.",
    );
}
const output = join("output", "releases");
mkdirSync(output, { recursive: true });
const prefix = join(output, `zhicuo-${pkg.version}`);
git("archive", "--format=zip", "--output=" + prefix + "-source.zip", "HEAD");
const branch = git("symbolic-ref", "--short", "HEAD").trim();
git("bundle", "create", prefix + "-history.bundle", branch);
git("bundle", "verify", prefix + "-history.bundle");
console.log(
  `Created ${prefix}-source.zip and ${prefix}-history.bundle from ${git("rev-parse", "--short", "HEAD").trim()}`,
);
