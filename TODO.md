- **BUGS:**
  - Win conditions not working - players can continue playing after game has ended
  - Problem with player elimination:
    - Player 1 hit 10300.  Game went into Final Round as expected.
    - Player 2 got a turn.  Hit 10500.  Was not eliminated as expected.  P1 was not eliminated as expected. 
    - Instead of having a chance to roll, Player 3 was incorrectly auto-eliminated - score was 5550.  Expected behavior is that Player 3 should have had a turn.  
      - If Player 3 scored a total score (turn score + game score) of more than Player 2's score (10500), then gameplay should have continued with all 3 players.
      - If Player 3 failed to score a total score (turn score + game score) higher than Player 2's score, then Player 3 should have been marked as eliminated and the game should continue with only Player 1 and Player 2
    - Player 3 failed to beat Player 1 or 2.  Player 1 takes another turn.  If Player 1 scores anything, Player 2 should get a turn to beat that score but instead Player 2 is automatically eliminated and Player 1 wins illegitimately. 


- **Fix flow in NewGameModal**:
  - Choose game type first (reorder options to: remote, local, solo)
  - Pre-populate Player Name with user's display name
  - If user enters an alternate name, store it in their Firestore user record for future use

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
