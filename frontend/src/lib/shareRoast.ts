/** Strip markdown artifacts from LLM output. */
export function formatRoast(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .trim();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Render a 9:16 story PNG for sharing. */
export async function renderRoastShareImage(
  english: string,
  translation: string,
  roast: string,
): Promise<Blob> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#1a0a2e");
  gradient.addColorStop(0.5, "#09090b");
  gradient.addColorStop(1, "#312e81");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.12, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f97316";
  ctx.font = "600 36px system-ui, -apple-system, sans-serif";
  ctx.fillText("🔥 ROAST", 80, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
  const phraseLines = wrapText(ctx, `"${english}"`, width - 160);
  let y = 280;
  for (const ln of phraseLines.slice(0, 3)) {
    ctx.fillText(ln, 80, y);
    y += 86;
  }

  ctx.fillStyle = "rgba(167,139,250,0.9)";
  ctx.font = "500 40px system-ui, -apple-system, sans-serif";
  ctx.fillText(`→ ${translation}`, 80, y + 40);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "500 44px system-ui, -apple-system, sans-serif";
  const roastLines = wrapText(ctx, formatRoast(roast), width - 160);
  y += 120;
  for (const ln of roastLines.slice(0, 12)) {
    ctx.fillText(ln, 80, y);
    y += 58;
  }

  ctx.fillStyle = "rgba(161,161,170,0.8)";
  ctx.font = "500 32px system-ui, -apple-system, sans-serif";
  ctx.fillText("Phrase Feed", 80, height - 100);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export image"));
    }, "image/png");
  });
}

export function buildRoastShareText(english: string, roast: string): string {
  return `🔥 "${english}"\n\n${formatRoast(roast)}\n\n— Phrase Feed`;
}

export async function shareRoast(
  english: string,
  translation: string,
  roast: string,
): Promise<"shared" | "copied"> {
  const text = buildRoastShareText(english, roast);
  const blob = await renderRoastShareImage(english, translation, roast);
  const file = new File([blob], "phrase-feed-roast.png", { type: "image/png" });

  if (navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Phrase Feed Roast",
          text,
          files: [file],
        });
        return "shared";
      }
      await navigator.share({ title: "Phrase Feed Roast", text });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
    }
  }

  await navigator.clipboard.writeText(text);
  return "copied";
}
