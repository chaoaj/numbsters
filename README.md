# Numbsters (p5.js)

A p5.js recreation of the Button Shy solitaire game *Numbsters*
(design: Milan Zivkovic, art: Luke Flowers).

## Files
- `index.html` – page structure, accessible controls, rules
- `style.css` – layout and WCAG AA colors
- `simplecards.js` – the default card set: an original design drawn in code (no artwork)
- `sketch.js` – p5.js sketch: game rules (`CARDS`, `eatOptions()`), turn flow, canvas drawing
- `manifest.json`, `icon-192.png`, `icon-512.png` – lets phones "Add to Home Screen" as an app
- `cards/card01.png` … `card18.png` – cards sliced from the card photo at original pixels (card08 is the Mouth)

## Running it
- **p5.js Web Editor:** create a sketch, replace `index.html`, `style.css`, `sketch.js`,
  then use *Upload file* to add a `cards` folder with the 18 PNGs.
- **Locally:** serve the folder (e.g. `python -m http.server`) and open http://localhost:8000.
  Opening `index.html` straight from disk blocks image loading in most browsers.

## Card styles
- **Simple cards (default):** drawn by `makeSimpleCard()` in `simplecards.js`. Each shows the value, ODD/EVEN and
  1-DIGIT/2-DIGIT tags, and the power in large text. Change `SIMPLE_COLORS` or the drawing code to restyle them.
- **Original Numbsters art:** pick it under *Card style*. Needs the `cards` folder; if the images are missing, the game
  stays on simple cards and says so. The choice is saved in the browser.

## Phones and card powers
- Under 640 px wide, the stack wraps into rows of cards big enough to tap, and the action buttons go full width.
- A card's power pops up when you hover with a mouse, tap it on a touch screen, or tab to its stack button.
  The pop-up stays while you move onto it and closes with Esc or a tap elsewhere (WCAG 1.4.13).

## Accessibility notes
- Every action is a native HTML button (keyboard and screen reader usable); the canvas is a visual mirror marked `aria-hidden`.
- Game messages are announced through an `aria-live` status region; a text game log records every turn.
- Selected/target/top cards are marked by outline style **and** text labels, not by color alone.
- Card images carry alt text describing the monster and its eating rule.

## Teaching hooks
- `CARDS[n].rule(eater, eaten, nums)` – each special rule is a one-line predicate.
- `sequential(a, b)` – note the 7/9 special case.
- `eatOptions()` – a good place for students to add a hint or an auto-solver.
- Note: the p5 global `log()` (natural log) shadows any user function named `log`, which is why the logger is `addLog()`.
