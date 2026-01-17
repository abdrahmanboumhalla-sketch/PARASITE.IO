class Player {
constructor(scene, x, y, name, isBot = false, skinTexture = 'skin1') {
        // 1. Basic Setup
        this.scene = scene;
        this.name = name;
        this.isBot = isBot;
        this.baseSize = 100;
        this.infectedHosts = [];
        this.lastHostCount = 3; 
        this.powerups = { speed: 2, magnet: 2.5 };
        this.isImmune = false;
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.indicator = scene.add.graphics();
        // 2. Texture Logic: Use the skin from the Lab or fall back to 'skin1'
        const textureToUse = skinTexture || 'skin1';

        // 3. Create Sprite with Physics
        this.sprite = scene.physics.add.sprite(x, y, textureToUse);
        
        // Safety check to prevent black screen if texture fails
        if (!this.sprite) {
            console.error("Critical: Sprite could not be created with texture:", textureToUse);
            return;
        }

        // 4. Sprite Properties
        this.sprite.setDisplaySize(this.baseSize, this.baseSize).setDepth(10);
        this.sprite.setOrigin(0.5);
        this.sprite.body.setCircle(this.sprite.width / 2);
        this.sprite.body.setCollideWorldBounds(true);
        
        // 5. Visual Effects (Glow)
        const glowColor = isBot ? 0xff4444 : 0x00ff88; // Red for bots, Green for Player
        this.glow = scene.add.circle(x, y, 65, glowColor, 0.3)
            .setDepth(9)
            .setBlendMode(Phaser.BlendModes.ADD);
        
        // 6. UI (Name Tag)
        this.nameText = scene.add.text(x, y, name, { 
            fontSize: '18px', 
            fill: '#fff', 
            stroke: '#000', 
            strokeThickness: 3 
        }).setOrigin(0.5).setDepth(11);


}    
die() {
    // 1. Jouw bestaande deeltjes effect
    const particles = this.scene.add.particles(0, 0, 'PARASITE', {
        x: this.sprite.x,
        y: this.sprite.y,
        speed: { min: -300, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        gravityY: 0,
        quantity: 20,
        emitting: false
    });

    particles.explode(30);
    
    // 2. Verberg de speler/bot en zet physics uit
    // --- VERBETERDE INDICATOR LOGICA (VOOR RESPAWN) ---
    if (this.indicator) {
        this.indicator.clear();
        this.indicator.setVisible(false); // Verberg de stip ipv vernietigen
    }
    // --------------------------------------------------

    this.sprite.setVisible(false);
    if (this.sprite.body) this.sprite.body.enable = false; 
    this.glow.setVisible(false);
    this.nameText.setVisible(false);

    // Reset hun leger
    this.infectedHosts = [];

    // 3. Respawn logica (Alleen voor bots)
    if (this.isBot) {
        this.scene.time.delayedCall(5000, () => {
            this.respawn();
        });
    }
}










respawn() {
        // 1. Kies een nieuwe willekeurige locatie op de kaart
        const newX = Phaser.Math.Between(500, CONFIG.WORLD.WIDTH - 500);
        const newY = Phaser.Math.Between(500, CONFIG.WORLD.HEIGHT - 500);
        
        // 2. Zet de bot op de nieuwe plek en maak hem weer zichtbaar
        this.sprite.setPosition(newX, newY);
        this.sprite.setVisible(true);
        this.sprite.body.enable = true; // Zet physics weer aan
        this.glow.setVisible(true);
        this.nameText.setVisible(true);

        // --- HIER IS DE FIX VOOR DE STIP ---
        if (this.indicator) {
            this.indicator.setVisible(true); 
        }
        // -----------------------------------
        
        // 3. Geef ze een frisse start met een klein leger
        if (this.scene.giveInitialHosts) {
            this.scene.giveInitialHosts(this, 3);
        }
        
        // 4. Geef ze 2 seconden immuniteit (knipperen)
        this.setImmunity(2000);
        
        console.log(`${this.name} is herrezen op x:${Math.floor(newX)} y:${Math.floor(newY)}`);
    }




update(pointer, delta, hosts, allBots, isLeader) {
    if (!this.isBot && this.infectedHosts.length > 0) {
        this.lastHostCount = this.infectedHosts.length;
    }
    

    // 1. BOSS SCALING
    const targetScale = isLeader ? 1.2 : 1.0;
    const currentScale = this.sprite.scaleX;
    const baseTargetScale = (targetScale * (this.baseSize / this.sprite.width));
    
    if (Math.abs(currentScale - baseTargetScale) > 0.01) {
        const lerpScale = Phaser.Math.Linear(currentScale, baseTargetScale, 0.05);
        this.sprite.setScale(lerpScale);
        this.glow.setRadius(65 * targetScale);
    }

    // 2. SPEED CALCULATION
    const finalSpeed = (this.isBot ? CONFIG.BOT.SPEED : CONFIG.PLAYER.SPEED) * this.powerups.speed;
    
    if (this.isBot) {
        // --- BOT AI LOGIC ---
        let target = null;
        let minDist = 1500; 

        // STAP A: Zoek eerst naar de dichtstbijzijnde Power-up
        if (this.scene.powerupsGroup) {
            this.scene.powerupsGroup.getChildren().forEach(pSprite => {
                let d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, pSprite.x, pSprite.y);
                if (d < minDist) {
                    minDist = d;
                    target = pSprite; // De bot heeft een power-up gezien!
                }
            });
        }

// STAP B: Als er geen power-up dichtbij is, zoek dan naar een Host
if (!target) {
    // We halen de hosts op uit de scene
    const hosts = this.scene.hosts; 

    // Check of de lijst met hosts wel bestaat en niet leeg is
    if (hosts && Array.isArray(hosts)) {
        hosts.forEach(h => {
            // Check of de host en zijn sprite wel bestaan (tegen crashes)
            if (h && h.sprite && h.sprite.active && !h.infected) {
                let d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, h.sprite.x, h.sprite.y);
                if (d < minDist) {
                    minDist = d;
                    target = h.sprite;
                }
            }
        });
    }
}

        // STAP C: Beweeg naar het doel
        if (target && this.sprite.visible) {
            let angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.x, target.y);
            this.scene.physics.velocityFromRotation(angle, finalSpeed, this.sprite.body.velocity);
            this.sprite.rotation = angle - 1.57;
        } else {
            this.sprite.body.setVelocity(0);
        }

    } else {
        // --- PLAYER LOGIC ---
        let worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        let angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, worldPoint.x, worldPoint.y);
        
        this.sprite.rotation = angle - 1.57;
        
        if (pointer.isDown && this.sprite.visible) {
            this.scene.physics.velocityFromRotation(angle, finalSpeed, this.sprite.body.velocity);
        } else {
            this.sprite.body.setVelocity(0);
        }
    }
    
    // 3. UI POSITIONING
    this.glow.setPosition(this.sprite.x, this.sprite.y);
    this.nameText.setPosition(this.sprite.x, this.sprite.y - (70 * targetScale));
}


