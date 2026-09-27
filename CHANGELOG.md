# Changelog

Notable changes to PianoFlow are recorded here.

## [1.2.0] - 2026-09-27

### Added
- Paste chord sheets with lyrics directly into the progression field, including line-paired and inline bracketed chord cues.
- Group associated piano keyboards and lyrics inside a shared boundary, with colored chord numbers marking change points above the lyric words.

### Changed
- Retain the existing plain-progression parser and chord-token error reporting while auto-detecting pasted lyric sheets.

## [1.1.0] - 2026-09-27

### Added
- Built-in *I Will Follow You Into the Dark* chord progression as the default example.
- Automatic progression updates while typing and inline feedback listing chord tokens that could not be parsed.
- Loading from a public URL or local chord-text file, including drag-and-drop; GitHub `blob` links are converted to raw-file URLs.
- Bracketed section labels and unlabeled separators for progression line breaks.
- Responsive piano displays that never scroll horizontally and trim outer octaves as space gets tight.
- Sequence-wide voice-leading optimization for octave placement.
- Distinct chord colors by root, quality, and slash-bass/inversion; repeats of the same chord voicing retain their color.
- A favicon matching the page’s Lucide Music2 mark.

### Changed
- Chords default to root position; slash-chord notation explicitly specifies a different bass note.
- Removed the hero banner and finger-number recommendations for a more compact, keys-focused guide.
- Refined chord labels, keyboard spacing, and octave controls.

## [1.0.0] - Initial release

- React/Vite chord guide with colored chord cards and an 88-key piano display.
- Chord parsing, octave adjustment, and root-position voicing support.
