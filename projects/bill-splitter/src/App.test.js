import { describe, it, expect } from 'vitest'
import {
  calculateResults,
  parseReceiptTextPure,
  isItemUnassignedPure,
  getItemValidationError,
  distributeUnits,
  encodeSharePayload,
  decodeSharePayload,
  buildShareUrl,
  getShareParamFromLocation,
  formatShareableText
} from './App'
import fs from 'fs'
import path from 'path'
import Tesseract from 'tesseract.js'
import { Jimp } from 'jimp'

describe('calculateResults split and math logic', () => {
  
  it('should split equally among assignees', () => {
    const people = ['Alice', 'Bob', 'Charlie']
    const items = [
      {
        id: '1',
        name: 'Pizza',
        price: 30,
        splitMode: 'equal',
        splits: { Alice: true, Bob: true, Charlie: false }
      }
    ]
    const results = calculateResults({
      people,
      items,
      taxInput: '0.00',
      tipInput: '0',
      tipIsPercentage: true
    })

    expect(results.totalSubtotal).toBe(30)
    expect(results.grandTotal).toBe(30)

    const aliceBreakdown = results.breakdown.find(p => p.name === 'Alice')
    const bobBreakdown = results.breakdown.find(p => p.name === 'Bob')
    const charlieBreakdown = results.breakdown.find(p => p.name === 'Charlie')

    expect(aliceBreakdown.subtotal).toBe(15)
    expect(bobBreakdown.subtotal).toBe(15)
    expect(charlieBreakdown.subtotal).toBe(0)
  })

  it('should calculate splits by shares', () => {
    const people = ['Alice', 'Bob']
    const items = [
      {
        id: '1',
        name: 'Wine',
        price: 40,
        splitMode: 'shares',
        splits: { Alice: 3, Bob: 1 } // Alice has 3 shares, Bob 1 share (total 4)
      }
    ]
    const results = calculateResults({
      people,
      items,
      taxInput: '0.00',
      tipInput: '0',
      tipIsPercentage: true
    })

    const aliceBreakdown = results.breakdown.find(p => p.name === 'Alice')
    const bobBreakdown = results.breakdown.find(p => p.name === 'Bob')

    expect(aliceBreakdown.subtotal).toBe(30)
    expect(bobBreakdown.subtotal).toBe(10)
  })

  it('should calculate splits by percentages', () => {
    const people = ['Alice', 'Bob']
    const items = [
      {
        id: '1',
        name: 'Salad',
        price: 20,
        splitMode: 'percentage',
        splits: { Alice: 75, Bob: 25 }
      }
    ]
    const results = calculateResults({
      people,
      items,
      taxInput: '0.00',
      tipInput: '0',
      tipIsPercentage: true
    })

    const aliceBreakdown = results.breakdown.find(p => p.name === 'Alice')
    const bobBreakdown = results.breakdown.find(p => p.name === 'Bob')

    expect(aliceBreakdown.subtotal).toBe(15)
    expect(bobBreakdown.subtotal).toBe(5)
  })

  it('should calculate splits by exact amounts', () => {
    const people = ['Alice', 'Bob']
    const items = [
      {
        id: '1',
        name: 'Steak',
        price: 50,
        splitMode: 'exact',
        splits: { Alice: 35, Bob: 15 }
      }
    ]
    const results = calculateResults({
      people,
      items,
      taxInput: '0.00',
      tipInput: '0',
      tipIsPercentage: true
    })

    const aliceBreakdown = results.breakdown.find(p => p.name === 'Alice')
    const bobBreakdown = results.breakdown.find(p => p.name === 'Bob')

    expect(aliceBreakdown.subtotal).toBe(35)
    expect(bobBreakdown.subtotal).toBe(15)
  })

  it('should calculate proportional tax and tip correctly', () => {
    const people = ['Alice', 'Bob']
    const items = [
      {
        id: '1',
        name: 'Item A',
        price: 30, // Alice gets 20, Bob gets 10
        splitMode: 'exact',
        splits: { Alice: 20, Bob: 10 }
      },
      {
        id: '2',
        name: 'Item B',
        price: 10, // Alice gets 10, Bob gets 0
        splitMode: 'exact',
        splits: { Alice: 10, Bob: 0 }
      }
    ]
    // Total subtotal: 40. Alice subtotal: 30, Bob subtotal: 10.
    // Tax is flat $4 (10% of subtotal) -> Alice tax: $3, Bob tax: $1
    // Tip is 20% -> Total tip is $8 (20% of 40) -> Alice tip: $6, Bob tip: $2
    const results = calculateResults({
      people,
      items,
      taxInput: '4.00',
      tipInput: '20',
      tipIsPercentage: true
    })

    expect(results.totalSubtotal).toBe(40)
    expect(results.absoluteTax).toBe(4)
    expect(results.absoluteTip).toBe(8)
    expect(results.grandTotal).toBe(52)

    const aliceBreakdown = results.breakdown.find(p => p.name === 'Alice')
    const bobBreakdown = results.breakdown.find(p => p.name === 'Bob')

    expect(aliceBreakdown.subtotal).toBe(30)
    expect(aliceBreakdown.taxShare).toBe(3)
    expect(aliceBreakdown.tipShare).toBe(6)
    expect(aliceBreakdown.total).toBe(39)

    expect(bobBreakdown.subtotal).toBe(10)
    expect(bobBreakdown.taxShare).toBe(1)
    expect(bobBreakdown.tipShare).toBe(2)
    expect(bobBreakdown.total).toBe(13)
  })

  it('should handle flat rate tips correctly', () => {
    const people = ['Alice', 'Bob']
    const items = [
      {
        id: '1',
        name: 'Item A',
        price: 50,
        splitMode: 'equal',
        splits: { Alice: true, Bob: true }
      }
    ]
    // Total subtotal: 50. Alice: 25, Bob: 25.
    // Flat tip is $10 -> Alice tip: $5, Bob tip: $5
    const results = calculateResults({
      people,
      items,
      taxInput: '0.00',
      tipInput: '10.00',
      tipIsPercentage: false
    })

    expect(results.absoluteTip).toBe(10)
    expect(results.grandTotal).toBe(60)

    const aliceBreakdown = results.breakdown.find(p => p.name === 'Alice')
    expect(aliceBreakdown.tipShare).toBe(5)
  })

  it('should handle zero people safely without crashing', () => {
    const people = []
    const items = []
    const results = calculateResults({
      people,
      items,
      taxInput: '0.00',
      tipInput: '15',
      tipIsPercentage: true
    })

    expect(results.totalSubtotal).toBe(0)
    expect(results.grandTotal).toBe(0)
    expect(results.breakdown.length).toBe(0)
  })

  it('should identify unassigned items correctly using isItemUnassignedPure', () => {
    const people = ['Alice', 'Bob']
    const item1 = { splitMode: 'equal', splits: {} }
    const item2 = { splitMode: 'equal', splits: { Alice: false, Bob: false } }
    const item3 = { splitMode: 'equal', splits: { Alice: true } }
    
    expect(isItemUnassignedPure(item1, people)).toBe(true)
    expect(isItemUnassignedPure(item2, people)).toBe(true)
    expect(isItemUnassignedPure(item3, people)).toBe(false)
  })

  it('should handle unassigned items in calculateResults safely by calculating zero subtotal', () => {
    const people = ['Alice', 'Bob']
    const items = [
      {
        id: '1',
        name: 'Item A',
        price: 20,
        splitMode: 'equal',
        splits: {}
      }
    ]
    const results = calculateResults({
      people,
      items,
      taxInput: '2.00',
      tipInput: '10',
      tipIsPercentage: true
    })

    expect(results.totalSubtotal).toBe(0)
    expect(results.grandTotal).toBe(2) // tax is 2, tip is 0 since subtotal is 0
    const aliceBreakdown = results.breakdown.find(p => p.name === 'Alice')
    expect(aliceBreakdown.subtotal).toBe(0)
    expect(aliceBreakdown.total).toBe(0)
  })

  it('should reconcile cents using largest remainder so person totals sum exactly to grandTotal', () => {
    const people = ['Alice', 'Bob', 'Charlie']
    const items = [
      {
        id: '1',
        name: 'Appetizer',
        price: 10,
        splitMode: 'equal',
        splits: { Alice: true, Bob: true, Charlie: true }
      }
    ]
    const results = calculateResults({
      people,
      items,
      taxInput: '1.00',
      tipInput: '15',
      tipIsPercentage: true
    })

    expect(results.totalSubtotal).toBe(10)
    expect(results.absoluteTax).toBe(1)
    expect(results.absoluteTip).toBe(1.5)
    expect(results.grandTotal).toBe(12.5)

    const sumTotalsCents = results.breakdown.reduce((sum, p) => sum + Math.round(p.total * 100), 0)
    expect(sumTotalsCents).toBe(1250)
    results.breakdown.forEach(p => {
      expect(Math.round((p.subtotal + p.taxShare + p.tipShare) * 100)).toBe(Math.round(p.total * 100))
    })
  })

  it('should track per-person assigned items and split details accurately', () => {
    const people = ['Alice', 'Bob', 'Charlie']
    const items = [
      {
        id: '1',
        name: 'Solo Coffee',
        price: 5,
        splitMode: 'equal',
        splits: { Alice: true }
      },
      {
        id: '2',
        name: 'Shared Pizza',
        price: 24,
        splitMode: 'equal',
        splits: { Alice: true, Bob: true }
      },
      {
        id: '3',
        name: 'Wine Bottle',
        price: 30,
        splitMode: 'shares',
        splits: { Alice: 0, Bob: 2, Charlie: 1 }
      }
    ]

    const results = calculateResults({
      people,
      items,
      taxInput: '0.00',
      tipInput: '0',
      tipIsPercentage: true
    })

    const alice = results.breakdown.find(p => p.name === 'Alice')
    const bob = results.breakdown.find(p => p.name === 'Bob')
    const charlie = results.breakdown.find(p => p.name === 'Charlie')

    expect(alice.items).toHaveLength(2)
    expect(alice.items[0]).toMatchObject({ name: 'Solo Coffee', shareAmount: 5, splitDetail: '' })
    expect(alice.items[1]).toMatchObject({ name: 'Shared Pizza', shareAmount: 12, splitDetail: '$24.00 ÷ 2' })

    expect(bob.items).toHaveLength(2)
    expect(bob.items[1]).toMatchObject({ name: 'Wine Bottle', shareAmount: 20, splitDetail: '2/3 shares of $30.00' })

    expect(charlie.items).toHaveLength(1)
    expect(charlie.items[0]).toMatchObject({ name: 'Wine Bottle', shareAmount: 10, splitDetail: '1/3 shares of $30.00' })
  })
})

