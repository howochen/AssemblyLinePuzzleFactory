const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../build/web-mobile');
for (const file of ['index.html', 'index.js', 'application.js', 'style.css', 'src/settings.json', 'src/system.bundle.js', 'src/chunks/bundle.js']) {
    const fullPath = path.join(root, file);
    assert.ok(fs.existsSync(fullPath), `Missing build file: ${file}`);
    assert.ok(fs.statSync(fullPath).size > 0, `Empty build file: ${file}`);
}
const settings = JSON.parse(fs.readFileSync(path.join(root, 'src/settings.json'), 'utf8'));
assert.equal(settings.CocosEngine, '3.8.8', 'Wrong Cocos engine version');
assert.equal(settings.engine.platform, 'web-mobile', 'Wrong target platform');
assert.equal(settings.launch.launchScene, 'db://assets/scenes/Factory.scene', 'Wrong entry scene');
assert.equal(settings.screen.orientation, 'portrait', 'Build must be portrait');
assert.equal(settings.screen.designResolution.width, 720, 'Wrong design width');
assert.equal(settings.screen.designResolution.height, 1280, 'Wrong design height');
assert.ok(settings.assets.projectBundles.includes('main'), 'Main bundle is missing');
assert.ok(fs.existsSync(path.join(root, 'assets/main/config.json')), 'Main bundle manifest missing');
assert.ok(fs.existsSync(path.join(root, 'cocos-js')), 'Engine output missing');
assert.equal(fs.readFileSync(path.join(root, '../creator-build-exit-code.txt'), 'utf8').trim(), '36', 'Creator did not report a successful build');
console.log('PASS: Web Mobile boot files, engine 3.8.8, Factory entry, portrait 720x1280, bundles, Creator exit 36.');
