# 🦋 Butterfly Word Search

A real-time multiplayer, offline-capable Progressive Web App (PWA) word search game. Built with a serverless architecture using Vanilla JavaScript and Firebase.

🔗 **Play Live:** [https://butterflywordsearch.web.app](https://butterflywordsearch.web.app)

![Game Screenshot](./public/images/icon-512.png) 
*(Note: You can replace this line with a real screenshot later)*

## ✨ Key Features

### 🎮 Gameplay
- **3 Difficulty Levels:** Easy (10x10), Medium (12x12), Hard (15x15).
- **Massive Dictionary:** Over 200 categorized words to ensure replayability.
- **Smart Grid Generation:** Algorithms ensure words fit perfectly without invalid overlaps.

### 🌐 Multiplayer (Real-Time)
- **Live Sync:** Host a room and play against a friend in real-time.
- **Firebase Realtime Database:** Instantly syncs word discoveries between players.
- **Lobby System:** Room codes for private matchmaking.

### 📱 Progressive Web App (PWA)
- **Installable:** Can be installed on Android/iOS as a native app.
- **Offline Support:** Works 100% offline using Service Workers (`sw.js`).
- **No Internet? No Problem:** Fallback to local offline mode automatically.

### 🔐 Authentication & Security
- **Google Sign-In:** Secure authentication flow.
- **Security Rules:** Server-side validation prevents cheating and spam.
- **API Security:** Locked API keys via Google Cloud Console (CORS & Referrer restrictions).

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Responsive Grid), Vanilla JavaScript (ES6+).
* **Backend:** Firebase Realtime Database & Authentication.
* **DevOps:** Firebase Hosting, Service Workers (Caching Strategy v15).
* **Assets:** Custom 3D CSS styling, local audio hosting.

## 🚀 How to Run Locally

1.  Clone the repository:
    ```bash
    git clone [https://github.com/YOUR_USERNAME/butterfly-word-search.git](https://github.com/YOUR_USERNAME/butterfly-word-search.git)
    ```
2.  Install Firebase Tools:
    ```bash
    npm install -g firebase-tools
    ```
3.  Login to Firebase:
    ```bash
    firebase login
    ```
4.  Start a local server:
    ```bash
    firebase emulators:start
    # OR simply use Live Server in VS Code
    ```

## 📝 Roadmap

- [x] Multiplayer Synchronization
- [x] Offline Mode (PWA)
- [x] User Accounts
- [ ] Global Leaderboards
- [ ] Hint System
- [ ] Daily Challenge Mode

## 👨‍💻 Author

**kimzam** - *Full Stack Developer*

---
*Built with ❤️ and JavaScript.*