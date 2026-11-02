# ReadAlong

Paste any lesson. Listen, follow each word, read your way.

ReadAlong turns pasted text into a guided read-aloud experience using the browser's built-in speech. It highlights what is being read, and lets the reader tune the page to their eyes: text size, letter spacing, line height, and three contrast themes.

## Run it

Fully static site. Open `index.html` or serve the folder:

```
python3 -m http.server 8000
```

Deployed version: (GitHub Pages link added at submission)

## Features

- Read aloud with play / pause / resume / stop and speed control (0.5x - 1.6x).
- Click any sentence to start reading from there.
- Word-by-word tracking where the browser's speech engine reports word positions (Chrome/Edge); otherwise the app detects this and follows sentence by sentence - the active mode is always shown, honestly.
- Readability controls: text size, letter spacing, line height, and cream / dark / high-contrast themes - built for readers with dyslexia, low vision, or attention difficulties.
- ReadAlong itself uploads nothing and needs no account. Speech is produced by your browser's built-in engine, which on some devices may use a network voice.

## Built with

Vanilla HTML/CSS/JavaScript, Web Speech API (SpeechSynthesis). No dependencies.

Built during AccessED Hacks (Oct 17 - Nov 20, 2026). AI assistance used for ideation. Sample passages written for this event.
