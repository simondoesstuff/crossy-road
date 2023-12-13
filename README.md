# Crossy Road Clone

https://crossy.simonwalker.tech

WIP Crossy Road clone written on top of pure WebGL for
my computer graphics final project. Svelte Kit used to manage
UI components, like the death scree and overlayed text.


## Procedural Generation

![Procedural Gen Demo](./gitAssets/crossGen.gif)
Nov 30, 2023

![Car Gen Demo](./gitAssets/cars.gif)
Dec 11, 2023

## AI Death Messages

![AI Death Messages](./gitAssets/deathMsg.gif)
Dec 11, 2023

# Try it for yourself

at https://crossy.simonwalker.tech  
or to run the development server locally, clone the repo and run
```bash
nom install
npm run dev
```
Note, the (vercel) site will reflect all the latest changes to this
repo automatically. The entire system should be almost completely
platform-agnostic by nature of WebGL.

# Things I'm proud of
 
The code base uses a lot of interesting design patterns elegant solutions.

The movement system is tricky because the bounce/squish, rotation, and smooth movement can all
be parameterized. Even trickier, it's not clear what the movement system should do when input triggers
movement while a current step is already in progress; if it throws out the next input, it feels sticky
to the user.
- My solution: I keep a "leash" that the player is constantly being dragged towards. When the input
comes in, it only changes the leash. The player's position is actually not quantized, instead only
the leash is quantized. This gives the impression, while moving carefully, that the player is
quantized, but actually, the user has full control of the position, including, theoretically, moving
diagonally.
- I also keep track of the last time the player reached the leash so that I can create an arc from that
position to the current one to define the jump/squish. This has the nice effect that weird motions
that result in an abnormal jump are still smooth.

In the codebase, I use a listener pattern a lot. Some variables are wrapped in a Store class
that allows other classes to listen for changes to the variable. This is made it easy to
highly decouple the codebase and add new features. I also had an issue where
the UI needed to access lots of Stores in random places and the UI initialized immediately, but
the WebGL system initialized slowly.
- My solution: I made a "Front Store" that the UI could access. Once
the WebGL system initialized, the Front Store would automatically listen to the real Store and act
like a pipe.
- This has the added benefit of allowing information from the internal, game state to be slightly
modified before it reaches the UI.
- I also use this pattern to allow my WebGL manager to trigger events throughout the system
for when each frame is drawn, initialization, time between frames, etc.

Additionally:
- I used ChatGPT to generate silly death messages. I shuffled them, but stored the order so that
the same score produces the same message so that they double as achievements.
- It has mobile support; it will detect swipes and taps and translates them into the corresponding
keyboard inputs.
- Everything is procedurally generated.
- I track hit-boxes that I transform by reusing the MV matrix and do my own
collision detection.

# Total Dependencies

Overall, it is 90% pure WebGL. I implemented my own Linear Algebra and Statistics
modules and built a framework to control WebGL and how it interacts with my system.

Other Dependencies:

**Svelte Kit**
- which handles the UI and some of the more complex input handling like swipes.

**glMatrix**
- Handles all the matrix math.

**Loaders.gl**
- Loads the ply files into a format that I can use.

**Rive**
- Rive is an animation system. It's only use was to render an
interesting loading bar for < 5s that I didn't want to spend time on.

# Next Steps

1. Shadow maps
2. Water biome
3. Always more polish