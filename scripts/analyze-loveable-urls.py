import re
import json

with open('data/db.json', 'r', encoding='utf-8') as f:
    text = f.read()

matches = set(re.findall(r'https?://[^\s"\'<>]*loveable[^\s"\'<>]*', text))
print(f'Total unique loveable URLs found in db.json: {len(matches)}')
domains = {}
for m in matches:
    dom = m.split('/')[2] if len(m.split('/')) > 2 else ''
    domains[dom] = domains.get(dom, 0) + 1

print('Domains found:')
for d, count in domains.items():
    print(f'  {d}: {count} unique URLs')

print('\nSample 15 URLs:')
for s in list(matches)[:15]:
    print(' ', s)
