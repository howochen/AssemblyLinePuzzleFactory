export type CargoColor = 'gold' | 'red' | 'blue';
export type Cell = { x: number; y: number; direction: number; fixed?: boolean; dye?: CargoColor };
export type Level = { name: string; path: Cell[]; goal: { x: number; y: number }; orders?: CargoColor[]; requiredDyes?: CargoColor[]; recipe?: CargoColor[]; exits?: { x: number; y: number; color: CargoColor }[]; hint?: string };
export const directions = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
export const levels: Level[] = [
    { name: '第一條生產線', path: [{ x: 0, y: 2, direction: 1 }, { x: 1, y: 2, direction: 0 }, { x: 2, y: 2, direction: 3 }, { x: 3, y: 2, direction: 0 }], goal: { x: 4, y: 2 } },
    { name: '轉角運送', path: [{ x: 0, y: 3, direction: 0 }, { x: 1, y: 3, direction: 2 }, { x: 1, y: 2, direction: 0 }, { x: 2, y: 2, direction: 1 }, { x: 3, y: 2, direction: 0 }, { x: 3, y: 1, direction: 2 }], goal: { x: 4, y: 1 } },
    { name: '精密流水線', path: [{ x: 0, y: 4, direction: 1 }, { x: 1, y: 4, direction: 0 }, { x: 1, y: 3, direction: 2 }, { x: 2, y: 3, direction: 1 }, { x: 2, y: 2, direction: 2 }, { x: 3, y: 2, direction: 3 }, { x: 3, y: 1, direction: 2 }, { x: 4, y: 1, direction: 1 }], goal: { x: 4, y: 0 } },
];
levels.push(
    { name: '雙色分流', hint: '紅箱走上方、藍箱走右方；每箱送達後可重新旋轉',
      path: [{ x: 0, y: 2, direction: 0, fixed: true }, { x: 1, y: 2, direction: 0 }, { x: 2, y: 2, direction: 0 }, { x: 3, y: 2, direction: 0, fixed: true }, { x: 2, y: 1, direction: 3, fixed: true }],
      goal: { x: 4, y: 2 }, orders: ['red', 'blue'], exits: [{ x: 2, y: 0, color: 'red' }, { x: 4, y: 2, color: 'blue' }] },
    { name: '染色加工', hint: '紅箱先經藍色加工站；藍箱可走中央捷徑',
      path: [{ x: 0, y: 2, direction: 0, fixed: true }, { x: 1, y: 2, direction: 0 }, { x: 2, y: 2, direction: 0, fixed: true }, { x: 3, y: 2, direction: 0, fixed: true }, { x: 1, y: 1, direction: 0, fixed: true, dye: 'blue' }, { x: 2, y: 1, direction: 0, fixed: true }, { x: 3, y: 1, direction: 1, fixed: true }],
      goal: { x: 4, y: 2 }, orders: ['red', 'blue'], exits: [{ x: 4, y: 2, color: 'blue' }] },
    { name: '加工與分流', hint: '紅箱染藍再送右方；藍箱染紅再送上方',
      path: [{ x: 0, y: 2, direction: 0, fixed: true }, { x: 1, y: 2, direction: 0 }, { x: 2, y: 2, direction: 0 }, { x: 3, y: 2, direction: 0, fixed: true }, { x: 1, y: 3, direction: 0, fixed: true, dye: 'blue' }, { x: 2, y: 3, direction: 3, fixed: true }, { x: 1, y: 1, direction: 0, fixed: true, dye: 'red' }, { x: 2, y: 1, direction: 3, fixed: true }],
      goal: { x: 4, y: 2 }, orders: ['red', 'blue'], requiredDyes: ['blue', 'red'], exits: [{ x: 2, y: 0, color: 'red' }, { x: 4, y: 2, color: 'blue' }] }
);
levels.push({ name: '雙段加工配方', hint: '每箱必須先染藍、再染紅，最後送至紅色出口',
    path: [{ x: 0, y: 2, direction: 0, fixed: true }, { x: 1, y: 2, direction: 0 }, { x: 2, y: 2, direction: 0 }, { x: 3, y: 2, direction: 0, fixed: true },
        { x: 1, y: 3, direction: 0, fixed: true, dye: 'blue' }, { x: 2, y: 3, direction: 3, fixed: true },
        { x: 2, y: 1, direction: 0, fixed: true }, { x: 3, y: 1, direction: 1, fixed: true, dye: 'red' }],
    goal: { x: 4, y: 2 }, orders: ['red', 'blue'], recipe: ['blue', 'red'], exits: [{ x: 4, y: 2, color: 'red' }] });
