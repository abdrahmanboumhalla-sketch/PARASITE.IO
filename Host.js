class Host {
    constructor(scene, x, y, level = 1) {
        this.scene = scene;
        this.level = level;
        this.infected = false;
        this.owner = null;

        let textureKey = 'HOST_HEALTHY';
        if (this.level === 2) textureKey = 'lvl2';
        else if (this.level === 3) textureKey = 'lvl3';
        else if (this.level === 4) textureKey = 'lvl4';

        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        
        // --- EXTRA SMALL CALIBRATION ---
        // Lvl 1: 0.16 | Lvl 2: 0.24 | Lvl 3: 0.32 | Lvl 4: 0.40
        // (Adjust these two numbers lower if still too big)
        const finalScale = 0.08 + (this.level * 0.08); 

        if (this.sprite) {
            this.sprite.setScale(finalScale); 
            // Update the physics body to match the new tiny size
            this.sprite.body.setCircle(this.sprite.width / 2);
        }
    }

    getPowerValue() {
        return Math.pow(7, this.level - 1);
    }

    infect() {
        if (this.infected) return false;
        this.infected = true;

        if (this.level === 1) {
            this.sprite.setTexture('HOST_INFECTED');
            // Matching the new tiny Level 1 scale
            this.sprite.setScale(0.16); 
        }
        return true;
    }

update(delta) {
    if (this.infected && this.owner) {
        const army = this.owner.infectedHosts;
        const index = army.indexOf(this);
        const totalUnits = army.length;

        // 1. Angle Calculation
        const angleStep = (Math.PI * 2) / totalUnits;
        const myAngle = index * angleStep;

        // 2. EXTRA WIDE DISTANCE (Radius)
        // 160: High base distance to stay far from Parasite
        // 80: Huge gap between layers to prevent any overlap
        const radius = 160 + (Math.floor(index / 8) * 80) + (this.level * 20);

        // 3. Target Position
        const targetX = this.owner.sprite.x + Math.cos(myAngle) * radius;
        const targetY = this.owner.sprite.y + Math.sin(myAngle) * radius;

        // 4. Movement Logic
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, targetX, targetY);
        
        if (dist > 5) {
            const moveAngle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, targetX, targetY);
            // Increased follow speed to maintain the wide circle during fast turns
            let speed = 280 + (dist * 3); 
            this.scene.physics.velocityFromRotation(moveAngle, speed, this.sprite.body.velocity);
        } else {
            // Perfect sync with owner
            this.sprite.body.setVelocity(
                this.owner.sprite.body.velocity.x,
                this.owner.sprite.body.velocity.y
            );
        }
    }
}

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }
}