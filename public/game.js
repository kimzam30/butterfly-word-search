window.App = {
    // FIREBASE CONFIG
    firebaseConfig: {
        apiKey: "AIzaSyD9fyLY8ZtlKgLvv1uhVBxKcGKXqCvk_hs",
        authDomain: "butterflywordsearch.firebaseapp.com",
        databaseURL: "https://butterflywordsearch-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "butterflywordsearch",
        storageBucket: "butterflywordsearch.firebasestorage.app",
        messagingSenderId: "792555338046",
        appId: "1:792555338046:web:5184cc336fc5490db4546f"
    },
    
    db: null,

    // STATE
    state: {
        user: null, 
        grid: [], size: 10, words: [], found: [],
        selecting: false, selectStart: null, selectedCells: [],
        timer: 0, timerInt: null, score: 0,
        playerName: "Guest", roomCode: "", playerRole: "", multiDiff: "easy",
        darkMode: false, 
        lofiTrack: "none",
        volumes: { master: 1.0, lofi: 0.5, rain: 0.0, wind: 0.0, birds: 0.0 }
    },

    CONFIG: { 
        easy:   { size: 10, count: 6,  time: 180 }, 
        medium: { size: 12, count: 8,  time: 300 }, 
        hard:   { size: 15, count: 12, time: 480 }  
    },

    WORD_POOLS: {
        easy: ["CAT", "DOG", "SUN", "MOON", "STAR", "FISH", "BIRD", "TREE", "ROSE", "BLUE", "RED", "PINK", "CAKE", "PIE", "BOOK", "PEN", "LOVE", "HOPE", "HOME", "DOOR", "BABY", "BALL", "BEAR", "BOAT", "BOOT"],
        medium: ["PLANET", "ROCKET", "GALAXY", "FOREST", "JUNGLE", "DESERT", "OCEAN", "RIVER", "DOCTOR", "ARTIST", "DRIVER", "LAPTOP", "TABLET", "SUMMER", "WINTER", "AUTUMN", "SPRING", "BRIDGE"],
        hard: ["ADVENTURE", "CHALLENGE", "DISCOVERY", "EDUCATION", "UNIVERSITY", "TECHNOLOGY", "INNOVATION", "ANTARCTICA", "AUSTRALIA", "CHOCOLATE", "NAVIGATION", "SATELLITE", "ARCHITECTURE"]
    },

    // --- INIT ---
    init: function() {
        if (typeof firebase !== 'undefined') {
            try { 
                firebase.initializeApp(this.firebaseConfig); 
                this.db = firebase.database(); 
                console.log("Firebase OK"); 

                // AUTH OBSERVER
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        this.handleUserLogin(user);
                    } else {
                        this.handleUserLogout();
                    }
                });
            } 
            catch (e) { console.error("Firebase Error", e); }
        }
        
        try {
            const s = JSON.parse(localStorage.getItem('ws-settings-v5'));
            if (s) {
                this.state.darkMode = s.darkMode;
                if(s.volumes && s.volumes.master !== undefined) {
                    this.state.volumes.master = s.volumes.master;
                }
            }
        } catch(e) { console.log("No settings found"); }
        
        this.applySettings();
    },

    // --- AUTHENTICATION ---
    login: function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                // Success handled by onAuthStateChanged
            })
            .catch((error) => {
                alert("Login Failed: " + error.message);
            });
    },

    logout: function() {
        firebase.auth().signOut();
    },

    handleUserLogin: function(user) {
        this.state.user = user;
        this.state.playerName = user.displayName.split(" ")[0]; 
        
        document.getElementById('btn-login').style.display = 'none';
        const userInfo = document.getElementById('user-info');
        userInfo.style.display = 'flex';
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-pic').src = user.photoURL;
        
        const nameInput = document.getElementById('player-name-input');
        if(nameInput) nameInput.value = this.state.playerName;
    },

    handleUserLogout: function() {
        this.state.user = null;
        this.state.playerName = "Guest";
        
        document.getElementById('btn-login').style.display = 'flex';
        document.getElementById('user-info').style.display = 'none';
    },

    // --- NAVIGATION ---
    showScreen: function(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.classList.remove('active');
            m.classList.add('hidden');
        });
        document.getElementById(id).classList.add('active');
    },
    showMenu: function() { this.showScreen('screen-menu'); },
    showDifficulty: function() { this.showScreen('screen-difficulty'); },
    goToMultiName: function() { this.showScreen('screen-multi-name'); },
    openOfflinePage: function() { this.refreshOffline(); this.showScreen('screen-offline'); },
    changeDifficulty: function() { this.showMenu(); this.showScreen('screen-difficulty'); },

    // --- GAMEPLAY ---
    startGame: function(difficulty) {
        this.state.roomCode = ""; 
        const settings = this.CONFIG[difficulty];
        this.state.size = settings.size; this.state.multiDiff = difficulty;
        this.state.words = this.getWords(difficulty);
        this.state.found = []; this.state.score = 0; this.state.timer = settings.time;
        document.getElementById('game-difficulty-badge').innerText = difficulty.toUpperCase();
        this.generateGrid(); this.renderGrid(); this.renderWords(); this.startTimer();
        this.showScreen('screen-game');
    },

    getWords: function(d) {
        return [...this.WORD_POOLS[d]].sort(() => 0.5 - Math.random()).slice(0, this.CONFIG[d].count);
    },

    generateGrid: function() {
        this.state.grid = Array(this.state.size).fill().map(() => Array(this.state.size).fill(''));
        let sorted = [...this.state.words].sort((a,b)=>b.length-a.length);
        sorted.forEach(w => {
            let placed=false, tries=0;
            while(!placed && tries<200) {
                let d=Math.floor(Math.random()*3), r=Math.floor(Math.random()*this.state.size), c=Math.floor(Math.random()*this.state.size);
                if(this.canPlace(w,r,c,d)){ this.place(w,r,c,d); placed=true; } tries++;
            }
        });
        let ch="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for(let r=0;r<this.state.size;r++) for(let c=0;c<this.state.size;c++) if(this.state.grid[r][c]==='') this.state.grid[r][c]=ch[Math.floor(Math.random()*ch.length)];
    },

    canPlace: function(w,r,c,d) {
        if((d===0&&c+w.length>this.state.size)||(d===1&&r+w.length>this.state.size)||(d===2&&(r+w.length>this.state.size||c+w.length>this.state.size))) return false;
        for(let i=0;i<w.length;i++){ let cell=d===0?this.state.grid[r][c+i]:(d===1?this.state.grid[r+i][c]:this.state.grid[r+i][c+i]); if(cell!==''&&cell!==w[i]) return false; } return true;
    },
    place: function(w,r,c,d) { for(let i=0;i<w.length;i++) d===0?this.state.grid[r][c+i]=w[i]:(d===1?this.state.grid[r+i][c]=w[i]:this.state.grid[r+i][c+i]=w[i]); },

    renderGrid: function() { 
        const el=document.getElementById('game-grid'); 
        el.style.gridTemplateColumns=`repeat(${this.state.size},1fr)`; 
        el.style.gridTemplateRows=`repeat(${this.state.size},1fr)`;
        el.innerHTML='';
        this.state.grid.forEach((row,r)=>row.forEach((ch,c)=>{
            let div=document.createElement('div'); div.className='cell'; div.innerText=ch; div.dataset.r=r; div.dataset.c=c;
            div.onmousedown=(e)=>{e.preventDefault();this.startSelect(r,c)}; div.ontouchstart=div.onmousedown; div.onmouseenter=()=>this.updateSelect(r,c);
            el.appendChild(div);
        }));
        document.onmouseup=()=>this.endSelect(); document.ontouchend=()=>this.endSelect();
        el.ontouchmove=(e)=>{ e.preventDefault(); let t=e.touches[0], x=document.elementFromPoint(t.clientX,t.clientY); if(x?.classList.contains('cell')) this.updateSelect(parseInt(x.dataset.r),parseInt(x.dataset.c)); };
    },
    renderWords: function() { document.getElementById('word-list').innerHTML = this.state.words.map(w=>`<div id="w-${w}" class="word-tag">${w}</div>`).join(''); this.updateProgress(); },
    
    // --- SELECTION ---
    startSelect: function(r,c){this.state.selecting=true; this.state.selectStart={r,c}; this.updateSelect(r,c);},
    updateSelect: function(r,c){
        if(!this.state.selecting)return; const r0=this.state.selectStart.r, c0=this.state.selectStart.c;
        document.querySelectorAll('.cell.selected').forEach(e=>e.classList.remove('selected')); this.state.selectedCells=[]; let cells=[];
        if(r===r0) for(let i=Math.min(c,c0);i<=Math.max(c,c0);i++) this.state.selectedCells.push(this.queryCell(r,i));
        else if(c===c0) for(let i=Math.min(r,r0);i<=Math.max(r,r0);i++) this.state.selectedCells.push(this.queryCell(i,c));
        else if(Math.abs(r-r0)===Math.abs(c-c0)) { let dr=(r>r0)?1:-1, dc=(c>c0)?1:-1; for(let i=0;i<=Math.abs(r-r0);i++) this.state.selectedCells.push(this.queryCell(r0+i*dr, c0+i*dc)); }
        this.state.selectedCells.forEach(ce=>{if(ce)ce.classList.add('selected');});
    },
    queryCell: function(r,c) { return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`); },

    endSelect: function() {
        if(!this.state.selecting) return; this.state.selecting = false;
        const w = this.state.selectedCells.map(c=>c.innerText).join(''), rev = w.split('').reverse().join('');
        const f = this.state.words.includes(w) ? w : (this.state.words.includes(rev) ? rev : null);
        if (f && !this.state.found.includes(f)) {
            if (this.state.roomCode && this.db) {
                this.db.ref('rooms/' + this.state.roomCode + '/foundWords').push({ word: f, finder: this.state.playerName });
                this.markFound(f, 'found');
            } else { this.markFound(f, 'found'); }
        } else { document.querySelectorAll('.cell.selected').forEach(e => e.classList.remove('selected')); }
        this.state.selectedCells = [];
    },

    markFound: function(word, cssClass) {
        if(!this.state.found.includes(word)) this.state.found.push(word);
        if(this.state.selectedCells.length) this.state.selectedCells.forEach(c => { c.classList.remove('selected'); c.classList.add(cssClass); });
        const el = document.getElementById(`w-${word}`); if(el) el.classList.add(cssClass);
        if(cssClass === 'found') this.state.score += 100;
        this.updateProgress(); this.checkWinCondition();
    },

    updateProgress: function() {
        document.getElementById('found-count').innerText = this.state.found.length;
        document.getElementById('total-count').innerText = this.state.words.length;
        document.getElementById('score').innerText = this.state.score;
    },
    checkWinCondition: function() { if (this.state.found.length === this.state.words.length) this.endGame(true); },

    // --- TIMING ---
    startTimer: function() {
        clearInterval(this.state.timerInt); this.updateTimerDisplay();
        this.state.timerInt = setInterval(() => { this.state.timer--; this.updateTimerDisplay(); if (this.state.timer <= 0) this.endGame(false); }, 1000);
    },
    updateTimerDisplay: function() {
        const m = Math.floor(this.state.timer / 60).toString().padStart(2, '0'), s = (this.state.timer % 60).toString().padStart(2, '0');
        document.getElementById('timer').innerText = `${m}:${s}`;
    },
    endGame: function(isWin) {
        clearInterval(this.state.timerInt);
        const modal = document.getElementById('modal-gameover');
        if (isWin) { 
            document.getElementById('go-icon').innerText = "🏆"; 
            document.getElementById('go-title').innerText = "Puzzle Solved!"; 
            document.getElementById('go-msg').innerText = "Fantastic job finding all words!";
            if(typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else { 
            document.getElementById('go-icon').innerText = "⌛"; 
            document.getElementById('go-title').innerText = "Time's Up!"; 
            document.getElementById('go-msg').innerText = "You ran out of time."; 
        }
        document.getElementById('final-score').innerText = this.state.score;
        document.getElementById('final-time').innerText = document.getElementById('timer').innerText;
        modal.classList.add('active'); 
    },

    // --- MULTIPLAYER (UPDATED) ---
    submitName: function() { 
        this.state.playerName = document.getElementById('player-name-input').value || "Guest"; 
        document.getElementById('welcome-msg').innerText = this.state.playerName; 
        this.showScreen('screen-multi-setup'); 
    },
    selectMultiDiff: function(d, btn) { 
        this.state.multiDiff = d; 
        const container = btn.parentElement;
        container.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active')); 
        btn.classList.add('active'); 
    },
    
    // SECURITY UPDATE: Saving UID as host
    createRoom: function() {
        if(!this.db) return alert("Firebase not ready");
        if(!this.state.user) return alert("You must be logged in to host!");

        this.state.roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.state.playerRole = 'host';
        const settings = this.CONFIG[this.state.multiDiff];
        this.state.size = settings.size;
        this.state.words = this.getWords(this.state.multiDiff);
        this.generateGrid(); 
        
        this.db.ref('rooms/' + this.state.roomCode).set({
            status: "waiting", 
            difficulty: this.state.multiDiff, 
            grid: this.state.grid, 
            words: this.state.words, 
            foundWords: {}, 
            host: this.state.user.uid,       // SECURE: User ID
            hostName: this.state.playerName  // DISPLAY: Player Name
        });
        
        this.showScreen('screen-multi-lobby');
        this.monitorRoom(); 
    },

    // SECURITY UPDATE: Saving UID as guest
    joinRoom: function() {
        const code = document.getElementById('room-code-input').value.toUpperCase();
        if(!code) return alert("Enter code");
        if(!this.state.user) return alert("You must be logged in to join!");

        this.db.ref('rooms/' + code).once('value', snap => {
            if (snap.exists()) {
                this.state.roomCode = code; 
                this.state.playerRole = 'guest';
                
                this.db.ref('rooms/' + code).update({ 
                    guest: this.state.user.uid,       // SECURE: User ID
                    guestName: this.state.playerName  // DISPLAY: Player Name
                });
                
                this.showScreen('screen-multi-lobby');
                this.monitorRoom(); 
            } else alert("Room not found");
        });
    },

    // UI UPDATE: Reading hostName/guestName
    monitorRoom: function() {
        document.getElementById('lobby-code').innerText = this.state.roomCode;
        const startBtn = document.getElementById('btn-start-multi');
        
        if(this.state.playerRole === 'guest') startBtn.style.display = 'none';
        else startBtn.style.display = 'block';

        this.db.ref('rooms/' + this.state.roomCode).on('value', snap => {
            const data = snap.val();
            if(!data) return;
            const list = document.querySelector('.player-list');
            
            const hostDisplay = data.hostName || "Unknown Host";
            const guestDisplay = data.guestName ? 
                `<div class="player-item"><span>${data.guestName}</span><span>👤</span></div>` : 
                `<div class="player-item" style="opacity:0.5; border-style:dashed"><span>Waiting for guest...</span></div>`;

            list.innerHTML = `<label>Players</label><div class="player-item"><span>${hostDisplay}</span><span class="crown">👑</span></div>${guestDisplay}`;

            if (data.status === 'waiting') {
                const inGame = document.getElementById('screen-game').classList.contains('active');
                const inGameOver = document.getElementById('modal-gameover').classList.contains('active');
                if (inGame || inGameOver) {
                    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); 
                    this.showScreen('screen-multi-lobby');
                }
            }
            if(data.status === 'playing' && document.getElementById('screen-multi-lobby').classList.contains('active')) {
                this.startMultiGameInstance();
            }
        });
    },

    startMultiGame: function() { 
        this.state.words = this.getWords(this.state.multiDiff);
        this.generateGrid();
        this.db.ref('rooms/' + this.state.roomCode).update({ grid: this.state.grid, words: this.state.words, foundWords: {}, status: "playing" }); 
    },
    startMultiGameInstance: function() {
        this.db.ref('rooms/' + this.state.roomCode).once('value', snap => {
            const data = snap.val();
            this.state.grid = data.grid; this.state.words = data.words; this.state.size = data.grid.length;
            this.state.found = []; this.state.score = 0; this.state.timer = this.CONFIG[data.difficulty].time;
            this.renderGrid(); this.renderWords(); this.startTimer(); this.showScreen('screen-game');
            this.db.ref('rooms/' + this.state.roomCode + '/foundWords').on('child_added', s => this.handleRemoteFoundWord(s.val()));
        });
    },
    handleRemoteFoundWord: function(data) {
        if (this.state.found.includes(data.word)) return;
        this.state.found.push(data.word);
        const el = document.getElementById(`w-${data.word}`);
        if(el) el.classList.add(data.finder === this.state.playerName ? 'found' : 'opponent-found');
        this.updateProgress(); this.checkWinCondition();
    },
    leaveRoom: function() { if(this.state.roomCode) this.db.ref('rooms/' + this.state.roomCode).off(); this.state.roomCode = ""; this.showScreen('screen-multi-setup'); },
    
    // --- SETTINGS ---
    openSettings: function() { 
        document.getElementById('vol-master').value = this.state.volumes.master; 
        document.getElementById('vol-rain').value = this.state.volumes.rain; 
        document.getElementById('vol-wind').value = this.state.volumes.wind; 
        document.getElementById('vol-birds').value = this.state.volumes.birds; 
        if(document.getElementById('vol-lofi')) {
            document.getElementById('vol-lofi').value = this.state.volumes.lofi;
            this.updateLabel('val-lofi', this.state.volumes.lofi);
        }
        this.updateLabel('val-master', this.state.volumes.master);
        this.updateLabel('val-rain', this.state.volumes.rain);
        this.updateLabel('val-wind', this.state.volumes.wind);
        this.updateLabel('val-birds', this.state.volumes.birds);
        document.getElementById('modal-settings').classList.add('active'); 
    },
    closeSettings: function() { 
        document.getElementById('modal-settings').classList.remove('active'); 
        localStorage.setItem('ws-settings-v5', JSON.stringify({
            darkMode: this.state.darkMode, 
            volumes: { master: this.state.volumes.master } 
        })); 
    },
    setMasterVolume: function(v) { 
        this.state.volumes.master = parseFloat(v); 
        this.updateLabel('val-master', v);
        this.updateVolumes(); 
    },
    setTrackVolume: function(track, v) {
        const val = parseFloat(v);
        this.state.volumes[track] = val;
        this.updateLabel('val-'+track, val);
        const el = document.getElementById('audio-' + track);
        if (track === 'lofi') {
            if (this.state.lofiTrack !== 'none' && el.paused && val > 0) el.play().catch(()=>{});
        } else {
            if (val > 0 && el.paused) el.play().catch(()=>{}); 
            else if (val === 0) el.pause();
        }
        this.updateVolumes();
    },
    updateLabel: function(id, val) {
        if(document.getElementById(id)) document.getElementById(id).innerText = Math.round(val * 100) + "%";
    },
    toggleDarkMode: function() { 
        this.state.darkMode = !this.state.darkMode; 
        this.applySettings(); 
    },
    changeLofiTrack: function(track) { 
        this.state.lofiTrack = track; 
        this.playLofi(track); 
    },
    applySettings: function() {
        if(this.state.darkMode) document.body.setAttribute('data-theme','dark'); else document.body.removeAttribute('data-theme');
        document.getElementById('toggle-darkmode').checked = this.state.darkMode; 
        document.getElementById('lofi-select').value = this.state.lofiTrack;
        this.updateVolumes();
    },
    updateVolumes: function() {
        const m = this.state.volumes.master;
        ['lofi','rain','wind','birds'].forEach(k => {
            const el = document.getElementById(`audio-${k}`);
            let vol = this.state.volumes[k] !== undefined ? this.state.volumes[k] : 0;
            if(el) el.volume = Math.max(0, Math.min(1, vol * m));
        });
    },
    playLofi: function(track) {
        const paths = { 
            chill: "audio/lofi/chill.mp3", 
            sleepy: "audio/lofi/sleepy.mp3", 
            piano: "audio/lofi/piano.mp3" 
        };
        const el = document.getElementById('audio-lofi');
        if (track === "none") {
            el.pause();
        } else {
            if (!el.src.includes(paths[track])) el.src = paths[track];
            this.updateVolumes();
            el.play().catch(()=>{});
        }
    },

    // --- OFFLINE MODE ---
    refreshOffline: function() { 
        const g = document.getElementById('offline-grid'); g.innerHTML = ''; 
        const icons = { easy: "🐛", medium: "🦋", hard: "🔥" }; 
        for(let i=1; i<=9; i++){ 
            let t = ['easy','medium','hard'][Math.floor(Math.random()*3)];
            let c = document.createElement('div'); 
            c.className = `puz-card ${t}`; 
            c.innerHTML = `<div class="puz-icon">${icons[t]}</div><div class="puz-title">Puzzle ${i}</div><div class="puz-meta">${t}</div>`; 
            c.onclick = () => this.startGame(t); 
            g.appendChild(c); 
        } 
    },

    // --- ABOUT & FEEDBACK ---
    showAbout: function() {
        this.showScreen('screen-about');
    },
    sendFeedback: function() {
        const type = document.getElementById('fb-type').value;
        const msg = document.getElementById('fb-msg').value.trim();
        const btn = document.getElementById('btn-send-fb');
        if (!msg) return alert("Please type a message first!");
        btn.innerText = "Sending...";
        btn.style.opacity = "0.7";
        btn.disabled = true;
        if (this.db) {
            const feedbackData = { type: type, message: msg, date: new Date().toISOString(), player: this.state.playerName || "Anonymous" };
            this.db.ref('feedback').push(feedbackData)
                .then(() => {
                    alert("Message sent! Thank you! 🦋");
                    document.getElementById('fb-msg').value = ""; 
                    btn.innerText = "Send Message";
                    btn.style.opacity = "1";
                    btn.disabled = false;
                })
                .catch(err => { alert("Error: " + err.message); btn.innerText = "Try Again"; btn.disabled = false; });
        } else { alert("Offline."); btn.innerText = "Send Message"; btn.disabled = false; }
    },
    
    restartGame: function() {
        if(this.state.roomCode) {
            if(this.state.playerRole === 'host') this.db.ref('rooms/' + this.state.roomCode).update({ status: "waiting" });
            else alert("Waiting for Host...");
        } else {
            this.startGame(this.state.multiDiff || 'easy'); 
        }
        document.getElementById('modal-gameover').classList.remove('active');
    }
};

document.addEventListener('DOMContentLoaded', () => { window.App.init(); });