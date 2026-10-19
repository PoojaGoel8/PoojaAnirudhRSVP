/**
 * Wedding RSVP → Google Sheet
 *
 * Paste this file into Extensions → Apps Script of your RSVP Google Sheet,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the /exec URL into config.js on the website.
 */

const SHEET_NAME = "RSVPs";
const HEADERS = ["Submitted at", "Attending", "Full name", "Email", "Phone", "Allergies / dietary", "Additional requests", "Device"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const p = (e && e.parameter) || {};

    // Honeypot: real guests never fill this hidden field.
    if (p.website) return json({ result: "success" });

    // Guests who decline only give their name; email is required from guests who accept.
    if (!p.name || (p.attending !== "Yes" && p.attending !== "No") || (p.attending === "Yes" && !p.email)) {
      return json({ result: "error", error: "Missing required fields" });
    }

    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      p.attending,
      clean(p.name),
      clean(p.email),
      clean(p.phone), // clean() adds the leading apostrophe that keeps "+91" as text
      clean(p.allergies),
      clean(p.requests),
      clean(p.userAgent).slice(0, 200),
    ]);

    return json({ result: "success" });
  } catch (err) {
    return json({ result: "error", error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the /exec URL in a browser just confirms the script is live.
function doGet() {
  return json({ result: "ok", message: "RSVP endpoint is running", version: 2 });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#f6e6e4");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Stops values like "=HYPERLINK(...)" being treated as spreadsheet formulas.
function clean(v) {
  const s = String(v || "").trim().slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
