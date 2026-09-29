import test from 'node:test';
import assert from 'node:assert/strict';
import { CutPiece } from '../js/models/CutPiece.js';
import { Sheet } from '../js/models/Sheet.js';

test('CutPiece CRUD operations', async (t) => {
  await t.test('Create CutPiece with valid attributes', () => {
    const cut = new CutPiece(1, 'Panel Frontal', 500, 300, 2);
    assert.equal(cut.id, 1);
    assert.equal(cut.name, 'Panel Frontal');
    assert.equal(cut.width, 500);
    assert.equal(cut.height, 300);
    assert.equal(cut.quantity, 2);
    assert.equal(cut.area, 150000);
    assert.equal(cut.totalArea, 300000);
    assert.ok(cut.color.startsWith('hsl('));
  });

  await t.test('Update CutPiece clone individual', () => {
    const cut = new CutPiece(1, 'Panel Frontal', 500, 300, 3);
    const unitCut = cut.cloneIndividual('1-0');
    assert.equal(unitCut.id, '1-0');
    assert.equal(unitCut.quantity, 1);
    assert.equal(unitCut.width, 500);
    assert.equal(unitCut.height, 300);
    assert.equal(unitCut.color, cut.color);
  });
});

test('Sheet Model CRUD operations', async (t) => {
  await t.test('Create Sheet with valid dimensions', () => {
    const sheet = new Sheet(1, 2000, 1000, 3);
    assert.equal(sheet.id, 1);
    assert.equal(sheet.width, 2000);
    assert.equal(sheet.height, 1000);
    assert.equal(sheet.thickness, 3);
    assert.equal(sheet.totalArea, 2000000);
    assert.equal(sheet.usedArea, 0);
    assert.equal(sheet.wasteArea, 2000000);
    assert.equal(sheet.efficiency, 0);
    assert.equal(sheet.wastePercentage, 100);
  });

  await t.test('Add cuts and calculate efficiency', () => {
    const sheet = new Sheet(1, 1000, 1000, 3);
    const cut = new CutPiece(10, 'Sub-panel', 500, 500, 1);
    sheet.addCut({ cutPiece: cut, x: 0, y: 0, rotated: false });

    assert.equal(sheet.placedCuts.length, 1);
    assert.equal(sheet.usedArea, 250000);
    assert.equal(sheet.wasteArea, 750000);
    assert.equal(sheet.efficiency, 25);
    assert.equal(sheet.wastePercentage, 75);
  });

  await t.test('Delete / Clear cuts from Sheet', () => {
    const sheet = new Sheet(1, 1000, 1000, 3);
    sheet.addCut({ cutPiece: new CutPiece(1, 'Test', 200, 200), x: 0, y: 0, rotated: false });
    assert.equal(sheet.placedCuts.length, 1);
    sheet.clearCuts();
    assert.equal(sheet.placedCuts.length, 0);
    assert.equal(sheet.usedArea, 0);
    assert.equal(sheet.efficiency, 0);
  });
});
