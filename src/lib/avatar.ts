function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const PALETTES = [
  ["#2563eb", "#38bdf8"],
  ["#7c3aed", "#c084fc"],
  ["#ea580c", "#fb7185"],
  ["#0f766e", "#2dd4bf"],
  ["#4f46e5", "#a78bfa"],
  ["#ca8a04", "#facc15"],
];

export function getAvatarInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "A").trim();
  const chunks = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = chunks.map((chunk) => chunk[0]?.toUpperCase() ?? "").join("");
  return initials || "A";
}

export function buildDefaultAvatarDataUrl(name?: string | null, email?: string | null): string {
  const seed = `${name ?? ""}|${email ?? ""}`;
  const palette = PALETTES[hashSeed(seed) % PALETTES.length];
  const initials = getAvatarInitials(name, email);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette[0]}" />
          <stop offset="100%" stop-color="${palette[1]}" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="88" fill="url(#g)" />
      <circle cx="204" cy="52" r="18" fill="rgba(255,255,255,0.22)" />
      <circle cx="54" cy="208" r="28" fill="rgba(255,255,255,0.12)" />
      <text
        x="50%"
        y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="#ffffff"
        font-family="Inter, Arial, sans-serif"
        font-size="92"
        font-weight="700"
        letter-spacing="2"
      >${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

export function getDisplayAvatar(params: {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  if (params.avatarUrl && params.avatarUrl.trim()) return params.avatarUrl;
  return buildDefaultAvatarDataUrl(params.name, params.email);
}
