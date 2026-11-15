import {
  argbFromHex,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  type DynamicScheme,
  type TonalPalette,
} from "@material/material-color-utilities";

interface ShizukuBridge {
  getModuleInfo(): string;
  exec(command: string): string;
  openSettings(): string;
}

interface ModuleInfo {
  moduleDir: string;
  shellBridge?: boolean;
  permissions?: { webBridge?: boolean };
}

interface ExecResult {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

declare global {
  interface Window {
    Shizuku?: ShizukuBridge;
  }
}

type SchemeCtor = new (hct: Hct, isDark: boolean, contrastLevel: number) => DynamicScheme;

// Android style name -> Material Color Utilities scheme. SPRITZ maps to Neutral.
const STYLES: [string, SchemeCtor][] = [
  ["TONAL_SPOT", SchemeTonalSpot],
  ["VIBRANT", SchemeVibrant],
  ["EXPRESSIVE", SchemeExpressive],
  ["SPRITZ", SchemeNeutral],
  ["RAINBOW", SchemeRainbow],
  ["FRUIT_SALAD", SchemeFruitSalad],
  ["CONTENT", SchemeContent],
  ["MONOCHROMATIC", SchemeMonochrome],
  ["FIDELITY", SchemeFidelity],
];

// Shades shown per palette: system_*_100 .. _700 map to these tones.
const PREVIEW_TONES = [90, 70, 50, 30];

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const picker = $<HTMLInputElement>("picker");
const hexInput = $<HTMLInputElement>("hex");
const grid = $<HTMLDivElement>("grid");
const out = $<HTMLPreElement>("out");
const warn = $<HTMLDivElement>("warn");

const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
let selectedStyle = "TONAL_SPOT";

function seedHex(): string {
  return hexInput.value.replace("#", "").toUpperCase();
}

function isValidHex(value: string): boolean {
  return /^[0-9A-F]{6}$/.test(value);
}

function setSeed(value: string): void {
  hexInput.value = value;
  picker.value = "#" + value.toLowerCase();
  render();
}

function swatchStrip(palette: TonalPalette): string {
  const cells = PREVIEW_TONES.map(
    (tone) => `<span style="background:${hexFromArgb(palette.tone(tone))}"></span>`,
  );
  return `<div class="sw">${cells.join("")}</div>`;
}

function render(): void {
  const seed = seedHex();
  if (!isValidHex(seed)) return;
  const hct = Hct.fromInt(argbFromHex("#" + seed));
  const role = (color: { getArgb(scheme: DynamicScheme): number }, scheme: DynamicScheme) =>
    hexFromArgb(color.getArgb(scheme));
  const D = MaterialDynamicColors;

  grid.innerHTML = "";
  for (const [name, Scheme] of STYLES) {
    const scheme = new Scheme(hct, isDark, 0);
    const card = document.createElement("div");
    card.className = "card" + (name === selectedStyle ? " sel" : "");
    card.style.background = role(D.surfaceContainer, scheme);
    card.style.color = role(D.onSurface, scheme);
    card.innerHTML =
      `<div class="name">${name}</div>` +
      [
        scheme.primaryPalette,
        scheme.secondaryPalette,
        scheme.tertiaryPalette,
        scheme.neutralPalette,
        scheme.neutralVariantPalette,
      ]
        .map(swatchStrip)
        .join("") +
      `<div class="pill" style="background:${role(D.primaryContainer, scheme)};` +
      `color:${role(D.onPrimaryContainer, scheme)}">Toggle</div>`;
    card.addEventListener("click", () => {
      selectedStyle = name;
      render();
    });
    grid.appendChild(card);
  }
}

function bridgeInfo(): { dir: string; allowed: boolean } | null {
  if (!window.Shizuku) return null;
  const info: ModuleInfo = JSON.parse(window.Shizuku.getModuleInfo());
  return {
    dir: info.moduleDir,
    allowed: info.shellBridge ?? info.permissions?.webBridge ?? false,
  };
}

function runMonet(args: string): ExecResult | null {
  const info = bridgeInfo();
  if (!info || !info.allowed) {
    warn.style.display = "block";
    return null;
  }
  warn.style.display = "none";
  const result: ExecResult = JSON.parse(
    window.Shizuku!.exec(`sh "${info.dir}/monet.sh" ${args}`),
  );
  if (result.exitCode === -1) warn.style.display = "block";
  return result;
}

picker.addEventListener("input", () => {
  hexInput.value = picker.value.slice(1).toUpperCase();
  render();
});

hexInput.addEventListener("input", () => {
  if (isValidHex(seedHex())) setSeed(seedHex());
});

$<HTMLButtonElement>("wp").addEventListener("click", () => {
  const result = runMonet("wpcolor");
  if (!result) return;
  if (result.exitCode === 0) setSeed(result.stdout.trim().toUpperCase());
  else out.textContent = "Could not read wallpaper color.";
});

$<HTMLButtonElement>("apply").addEventListener("click", () => {
  const seed = seedHex();
  if (!isValidHex(seed)) {
    out.textContent = "Enter a color like B388FF";
    return;
  }
  const result = runMonet(`${seed} ${selectedStyle}`);
  if (result) out.textContent = (result.stdout + result.stderr).trim();
});

$<HTMLButtonElement>("status").addEventListener("click", () => {
  const result = runMonet("status");
  if (result) out.textContent = (result.stdout + result.stderr).trim();
});

$<HTMLButtonElement>("grant").addEventListener("click", () => {
  window.Shizuku?.openSettings?.();
});

render();
