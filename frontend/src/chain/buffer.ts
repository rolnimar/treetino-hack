import { Buffer } from 'buffer';
// Anchor Borsh layouts expect Buffer in the browser.
if (!('Buffer' in globalThis)) Object.assign(globalThis, { Buffer });
