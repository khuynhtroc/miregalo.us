import json

with open('data/db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

posts = db.get('posts', [])
print(f'Total posts: {len(posts)}')

field_counts = {}
for p in posts:
    for k, v in p.items():
        if isinstance(v, str) and 'loveable' in v.lower():
            field_counts[k] = field_counts.get(k, 0) + 1
        elif isinstance(v, (list, dict)):
            v_str = json.dumps(v)
            if 'loveable' in v_str.lower():
                field_counts[f'{k} (nested)'] = field_counts.get(f'{k} (nested)', 0) + 1

print('Field counts with loveable in db.json posts:')
for k, count in sorted(field_counts.items(), key=lambda x: -x[1]):
    print(f'  {k}: {count}')
