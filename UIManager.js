class UIManager {
    static showPauseButton(visible) {
        const btn = document.getElementById('pause-toggle');
        if (btn) btn.style.display = visible ? 'flex' : 'none';
    }
    



    static updateLeaderboard(sortedPlayers, playerInstance, getPowerFn) {
        const lbContainer = document.getElementById('lb-list');
        if (!lbContainer) return;

        let lbHTML = "";
        sortedPlayers.slice(0, 5).forEach((p, i) => {
            const color = p === playerInstance ? "#00ff88" : "#ff4444";
            const score = getPowerFn(p);
            lbHTML += `<li class="lb-item"><span style="color:${color}">${i+1}. ${p.name}</span>: ${score}</li>`;
        });
        lbContainer.innerHTML = lbHTML;
    }

    static showDeathScreen(visible) {
        const screen = document.getElementById('death-screen');
        if (screen) {
            if (visible) screen.classList.add('ui-active');
            else screen.classList.remove('ui-active');
        }
    }
}