// =============================================================
// Numbsters — a p5.js recreation of the Button Shy solitaire game
// Game design: Milan Zivkovic · Art: Luke Flowers
//
// The p5 canvas draws the table. Every action is ALSO available
// through real HTML buttons (keyboard + screen reader friendly),
// and every change is announced in an aria-live status region.
// =============================================================

const MOUTH = 8;

// ---------- Card data ----------------------------------------
// rule(eater, eaten, nums) -> true if this card's special rule
// lets `eater` eat `eaten`. `nums` = Numbster values in the stack.
const isEven = (n) => n % 2 === 0;
const isOdd = (n) => n % 2 === 1;
const single = (n) => n < 10;
const double = (n) => n >= 10;

function sequential(a, b) {
  if (a === MOUTH || b === MOUTH) return false;
  // Seven and Nine are sequential because Eight is not a Numbster
  return Math.abs(a - b) === 1 || (Math.min(a, b) === 7 && Math.max(a, b) === 9);
}

const CARDS = {
  1:  { text: "Even Numbster eats smaller even Numbster", look: "yellow and red striped one-eyed number 1",
        rule: (e, v) => isEven(e) && isEven(v) && v < e },
  2:  { text: "Even Numbster eats single-digit Numbster", look: "green frog-like number 2 with big eyes and fins",
        rule: (e, v) => isEven(e) && single(v) },
  3:  { text: "Biggest Numbster in the stack eats odd Numbster", look: "red horned number 3 breathing fire",
        rule: (e, v, nums) => e === Math.max(...nums) && isOdd(v) },
  4:  { text: "Odd Numbster eats bigger odd Numbster", look: "blue shark-like number 4 with an eye patch and hook",
        rule: (e, v) => isOdd(e) && isOdd(v) && v > e },
  5:  { text: "Odd Numbster eats bigger Numbster", look: "gray robot number 5 rolling on wheels",
        rule: (e, v) => isOdd(e) && v > e },
  6:  { text: "Double-digit Numbster eats single-digit Numbster", look: "pink octopus-like number 6 with blue tentacles",
        rule: (e, v) => double(e) && single(v) },
  7:  { text: "Odd Numbster eats smaller odd Numbster", look: "purple number 7 with an antenna and swirl belly",
        rule: (e, v) => isOdd(e) && isOdd(v) && v < e },
  8:  { text: "The Mouth. If on top of the stack at the end of a turn, you lose!", look: "green number 8 shaped like a huge toothy mouth on a pink splatter",
        rule: null },
  9:  { text: "Single-digit Numbster eats double-digit Numbster", look: "red many-eyed spider-like number 9",
        rule: (e, v) => single(e) && double(v) },
  10: { text: "Bigger sequential Numbster eats smaller Numbster", look: "green dinosaur 1 and orange striped fanged 0",
        rule: (e, v) => sequential(e, v) && e > v },
  11: { text: "Even Numbster eats smaller Numbster", look: "two pink bird-like ones with green wings",
        rule: (e, v) => isEven(e) && v < e },
  12: { text: "Even Numbster eats bigger even Numbster", look: "orange and blue patterned fanged number 12",
        rule: (e, v) => isEven(e) && isEven(v) && v > e },
  13: { text: "Odd Numbster eats double-digit Numbster", look: "green slimy number 13 covered in eyes",
        rule: (e, v) => isOdd(e) && double(v) },
  14: { text: "Single-digit Numbster eats odd Numbster", look: "white furry yeti number 14",
        rule: (e, v) => single(e) && isOdd(v) },
  15: { text: "Even Numbster eats double-digit Numbster", look: "green stitched monster number 15",
        rule: (e, v) => isEven(e) && double(v) },
  16: { text: "Smallest Numbster in the stack eats even Numbster", look: "blue spiky dragon number 16",
        rule: (e, v, nums) => e === Math.min(...nums) && isEven(v) },
  17: { text: "Even Numbster eats bigger Numbster", look: "yellow number 17 wearing a hat and plaid shorts",
        rule: (e, v) => isEven(e) && v > e },
  18: { text: "Odd Numbster eats smaller Numbster", look: "white unicorn-pig number 18 with rainbow spots",
        rule: (e, v) => isOdd(e) && v < e },
};

// ---------- Card sets (themes) -------------------------------
// "simple": original cards drawn in code (simplecards.js) — the default.
// "art":    the published Numbsters artwork sliced from the card photo.
let theme = "simple";
let simpleCards = {}; // n -> { canvas, url }

