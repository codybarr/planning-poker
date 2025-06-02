# 🎈 planning-poker

https://planning-poker.codybarr.partykit.dev

Welcome to the party, pal!

Simple planning poker app, built with [Partykit](https://partykit.io), React, and TailwindCSS.

## Usage

1. `npm install`
2. `npm run dev`

Access local dev at: http://localhost:5173

## Deploy

Automatically deployed on push to main.

_To manually deploy run `npm run deploy`_

## Roadmap

- [x] Add support for admins (only room admin can reveal/reset votes) - show who the admin is (I think we'll set the admin id when creating the room)
- [x] Improve UI
- [x] fix: refreshing renames Player 1, 2, etc. (to highest numbered player)
- [x] Improve User list styles (show who voted, who hasn't voted, etc)
- [x] Style voting cards as playing cards, randomize suit for fun
- [x] Add support for throwing emojis at people
- [x] Add github link
- [x] fix resizing body issue when throwing emojis
- [ ] add support for more emojis
- [ ] Show voting stats (eg. average, most common, etc.)
- [ ] Refactor to svelte (or at least optimize build?)
