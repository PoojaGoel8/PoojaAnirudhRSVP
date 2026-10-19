# Anirudh & Pooja — Wedding RSVP

A static RSVP site (hosted on GitHub Pages) that saves every response as a row in a Google Sheet. You can download the sheet as Excel at any time.

**Live site (after step 3):** https://poojagoel8.github.io/WeddingWebsite/

## How it works

```
Guest's phone ──▶ GitHub Pages (this repo) ──POST──▶ Google Apps Script ──▶ Google Sheet ("RSVPs" tab)
```

RSVP flow: **1. RSVP** (yes / no) → **2. Details** (name, email, phone) → **3. Additional details** (allergies, additional requests) → **4. Thank you**.
Guests who decline skip the additional details step.

## Setup (about 10 minutes)

### 1. Create the Google Sheet
1. Go to https://sheets.new and name the sheet something like **Wedding RSVPs**.
2. Open **Extensions → Apps Script**.
3. Delete what's there, paste in the contents of [`google-apps-script/Code.gs`](google-apps-script/Code.gs), and click **Save**.

### 2. Deploy it as a web app
1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**. Then click **Deploy**.
4. Approve the permissions prompt. Google shows a "Google hasn't verified this app" warning because the script is yours: click **Advanced → Go to (project name)**.
5. Copy the **Web app URL** (it ends in `/exec`).
6. Paste it into [`config.js`](config.js):
   ```js
   window.RSVP_CONFIG = { scriptUrl: "https://script.google.com/macros/s/XXXX/exec" };
   ```
7. Commit and push.

> If you edit `Code.gs` later, use **Deploy → Manage deployments → ✏ Edit → Version: New version** so the same URL keeps working.

### 3. Turn on GitHub Pages
Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
The site goes live at `https://poojagoel8.github.io/WeddingWebsite/` within a minute or two.

### 4. Get the responses into Excel
In the Google Sheet: **File → Download → Microsoft Excel (.xlsx)**.
Alternatively, in Excel use **Data → Get Data → From Web**: publish the sheet first (**File → Share → Publish to web → CSV**) and paste that link, so Excel can refresh.

## Customising
| What | Where |
|---|---|
| Names, date, venue, text | `index.html` |
| Colours & fonts | top of `styles.css` (`:root`) |
| Flowers & skyline art | `assets/*.jpg`. Swap in higher-resolution originals with the same file names, on a pure white background (the site blends white away). |
| Country codes in the phone field | `<select id="country">` in `index.html` |

Until `scriptUrl` is set, the form runs in **demo mode**: it works end to end but saves nothing (check the browser console).
