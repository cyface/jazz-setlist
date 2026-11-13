"""Decode a PolyNome .pln backup (an NSKeyedArchiver plist of nested archives) into plain Python values."""
import plistlib

def unarchive(data):
    p = plistlib.loads(data)
    objs = p['$objects']
    memo = {}
    def dec(ref):
        if isinstance(ref, plistlib.UID):
            i = ref.data
            if i in memo: return memo[i]
            o = objs[i]
            if o == '$null': return None
            if isinstance(o, dict) and '$class' in o:
                cls = objs[o['$class'].data]['$classname']
                if 'NS.keys' in o:
                    r = {}; memo[i] = r
                    for k, v in zip(o['NS.keys'], o['NS.objects']): r[dec(k)] = dec(v)
                    return r
                if 'NS.objects' in o:
                    r = []; memo[i] = r
                    r.extend(dec(v) for v in o['NS.objects']); return r
                if 'NS.string' in o: return o['NS.string']
                if 'NS.time' in o: return {'$date': o['NS.time']}
                if 'NS.bytes' in o: return o['NS.bytes']
                r = {'$class': cls}; memo[i] = r
                for k, v in o.items():
                    if k != '$class': r[k] = dec(v)
                return r
            memo[i] = dec(o) if not isinstance(o,(str,int,float,bytes)) else o
            return memo[i]
        if isinstance(ref, list): return [dec(x) for x in ref]
        if isinstance(ref, dict): return {k: dec(v) for k,v in ref.items()}
        return ref
    return dec(p['$top']['root'])

def load(src):
    """The backup's nested archives, decoded: [0] ArchivePresets, [1] ArchiveSetlist, then practice logs etc."""
    top = plistlib.load(open(src,'rb'))
    objs = top['$objects']
    blobs = [objs[u.data] for u in objs[4]['NS.objects']]
    return [unarchive(b) for b in blobs]
