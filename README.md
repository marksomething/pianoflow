# PianoFlow

PianoFlow turns a chord progression into a visual guide for finding and playing notes on a piano. Chords appear in sequence on a keyboard, with the notes to play highlighted in color.

## Features

- Maps chords onto an 88-key piano display, with note names for highlighted keys.
- Repeated instances of the same root, quality, and slash-bass share a color. Different qualities and inversions use distinct colors.
- Updates the display automatically after you edit the progression; unrecognized chord tokens are reported below the text field.
- Loads the built-in *I Will Follow You Into the Dark* example, a public text file from a URL, or a local file. Local files can also be dragged onto the progression input.
- Supports bracketed section titles, such as `[Verse 1]`; new lines between chords create unlabeled separators.
- Keeps piano displays from scrolling horizontally. Narrow layouts show a centered portion of the keyboard, and the visible range shifts when needed to keep adjusted chord notes in view.
- Arranges octave placements across the full progression for smoother voice leading, while keeping chords in root position unless slash notation specifies a bass note.

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

Separate chord symbols with spaces or commas. The display updates automatically as you type. For example:

```text
C  G  Am  F
```

Common supported qualities include major and minor triads, diminished and augmented chords, suspended chords, power chords, 6ths, 7ths, add9, 9ths, 11ths, and 13ths. Roots accept sharps and flats. Slash notation explicitly specifies a bass note and inversion:

```text
[Verse]
C  G/B  Am  F

[Chorus]
F  C/E  G
```

Use square brackets for section labels. In chord-text files, bracketed chord symbols such as `[C]` are also recognized. A token that cannot be parsed as a chord is reported beneath the progression field.

The built-in example is:

```text
Am  C  F  C  G/B
Am  C  G
Am  C  E  Am  Am/G  F  Fm  C/G
```

## Loading a progression

Select **Load** beside the progression input to choose one of three sources:

1. **Example progression** — load the built-in sample above.
2. **From a URL** — paste a public, browser-readable text-file URL. GitHub `blob` links are converted to raw-file URLs automatically; raw GitHub URLs also work.
3. **Local file** — choose a chord-text file, or drag and drop one onto the progression input.

Local files are limited to 1 MB. Supported extensions include `.txt`, `.md`, `.pro`, `.cho`, `.chordpro`, and `.csv`. Files should contain chord symbols in text form; other text in imported files is ignored.

## How voicings are chosen

Chords start in root position near the middle register. Use slash notation such as `C/G` when you want a different bass note. PianoFlow evaluates octave placements across the whole progression, balancing note movement with a comfortable register. An octave adjustment pins that chord relative to the unadjusted progression and lets neighboring chords revoice around it.

Fingerings are not displayed; the guide focuses on chord tones and where to play them.
