"""raw.json -> import.json (arrangements + setlists in the app's input shape).

usage: python3 -I transform.py raw.json import.json ["active setlist name"]

Every setlist except the active one (default: the last one in the backup) is marked archived.
"""
import sys, re, json

raw = json.load(open(sys.argv[1]))

# Emoji in PolyNome titles, translated in cue text. Given by the user: 🥢 sticks, 🖌 brushes, 🎤 drum solo, 🐟 bass.
# The rest are inferred from how titles changed over time (e.g. "TRADING" became 💹).
# Order matters: multi-character sequences first. Unknown emoji are kept as-is.
EMOJI = [('🚫🥁', 'no drums'), ('💹8️⃣', 'trading 8s'), ('💹4️⃣', 'trading 4s'), ('💹8', 'trading 8s'),
         ('💹4', 'trading 4s'), ('1️⃣6️⃣', '16ths'), ('6️⃣/8️⃣', '6/8'), ('8️⃣', '8ths'), ('3️⃣', 'count 3'),
         ('🥢', 'sticks'), ('🖌', 'brushes'), ('🎤', 'drum solo'), ('💹', 'trading'), ('🇧🇷', 'bossa'),
         ('📏', 'straight'), ('🛑', 'stop time'), ('🔀', 'shuffle'), ('🎹', 'keys'), ('🐟', 'bass')]
# Feel: 🇧🇷 or a title in BOSSA -> bossa; otherwise the word "latin" or a title in LATIN -> latin;
# otherwise 📏 or a title in STRAIGHT -> straight; otherwise swing.
BOSSA = {'Black Orpheus', 'Blue Bossa', 'Girl from Ipanema', 'How Insensitive', 'Quiet Nights of Quiet Stars'}
LATIN = {'Chitlins con Carne', 'Song for My Father'}
STRAIGHT = {'Afro Blue', 'Besame Mucho', 'Chameleon', 'Cherry Pink and Apple Blossom White', 'Cold Duck Time',
            'Green Onions', 'Human Nature', 'Just the Two of Us', 'Look to the Sky',
            'Mercy, Mercy, Mercy', 'Oye Como Va', 'Red Clay', 'Samba de Orfeu', 'She Said She Said',
            'St. Thomas', 'Watermelon Man'}
S = lambda i: {'type': 'solo', 'instrument': i}
T = lambda bars, *i: {'type': 'trade', 'instruments': list(i), 'bars': bars}
OVER = lambda i: {'type': 'over_head', 'instrument': i}
BD4 = T(4, 'bass', 'drums')
# From PolyNome notes (letters: G guitar, P piano, S sax, T trumpet, B bass, D drums).
# Trading with no partner named = bass (the band's habit).
SOLOS = {
    'Lullaby of Birdland': [S('sax'), S('piano'), S('trumpet')],
    'Minority': [S('drums')],
    'But Beautiful': [S('guitar'), S('piano')],
    'Blue Jar': [S('bass'), S('drums')],
    'Shadow of Your Smile': [S('guitar'), S('piano')],
    'Cherry Pink and Apple Blossom White': [S('trumpet'), S('sax')],
    'I Love You': [S('sax'), S('piano'), S('drums')],
    'Mercy, Mercy, Mercy': [S('trumpet'), S('sax'), S('guitar'), S('piano'), S('bass')],
    'Sandu': [S('trumpet'), S('sax'), S('guitar'), S('piano'), S('bass'), BD4],
    'Mr. PC': [S('drums')],
    'It Don’t Mean a Thing': [S('piano'), BD4],
    'I Remember Clifford': [S('guitar'), S('piano'), S('sax'), S('bass')],
    'Take the A Train': [BD4],
    'Afro Blue': [S('drums')],
    'Softly, as in a Morning Sunrise': [S('guitar'), S('piano'), T(8, 'bass', 'drums')],
    'My One and Only Love': [S('sax'), S('bass')],
    'Afternoon in Paris': [S('guitar'), S('piano')],
    'See How It Goes': [S('sax'), S('drums')],
    'Lover Man': [S('sax'), S('piano')],
    'Sunrose': [BD4],
    'Panadamademic': [S('piano'), S('sax'), S('guitar'), T(8, 'bass', 'piano', 'guitar')],
    'Jeannine': [S('drums')],
    'St. Thomas': [S('guitar'), S('drums')],
    'Pennies from Heaven': [S('piano'), BD4],
    'Tenor Madness': [S('piano'), S('drums')],
    'Stolen Moments': [BD4],
}
LATER = {
    'Like Someone in Love': 'After the piano intro',
    'Take the A Train': 'After the piano intro',
    'Blue Jar': 'After the bass intro',
}
DROP_CUES = {'sticks', 'brushes', 'solo', 'drum solo', 'trading', 'straight', 'bossa', 'latin', 'sticks sticks', '/'}

def translate(cue):
    c = cue.replace('️', '️')  # keep keycaps intact for the table
    for e, word in EMOJI: c = c.replace(e, f' , {word} , ')
    c = c.replace('️', '')
    return c

def cue_parts(cue):
    out = []
    for part in re.split(r'\s*,\s*|\s+[-—–]\s*|^[-—–]\s*|\s*;\s*', translate(cue)):
        part = re.sub(r'\s+', ' ', part.strip(' -–—,;:')).strip()
        if part: out.append(part)
    return out

def latest(occs): return sorted(occs, key=lambda o: -o['when'])