applyPowerup(type) {
    const duration = 10;
    const key = type.toLowerCase();
    
    // 1. IEDEREEN krijgt de boost
    this.powerups[key] = (type === 'SPEED' ? 2 : 1.7);

    if (!this.isBot) {
        // --- LOGICA VOOR DE SPELER (met UI) ---
        const el = document.getElementById(`timer-${key}`);
        const val = document.getElementById(`val-${key}`);
        if (el) el.style.display = 'block';
        let timeLeft = duration;
        if (val) val.innerText = timeLeft;

        if (this[type + '_timer']) this[type + '_timer'].remove();
        this[type + '_timer'] = this.scene.time.addEvent({
            delay: 1000, 
            repeat: duration - 1,
            callback: () => {
                timeLeft--;
                if (val) val.innerText = timeLeft;
                if (timeLeft <= 0) { 
                    if (el) el.style.display = 'none'; 
                    this.powerups[key] = 1; // Snelheid reset voor speler
                }
            }
        });
    } else {
        // --- NIEUWE LOGICA VOOR BOTS (geen UI, wel een timer!) ---
        if (this[type + '_timer']) this[type + '_timer'].remove();
        this[type + '_timer'] = this.scene.time.delayedCall(duration * 1000, () => {
            this.powerups[key] = 1; // Snelheid reset voor de bot na 8 sec
            this.sprite.clearTint(); // Haal eventuele tint weg
        });
        
        // Optioneel: geef de bot een kleurtje zodat je ziet dat hij speed heeft
        if (type === 'SPEED') this.sprite.setTint(0x00ffff);
    }
}

    setImmunity(duration) {
        this.isImmune = true;
        this.immunityTween = this.scene.tweens.add({
            targets: [this.sprite, this.glow], alpha: 0.2, duration: 200, yoyo: true, repeat: -1
        });
        this.scene.time.delayedCall(duration, () => {
            this.isImmune = false;
            if (this.immunityTween) this.immunityTween.stop();
            this.sprite.setAlpha(1);
            this.glow.setAlpha(0.3);
        });
    }

    getInfectionRange() { return (this.isBot ? CONFIG.BOT.INFECTION_RANGE : CONFIG.PLAYER.INFECTION_RANGE) * this.powerups.magnet; }
    addInfection(h) { this.infectedHosts.push(h); }
}