export class PuzzleModel {
    cells: Cell[] = [];
    position = { x: 0, y: 0 };
    status: 'ready' | 'running' | 'failed' | 'complete' = 'ready';
    moves = 0;
    visited = new Set<string>();
    delivered = 0;
    cargoColor: CargoColor = 'gold';
    failure = '';
    processed: CargoColor | undefined;
    processTrail: CargoColor[] = [];
    private rotationHistory: { index: number; direction: number }[] = [];
    get moveLimit() { return this.levelIndex < 3 ? Infinity : [8, 7, 7, 8][this.levelIndex - 3]; }
    get parMoves() { return [4, 9, 16, 4, 3, 3, 4][this.levelIndex]; }
    get stars() { return this.status !== 'complete' ? 0 : this.moves <= this.parMoves ? 3 : this.moves <= this.parMoves + 2 ? 2 : 1; }
    selectLevel(index: number) { if (!Number.isInteger(index) || index < 0 || index >= levels.length) return false; this.levelIndex = index; this.reset(); return true; }
    get orders() { return this.level.orders || ['gold'] as CargoColor[]; }
    get exits() { return this.level.exits || [{ ...this.level.goal, color: 'gold' as CargoColor }]; }
    constructor(public levelIndex = 0) { this.reset(); }
    get level() { return levels[this.levelIndex]; }
    reset() { this.cells = this.level.path.map(c => ({ ...c })); this.position = { x: this.cells[0].x, y: this.cells[0].y }; this.status = 'ready'; this.moves = 0; this.delivered = 0; this.cargoColor = this.orders[0]; this.failure = ''; this.processed = undefined; this.processTrail = []; this.rotationHistory = []; this.visited.clear(); }
    prepareNextCargo() { if (this.status !== 'ready' || !this.delivered) return; this.position = { x: this.cells[0].x, y: this.cells[0].y }; this.cargoColor = this.orders[this.delivered]; this.processed = undefined; this.processTrail = []; this.rotationHistory = []; this.visited.clear(); }
    rotate(index: number) { if (this.status !== 'ready' || !this.cells[index] || this.cells[index].fixed || this.moves >= this.moveLimit) return false; this.rotationHistory.push({ index, direction: this.cells[index].direction }); this.cells[index].direction = (this.cells[index].direction + 1) % 4; this.moves++; return true; }
    undoRotation() { if (this.status !== 'ready') return false; const last = this.rotationHistory.pop(); if (!last) return false; this.cells[last.index].direction = last.direction; this.moves--; return true; }
    start() { if (this.status === 'ready') { this.rotationHistory = []; this.status = 'running'; } }
    step() {
        if (this.status !== 'running') return;
        const key = `${this.position.x},${this.position.y}`;
        const cell = this.cells.find(c => c.x === this.position.x && c.y === this.position.y);
        if (!cell || this.visited.has(key)) { this.status = 'failed'; this.failure = '貨箱陷入迴圈'; return; }
        this.visited.add(key);
        const d = directions[cell.direction];
        this.position = { x: cell.x + d.x, y: cell.y + d.y };
        const destination = this.cells.find(c => c.x === this.position.x && c.y === this.position.y);
        if (destination?.dye) {
            this.cargoColor = destination.dye; this.processed = destination.dye;
            if (this.level.recipe && this.level.recipe[this.processTrail.length] !== destination.dye) { this.status = 'failed'; this.failure = '加工順序錯誤，請依藍 → 紅加工'; return; }
            this.processTrail.push(destination.dye);
        }
        const exit = this.exits.find(c => c.x === this.position.x && c.y === this.position.y);
        if (exit) {
            if (this.level.recipe && this.processTrail.length !== this.level.recipe.length) { this.status = 'failed'; this.failure = '加工步驟尚未完成'; }
            else if (this.level.requiredDyes && this.processed !== this.level.requiredDyes[this.delivered]) { this.status = 'failed'; this.failure = '貨箱尚未完成指定染色'; }
            else if (exit.color !== this.cargoColor) { this.status = 'failed'; this.failure = '貨箱顏色與出口不符'; }
            else { this.delivered++; this.status = this.delivered === this.orders.length ? 'complete' : 'ready'; }
        } else if (!destination) { this.status = 'failed'; this.failure = '貨箱偏離路線'; }
    }
    next() { if (this.status !== 'complete') return false; this.levelIndex = (this.levelIndex + 1) % levels.length; this.reset(); return true; }
}
