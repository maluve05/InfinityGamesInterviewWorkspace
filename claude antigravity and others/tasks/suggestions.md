
the game looks flat next to the reference. the road and the runner are fine, the world beside them is tiny, and i want the roadside to sell the speed.

the road is wider than the screen at the bottom, so there is no ground beside it and every prop that gets close is already off screen. a palm only reaches about 165 pixels because of that. pull the road in until there is visible ground in the bottom corners, then add a near layer of props just outside the road edge, around 1.5 to 1.8 lane widths from the centre, drawn after the road so they pass in front of the runner. let them clip the frame instead of avoiding it. make the near props 2 to 2.5 times taller, the middle layer 1.2 to 1.5, keep a few small ones for scale, and alternate sides every 5 or 6 metres with some irregularity. plant everything on the ground plane and put a cloud or grass base under anything that would float.

the painted backdrop is being wasted: a flat ground fill covers it from the horizon down, so the beach never shows. only fill the ground outside the road, or draw the road at 75 to 85 percent opacity over the painting. the coast art is 16:9 and gets cropped to a narrow portrait slice, so make the next backdrop 9:16 with the horizon at 56 percent.

and there is only one world. the config says four settings but worldAt always returns coast, and the dusk cycle is forced off when the painted art loads, so nothing changes after 900 metres. give it four real palettes with their own props and skies, crossfade them over 80 metres, and let the light change with distance.
