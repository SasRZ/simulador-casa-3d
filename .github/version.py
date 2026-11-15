# Añade ?v=<commit> a CSS y módulos JS al publicar, para que el navegador nunca mezcle
# archivos de versiones distintas (GitHub Pages los cachea 10 minutos).
import json, os, re, sys
v = (sys.argv[1] if len(sys.argv) > 1 else 'dev')[:8]
p = 'index.html'
s = open(p, encoding='utf-8').read()
s = s.replace('href="css/style.css"', f'href="css/style.css?v={v}"')
s = s.replace('src="js/main.js"', f'src="js/main.js?v={v}"')
m = re.search(r'<script type="importmap">(.*?)</script>', s, re.S)
imap = json.loads(m.group(1))
for f in sorted(os.listdir('js')):
    if f.endswith('.js'):
        imap['imports'][f'./js/{f}'] = f'./js/{f}?v={v}'
s = s[:m.start(1)] + '\n' + json.dumps(imap, indent=2) + '\n' + s[m.end(1):]
open(p, 'w', encoding='utf-8').write(s)
print('versión', v)
