/* Lightweight "profile" + local leaderboard, kept in this browser's
 * localStorage: no account, nothing leaves the machine. The pilot name is
 * remembered so the player is recognised on every visit. */

export interface ScoreEntry { name: string; score: number; timeMs: number; date: number; }

const NAME_KEY = 'md.pilotName';
const SCORES_KEY = 'md.scores';
const MAX_SCORES = 10;
export const MAX_NAME_LEN = 12;

// localStorage can throw (private mode, blocked storage): never let that
// break the game, just behave as if nothing was saved.
function read (key: string): string | null
{
    try { return window.localStorage.getItem(key); } catch { return null; }
}
function write (key: string, value: string)
{
    try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export function getPilotName (): string
{
    return read(NAME_KEY) ?? '';
}

export function setPilotName (name: string)
{
    write(NAME_KEY, name);
}

export function getScores (): ScoreEntry[]
{
    try {
        const list = JSON.parse(read(SCORES_KEY) ?? '[]');
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

/** Saves the run and returns its rank (0-based) in the top list, or -1 if it didn't make it. */
export function addScore (entry: ScoreEntry): number
{
    const list = getScores();
    list.push(entry);
    // higher score first; on a tie, the longer survival wins
    list.sort((a, b) => b.score - a.score || b.timeMs - a.timeMs);
    const top = list.slice(0, MAX_SCORES);
    write(SCORES_KEY, JSON.stringify(top));
    return top.indexOf(entry);
}

export function bestScore (name: string): ScoreEntry | undefined
{
    return getScores().find((e) => e.name === name);
}

export function formatTime (ms: number): string
{
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
