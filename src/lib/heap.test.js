// Unit tests for the from-scratch priority queue (src/lib/heap.js).
//
// MaxHeap is generic: the comparator returns a negative number when `a` should
// come out BEFORE `b`, and index 0 holds whichever item "comes first". To get a
// plain descending max-heap of numbers we therefore pass `(a, b) => b - a`.
// The queue (src/lib/queue.js) uses the same convention with its own
// effective-priority comparator.

import { describe, it, expect } from 'vitest'

import { MaxHeap } from './heap.js'

// Descending numeric comparator (largest number first).
const maxCmp = (a, b) => b - a

// Total-order comparator for objects: higher priority first, then earlier
// arrival, then id (so ties are fully deterministic).
const priorityCmp = (a, b) =>
  b.priority - a.priority || a.arrivedAt - b.arrivedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

// Tiny deterministic PRNG (mulberry32) - lets the randomized tests be repeatable
// without pulling in any library.
function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function drain(heap) {
  const out = []
  while (!heap.isEmpty()) out.push(heap.extractMax())
  return out
}

describe('MaxHeap - basic operations', () => {
  it('insert / size / peek and extracts items in descending order', () => {
    const heap = new MaxHeap(maxCmp)
    for (const n of [3, 1, 4, 1, 5, 9, 2, 6]) heap.insert(n)

    expect(heap.size).toBe(8)
    expect(heap.peek()).toBe(9)
    expect(drain(heap)).toEqual([9, 6, 5, 4, 3, 2, 1, 1])
    expect(heap.size).toBe(0)
    expect(heap.isEmpty()).toBe(true)
  })

  it('behaves sanely on an empty heap (no crash)', () => {
    const heap = new MaxHeap(maxCmp)
    expect(heap.peek()).toBeUndefined()
    expect(heap.extractMax()).toBeUndefined()
    expect(heap.size).toBe(0)
    expect(heap.isEmpty()).toBe(true)
  })
})

describe('MaxHeap - tie-break via the comparator', () => {
  it('breaks equal priorities by earlier arrival, then by id', () => {
    const heap = new MaxHeap(priorityCmp)
    heap.insert({ id: 'b', priority: 5, arrivedAt: 200 })
    heap.insert({ id: 'a', priority: 5, arrivedAt: 100 })
    heap.insert({ id: 'c', priority: 5, arrivedAt: 100 })

    expect(drain(heap).map((x) => x.id)).toEqual(['a', 'c', 'b'])
  })
})

describe('MaxHeap - updateKey', () => {
  it('moves an item up when its key is raised and down when it is lowered', () => {
    const heap = new MaxHeap(priorityCmp)
    heap.insert({ id: 'x', priority: 1, arrivedAt: 0 })
    heap.insert({ id: 'y', priority: 2, arrivedAt: 0 })
    heap.insert({ id: 'z', priority: 3, arrivedAt: 0 })

    expect(heap.updateKey('x', { id: 'x', priority: 10, arrivedAt: 0 })).toBe(true)
    expect(heap.peek().id).toBe('x')

    heap.updateKey('z', { id: 'z', priority: 0, arrivedAt: 0 })

    expect(drain(heap).map((d) => d.id)).toEqual(['x', 'y', 'z'])
  })

  it('returns false for an unknown id', () => {
    const heap = new MaxHeap(priorityCmp)
    heap.insert({ id: 'a', priority: 1, arrivedAt: 0 })
    expect(heap.updateKey('nope', { id: 'nope', priority: 99, arrivedAt: 0 })).toBe(false)
    expect(heap.size).toBe(1)
  })
})

describe('MaxHeap - remove', () => {
  it('removes from the middle and preserves the heap property', () => {
    const heap = new MaxHeap(priorityCmp)
    const items = [
      { id: 'a', priority: 5, arrivedAt: 0 },
      { id: 'b', priority: 3, arrivedAt: 0 },
      { id: 'c', priority: 8, arrivedAt: 0 },
      { id: 'd', priority: 1, arrivedAt: 0 },
      { id: 'e', priority: 9, arrivedAt: 0 },
      { id: 'f', priority: 7, arrivedAt: 0 },
    ]
    for (const item of items) heap.insert(item)

    expect(heap.remove('c').id).toBe('c')
    expect(heap.remove('d').id).toBe('d')
    expect(drain(heap).map((x) => x.id)).toEqual(['e', 'f', 'a', 'b'])
  })

  it('returns null for an unknown id and leaves the heap unchanged', () => {
    const heap = new MaxHeap(priorityCmp)
    heap.insert({ id: 'a', priority: 1, arrivedAt: 0 })
    expect(heap.remove('nope')).toBeNull()
    expect(heap.size).toBe(1)
  })
})

describe('MaxHeap - toSortedArray', () => {
  it('returns a sorted copy without mutating the heap', () => {
    const heap = new MaxHeap(maxCmp)
    for (const n of [3, 1, 2]) heap.insert(n)

    const snapshot = [...heap.items]
    const sorted = heap.toSortedArray()

    expect(sorted).toEqual([3, 2, 1])
    expect(heap.items).toEqual(snapshot)
    expect(heap.size).toBe(3)
    expect(heap.peek()).toBe(3)
    expect(drain(heap)).toEqual([3, 2, 1])
  })
})

describe('MaxHeap - randomized (seeded, deterministic)', () => {
  it('extracts 200 random items in the same order as a sorted array', () => {
    const rand = mulberry32(12345)
    const items = Array.from({ length: 200 }, (_, i) => ({
      id: `id-${String(i).padStart(3, '0')}`,
      priority: Math.floor(rand() * 1000),
      arrivedAt: Math.floor(rand() * 1000),
    }))

    const heap = new MaxHeap(priorityCmp)
    for (const item of items) heap.insert(item)

    const expected = [...items].sort(priorityCmp).map((x) => x.id)
    const actual = drain(heap).map((x) => x.id)

    expect(actual).toEqual(expected)
  })

  it('stays consistent through a random mix of insert / updateKey / remove', () => {
    const rand = mulberry32(999)
    const heap = new MaxHeap(priorityCmp)
    const model = new Map()

    const makeItem = (id) => ({
      id,
      priority: Math.floor(rand() * 50),
      arrivedAt: Math.floor(rand() * 50),
    })

    for (let i = 0; i < 60; i += 1) {
      const id = `k${i}`
      const item = makeItem(id)
      heap.insert(item)
      model.set(id, item)
    }

    for (let step = 0; step < 200; step += 1) {
      const roll = rand()
      const keys = [...model.keys()]

      if (roll < 0.5 || keys.length === 0) {
        const id = `k${60 + step}`
        const item = makeItem(id)
        heap.insert(item)
        model.set(id, item)
      } else {
        const id = keys[Math.floor(rand() * keys.length)]
        if (roll < 0.8) {
          const item = makeItem(id)
          expect(heap.updateKey(id, item)).toBe(true)
          model.set(id, item)
        } else {
          expect(heap.remove(id).id).toBe(id)
          model.delete(id)
        }
      }
    }

    const expected = [...model.values()].sort(priorityCmp).map((x) => x.id)
    const actual = drain(heap).map((x) => x.id)

    expect(actual).toEqual(expected)
  })
})
