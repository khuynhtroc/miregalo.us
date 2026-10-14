import json
from bs4 import BeautifulSoup

with open('data/db.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for p in data.get('posts', []):
    if p.get('slug') == 'regalos-halloween-party-names':
        print('Title:', p.get('title'))
        print('SEO Title:', p.get('seo_title'))
        print('SEO Desc:', p.get('seo_description'))
        print('Excerpt:', p.get('excerpt'))
        print('Keywords:', p.get('keywords'))
        
        soup = BeautifulSoup(p.get('content_html', ''), 'html.parser')
        text = soup.get_text(' ', strip=True).lower()
        words = text.split()
        print('Total words:', len(words))
        
        target_kws = [
            'nombres para fiestas de halloween',
            'nombres para fiesta de halloween',
            'fiesta de halloween',
            'fiestas de halloween',
            'terroríficos',
            'juego de palabras',
            'la noche de las pesadillas',
            'el baile de los fantasmas',
            'la casa de los horrores',
            'el aquelarre',
            'halloween fest',
            'noche de brujas y otras hierbas',
            'spooky & boozy',
            'the monster mash',
            'whatsapp'
        ]
        print('\nKeyword Occurrences:')
        for kw in target_kws:
            count = text.count(kw.lower())
            print(f' - "{kw}": {count}')
        break
