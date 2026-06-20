import { describe, it, expect } from 'vitest'
import { calculateResults } from './App'

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
