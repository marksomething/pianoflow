export type Chord = {
  source: string;
  root: string;
  rootPc: number;
  intervals: number[];
  quality: string;
  slashPc?: number;
  id: string;
};

export type ProgressionItem =
  | { type: 'section'; title: string }
  | { type: 'separator' }
  | { type: 'chord'; chord: Chord; chordIndex: number };

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

export function parseChordList(input: string): { chords: Chord[]; items: ProgressionItem[]; invalid: string[] } {
  const tokens = input.matchAll(/\[[^\]]*\]|[^\s,|;→]+/g);
  const chords: Chord[] = [];
  const items: ProgressionItem[] = [];
  const invalid: string[] = [];
  let previousTokenEnd = 0;
  let previousTokenWasSection = false;
  let hasPreviousToken = false;
  for (const match of tokens) {
    const token = match[0];
    const tokenStart = match.index ?? 0;
    const isSection = token.startsWith('[') && token.endsWith(']');
    const gap = input.slice(previousTokenEnd, tokenStart);
    if (hasPreviousToken && /[\r\n]/.test(gap) && !previousTokenWasSection && !isSection) {
      items.push({ type: 'separator' });
    }
    previousTokenEnd = tokenStart + token.length;
    previousTokenWasSection = isSection;
    hasPreviousToken = true;
    if (isSection) {
      const title = token.slice(1, -1).trim();
      if (title) items.push({ type: 'section', title });
      else invalid.push(token);
      continue;
    }
    const chord = parseChord(token);
    if (chord) {
      const chordIndex = chords.length;
      chords.push(chord);
      items.push({ type: 'chord', chord, chordIndex });
    } else {
      invalid.push(token);
    }
  }
  return { chords, items, invalid };
}

function inversionPatterns(chord: Chord, inversionIndex: number): number[][] {
  const source = chord.intervals;
  const start = ((inversionIndex % source.length) + source.length) % source.length;
  const rotated = source.slice(start).concat(source.slice(0, start));
  const pattern: number[] = [];
  let previous = Number.NEGATIVE_INFINITY;
  for (const interval of rotated) {
    let note = interval;
    while (note <= previous) note += 12;
    pattern.push(note);
    previous = note;
  }

  if (chord.slashPc !== undefined && !source.some((interval) => (chord.rootPc + interval) % 12 === chord.slashPc)) {
    // A non-chord slash bass stays below the selected chord inversion.
    const bassOffset = (chord.slashPc - chord.rootPc + 12) % 12;
    const bassBelowRoot = bassOffset === 0 ? 0 : bassOffset - 12;
    pattern.push(bassBelowRoot);
  }
  return [pattern.sort((a, b) => a - b)];
}

export function defaultInversionIndex(chord: Chord): number {
  if (chord.slashPc === undefined) return 0;
  const index = chord.intervals.findIndex((interval) => (chord.rootPc + interval) % 12 === chord.slashPc);
  return index < 0 ? 0 : index;
}

function chordCandidates(chord: Chord, inversionIndex: number): number[][] {
  const rootMidi = Array.from({ length: 25 }, (_, i) => 48 + i)
    .filter((midi) => midi % 12 === chord.rootPc)
    .sort((a, b) => Math.abs(a - 60) - Math.abs(b - 60))[0];
  const candidates: number[][] = [];
  for (const pattern of inversionPatterns(chord, inversionIndex)) {
    for (let octave = -3; octave <= 3; octave++) {
      const notes = pattern.map((interval) => rootMidi + interval + octave * 12).sort((a, b) => a - b);
      if (notes.every((note) => note >= 21 && note <= 108)) candidates.push(notes);
    }
  }
  return candidates;
}

function voiceLeadingCost(from: number[], to: number[]): number {
  const unmatchedVoiceCost = 10;
  const costs = Array.from({ length: from.length + 1 }, () => Array(to.length + 1).fill(Number.POSITIVE_INFINITY));
  costs[0][0] = 0;

  for (let i = 0; i <= from.length; i += 1) {
    for (let j = 0; j <= to.length; j += 1) {
      const current = costs[i][j];
      if (!Number.isFinite(current)) continue;
      if (i < from.length && j < to.length) {
        const leap = Math.abs(from[i] - to[j]);
        const moveCost = leap + Math.max(0, leap - 7) * 0.7;
        costs[i + 1][j + 1] = Math.min(costs[i + 1][j + 1], current + moveCost);
      }
      if (i < from.length) costs[i + 1][j] = Math.min(costs[i + 1][j], current + unmatchedVoiceCost);
      if (j < to.length) costs[i][j + 1] = Math.min(costs[i][j + 1], current + unmatchedVoiceCost);
    }
  }
  return costs[from.length][to.length];
}

function registerCost(notes: number[]): number {
  const center = notes.reduce((sum, note) => sum + note, 0) / notes.length;
  const span = Math.max(...notes) - Math.min(...notes);
  return Math.abs(center - 64) * 1.2 + Math.max(0, span - 12) * 2;
}

function bestSequence(candidateGroups: number[][][]): number[][] {
  if (candidateGroups.length === 0) return [];
  if (candidateGroups.some((group) => group.length === 0)) return candidateGroups.map(() => []);

  const scores = candidateGroups.map((group) => group.map(() => Number.POSITIVE_INFINITY));
  const previousChoices = candidateGroups.map((group) => group.map(() => -1));
  for (let candidate = 0; candidate < candidateGroups[0].length; candidate += 1) {
    scores[0][candidate] = registerCost(candidateGroups[0][candidate]) * 2;
  }

  for (let chordIndex = 1; chordIndex < candidateGroups.length; chordIndex += 1) {
    const previousGroup = candidateGroups[chordIndex - 1];
    const currentGroup = candidateGroups[chordIndex];
    for (let current = 0; current < currentGroup.length; current += 1) {
      const currentNotes = currentGroup[current];
      for (let previous = 0; previous < previousGroup.length; previous += 1) {
        const score = scores[chordIndex - 1][previous]
          + voiceLeadingCost(previousGroup[previous], currentNotes)
          + registerCost(currentNotes) * 0.8;
        if (score < scores[chordIndex][current]) {
          scores[chordIndex][current] = score;
          previousChoices[chordIndex][current] = previous;
        }
      }
    }
  }

  let best = 0;
  const finalScores = scores[scores.length - 1];
  for (let candidate = 1; candidate < finalScores.length; candidate += 1) {
    if (finalScores[candidate] < finalScores[best]) best = candidate;
  }
  const path = Array.from({ length: candidateGroups.length }, () => [] as number[]);
  for (let chordIndex = candidateGroups.length - 1; chordIndex >= 0; chordIndex -= 1) {
    path[chordIndex] = candidateGroups[chordIndex][best];
    best = previousChoices[chordIndex][best];
  }
  return path;
}

export function arrangeProgression(chords: Chord[], octaveShifts: number[]): number[][] {
  const candidateGroups = chords.map((chord) => chordCandidates(chord, defaultInversionIndex(chord)));
  const baseline = bestSequence(candidateGroups);
  if (!octaveShifts.some((shift) => shift !== 0)) return baseline;

  // Octave edits pin that chord relative to the unedited best path; other chords can then revoice around it.
  const adjustedCandidates = candidateGroups.map((group, index) => {
    const shift = octaveShifts[index] ?? 0;
    if (shift === 0) return group;
    const adjusted = baseline[index].map((note) => note + shift * 12);
    return adjusted.length > 0 && adjusted.every((note) => note >= 21 && note <= 108) ? [adjusted] : group;
  });
  return bestSequence(adjustedCandidates);
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
