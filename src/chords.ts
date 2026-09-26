export type Chord = {
  source: string;
  root: string;
  rootPc: number;
  intervals: number[];
  quality: string;
  slashPc?: number;
  id: string;
};

const pitchClasses: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, 'E#': 5, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11, 'B#': 0,
};

export const noteName = (midi: number) => {
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
};

function pitchClass(note: string): number | undefined {
  const normalized = note[0].toUpperCase() + note.slice(1);
  return pitchClasses[normalized];
}

function formula(suffix: string): { intervals: number[]; quality: string } | undefined {
  const compact = suffix.replace(/[\s()]/g, '');
  const lower = compact.toLowerCase();

  if (['', 'maj', 'major', 'ma', 'M'].includes(compact)) return { intervals: [0, 4, 7], quality: 'Major' };
  if (['m', 'min', 'minor', '-'].includes(lower)) return { intervals: [0, 3, 7], quality: 'Minor' };
  if (['dim', 'o', '°'].includes(lower)) return { intervals: [0, 3, 6], quality: 'Diminished' };
  if (['aug', '+'].includes(lower)) return { intervals: [0, 4, 8], quality: 'Augmented' };
  if (['sus', 'sus4'].includes(lower)) return { intervals: [0, 5, 7], quality: 'Suspended 4' };
  if (lower === 'sus2') return { intervals: [0, 2, 7], quality: 'Suspended 2' };
  if (['5', 'power'].includes(lower)) return { intervals: [0, 7], quality: 'Power chord' };
  if (lower === '6') return { intervals: [0, 4, 7, 9], quality: 'Major 6' };
  if (lower === 'm6' || lower === 'min6') return { intervals: [0, 3, 7, 9], quality: 'Minor 6' };
  if (['maj7', 'major7', 'ma7', 'm7+', 'δ7', 'Δ7', 'M7'].includes(compact)) {
    return { intervals: [0, 4, 7, 11], quality: 'Major 7' };
  }
  if (['m7b5', 'ø', 'ø7', 'halfdim', 'halfdim7'].includes(lower)) {
    return { intervals: [0, 3, 6, 10], quality: 'Half-diminished 7' };
  }
  if (['dim7', 'o7', '°7'].includes(lower)) return { intervals: [0, 3, 6, 9], quality: 'Diminished 7' };
  if (['mmaj7', 'minmaj7', 'mΔ7'].includes(lower)) return { intervals: [0, 3, 7, 11], quality: 'Minor major 7' };
  if (['m7', 'min7', 'minor7', '-7'].includes(lower)) return { intervals: [0, 3, 7, 10], quality: 'Minor 7' };
  if (['7', 'dom7'].includes(lower)) return { intervals: [0, 4, 7, 10], quality: 'Dominant 7' };
  if (['add9', 'majadd9'].includes(lower)) return { intervals: [0, 4, 7, 14], quality: 'Major add 9' };
  if (['madd9', 'minadd9'].includes(lower)) return { intervals: [0, 3, 7, 14], quality: 'Minor add 9' };
  if (lower === '9') return { intervals: [0, 4, 7, 10, 14], quality: 'Dominant 9' };
  if (lower === 'maj9' || lower === 'major9') return { intervals: [0, 4, 7, 11, 14], quality: 'Major 9' };
  if (lower === 'm9' || lower === 'min9') return { intervals: [0, 3, 7, 10, 14], quality: 'Minor 9' };
  if (lower === '11') return { intervals: [0, 4, 7, 10, 14, 17], quality: 'Dominant 11' };
  if (lower === '13') return { intervals: [0, 4, 7, 10, 14, 21], quality: 'Dominant 13' };
  return undefined;
}

