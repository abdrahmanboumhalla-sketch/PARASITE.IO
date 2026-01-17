class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

preload() {
    // 1. Laad standaard assets (één keer is genoeg)
    Object.keys(ASSETS).forEach(key => {
        this.load.image(key, ASSETS[key]);
    });
    
    // 2. Laad de Skins (geforceerd uit de root folder)
    this.load.image('skin1', 'skin1.png');
    this.load.image('skin2', 'skin2.png');
    this.load.image('skin3', 'skin3.png');
    this.load.image('skin4', 'skin4.png');
    this.load.image('skin5', 'skin5.png');

    // 3. Laad de Level images (geforceerd uit de root folder)
    this.load.image('lvl2', 'lvl2.png');
    this.load.image('lvl3', 'lvl3.png');
    this.load.image('lvl4', 'lvl4.png');

// De achtergrondmuziek
    this.load.audio('menu_music', 'menu.mp3');
    this.load.audio('game_music', 'game.mp3'); // DIT IS DE GAME MUSIC

    // De geluidseffecten
    this.load.audio('leader_snd', 'leader.mp3'); // VOOR DE LEADER TEXT
    this.load.audio('db_snd', 'db.mp3');
    this.load.audio('tp_snd', 'tp.mp3');
    this.load.audio('qp_snd', 'qp.mp3'); 
    this.load.audio('dm_snd', 'dm.mp3');
    this.load.audio('rp_snd', 'rp.mp3');
    this.load.audio('clickPop', 'click.mp3');
    this.load.audio('lvlup_snd', 'levelup.mp3');
    this.load.audio('powerup_snd', 'powerup.mp3');
    this.load.audio('clickPop', 'clickpop.mp3');
    this.load.audio('godlike_snd', 'godlike2.mp3');
    this.load.audio('unstoppable_snd', 'unstoppable.mp3');
    this.load.audio('wickedsick_snd', 'wc.mp3');
    this.load.audio('monsterkill_snd', 'monsterkill.mp3');
    this.load.audio('nuclear_snd', 'holy.mp3');

}

create() {




    this.kills = 0;







// 1. UI Setup
    UIManager.showPauseButton(true); 
    const lb = document.getElementById('leaderboard');
    if (lb) lb.style.display = 'block';

    // FIX: Hide the top bar (Logo + Lab Button)
    const topBar = document.getElementById('top-bar');
    if (topBar) {
        topBar.style.display = 'none'; 
    }






// In GameScene.js -> create()
    const pauseBtn = document.getElementById('pause-toggle');
    if (pauseBtn) {
        // Verwijder eventuele oude listeners om dubbele triggers te voorkomen
        pauseBtn.onclick = null; 
        
        // Gebruik een arrow function om 'this' naar de GameScene te laten wijzen
        pauseBtn.onclick = () => {
            console.log("Pauze knop geklikt. Status sound:", !!this.sound);
            this.togglePause();
        };
    }











    // 2. World and Background Setup
    this.physics.world.setBounds(0, 0, CONFIG.WORLD.WIDTH, CONFIG.WORLD.HEIGHT);
    this.bg = this.add.image(0, 0, 'BACKGROUND')
        .setOrigin(0)
        .setDisplaySize(CONFIG.WORLD.WIDTH, CONFIG.WORLD.HEIGHT)
        .setDepth(-1);
    
    this.hosts = [];
    this.bots = [];
    this.botsGroup = this.physics.add.group();









    
    // --- IMPORTANT: SET TO WAITING FOR COUNTDOWN ---
    this.gameState = 'WAITING'; 




    this.input.once('pointerdown', () => {
    if (this.sound.context.state === 'suspended') {
        this.sound.context.resume();
    }
    });





// 3. Initialize Player
    const equippedSkin = localStorage.getItem('selectedSkin') || 'skin1';

    // IMPORTANT: Check the number of items inside the ( )
    this.player = new Player(
        this,                          // 1. scene
        CONFIG.WORLD.WIDTH / 2,        // 2. x
        CONFIG.WORLD.HEIGHT / 2,       // 3. y
        window.playerNickname || "P1", // 4. name
        false,                         // 5. isBot
        equippedSkin                   // 6. skinTexture
    );

    if (this.player && this.player.sprite) {
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    }

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // --- 4. POWER-UP SYSTEM ---
    this.powerupsGroup = this.physics.add.group();



    





    // Spawn Initial Batch
    for (let i = 0; i < 60; i++) {
        const x = Phaser.Math.Between(500, CONFIG.WORLD.WIDTH - 500);
        const y = Phaser.Math.Between(500, CONFIG.WORLD.HEIGHT - 500);
        const type = Phaser.Math.RND.pick(['SPEED', 'MAGNET', 'X2']); 
        const pUp = new PowerUp(this, x, y, type);
        this.powerupsGroup.add(pUp.sprite);
        pUp.sprite.instance = pUp;
    }

    // Spawn Timer
    this.time.addEvent({
        delay: 5000, 
        callback: () => {
            for(let i = 0; i < 3; i++) {
                if (this.powerupsGroup.getLength() < 40) {
                    const x = Phaser.Math.Between(500, CONFIG.WORLD.WIDTH - 500);
                    const y = Phaser.Math.Between(500, CONFIG.WORLD.HEIGHT - 500);
                    const type = Phaser.Math.RND.pick(['SPEED', 'MAGNET', 'X2']); 
                    const pUp = new PowerUp(this, x, y, type);
                    this.powerupsGroup.add(pUp.sprite);
                    pUp.sprite.instance = pUp; 
                }
            }
        },
        loop: true
    });

// Zoek dit in je create() functie
this.physics.add.overlap(this.player.sprite, this.powerupsGroup, (player, sprite) => {
    const pUp = sprite.instance;
    if (pUp) {
        // --- SPEEL HET GELUID AF ---
        this.sound.play('powerup_snd', { volume: 0.6 });

        if (pUp.type === 'X2') {
            this.giveInitialHosts(this.player, 5);
            this.player.sprite.setTint(0xffff00);
            this.time.delayedCall(500, () => this.player.sprite.clearTint());
        } else {
            this.player.applyPowerup(pUp.type);
        }
        pUp.destroy();
    }
}, null, this);

    // 5. Initial Army for Player
    this.giveInitialHosts(this.player, 3);

// 6. Initialize Bots
    for (let i = 0; i < CONFIG.BOT.COUNT; i++) {
        // Pak een willekeurige naam uit de lijst van 100
        const n = Phaser.Math.RND.pick(CONFIG.BOT.NAMES);

        // --- 65% SKIN LOGIC ---
        let botSkin = 'skin1'; // Default appearance
        
        // Generate a number between 1 and 100. 
        // If it's higher than 40 (a 60% chance), pick a random skin.
        if (Phaser.Math.Between(1, 100) > 40) {
            botSkin = 'skin' + Phaser.Math.Between(1, 5);
        }

        // Create the bot with the skin determined above
        let bot = new Player(
            this, 
            Phaser.Math.Between(500, CONFIG.WORLD.WIDTH - 500), 
            Phaser.Math.Between(500, CONFIG.WORLD.HEIGHT - 500), 
            n, 
            true,   // isBot set to true
            botSkin // skinTexture
        );
        
        this.bots.push(bot);
        
        // !!! DEZE REGEL IS CRUCIAAL VOOR HET VECHTEN !!!
        this.botsGroup.add(bot.sprite); 
        
        this.giveInitialHosts(bot, 2);
    }

    // 7. Spawn wild hosts
    for (let i = 0; i < CONFIG.HOST.INITIAL_COUNT; i++) {
        this.spawnHost();
    }



    // 8. Setup UI Graphics & Crown
    this.setupUI();
    this.uiGraphics = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.crownIcon = this.add.image(0, 0, 'CROWN').setDisplaySize(50, 50).setDepth(20).setVisible(false);





// Alleen aanmaken, NIET afspelen!
this.menuSnd = this.sound.add('menu_music', { volume: 0.30, loop: true });
this.gameSnd = this.sound.add('game_music', { volume: 0.25, loop: true });

// De 'pointerdown' listener mag ook weg, want de HTML audio regelt de unlock nu.





// --- 9. START COUNTDOWN & CINEMATIC ZOOM ---

// 1. Schoonmaak: Verwijder eventuele oude countdowns om "dubbele cijfers" te voorkomen
if (this.battleCountdown) this.battleCountdown.destroy();

// 2. Camera effect
this.cameras.main.setZoom(0.3); 
this.tweens.add({
    targets: this.cameras.main,
    zoom: 1,
    duration: 2000,
    ease: 'Power2'
});

// 3. Bepaal modus & Kleur
const isBattleMode = window.location.pathname.includes('battle.html');
const themeColorText = isBattleMode ? '#00f2ff' : '#00ff88'; // Blauw voor Battle, Groen voor Endless
const startWord = isBattleMode ? 'BATTLE!' : 'INFECT!';

this.countValue = 3;

// 4. Maak de tekst aan (SLECHTS ÉÉN KEER)
this.battleCountdown = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, '3', {
    fontSize: '180px',
    fill: themeColorText,
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 12
}).setOrigin(0.5).setScrollFactor(0).setDepth(3000);