function artSrc(n) {
  // A standalone build may inline the images as data URIs
  if (window.CARD_IMAGES) return window.CARD_IMAGES[n];
  return "cards/card" + String(n).padStart(2, "0") + ".png";
}
// URL for HTML <img> tags in the current theme
function cardSrc(n) {
  return theme === "art" ? artSrc(n) : simpleCards[n].url;
}
// Drawable source for the canvas in the current theme (null if not ready)
function cardDrawable(n) {
  if (theme === "simple") return simpleCards[n] ? simpleCards[n].canvas : null;
  const el = imgs[n];
  return el && el.complete && el.naturalWidth ? el : null;
}
function buildSimpleCards() {
  for (let n = 1; n <= 18; n++) {
    const text = n === MOUTH ? "If on top of the stack at the end of a turn, you lose!" : CARDS[n].text;
    const canvas = makeSimpleCard(n, text);
    simpleCards[n] = { canvas, url: canvas.toDataURL("image/png") };
  }
}
const cardName = (n) => (n === MOUTH ? "the Mouth" : "Numbster " + n);
const cardAlt = (n) =>
  `Card ${n}: ${theme === "art" ? CARDS[n].look : simpleCardLook(n)}. ${CARDS[n].text}${CARDS[n].text.endsWith("!") ? "" : "."}`;

function loadTheme() {
  try { const t = localStorage.getItem("numbsters-theme"); if (t === "art" || t === "simple") theme = t; } catch (e) {}
}
function setTheme(t, announceIt) {
  theme = t;
  try { localStorage.setItem("numbsters-theme", t); } catch (e) {}
  for (const r of document.querySelectorAll('input[name="card-style"]')) r.checked = r.value === t;
  document.getElementById("checklist").innerHTML = ""; // rebuilt with the new images
  hideTooltip();
  const d = document.getElementById("card-detail");
  if (d.dataset.card) showDetail(Number(d.dataset.card));
  refresh();
  if (announceIt) announce(t === "art" ? "Card style: original Numbsters art." : "Card style: simple cards.");
}

// ---------- Game state ---------------------------------------
let imgs = {};
let deck = [];
let stack = [];          // index 0 = bottom (left), last = top (right)
let eatenPile = [];
let phase = "draw";      // draw | move | eat | over
let turn = 1;
let selected = null;     // stack index chosen first during Move
let target = null;       // stack index chosen second during Move
let beforeMove = null;   // copy of the stack for Undo
let moveMade = false;
let result = null;       // "win" | "lose" | null
let hoverIndex = null;
let cardRects = [];
let canvasW = 900;
const ASPECT = 207 / 154; // height / width of the sliced cards

// ---------- p5 lifecycle -------------------------------------
// Cards are loaded as plain <img> elements rather than with p5's loadImage().
// loadImage() uses fetch(), which some sandboxed previews (and file:// pages)
// block; a regular Image works everywhere, including data URIs.
function loadCardImages() {
  for (let n = 1; n <= 18; n++) {
    const el = new Image();
    el.onload = () => redraw();
    el.onerror = () => { el.failed = true; updateArtAvailability(); };
    el.src = artSrc(n);
    imgs[n] = el;
  }
}

function setup() {
  const holder = document.getElementById("canvas-holder");
  canvasW = holder.clientWidth || 900;
  pixelDensity(Math.min(2, window.devicePixelRatio || 1)); // crisp on phones
  const c = createCanvas(canvasW, 300);
  c.parent(holder);
  // The canvas is a visual mirror of the stack; the stack buttons below
  // carry the same information (and each card's power) for assistive technology.
  c.elt.setAttribute("aria-hidden", "true");
  textFont("sans-serif");
  noLoop();
  loadTheme();
  buildSimpleCards();
  loadCardImages();
  for (const r of document.querySelectorAll('input[name="card-style"]')) {
    r.checked = r.value === theme;
    r.addEventListener("change", () => { if (r.checked) setTheme(r.value, true); });
  }
  setupPointer(c.elt);
  setupTooltip();

  document.getElementById("new-game").addEventListener("click", newGame);
  document.getElementById("reset-checklist").addEventListener("click", () => {
    saveWins([]);
    renderChecklist();
    announce("Checklist cleared.");
  });

  newGame();
}

function windowResized() {
  const holder = document.getElementById("canvas-holder");
  canvasW = holder.clientWidth || canvasW;
  hideTooltip();
  fitCanvas();
  setTimeout(fitCanvas, 250); // phones settle their toolbars after rotating
}

