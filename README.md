# starship

Here's a basic "Hello, world!" example:

```ts
import {
  StarshipConfig,
  StarshipInit,
  StarshipDestroy,
  StarshipUpdate,
  run,
  drawText,
  FONT_8x8,
  isButtonDown,
  Button,
} from '@vsmode/starship'

// The game state
interface GameState {
  x: 0
  y: 0
}

// Set game configuration options
const config: StarshipConfig = {
  title: 'My Game',
  canvas: { x: 256, y: 144 },
  fps: 60,
}

// Creates the initial game state
const init: StarshipInit<GameState> = () => {
  return {
    x: 0,
    y: 0,
  }
}

// Do any clean up here before the game ends
const destroy: StarshipDestroy<GameState> = _ => {
  // ...
}

// This runs every frame
const update: StarshipUpdate<GameState> = (state, _) => {
  clear()
  drawText(FONT_8x8, 'Hello, World!', state)
  if (isButtonDown(Button.Up)) {
    state.y--
  }
  if (isButtonDown(Button.Down)) {
    state.y++
  }
  if (isButtonDown(Button.Left)) {
    state.x--
  }
  if (isButtonDown(Button.Right)) {
    state.x++
  }
}

// Start the game! :)
run(config, init, destroy, update)

```