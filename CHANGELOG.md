# Changelog

Notable changes to PianoFlow are recorded here.

## [1.1.0] - 2026-09-27

### Added
- Load the built-in example, public chord-text URLs, or local files; local files can also be drag-and-dropped.
- Convert GitHub `blob` links to raw-file URLs for loading.
- Use bracketed section labels and newline separators in chord progressions.
- Responsive, non-scrolling piano displays that trim outer octaves on narrow screens.
- Sequence-wide voice-leading optimization for octave placement.

### Changed
- Default voicings remain in root position; slash-chord notation explicitly specifies a different bass note.
- Removed the hero banner and finger-number recommendations for a more compact, keys-focused guide.
- Refined chord labels, keyboard spacing, and octave controls.

## [1.0.0] - Initial release

- React/Vite chord guide with colored chord cards and an 88-key piano display.
- Chord parsing, octave adjustment, and root-position voicing support.
