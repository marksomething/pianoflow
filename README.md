# PianoFlow

PianoFlow turns a chord progression into a visual guide for finding and playing the notes on a piano. Chords appear in sequence on a piano keyboard, with repeated chords sharing a color.

## Features

- Shows chord tones on an 88-key piano, with note names and a consistent color for each chord.
- Arranges root-position chords near the middle register and optimizes octave placement across the whole progression for smoother movement.
- Supports explicit slash chords such as `C/G` and `C/E` when a different bass note is wanted.
- Lets you adjust an individual chord up or down by up to two octaves.
- Accepts section titles in brackets, such as `[Verse 1]`; line breaks between chords create unlabeled separators.
- Loads the built-in example, a public text file from a URL (including GitHub file/blob links), or a local file. Local files can also be dragged onto the progression input.
- Keeps the piano display from scrolling horizontally: it trims outer octaves on narrower screens and keeps adjusted chord notes in view.

## Getting started

Requires Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```sh
npm run build
npm run preview
```

## Entering chords

Separate chord symbols with spaces or commas. For example:

```text
C  G  Am  F
```

Common supported qualities include major and minor triads, diminished and augmented chords, suspended chords, power chords, 6ths, 7ths, add9, 9ths, 11ths, and 13ths. Roots accept sharps and flats. Slash notation specifies a bass note:

```text
[Verse]
C  G/B  Am  F

[Chorus]
F  C/E  G
```

Square-bracketed chord symbols such as `[C]` are also recognized when loading chord-text files.

## Loading a progression

Select **Load** beside the progression input to choose one of three sources:

1. **Example progression** — load the built-in sample.
2. **From a URL** — paste a public text-file URL. GitHub `blob` links are converted to their raw-file URL automatically; raw GitHub URLs also work.
3. **Local file** — choose a chord-text file, or drag and drop one onto the progression input.

Local files are limited to 1 MB. Supported extensions include `.txt`, `.md`, `.pro`, `.cho`, `.chordpro`, and `.csv`. The file should contain chord symbols in text form; unrecognized text in a file is ignored.

## How voicings are chosen

Ordinary chords stay in root position. Slash chords keep their specified bass note. PianoFlow considers register placements for the entire progression together, minimizing voice movement while preferring a comfortable middle register. An octave adjustment pins that chord relative to the unadjusted progression and lets neighboring chords revoice around it.

Fingerings are not displayed; the guide focuses on showing the chord tones and where to play them.
