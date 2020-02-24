// -----------------------------------------------------------------------------
// Typedefs
// -----------------------------------------------------------------------------

/** Can represent a point in space or a height/width tuple, etc */
export interface Vector2 {
  x: number
  y: number
}

/** Creates a Vector2 */
export function vec2(x: number, y: number): Vector2 {
  return { x, y }
}

/** A Rectangle */
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/** Creates a rectangle */
export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
): Rectangle {
  return { x, y, width, height }
}

/** An RGBA color */
export interface Color {
  r: number
  g: number
  b: number
  a: number
}

/** Creates a Color */
export function rgba(r: number, g: number, b: number, a: number = 255): Color {
  return { r, g, b, a }
}

// -----------------------------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------------------------

/** The main configuration */
export interface StarshipConfig {
  title: string
  canvas: Vector2
  window?: Vector2
  fps?: number
}

/** Called once to initialize the state */
export type StarshipInit<T = unknown> = () => T

/** Called once to teardown */
export type StarshipDestroy<T> = (state: T) => void

/** Called each frame */
export type StarshipUpdate<T = unknown, E = unknown> = (
  state: T,
  queue: E[],
) => boolean | void

/** Runs the game */
export function run<T, E>(
  config: StarshipConfig,
  init: StarshipInit<T>,
  destroy: StarshipDestroy<T>,
  update: StarshipUpdate<T, E>,
) {
  const oldCanvas = document.querySelector('canvas')
  oldCanvas?.parentNode?.removeChild(oldCanvas)
  GFX = document.createElement('canvas').getContext('2d')!
  GFX.imageSmoothingEnabled = false
  GFX.canvas.tabIndex = 0
  GFX.canvas.width = config.canvas.x
  GFX.canvas.height = config.canvas.y
  GFX.canvas.style.imageRendering = 'pixelated'
  GFX.canvas.style.objectFit = 'contain'
  GFX.canvas.style.background = '#f0f'
  GFX.canvas.style.width = '100vw'
  GFX.canvas.style.height = '100vh'
  document.body.appendChild(GFX.canvas)
  document.body.style.overflow = 'hidden'
  document.body.style.margin = '0'
  document.body.style.padding = '0'
  const fps = config.fps ?? 60
  let state = init()
  let queue: E[] = []
  const stop = setAnimationFrame(() => {
    if (update(state, queue)) {
      destroy(state)
      stop()
    }
  }, 1000 / fps)
}

function setAnimationFrame(cb: () => void, fps: number) {
  let globalThis = window as any
  let then: number = performance.now()
  let now: number
  let delta: number
  let error: Error
  function start() {
    // Set timer globally for hot-reloading
    globalThis.STARSHIP_TIMER = requestAnimationFrame(start)
    now = performance.now()
    delta = now - then
    if (delta > fps) {
      then = now - (delta % fps)
      try {
        cb()
      } catch (err) {
        if (!error) {
          error = err
          console.log(err)
        }
      }
    }
  }
  function stop() {
    cancelAnimationFrame(globalThis.STARSHIP_TIMER)
  }
  stop()
  start()
  return stop
}

// -----------------------------------------------------------------------------
// IO
// -----------------------------------------------------------------------------

/** Buttons enumeration */
export enum Button {
  A = 90, // Z
  B = 88, // X
  Up = 265,
  Down = 264,
  Left = 263,
  Right = 262,
  Start = 257, // Enter
  Select = 32, // Spacebar
}

function keyToButton(key: string): void | Button {
  // prettier-ignore
  switch(key) {
    case 'z': return Button.A
    case 'x': return Button.B
    case 'ArrowUp': return Button.Up
    case 'ArrowDown': return Button.Down
    case 'ArrowLeft': return Button.Left
    case 'ArrowRight': return Button.Right
    case 'Enter': return Button.Start
    case ' ': return Button.Select
  }
}

const BUTTONS: { [key in Button]: number } = {
  [Button.A]: 0,
  [Button.B]: 0,
  [Button.Up]: 0,
  [Button.Down]: 0,
  [Button.Left]: 0,
  [Button.Right]: 0,
  [Button.Start]: 0,
  [Button.Select]: 0,
}

