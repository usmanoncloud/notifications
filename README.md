# Eid Prayer Finder (PWA) – setup guide (free plan, no Blaze needed)

Folder: `index.html` (app), `manifest.json`, `sw.js`, `icons/`, `firebase-config.js` (your keys), `firestore.rules`, `firebase.json`, `notifier/` + `.github/` (free notification sender).

## 1. Firebase project
1. console.firebase.google.com → Create a project (Analytics off).
2. Build → Firestore Database → Create database → location australia-southeast1 → production mode.
3. Project settings → General → Your apps → Web `</>` → register → copy config into `firebase-config.js`.
4. Project settings → Cloud Messaging → Web Push certificates → Generate key pair → paste into `VAPID_KEY`.

## 2. Deploy the app
```
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only hosting,firestore:rules
```

## 3. Free automatic notifications (GitHub Actions)
Firebase's own function needs the paid plan, so a free GitHub job checks every ~5 minutes and sends the pushes.
1. **Service key:** Firebase Console → Project settings → Service accounts → Generate new private key. A .json file downloads. Keep it private.
2. **GitHub repo:** sign in at github.com → New repository → name it → **Public** (public repos get unlimited free Actions minutes) → Create.
3. **Upload the project:** Add file → Upload files → drag in the contents of the `eid-pwa` folder (include the hidden `.github` folder; if your computer hides it, upload `.github/workflows/notify.yml` using Add file → Create new file and type the path `.github/workflows/notify.yml`). Commit.
4. **Secret:** repo → Settings → Secrets and variables → Actions → New repository secret → Name `FIREBASE_SERVICE_ACCOUNT` → Value: open the .json file in a text editor, copy everything, paste → Add secret.
5. **Run once:** repo → Actions tab → enable workflows if asked → “Send notifications” → Run workflow. The log should say “First run: nothing sent. Ready.”
6. **Test:** in the app, tap Enable Notifications (✓ appears), heart a place, then update its time from another browser/device. Within about 5–15 minutes a notification arrives. Check the Actions log for `subscribers:` and `sent ok:` lines.

Notes: GitHub may delay scheduled runs by several minutes. GitHub pauses scheduled jobs in a public repo after 60 days with no repo activity (just push any small change, or click Run workflow). The service key stays in GitHub Secrets and is never in your site.

## Instant alerts while the app is open
If the app is open (or recently open in the background), favorites changes trigger an immediate local notification, with no GitHub delay. The same alert is not shown twice.

## Install & use
- **Android/desktop Chrome:** Install app → ♡ favorite places → **🔔 Enable Notifications** (green with ✓ when on; tap again to turn off).
- **iPhone (iOS 16.4+):** Safari → Share → Add to Home Screen, open from the home screen, then Enable Notifications.

## Community updates and moderating
Anyone can add a prayer, correct its date/time/notes (**✏️ Update time**) or tap **✓ Time is correct**. An edit resets confirmations to 0. Edits are not tied to a person, so check Firestore now and then. Fix or delete spam in Firestore, or add `hidden: true` to hide an entry. If you edit a time in the console and want a notification, also set `updatedAt` to the current time in milliseconds.

## Troubleshooting
- Subscription: Firestore → `subscribers` should have a document whose `places` contains your place key (venue|suburb|state, lowercase, e.g. `lakemba-mosque|lakemba|nsw`).
- Test push separately: copy that document's ID (the token) → Firebase Messaging → New campaign → Send test message.
- Actions log shows `subscribers: 0`? The favorited place name/suburb/state must match the prayer exactly (case and punctuation are ignored).
- Update `CACHE` in `sw.js` (e.g. `eid-v6`) whenever you change files.
