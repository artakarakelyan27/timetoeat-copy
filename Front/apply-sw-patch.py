#!/usr/bin/env python3
"""
Патч для src/sw.js — расширяет denylist в NavigationRoute SEO-путями,
чтобы Service Worker не перехватывал навигацию на Nuxt-страницы.

Запуск (на сервере):
    cd /var/www/time-to-eat-copy/Front
    python3 spa-patches/apply-sw-patch.py

Идемпотентен: если патч уже применён, ничего не делает.
"""

import re
import sys
from pathlib import Path

SW_PATH = Path("src/sw.js")
if not SW_PATH.exists():
    sys.exit(f"ERROR: {SW_PATH} не найден")

text = SW_PATH.read_text(encoding="utf-8")

if "menyu-na-nedelyu" in text:
    print("✓ SW уже патчен — пропускаем")
    sys.exit(0)

m = re.search(r"denylist:\s*\[(.*?)\]", text, re.S)
if not m:
    sys.exit("ERROR: блок denylist не найден в src/sw.js")

new_block = """denylist: [
      /^\\/api\\//,
      /^\\/share-target/,
      /^\\/auth\\/callback/,
      /^\\/_/,
      /\\.[a-z0-9]+$/i,
      // ↓ SEO-зона на Nuxt — навигацию пропускаем в сеть
      /^\\/$/,
      /^\\/o-proekte(\\/|$)/,
      /^\\/recepty(\\/|$)/,
      /^\\/iz(\\/|$)/,
      /^\\/iz-ostatkov(\\/|$)/,
      /^\\/chto-prigotovit(\\/|$)/,
      /^\\/menyu-na-nedelyu(\\/|$)/,
      /^\\/spravochnik(\\/|$)/,
      /^\\/kak-gotovit(\\/|$)/,
      /^\\/sezon(\\/|$)/,
      /^\\/gotovim-vprok(\\/|$)/,
      /^\\/blog(\\/|$)/,
      /^\\/og\\//,
      /^\\/sitemap\\.xml$/,
      /^\\/robots\\.txt$/,
    ]"""

# Backup
backup = Path("src/sw.js.before-seo-patch")
if not backup.exists():
    backup.write_text(text, encoding="utf-8")
    print(f"✓ Бэкап → {backup}")

new_text = text[: m.start()] + new_block + text[m.end():]
SW_PATH.write_text(new_text, encoding="utf-8")
print("✓ denylist обновлён в src/sw.js")
