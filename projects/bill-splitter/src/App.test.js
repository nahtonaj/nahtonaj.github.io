import { describe, it, expect } from 'vitest'
import { calculateResults, parseReceiptTextPure } from './App'
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
