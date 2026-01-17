// --- 1. VEILIGE HELPER VOOR SETTINGS ---
function getSetting(key, defaultValue) {
    try {
        const val = localStorage.getItem(key);
        if (val === null) {
            localStorage.setItem(key, defaultValue);
            return defaultValue;
        }
        return val;
    } catch (e) {
        console.warn("LocalStorage geblokkeerd:", e);
        return defaultValue;
    }
}

const playGlobalClick = () => {
    if (getSetting('sfxEnabled', 'true') === 'true') {
        const snd = new Audio('clickpop.mp3');
        snd.volume = 0.5;
        snd.play().catch(e => console.log("Audio blocked by browser"));
    }
};

// --- 2. UNIVERSELE KLIK EN ANIMATIE LOGICA ---
document.addEventListener('mousedown', (event) => {
    const target = event.target.closest('button') || 
                   event.target.closest('.lab-btn') || 
                   event.target.closest('.skin-box') ||
                   event.target.closest('#pause-toggle') ||
                   event.target.closest('.back-x') ||
                   event.target.closest('#settings-btn') ||
                   event.target.closest('.infect-btn'); // Ook voor de nieuwe Battle knop

    if (target) {
        playGlobalClick();
        target.style.transition = "transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        target.style.transform = "scale(0.9)"; 
        setTimeout(() => {
            if (target) target.style.transform = "scale(1)";
        }, 100);
    }
}, true);

// --- 3. DE KERN: LANSEER DE GAME FUNCTIE ---
// Deze functie is nu globaal beschikbaar voor zowel index.html als battle.html
window.launchGame = function(name) {
    console.log("Game wordt gestart voor:", name);
    window.playerNickname = name;
    
    // Verberg menu (indien aanwezig op de pagina)
    const menu = document.getElementById('menu-screen');
    if (menu) menu.style.display = 'none';

    // Toon leaderboard
    const lb = document.getElementById('leaderboard');
    if (lb) lb.style.display = 'block';

    // Start de Phaser Game
    window.game = new Phaser.Game({
        type: Phaser.AUTO, 
        parent: 'game-container', 
        width: CONFIG.WIDTH, 
        height: CONFIG.HEIGHT,
        backgroundColor: '#000', 
        physics: { 
            default: 'arcade',
            arcade: { gravity: { y: 0 }, debug: false }
        },
        scene: [GameScene], 
        scale: { 
            mode: Phaser.Scale.FIT, 
            autoCenter: Phaser.Scale.CENTER_BOTH 
        },
        audio: {
            disableWebAudio: false
        }
    });

    window.game.events.on('ready', () => {
        const musicEnabled = getSetting('musicEnabled', 'true') === 'true';
        window.game.sound.mute = !musicEnabled;
    });
};

// --- 4. LOGICA NA LADEN VAN DE PAGINA (UI SETUP) ---
window.onload = function() {
    
    // Gebruikersnaam terugzetten
    const savedName = localStorage.getItem('savedNickname');
    const usernameInput = document.getElementById('username');
    if (savedName && usernameInput) {
        usernameInput.value = savedName;
    }

    // Settings Menu
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    
    if (settingsBtn && settingsPanel) {
        settingsBtn.onclick = function() {
            document.getElementById('music-toggle').checked = getSetting('musicEnabled', 'true') === 'true';
            document.getElementById('sfx-toggle').checked = getSetting('sfxEnabled', 'true') === 'true';
            settingsPanel.style.display = 'block';
        };
    }

    const closeBtn = document.getElementById('close-settings');
    if (closeBtn && settingsPanel) {
        closeBtn.onclick = function() {
            settingsPanel.style.display = 'none';
        };
    }

    // Toggles
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
        musicToggle.onchange = function(e) {
            const isEnabled = e.target.checked;
            localStorage.setItem('musicEnabled', isEnabled);
            if (window.game) window.game.sound.mute = !isEnabled;
        };
    }

    const sfxToggle = document.getElementById('sfx-toggle');
    if (sfxToggle) {
        sfxToggle.onchange = function(e) {
            localStorage.setItem('sfxEnabled', e.target.checked);
        };
    }

    // START KNOP (Endless mode)
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.onclick = function() {
            const name = document.getElementById('username').value.trim() || "Parasite";
            localStorage.setItem('savedNickname', name);
            window.launchGame(name); // Gebruikt de globale functie
        };
    }
};

// --- 5. GELUIDS EFFECTEN ---
const deathSnd = new Audio('death.mp3');
const reviveSnd = new Audio('revive.mp3');
deathSnd.preload = 'auto';
reviveSnd.preload = 'auto';

window.addEventListener('player_died', () => {
    if (getSetting('sfxEnabled', 'true') === 'true') {
        deathSnd.currentTime = 0;
        deathSnd.volume = 0.6;
        deathSnd.play().catch(e => {});
    }
});

window.addEventListener('player_revived', () => {
    if (getSetting('sfxEnabled', 'true') === 'true') {
        reviveSnd.currentTime = 0;
        reviveSnd.volume = 0.6;
        reviveSnd.play().catch(e => {});
    }


});


// --- 6. DYNAMISCHE KLEUREN VOOR MODI (MAP & UI) ---
const body = document.body;

// Check of we in de Battle Mode zitten (2:30 min)
if (window.location.pathname.includes('battle.html')) {
    body.classList.add('mode-battle');
    body.classList.remove('mode-endless');
    console.log("UI Kleur: Blauw (Battle Mode)");
} else {
    // Standaard gaan we uit van Endless (Groen)
    body.classList.add('mode-endless');
    body.classList.remove('mode-battle');
    console.log("UI Kleur: Groen (Endless Mode)");
}