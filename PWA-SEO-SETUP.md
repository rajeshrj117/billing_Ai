# ScanBill AI – PWA, Camera & SEO setup

## What was added
- Installable Progressive Web App manifest, service worker and 192/512 app icons.
- PWA launch target is `/scan`, so opening the installed app starts on the bill scanner.
- The scanner requests the rear camera automatically when launched in standalone/PWA mode. The user must grant camera permission.
- Install button with browser install prompt support and iOS Add to Home Screen instructions.
- Open Graph/Twitter metadata and a 1200×630 share preview image for handwritten bill scanning.
- App-specific SEO keywords, robots.txt and sitemap.xml routes.

## Required deployment configuration
Set `NEXT_PUBLIC_SITE_URL` to the actual production URL, for example `https://your-real-domain.com` (do not leave the example value). Redeploy after setting it. This is used for absolute social-preview and sitemap URLs.

Set `GROQ_API_KEY` on the server. Never expose it with a `NEXT_PUBLIC_` prefix.

## Install behavior and camera permission
A website cannot silently force-install itself. Chrome/Edge show their native install prompt when PWA criteria are met; otherwise users can use the browser menu's Install app / Add to Home Screen. On iPhone/iPad, use Safari → Share → Add to Home Screen.

Camera access requires HTTPS (or localhost) and explicit browser permission. On an installed PWA, the app opens `/scan` and requests camera access on launch. Browsers may still require the user to approve permission or tap Open camera, and may block automatic camera startup in some situations. A normal link opened in a browser cannot force the camera to open without permission.

## Share preview
After deployment, share the root URL in WhatsApp. WhatsApp may cache previews; after changing the image or metadata, use its link preview refresh/debug flow where available or wait for its cache to refresh. The preview uses `/og-image.png`.

## Existing app behavior
The app still scans handwritten amount lists, not QR codes or printed product barcodes. AI output is a draft; review it before saving. Existing browser-local storage behavior remains unchanged.
