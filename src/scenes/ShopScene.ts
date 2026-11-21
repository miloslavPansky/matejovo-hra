import Phaser from 'phaser';
import { dressHero, paintHero } from '../art/textures';
import { sfx } from '../audio/sound';
import { GAME_WIDTH } from '../config';
import { loadProgress, purchase, type Purchase } from '../game/progress';
import { BOOTS, ITEMS, OUTFITS, badgeNews, nextBootsPrice, outfitColors, type SaveData } from '../game/rules';
import { PixelText } from '../ui/PixelText';
import { Button, COLORS, coinCounter, desertBackdrop } from '../ui/widgets';

type Tab = 'gear' | 'outfits';

interface Offer {
  key: string;
  name: string;
  info: string;
  icon: string;
  price: number | null;
  owned: boolean;
  buy: Purchase;
}

const ROMAN = ['I', 'II', 'III'];
const INK = '#3b2a10';
const SOFT = '#6d5c43';
const PANEL = { x: 180, y: 58, w: 294, h: 176 };
const CONFIRM_COLOR = 0xc98a1a;

/** Splits text into lines of at most `max` characters for the speech bubble. */
function wrap(text: string, max: number): string {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

/** Bedřich's shop: one-level items, spring boots and outfits. Purchases are saved immediately. */
export class ShopScene extends Phaser.Scene {
  private next: string | null = null;
  private tab: Tab = 'gear';
  private selected = 0;
  private pending: string | null = null;
  private save!: SaveData;
  private content!: Phaser.GameObjects.Container;
  private tabs: Record<Tab, Button> | null = null;
  private wallet!: { set: (v: string) => void };
  private speech!: PixelText;
  private tail!: Phaser.GameObjects.Graphics;
  private moveClouds: (time: number) => void = () => undefined;

  constructor() {
    super('shop');
  }

  create(data?: { next?: string | null }): void {
    this.next = data?.next ?? null;
    this.tab = 'gear';
    this.selected = 0;
    this.pending = null;
    this.save = loadProgress();

    this.moveClouds = desertBackdrop(this);
    new PixelText(this, GAME_WIDTH / 2, 16, 'Obchod u Bedřicha', { size: 16, color: '#ffe9b0' }).setOrigin(0.5);
    this.wallet = coinCounter(this, GAME_WIDTH - 6, 8, String(this.save.wallet));

    this.add.image(32, 208, 'hero-a').setOrigin(0.5, 1).setScale(2);
    this.add.image(118, 208, 'bedrich').setOrigin(0.5, 1).setScale(2);
    this.tail = this.add.graphics().setDepth(5);
    this.speech = new PixelText(this, 10, 38, ' ', { size: 8, color: INK, shadow: null, background: '#fff6dc', padding: 5 }).setOrigin(0).setDepth(5);
    this.say('Vítej, Matěji! Co si dnes vybereš?');

    this.add.rectangle(PANEL.x, PANEL.y, PANEL.w, PANEL.h, COLORS.panel, 0.94).setOrigin(0).setStrokeStyle(3, COLORS.ink);
    this.tabs = {
      gear: new Button(this, PANEL.x + 74, 45, 140, 'Vybavení', () => this.switchTab('gear'), COLORS.secondary, 20),
      outfits: new Button(this, PANEL.x + PANEL.w - 74, 45, 140, 'Oblečky', () => this.switchTab('outfits'), COLORS.secondary, 20),
    };
    this.content = this.add.container(0, 0);

    new Button(this, 66, 250, 116, 'Zpět (Esc)', () => this.leave());
    const next = this.next;
    if (next) new Button(this, GAME_WIDTH - 82, 250, 140, 'Další level', () => this.scene.start('game', { level: next }), COLORS.primary);

    const kb = this.input.keyboard;
    kb?.on('keydown-ESC', () => this.leave());
    kb?.on('keydown-TAB', (e: KeyboardEvent) => { e.preventDefault(); this.switchTab(this.tab === 'gear' ? 'outfits' : 'gear'); });
    kb?.on('keydown-UP', () => this.move(this.tab === 'gear' ? -1 : -5));
    kb?.on('keydown-DOWN', () => this.move(this.tab === 'gear' ? 1 : 5));
    kb?.on('keydown-LEFT', () => (this.tab === 'gear' ? this.switchTab('outfits') : this.move(-1)));
    kb?.on('keydown-RIGHT', () => (this.tab === 'gear' ? this.switchTab('outfits') : this.move(1)));
    kb?.on('keydown-ENTER', () => this.activate(this.selected));
    kb?.on('keydown-SPACE', () => this.activate(this.selected));
    // Previews change Matěj's colours; put on what is really worn when leaving.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => dressHero(this, loadProgress()));

    this.render();
  }

  update(time: number): void {
    this.moveClouds(time);
  }

  private leave(): void {
    sfx.click();
    this.scene.start('menu');
  }

  private say(text: string): void {
    this.speech.setText(wrap(text, 18));
    const bottom = this.speech.y + this.speech.height;
    this.tail.clear().fillStyle(0xfff6dc).fillTriangle(70, bottom - 1, 86, bottom - 1, 84, bottom + 8);
  }

  private switchTab(tab: Tab): void {
    if (this.tab === tab) return;
    sfx.click();
    this.tab = tab;
    this.selected = tab === 'gear' ? 0 : OUTFITS.findIndex((o) => o.id === this.save.cap);
    this.pending = null;
    this.render();
  }

  private move(d: number): void {
    const count = this.tab === 'gear' ? this.offers().length : OUTFITS.length;
    const next = this.selected + d;
    if (next < 0 || next >= count) return;
    this.selected = next;
    this.pending = null;
    this.render();
  }

  private offers(): Offer[] {
    const d = this.save;
    const items: Offer[] = ITEMS.map((i) => ({
      key: i.id, name: i.name, info: i.info, icon: `icon-${i.id}`, price: i.price, owned: d.items[i.id], buy: { kind: 'item', id: i.id },
    }));
    const bootsPrice = nextBootsPrice(d);
    items.push({
      key: 'boots',
      name: `${BOOTS.name} ${ROMAN[Math.min(d.boots, ROMAN.length - 1)]}`,
      info: d.boots > 0 ? `Máš ${ROMAN[d.boots - 1]}, natrvalo` : BOOTS.info,
      icon: 'icon-boots', price: bootsPrice, owned: bootsPrice === null, buy: { kind: 'boots' },
    });
    return items;
  }

  private render(): void {
    this.content.removeAll(true);
    if (this.tabs) {
      this.tabs.gear.setColor(this.tab === 'gear' ? COLORS.primary : COLORS.secondary);
      this.tabs.outfits.setColor(this.tab === 'outfits' ? COLORS.primary : COLORS.secondary);
    }
    if (this.tab === 'gear') this.renderGear();
    else this.renderOutfits();
  }

  private renderGear(): void {
    dressHero(this, this.save);
    this.offers().forEach((o, i) => {
      const y = PANEL.y + 18 + i * 35;
      const sel = i === this.selected;
      const row = this.add.rectangle(PANEL.x + PANEL.w / 2, y, PANEL.w - 8, 32, 0xfff6dc, sel ? 1 : 0.001)
        .setStrokeStyle(2, COLORS.ink, sel ? 1 : 0).setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => { this.selected = i; this.activate(i); });
      const parts: Phaser.GameObjects.GameObject[] = [
        row,
        this.add.image(PANEL.x + 18, y, o.icon).setScale(2),
        new PixelText(this, PANEL.x + 36, y - 6, o.name, { size: 8, color: INK, shadow: null }).setOrigin(0, 0.5),
        new PixelText(this, PANEL.x + 36, y + 7, o.info, { size: 8, color: SOFT, shadow: null }).setOrigin(0, 0.5),
      ];
      if (!o.owned && o.price !== null) {
        const price = new PixelText(this, PANEL.x + 214, y, String(o.price), { size: 8, color: INK, shadow: null }).setOrigin(1, 0.5);
        parts.push(price, this.add.image(price.x - price.width - 7, y, 'coin', '0'));
      }
      const label = o.owned ? (o.key === 'boots' ? 'Max' : 'Máš') : this.pending === o.key ? 'Opravdu?' : 'Koupit';
      const color = o.owned ? COLORS.secondary : this.pending === o.key ? CONFIRM_COLOR : (o.price ?? 0) <= this.save.wallet ? COLORS.primary : COLORS.secondary;
      parts.push(new Button(this, PANEL.x + PANEL.w - 42, y, 72, label, () => { this.selected = i; this.activate(i); }, color, 20));
      this.content.add(parts);
    });
  }

  private renderOutfits(): void {
    const sel = OUTFITS[this.selected];
    const d = this.save;
    // Preview the selected colour on Matěj together with the rest of what he wears.
    paintHero(this, outfitColors(sel.part === 'cap' ? sel.id : d.cap), outfitColors(sel.part === 'shirt' ? sel.id : d.shirt));
    (['cap', 'shirt'] as const).forEach((part, row) => {
      const top = PANEL.y + 16 + row * 72;
      this.content.add(new PixelText(this, PANEL.x + 12, top, part === 'cap' ? 'Kšiltovka' : 'Tričko', { size: 8, color: INK, shadow: null }).setOrigin(0, 0.5));
      OUTFITS.filter((o) => o.part === part).forEach((o, col) => {
        const i = OUTFITS.indexOf(o);
        const x = PANEL.x + 36 + col * 56, y = top + 24;
        const chosen = i === this.selected;
        const swatch = this.add.rectangle(x, y, 40, 22, Phaser.Display.Color.HexStringToColor(o.colors[0]).color)
          .setStrokeStyle(chosen ? 3 : 2, chosen ? COLORS.white : COLORS.ink).setInteractive({ useHandCursor: true });
        swatch.on('pointerdown', () => { this.selected = i; this.activate(i); });
        swatch.on('pointerover', () => { if (this.selected !== i) { this.selected = i; this.pending = null; this.render(); } });
        const shade = this.add.rectangle(x, y + 7, 36, 5, Phaser.Display.Color.HexStringToColor(o.colors[1]).color);
        const wearing = d[part] === o.id, owned = d.outfits.includes(o.id);
        const caption = wearing ? 'nosíš' : owned ? 'máš' : this.pending === o.id ? 'Opravdu?' : String(o.price);
        const text = new PixelText(this, x + (owned || this.pending === o.id ? 0 : 5), y + 22, caption, {
          size: 8, color: wearing ? '#2e7d1f' : this.pending === o.id ? '#a0640a' : INK, shadow: null,
        }).setOrigin(0.5);
        this.content.add([swatch, shade, text]);
        if (!owned && this.pending !== o.id) this.content.add(this.add.image(text.x - text.width / 2 - 7, text.y, 'coin', '0'));
      });
    });
    this.content.add(new PixelText(this, PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h - 14, 'Klepni na barvu a obleč se', { size: 8, color: SOFT, shadow: null }).setOrigin(0.5));
  }

  private activate(i: number): void {
    if (this.tab === 'gear') {
      const o = this.offers()[i];
      if (!o) return;
      if (o.owned) return this.refuse(o.key === 'boots' ? 'Lepší boty už nemám, tyhle jsou nejlepší!' : `${o.name} už máš. Platí na celý příští level.`);
      this.offer(o.key, o.name, o.price ?? 0, o.buy, o.key === 'boots' ? 'Hop! Teď skočíš výš.' : `${o.name} je tvůj. Platí na celý příští level.`);
      return;
    }
    const o = OUTFITS[i];
    if (!o) return;
    const what = `${o.part === 'cap' ? 'Kšiltovka' : 'Tričko'} ${o.name}`;
    if (this.save.outfits.includes(o.id)) {
      this.selected = i;
      this.finish(purchase({ kind: 'outfit', id: o.id }), 'Sluší ti to!');
      return;
    }
    this.offer(o.id, what, o.price, { kind: 'outfit', id: o.id }, 'Sluší ti to! Nos ho s radostí.');
  }

  /** First tap asks, the second tap on the same thing buys it. */
  private offer(key: string, name: string, price: number, buy: Purchase, thanks: string): void {
    if (this.save.wallet < price) return this.refuse(`${name} stojí ${price} mincí. Zatím ti ${price - this.save.wallet} chybí.`);
    if (this.pending !== key) {
      sfx.click();
      this.pending = key;
      this.say(`${name} za ${price} mincí? Klepni ještě jednou.`);
      this.render();
      return;
    }
    this.finish(purchase(buy), thanks);
  }

  private finish(r: ReturnType<typeof purchase>, thanks: string): void {
    this.pending = null;
    if (!r.ok) return this.refuse('Tohle teď nejde.');
    const paid = this.save.wallet - r.save.wallet;
    this.save = r.save;
    this.wallet.set(String(r.save.wallet));
    if (paid > 0) sfx.buy();
    else sfx.click();
    this.say(r.earned.length ? `${thanks} ${badgeNews(r.earned)}` : thanks);
    if (r.earned.length) this.time.delayedCall(400, () => sfx.badge());
    this.render();
  }

  private refuse(text: string): void {
    sfx.deny();
    this.pending = null;
    this.say(text);
    this.render();
  }
}