export function parseChord(source: string): Chord | undefined {
  const token = source.trim();
  if (!token) return undefined;
  const slashMatch = token.match(/^(.*?)\/([A-Ga-g][#b]?)$/);
  const main = slashMatch ? slashMatch[1] : token;
  const rootMatch = main.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!rootMatch) return undefined;
  const root = rootMatch[1].toUpperCase() + rootMatch[2];
  const rootPc = pitchClass(root);
  const parsedFormula = formula(rootMatch[3]);
  const bass = slashMatch ? pitchClass(slashMatch[2]) : undefined;
  if (rootPc === undefined || !parsedFormula || (slashMatch && bass === undefined)) return undefined;
  const normalizedIntervals = [...parsedFormula.intervals].map((n) => n % 12).sort((a, b) => a - b);
  const id = `${rootPc}:${[...new Set(normalizedIntervals)].join('.')}`;
  return {
    source: token,
    root,
    rootPc,
    intervals: parsedFormula.intervals,
    quality: parsedFormula.quality,
    slashPc: bass,
    id,
  };
}

export function parseChordList(input: string): { chords: Chord[]; invalid: string[] } {
  const tokens = input.split(/[\s,|;→]+/).filter(Boolean);
  const chords: Chord[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const chord = parseChord(token);
    if (chord) chords.push(chord);
    else invalid.push(token);
  }
  return { chords, invalid };
}

function inversionPatterns(chord: Chord): number[][] {
  const source = chord.intervals;
  const patterns: number[][] = [];
  const starts = chord.slashPc === undefined
    ? source.map((_, i) => i)
    : source.map((_, i) => i).filter((i) => (chord.rootPc + source[i]) % 12 === chord.slashPc);

  if (starts.length > 0) {
    for (const start of starts) {
      const rotated = source.slice(start).concat(source.slice(0, start).map((n) => n + 12));
      patterns.push(rotated);
    }
  } else {
    // A non-chord slash bass is included as a lower note so the requested bass is still visible.
    const bassOffset = ((chord.slashPc! - chord.rootPc + 12) % 12);
    const signedBass = bassOffset > 6 ? bassOffset - 12 : bassOffset;
    patterns.push([signedBass, ...source].sort((a, b) => a - b));
  }
  if (chord.slashPc === undefined) {
    for (let start = 0; start < source.length; start++) {
      patterns.push(source.slice(start).concat(source.slice(0, start).map((n) => n + 12)));
    }
  }
  const unique = new Map<string, number[]>();
  for (const pattern of patterns) unique.set(pattern.join(','), pattern);
  return [...unique.values()];
}

function chordCandidates(chord: Chord): number[][] {
  const rootMidi = Array.from({ length: 25 }, (_, i) => 48 + i)
    .filter((midi) => midi % 12 === chord.rootPc)
    .sort((a, b) => Math.abs(a - 60) - Math.abs(b - 60))[0];
  const candidates: number[][] = [];
  for (const pattern of inversionPatterns(chord)) {
    for (let octave = -3; octave <= 3; octave++) {
      const notes = pattern.map((interval) => rootMidi + interval + octave * 12).sort((a, b) => a - b);
      if (notes.every((note) => note >= 21 && note <= 108)) candidates.push(notes);
    }
  }
  return candidates;
}

function closeness(a: number[], b: number[]): number {
  const nearestDistance = (from: number[], to: number[]) => from.reduce((sum, note) => {
    return sum + Math.min(...to.map((other) => Math.abs(note - other)));
  }, 0);
  const spacingPenalty = Math.max(0, (Math.max(...a) - Math.min(...a)) - 19) * 0.8;
  return nearestDistance(a, b) + nearestDistance(b, a) + spacingPenalty;
}

export function arrangeProgression(chords: Chord[], octaveShifts: number[]): number[][] {
  let previous: number[] | undefined;
  return chords.map((chord, index) => {
    const targetOctaveShift = (octaveShifts[index] ?? 0) * 12;
    const candidates = chordCandidates(chord).filter((candidate) => candidate.every((note) => note + targetOctaveShift >= 21 && note + targetOctaveShift <= 108));
    if (candidates.length === 0) return [];
    let selected = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const score = previous
        ? closeness(candidate, previous)
        : Math.abs(candidate.reduce((sum, note) => sum + note, 0) / candidate.length - 60) * 2
          + (Math.max(...candidate) - Math.min(...candidate)) * 0.2
          + (candidate[0] % 12 === chord.rootPc ? 0 : 8);
      if (score < bestScore) {
        bestScore = score;
        selected = candidate;
      }
    }
    const actual = selected.map((note) => note + targetOctaveShift);
    previous = actual;
    return actual;
  });
}

export function suggestedFingers(notes: number[], hand: 'right' | 'left', rootPc: number, intervals: number[]): number[] {
  const right: Record<number, number[]> = {
    1: [1], 2: [1, 5], 3: [1, 3, 5], 4: [1, 2, 3, 5], 5: [1, 2, 3, 4, 5],
  };
  const left: Record<number, number[]> = {
    1: [1], 2: [5, 1], 3: [5, 3, 1], 4: [5, 4, 2, 1], 5: [5, 4, 3, 2, 1],
  };
  const count = Math.max(1, Math.min(5, notes.length));
  if (notes.length === 3) {
    const bassInterval = ((notes[0] % 12) - rootPc + 12) % 12;
    const inversion = intervals.map((interval) => interval % 12).indexOf(bassInterval);
    // A third-in-the-bass triad is often more comfortable with fingers 1-2-5 (mirrored for LH).
    if (inversion === 1) return hand === 'right' ? [1, 2, 5] : [5, 4, 1];
  }
  return (hand === 'right' ? right : left)[count];
}
