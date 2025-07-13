- **Fix flow in NewGameModal**:
  - Choose game type first (reorder options to: remote, local, solo)
  - Pre-populate Player Name with user's display name
  - If user enters an alternate name, store it in their Firestore user record for future use

- **Fix win conditions**

- **Your Turn indicators**
  - Add for remote games
  - Consider improving for local games as well

- **Disable roll/end buttons on remote**
  - When it's not your turn, ensure these controls are disabled

- **Show other player's actions in remote games**
  - Display opponent's rolls
  - Show their score options/selections
  - Consider a visual history (e.g. rolling display of banked scores per turn)

- **Improve score suggestions visually**
  - Replace "3 x 2's (200)" text with 3 die icons (e.g. `dice-2.svg`), and score below

- **Animations if possible**
  - Add subtle animations to dice rolls, score updates, turn transitions