// Resize the canvas to fit the current layout (number of rows changes on phones)
function fitCanvas() {
  // Height left for the cards = window height minus everything else in the
  // game area (header, status, move buttons). Measured, so it adapts to the
  // phase (more eat buttons = smaller cards) and to text zoom.
  const ctl = document.getElementById("controls");
  const tbl = document.querySelector(".table-panel");
  if (ctl && tbl && typeof height === "number") {
    const c = ctl.getBoundingClientRect(), t = tbl.getBoundingClientRect();
    const beside = c.top < t.bottom - 4;   // landscape layout: controls sit next to the table
    const gameBottom = (beside ? t.bottom : Math.max(c.bottom, t.bottom)) + window.scrollY;
    const others = gameBottom - height;    // everything in the game area except the canvas
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    heightBudget = vh - others - 8;
  }
  const holder = document.getElementById("canvas-holder");
  if (holder && holder.clientWidth && holder.clientWidth !== canvasW) canvasW = holder.clientWidth;
  const h = Math.round(computeLayout().height);
  if (width !== canvasW || height !== h) resizeCanvas(canvasW, h);
  redraw();
}

// ---------- Layout -------------------------------------------
// The canvas is sized so the whole game (status, cards and move buttons) fits
// in one screen when possible. fitCanvas() measures how much of the window the
// rest of the game area uses, and gives the cards whatever height is left.
//
// Two arrangements, whichever gives bigger cards:
//  - one row: bottom on the left, top on the right, deck at the far right
//    (cards overlap when crowded) — desktops and landscape screens
//  - rows: the stack wraps left to right, top row first, and the deck becomes a
//    small badge — phones and portrait tablets
const NARROW = 640;
let heightBudget = 9999;

function computeLayout() {
  const n = Math.max(1, stack.length);
  const pad = 10, gap = 6;
  const budget = Math.max(150, heightBudget);

  // --- one row ---
  const oneRow = () => {
    let cw = Math.min(154, Math.max(56, canvasW / 10));
    cw = Math.max(56, Math.min(cw, (budget - 84) / ASPECT));        // fit the height budget
    const ch = cw * ASPECT, deckW = cw * 0.8;
    const areaW = canvasW - pad * 3 - deckW;
    let step = cw + gap;
    if (n > 1 && n * step - gap > areaW) step = (areaW - cw) / (n - 1);
    const visible = Math.min(step, cw);                               // part of each card you can see/tap
    return { cw, ch, step, deckW, visible, score: Math.min(cw, visible * 1.6) };
  };
  // --- rows ---
  const multiRow = () => {
    let best = null;
    for (let rows = 1; rows <= 4; rows++) {
      const perRow = Math.ceil(n / rows);
      const byW = (canvasW - pad * 2 - gap * (perRow - 1)) / perRow;
      const byH = ((budget - 40) / rows - 24) / ASPECT;               // 40 = deck badge, 24 = labels under each row
      // never shrink below ~50px wide (still tappable); the page scrolls a little instead
      const cw = Math.max(Math.min(154, byW, byH), Math.min(50, byW));
      if (!best || cw > best.cw + 0.5) best = { rows, perRow, cw };
    }
    return best;
  };

  const one = oneRow(), multi = multiRow();
  const useRows = canvasW < NARROW || multi.cw > one.score * 1.25;
  const L = { slots: [], narrow: useRows };

  if (!useRows) {
    const { cw, ch, step, deckW } = one;
    const y = 42;
    for (let i = 0; i < n; i++) L.slots.push({ x: pad + i * step, y, w: cw, h: ch, lift: 10, hitW: i === n - 1 ? cw : Math.min(step, cw) });
    L.cw = cw; L.ch = ch; L.step = step;
    L.deck = { x: canvasW - pad - deckW, y: y + (ch - deckW * ASPECT) / 2, w: deckW, h: deckW * ASPECT, big: true };
    L.height = y + ch + 40;
  } else {
    const { perRow, cw } = multi, ch = cw * ASPECT;
    const top = 40, rowH = ch + 24;
    // centre the rows when the cards don't fill the width
    const used = perRow * cw + (perRow - 1) * gap;
    const x0 = Math.max(pad, (canvasW - used) / 2);
    for (let i = 0; i < stack.length; i++) {
      const r = Math.floor(i / perRow), c = i % perRow;
      L.slots.push({ x: x0 + c * (cw + gap), y: top + r * rowH, w: cw, h: ch, lift: 0, hitW: cw });
    }
    L.cw = cw; L.ch = ch; L.step = cw + gap;
    L.deck = { x: x0, y: 6, w: 0, h: 28, big: false };
    L.height = top + Math.ceil(stack.length / perRow) * rowH;
  }
  return L;
}

// ---------- Game flow ----------------------------------------
function newGame() {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  stack = shuffle(nums.slice(0, 6).concat([MOUTH]));
  deck = nums.slice(6);
  eatenPile = [];
  phase = "draw";
  turn = 1;
  selected = target = null;
  beforeMove = null;
  moveMade = false;
  result = null;
  document.getElementById("log").innerHTML = "";
  addLog("New game. Starting stack, bottom to top: " + stack.join(", ") + ".");
  announce("New game. Turn 1: draw a card to begin.");
  refresh();
}

