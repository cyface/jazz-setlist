"""Extract jazz tunes + band setlists from a PolyNome .pln backup into raw.json.

usage: python3 -I extract.py <backup.pln> <out raw.json>
"""
import sys, re, json, unicodedata, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # -I drops the script dir from sys.path
from unarchive import load

blobs = load(sys.argv[1])
PRESETS = blobs[0]['ArchivePresets']
SETLISTS = blobs[1]['ArchiveSetlist']

def nn(v): return None if isinstance(v, dict) and v.get('$class') == 'NSNull' else v

# Canonical tune titles. A PolyNome name maps to the title whose normalized form is
# the longest prefix of the normalized name (or an alias). The rest of the name is cue text.
CANON = """Afro Blue|Afternoon in Paris|All Blues|All of Me|All the Things You Are|Always|
Always Something There to Remind Me|Angel Eyes|April in Paris|Autumn in New York|Autumn Leaves|
A Nightingale Sang in Berkeley Square|Bags’ Groove|Bernie’s Tune|Besame Mucho|Black Orpheus|Blue Bossa|
Blue Jar|Blue Monk|Blue Skies|Blues for Willarene|But Beautiful|Caldonia|Cantaloupe Island|Caravan|
’Cause We’ve Ended as Lovers|Chameleon|Chattanooga Choo Choo|Cherry Pink and Apple Blossom White|
Chitlins con Carne|Cold Duck Time|Comfort|Corner Pocket|Daahoud|Desafinado|Detective Acosta|
Don’t Get Around Much Anymore|Dream a Little Dream|Easy Mode|Fly Me to the Moon|Girl from Ipanema|
Green Onions|How High the Moon|How Insensitive|Human Nature|I Can’t Get Started with You|I Hardly Know Today|
I Love You|I Remember Clifford|I’m an Old Cowhand|I’m in the Mood for Love|In a Sentimental Mood|
Isn’t She Lovely|It Don’t Mean a Thing|Jeannine|Just the Two of Us|Key to the Highway|La Vie en Rose|
Let’s Fall in Love|Like Someone in Love|Look to the Sky|Lover Man|Lulu’s Back in Town|Lullaby of Birdland|
Mack the Knife|Mercy, Mercy, Mercy|Midnight Blue|Minority|Misty|Moanin’|Mona Lisa|Moondance|Mr. PC|
My Favorite Things|My Funny Valentine|My One and Only Love|Night and Day|On the Sunny Side of the Street|
Oye Como Va|Panadamademic|Pennies from Heaven|Perhaps, Perhaps, Perhaps|Quiet Nights of Quiet Stars|
Red Clay|Reflections|Samba de Orfeu|Sandu|See How It Goes|Shadow of Your Smile|She Said She Said|
Sing, Sing, Sing|Skylark|So What|Softly, as in a Morning Sunrise|Someday My Prince Will Come|Somewhere|
Someone to Watch Over Me|Song for My Father|St. James Infirmary|St. Thomas|Stolen Moments|
Stompin’ at the Savoy|Stompin’ at the Savoy (double-time out)|Sugar|Suicide Is Painless|Summertime|
Sunny|Sunrose|Sweet Georgia Brown|Take Five|Take the A Train|Tangerine|Tangerine (intro)|Tenor Madness|
The Folks Who Live on the Hill|The Nearness of You|There Is No Greater Love|Watermelon Man|Wave|
When Lights Are Low|When Sunny Gets Blue|When You Wish Upon a Star|Winter Wonderland|Work Song|
Yardbird Suite"""
CANON = [t.strip() for t in CANON.replace('\n', '').split('|')]

def norm(s):
    s = unicodedata.normalize('NFKD', s).lower()
    return re.sub(r'[^a-z0-9]', '', s)

ALIASES = {  # normalized PolyNome prefix -> canonical title
    'take5': 'Take Five', 'quietnightof': 'Quiet Nights of Quiet Stars', 'reflection': 'Reflections',
    'stjames': 'St. James Infirmary', 'anightingale': 'A Nightingale Sang in Berkeley Square',
    'softlyas': 'Softly, as in a Morning Sunrise', 'singsing': 'Sing, Sing, Sing', 'thereisno': 'There Is No Greater Love',
    'icantgetstarted': 'I Can’t Get Started with You',
}
# PolyNome presets that are not tunes (exercise copies / tempo experiments) although a prefix matches.
SKIP = {'Reflection 1', 'Reflection1', 'Reflection Latin', 'See how it goes solo'}
TUNE_KEYS = {norm(t): t for t in CANON} | ALIASES

def canon(name):
    """(canonical title, cue text after the title) or (None, None)."""
    if name in SKIP: return None, None
    n = norm(name)
    key = max((k for k in TUNE_KEYS if n.startswith(k)), key=len, default=None)
    if not key: return None, None
    cut = next(i for i in range(len(name) + 1) if len(norm(name[:i])) >= len(key))
    return TUNE_KEYS[key], name[cut:]

BREAK = re.compile(r'^[\W_]*(set\s*)?break[\W_]*$|^set \d+$', re.I)
BAND = re.compile(r'Malpractice|Matt\d|Jazz Spring|Blind Squirrels')

def occurrence(preset, cue, item=None, when=None, setlist=None):
    d = preset['kArchivePresetDict']; m = preset['kArchiveMet0Dict']
    sg = item or {}
    tempo = sg['overrideTempo'] if sg.get('overrideTempoEnabled') == 1 else d['tempo']
    return {
        'name': d['name'], 'cue': cue, 'tempo': tempo, 'beats': m['timeSignatureTop'],
        'notes': [n for n in (nn(d['notes']), nn(sg.get('notes'))) if n and n.strip()],
        'when': when or d['dateModified']['$date'], 'setlist': setlist,
    }

tunes = {}
UNMAPPED = []
def add(title, occ, standalone):
    t = tunes.setdefault(title, {'standalone': [], 'setlist': []})
    t['standalone' if standalone else 'setlist'].append(occ)

for p in PRESETS:
    title, cue = canon(p['kArchivePresetDict']['name'])
    if title: add(title, occurrence(p, cue), True)

setlists = []
for s in SETLISTS:
    sd = s['kArchiveSetlistDict']
    if not BAND.search(sd['name']): continue
    items = []
    for it in s['kArchiveArrayOfSetlistSongs'] or []:
        p = it['kArchiveSetlistSongPresetDict']; name = p['kArchivePresetDict']['name']
        if BREAK.match(name.strip()):
            items.append({'kind': 'break'}); continue
        title, cue = canon(name)
        if not title: UNMAPPED.append((name, sd['name'])); continue
        add(title, occurrence(p, cue, it['kArchiveSetlistSongDict'], sd['dateModified']['$date'], sd['name']), False)
        items.append({'kind': 'tune', 'title': title})
    setlists.append({'name': sd['name'], 'created': sd['dateCreatedSectionTitle'], 'notes': nn(sd['notes']) or None, 'items': items})

json.dump({'tunes': tunes, 'setlists': setlists}, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(tunes), 'tunes;', len(setlists), 'setlists; canon with no occurrences:', [t for t in CANON if t not in tunes])
for n, s in UNMAPPED: print('UNMAPPED', repr(n), 'in', s)