// 5. De Timer Logica
this.time.addEvent({
    delay: 1000,
    repeat: 3,
    callback: () => {
        this.countValue--;
        
        if (this.countValue > 0) {
            if (this.battleCountdown && this.battleCountdown.active) {
                this.battleCountdown.setText(this.countValue);
                this.tweens.add({ 
                    targets: this.battleCountdown, 
                    scale: 1.2, 
                    duration: 100, 
                    yoyo: true 
                });
            }
        } else if (this.countValue === 0) {
            if (this.battleCountdown && this.battleCountdown.active) {
                this.battleCountdown.setText(startWord);
            }

            // Kill counter wrapper tonen
            const counterWrapper = document.getElementById('kill-counter-wrapper');
            if (counterWrapper) {
                counterWrapper.style.setProperty('display', 'block', 'important');
            }

            // Muziek en Game State
            if (typeof this.startHardeMuziek === 'function') {
                this.startHardeMuziek();
            }
            this.gameState = 'PLAYING';

            // Verwijder de tekst na een korte pauze
            this.time.delayedCall(500, () => {
                if (this.battleCountdown && this.battleCountdown.active) {
                    this.tweens.add({ 
                        targets: this.battleCountdown, 
                        alpha: 0, 
                        scale: 2, 
                        duration: 300, 
                        onComplete: () => {
                            if (this.battleCountdown) this.battleCountdown.destroy();
                        }
                    });
                }
            });
        }
    },
    callbackScope: this
});



    // 10. Bots kunnen nu ook power-ups oppakken
    this.physics.add.overlap(this.botsGroup, this.powerupsGroup, (botSprite, pUpSprite) => {
        const bot = this.bots.find(b => b.sprite === botSprite);
        const pUp = pUpSprite.instance;

        // Alleen oppakken als de bot leeft en de power-up bestaat
        if (bot && pUp && botSprite.visible) {
            if (pUp.type === 'X2') {
                // Bots krijgen direct 5 extra hosts bij een X2
                this.giveInitialHosts(bot, 5);
                bot.sprite.setTint(0xff4444); // Geef de bot een rode gloed als hij sterker wordt
                this.time.delayedCall(500, () => bot.sprite.clearTint());
            } else {
                // Activeer Speed of Magnet voor de bot
                bot.applyPowerup(pUp.type);
            }
            pUp.destroy(); // Verwijder de power-up van de kaart
        }
    }, null, this);






