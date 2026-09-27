import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, Lightbulb, Minus, Music2, Plus, RotateCcw } from 'lucide-react';
import {
  arrangeProgression,
  noteName,
  parseChordList,
  suggestedFingers,
  type Chord,
  type ProgressionItem,
} from './chords';

type Hand = 'right' | 'left';
type ChordColor = { name: string; pale: string; main: string; ink: string; line: string };

const palette: ChordColor[] = [
  { name: 'coral', pale: '#ffe3d9', main: '#ed815e', ink: '#9c452b', line: '#f0b09a' },
  { name: 'blue', pale: '#dcecff', main: '#5798e2', ink: '#265d9d', line: '#a8c9ef' },
  { name: 'green', pale: '#dff2e5', main: '#65a77b', ink: '#356f49', line: '#aad2b5' },
  { name: 'violet', pale: '#eee3ff', main: '#9a75d1', ink: '#64459a', line: '#c6b0e9' },
  { name: 'gold', pale: '#fff0c8', main: '#d8a83f', ink: '#866211', line: '#ecd28b' },
  { name: 'pink', pale: '#ffe1ec', main: '#da7296', ink: '#94445f', line: '#edb0c3' },
  { name: 'teal', pale: '#d7f1ef', main: '#4faaa5', ink: '#2c706c', line: '#9ed5d1' },
  { name: 'slate', pale: '#e6eaf1', main: '#7586a1', ink: '#45536a', line: '#bdc6d3' },
];

function colorAt(index: number): ChordColor {
  if (index < palette.length) return palette[index];
  const hue = Math.round((index * 137.5 + 21) % 360);
  return {
    name: `hue-${hue}`,
    pale: `hsl(${hue} 60% 90%)`,
    main: `hsl(${hue} 48% 48%)`,
    ink: `hsl(${hue} 48% 30%)`,
    line: `hsl(${hue} 42% 73%)`,
  };
}

const example = 'C  G  Am  F  C  G  F  C';

