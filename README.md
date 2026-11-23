# Deebak Software

Scan-to-stock, scan-to-bill software for Indian shops — textiles, sweets, grocery, pharmacy, electronics and more.
One login, many shops. Built for people who have never used billing software.

## What it does
- **Stock In** — scan the QR on an item as it arrives; scan again to add more; one tap saves to stock.
- **Billing** — scan items (camera, USB/Bluetooth scanner, or tap) → GST bill → print (80 mm thermal or A4) / WhatsApp.
- **QR labels** — generate and print a QR label for every item.
- **Multi-shop** — each shop has its own stock, bills, GSTIN, UPI ID and colour theme.
- **UPI QR** at checkout with the exact amount, **CGST/SGST** split, amount in words, round-off.
- Dashboard, low-stock alerts, bill history, English / हिन्दी, light / dark.

## Run
No build step. Open `index.html`, or serve the folder:

```
python3 -m http.server 8000
```

> Camera scanning needs HTTPS or `localhost`.

## Demo build
All data lives in the browser (`localStorage`). Settings → *Reset demo data* restores the sample shops.
Shortcuts: `F2` new bill · `F9` generate bill.