// Laat bots elkaar ook kunnen doden!
this.physics.add.overlap(this.botsGroup, this.botsGroup, (botSpriteA, botSpriteB) => {
    if (botSpriteA === botSpriteB) return;

    const botA = this.bots.find(b => b.sprite === botSpriteA);
    const botB = this.bots.find(b => b.sprite === botSpriteB);

    // CRUCIALE FIX: Check of een van de bots al bezig is met doodgaan
    if (!botA || !botB || this.gameState !== 'PLAYING') return;
    if (!botA.sprite.visible || !botB.sprite.visible) return;
    if (botA.isImmune || botB.isImmune) return;
    
    // Voorkom dubbele melding: als een bot al "dood" gemarkeerd is deze frame, stop.
    if (botA.isDying || botB.isDying) return;

    const powerA = this.getArmyPower(botA);
    const powerB = this.getArmyPower(botB);

    if (powerA > powerB) {
        botB.isDying = true; // Markeer direct als stervend
        this.handleKill(botA, botB);
        // Zet na een kleine delay weer op false voor respawn (indien nodig)
        this.time.delayedCall(100, () => { if(botB) botB.isDying = false; });
        
    } else if (powerB > powerA) {
        botA.isDying = true; // Markeer direct als stervend
        this.handleKill(botB, botA);
        this.time.delayedCall(100, () => { if(botA) botA.isDying = false; });
    }
}, null, this);




// Laat de speler bots kunnen killen (en andersom!)
this.physics.add.overlap(this.player.sprite, this.botsGroup, (playerSprite, botSprite) => {
    const bot = this.bots.find(b => b.sprite === botSprite);
    
    // Basis checks: Leeft de bot, is het spel bezig?
    if (!bot || !bot.sprite.visible || this.gameState !== 'PLAYING') return;

    const playerPower = this.getArmyPower(this.player);
    const botPower = this.getArmyPower(bot);

    if (playerPower > botPower) {
        // --- JIJ WINT ---
        if (!bot.isImmune) {
            this.handleKill(this.player, bot);
            
            // UPDATE DE KILL COUNTER HIER
            this.updateKillCount(); 
            
            this.cameras.main.shake(200, 0.01); 
        }
    } else if (botPower > playerPower) {
// --- DE BOT WINT (JIJ GAAT DOOD) ---
        if (!this.player.isInvincible) {
            // 1. De bot krijgt de kill credits
            this.handleKill(bot, this.player); 
            
            // 2. Zet status op DEAD
            this.gameState = 'DEAD';

            // 3. TRIGGER DIRECT HET GELUID IN MAIN.JS
            window.dispatchEvent(new CustomEvent('player_died'));

            // 4. STOP de game muziek
            if (this.gameSnd) {
                this.gameSnd.stop();
            }

            // 5. Visuele effecten (gebeuren nu tegelijk met het geluid)
            this.cameras.main.shake(500, 0.02);
            this.cameras.main.fadeOut(1000, 50, 0, 0); 
            
            // 6. Death screen laten zien (na de animatie)
            this.time.delayedCall(1200, () => {
                const ds = document.getElementById('death-screen');
                if (ds) {
                    ds.style.display = 'flex';
                }
                const lb = document.getElementById('leaderboard');
                if (lb) lb.style.display = 'none';
                
                this.physics.pause();
            });
        }
    }
}, null, this);






    
}














updateKillCount() {
    this.kills++;
    const scoreElement = document.getElementById('kill-score');
    
    if (scoreElement) {
        // Update het getal
        scoreElement.innerText = this.kills;

        // Reset animatie (voor als je heel snel achter elkaar killt)
        scoreElement.style.transition = "none";
        scoreElement.style.transform = "translate(-50%, -50%) scale(1)";
        
        // Forceer een kleine vertraging voor de nieuwe animatie
        setTimeout(() => {
            scoreElement.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            scoreElement.style.transform = "translate(-50%, -50%) scale(1.6)";
            scoreElement.style.color = "#ffffff"; // Kleurt even wit voor effect
            
            // Na 200ms weer terug naar normaal
            setTimeout(() => {
                scoreElement.style.transform = "translate(-50%, -50%) scale(1)";
                scoreElement.style.color = "#32ff00"; // Terug naar parasite groen
            }, 200);
        }, 10);
    }
}





















    setupUI() {
        const pauseBtn = document.getElementById('pause-toggle');
        if (pauseBtn) pauseBtn.onclick = () => this.togglePause();
        
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) resumeBtn.onclick = () => this.togglePause();

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) quitBtn.onclick = () => window.location.reload();

        const reviveBtn = document.getElementById('revive-btn');
        if (reviveBtn) {
            reviveBtn.onclick = () => {
                let count = 5;
                reviveBtn.disabled = true;
                this.time.addEvent({
                    delay: 1000, 
                    repeat: 5,
                    callback: () => {
                        reviveBtn.innerText = `REVIVING IN ${count}...`;
                        if (count <= 0) { 
                            this.revivePlayer(); 
                            reviveBtn.innerText = "WATCH AD TO REVIVE";
                            reviveBtn.disabled = false;
                        }
                        count--;
                    }
                });
            };
        }
    }

    /**
     * Calculates total army power.
     * Prevents the leaderboard from dropping when merging 7 units into 1.
     */
    getArmyPower(p) {
        let total = 0;
        p.infectedHosts.forEach(h => {
            // Uses the power value from Host.js (Lvl 2 = 7 pts, etc)
            total += h.getPowerValue ? h.getPowerValue() : 1;
        });
        return total;
    }

    /**
     * Merging Logic: 7 units of the same level merge into 1 unit of level + 1
     */
