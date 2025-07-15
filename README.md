# 🎲 Score Bars

Score Bars is a real-time, multiplayer dice game built with Angular and Firebase. It supports remote and local play, dynamic scoring, and real-time sync using Firestore. The UI is built with Angular Material and optimized for desktop and mobile.

---

## 🚀 Tech Stack

- **Angular v20** — Component-based frontend framework
- **Angular Material** — UI components and layout
- **Firebase Hosting** — Fast, global deployment
- **Cloud Firestore** — Real-time backend and game state sync

---

## 🛠 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/your-org/score-bars.git
cd score-bars
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Firebase
Ensure you have the [Firebase CLI](https://firebase.google.com/docs/cli) installed:
```bash
npm install -g firebase-tools
firebase login
```

Then initialize your Firebase project:
```bash
firebase use --add
firebase init
```
Make sure to enable:
- Hosting (set the public directory to `dist/score-bars-app/browser`)
- Firestore rules and indexes if prompted

### 4. Run locally
```bash
ng serve
```
Visit [http://localhost:4200](http://localhost:4200) to play.

---

## 📦 Build & Deploy

To build for production:
```bash
ng build --configuration production
```

To deploy to Firebase:
```bash
firebase deploy
```

---

## 🧪 Testing

Run unit tests:
```bash
ng test
```

End-to-end testing (optional setup required):
```bash
ng e2e
```

---

## ⚙️ Configuration Notes

- The `angular.json` has been modified to include `src/styles.scss` in the `styles` array.
- During `firebase init`, the correct public directory is `dist/score-bars-app/browser`.

---

## 📄 Project Docs

For a full breakdown of project behavior and architecture, see:
- [`Requirements.md`](./Requirements.md) — App logic and design goals
- [`TODO.md`](./TODO.md) — Live punchlist and in-progress features

---

## 📚 Resources
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Angular Material](https://material.angular.io/)
- [Firebase Docs](https://firebase.google.com/docs)

---

## 💡 Contributing
Want to contribute? Fork the repo and submit a PR — we welcome bug fixes, UI polish, and new ideas!