describe('validation, share links, and copy-paste formatting', () => {
  it('should distribute units across positive weights without giving remainders to zero weights', () => {
    expect(distributeUnits(1000, [1, 0, 1, 1])).toEqual([334, 0, 333, 333])
    expect(distributeUnits(100, [0, 0])).toEqual([0, 0])
  })

  it('should detect percentage and exact split mismatches via getItemValidationError', () => {
    const people = ['Alice', 'Bob']
    expect(getItemValidationError({ splitMode: 'equal', splits: {} }, people)).toBe('Unassigned')
    expect(getItemValidationError({
      price: 20,
      splitMode: 'percentage',
      splits: { Alice: 50 }
    }, people)).toBe('Splits 50.0% ≠ 100%')
    expect(getItemValidationError({
      price: 20,
      splitMode: 'exact',
      splits: { Alice: 10, Bob: 5 }
    }, people)).toBe('Splits ≠ $20.00')
    expect(getItemValidationError({
      price: 20,
      splitMode: 'exact',
      splits: { Alice: 12.5, Bob: 7.5 }
    }, people)).toBeNull()
  })

  it('should format copy-paste breakdown per person with assigned items and shareable link without reporting equal split for everything', () => {
    const people = ['Alice', 'Bob']
    const items = [
      { id: '1', name: 'Pad Thai', price: 16, splitMode: 'equal', splits: { Alice: true } },
      { id: '2', name: 'Appetizer', price: 12, splitMode: 'equal', splits: { Alice: true, Bob: true } },
      { id: '3', name: 'Sake', price: 30, splitMode: 'shares', splits: { Alice: 1, Bob: 2 } }
    ]
    const results = calculateResults({
      people,
      items,
      taxInput: '5.80',
      tipInput: '20',
      tipIsPercentage: true
    })
    const shareUrl = 'https://nahtonaj.github.io/bill-splitter/?s=abc123'
    const text = formatShareableText({
      splitName: 'Thai Dinner',
      results,
      tipInput: '20',
      tipIsPercentage: true,
      shareUrl
    })

    expect(text).not.toContain('(equal split)')
    expect(text).toContain('🧾 Thai Dinner')
    expect(text).toContain('• Alice — $')
    expect(text).toContain('  - Pad Thai: $16.00\n')
    expect(text).toContain('  - Appetizer: $6.00 ($12.00 ÷ 2)')
    expect(text).toContain('  - Sake: $10.00 (1/3 shares of $30.00)')
    expect(text).toContain('• Bob — $')
    expect(text).toContain('  - Sake: $20.00 (2/3 shares of $30.00)')
    expect(text).toContain(`View breakdown: ${shareUrl}`)
  })

  it('should round-trip shareable split URLs including Unicode names', () => {
    const split = {
      name: '🍜 Ramen Night — José & Friends',
      people: ['José', 'Mina'],
      items: [
        { id: 'a', name: 'Tonkotsu 豚骨', price: 18.5, splitMode: 'equal', splits: { 'José': true, Mina: false } },
        { id: 'b', name: 'Gyoza', price: 10, splitMode: 'percentage', splits: { 'José': 40, Mina: 60 } }
      ],
      taxInput: '2.85',
      tipInput: '18',
      tipIsPercentage: true
    }

    const url = buildShareUrl(split, 'https://nahtonaj.github.io/bill-splitter/')
    const token = new URL(url).searchParams.get('s')
    expect(token).toBeTruthy()

    const decoded = decodeSharePayload(token)
    expect(decoded).not.toBeNull()
    expect(decoded.name).toBe(split.name)
    expect(decoded.people).toEqual(['José', 'Mina'])
    expect(decoded.step).toBe('results')
    expect(decoded.items).toHaveLength(2)
    expect(decoded.items[0].name).toBe('Tonkotsu 豚骨')
    expect(decoded.items[0].price).toBe(18.5)
    expect(decoded.items[1].splitMode).toBe('percentage')
    expect(decoded.items[1].splits).toEqual({ 'José': 40, Mina: 60 })
    expect(decoded.taxInput).toBe('2.85')
    expect(decoded.tipInput).toBe('18')
    expect(decoded.tipIsPercentage).toBe(true)

    expect(getShareParamFromLocation({ search: `?s=${token}`, hash: '' })).toBe(token)
    expect(getShareParamFromLocation({ search: '', hash: `#s=${token}` })).toBe(token)
    expect(decodeSharePayload('not-valid-base64!!!')).toBeNull()
  })
})

