import StartGame from './game/main';

// Phaser draws text into canvases once, so the web fonts must be loaded
// before the first scene creates any text (otherwise it falls back to the
// default font). Don't block forever if a font fails to load.
async function loadFonts ()
{
    const fonts = ['32px "Press Start 2P"', '32px "JetBrains Mono"'];
    const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
    await Promise.race([Promise.all(fonts.map((f) => document.fonts.load(f))), timeout]);
}

document.addEventListener('DOMContentLoaded', async () => {

    await loadFonts();
    StartGame('game-container');

});
