import json

with open('data/db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

for p in db['posts']:
    for fld in ['id', 'slug', 'hero_alt', 'meta_description']:
        val = str(p.get(fld, ''))
        if 'loveable' in val.lower():
            print(f"[{fld}] in post {p['slug']}: {val}")
