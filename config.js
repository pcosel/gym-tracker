// Nothing below is a secret.
// - CLIENT_ID identifies this app to Google. Without a client secret it grants
//   nothing, and Google accepts it only from the origins registered for it.
// - SPREADSHEET_ID only names the sheet. The sheet is private in Google Drive,
//   so knowing its ID gives nobody access. Its sharing settings are the
//   security boundary.
//
// There are two configurations, chosen by the host the page is served from:
// - production is the live site and the real gym sheet.
// - development is `http://localhost:8000` and a private copy of the gym sheet,
//   so testing never writes to the real one. Both share the OAuth client.
const CONFIGS = {
  production: {
    CLIENT_ID: '353906748943-2q68b27c2g2ut4kfgsrk3hspk98guu3p.apps.googleusercontent.com',
    SPREADSHEET_ID: '14FtdMI79wr7c50SxBty9h0-79ZculdI-CAXzVGVhlWE',
  },
  development: {
    CLIENT_ID: '353906748943-2q68b27c2g2ut4kfgsrk3hspk98guu3p.apps.googleusercontent.com',
    SPREADSHEET_ID: '1VfFsf7Y01LV1xy1-5JYlziju9_FiQBiDTOaGcuORW7c',
  },
};

export const ENVIRONMENT = location.hostname === 'localhost' ? 'development' : 'production';
export const CONFIG = CONFIGS[ENVIRONMENT];

// Names of the settings of the active configuration that are still blank.
export function missingConfigKeys() {
  return Object.keys(CONFIG).filter((key) => !CONFIG[key]);
}