window.onkeyup = (e: KeyboardEvent) => {
  const btn = keyToButton(e.key)
  if (btn) BUTTONS[btn] = 0
}

window.onkeydown = (e: KeyboardEvent) => {
  const btn = keyToButton(e.key)
  if (btn && !BUTTONS[btn]) {
    BUTTONS[btn] = performance.now()
  }
}

/** Checks if a button is pressed this frame */
export function isButtonDown(btn: Button) {
  return BUTTONS[btn] > 0
}

/** Checks if a button is held down this frame */
export function isButtonPressed(btn: Button) {
  let delta = performance.now() - BUTTONS[btn]
  return delta < 16.666 // 1 frame at 60 FPS
}

// -----------------------------------------------------------------------------
// Audio
// -----------------------------------------------------------------------------

const SOUNDS = new Map<string, HTMLAudioElement>()

const noop = () => {}

/** Plays an audio file */
export function playSound(src: string) {
  if (!SOUNDS.has(src)) {
    const audio = new Audio(src)
    SOUNDS.set(src, audio)
  }
  if (!isSoundPlaying(src))
    SOUNDS.get(src)
      ?.play()
      // "handle" playback errors and prevent dev overlay from blowing up
      .then(noop)
      .catch(noop)
}

/** Stops an audio file */
export function stopSound(src: string) {
  const sound = SOUNDS.get(src)
  if (sound) {
    sound.pause()
    sound.currentTime = 0
  }
}

/** Returns whether a sound file is currently playing */
export function isSoundPlaying(src: string) {
  const paused = SOUNDS.get(src)?.paused ?? true
  return !paused
}

// -----------------------------------------------------------------------------
// Graphics
// -----------------------------------------------------------------------------

// TODO: Use WebGL
let GFX: CanvasRenderingContext2D
let TXT: CanvasRenderingContext2D
const FONTS = new Map<string, Font>()
const SPRITES = new Map<string, HTMLImageElement>()
const BLACK = rgba(0, 0, 0, 255)
const WHITE = rgba(255, 255, 255, 255)

