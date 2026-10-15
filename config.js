// Neither value below is a secret.
// - CLIENT_ID identifies this app to Google. Without a client secret it grants
//   nothing, and Google accepts it only from the origins registered for it.
// - SPREADSHEET_ID only names the sheet. The sheet is private in Google Drive,
//   so knowing its ID gives nobody access. Its sharing settings are the
//   security boundary.
export const CONFIG = {
  CLIENT_ID: '353906748943-2q68b27c2g2ut4kfgsrk3hspk98guu3p.apps.googleusercontent.com',
  SPREADSHEET_ID: '14FtdMI79wr7c50SxBty9h0-79ZculdI-CAXzVGVhlWE',
};

// Names of the settings that are still blank.
export function missingConfigKeys() {
  return Object.keys(CONFIG).filter((key) => !CONFIG[key]);
}
