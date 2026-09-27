import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { DPR } from './config';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#04050d',
    pixelArt: true,
    roundPixels: true,
    // Fill the window exactly (no letterbox bands) and draw at the real
    // device pixel density: the canvas is DPR x the CSS size, then zoomed
    // back down by 1/DPR, so nothing gets stretched by the browser.
    scale: {
        mode: Scale.NONE,
        width: window.innerWidth * DPR,
        height: window.innerHeight * DPR,
        zoom: 1 / DPR,
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

const StartGame = (parent: string) => {

    const game = new Game({ ...config, parent });

    // dev-only handle for debugging from the browser console
    if (import.meta.env.DEV) (window as unknown as { __game: Game }).__game = game;

    window.addEventListener('resize', () => {
        game.scale.resize(window.innerWidth * DPR, window.innerHeight * DPR);
        game.scale.setZoom(1 / DPR);
    });

    return game;

};

export default StartGame;
