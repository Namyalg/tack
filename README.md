# Tack

Post-its for your phone, for the links people hand you.

You meet someone, you scan their LinkedIn QR code — and then you forget what
you were supposed to do about it. Tack keeps the two together: scan the code,
write the follow-up in the same motion, tick it off when it's done.

Everything stays on your phone. There is no account, no server, and no network
call at runtime — the app doesn't even have a way to send your notes anywhere.

## Using it

Open the site on your phone and **Add to Home screen**. After that it launches
like any other app, works with no signal, and keeps its own icon.

| | |
|---|---|
| **Scan a QR code** | Opens the rear camera. A hit is saved instantly and drops the cursor in the follow-up note. |
| **Photo** | Decodes a QR from a photo or screenshot — useful for a code someone sent you. |
| **Paste** | Takes a link from the clipboard, or gives you a blank card to type into. |
| **Export** | Downloads everything as JSON. Local shouldn't mean trapped. |

Notes save as you type. **Mark done** greys a card out; the **Open** filter hides
the finished ones. Tap a link to open it, or **Edit link** to fix a bad scan.

## Where the data lives

In `localStorage` under the key `tack.v1`, on that device only. The app calls
`navigator.storage.persist()` so Chrome won't evict it to reclaim space.

Two things follow from that, and they're worth knowing before you rely on it:
clearing the browser's site data for this origin deletes your notes, and the
notes do not sync between devices. Use **Export** if you want a copy that
outlives the phone.

## How it's built

A plain PWA — no framework, no build step, no `node_modules` at runtime.

- `index.html` — the whole app, inline styles and script
- `sw.js` — a cache-first service worker, so it opens offline
- `vendor/jsQR.js` — the QR decoder, committed rather than loaded from a CDN
- `scripts/make-icons.js` — draws the PNG icons from scratch, no image library

Decoding prefers the browser's native `BarcodeDetector` when it's available and
reports `qr_code` support, and falls back to jsQR otherwise. That's why the
photo path works on a desktop browser too, which is how the pipeline is tested
without a phone in hand.

The camera needs a secure context, so it works over HTTPS or on `localhost` —
opening `index.html` from the filesystem will not get you a camera.

## Running it locally

```sh
python3 -m http.server 8731
# then open http://localhost:8731
```

## Deploying

Any static host over HTTPS. Every path in the app is relative, so it works from
a subdirectory — a GitHub Pages project site at `/<repo>/` needs no changes.

If you change a shell file, bump `CACHE` in `sw.js` so installed copies pick up
the new version instead of serving the old one from cache.