def implement(occs):
    for o in latest(occs):
        if '🖌' in o['name'] or 'BRUSHES' in o['name']: return 'brushes'
        if '🥢' in o['name'] or 'STICKS' in o['name']: return 'sticks'
    text = ' '.join(n for o in occs for n in o['notes']).lower()
    if 'brushes' in text: return 'brushes'
    if 'sticks' in text: return 'sticks'
    return 'brushes' if 'ballad' in text or any('BALLAD' in o['name'] for o in occs) else 'sticks'

def solo_order(title, occs):
    order = [dict(e) for e in SOLOS.get(title, [])]
    names = [o['name'] for o in latest(occs)]
    trade = next((n for n in names if '💹' in n), None)
    if trade:
        bars = 8 if re.search(r'💹\s*8', trade) else 4 if re.search(r'💹\s*4', trade) else None
        trades = [e for e in order if e['type'] == 'trade' and 'drums' in e['instruments']]
        if not trades: order.append(T(bars or 4, 'bass', 'drums'))
        elif bars: trades[-1]['bars'] = bars
    solo = next((n for n in names if '🎤' in n), None)
    if solo and not any(e.get('instrument') == 'drums' for e in order):
        if re.search(r'🎤\s*(head )?out', solo, re.I): order.append(OVER('drums'))
        else:
            if any('🎤/🎹' in n for n in names): order.append(S('piano'))
            if any('🎤/🐟' in n for n in names): order.append(S('bass'))
            order.append(S('drums'))
    return order

def feel(title, occs):
    name = latest(occs)[0]['name']  # the tune's newest preset name
    if title in BOSSA or '🇧🇷' in name: return 'bossa'
    if title in LATIN or re.search(r'\blatin\b', name, re.I): return 'latin'
    if title in STRAIGHT or '📏' in name: return 'straight'
    return 'swing'

def drums_entry(title, occs):
    if title in LATER: return 'later', LATER[title]
    if any('🚫🥁' in o['name'] for o in occs): return 'later', 'No drums on the intro'
    return 'top', None

out = []
for title, t in sorted(raw['tunes'].items(), key=lambda kv: kv[0].lstrip('’').lower()):
    occs = t['standalone'] + t['setlist']
    base = max(t['standalone'] or t['setlist'], key=lambda o: o['when'])
    notes, seen = [], set()
    for o in sorted(occs, key=lambda o: o['when']):
        for n in o['notes']:
            k = n.strip().lower()
            if k not in seen: seen.add(k); notes.append(n.strip())
    cues, cseen = [], set()
    for o in sorted(occs, key=lambda o: o['when']):
        for part in cue_parts(o['cue']):
            k = part.lower()
            if k not in cseen and k not in DROP_CUES: cseen.add(k); cues.append(part)
    if cues: notes.append('PolyNome cues: ' + '; '.join(cues))
    tempos = sorted({o['tempo'] for o in occs})
    if len(tempos) > 1: notes.append('PolyNome tempos used: ' + ', '.join(map(str, tempos)))
    beats = base['beats'] if isinstance(base['beats'], int) else 4
    if title in ('All Blues', 'Afro Blue'): beats = 6  # "Count 6!!" / "Afro Blue 6/8"
    beat_unit = 8 if beats in (6, 12) else 4  # PolyNome only stores beats; 6 and 12 are compound (6/8, 12/8) here
    entry, entry_note = drums_entry(title, occs)
    out.append({
        'title': title, 'composer': None, 'musicalKey': None,
        'tempo': max(20, min(400, base['tempo'])), 'beatsPerBar': beats, 'beatUnit': beat_unit,
        'feel': feel(title, occs),
        'drumImplement': implement(occs),
        'drumsEntry': entry, 'drumsEntryNote': entry_note,
        'soloOrder': solo_order(title, occs),
        'notes': '\n'.join(notes) or None,
    })

# Setlists: merge "Malpractice 11/21 - Set 1/2"; show dates from the names (year from creation if missing).
sets = []
for s in raw['setlists']:
    name = re.sub(r' - Set \d$', '', s['name'])
    if sets and sets[-1]['name'] == name:
        sets[-1]['items'] += [{'kind': 'break'}] + s['items']; continue
    year = int(s['created'].split()[-1]); date = None
    m = re.search(r'(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$', name)
    if m and not (m.group(3) is None and name.endswith('11/21')):  # 11/21 = November 2021, no day
        y = int(m.group(3)) if m.group(3) else year
        y = y + 2000 if y < 100 else y
        date = f'{y:04d}-{int(m.group(1)):02d}-{int(m.group(2)):02d}'
    sets.append({'name': name, 'venue': None, 'showDate': date, 'notes': s['notes'], 'items': s['items']})

active = sys.argv[3] if len(sys.argv) > 3 else sets[-1]['name']
if active not in {s['name'] for s in sets}: sys.exit(f'No setlist named {active!r}')
for s in sets: s['archived'] = s['name'] != active

json.dump({'arrangements': out, 'setlists': sets}, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)

def describe(order):
    return ', '.join(e['instrument'] + (' (over head)' if e['type'] == 'over_head' else '') if e['type'] != 'trade'
                     else '⇄'.join(e['instruments']) + f" {e['bars']}s" for e in order)
for a in out:
    print(f"{a['title'][:34]:34} {a['tempo']:>3} {a['beatsPerBar']}/{a['beatUnit']} {a['feel'][:5]:5} {a['drumImplement'][:5]:5} "
          f"{'LATER' if a['drumsEntry'] == 'later' else '':5} {describe(a['soloOrder'])}")
print()
for s in sets:
    tunes = sum(i['kind'] == 'tune' for i in s['items'])
    print(f"{s['name']:28} {s['showDate'] or '-':10} {tunes} tunes, {len(s['items']) - tunes} breaks")
