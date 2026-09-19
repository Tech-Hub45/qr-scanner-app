# Litescan

A browser-based QR scanner, barcode generator, OCR tool, and document utility app.

## Project structure

```text
.
├── assets/
│   ├── icon-96.png
│   ├── icon-192.png
│   ├── icon-512.png
│   └── images/
├── css/
│   ├── images/
│   └── styles/
│       └── main.css
├── js/
│   └── app.js
├── pages/
│   ├── about.html
│   ├── privacy.html
│   └── terms.html
├── pwa/
│   ├── manifest.json
│   └── sw.js
├── tools/
│   └── (future tool modules live here)
├── index.html
├── README.md
└── .gitignore
```

## Notes

- Static assets are separated from logic and styles.
- Page files are stored in the `pages/` folder for maintainability.
- The app is fully client-side and suitable for deployment to static hosting.