function Keyboard({ notes, fingers, color }: { notes: number[]; fingers: number[]; color: ChordColor }) {
  const active = new Map<number, number>();
  notes.forEach((note, index) => active.set(note, fingers[index]));
  const whitePitchClasses = new Set([0, 2, 4, 5, 7, 9, 11]);
  const whiteWidth = 22;
  const blackWidth = 14;
  const width = whiteWidth * 52;
  const whiteKeys: Array<{ midi: number; x: number }> = [];
  const blackKeys: Array<{ midi: number; x: number }> = [];
  let whiteIndex = 0;
  for (let midi = 21; midi <= 108; midi += 1) {
    if (whitePitchClasses.has(midi % 12)) {
      whiteKeys.push({ midi, x: whiteIndex * whiteWidth });
      whiteIndex += 1;
    } else {
      blackKeys.push({ midi, x: whiteIndex * whiteWidth - blackWidth / 2 });
    }
  }

  const noteLabel = (midi: number) => noteName(midi);
  return (
    <div className="keyboard-scroll" role="img" tabIndex={0} aria-label={`88-key piano with ${notes.map(noteLabel).join(', ')} highlighted`}>
      <svg className="piano-svg" viewBox={`0 0 ${width} 86`} style={{ minWidth: `${width}px` }}>
        <g>
          {whiteKeys.map(({ midi, x }) => {
            const finger = active.get(midi);
            const isActive = active.has(midi);
            const pitch = midi % 12;
            const showLabel = isActive || pitch === 0 || midi === 21;
            return (
              <g key={midi}>
                <rect
                  x={x + 0.5} y="1" width={whiteWidth - 1} height="82" rx="2"
                  fill={isActive ? color.pale : '#fff'}
                  stroke={isActive ? color.line : '#d9dfe3'} strokeWidth="1"
                />
                {isActive && <>
                  <circle cx={x + whiteWidth / 2} cy="57" r="8" fill={color.main} />
                  <text x={x + whiteWidth / 2} y="60.5" textAnchor="middle" className="finger-number" fill="#fff">{finger || '·'}</text>
                </>}
                {showLabel && <text x={x + whiteWidth / 2} y="78" textAnchor="middle" className={`key-label ${isActive ? 'key-label-active' : ''}`} fill={isActive ? color.ink : '#89939a'}>{noteLabel(midi)}</text>}
              </g>
            );
          })}
        </g>
        <g>
          {blackKeys.map(({ midi, x }) => {
            const finger = active.get(midi);
            const isActive = active.has(midi);
            return (
              <g key={midi}>
                <rect
                  x={x} y="1" width={blackWidth} height="46" rx="2.5"
                  fill={isActive ? color.main : '#27323a'}
                  stroke={isActive ? color.ink : '#27323a'} strokeWidth="1"
                />
                {isActive && <text x={x + blackWidth / 2} y="27" textAnchor="middle" className="finger-number" fill="#fff">{finger || '·'}</text>}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function ChordCard({
  chord,
  index,
  notes,
  color,
  hand,
  octaveShift,
  onShift,
}: {
  chord: Chord;
  index: number;
  notes: number[];
  color: ChordColor;
  hand: Hand;
  octaveShift: number;
  onShift: (direction: number) => void;
}) {
  const fingers = suggestedFingers(notes, hand, chord.rootPc, chord.intervals);
  const displayNotes = notes.map(noteName);
  const bassPc = notes.length ? notes[0] % 12 : chord.rootPc;
  const originalSlashBass = chord.source.split('/')[1];
  const bassName = chord.slashPc === bassPc && originalSlashBass
    ? originalSlashBass
    : noteName(notes[0] ?? chord.rootPc + 60).replace(/\d+$/, '');
  const bassSuffix = bassPc === chord.rootPc ? '' : `/${bassName}`;

  return (
    <article className="chord-card" style={{ '--chord-pale': color.pale, '--chord-main': color.main, '--chord-ink': color.ink, '--chord-line': color.line } as React.CSSProperties}>
      <div className="card-topline">
        <div className="step-marker" aria-label={`Chord ${index + 1}`}>{String(index + 1).padStart(2, '0')}</div>
        <div className="chord-title-wrap">
          <div className="chord-title-line">
            <div className="chord-identity">
              <span className="chord-root">{chord.root}{bassSuffix}</span>
              <span className="quality-tag">{chord.quality}</span>
            </div>
            <p className="chord-note-summary">Play <strong>{displayNotes.join(' · ')}</strong></p>
          </div>
        </div>
        <div className="card-side-controls">
          <div className="octave-controls" aria-label={`Adjust ${chord.source} octave`}>
            <span className="octave-caption">OCTAVE</span>
            <div className="octave-control-row">
              <button type="button" className="step-button" onClick={() => onShift(-1)} disabled={octaveShift <= -2} aria-label={`Move ${chord.source} down one octave`}><Minus size={14} /></button>
              <span className="octave-value">{octaveShift === 0 ? '0' : `${octaveShift > 0 ? '+' : ''}${octaveShift}`}</span>
              <button type="button" className="step-button" onClick={() => onShift(1)} disabled={octaveShift >= 2} aria-label={`Move ${chord.source} up one octave`}><Plus size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      <Keyboard notes={notes} fingers={fingers} color={color} />

    </article>
  );
}

function App() {
  const initial = parseChordList(example);
  const [text, setText] = useState(example);
  const [items, setItems] = useState<ProgressionItem[]>(initial.items);
  const chords = useMemo(() => items.flatMap((item) => item.type === 'chord' ? [item.chord] : []), [items]);
  const [octaveShifts, setOctaveShifts] = useState<number[]>(initial.chords.map(() => 0));
  const [hand, setHand] = useState<Hand>('right');
  const [error, setError] = useState('');
  const notesByChord = useMemo(() => arrangeProgression(chords, octaveShifts), [chords, octaveShifts]);
  const colorByChord = useMemo(() => {
    const ids = [...new Set(chords.map((chord) => chord.id))];
    return new Map(ids.map((id, index) => [id, colorAt(index)]));
  }, [chords]);
  const uniqueCount = new Set(chords.map((chord) => chord.id)).size;

  function applyProgression(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      setItems([]);
      setOctaveShifts([]);
      setError('');
      return;
    }
    const result = parseChordList(text);
    if (result.chords.length === 0) {
      setError(`I couldn't read any chords. Try symbols like C, Am, F#m7, or Bb.`);
      return;
    }
    setItems(result.items);
    setOctaveShifts(result.chords.map(() => 0));
    setError(result.invalid.length ? `Skipped unrecognized ${result.invalid.length === 1 ? 'chord' : 'chords'}: ${result.invalid.join(', ')}` : '');
  }

  function loadExample() {
    setText(example);
    const parsed = parseChordList(example);
    setItems(parsed.items);
    setOctaveShifts(parsed.chords.map(() => 0));
    setError('');
  }

  function shiftOctave(index: number, direction: number) {
    setOctaveShifts((current) => current.map((value, i) => i === index ? Math.max(-2, Math.min(2, value + direction)) : value));
  }


  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PianoFlow home">
          <span className="brand-mark"><Music2 size={19} strokeWidth={2.3} /></span>
          <span>piano<span className="brand-light">flow</span></span>
        </a>
        <span className="header-note">A simple map from chord names to piano keys</span>
        <a className="header-link" href="#how-it-works">How to use <ArrowDown size={14} /></a>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span className="eyebrow-dot" /> YOUR CHORDS, MADE PLAYABLE</div>
        <h1>See the chords.<br /><span>Find the keys.</span></h1>
        <p className="hero-copy">Paste in a song’s chords and follow along, one shape at a time. No sheet music or piano experience needed.</p>

        <form className="input-panel" onSubmit={applyProgression}>
          <label htmlFor="chord-input">YOUR CHORD PROGRESSION</label>
          <textarea
            id="chord-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Try: C  G  Am  F"
            rows={2}
            spellCheck={false}
          />
          <div className="input-bottom">
            <span className="input-hint">Use C/G for an explicit inversion; [Verse] labels and new lines add separators</span>
            <div className="input-actions">
              <button className="example-button" type="button" onClick={loadExample}><RotateCcw size={14} /> Load example</button>
              <button className="show-button" type="submit">Show my chords <span aria-hidden="true">→</span></button>
            </div>
          </div>
          {error && <p className={`form-message ${error.startsWith('Skipped') ? 'warning' : ''}`} role="status">{error}</p>}
        </form>
      </section>

      <section className="guide-section" aria-label="Your piano chord guide">
        <div className="guide-heading">
          <div>
            <div className="section-kicker">YOUR PLAYING GUIDE</div>
            <h2>Follow the colors down</h2>
            <p>Each row is one chord. The highlighted keys show exactly what to press.</p>
          </div>
          <div className="guide-tools">
            <div className="hand-picker" aria-label="Choose playing hand">
              <button type="button" className={hand === 'right' ? 'selected' : ''} onClick={() => setHand('right')}>Right hand</button>
              <button type="button" className={hand === 'left' ? 'selected' : ''} onClick={() => setHand('left')}>Left hand</button>
            </div>
            <span className="sequence-count">{chords.length} {chords.length === 1 ? 'chord' : 'chords'} <i /> {uniqueCount} {uniqueCount === 1 ? 'color' : 'colors'}</span>
          </div>
        </div>

        {chords.length === 0 ? (
          <div className="empty-state"><Music2 size={22} /><h3>Your guide will appear here</h3><p>Add a few chord names above to build your piano map.</p></div>
        ) : (
          <div className="progression-list">
            {items.map((item, index) => {
              if (item.type === 'section') return <div className="progression-section" key={`section-${index}`}><span>{item.title}</span></div>;
              if (item.type === 'separator') return <div className="progression-separator" key={`separator-${index}`} aria-hidden="true" />;
              return (
                <ChordCard
                  key={`${item.chord.source}-${item.chordIndex}`}
                  chord={item.chord}
                  index={item.chordIndex}
                  notes={notesByChord[item.chordIndex] ?? []}
                  color={colorByChord.get(item.chord.id) ?? palette[0]}
                  hand={hand}
                  octaveShift={octaveShifts[item.chordIndex] ?? 0}
                  onShift={(direction) => shiftOctave(item.chordIndex, direction)}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-icon"><Lightbulb size={20} /></div>
        <div>
          <h3>A couple of things to know</h3>
          <p><strong>Matching colors mean matching chords.</strong> Your hand moves to a new position for each row; keep the notes in that chord pressed together.</p>
          <p><strong>Finger numbers are suggestions:</strong> 1 is your thumb and 5 is your pinky. They’re a simple starting point, not a strict rule. Use the octave buttons if a shape feels more comfortable higher or lower.</p>
          <p className="method-note">Chords start in root position near middle C. Use slash chords like C/G to specify a different bass note; other chords are placed as close as possible to the previous shape. Suggested fingerings are basic one-hand starting points.</p>
        </div>
      </section>

      <footer className="site-footer"><span>piano<span className="brand-light">flow</span></span><span>Made for finding your way around the keys.</span></footer>
    </main>
  );
}

export default App;
