# Owner message (2026-11-07, ~16:40): "based off of the conversation i had with antigravity"

the jump is overcomplicated and it still feels wrong. i measured it: a 0 millisecond release peaks at 1.0 metres, a 54 millisecond release peaks at 1.62, and everything longer is also 1.62. the variable height only exists in the first 54 milliseconds, so every normal press is a full jump. cut to a fraction of the current velocity instead of a fixed 10.2, or clamp the peak height, and give the player 120 to 150 milliseconds to choose.

the barrier check is too generous. it clears if the runner is high at the end of the tick, at the barrier exit, at the peak, or at the entry, so you can clip the front of the barrier and still clear it. use a swept check: the height at both the entry and the exit has to be above 0.9 metres. the entry formula has the wrong sign as well, it should be y minus v times dt minus half g dt squared.

the arc is 7.5 metres at the start and 20 at max speed, and rows are 15 metres apart, so one jump deletes more than a row of gems. shorten the airtime as speed rises, or only skip a gem when the runner is above it, say 0.5 metres, not any positive height. right now a 1 centimetre hop ghosts every gem under you, and markJumpTarget also deletes one up to 28 metres ahead even after you land. drop that target marking, the arc check is enough.

add a 100 millisecond input buffer and 80 milliseconds of coyote time so presses near a landing are not eaten, and make the swipe jump hold until the finger lifts instead of jumping and releasing in the same frame. then make the scoring line cross a barrier now and then, because right now the thread never needs a jump at all.