function doDraw() {
  if (deck.length > 0) {
    const n = deck.pop();
    stack.push(n);
    addLog(`Turn ${turn}: drew ${n} onto the top of the stack.`);
    announce(`You drew ${cardName(n)} onto the top. Step 2: move or swap a card, or skip.`);
  } else {
    addLog(`Turn ${turn}: deck empty, draw skipped.`);
    announce("The deck is empty, so the draw is skipped. Step 2: move or swap a card, or skip.");
  }
  phase = "move";
  beforeMove = stack.slice();
  moveMade = false;
  refresh();
}

function pickCard(i) {
  if (phase !== "move") {
    showDetail(stack[i]);
    return;
  }
  if (selected === null) {
    selected = i;
    target = null;
    announce(`Selected ${cardName(stack[i])} at position ${i + 1}. Now choose a second card to swap with or move next to.`);
  } else if (i === selected) {
    selected = target = null;
    announce("Selection cleared.");
  } else {
    target = i;
    announce(`Target is ${cardName(stack[i])} at position ${i + 1}. Choose swap or move from the action buttons.`);
  }
  showDetail(stack[i]);
  refresh();
}

function swapCards() {
  const a = stack[selected], b = stack[target];
  [stack[selected], stack[target]] = [stack[target], stack[selected]];
  finishMove(`swapped ${a} and ${b}`);
}

// side: -1 = just below (left of) target, +1 = just above (right of) target
function moveBeside(side) {
  const a = stack[selected], b = stack[target];
  const rest = stack.filter((_, k) => k !== selected);
  let t = rest.indexOf(b);
  rest.splice(side < 0 ? t : t + 1, 0, a);
  stack = rest;
  finishMove(`moved ${a} ${side < 0 ? "below" : "above"} ${b}`);
}

function finishMove(desc) {
  moveMade = true;
  addLog(`Turn ${turn}: ${desc}.`);
  startEat(`You ${desc}.`);
}

function skipMove() {
  addLog(`Turn ${turn}: no move.`);
  startEat("No move made.");
}

function undoMove() {
  stack = beforeMove.slice();
  moveMade = false;
  phase = "move";
  selected = target = null;
  addLog(`Turn ${turn}: move undone.`);
  announce("Move undone. Step 2: move or swap a card, or skip.");
  refresh();
}

function startEat(prefix) {
  phase = "eat";
  selected = target = null;
  const opts = eatOptions();
  if (opts.length === 0) {
    announce(prefix + " Nothing can be eaten! " + (moveMade ? "Undo your move to try something else, or end the game." : "End the game, or undo to choose a move."));
  } else {
    announce(prefix + ` Step 3: eat. ${opts.length} way${opts.length > 1 ? "s" : ""} to eat. Choose one.`);
  }
  refresh();
}

// All legal ways to eat with the current stack
function eatOptions() {
  const m = stack.indexOf(MOUTH);
  if (m <= 0 || m >= stack.length - 1) return []; // Mouth needs a Numbster on both sides
  const L = stack[m - 1], R = stack[m + 1];
  const opts = [];

  if (sequential(L, R)) {
    const eater = Math.min(L, R), eaten = Math.max(L, R);
    opts.push({ kind: "basic", eater, eaten, ability: null,
      label: `Basic rule: ${eater} eats ${eaten}` });
  }

  const top = stack[stack.length - 1];
  if (top !== MOUTH) {
    const nums = stack.filter((n) => n !== MOUTH);
    for (const [eater, eaten] of [[L, R], [R, L]]) {
      if (eaten === top) continue; // the ability card itself moves to the bottom, so it can't be eaten
      if (CARDS[top].rule(eater, eaten, nums)) {
        opts.push({ kind: "special", eater, eaten, ability: top,
          label: `Use ${top}'s rule: ${eater} eats ${eaten}, then ${top} goes to the bottom` });
      }
    }
  }
  return opts;
}

function doEat(opt) {
  stack.splice(stack.indexOf(opt.eaten), 1);
  eatenPile.push(opt.eaten);
  let msg = `${cardName(opt.eater)} ate ${cardName(opt.eaten)}`;
  if (opt.kind === "special") {
    stack.splice(stack.indexOf(opt.ability), 1);
    stack.unshift(opt.ability);
    msg += `, using ${opt.ability}'s rule. ${opt.ability} moved to the bottom`;
  } else {
    msg += " (basic rule)";
  }
  addLog(`Turn ${turn}: ${msg}.`);
  endOfTurn(msg + ".");
}