const BASE64_5x5 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAeCAYAAAC7Q5mxAAACe0lEQVRoge1ZQXLDQAizPfn/l9NDQwZrJBAbt4fWusTDImBZFuJk2wieL6AsfypZ5lcc5gftVHpOfD+F7OO4yhh+7i/Ec6zl57zW2c96aCNk2T7yr8Kl9qpT76orc6ug1LqyzypV+WZ6K7EsKzLHLBC10amf8UY2fXBT3oR7Y4Ads6p6FNPLMsZ7Pr97UueD2VvVYz2w6ouOj8zHvByVEgIDcTiorwLGdRWwisWVqcTsCWpvcRg5wUcoK8NZxjajpijaC35XycpHV4Xos5KpeLveyg7/YE5U02cylhB26qqSnA1W7cQ5TIyP+cYKdAqq83XDQDkIJrKQr+g5sni+iouVmGPN+ihDHw9lCB1vBaqe2V2xlevBEqEOi+2LYcI7DZGqcTK5auAOJk2+6suu7SvQ2T2yImabZV8lgW3Y4bs+VPNXz8hl8bEhgjw3vhuLWHoTWR0Oqpk7jdvhVrGg3azL9FgOGOSbSJSvmyRs5p1jF9XGVQzKRsBtI9VgCjyU0UqmJt8VCesCDj/Rw6YxMK7Sc+ydKjCTnIbMhkeF7kCYDktSlSw10HAPXVwq/gyHc6ODm82Vauv0P9FRlZZlE+4qHqonZAdqMrGroQJWeu5ERLC1Sr/qed0+1DDZ931//5zFpvAkcGf6qp7l+HWqq6q41QGnCiWe5b9yqsSdK1FxcSOYeMXtElBdycpu1nGTfKpOh/BbcK/vn8eVTfpTqKs+0atax/vXGNVPshGmy/RYALiuZJ9wWWzbNvulOtuLq8++rMfz6Ys0kjtnTOYMkwqYhBz8dGKv+Md92G8iOUCn6QZnss70u8Nip94dkuO349i6eOKoODH8H/EF7eKqVnrE83EAAAAASUVORK5CYII='
const PARAMS_5x5 = `?charw=5&charh=5`
const BASE64_8x8 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAwCAYAAADZ9HK+AAAE/UlEQVR4nO1b25bbMAiUfPr/v+y+VC1LBhhAdrzdzEtiSVwECJCzOwaJU8Ca09/Z+TUuPz25kQ6e/sweK/SW/k+D3sfBEnnPO5RCnwtzzinXyme5fs45q7pJHmh+jVv8l2yL3qO9G1JHKgAyDC3nWN/l2KLVjtxhOMYx3ho5b2WgTgDeAaSbu2GXMDAWopcG0qea4e+dsOj0sfrtXKtpJO6kl3w0XUmJrvKSjzw5+gSh1I/mEY9qgO5ci2h3ZKIKLN50CZgCGcFWeUDpng0yK3tUU3BU37WsKxy0A1GjivSmA+AUqCpoQQaD/JSyPadL/dZYVs8oCHY4n+0xduPJfckHb4YZ9V43r+cj+kyTp9cwKc3j36XP6P9UePofMrXJGi+JPCN6TZtHq8fZNOXpKedZfqz+0YFYY5GtKvMnQIbWkjUG6AE6jqnOX9lXyOcnn9pujxFlPGv/X+7lq9lCynglgFljzekTiE5kJcVH+nVLmCWjgq7zWV5o/4ec7CjgORjxzqRoFL2RU3aVgDXO2Kaa4iOdmRIg6TPBf6DBLJDzK6Uk2lgHlgGqOu1GNnA1oiyie6e/45ZQRqGo2WJSONpElp7h7wXADv4Mulm2g+oB+OA/R+k9QLZB6jRxV2cgr3x1MpCln+ZvZT3NG8lDuiIaT//UewDWKXIN2mDkOE+GVcus+ar8DDx9NLo1PtsnRePHGPjOXFEyA8+BV8vOyrnCPtUeojOPZH55EYSuGCgTeMKibrSLrhG6/HfgyiDP6n/IVLkzsq8yZKQjswcU6Bl6lpdHk1k/hv1LqZ7PAv4cvMs4HrI1aycqTvaeK+gEQXUeyXwpASyzSIgVsevEVDdzCjD6WPIZ2gz/qJuPxrV+VR3ZfuWuXuuDh8O8DskIQWuiWt+lX2t0Vqo+I3128vdsEGUHpnFmeUR8NF56AK20Zsw6HtFbCj8F7+o/GIcxwVFpwLf8X4CHqCbJoPLGWP7euJeJ2HFWj0qNrQSg1XOxvC4PgDFe02/GwRLRprx5LyN5zotK2VqTKQ0Wj8x6Sdc5QOZfBFkMWCfISNRd/+5U2z19Wh9Uby2j7nC+J/tqwB6gU5OsFBQ93wG2LMjxUyGi7+yrmgU6CEsASt/rOyOgW2NZel0DrfWe3IwDqs5i7MYEWkaehQq/D/4zwHtyBqheVpWp8sp091WZus6z8xFddt1ufPkx6C6hO2E1bE/dz9PS768x4s7V6nK9kxB1/ZlbQeWEZ+QjWdmbBXNqq9lW0mkelu3Y/Yd/FZy94mjFohMaGUXLjzZudeWafzboouaJba6qzve+e3RRabrlRRBCpc5JA3dvFzv1yuDq9J/V/20BUDHEFGDpn9jjVPcuP3ch/R4gWq9PKEq95/nvfUK2lml6Rh9ZOnZDp31PTtaWHn2FBun5I/4ooNJE/hQ8xgjsKfrOYBre7O1Ezsl5zcuy79t6gJ+GyPkRrFKpSxwqkdbNaIw/7wGiFKnnvchir12ZGo74Z5+Rztl5tAevlt+RyaQMJjvI6+Gccx56gSa00gvauIxGOa95ePPoeRc8vmi/DKaAHte8uwERNcwMrdbhshJgRSYyhme8jByvj7AcHHbJpNE92R3HIRlV+6Dxy3sAL8VWeWl0AijKgGvc4+k5/+kI/y+g67iV7qtGiiLY01c/M1kHZQ5U8qxTnV3PoltGTL2yjvnO0f7BK34DJErn3aC/i+UAAAAASUVORK5CYII='
const PARAMS_8x8 = `?charw=8&charh=8`

