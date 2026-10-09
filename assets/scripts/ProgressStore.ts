export interface ProgressStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/** Only completed ratings and selected level persist; attempts restart cleanly. */
export class ProgressStore {
    static readonly key = 'assembly-line-factory.progress.v1';
    readonly stars: number[];
    lastLevel = 0;
    saveFailed = false;

    constructor(private storage: ProgressStorage, private levelCount: number) {
        this.stars = Array(levelCount).fill(0);
        try {
            const raw = storage.getItem(ProgressStore.key);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!data || data.version !== 1 || !Array.isArray(data.stars)) return;
            for (let i = 0; i < levelCount; i++) {
                const value = data.stars[i];
                if (Number.isInteger(value) && value >= 0 && value <= 3) this.stars[i] = value;
            }
            if (this.validIndex(data.lastLevel)) this.lastLevel = data.lastLevel;
        } catch { /* Missing or malformed storage falls back to a playable session. */ }
    }

    private validIndex(index: number) { return Number.isInteger(index) && index >= 0 && index < this.levelCount; }
    private save() {
        try {
            this.storage.setItem(ProgressStore.key, JSON.stringify({ version: 1, stars: this.stars, lastLevel: this.lastLevel }));
            this.saveFailed = false; return true;
        } catch { this.saveFailed = true; return false; }
    }
    select(index: number) {
        if (!this.validIndex(index)) return false;
        this.lastLevel = index; return this.save();
    }
    record(index: number, stars: number) {
        if (!this.validIndex(index) || !Number.isInteger(stars) || stars < 1 || stars > 3) return false;
        this.stars[index] = Math.max(this.stars[index], stars);
        this.lastLevel = index; return this.save();
    }
}