processEvolutions(p) {
    for (let lvl = 1; lvl <= 3; lvl++) {
        let matches = p.infectedHosts.filter(h => h.level === lvl);
        
        if (matches.length >= 7) {
            // 1. GELUID (Met extra check tegen 404/not found)
            if (!p.isBot && this.cache.audio.exists('lvlup_snd')) {
                try {
                    this.sound.play('lvlup_snd', { volume: 0.6 });
                } catch (e) {
                    console.log("Geluid kon niet spelen:", e);
                }
            }

            // 2. BERICHT BOVEN DE SPELER
            if (!p.isBot) {
                this.showEvolutionPop(p, 7, lvl, lvl + 1);
            }

            // 3. VERWIJDER 7 OUDE UNITS
            matches.slice(0, 7).forEach(h => {
                p.infectedHosts = p.infectedHosts.filter(item => item !== h);
                this.hosts = this.hosts.filter(item => item !== h);
                h.destroy();
            });

            // 4. MAAK DE NIEUWE UNIT
            let evolved = new Host(this, p.sprite.x, p.sprite.y, lvl + 1);
            evolved.infect();
            evolved.owner = p;
            this.hosts.push(evolved);
            p.addInfection(evolved);

            // 5. DE "POEF" ANIMATIE (Verbeterde versie)
            if (evolved.sprite) {
                // We pakken de huidige scale als basis (bijv. 1) en doen dat x 1.2
                // Dit voorkomt dat de host ineens gigantisch wordt
                const targetScale = evolved.sprite.scale * 1.2;

                this.tweens.add({
                    targets: evolved.sprite,
                    scale: targetScale,
                    duration: 120,    // Iets sneller voor een pittige 'poef'
                    yoyo: true,       // Netjes terug naar normale grootte
                    ease: 'Quad.easeInOut'
                });
            }

            // 6. SUBTIELE TRILLING
            this.cameras.main.shake(150, 0.004);
            
            // Check of de nieuwe unit weer een evolutie start
            this.processEvolutions(p); 
        }
    }
}

// Deze hulp-functie zorgt voor de zwevende tekst
showEvolutionPop(player, count, oldLevel, newLevel) {
    const msg = `Your ${count} hosts of lvl ${oldLevel} transformed into lvl ${newLevel}!`;
    
    const popup = this.add.text(player.sprite.x, player.sprite.y - 80, msg, {
        fontSize: '22px',
        fill: '#00ff88', // Felgroen/geel
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center'
    }).setOrigin(0.5).setDepth(2000);

    // Animatie: Zweef omhoog en fade uit
    this.tweens.add({
        targets: popup,
        y: popup.y - 100,
        alpha: 0,
        duration: 3000,
        ease: 'Cubic.easeOut',
        onComplete: () => popup.destroy()
    });
}

update(time, delta) {


        if (this.isTutorial) {
                this.updateTutorial();
            }



    if (!this.player || this.gameState !== 'PLAYING') return;











if (window.location.href.includes('battle.html') && this.player.followers <= 0) {
    const menu = document.getElementById('battle-death-menu');
    if (menu && menu.style.display === 'none') {
        menu.style.display = 'block';
        this.physics.pause();
    }
}










// --- BATTLE MODE ANTI-CRASH ---
    if (window.location.href.includes('battle.html')) {
        // Zodra je op 0 staat of per ongeluk op DEAD springt: DIRECT HERSTELLEN
        if (this.player.followers <= 0 || this.gameState === 'DEAD') {
            this.forceBattleRespawn();
            return; // Stop de rest van de update voor deze frame
        }
    }




// --- BATTLE MODE ANTI-DIE SYSTEM ---
    if (window.location.href.includes('battle.html')) {
        // Als je 0 volgers hebt OF de status op DEAD staat, dwing een respawn af!
        if (this.player.followers <= 0 || this.gameState === 'DEAD') {
            
            console.log("0 Host respawn geactiveerd");

            // 1. Reset Camera & Status
            if (this.cameras.main.resetFX) this.cameras.main.resetFX();
            this.cameras.main.setAlpha(1);
            this.gameState = 'PLAYING';

            // 2. Geef 3 nieuwe hosts
            this.player.followers = 3;
            if (this.ui) this.ui.updateScore(3);
            if (this.giveInitialHosts) this.giveInitialHosts(this.player, 3);

            // 3. Teleporteer naar veiligheid
            this.player.sprite.x = Phaser.Math.Between(500, CONFIG.WORLD.WIDTH - 500);
            this.player.sprite.y = Phaser.Math.Between(500, CONFIG.WORLD.HEIGHT - 500);
            this.player.sprite.setVisible(true);

            // 4. Onkwetsbaarheid
            this.player.isInvincible = true;
            this.tweens.add({
                targets: this.player.sprite,
                alpha: 0.3,
                duration: 150,
                yoyo: true,
                repeat: 10,
                onComplete: () => {
                    this.player.isInvincible = false;
                    this.player.sprite.setAlpha(1);
                }
            });

            return; // Stop de rest van de update voor deze frame
        }
    }
















// --- LEADERBOARD LOGIC ---
const sorted = [this.player, ...this.bots].sort((a, b) => this.getArmyPower(b) - this.getArmyPower(a));

// We noemen hem nu 'leader' zodat je andere code niet crasht
const leader = sorted[0]; 

// CHECK VOOR NIEUWE LEIDER
if (leader && this.lastLeader && leader !== this.lastLeader) {
    // Alleen aankondigen als de score hoog genoeg is (bijv. meer dan 5)
    if (this.getArmyPower(leader) > 5) {
        const leaderColor = (leader === this.player) ? "#00ff88" : "#ffd700";
        const msg = (leader === this.player) ? "YOU ARE THE NEW LEADER!" : `${leader.name} IS THE NEW LEADER!`;
        
        // 1. Toon de tekst op het scherm
        this.showAnnouncement(msg, leaderColor);

        // 2. SPEEL DE LEADER SOUND (leader.mp3)
        if (this.cache.audio.exists('leader_snd')) {
            this.sound.play('leader_snd', { volume: 0.25 });
        }
    }
}
this.lastLeader = leader;

// --- UPDATE DE HTML LIJST (Leaderboard UI) ---
let lbHTML = "";

// 1. Vind jouw positie in de volledige lijst (sorted bevat alle spelers)
const myRank = sorted.findIndex(p => p === this.player) + 1;
const myScore = this.getArmyPower(this.player);

// 2. Toon de Top 5
sorted.slice(0, 5).forEach((p, i) => {
    const color = p === this.player ? "#00ff88" : "#ff4444";
    const score = this.getArmyPower(p);
    lbHTML += `<li class="lb-item"><span style="color:${color}">${i+1}. ${p.name}</span>: ${score}</li>`;
});

// 3. Als jij NIET in de top 5 staat, voeg jezelf onderaan toe
if (myRank > 5) {
    lbHTML += `<hr style="border: 0; border-top: 1px solid #555; margin: 5px 0;">`;
    lbHTML += `<li class="lb-item"><span style="color:#00ff88">${myRank}. ${this.player.name}</span>: ${myScore}</li>`;
}

const lbContainer = document.getElementById('lb-list');
if (lbContainer) lbContainer.innerHTML = lbHTML;


// --- DEATH CHECK (Zonder de freeze!) ---
if (this.player.infectedHosts.length === 0 && this.gameState === 'PLAYING') {
    this.gameState = 'DEAD';
    
    // TRIGGER DIRECT HET GELUID IN MAIN.JS
    window.dispatchEvent(new CustomEvent('player_died'));
    
    // Stop de game muziek, start de menu muziek zachtjes
    if (this.gameSnd) this.gameSnd.stop();
    if (this.menuSnd && !this.menuSnd.isPlaying) {
        this.menuSnd.play({ volume: 0.1, loop: true });
    }

    this.player.die(); 
    this.cameras.main.shake(500, 0.02);
    this.cameras.main.fadeOut(1000, 50, 0, 0); 
    
    this.time.delayedCall(1200, () => {
        // Nu pas pauzeren en scherm tonen om vastlopen te voorkomen
        this.physics.pause();
        const ds = document.getElementById('death-screen');
        if (ds) ds.style.display = 'flex';
        const lb = document.getElementById('leaderboard');
        if (lb) lb.style.display = 'none';
    });
}


        // --- MAIN GAMEPLAY LOOP ---
        [this.player, ...this.bots].forEach(p => {
            p.update(this.input.activePointer, delta, this.hosts, this.bots, p === leader);
            
            this.hosts.forEach(h => {
                let d = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, h.sprite.x, h.sprite.y);
                
                // Infection Logic (Wild Hosts)
                if (!h.infected && d < p.getInfectionRange()) {
                    if (h.infect()) { 
                        h.owner = p; 
                        p.addInfection(h); 
                        this.processEvolutions(p); 
                    }
                }
                
                // Stealing Logic (Hostile Units)
                // Can only steal if your total Army Power is higher than the current owner's
                if (h.infected && h.owner !== p && d < p.getInfectionRange() * 0.7) {
                    if (!h.owner.isImmune && this.getArmyPower(p) > this.getArmyPower(h.owner)) {
                        h.owner.infectedHosts = h.owner.infectedHosts.filter(item => item !== h);
                        h.owner = p; 
                        p.addInfection(h); 
                        this.processEvolutions(p);
                    }
                }
            });
        });







