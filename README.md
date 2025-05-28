# 🎈 planning-poker

https://planning-poker.codybarr.partykit.dev

Welcome to the party, pal!

This is a planning poker sprint planning application built with [Partykit](https://partykit.io).

## Usage

Start by running `bun run dev` to spin up the app and server.

Access local dev at: http://localhost:5173

## Deploy

Run `bun run deploy` to deploy the app and server to PartyKit.

## Debugging

bunx partykit env add VITE_PARTYKIT_HOST
https://planning-poker.codybarr.partykit.dev

## Roadmap

- [x] Add support for admins (only room admin can reveal/reset votes) - show who the admin is (I think we'll set the admin id when creating the room)
- [ ] Improve UI (style voting cards as playing cards, randomize suit for fun)
- [x] Improve User list styles (show who voted, who hasn't voted, etc)
- [ ] Add support throwing emojis at people