function endOfTurn(msg) {
  const topCard = stack[stack.length - 1];
  if (topCard === MOUTH) {
    lose(msg + " The Mouth is on top of the stack. You lose!");
  } else if (stack.length === 2) {
    result = "win";
    phase = "over";
    recordWin(topCard);
    addLog(`You won with ${topCard} on top of the Mouth!`);
    announce(`${msg} Only ${cardName(topCard)} sits on top of the Mouth. You win! ${topCard} is checked off.`);
    refresh();
  } else {
    turn++;
    phase = "draw";
    announce(`${msg} Turn ${turn}: draw a card.`);
    refresh();
  }
}

function lose(text) {
  result = "lose";
  phase = "over";
  addLog(text);
  announce(text);
  refresh();
}

// ---------- Rendering: canvas --------------------------------
function draw() {
  background("#fde4ef");
  const L = computeLayout();
  layoutCache = L;
  const n = stack.length;
  const m = stack.indexOf(MOUTH);
  const eatPair = phase === "eat" && m > 0 && m < n - 1;
  const pad = 12;

  textAlign(CENTER, CENTER);
  for (let i = 0; i < n; i++) {
    const s = L.slots[i];
    const x = s.x;
    const y = i === selected ? s.y - s.lift : s.y;
    const v = stack[i];
    const cw = s.w, ch = s.h;

    // card image, drawn at its exact colors
    const el = cardDrawable(v);
    if (el) {
      drawingContext.drawImage(el, x, y, cw, ch); // exact pixels, no tinting
    } else {
      fill("#ffffff"); stroke("#00585f"); strokeWeight(2); rect(x, y, cw, ch, 8);
      noStroke(); fill("#2b0a1e"); textSize(28); textStyle(BOLD); text(v, x + cw / 2, y + ch / 2);
    }

    // outlines (shape + label, not color alone)
    noFill();
    if (i === selected) { stroke("#00585f"); strokeWeight(6); rect(x - 3, y - 3, cw + 6, ch + 6, 8); }
    if (i === target) {
      stroke("#1a1a1a"); strokeWeight(4); drawingContext.setLineDash([10, 6]);
      rect(x - 3, y - 3, cw + 6, ch + 6, 8); drawingContext.setLineDash([]);
    }
    if (i === hoverIndex) { stroke("#1a1a1a"); strokeWeight(2); rect(x - 1, y - 1, cw + 2, ch + 2, 6); }

    // labels above
    const tags = [];
    if (i === selected) tags.push("SELECTED");
    else if (i === target) tags.push("TARGET");
    if (i === n - 1) tags.push(v === MOUTH ? "TOP" : L.narrow ? "TOP" : "TOP · RULE");
    if (eatPair && (i === m - 1 || i === m + 1)) tags.push("PAIR");
    noStroke(); textStyle(BOLD);
    if (tags.length && !L.narrow) {
      fill("#2b0a1e"); textSize(13);
      text(tags.join(" · "), x + s.hitW / 2, y - 11);
    } else if (tags.length) {
      // rows layout: tag drawn as a pill on the card's top edge (no space needed above)
      textSize(Math.max(9, Math.min(11, cw / 7)));
      const label = tags.join("·"), tw = textWidth(label) + 10;
      fill("#2b0a1e"); rect(x + cw / 2 - tw / 2, y - 7, tw, 15, 7);
      fill("#ffffff"); text(label, x + cw / 2, y + 1);
    }

    // pair marker: thick bar under the two cards around the Mouth
    if (eatPair && !L.narrow && (i === m - 1 || i === m + 1)) { fill("#a3004e"); rect(x + 4, s.y + ch + 17, (i === n - 1 ? cw : s.hitW) - 8, 4, 2); }

    // position number below
    fill("#2b0a1e"); textStyle(NORMAL); textSize(12);
    const showBottom = i === 0 && (L.narrow ? cw >= 60 : L.step >= cw);
    text(showBottom ? "1·bottom" : String(i + 1), x + s.hitW / 2, s.y + ch + 8);
  }

  // Deck: drawn cards go onto the top of the stack
  const d = L.deck;
  if (d.big) {
    for (let k = Math.min(deck.length, 4) - 1; k >= 0; k--) {
      fill(k === 0 ? "#00585f" : "#0d7480"); stroke("#ffffff"); strokeWeight(2);
      rect(d.x + k * 3, d.y - k * 3, d.w, d.h, 8);
    }
    if (deck.length === 0) { noFill(); stroke("#5a3049"); strokeWeight(2); drawingContext.setLineDash([6, 5]); rect(d.x, d.y, d.w, d.h, 8); drawingContext.setLineDash([]); }
    noStroke(); fill(deck.length ? "#ffffff" : "#5a3049"); textStyle(BOLD); textSize(15);
    text(deck.length ? `DECK\n${deck.length}` : "DECK\nempty", d.x + d.w / 2, d.y + d.h / 2);
    fill("#2b0a1e"); textStyle(NORMAL); textSize(13);
    text(`Eaten: ${eatenPile.length}`, d.x + d.w / 2, L.slots[0].y + L.ch + 8);
  } else {
    textAlign(LEFT, CENTER); textStyle(BOLD); textSize(14);
    const label = `Deck: ${deck.length || "empty"}`;
    const tw = textWidth(label) + 20;
    fill(deck.length ? "#00585f" : "#ffffff"); stroke("#00585f"); strokeWeight(2); rect(d.x, d.y, tw, d.h, 14);
    noStroke(); fill(deck.length ? "#ffffff" : "#00585f"); text(label, d.x + 10, d.y + d.h / 2);
    fill("#2b0a1e"); textStyle(NORMAL); text(`Eaten: ${eatenPile.length}`, d.x + tw + 12, d.y + d.h / 2);
    textAlign(CENTER, CENTER);
  }

  // Result banner
  if (result) {
    const msg = result === "win" ? "YOU WIN!" : "YOU LOSE";
    const bw = Math.min(260, width - 24), by = L.narrow ? 20 : 22;
    fill(255, 255, 255, 240); stroke(result === "win" ? "#1d5e20" : "#9b1111"); strokeWeight(4);
    rectMode(CENTER); rect(width / 2, by, bw, 40, 10); rectMode(CORNER);
    noStroke(); fill(result === "win" ? "#1d5e20" : "#9b1111"); textStyle(BOLD); textSize(24);
    text(msg, width / 2, by + 1);
  }
}

