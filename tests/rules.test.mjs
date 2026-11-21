// Shop, save format and badge rules (src/game/rules.ts, run by Node's type stripping).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BADGES, BOOTS, ITEMS, OUTFITS, awardBadges, buyBoots, buyItem, completeLevel, defaultSave, normalizeSave, resetSave, wearOutfit,
} from '../src/game/rules.ts';

const KEYS = Array.from({ length: 10 }, (_, i) => `level-1-${i + 1}`);
const rich = (wallet = 5000) => ({ ...defaultSave(), wallet });
const result = (over = {}) => ({ key: 'level-1-1', coins: 150, coinTotal: 160, hits: 1, stomps: { scorpion: 2, plant: 1 }, ...over });

test('a save from version 0.4 keeps its coins as wallet and earned total', () => {
  const d = normalizeSave({ unlocked: 4, best: { 'level-1-1': 120 }, totalCoins: 777, introSeen: true, muted: true });
  assert.equal(d.wallet, 777);
  assert.equal(d.earned, 777);
  assert.equal(d.unlocked, 4);
  assert.equal(d.cap, 'cap-red');
  assert.equal(d.shirt, 'shirt-blue');
  assert.equal(d.introSeen, true);
  assert.equal(d.muted, true);
});

test('damaged data falls back to safe values', () => {
  const d = normalizeSave({ unlocked: -3, wallet: 'x', boots: 99, cap: 'cap-gold', outfits: ['nonsense', 'cap-blue'], badges: 'no' });
  assert.equal(d.unlocked, 1);
  assert.equal(d.wallet, 0);
  assert.equal(d.boots, BOOTS.prices.length);
  assert.equal(d.cap, 'cap-red');
  assert.deepEqual(d.outfits, ['cap-red', 'shirt-blue', 'cap-blue']);
  assert.deepEqual(d.badges, []);
  assert.deepEqual(normalizeSave(null), defaultSave());
});

test('buying an item costs its price, only once until it is used', () => {
  const r = buyItem(rich(100), 'jetpack');
  assert.ok(r.ok);
  assert.equal(r.save.wallet, 100 - ITEMS.find((i) => i.id === 'jetpack').price);
  assert.equal(r.save.items.jetpack, true);
  assert.deepEqual(buyItem(r.save, 'jetpack'), { ok: false, reason: 'owned' });
  assert.deepEqual(buyItem(rich(5), 'armor'), { ok: false, reason: 'coins' });
});

test('spring boots have three levels with rising prices', () => {
  let d = rich(BOOTS.prices.reduce((a, b) => a + b, 0));
  for (let i = 0; i < 3; i++) {
    const r = buyBoots(d);
    assert.ok(r.ok);
    d = r.save;
  }
  assert.equal(d.boots, 3);
  assert.equal(d.wallet, 0);
  assert.deepEqual(buyBoots(rich()), { ok: true, save: { ...rich(), wallet: 5000 - BOOTS.prices[0], boots: 1 } });
  assert.deepEqual(buyBoots(d), { ok: false, reason: 'max' });
});

test('outfits are bought once, then worn for free', () => {
  const blue = OUTFITS.find((o) => o.id === 'cap-blue');
  const r1 = wearOutfit(rich(100), 'cap-blue');
  assert.ok(r1.ok);
  assert.equal(r1.save.wallet, 100 - blue.price);
  assert.equal(r1.save.cap, 'cap-blue');
  const r2 = wearOutfit(r1.save, 'cap-red');
  assert.ok(r2.ok);
  assert.equal(r2.save.wallet, r1.save.wallet);
  const r3 = wearOutfit(r2.save, 'cap-blue');
  assert.ok(r3.ok);
  assert.equal(r3.save.wallet, r1.save.wallet, 'owned outfit is free');
  assert.deepEqual(wearOutfit(rich(0), 'shirt-red'), { ok: false, reason: 'coins' });
});

test('finishing a level unlocks the next one, adds coins and uses up one-level items', () => {
  const start = { ...rich(10), items: { jetpack: true, armor: true, magnet: true, map: true } };
  const d = completeLevel(start, KEYS, result());
  assert.equal(d.unlocked, 2);
  assert.equal(d.wallet, 160);
  assert.equal(d.earned, 150);
  assert.equal(d.best['level-1-1'], 150);
  assert.deepEqual(d.items, { jetpack: false, armor: false, magnet: false, map: false });
  assert.deepEqual(d.stomps, { scorpion: 2, plant: 1 });
  const again = completeLevel(d, KEYS, result({ coins: 90 }));
  assert.equal(again.best['level-1-1'], 150, 'best score is kept');
  assert.equal(again.unlocked, 2);
});

test('badges: first level, flawless and all coins', () => {
  const d = completeLevel(defaultSave(), KEYS, result({ hits: 0, coins: 160 }));
  const { save, earned } = awardBadges(d, result({ hits: 0, coins: 160 }));
  assert.deepEqual(earned.map((b) => b.id).sort(), ['all-coins', 'first-level', 'no-hit']);
  assert.deepEqual(awardBadges(save, result({ hits: 0, coins: 160 })).earned, [], 'a badge is earned only once');
});

test('badges: coins, secrets, stomps, shop and the whole world', () => {
  const d = {
    ...defaultSave(), earned: 2000, boots: 3, outfits: ['cap-red', 'shirt-blue', 'cap-blue'],
    secrets: KEYS, stomps: { scorpion: 25, plant: 25 }, best: Object.fromEntries(KEYS.map((k) => [k, 100])),
  };
  const ids = awardBadges(d).earned.map((b) => b.id);
  for (const id of ['coins-500', 'coins-1000', 'coins-2000', 'secret-1', 'secret-5', 'secret-all', 'scorpions', 'plants', 'customer', 'outfit', 'boots-max', 'world-1', 'first-level']) {
    assert.ok(ids.includes(id), `badge ${id}`);
  }
});

test('there are 12 to 15 badges with unique ids and names that fit a badge card', () => {
  assert.ok(BADGES.length >= 12 && BADGES.length <= 15);
  assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length);
  for (const b of BADGES) assert.ok(b.name.length <= 10, `${b.name} is too long`);
});

test('restart of the whole game clears progress, coins, purchases and badges but keeps settings', () => {
  const d = { ...rich(900), unlocked: 7, boots: 2, badges: ['first-level'], introSeen: true, muted: true };
  assert.deepEqual(resetSave(d), { ...defaultSave(), introSeen: true, muted: true });
});

test('prices fit earnings of about 140 to 200 coins per level', () => {
  for (const i of ITEMS) assert.ok(i.price <= 70, `${i.name} costs at most a third of one level`);
  assert.ok(BOOTS.prices[0] <= 200 && BOOTS.prices.at(-1) <= 600);
});
