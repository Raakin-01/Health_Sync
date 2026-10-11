// Max-heap priority queue implemented from scratch (no libraries).
//
// Convention: the comparator returns < 0 when `a` should come BEFORE `b`.
// Index 0 always holds the highest-priority item.
//
// Complexities:
//   insert        O(log n)      append then sift-up
//   extractMax    O(log n)      move last to root, pop, sift-down
//   peek          O(1)
//   remove(id)    O(log n)
//   updateKey     O(log n)      remove by id, then insert the new value
//   toSortedArray O(n log n)    copy + sort (non-destructive)

const defaultComparator = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const defaultId = (item) => item.id

export class MaxHeap {
  constructor(comparator = defaultComparator, idOf = defaultId) {
    this.compare = comparator
    this.idOf = idOf
    this.items = []
  }

  get size() {
    return this.items.length
  }

  isEmpty() {
    return this.items.length === 0
  }

  peek() {
    return this.items[0]
  }

  insert(item) {
    this.items.push(item)
    this._siftUp(this.items.length - 1)
    return this
  }

  extractMax() {
    const n = this.items.length
    if (n === 0) return undefined
    const top = this.items[0]
    const last = this.items.pop()
    if (n > 1) {
      this.items[0] = last
      this._siftDown(0)
    }
    return top
  }

  remove(id) {
    const index = this._indexOf(id)
    if (index === -1) return null
    const removed = this.items[index]
    const last = this.items.pop()
    if (index < this.items.length) {
      this.items[index] = last
      // The replacement can be too high OR too low, so fix both directions.
      this._siftUp(index)
      this._siftDown(index)
    }
    return removed
  }

  /** Re-prioritise an item after its value changes (e.g. score updated). */
  updateKey(id, newItem) {
    const removed = this.remove(id)
    if (removed == null) return false
    this.insert(newItem)
    return true
  }

  /** Non-destructive: returns items in priority order without mutating the heap. */
  toSortedArray() {
    return [...this.items].sort(this.compare)
  }

  _indexOf(id) {
    for (let i = 0; i < this.items.length; i += 1) {
      if (this.idOf(this.items[i]) === id) return i
    }
    return -1
  }

  // Sift-up: while the item outranks its parent, swap upward toward the root.
  _siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.compare(this.items[i], this.items[parent]) < 0) {
        this._swap(i, parent)
        i = parent
      } else {
        break
      }
    }
  }

  // Sift-down: while a child outranks the item, swap down toward the leaves.
  _siftDown(i) {
    const n = this.items.length
    for (;;) {
      const left = 2 * i + 1
      const right = 2 * i + 2
      let best = i
      if (left < n && this.compare(this.items[left], this.items[best]) < 0) best = left
      if (right < n && this.compare(this.items[right], this.items[best]) < 0) best = right
      if (best === i) break
      this._swap(i, best)
      i = best
    }
  }

  _swap(a, b) {
    const tmp = this.items[a]
    this.items[a] = this.items[b]
    this.items[b] = tmp
  }
}
