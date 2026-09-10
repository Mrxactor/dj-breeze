# DJ Breeze — GitHub Pages Starter

Detta paket är byggt för att köras som en statisk GitHub Pages-sajt utan egen backend.

## Struktur

- `index.html` — den publika DJ Breeze-sidan
- `assets/images/` — bilder och flyers
- `assets/video/hero.mp4` — Hero-video
- `assets/audio/website-mix.mp3` — website soundtrack
- `content/site.json` — Hero + Site Sound-inställningar
- `content/contacts.json` — bokningskontakter
- `content/gigs.json` — kommande gigs
- `content/videos.json` — video library
- `admin/` — enkel GitHub-baserad adminportal
- `assets/epk/` — framtida EPK/pressmaterial

## Publicera gratis på GitHub Pages

1. Skapa ett **publikt** repo på GitHub, t.ex. `dj-breeze`.
2. Ladda upp **innehållet i denna mapp** till repots `main` branch.
3. Öppna GitHub: **Settings → Pages**.
4. Under Build and deployment välj **Deploy from a branch**.
5. Välj branch **main** och folder **/(root)**.
6. Spara.
7. Efter en kort stund blir sidan tillgänglig på:
   `https://DITT-GITHUB-NAMN.github.io/dj-breeze/`

## Admin

Öppna:
`https://DITT-GITHUB-NAMN.github.io/dj-breeze/admin/`

Adminpanelen upptäcker automatiskt GitHub-repot från Pages-adressen och länkar till rätt GitHub-editor.

Arbetsflöde:
1. Klicka t.ex. **Redigera Hero**
2. GitHub öppnar `content/site.json`
3. Ändra
4. Klicka **Commit changes**
5. GitHub Pages publicerar ändringen

## Viktigt

- `booking@example.com` är en placeholder. Ändra i `content/contacts.json`.
- Webbläsare kan blockera automatisk uppspelning av ljud tills besökaren interagerar med sidan.
- Hero-video och Site Sound är separata ljudsystem.
- För stora videobibliotek bör video senare ligga på extern media/CDN i stället för direkt i GitHub-repot.
