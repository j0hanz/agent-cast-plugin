import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const filename = input.tool_input.filename || input.tool_input.name;

if (filename) {
  // Expected format: web/public/screenshots/{protoId}-{ver}.png or just {protoId}-{ver}.png
  const baseName = filename.split('/').pop();
  const match = baseName.match(/^(.+)-(v\d+)\.png$/);
  
  if (match) {
    const protoId = match[1];
    const ver = match[2];
    const proto = protoId.charAt(0).toUpperCase() + protoId.slice(1).replace(/-/g, ' ');
    
    const entry = {
      protoId,
      proto,
      kind: 'desktop',
      stage: 'preview',
      ver,
      capturedAt: new Date().toISOString()
    };

    const statePath = join(process.env.CLAUDE_PLUGIN_ROOT, 'web', 'public', 'state.json');
    mkdirSync(dirname(statePath), { recursive: true });
    
    let state = { screenshots: [] };
    try {
      state = JSON.parse(readFileSync(statePath, 'utf8'));
    } catch (err) {}
    
    if (!Array.isArray(state.screenshots)) {
      state.screenshots = [];
    }
    
    // Add new screenshot to the top of the array
    state.screenshots.unshift(entry);
    
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  }
}
