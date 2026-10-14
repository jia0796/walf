// Existing stage-specific rule regressions also validate the v21 saved-game path.
// New-flow tests and complete-game stress tests use engine.createGame directly.
import {createGame as currentGame,upgradeGame} from '../public/engine.js';
import {specialBoard} from '../public/takeover.js';
export function createGame(...args){const s=currentGame(...args);if(!specialBoard(s))return s;s.version=21;delete s.takeover;return upgradeGame(s);}
