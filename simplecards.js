// =============================================================
// Simple card set — an original design drawn in code (no artwork).
// Each card is drawn once onto an offscreen canvas at 2x size; the
// game draws that canvas, and HTML <img> tags use its data URL.
//
// Every card shows: its value, a big numeral "creature", ODD/EVEN and
// 1-DIGIT/2-DIGIT tags (the facts most eating rules depend on), and its
// power in large readable text.
// =============================================================

const SIMPLE_W = 308, SIMPLE_H = 414; // 2x the 154 x 207 card size

// One fill color per card. The numeral always has a thick dark outline,
// so the shape reads clearly whatever the fill.
const SIMPLE_COLORS = {
  1: "#f2b705", 2: "#3fa34d", 3: "#e4572e", 4: "#2f6fdf", 5: "#9aa0a6", 6: "#e84393",
  7: "#8e44ad", 8: "#2ecc71", 9: "#d7263d", 10: "#f28c28", 11: "#ff6fae", 12: "#f4a259",
  13: "#6ab04c", 14: "#7fd3d8", 15: "#2e8b57", 16: "#3a7bd5", 17: "#ffd23f", 18: "#b388eb",
};
const SIMPLE_NAMES = {
  1: "yellow", 2: "green", 3: "orange-red", 4: "blue", 5: "gray", 6: "pink", 7: "purple",
  8: "green", 9: "red", 10: "orange", 11: "light pink", 12: "peach", 13: "leaf green",
  14: "light teal", 15: "sea green", 16: "bright blue", 17: "sunny yellow", 18: "lavender",
};
const INK = "#2b0a1e";
const FONT = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';

function mixWithWhite(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (c) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawEye(ctx, x, y, r, lookX) {
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(x + lookX * r * 0.35, y + r * 0.15, r * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(x + lookX * r * 0.35 - r * 0.15, y - r * 0.05, r * 0.13, 0, Math.PI * 2); ctx.fill();
}

function drawTag(ctx, label, x, y, filled) {
  ctx.font = `bold 19px ${FONT}`;
  const w = ctx.measureText(label).width + 18;
  roundRect(ctx, x - w, y, w, 30, 15);
  ctx.fillStyle = filled ? INK : "#ffffff"; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = filled ? "#ffffff" : INK;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, x - w / 2, y + 16);
  return w;
}

function makeSimpleCard(n, ruleText) {
  const cv = document.createElement("canvas");
  cv.width = SIMPLE_W; cv.height = SIMPLE_H;
  const ctx = cv.getContext("2d");
  const isMouth = n === 8;
  const col = SIMPLE_COLORS[n];
  const frame = isMouth ? "#a3004e" : "#00585f";

  // card body
  roundRect(ctx, 0, 0, SIMPLE_W, SIMPLE_H, 22);
  ctx.fillStyle = frame; ctx.fill();
  roundRect(ctx, 12, 12, SIMPLE_W - 24, SIMPLE_H - 24, 14);
  ctx.fillStyle = mixWithWhite(col, isMouth ? 0.7 : 0.82); ctx.fill();

  // value badge (top-left)
  ctx.fillStyle = frame;
  ctx.beginPath(); ctx.arc(46, 46, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `bold ${n >= 10 ? 30 : 36}px ${FONT}`;
  ctx.fillText(String(n), 46, 48);

  // fact tags (top-right)
  if (isMouth) {
    drawTag(ctx, "MOUTH", SIMPLE_W - 22, 30, true);
  } else {
    const w1 = drawTag(ctx, n % 2 ? "ODD" : "EVEN", SIMPLE_W - 22, 24, n % 2 === 1);
    drawTag(ctx, n < 10 ? "1-DIGIT" : "2-DIGIT", SIMPLE_W - 22, 60, false);
  }

  const cx = SIMPLE_W / 2, cy = 196;
  if (isMouth) {
    // a big toothy mouth
    ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.ellipse(cx, cy, 112, 92, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3b0d2a";
    ctx.beginPath(); ctx.ellipse(cx, cy + 6, 82, 60, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const tx = cx - 70 + k * 28;
      ctx.beginPath(); ctx.moveTo(tx - 12, cy - 44); ctx.lineTo(tx + 12, cy - 44); ctx.lineTo(tx, cy - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx - 12, cy + 58); ctx.lineTo(tx + 12, cy + 58); ctx.lineTo(tx, cy + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    drawEye(ctx, cx - 54, cy - 98, 22, 1);
    drawEye(ctx, cx + 54, cy - 98, 22, -1);
  } else {
    // little feet
    ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    for (const fx of [-38, 38]) {
      ctx.beginPath(); ctx.ellipse(cx + fx, cy + 98, 26, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // the numeral body
    ctx.font = `900 ${n >= 10 ? 168 : 210}px ${FONT}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineJoin = "round"; ctx.lineWidth = 14; ctx.strokeStyle = INK;
    ctx.strokeText(String(n), cx, cy + 12);
    ctx.fillStyle = col;
    ctx.fillText(String(n), cx, cy + 12);
    // eyes perched on top, and a grin
    const spread = n >= 10 ? 46 : 34;
    drawEye(ctx, cx - spread, cy - 70, 21, 1);
    drawEye(ctx, cx + spread, cy - 70, 21, -1);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy - 34, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }

  // power text panel
  const py = 306, ph = SIMPLE_H - 22 - py;
  roundRect(ctx, 22, py, SIMPLE_W - 44, ph, 12);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  let size = 25, lines;
  do {
    ctx.font = `bold ${size}px ${FONT}`;
    lines = wrapLines(ctx, ruleText.toUpperCase(), SIMPLE_W - 70);
    size -= 1;
  } while ((lines.length * size * 1.15 > ph - 14) && size > 14);
  const lh = (size + 1) * 1.15;
  const y0 = py + ph / 2 - (lines.length - 1) * lh / 2;
  lines.forEach((ln, k) => ctx.fillText(ln, cx, y0 + k * lh));

  return cv;
}

function simpleCardLook(n) {
  if (n === 8) return "the Mouth, a big green toothy mouth with googly eyes on a magenta card";
  return `${SIMPLE_NAMES[n]} number ${n} with googly eyes, tagged ${n % 2 ? "odd" : "even"} and ${n < 10 ? "single-digit" : "double-digit"}`;
}
