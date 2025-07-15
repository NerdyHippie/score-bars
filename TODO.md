## 🐞 Bugs

- **BankedTurn is not clearing on endTurn()**
- **Score option abuse**: If there are 2 or more options and you click one, you can then click the others indefinitely to add score multiple times.

---

## 🔧 TODO

- **Fix flow in NewGameModal**:
  - Choose game type first (reorder options to: remote, local, solo)
  - Pre-populate Player Name with user's display name
  - If user enters an alternate name, store it in their Firestore user record for future use

- 🚧 **Show other player's actions in remote games** _(in progress)_
  - Display opponent's rolls
  - Show their score options/selections.  Apply a style to these areas to indicate they are disabled (easiest is partial opacity or smth)
  - Include a live log of scores banked for each turn

- **Animations if possible**
  - Add subtle animations to dice rolls, score updates, turn transitions

- **Firestore rules**
  - Ensure unauthenticated players can write to `/lobbies/` but nowhere else
  - OR revise flow so that they perform anonymous auth first, then write their name
  - Anonymous users should not be able to read/write anything under `users/` or any `games/` other than ones they’re participating in (`{document}/players/[player]/uid` match)

- **Easy account creation for anon users**
  - Offer smooth upgrade path to full account for joined players with anonymous auth
  - Auto-friend the host when they create an account

- **Friend mechanism for players**
  - Let players connect via an invite code
  - Consider direct invites for friends as an alternate joining method

- **Add game over overlay**
  - Display `🎉 {winnerName} wins!` message when game is over
  - Style as modal or full-screen overlay

- **Redirect to summary page after game ends**
  - Create `/summary` or similar route
  - Auto-navigate remote players once `gameOver` is true
  - Show scores, turns, and winner info

---

## ✅ Completed

- 🐛 Win conditions not working - players can continue playing after game has ended
- 🐛 Problem with player elimination:
  - Fixed final round behavior, validated player eligibility to continue
  - Prevented premature eliminations and enforced top score beat-checks

- ✅ Your Turn indicators
  - Added for remote games
  - Improved UI visibility

- ✅ Disable roll/end buttons on remote
  - Buttons now disable when it's not your turn

- ✅ Improve score suggestions visually
  - Replaced score text with inline dice SVGs and score label beneath