// --- MAIN GAMEPLAY LOOP ---
        [this.player, ...this.bots].forEach(p => {
            // Check of de speler/bot nog leeft voordat we updaten
            if (!p.sprite || !p.sprite.active) return;

            p.update(this.input.activePointer, delta, this.hosts, this.bots, p === leader);
            
            this.hosts.forEach(h => {
                let d = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, h.sprite.x, h.sprite.y);
                
                // Infection Logic (Wild Hosts)
                if (!h.infected && d < p.getInfectionRange()) {
                    if (h.infect()) { 
                        h.owner = p; 
                        p.addInfection(h); 
                        this.processEvolutions(p); 
                    }
                }
                
                // Stealing Logic (Hostile Units)
                if (h.infected && h.owner !== p && d < p.getInfectionRange() * 0.7) {
                    if (!h.owner.isImmune && this.getArmyPower(p) > this.getArmyPower(h.owner)) {
                        h.owner.infectedHosts = h.owner.infectedHosts.filter(item => item !== h);
                        h.owner = p; 
                        p.addInfection(h); 
                        this.processEvolutions(p);
                    }
                }
            });
        }); 

// --- STIP LOGICA (INDICATORS) ---
        this.bots.forEach(bot => {
            // NOODSTOP: Als de bot dood is of onzichtbaar, wis de stip en stop direct
            if (!bot.sprite || !bot.sprite.active || !bot.sprite.visible) {
                if (bot.indicator) bot.indicator.clear();
                return; 
            }

            // TEKEN DE STIP
            bot.indicator.clear();
            
            // Forceer de stip ALTIJD op de bovenste laag
            bot.indicator.setDepth(200);

            const myPower = this.getArmyPower(this.player);
            const botPower = this.getArmyPower(bot);
            
            let color = (botPower > myPower) ? 0xff0000 : (Math.abs(botPower - myPower) <= 2 ? 0xffa500 : 0x00ff00);

            const pulse = (Math.sin(this.time.now / 200) * 0.2) + 0.8; 
            const radius = 8 * pulse; 
            
            // NU OP -170: Dit is de hoogste stand voor maximale duidelijkheid
            const offsetY = bot.sprite.y - 200; 

            // 1. Glow effect
            bot.indicator.fillStyle(color, 0.3).fillCircle(bot.sprite.x, offsetY, radius + 5);
            
            // 2. Kern van de stip
            bot.indicator.fillStyle(color, 1).fillCircle(bot.sprite.x, offsetY, radius);
            
            // 3. Glans (wit stipje)
            bot.indicator.fillStyle(0xffffff, 0.8).fillCircle(bot.sprite.x - 2, offsetY - 2, radius / 3);
        });
        // --- HIERONDER GAAT JE OUDE CODE WEER VERDER ---
        this.hosts.forEach(h => h.update(delta));










        // Update Host movements
        this.hosts.forEach(h => h.update(delta));
        
        // Update Minimap and Crown
        this.drawMinimap(leader);
        if (leader && leader.infectedHosts.length > 0) {
            this.crownIcon.setVisible(true).setPosition(leader.sprite.x, leader.sprite.y - 85);
        }

        // Maintain wild host population
        if (this.hosts.filter(h => !h.infected).length < CONFIG.HOST.MIN_COUNT) {
            this.spawnHost();
        }



    