const expectedData = {
  '20250206_214137.jpg': {
    subtotal: 110.00,
    tax: 13.65,
    tip: 22.00,
    grandTotal: 145.65,
    items: [
      { name: 'Khao Kai Jeow', price: 18.00 },
      { name: 'Pad See Eiw', price: 16.00 },
      { name: 'Pad See Eiw', price: 16.00 },
      { name: 'Pad Kee Mao', price: 32.00 },
      { name: 'Gang Keaw Wan', price: 22.00 },
      { name: 'Cha Yen', price: 6.00 }
    ]
  },

  '20250324_200619.jpg': {
    subtotal: 177.50,
    tax: 22.03,
    tip: 35.50,
    grandTotal: 235.03,
    items: [
      { name: 'Kor Moo Yang', price: 19.00 },
      { name: 'Kao Moo Dang Moo Krob', price: 20.00 },
      { name: 'Pad Kee Mao', price: 20.00 },
      { name: 'Pad Kee Mao', price: 20.00 },
      { name: 'Kao Pad Kaprao', price: 20.00 },
      { name: 'Pra Rama', price: 20.00 },
      { name: 'Kao Soi Chiang Mai', price: 24.00 },
      { name: 'Kao Neaw Ma Muang', price: 11.00 },
      { name: 'Jasmine Rice', price: 3.50 }
    ]
  },

  '20250706_135412.jpg': {
    subtotal: 212.24,
    tax: 22.42,
    tip: 42.45,
    grandTotal: 277.11,
    items: [
      { name: 'Fish & Chips', price: 17.29 },
      { name: 'Chicken & Waffle', price: 16.99 },
      { name: 'OJ LG Fresh Squ', price: 6.99 },
      { name: 'Pot Roast', price: 14.39 },
      { name: 'Veggie Patty', price: 2.29 },
      { name: 'OJ LG Fresh Squ', price: 6.99 },
      { name: 'CFS & Eggs', price: 18.99 },
      { name: 'ScramBowl', price: 16.99 },
      { name: 'Chicken-Fried Stk', price: 22.99 },
      { name: 'CFS & Eggs', price: 21.49 },
      { name: 'CFS 5.3oz', price: 4.99 }
    ]
  },
  '20250710_114020.jpg': {
    subtotal: 116.79,
    tax: 5.50,
    tip: 0.00,
    grandTotal: 122.29,
    items: [
      { name: "HAWAII'S BEST SNAX", price: 4.49 },
      { name: "HAWAII'S BEST SNAX", price: 4.49 },
      { name: "HAWAII'S BEST SNAX", price: 4.49 },
      { name: 'HI BEST LI-HING K BE', price: 3.39 },
      { name: 'CETAPHIL SHEER MINE', price: 14.99 },
      { name: 'CETAPHIL SHEER MINE', price: 14.99 },
      { name: 'SKATER UTENSIL SET C', price: 13.99 },
      { name: 'GINGHAM POUCH CINNAM', price: 17.99 },
      { name: 'SANRIO REEL KEYCHAIN', price: 9.99 },
      { name: 'SANRIO BANGS CLIP CI', price: 9.99 },
      { name: 'SANRIO COOLER BAG', price: 17.99 }
    ]
  },
  '20250910_195410.jpg': {
    subtotal: 175.14,
    tax: 3.82,
    tip: 0.00,
    grandTotal: 178.96,
    items: [
      { name: 'MELON YOGURT MILK 6PK 250ML*', price: 5.99 },
      { name: 'COCONUT WATER 33.8OZ', price: 2.59 },
      { name: 'MILKIS SODA BEVERAGE-BANANA', price: 6.99 },
      { name: 'SPARKLING WATER ORANGE FLAVO', price: 7.99 },
      { name: 'ALL FLAVOR SPARKLING WATER', price: 7.99 },
      { name: '1% ULTRA PASTURIZED MILK', price: 5.49 },
      { name: 'COFFEE AGAR MIX', price: 2.79 },
      { name: 'MANGO PUDDING MIX', price: 2.99 },
      { name: 'SWEETENED CONDENSED MILK', price: 4.89 },
      { name: 'HOISIN SAUCE', price: 5.99 },
      { name: 'GREEN ONION BUNCH', price: 1.17 },
      { name: 'PORK BUTT BONELESS LB', price: 11.89 },
      { name: 'MUNG BEAN SPROUTS 1 LB PK', price: 2.99 },
      { name: 'RAW SHRIMP P&D TAIL OFF', price: 16.99 },
      { name: 'RICE VERMICELLI WHITE 12OZ', price: 5.97 },
      { name: 'BELLIE RIND-ON-COUNTER LB', price: 9.58 },
      { name: 'RADISH CHINESE LB', price: 1.88 },
      { name: 'GROUND PORK A 85% LEAN-COUNT', price: 8.02 },
      { name: 'MUNG BEAN SPROUTS 1 LB PK', price: 2.99 },
      { name: 'THAI CHILI GREEN/RED PK', price: 1.49 }
    ]
  },
  '20251113_202016.jpg': {
    subtotal: 158.00,
    tax: 16.35,
    tip: 31.60,
    grandTotal: 205.95,
    items: [
      { name: 'Ton-katsu', price: 32.00 },
      { name: 'Set (Miso Soup & Rice)', price: 8.00 },
      { name: 'Salmon Battera Sushi', price: 15.00 },
      { name: 'Roku Tonic Highball', price: 10.00 },
      { name: 'Miso Black Cod Uni Cream Udon', price: 48.00 },
      { name: 'Yuzu Highball', price: 12.00 },
      { name: 'Miso-katsu', price: 16.00 },
      { name: 'Set (Miso Soup & Rice)', price: 4.00 },
      { name: 'Sudori', price: 13.00 }
    ]
  },
  '20251224_172724.jpg': {
    subtotal: 131.42,
    tax: 13.41,
    tip: 0.00,
    grandTotal: 144.83,
    items: [
      { name: 'Fried Footballs', price: 6.99 },
      { name: 'Mongolian Tofu', price: 17.99 },
      { name: 'Dried Scallop & Egg White Fried Rice', price: 19.99 },
      { name: 'White Rice', price: 6.00 },
      { name: 'Shrimp Rice Noodle Roll', price: 12.99 },
      { name: 'Bean Curd Roll With Pork & Shrimp', price: 13.00 },
      { name: 'Chicken Feet With Kabocha Pumpkin', price: 13.99 },
      { name: 'Spareribs With Rolled Noodles', price: 15.99 },
      { name: 'Fish Fillet With Sweet Corn', price: 18.99 },
      { name: 'Tea', price: 4.50 }
    ]
  },


  'Screenshot_20260415_212634_Chrome.jpg': {
    subtotal: 134.00,
    tax: 13.39,
    tip: 24.12,
    grandTotal: 165.01,
    items: [
      { name: 'Classic Ora King Salmon Temaki', price: 24.00 },
      { name: 'Classic Sugo Spicy Tuna Temaki', price: 32.00 },
      { name: 'Signature Ikura Temaki', price: 12.00 },
      { name: 'Classic Crispy Shrimp Temaki', price: 4.00 },
      { name: 'Classic Salmon Skin Temaki', price: 24.00 },
      { name: 'Classic Crispy Shrimp Temaki', price: 4.00 },
      { name: 'Calamari Furai', price: 8.00 },
      { name: 'Classic Crispy Shrimp Temaki', price: 4.00 },
      { name: 'Classic Ebi Nuoc Mam Temaki', price: 5.50 },
      { name: 'Classic Crispy Shrimp Temaki', price: 4.00 },
      { name: 'Shrimp Tempura 6pcs', price: 6.00 },
      { name: 'Classic Sugo Spicy Tuna Temaki', price: 6.50 }
    ]
  },
  'Screenshot_20260426_203232_Chrome.jpg': {
    subtotal: 97.00,
    tax: 8.36,
    tip: 17.46,
    grandTotal: 122.82,
    items: [
      { name: 'SPICY VODKA', price: 44.00 },
      { name: 'Pepperoni', price: 7.00 },
      { name: 'SPRING FRITTERS', price: 12.00 },
      { name: '12 PIECE BUFFALO WINGS', price: 21.00 },
      { name: 'SPRING ARUGULA SALAD', price: 13.00 }
    ]
  },

}

