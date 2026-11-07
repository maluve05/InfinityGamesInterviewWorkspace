"""Measure, trim and normalise generated audio takes, then pick one per event.

Usage: python tools/audio-prep.py <takes_dir> <out_dir> <report.md>
Takes are named <event>-a.mp3, <event>-b.mp3. For each take: decode to mono 44.1 kHz,
find the onset (first sample above -40 dBFS), the RMS loudness of the sounding part and
the peak. Reject takes that are near-silent. Pick the take with the earliest onset
(ties: louder sounding part). Trim to the onset minus 5 ms, apply a gain to reach the
event's target RMS, cap peaks at -1 dBFS, fade the last 30 ms, encode MP3 96 kbps mono.
Game-independent: works for any <event>-<take>.mp3 set.
"""
import subprocess, sys, glob, os, math
import numpy as np

SR = 44100
TARGET = {'music-run': -20, 'surf-loop': -28, 'collect': -16, 'lane': -24, 'land': -20, 'ui': -20}
DEFAULT = -17   # RMS dBFS for the sounding part of an SFX

def decode(p):
    raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def db(x): return 20 * math.log10(max(x, 1e-9))

def measure(x):
    th = 10 ** (-40 / 20)
    idx = np.nonzero(np.abs(x) > th)[0]
    if len(idx) == 0: return None
    on = idx[0]; end = idx[-1]
    body = x[on:end + 1]
    return {'onset_ms': on / SR * 1000, 'rms': db(float(np.sqrt(np.mean(body ** 2)))), 'peak': db(float(np.abs(x).max())), 'len': (end - on) / SR, 'on': on}

def main(src, out, report):
    events = sorted({os.path.basename(f).rsplit('-', 1)[0] for f in glob.glob(f'{src}/*-?.mp3')})
    lines = ['# Audio takes — measured choice', '', '| Event | Take | onset ms | sounding s | RMS dB | peak dB | chosen | why |', '| --- | --- | --- | --- | --- | --- | --- | --- |']
    for ev in events:
        takes = []
        for f in sorted(glob.glob(f'{src}/{ev}-?.mp3')):
            x = decode(f); m = measure(x)
            takes.append((f, x, m))
        ok = [t for t in takes if t[2] and t[2]['rms'] > -45 and t[2]['len'] > 0.05]
        loop = ev in ('music-run', 'surf-loop')
        best = min(ok, key=lambda t: (round(t[2]['onset_ms'] / 15), -t[2]['rms'])) if ok else None
        for f, x, m in takes:
            chosen = best is not None and f == best[0]
            why = 'near-silent' if not m or m['rms'] <= -45 else ('earliest onset' if chosen else 'later onset / quieter')
            if m: lines.append(f"| {ev} | {os.path.basename(f)} | {m['onset_ms']:.0f} | {m['len']:.2f} | {m['rms']:.1f} | {m['peak']:.1f} | {'**yes**' if chosen else ''} | {why} |")
        if not best: continue
        f, x, m = best
        y = x if loop else x[max(0, m['on'] - int(0.005 * SR)):]
        gain = 10 ** ((TARGET.get(ev, DEFAULT) - m['rms']) / 20)
        y = y * gain
        pk = np.abs(y).max(); cap = 10 ** (-1 / 20)
        if pk > cap: y = y * (cap / pk)
        if not loop:
            n = min(len(y), int(0.03 * SR)); y[-n:] *= np.linspace(1, 0, n)
        tmp = f'{out}/{ev}.f32'
        y.astype(np.float32).tofile(tmp)
        subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', tmp, '-b:a', '128k' if loop else '96k', f'{out}/{ev}.mp3'])
        os.remove(tmp)
    open(report, 'w', encoding='utf8').write('\n'.join(lines) + '\n')
    print('\n'.join(lines))

if __name__ == '__main__':
    main(*sys.argv[1:4])