let layoutCache = null;
function cardAt(mx, my) {
  const L = layoutCache || computeLayout();
  // search from top-most (right-most) so overlapping cards pick the visible one
  for (let i = L.slots.length - 1; i >= 0; i--) {
    const s = L.slots[i];
    const y = i === selected ? s.y - s.lift : s.y;
    if (mx >= s.x && mx <= s.x + s.hitW && my >= y && my <= y + s.h) return i;
  }
  return null;
}

// ---------- Pointer input (mouse, touch, pen) -----------------
// Pointer events are used instead of p5's mouse functions so that a tap
// on a phone selects exactly once, and so hover only applies to real pointers.
function canvasPoint(el, ev) {
  const r = el.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * (width / r.width), y: (ev.clientY - r.top) * (height / r.height), r };
}
function slotRectOnPage(el, i) {
  const L = layoutCache || computeLayout();
  const s = L.slots[i], r = el.getBoundingClientRect(), k = r.width / width;
  const y = i === selected ? s.y - s.lift : s.y;
  return { left: r.left + s.x * k, top: r.top + y * k, width: s.hitW * k, height: s.h * k };
}
function setupPointer(el) {
  el.style.touchAction = "manipulation";
  el.addEventListener("pointermove", (ev) => {
    if (ev.pointerType === "touch") return;
    const p = canvasPoint(el, ev);
    const i = cardAt(p.x, p.y);
    if (i !== hoverIndex) {
      hoverIndex = i;
      el.style.cursor = i !== null && phase === "move" ? "pointer" : "default";
      if (i !== null) showTooltip(stack[i], slotRectOnPage(el, i), "canvas");
      else hideTooltip("canvas");
      redraw();
    }
  });
  el.addEventListener("pointerleave", (ev) => {
    if (ev.pointerType === "touch") return;
    hoverIndex = null; redraw();
    // give the pointer a moment to move onto the tooltip itself (WCAG 1.4.13 hoverable)
    setTimeout(() => { if (!tooltipHovered) hideTooltip("canvas"); }, 150);
  });
  el.addEventListener("pointerdown", (ev) => {
    const p = canvasPoint(el, ev);
    const i = cardAt(p.x, p.y);
    if (i === null) { hideTooltip(); return; }
    pickCard(i); // re-renders, so measure afterwards
    if (ev.pointerType === "touch" || ev.pointerType === "pen") {
      // phones have no hover: a tap shows the card's power
      hoverIndex = i; redraw();
      showTooltip(stack[i], slotRectOnPage(el, i), "canvas");
    }
  });
}

