/* Wiring shared by all 4 mockup pages: menu <-> game view toggle, the
 * altitude slider / auto-climb checkbox, and the HUD text. Each page just
 * defines a theme object and calls MDPage.init(theme). */
(function (global) {
  function init(theme) {
    const menuCanvas = document.getElementById('menuCanvas');
    const gameCanvas = document.getElementById('gameCanvas');
    const menuView = document.getElementById('menuView');
    const gameView = document.getElementById('gameView');
    const playBtn = document.getElementById('playBtn');
    const backBtn = document.getElementById('backBtn');
    const altSlider = document.getElementById('altSlider');
    const autoClimbChk = document.getElementById('autoClimb');
    const hudScore = document.getElementById('hudScore');
    const hudAlt = document.getElementById('hudAlt');
    const hudZone = document.getElementById('hudZone');
    const hudLives = document.getElementById('hudLives');

    const menuGame = MDEngine.createGame(menuCanvas, theme, null, {
      interactive: false, spawnEnemies: false, autoClimb: true, startAltitude: 0,
    });
    let liveGame = null;

    function makeHud() {
      return {
        update(s) {
          hudScore.textContent = s.score;
          hudAlt.textContent = Math.round(s.altitude);
          hudZone.textContent = s.zoneName;
          hudLives.textContent = '●'.repeat(Math.max(0, s.lives)) + '○'.repeat(Math.max(0, 3 - s.lives));
          if (document.activeElement !== altSlider) altSlider.value = Math.round(s.altitude);
        },
      };
    }

    playBtn.addEventListener('click', () => {
      menuGame.stop();
      menuView.classList.add('hidden');
      gameView.classList.remove('hidden');
      backBtn.classList.remove('hidden');
      liveGame = MDEngine.createGame(gameCanvas, theme, makeHud(), {
        interactive: true, spawnEnemies: true,
        autoClimb: autoClimbChk.checked, startAltitude: parseFloat(altSlider.value),
      });
      liveGame.start();
      gameCanvas.setAttribute('tabindex', '0');
      gameCanvas.focus();
    });

    backBtn.addEventListener('click', () => {
      if (liveGame) { liveGame.stop(); liveGame = null; }
      gameView.classList.add('hidden');
      backBtn.classList.add('hidden');
      menuView.classList.remove('hidden');
      menuGame.start();
    });

    altSlider.addEventListener('input', () => {
      const v = parseFloat(altSlider.value);
      autoClimbChk.checked = false;
      if (liveGame) { liveGame.setAutoClimb(false); liveGame.setAltitude(v); }
      else { menuGame.setAutoClimb(false); menuGame.setAltitude(v); }
    });

    autoClimbChk.addEventListener('change', () => {
      const v = autoClimbChk.checked;
      if (liveGame) liveGame.setAutoClimb(v); else menuGame.setAutoClimb(v);
    });

    menuGame.start();
  }

  global.MDPage = { init };
})(window);
