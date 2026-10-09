import { _decorator, Component, Node, UITransform, Label, Graphics, Color, view, ResolutionPolicy, Vec3, tween, Tween, profiler, sys } from 'cc';
import { PuzzleModel, levels } from './PuzzleModel';
import { ProgressStore } from './ProgressStore';
const { ccclass } = _decorator;
const color = (hex: string) => new Color().fromHEX(hex);
@ccclass('FactoryGame')
export class FactoryGame extends Component {
    model = new PuzzleModel();
    private root!: Node;
    private cargo!: Node;
    private message!: Label;
    private budget!: Label;
    private progress = new ProgressStore({ getItem: key => sys.localStorage.getItem(key), setItem: (key, value) => sys.localStorage.setItem(key, value) }, levels.length);
    private ordersLabel!: Label;
    private timer = 0;
    private moving = false;
    private size = 92;
    private cargoTint() { return this.model.cargoColor === 'red' ? '#f27b83' : this.model.cargoColor === 'blue' ? '#71b8ff' : '#f3b866'; }
    private refreshCargo() { const g = this.cargo.getChildByName('CargoTop')!.getComponent(Graphics)!; g.clear(); g.fillColor = color(this.cargoTint()); g.roundRect(-20, -17, 40, 34, 5); g.fill(); g.fillColor = color('#ffffff'); g.rect(-4, -17, 8, 34); g.fill(); }
    onLoad() { profiler.hideStats(); view.setDesignResolutionSize(720, 1280, ResolutionPolicy.SHOW_ALL); this.model.selectLevel(this.progress.lastLevel); this.render(); }
    private makeNode(name: string, x: number, y: number, w: number, h: number, parent = this.root) {
        const n = new Node(name); n.layer = this.node.layer; parent.addChild(n); n.setPosition(x, y); n.addComponent(UITransform).setContentSize(w, h); return n;
    }
    private panel(n: Node, w: number, h: number, fill: string, radius = 16) {
        const g = n.addComponent(Graphics); g.fillColor = color(fill); g.roundRect(-w / 2, -h / 2, w, h, radius); g.fill(); return g;
    }
    private text(name: string, value: string, x: number, y: number, fontSize: number, tint = '#edf4f2', parent = this.root) {
        const n = this.makeNode(name, x, y, 680, fontSize * 2, parent); const l = n.addComponent(Label); l.string = value; l.fontSize = fontSize; l.lineHeight = fontSize + 10; l.color = color(tint); return l;
    }
    private button(name: string, value: string, x: number, y: number, fill: string, action: () => void) {
        const n = this.makeNode(name, x, y, 260, 76); this.panel(n, 260, 76, fill); this.text(`${name}Label`, value, 0, 0, 26, '#ffffff', n); n.on(Node.EventType.TOUCH_END, action); return n;
    }
    private point(x: number, y: number) { return new Vec3((x - 2) * this.size, (2 - y) * this.size - 30); }
    private render() {
        this.progress.select(this.model.levelIndex);
        if (this.cargo) Tween.stopAllByTarget(this.cargo);
        if (this.root) { this.root.active = false; this.root.destroy(); }
        this.root = this.makeNode('FactoryUI', 0, 0, 720, 1280, this.node);
        this.panel(this.root, 720, 1280, '#111e28', 0);
        levels.forEach((_, i) => {
            const n = this.makeNode(`Select-${i}`, (i - (levels.length - 1) / 2) * 78, 590, 68, 54);
            this.panel(n, 68, 54, i === this.model.levelIndex ? '#247e70' : '#3c5364', 10);
            this.text('SelectLabel', `${i + 1}`, 0, 10, 20, '#ffffff', n);
            this.text('StarsLabel', this.progress.stars[i] ? '★'.repeat(this.progress.stars[i]) : '—', 0, -13, 15, '#f3b866', n);
            n.on(Node.EventType.TOUCH_END, () => { this.model.selectLevel(i); this.moving = false; this.timer = 0; this.render(); });
        });
        this.text('Brand', 'ASSEMBLY / 05', 0, 540, 22, '#69dbc4');
        this.text('Title', '流水線解謎工廠', 0, 480, 42);
        this.text('LevelTitle', `${this.model.levelIndex + 1} / ${levels.length}   ${this.model.level.name}`, 0, 400, 26, '#a9bdc7');
        this.text('Instructions', this.model.level.hint || '點擊輸送帶旋轉，將貨箱送到綠色出口', 0, 330, 20, '#a9bdc7');
        if (this.model.level.orders) this.text('Legend', '灰色鎖定 · 彩色框為染色站 · 貨箱依序出貨', 0, 285, 20, '#a9bdc7');
        this.ordersLabel = this.text('Orders', '', 0, 245, 19, '#f3b866'); this.refreshOrders();
        const board = this.makeNode('Board', 0, -30, 520, 520); this.panel(board, 520, 520, '#1b2c38', 26);
        for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { const p = this.point(x, y); const n = this.makeNode(`Floor-${x}-${y}`, p.x, p.y, 84, 84); this.panel(n, 84, 84, '#233642', 12); }
        this.model.exits.forEach(goal => {
            const gp = this.point(goal.x, goal.y);
            const exit = this.makeNode('Exit', gp.x, gp.y, 84, 84);
            this.panel(exit, 84, 84, goal.color === 'red' ? '#a84b59' : goal.color === 'blue' ? '#326caf' : '#227969');
            this.text('ExitLabel', goal.color === 'gold' ? '出口' : goal.color === 'red' ? '紅出口' : '藍出口', 0, 0, 20, '#ffffff', exit);
        });
        this.model.cells.forEach((c, i) => {
            const p = this.point(c.x, c.y), n = this.makeNode(`Belt-${i}`, p.x, p.y, 84, 84);
            this.panel(n, 84, 84, '#0c1720');
            const face = this.makeNode('Face', 0, 5, 78, 70, n); const g = this.panel(face, 78, 70, c.dye === 'blue' ? '#326caf' : c.dye === 'red' ? '#a84b59' : '#496474', 10);
            g.strokeColor = color('#668292'); g.lineWidth = 3;
            for (let v = -24; v <= 24; v += 12) { g.moveTo(v, -29); g.lineTo(v, 29); g.stroke(); }
            const arrow = this.makeNode('Direction', 0, 5, 60, 60, n); const a = arrow.addComponent(Graphics); a.fillColor = color(c.fixed ? '#a9bdc7' : '#8bf1d8'); a.moveTo(22, 0); a.lineTo(-6, 17); a.lineTo(-6, 7); a.lineTo(-22, 7); a.lineTo(-22, -7); a.lineTo(-6, -7); a.lineTo(-6, -17); a.close(); a.fill(); arrow.angle = -c.direction * 90;
            if (c.fixed) this.text('Lock', c.dye ? '染' : '鎖', 25, -24, 16, '#ffffff', n);
            n.on(Node.EventType.TOUCH_END, () => {
                if (this.moving || this.model.status !== 'ready' || c.fixed) return;
                if (this.model.rotate(i)) { arrow.angle = -this.model.cells[i].direction * 90; this.refreshBudget(); this.message.string = `已旋轉 ${this.model.moves} 次 · 準備運送`; }
                else this.message.string = '旋轉次數已用完，可試送或重新配置';
            });
        });
        const cp = this.point(this.model.position.x, this.model.position.y); this.cargo = this.makeNode('Cargo', cp.x, cp.y, 42, 42); this.panel(this.cargo, 42, 42, '#69472d', 6);
        const top = this.makeNode('CargoTop', 0, 5, 40, 34, this.cargo); const cg = this.panel(top, 40, 34, this.cargoTint(), 5); cg.fillColor = color('#ffdb9b'); cg.rect(-4, -17, 8, 34); cg.fill();
        this.message = this.text('Status', this.model.level.orders ? `已送達 ${this.model.delivered}/${this.model.orders.length} · 調整路線後出貨` : '調整方向後，按下開始運送', 0, -370, 25, '#83dec8');
        this.budget = this.text('Budget', '', 0, -325, 21, '#f3b866'); this.refreshBudget();
        this.button('Start', '開始運送', -145, -450, '#247e70', () => { if (!this.moving && this.model.status === 'ready') { this.model.start(); this.timer = 0; this.message.string = '運送中…'; } });
        this.button('Reset', '重新配置', 145, -450, '#3c5364', () => { this.model.reset(); this.moving = false; this.render(); });
        this.button('Undo', '撤銷旋轉', -145, -550, '#3c5364', () => {
            if (this.moving || !this.model.undoRotation()) { this.message.string = '只能撤銷本次出貨前的旋轉'; return; }
            this.model.cells.forEach((c, i) => { this.root.getChildByName(`Belt-${i}`)!.getChildByName('Direction')!.angle = -c.direction * 90; });
            this.refreshBudget(); this.message.string = '已撤銷旋轉，退回一次配置額度';
        });
        this.button('Next', '下一關 →', 145, -550, '#355a73', () => { if (this.moving) return; if (this.model.next()) { this.render(); } else this.message.string = '先把貨箱送達出口才能進入下一關'; });
    }
    private refreshOrders() {
        const names = { red: '紅箱', blue: '藍箱', gold: '貨箱' };
        this.ordersLabel.string = this.model.orders.map((c, i) => `${i < this.model.delivered ? '✓' : i === this.model.delivered ? '▶' : '○'} ${names[c]}`).join('　→　');
    }
    private refreshBudget() { this.budget.string = `旋轉 ${this.model.moves}${Number.isFinite(this.model.moveLimit) ? ` / ${this.model.moveLimit}` : ''} 次 · 三星目標 ${this.model.parMoves} 次${this.model.level.recipe ? ` · 加工 ${this.model.processTrail.length}/${this.model.level.recipe.length}` : ''}`; }
    update(dt: number) {
        if (this.model.status !== 'running' || this.moving) return;
        this.timer += dt; if (this.timer < 0.25) return; this.timer = 0;
        this.model.step(); this.moving = true;
        const p = this.point(this.model.position.x, this.model.position.y);
        tween(this.cargo).to(0.4, { position: p }).call(() => {
            this.moving = false;
            this.refreshCargo();
            this.refreshBudget();
            this.refreshOrders();
            if (this.model.status === 'ready') { this.model.prepareNextCargo(); this.render(); this.message.string = `已送達 ${this.model.delivered}/${this.model.orders.length} · 請配置下一箱路線`; }
            if (this.model.status === 'complete') {
                const saved = this.progress.record(this.model.levelIndex, this.model.stars);
                this.root.getChildByName(`Select-${this.model.levelIndex}`)!.getChildByName('StarsLabel')!.getComponent(Label)!.string = '★'.repeat(this.progress.stars[this.model.levelIndex]);
                this.message.string = `${'★'.repeat(this.model.stars)} 全數送達！${saved ? '評價已保存' : '評價僅保留於本次遊戲'}`;
            }
            if (this.model.status === 'failed') this.message.string = `${this.model.failure}，請重新配置`;
        }).start();
    }
}