// ---------- Power tooltip ------------------------------------
// Meets WCAG 1.4.13: dismissible (Esc or tap elsewhere), hoverable, persistent.
let tooltipEl = null, tooltipOwner = null, tooltipHovered = false;
function setupTooltip() {
  tooltipEl = document.getElementById("power-tip");
  tooltipEl.addEventListener("pointerenter", () => { tooltipHovered = true; });
  tooltipEl.addEventListener("pointerleave", () => { tooltipHovered = false; hideTooltip(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTooltip(); });
  document.addEventListener("pointerdown", (e) => {
    if (!tooltipEl.contains(e.target) && e.target.tagName !== "CANVAS" && !e.target.closest(".has-tip")) hideTooltip();
  }, true);
}
function powerText(v) {
  if (v === MOUTH) return { title: "The Mouth (8)", body: CARDS[v].text, note: "" };
  const onTop = stack[stack.length - 1] === v;
  return {
    title: `Numbster ${v} — power`,
    body: CARDS[v].text + ".",
    note: !stack.includes(v) ? "" : onTop ? "Active now: this card is on top." : "Usable only when this card is on top.",
  };
}
function showTooltip(v, rect, owner) {
  const t = powerText(v);
  tooltipEl.innerHTML = `<strong>${t.title}</strong><span>${t.body}</span>${t.note ? `<em>${t.note}</em>` : ""}`;
  tooltipEl.hidden = false;
  tooltipOwner = owner || null;
  const tw = tooltipEl.offsetWidth, th = tooltipEl.offsetHeight;
  const vw = document.documentElement.clientWidth;
  let left = rect.left + rect.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, vw - tw - 8));
  let top = rect.top - th - 10;                  // prefer above the card
  let below = false;
  if (top < 8) { top = rect.top + rect.height + 10; below = true; }
  tooltipEl.style.left = left + window.scrollX + "px";
  tooltipEl.style.top = top + window.scrollY + "px";
  tooltipEl.classList.toggle("below", below);
  tooltipEl.style.setProperty("--arrow-x", Math.max(14, Math.min(tw - 14, rect.left + rect.width / 2 - left)) + "px");
}
function hideTooltip(owner) {
  if (!tooltipEl) return;
  if (owner && tooltipOwner && owner !== tooltipOwner) return;
  tooltipEl.hidden = true;
  tooltipOwner = null;
  tooltipHovered = false;
}
// Attach hover + keyboard-focus tooltips to any HTML element showing a card
function attachTip(el, v) {
  el.classList.add("has-tip");
  const show = () => showTooltip(v, el.getBoundingClientRect(), el);
  const hide = () => setTimeout(() => { if (!tooltipHovered) hideTooltip(el); }, 150);
  el.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") show(); });
  el.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") hide(); });
  el.addEventListener("focus", show);
  el.addEventListener("blur", () => hideTooltip(el));
}

// ---------- Rendering: HTML controls -------------------------
function refresh() {
  const stepWord = { draw: "draw", move: "move (optional)", eat: "eat" }[phase];
  document.getElementById("turn-info").textContent =
    phase === "over" ? `Game over after ${turn} turn${turn > 1 ? "s" : ""}.`
      : `Turn ${turn}, ${stepWord} step · Deck: ${deck.length} · Stack: ${stack.length} cards · Top card: ${stack[stack.length - 1]}`;

  const status = document.getElementById("status");
  status.className = "status" + (result ? " " + result : "");

  // stack buttons
  const help = document.getElementById("stack-help");
  help.textContent = phase === "move"
    ? "Press a card to select it, then press a second card to swap with it or move beside it."
    : "Press a card to read its rule. The rightmost card is the top of the stack.";
  const ol = document.getElementById("stack-buttons");
  // keep keyboard focus on the same stack position after re-rendering
  const active = document.activeElement;
  const refocus = active && active.dataset && active.dataset.pos !== undefined ? Number(active.dataset.pos) : null;
  hideTooltip();
  ol.innerHTML = "";
  stack.forEach((v, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    const pos = i === 0 ? "bottom" : i === stack.length - 1 ? "top" : "pos " + (i + 1);
    b.innerHTML = `${v === MOUTH ? "8" : v}<small>${v === MOUTH ? "Mouth" : pos}</small>`;
    if (v === MOUTH) b.classList.add("mouth");
    let label = `Position ${i + 1}${i === 0 ? ", bottom" : ""}${i === stack.length - 1 ? ", top" : ""}: ${cardName(v)}`;
    if (phase === "move") {
      b.setAttribute("aria-pressed", String(i === selected));
      if (i === target) { b.classList.add("target"); label += ", target"; }
    }
    b.setAttribute("aria-label", label);
    b.dataset.pos = i;
    // the card's power is exposed to screen readers as the button's description
    const desc = document.createElement("span");
    desc.id = "power-" + i;
    desc.className = "visually-hidden";
    desc.textContent = (v === MOUTH ? "" : "Power: ") + CARDS[v].text + ".";
    b.setAttribute("aria-describedby", desc.id);
    b.addEventListener("click", () => pickCard(i));
    b.addEventListener("focus", () => showDetail(v));
    attachTip(b, v);
    li.appendChild(b);
    li.appendChild(desc);
    ol.appendChild(li);
  });

  // action buttons
  const box = document.getElementById("action-buttons");
  box.innerHTML = "";
  const add = (label, fn, cls) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label;
    if (cls) b.className = cls;
    b.addEventListener("click", fn);
    box.appendChild(b);
    return b;
  };

  if (phase === "draw") {
    add(deck.length ? "Draw a card" : "Skip draw (deck is empty)", doDraw);
  } else if (phase === "move") {
    if (selected !== null && target !== null) {
      const a = stack[selected], b = stack[target];
      add(`Swap ${a} and ${b}`, swapCards);
      if (target !== selected + 1) add(`Move ${a} just below ${b} (left)`, () => moveBeside(-1));
      if (target !== selected - 1) add(`Move ${a} just above ${b} (right)`, () => moveBeside(1));
    }
    if (selected !== null) add("Clear selection", () => { selected = target = null; announce("Selection cleared."); refresh(); }, "secondary");
    add("Skip move, go to Eat", skipMove, "secondary");
  } else if (phase === "eat") {
    const opts = eatOptions();
    opts.forEach((o) => add(o.label, () => doEat(o)));
    if (moveMade) add("Undo move", undoMove, "secondary");
    else add("Back to Move step", undoMove, "secondary");
    if (opts.length === 0) add("Nothing can be eaten — end game", () => lose("Nothing could be eaten. You lose!"), "secondary");
  } else if (phase === "over") {
    add("Play again", newGame).focus();
  }

  renderChecklist();
  fitCanvas();
  if (refocus !== null) {
    const nb = ol.querySelector(`button[data-pos="${Math.min(refocus, stack.length - 1)}"]`);
    if (nb) nb.focus({ preventScroll: true });
  }
}