/** Default 5x5 font */
export const FONT_5x5 = BASE64_5x5 + PARAMS_5x5

/** Default 8x8 font */
export const FONT_8x8 = BASE64_8x8 + PARAMS_8x8

/** Clears the canvas */
export function clear(color: Color = BLACK) {
  const { width, height } = GFX.canvas
  GFX.clearRect(0, 0, width, height)
  drawFilledRect({ x: 0, y: 0, width, height }, color)
}

/** Draws a filled rectangle */
export function drawFilledRect(rect: Rectangle, color: Color) {
  const { x, y, width: w, height: h } = rect
  const { r, g, b, a } = color
  GFX.fillStyle = `rgba(${r},${g},${b},${a / 255})`
  GFX.fillRect(Math.floor(x), Math.floor(y), w, h)
  GFX.fillStyle = 'transparent'
}

/** Draws a sprite */
export function drawSprite(src: string, rect: Rectangle, pos: Vector2) {
  if (!SPRITES.has(src)) {
    if (FONTS.has(src)) {
      SPRITES.set(src, FONTS.get(src)!.data)
    } else {
      const img = new Image()
      img.src = src
      SPRITES.set(src, img)
    }
  }
  GFX.drawImage(
    SPRITES.get(src)!,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    Math.floor(pos.x),
    Math.floor(pos.y),
    rect.width,
    rect.height,
  )
}

interface Font {
  data: HTMLImageElement
  size: Vector2
}

/** Draws text.
 *  **NOTE:** Font image file should arrange ASCII characters in a 16x9 grid.
 *  Font image src should also end with a querystring specifying char width/height.
 *  **Example**: `my_font.png?charw=8charh=8`
 */
export function drawText(
  src: string,
  text: string,
  pos: Vector2,
  color: Color = WHITE,
) {
  if (!FONTS.has(src)) {
    const img = new Image()
    const font: Font = {
      data: img,
      size: { x: 0, y: 0 },
    }
    const [url, qs] = src.split('?')
    const params = new URLSearchParams(qs)
    const x = Number(params.get('charw') ?? '8')
    const y = Number(params.get('charh') ?? '8')
    font.size = { x, y }
    img.src = url
    FONTS.set(src, font)
  }
  const font = FONTS.get(src)!
  const cols = 16
  // const rows = 6
  const charCodeOffset = 32
  const lineHeight = 1.5
  let cursorX = 0
  let cursorY = 0

  const { r, g, b, a } = color
  const needsMask = r !== 255 || g !== 255 || b !== 255 || a !== 255
  let OGX: CanvasRenderingContext2D

  // Swap the current drawing canvas with an offscreen one
  if (needsMask) {
    OGX = GFX
    TXT = document.createElement('canvas').getContext('2d')!
    TXT.imageSmoothingEnabled = false
    TXT.canvas.width = GFX.canvas.width
    TXT.canvas.height = GFX.canvas.height
    GFX = TXT
  }

  // Draw text
  for (const char of text) {
    const i = char.charCodeAt(0) - charCodeOffset
    const x = i % cols
    const y = Math.floor(i / cols)
    if (char === '\n') {
      cursorX = 0
      cursorY += font.size.y * lineHeight
    }
    drawSprite(
      src,
      {
        x: x * font.size.x,
        y: y * font.size.y,
        width: font.size.x,
        height: font.size.y,
      },
      {
        x: Math.floor(pos.x) + cursorX,
        y: Math.floor(pos.y) + cursorY,
      },
    )
    cursorX += font.size.x
  }

  // Draw the offscreen canvas into the visible canvas
  if (needsMask) {
    GFX = OGX!
    TXT.globalCompositeOperation = 'source-in'
    TXT.fillStyle = `rgba(${r},${g},${b},${a / 255})`
    TXT.fillRect(0, 0, TXT.canvas.width, TXT.canvas.height)
    GFX.drawImage(TXT.canvas, 0, 0)
  }
}
