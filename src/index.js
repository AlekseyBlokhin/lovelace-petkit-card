import { PetkitPuramaxCard } from './cards/puramax/petkit-puramax-card.js';
import { PetkitPuramaxCardEditor } from './cards/puramax/petkit-puramax-card-editor.js';

if (!customElements.get('petkit-puramax-card')) {
  customElements.define('petkit-puramax-card', PetkitPuramaxCard);
}
if (!customElements.get('petkit-puramax-card-editor')) {
  customElements.define('petkit-puramax-card-editor', PetkitPuramaxCardEditor);
}

// `window.customCards` is the Lovelace-wide registry other custom cards
// also push onto; it isn't part of any published DOM type, hence the `any`.
const win = /** @type {any} */ (window);
win.customCards = win.customCards || [];
win.customCards.push({
  type: 'petkit-puramax-card',
  name: 'PETKIT PURAMAX Card',
  description: 'Configurable card for PETKIT PURAMAX litter box monitoring, controls, and per-cat visit analytics.',
});