// If the art files are missing (e.g. the cards folder wasn't uploaded), say so
function updateArtAvailability() {
  const note = document.getElementById("art-note");
  if (note) note.hidden = false;
  if (theme === "art") setTheme("simple", true);
}

function showDetail(v) {
  const d = document.getElementById("card-detail");
  d.dataset.card = v;
  const special = v === MOUTH ? "" : `<p><strong>Special rule:</strong> ${CARDS[v].text}.</p>
     <p>${v === stack[stack.length - 1] ? "This card is on top, so its rule can be used now." : "Only usable when this card is on top of the stack."}</p>`;
  d.innerHTML = `<img src="${cardSrc(v)}" alt="${cardAlt(v)}">
    <div><p><strong>${v === MOUTH ? "The Mouth (8)" : "Numbster " + v}</strong></p>
    ${v === MOUTH ? `<p>${CARDS[v].text}</p>` : special}</div>`;
}

function announce(text) {
  const s = document.getElementById("status");
  // clear then set so repeated identical messages are still announced
  s.textContent = "";
  setTimeout(() => { s.textContent = text; }, 50);
}

function addLog(text) {
  const li = document.createElement("li");
  li.textContent = text;
  const ol = document.getElementById("log");
  ol.appendChild(li);
  ol.scrollTop = ol.scrollHeight;
}

// ---------- Checklist (saved per browser) --------------------
function loadWins() {
  try { return JSON.parse(localStorage.getItem("numbsters-wins") || "[]"); } catch (e) { return []; }
}
function saveWins(w) {
  try { localStorage.setItem("numbsters-wins", JSON.stringify(w)); } catch (e) { /* storage unavailable */ }
  window._wins = w;
}
function recordWin(n) {
  const w = window._wins || loadWins();
  if (!w.includes(n)) w.push(n);
  saveWins(w);
}
function renderChecklist() {
  const w = window._wins || loadWins();
  window._wins = w;
  const ul = document.getElementById("checklist");
  if (!ul.childElementCount) {
    for (let n = 1; n <= 18; n++) {
      if (n === MOUTH) continue;
      const li = document.createElement("li");
      li.dataset.n = n;
      // checkbox on top, number underneath; the whole label is the click/tap target
      li.innerHTML = `<label><input type="checkbox" aria-label="Won with Numbster ${n}"><span class="num" aria-hidden="true">${n}</span></label>`;
      const box = li.querySelector("input");
      // wins are checked automatically, but players can also tick them by hand
      box.addEventListener("change", () => {
        const list = (window._wins || loadWins()).filter((x) => x !== n);
        if (box.checked) list.push(n);
        saveWins(list);
        renderChecklist();
        announce(`Numbster ${n} ${box.checked ? "checked" : "unchecked"}. ${list.length} of 17 won.`);
      });
      attachTip(li.querySelector("label"), n);
      ul.appendChild(li);
    }
  }
  for (const li of ul.children) {
    const n = Number(li.dataset.n), won = w.includes(n);
    li.classList.toggle("won", won);
    li.querySelector("input").checked = won;
  }
  document.getElementById("checklist-heading").textContent = `Numbster checklist (${w.length} of 17)`;
}
