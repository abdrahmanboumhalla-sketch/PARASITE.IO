class PowerUp {
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.type = type;

        // Visual Colors
        let color = 0x00ff88; // Speed (Green)
        if (type === 'MAGNET') color = 0xff00ff; // Magnet (Pink)
        if (type === 'X2') color = 0xffff00; // x2 Host (Yellow)

        this.ring = scene.add.circle(x, y, CONFIG.POWERUP.SIZE * 0.6, color, 0.2)
            .setDepth(6)
            .setStrokeStyle(3, 0xffffff);

        // This 'type' must match the load.image key ('X2')
        this.sprite = scene.physics.add.sprite(x, y, type);
        this.sprite.setDisplaySize(CONFIG.POWERUP.SIZE, CONFIG.POWERUP.SIZE);
        this.sprite.setDepth(7);
        this.sprite.body.setCircle(this.sprite.width / 2);

        scene.tweens.add({
            targets: [this.sprite, this.ring],
            y: y - 20,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.ring) this.ring.destroy();
    }
}