async function recognizeImage(filePath) {
  const image = await Jimp.read(filePath)
  const buffer = await image.getBuffer('image/jpeg')
  const { data: { text } } = await Tesseract.recognize(buffer, 'eng')
  return text
}

function verifyParsedReceiptAgainstGroundTruth(parsed, expected) {
  // 1. Soft-check Subtotal, Tax, Tip, GrandTotal (warn on mismatch, don't fail)
  //    OCR noise often garbles footer values, so these are informational only.
  const footerChecks = [
    ['subtotal', expected.subtotal, parsed.subtotal],
    ['tax', expected.tax, parsed.tax],
    ['tip', expected.tip, parsed.tip],
    ['grandTotal', expected.grandTotal, parsed.grandTotal]
  ]
  footerChecks.forEach(([label, exp, act]) => {
    if (exp !== null && act !== null && Math.abs(exp - act) > 0.5) {
      console.warn(`[Footer Mismatch] ${label}: expected ${exp}, got ${act}`)
    }
  })

  // 2. Verify that all expected items can be found in parsed items by price.
  //    Extra noise items are allowed. We match greedily by price.
  const usedIndices = new Set()
  let matchedCount = 0

  expected.items.forEach((expItem) => {
    let bestIdx = -1
    let bestPriceDiff = Infinity

    parsed.items.forEach((parsedItem, idx) => {
      if (usedIndices.has(idx)) return
      const diff = Math.abs(parsedItem.price - expItem.price)
      if (diff < bestPriceDiff) {
        bestPriceDiff = diff
        bestIdx = idx
      }
    })

    if (bestIdx !== -1 && bestPriceDiff < 0.50) {
      usedIndices.add(bestIdx)
      matchedCount++

      // Fuzzy name check (warn only, don't fail)
      const cleanParsedName = parsed.items[bestIdx].name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const cleanExpectedName = expItem.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const nameMatch = cleanParsedName.includes(cleanExpectedName) ||
                        cleanExpectedName.includes(cleanParsedName) ||
                        cleanParsedName.substring(0, 5) === cleanExpectedName.substring(0, 5)
      if (!nameMatch) {
        console.warn(`[Fuzzy Name Warning] Expected "${expItem.name}" ($${expItem.price}), matched to "${parsed.items[bestIdx].name}" ($${parsed.items[bestIdx].price})`)
      }
    } else {
      console.warn(`[Missing Item] Could not find match for expected "${expItem.name}" ($${expItem.price.toFixed(2)})`)
    }
  })

  // At least 70% of expected items should be matched by price
  const matchRate = matchedCount / expected.items.length
  console.log(`[Match Rate] ${matchedCount}/${expected.items.length} items matched (${(matchRate * 100).toFixed(0)}%), ${parsed.items.length} total parsed items`)
  expect(matchRate).toBeGreaterThanOrEqual(0.7)

  // Parsed should have at least as many items as expected (noise is OK)
  expect(parsed.items.length).toBeGreaterThanOrEqual(expected.items.length * 0.7)
}

describe('parseReceiptTextPure heuristics ground-truth vision tests', () => {
  const assetsDir = path.join(__dirname, '../test-assets')

  Object.entries(expectedData).forEach(([filename, expected]) => {
    it(`should parse ${filename} and match vision ground-truth`, async () => {
      const fullPath = path.join(assetsDir, filename)
      const text = await recognizeImage(fullPath)
      const parsed = parseReceiptTextPure(text)
      
      console.log(`=== Parsed Items for ${filename} ===`)
      console.log(parsed.items)
      
      verifyParsedReceiptAgainstGroundTruth(parsed, expected)
    }, 45000)
  })
})