this.bots.forEach(bot => {
    bot.update(); 

    bot.indicator.clear();

    if (bot.sprite.active) {
        const myPower = this.getArmyPower(this.player);
        const botPower = this.getArmyPower(bot);
        
        let color;
        if (botPower > myPower) {
            color = 0xff0000; // Rood
        } else if (Math.abs(botPower - myPower) <= 2) {
            color = 0xffa500; // Oranje
        } else {
            color = 0x00ff00; // Groen
        }

        // --- JUICY STYLING BOVEN DE NAAM ---
        
        const pulse = (Math.sin(this.time.now / 200) * 0.2) + 0.8; 
        const radius = 8 * pulse; // Iets kleiner gemaakt voor een subtielere look
        
        // We gebruiken nu -95 om boven de naamtekst uit te komen
        const offsetY = bot.sprite.y - 95; 

        // 1. Glow effect (zachte gloed)
        bot.indicator.fillStyle(color, 0.3);
        bot.indicator.fillCircle(bot.sprite.x, offsetY, radius + 5);

        // 2. De kern van de stip
        bot.indicator.fillStyle(color, 1);
        bot.indicator.fillCircle(bot.sprite.x, offsetY, radius);
        
        // 3. Glans-effect (het witte stipje voor 3D look)
        bot.indicator.fillStyle(0xffffff, 0.8);
        bot.indicator.fillCircle(bot.sprite.x - 2, offsetY - 2, radius / 3);
    }
});









// Inside your GameScene.js update()
if (this.player.infectedHosts.length === 0 && this.gameState === 'PLAYING') {
    this.gameState = 'DEAD';
    
    // 1. AUDIO WISSEL
    // Stop de harde leader muziek direct
    if (this.gameSnd) {
        this.gameSnd.stop();
    }
    
    // Start de rustige menu muziek weer op (laag volume)
    if (this.menuSnd && !this.menuSnd.isPlaying) {
        this.menuSnd.play({ volume: 0.1, loop: true });
    }

    // 2. VISUELE EFFECTEN
    this.player.die(); 
    this.cameras.main.shake(500, 0.02);
    // Extra: fade een beetje naar zwart/rood voor sfeer
    this.cameras.main.fadeOut(1000, 50, 0, 0); 
    
    // 3. UI TONEN
    this.time.delayedCall(1200, () => {
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.style.display = 'flex';
        }
        
        // Verberg de leaderboard zodat het scherm minder vol is
        const lb = document.getElementById('leaderboard');
        if (lb) lb.style.display = 'none';
    });
}





}










