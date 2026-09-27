import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ChevronDown, Lightbulb, Minus, Music2, Plus } from 'lucide-react';
import {
  arrangeProgression,
  noteName,
  parseChordList,
  type Chord,
  type ProgressionItem,
} from './chords';

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

function normalizeFileUrl(value: string): string {
  const input = value.trim();
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Use an http or https file URL.');
  if (url.hostname === 'github.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 5 && ['blob', 'raw'].includes(parts[2])) {
      const [owner, repo, , branch, ...filePath] = parts;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath.join('/')}${url.search}`;
    }
  }
  if (url.hostname === 'gist.github.com') url.hostname = 'gist.githubusercontent.com';
  return url.href;
}

function Keyboard({ notes, color }: { notes: number[]; color: ChordColor }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      setContainerWidth((current) => current === width ? current : width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const availableWidth = containerWidth || (typeof window === 'undefined' ? 1200 : Math.max(240, window.innerWidth - 110));
  const trimmedOctaves = availableWidth >= 1040 ? 0 : availableWidth >= 600 ? 1 : 2;
  const visibleKeyCount = 88 - trimmedOctaves * 24;
  const maximumStart = 108 - visibleKeyCount + 1;
  let firstMidi = 21 + trimmedOctaves * 12;
  let lastMidi = firstMidi + visibleKeyCount - 1;
  if (notes.length && (Math.min(...notes) < firstMidi || Math.max(...notes) > lastMidi)) {
    const wantedStart = (Math.min(...notes) + Math.max(...notes) - visibleKeyCount + 1) / 2;
    const octaveOffset = Math.max(0, Math.min((maximumStart - 21) / 12, Math.round((wantedStart - 21) / 12)));
    firstMidi = 21 + octaveOffset * 12;
    lastMidi = firstMidi + visibleKeyCount - 1;
  }
  const whitePitchClasses = new Set([0, 2, 4, 5, 7, 9, 11]);
  const whiteNoteCount = Array.from({ length: lastMidi - firstMidi + 1 }, (_, index) => firstMidi + index)
    .filter((midi) => whitePitchClasses.has(midi % 12)).length;
  const width = Math.max(1, availableWidth);
  const whiteWidth = width / whiteNoteCount;
  const blackWidth = whiteWidth * 0.64;
  const whiteKeys: Array<{ midi: number; x: number }> = [];
  const blackKeys: Array<{ midi: number; x: number }> = [];
  let whiteIndex = 0;
  for (let midi = firstMidi; midi <= lastMidi; midi += 1) {
    if (whitePitchClasses.has(midi % 12)) {
      whiteKeys.push({ midi, x: whiteIndex * whiteWidth });
      whiteIndex += 1;
    } else {
      blackKeys.push({ midi, x: whiteIndex * whiteWidth - blackWidth / 2 });
    }
  }

  const noteLabel = (midi: number) => noteName(midi);
  return (
    <div ref={containerRef} className="keyboard-scroll" role="img" aria-label={`Piano excerpt ${noteLabel(firstMidi)} to ${noteLabel(lastMidi)} with ${notes.map(noteLabel).join(', ')} highlighted`}>
      <svg className="piano-svg" viewBox={`0 0 ${width} 86`}>
        <g>
          {whiteKeys.map(({ midi, x }) => {
            const isActive = notes.includes(midi);
            const pitch = midi % 12;
            const showLabel = isActive || pitch === 0 || midi === firstMidi;
            return (
              <g key={midi}>
                <rect
                  x={x + 0.5} y="1" width={whiteWidth - 1} height="82" rx="2"
                  fill={isActive ? color.pale : '#fff'}
                  stroke={isActive ? color.line : '#d9dfe3'} strokeWidth="1"
                />
                {showLabel && <text x={x + whiteWidth / 2} y="78" textAnchor="middle" className={`key-label ${isActive ? 'key-label-active' : ''}`} fill={isActive ? color.ink : '#89939a'}>{noteLabel(midi)}</text>}
              </g>
            );
          })}
        </g>
        <g>
          {blackKeys.map(({ midi, x }) => {
            const isActive = notes.includes(midi);
            return (
              <g key={midi}>
                <rect
                  x={x} y="1" width={blackWidth} height="46" rx="2.5"
                  fill={isActive ? color.main : '#27323a'}
                  stroke={isActive ? color.ink : '#27323a'} strokeWidth="1"
                />
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
  octaveShift,
  onShift,
}: {
  chord: Chord;
  index: number;
  notes: number[];
  color: ChordColor;
  octaveShift: number;
  onShift: (direction: number) => void;
}) {
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

      <Keyboard notes={notes} color={color} />

    </article>
  );
}

function App() {
  const initial = parseChordList(example);
  const [text, setText] = useState(example);
  const [items, setItems] = useState<ProgressionItem[]>(initial.items);
  const chords = useMemo(() => items.flatMap((item) => item.type === 'chord' ? [item.chord] : []), [items]);
  const [octaveShifts, setOctaveShifts] = useState<number[]>(initial.chords.map(() => 0));
  const [error, setError] = useState('');
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  const [urlEntryOpen, setUrlEntryOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notesByChord = useMemo(() => arrangeProgression(chords, octaveShifts), [chords, octaveShifts]);
  const colorByChord = useMemo(() => {
    const ids = [...new Set(chords.map((chord) => chord.id))];
    return new Map(ids.map((id, index) => [id, colorAt(index)]));
  }, [chords]);
  const uniqueCount = new Set(chords.map((chord) => chord.id)).size;

  function applyChordText(value: string, warnSkipped = true): boolean {
    const cleanValue = value.replace(/^\uFEFF/, '');
    setText(cleanValue);
    if (!cleanValue.trim()) {
      setItems([]);
      setOctaveShifts([]);
      setError('');
      return true;
    }
    const result = parseChordList(cleanValue);
    if (result.chords.length === 0) {
      setError(`I couldn't find any chords. Try symbols like C, Am, F#m7, or Bb.`);
      return false;
    }
    setItems(result.items);
    setOctaveShifts(result.chords.map(() => 0));
    setError(warnSkipped && result.invalid.length ? `Skipped unrecognized ${result.invalid.length === 1 ? 'chord' : 'chords'}: ${result.invalid.join(', ')}` : '');
    return true;
  }

  function applyProgression(event: FormEvent) {
    event.preventDefault();
    applyChordText(text);
  }

  function loadExample() {
    applyChordText(example);
    setLoadMenuOpen(false);
    setUrlEntryOpen(false);
  }

  async function loadLocalFile(file: File) {
    setIsLoading(true);
    setError('');
    try {
      const contents = await file.text();
      if (contents.length > 1_000_000) throw new Error('Please use a chord file smaller than 1 MB.');
      if (applyChordText(contents, false)) {
        setLoadMenuOpen(false);
        setUrlEntryOpen(false);
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not read that file.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFromUrl() {
    if (!urlInput.trim()) {
      setError('Enter a file URL first.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(normalizeFileUrl(urlInput));
      if (!response.ok) throw new Error(`The file request failed (${response.status}).`);
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/html')) throw new Error('That link returned a web page. Use a GitHub file link or its raw URL.');
      const contents = await response.text();
      if (contents.length > 1_000_000) throw new Error('Please use a chord file smaller than 1 MB.');
      if (applyChordText(contents, false)) {
        setLoadMenuOpen(false);
        setUrlEntryOpen(false);
        setUrlInput('');
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not load that URL.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileDrop(event: React.DragEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadLocalFile(file);
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

      <section className="progression-input-section" id="top">
        <form
          className={`input-panel ${isDragging ? 'dragging' : ''}`}
          onSubmit={applyProgression}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={(event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && event.currentTarget.contains(next)) return;
            setIsDragging(false);
          }}
          onDrop={handleFileDrop}
        >
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
            <span className="input-hint">{isDragging ? 'Drop the chord text file to load it' : 'Use [Verse] for a label; new lines add separators · drop a chord file to load it'}</span>
            <div className="input-actions">
              <div className="load-menu-wrap">
                <button className="load-button" type="button" aria-expanded={loadMenuOpen} onClick={() => setLoadMenuOpen((open) => !open)}>
                  Load <ChevronDown size={14} />
                </button>
                {loadMenuOpen && <div className="load-popover">
                  <button className="load-option" type="button" onClick={loadExample}>Example progression</button>
                  <div className="url-load-option">
                    <button className="load-option" type="button" onClick={() => setUrlEntryOpen((open) => !open)}>From a URL…</button>
                    {urlEntryOpen && <div className="url-load-form">
                      <label htmlFor="source-url">Chord file URL</label>
                      <input
                        id="source-url"
                        type="text"
                        value={urlInput}
                        onChange={(event) => setUrlInput(event.target.value)}
                        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void loadFromUrl(); } }}
                        placeholder="github.com/user/repo/blob/main/song.txt"
                      />
                      <button className="load-url-button" type="button" onClick={() => void loadFromUrl()} disabled={isLoading}>
                        {isLoading ? 'Loading…' : 'Load file'}
                      </button>
                    </div>}
                  </div>
                  <button className="load-option" type="button" onClick={() => fileInputRef.current?.click()}>Local file…</button>
                  <input
                    ref={fileInputRef}
                    className="visually-hidden"
                    type="file"
                    accept=".txt,.md,.pro,.cho,.chordpro,.csv,text/plain"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void loadLocalFile(file);
                      event.target.value = '';
                    }}
                  />
                </div>}
              </div>
              <button className="show-button" type="submit">Show my chords <span aria-hidden="true">→</span></button>
            </div>
          </div>
          {error && <p className={`form-message ${error.startsWith('Skipped') ? 'warning' : ''}`} role="status">{error}</p>}
        </form>
      </section>

      <section className="guide-section" aria-label="Your piano chord guide">
        <div className="guide-heading">
          <div className="guide-tools">
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
          <p className="method-note">Chords start in root position near middle C. Use slash chords like C/G to specify a different bass note; other chords are placed as close as possible to the previous shape.</p>
        </div>
      </section>

      <footer className="site-footer"><span>piano<span className="brand-light">flow</span></span><span>Made for finding your way around the keys.</span></footer>
    </main>
  );
}

export default App;
