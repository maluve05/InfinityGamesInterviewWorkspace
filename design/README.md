# design/

| Path | What goes here | Who writes it |
| --- | --- | --- |
| `directions/a`, `b`, `c` | Phone-sized HTML mockups of the key screens per direction | Claude |
| `frames/` | PNG of each chosen, hand-edited Figma frame (the reference) | Claude (from Figma) or you (export) |
| `specs/<screen>.md` | Layout, elements, states and motion for each screen | Claude |
| `tokens.css` | Locked design tokens; `public/styles.css` imports these values | Claude |
| `compare/` | Screenshots from `npm run shots` next to the frames | script |

Process: `processes/design-first.md`. Skill: `.agents/skills/design-first/`.
Only Claude edits this folder. Workers never do.