handleKill(killer, victim) {
    victim.die();
    this.giveInitialHosts(killer, 3);

    this.addKillToFeed(killer.name, victim.name, killer === this.player, victim === this.player);

    const currentTime = this.time.now;
    if (!killer.lastKillTime) killer.lastKillTime = 0;
    if (!killer.killStreak) killer.killStreak = 0;

    if (currentTime - killer.lastKillTime < 9000) {
        killer.killStreak++;
    } else {
        killer.killStreak = 1;
    }
    killer.lastKillTime = currentTime;

    let msg = "";
    let color = "#ffffff";
    let soundKey = null;

    // --- DE STREAK LADDER (GEFIXT) ---
    if (killer.killStreak === 1) {
        msg = "FIRST BLOOD"; color = "#00ff88"; soundKey = 'clickPop';
    } else if (killer.killStreak === 2) {
        msg = "DOUBLE KILL"; color = "#00d4ff"; soundKey = 'db_snd';
    } else if (killer.killStreak === 3) {
        msg = "TRIPLE KILL"; color = "#ffff00"; soundKey = 'tp_snd';
    } else if (killer.killStreak === 4) {
        msg = "KILLING SPREE!"; color = "#ff8800"; soundKey = 'qp_snd';
    } else if (killer.killStreak === 5) {
        msg = "DOMINATING!!"; color = "#ff5900"; soundKey = 'dm_snd';
    } else if (killer.killStreak >= 6 && killer.killStreak < 10) {
        msg = "ON A RAMPAGE!!!"; color = "#ff4444"; soundKey = 'rp_snd';
    } else if (killer.killStreak >= 10 && killer.killStreak < 15) {
        msg = "GODLIKE!!!"; color = "#ff0000"; 
        soundKey = 'godlike_snd'; // <--- GEFIXT (was rp_snd)
    } else if (killer.killStreak >= 15 && killer.killStreak < 25) {
        msg = "UNSTOPPABLE!!!"; color = "#ff005d"; 
        soundKey = 'unstoppable_snd'; // <--- GEFIXT
    } else if (killer.killStreak >= 25 && killer.killStreak < 50) {
        msg = "WICKED SICK!!!!"; color = "#8800ff"; 
        soundKey = 'wickedsick_snd'; // <--- GEFIXT
    } else if (killer.killStreak >= 50 && killer.killStreak < 100) {
        msg = "MONSTER KILL!!!!"; color = "#560000"; 
        soundKey = 'monsterkill_snd'; // <--- GEFIXT
    } else if (killer.killStreak >= 100) {
        msg = `NUCLEAR: ${killer.killStreak} KILLS!!!!`; color = "#ffff00"; // Geel ipv zwart voor zichtbaarheid
        soundKey = 'nuclear_snd'; // <--- GEFIXT (Dit speelt Holy.mp3 af)
    }

    if (killer === this.player) {
        // EXTRA CHECK: Controleer in de console of het geluid bestaat
        if (soundKey && this.cache.audio.exists(soundKey)) {
            this.sound.play(soundKey, { volume: 1.0 });
        } else {
            console.error("FOUT: Geluid " + soundKey + " niet gevonden in cache!");
        }

        if (msg !== "") this.showAnnouncement(msg, color);
        let shakeIntensity = Math.min(0.05, 0.005 * killer.killStreak); 
        this.cameras.main.shake(250, shakeIntensity);
    } else if (killer.killStreak >= 2) {
        this.showAnnouncement(`${killer.name}: ${msg}`, color);
    }
}
























    
    spawnHost() {
        const h = new Host(this, Phaser.Math.Between(100, CONFIG.WORLD.WIDTH-100), Phaser.Math.Between(100, CONFIG.WORLD.HEIGHT-100), 1);
        this.hosts.push(h);
    }






    showEvolutionPop(player, count, oldLevel, newLevel) {
    // Maak de tekst aan
    const msg = `Your ${count} hosts of lvl ${oldLevel} transformed into lvl ${newLevel}!`;
    
    const popup = this.add.text(player.sprite.x, player.sprite.y - 100, msg, {
        fontSize: '20px',
        fill: '#ffff00', // Geel voor level ups
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(1000);

    // Animatie: omhoog zweven en verdwijnen
    this.tweens.add({
        targets: popup,
        y: popup.y - 80,
        alpha: 0,
        duration: 2500,
        ease: 'Power1',
        onComplete: () => popup.destroy()
    });
}















    giveInitialHosts(target, count) {
        for(let i=0; i<count; i++) {
            let h = new Host(this, target.sprite.x, target.sprite.y, 1);
            this.hosts.push(h); h.infect(); h.owner = target; target.addInfection(h);
        }
    }




togglePause() {
    const scene = window.game.scene.getScene('GameScene');
    const pauseScreen = document.getElementById('pause-screen');

    if (scene.gameState === 'DEAD' || scene.gameState === 'WAITING') return;

    // HIER MAG GEEN SOUND PLAY MEER STAAN! main.js doet dit al.

    if (scene.gameState === 'PLAYING') {
        scene.gameState = 'PAUSED';
        scene.physics.pause();
        scene.scene.pause(); 
        pauseScreen.style.display = 'flex';
        pauseScreen.classList.add('ui-active');
    } else {
        scene.gameState = 'PLAYING';
        scene.physics.resume();
        scene.scene.resume();
        pauseScreen.style.display = 'none';
        pauseScreen.classList.remove('ui-active');
    }
}





revivePlayer() {
    // --- TRIGGER DIRECT HET REVIVE GELUID IN MAIN.JS ---
    window.dispatchEvent(new CustomEvent('player_revived'));

    // 1. Audio Wissel: Stop de rustige muziek en start de leader muziek
    if (this.menuSnd) {
        this.menuSnd.stop(); 
    }

    if (this.gameSnd) {
        this.gameSnd.play();
        this.gameSnd.setVolume(0.3); // Lekker laag op de achtergrond (30%)
    }

    // 2. Hide the death screen
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) deathScreen.style.display = 'none';

    // 3. Reset UI elementen (Leaderboard weer aan)
    const lb = document.getElementById('leaderboard');
    if (lb) lb.style.display = 'block';

    // 4. Reset Player Visuals & Physics
    this.player.sprite.setVisible(true);
    this.player.sprite.setAlpha(1);
    this.player.sprite.body.enable = true; 
    this.player.sprite.body.setVelocity(0, 0); 
    
    if(this.player.glow) this.player.glow.setVisible(true);
    if(this.player.nameText) this.player.nameText.setVisible(true);

    // 5. Geef een start-leger zodat je niet direct weer doodgaat
    this.giveInitialHosts(this.player, 5);

    // 6. Tijdelijke onkwetsbaarheid (Groene tint)
    this.player.isInvincible = true;
    this.player.sprite.setTint(0x00ff88); 
    this.time.delayedCall(2000, () => {
        this.player.isInvincible = false;
        this.player.sprite.clearTint();
    });

    // 7. Spel weer activeren
    this.gameState = 'PLAYING';
    this.physics.resume(); 
    
    // 8. Camera effect: Van wit/groen weer naar normaal
    this.cameras.main.fadeIn(500, 0, 255, 136);
}


drawMinimap(leader) {
    this.uiGraphics.clear();
    const mapSize = 220;
    const posX = 25;
    const posY = CONFIG.HEIGHT - mapSize - 25;
    
    // --- CHECK VOOR BATTLE MODE KLEUR ---
    const isBattle = window.location.pathname.includes('battle.html');
    const themeColor = isBattle ? 0x00f2ff : 0x00ff88; // Blauw voor Battle, Groen voor Endless

    // 1. Draw Map Border/Background (Nu met dynamische kleur)
    this.uiGraphics.fillStyle(0x000000, 0.6);
    this.uiGraphics.lineStyle(3, themeColor, 0.6); // De rand wordt blauw of groen
    this.uiGraphics.fillRoundedRect(posX, posY, mapSize, mapSize, 15);
    this.uiGraphics.strokeRoundedRect(posX, posY, mapSize, mapSize, 15);
    
    const ratio = mapSize / CONFIG.WORLD.WIDTH;
    
    // 2. Draw Bots (Red or Gold if leading)
    this.bots.forEach(b => {
        this.uiGraphics.fillStyle(b === leader ? 0xffd700 : 0xff4444, 1);
        this.uiGraphics.fillCircle(posX + b.sprite.x * ratio, posY + b.sprite.y * ratio, 2);
    });
    
    // 3. Draw Player (Nu met dynamische kleur)
    this.uiGraphics.fillStyle(themeColor, 1); // Jouw stipje wordt ook blauw of groen
    this.uiGraphics.fillCircle(posX + this.player.sprite.x * ratio, posY + this.player.sprite.y * ratio, 4);
}



showAnnouncement(message, color = '#ffff00') {
    const el = document.getElementById('announcement-text');
    if (!el) return;

    el.innerText = message;
    el.style.color = color;
    el.style.display = 'block';

    // EFFECT: Laat de tekst even 'poppen' (groot naar klein)
    el.animate([
        { transform: 'scale(0.5)', opacity: 0 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1)', opacity: 1 }
    ], {
        duration: 300,
        easing: 'ease-out'
    });

    if (this.announcementTimer) this.announcementTimer.remove();
    this.announcementTimer = this.time.delayedCall(3000, () => {
        // Fade out effectje voordat hij echt verdwijnt
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
        this.time.delayedCall(500, () => { el.style.display = 'none'; });
    });
}





startHardeMuziek() {
        console.log("Countdown klaar: Wisselen naar GAME muziek!");

        // 1. STOP DE HTML MENU MUZIEK DIRECT (Als die via window.menuMusic draait)
        if (window.menuMusic) {
            try {
                window.menuMusic.pause();
                window.menuMusic.volume = 0;
                window.menuMusic.currentTime = 0;
                console.log("HTML Menu muziek direct uitgezet.");
            } catch (e) {
                console.warn("Kon HTML muziek niet stoppen:", e);
            }
        }

        // 2. STOP DE PHASER MENU MUZIEK (Als die via this.menuSnd draait)
        if (this.menuSnd) {
            if (this.menuSnd.isPlaying) {
                this.menuSnd.stop();
            }
        }

        // 3. START DE GAME MUZIEK (game.mp3)
        if (this.gameSnd) {
            // Eerst stoppen voor de zekerheid, zodat hij niet dubbel gaat
            this.gameSnd.stop();

            // Start de muziek op volume 0 (stil) en loop aan
            this.gameSnd.play({ volume: 0, loop: true });
            
            // Fade-in effect: Van 0 naar 0.35 over 1 seconde
            this.tweens.add({
                targets: this.gameSnd,
                volume: 0.35, // 35% volume is fijn voor achtergrond
                duration: 1000,
                ease: 'Linear'
            });
        }

        // 4. VISUELE FEEDBACK
        // Een kleine schok van de camera voor actie-effect
        this.cameras.main.shake(300, 0.01); 
        console.log("Game muziek draait nu.");
    }






addKillToFeed(killerName, victimName, isPlayerKiller, isPlayerVictim) {
    const feed = document.getElementById('kill-feed');
    if (!feed) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'kill-msg';

    // Kleuren bepalen
    const killerColor = isPlayerKiller ? "#00ff88" : "#ff4444";
    const victimColor = isPlayerVictim ? "#00ff88" : "#ff4444";

    msgDiv.innerHTML = `<span style="color:${killerColor}; font-weight:bold;">${killerName}</span> 
                        <span style="color:#bbb;">infected</span> 
                        <span style="color:${victimColor}; font-weight:bold;">${victimName}</span>`;

    feed.appendChild(msgDiv);

    // Verwijder het element uit de HTML na 4 seconden (match met CSS animatie)
    setTimeout(() => {
        msgDiv.remove();
    }, 4000);
}









// Voeg dit toe in je GameScene class
playMenuClick() {
    if (this.sound.cache.exists('clickPop')) {
        this.sound.play('clickPop', { volume: 0.5 });

    }
    



}






respawnPlayer() {
    console.log("Battle Respawn veilig geactiveerd!");

    // 1. CAMERA RESET (Vervangt stopFX)
    this.cameras.main.resetFX(); // Dit wist alle lopende fades/shakes
    this.cameras.main.setAlpha(1);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // 2. STATUS HERSTEL
    this.gameState = 'PLAYING';
    this.physics.resume();

    // 3. SCORE & VOLGERS RESET
    this.player.followers = 3;
    if (this.ui) this.ui.updateScore(3);
    
    // Geef fysieke volgers terug
    if (this.giveInitialHosts) {
        this.giveInitialHosts(this.player, 3);
    }

    // 4. VERPLAATS SPELER
    const spawnX = Phaser.Math.Between(500, CONFIG.WORLD.WIDTH - 500);
    const spawnY = Phaser.Math.Between(500, CONFIG.WORLD.HEIGHT - 500);
    this.player.sprite.setPosition(spawnX, spawnY);
    this.player.sprite.setVisible(true);
    this.player.sprite.setAlpha(1);

    // 5. KNIPPEREN (Onkwetsbaar)
    this.player.isInvincible = true;
    this.tweens.add({
    
        targets: this.player.sprite,
        alpha: 0.2,
        duration: 150,
        yoyo: true,
        repeat: 8,
        onComplete: () => {
            this.player.isInvincible = false;
            this.player.sprite.setAlpha(1);
        }
    });

    window.dispatchEvent(new CustomEvent('player_died'));
}















forceBattleRespawn() {
    // 1. Reset Camera (stopt het rode scherm)
    if (this.cameras.main.resetFX) this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // 2. Reset Status en Besturing
    this.gameState = 'PLAYING';
    if (this.physics.world.paused) this.physics.resume();

    // 3. Reset Volgers (Altijd 3 als starter pack)
    this.player.followers = 3;
    if (this.ui) this.ui.updateScore(3);
    if (typeof this.giveInitialHosts === 'function') {
        this.giveInitialHosts(this.player, 3);
    }

    // 4. Teleporteer naar veilige plek
    const spawnX = Phaser.Math.Between(500, CONFIG.WORLD.WIDTH - 500);
    const spawnY = Phaser.Math.Between(500, CONFIG.WORLD.HEIGHT - 500);
    this.player.sprite.setPosition(spawnX, spawnY);
    this.player.sprite.setVisible(true);
    this.player.sprite.setAlpha(1);

    // 5. Onkwetsbaarheid
    this.player.isInvincible = true;
    this.tweens.add({
        targets: this.player.sprite,
        alpha: 0.3,
        duration: 150,
        yoyo: true,
        repeat: 10,
        onComplete: () => {
            this.player.isInvincible = false;
            this.player.sprite.setAlpha(1);
        }
    });

    window.dispatchEvent(new CustomEvent('player_died'));
}






















    triggerAntibiotics() {
    // Maak het scherm rood voor effect
    this.cameras.main.flash(1000, 255, 0, 0);
    
    // Voeg een tekst toe in het midden van het scherm
    let sprayText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'ANTIBIOTICA SPRAY!', {
        fontSize: '80px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0);

    // Stop alle beweging in de game
    this.physics.pause();
}


}
