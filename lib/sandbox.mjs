import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
export function dockerExecutable() {
  if (process.env.DOCKER_PATH) return process.env.DOCKER_PATH;
  const installed = "C:/Program Files/Docker/Docker/resources/bin/docker.exe";
  return process.platform === "win32" && existsSync(installed)
    ? installed
    : "docker";
}
export const runtimes = {
  python: {
    image: "python:3.12-alpine",
    file: "main.py",
    command: ["python", "-I", "/tmp/main.py"],
  },
  javascript: {
    image: "node:24-alpine",
    file: "main.js",
    command: ["node", "/tmp/main.js"],
  },
  typescript: {
    image: "node:24-alpine",
    file: "main.ts",
    command: ["node", "/tmp/main.ts"],
  },
  java: {
    image: "eclipse-temurin:17-jdk-alpine",
    file: "Main.java",
    command: ["java", "-XX:MaxRAMPercentage=60", "/tmp/Main.java"],
  },
  c: {
    image: "gcc:14",
    file: "main.c",
    command: [
      "sh",
      "-c",
      "gcc /tmp/main.c -O0 -o /tmp/program && /tmp/program",
    ],
  },
  cpp: {
    image: "gcc:14",
    file: "main.cpp",
    command: [
      "sh",
      "-c",
      "g++ /tmp/main.cpp -std=c++17 -O0 -o /tmp/program && /tmp/program",
    ],
  },
  go: {
    image: "golang:1.24-alpine",
    file: "main.go",
    command: [
      "sh",
      "-c",
      "GOMAXPROCS=2 GOCACHE=/tmp/cache HOME=/tmp go run -p=1 /tmp/main.go",
    ],
  },
};
export function command(
  args,
  { input = "", timeout = 20000, maxOutput = 32000, signal } = {},
) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({ code: -1, stdout: "", stderr: "", reason: "CANCELLED" });
      return;
    }
    let stdout = "",
      stderr = "",
      reason = "",
      done = false;
    const child = spawn(dockerExecutable(), args, {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const cancel = () => {
      reason = "CANCELLED";
      child.kill();
    };
    signal?.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      reason = "TIMEOUT";
      child.kill();
    }, timeout);
    function finish(code) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      resolve({ code, stdout, stderr, reason });
    }
    const collect = (key) => (chunk) => {
      if (key === "stdout") stdout += chunk;
      else stderr += chunk;
      if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > maxOutput) {
        reason = "OUTPUT_LIMIT";
        stdout = stdout.slice(0, maxOutput);
        stderr = stderr.slice(0, 2000);
        child.kill();
      }
    };
    child.stdout.on("data", collect("stdout"));
    child.stderr.on("data", collect("stderr"));
    child.on("error", () => {
      reason = "DOCKER_UNAVAILABLE";
      finish(-1);
    });
    child.on("close", finish);
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
export async function runtimeStatus() {
  const ping = await command(["info", "--format", "{{.ServerVersion}}"], {
    timeout: 4000,
  });
  if (ping.code !== 0)
    return {
      ready: false,
      error: "DOCKER_UNAVAILABLE",
      languages: Object.keys(runtimes).map((id) => ({ id, ready: false })),
    };
  const images = new Map();
  for (const r of Object.values(runtimes)) {
    if (!images.has(r.image)) {
      const check = await command(
        ["image", "inspect", r.image, "--format", "{{.Id}}"],
        { timeout: 3000 },
      );
      images.set(r.image, check.code === 0);
    }
  }
  return {
    ready: true,
    languages: Object.entries(runtimes).map(([id, r]) => ({
      id,
      image: r.image,
      ready: images.get(r.image),
    })),
  };
}
export function buildRunArgs(language, name) {
  const r = runtimes[language];
  if (!r) throw new Error("INVALID_LANGUAGE");
  return [
    "run",
    "--name",
    name,
    "--rm",
    "--pull=never",
    "--network=none",
    "--read-only",
    "--memory=384m",
    "--memory-swap=384m",
    "--cpus=1",
    "--pids-limit=64",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--user=65534:65534",
    "--tmpfs=/tmp:rw,exec,nosuid,size=128m",
    "-i",
    r.image,
    "sh",
    "-c",
    `cat > /tmp/${r.file}; ${r.command.map((v) => "'" + v.replaceAll("'", "'\\''") + "'").join(" ")}`,
  ];
}
export async function execute(language, code, { signal } = {}) {
  const name = "zhicuo-" + randomUUID();
  try {
    return await command(buildRunArgs(language, name), {
      input: code,
      timeout: 20000,
      signal,
    });
  } finally {
    await command(["rm", "-f", name], { timeout: 3000 });
  }
}
