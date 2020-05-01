import { interval, of, BehaviorSubject, fromEvent } from 'rxjs'; 
import { tap, map, filter, scan, take, withLatestFrom, distinctUntilChanged, takeWhile, takeUntil } from 'rxjs/operators';

const $mover = document.querySelector('.mover')
const $blocks = document.querySelector('.blocks')
const $points = document.querySelector('.points')

function createEl(active) {
  const li = document.createElement("li")
  li.classList.add('grid-block')
  if(active) li.classList.add('is-active')
  return li
}

const tick = interval(150).pipe(take(1000))
const row = [0,1,2,3,4,5,6,7,8,9]

const GRID = {
  WIDTH: [0,1,2,3,4,5,6,7,8,9],
  COLLECTION: []
}
const TARGET = [3,4,5,6]
const START = [0,1,2,3]

function initRow(base) {
  return function(match) {
    return base.map(row => match.includes(row))
  }
}

const generateRow = initRow(GRID.WIDTH) 

const mover$ = new BehaviorSubject(START)
const cols$ = new BehaviorSubject(generateRow(TARGET))


function updateRow(row) {
  GRID.COLLECTION.push(row)
}

const direction$ = mover$.pipe(
  scan((currentDirection, position) => {
    if(currentDirection === 'right') {
      return (position[position.length - 1] === row[row.length - 1]) ? 'left' : currentDirection
    }
    if(currentDirection === 'left') {
      return (position[0] === row[0]) ? 'right' : currentDirection
    }
  }, 'right'),
  distinctUntilChanged(),
)

const score$ = new BehaviorSubject([])

score$.pipe(
  map(matches => matches.length * 10),
  scan((total, points) => total + points, 0),
  tap(points => $points.innerHTML = points)
).subscribe()

const position = tick.pipe(
  withLatestFrom(direction$, mover$),
  map(([tick, direction, mover]) => updateArray(mover, direction)),
).subscribe(mover$)

function updateArray(obs, direction) {
  const update = direction === 'right' 
    ? obs.map(x => x + 1)
    : obs.map(x => x - 1)
  return update
}

const presses$ = fromEvent(document, 'click')

presses$.pipe(
  withLatestFrom(mover$),
  map(([click, m]) => filterShape(m)),
  tap(m => {
    m.length > 0 
      ? cols$.next(updateRow(generateRow(m)))
      : $mover.classList.add('hide')
  }),
  tap(row => addToDOM2(generateRow(row))),
  tap(matches => TARGET = matches),
  tap(matches => score$.next(matches)),
).subscribe(mover$)


mover$.pipe(
  tap(row => addToDOM(generateRow(row))),
).subscribe()

function addToDOM(row) {
  $mover.innerHTML = ""
  const DOMlist = row.map(createEl)
  DOMlist.forEach(el => {
    $mover.appendChild(el)
  })
}
function addToDOM2(row) {
  const $blockContainer = document.createElement("div")
  $blockContainer.classList.add('block-container')
  const DOMlist = row.map(createEl)
  DOMlist.forEach(el => {
    $blockContainer.appendChild(el)
  })
  $blocks.appendChild($blockContainer)
}

function filterShape(ary) {
  return ary.filter(val => {
    return TARGET.includes(val)
  })
}