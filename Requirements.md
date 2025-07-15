# Score Bars - Dice Game App

## 🎯 Overview

Score Bars is a multi-player dice game implemented in Angular using Firebase Firestore as the backend. It supports remote and local play modes, dynamic scoring, elimination-based endgame logic, and a mobile-responsive UI.

---

## 🧩 Core Features

### 🏠 Home Screen

* Lists **Active Games**, organized as:

  * **In Progress**
  * **Finished**
* Players shown with score: `Player Name (Score)`
* Displays: `Started on [date] at [time]`
* Click anywhere on game tile to resume
* Trash icon (🗑️) for deletion:

  * Confirmation modal with red-danger action button

### ➕ Start a New Game

* Modal with 3 options:

  1. **Play with a friend remotely**: Creates sharable link
  2. **Play with a friend locally**: Prompts for 2+ names
  3. **Practice alone**: Starts solo mode immediately

### 🎮 Game Board

* Responsive layout for 6 dice:

  * Wraps to 2 or 3 rows on mobile
  * Dice have SVG fallback showing “READY”
* Player list using Material chips

  * Current player highlighted
  * Eliminated players struck-through and grayed
* Buttons:

  * **Roll / Roll Again**
  * **End Turn**
* Score display:

  * Turn score
  * Scoring options clickable to bank dice
* Message Types:

  * No scoring options → red
  * All dice scored → green
  * Final round triggered → blue
  * Game over → green

---

## 🧠 Game Logic & Rules

### 🎲 Rolling Dice

* Default dice = "READY" placeholders (value = `0`)
* Rolls up to 6 dice, adjusted based on how many are banked
* If all dice score → player may roll all 6 again

### 💰 Scoring System

* Recognizes combos:

  * 1s, 5s
  * Triplets
  * 4/5/6 of a kind
  * Straights (1-6)
  * 3 Pairs
* Only scoring dice are banked
* Players can roll again if at least 1 die is banked

### 🏁 Win Condition

* First player to reach **10,000+** points triggers final round
* All other players get **one last turn** to beat that score
* Players who fail are eliminated
* Game continues among remaining players
* Last standing player wins
* Final winner triggers:

  * `gameOver = true`
  * `winnerName = '...'`
  * Firestore `gameIsFinished = true`

---

## 🧱 Tech Stack

* **Angular 20** (standalone components)
* **Firebase Firestore**
* **Material Design Components**
* **SCSS** with responsive breakpoints

---

## 🔧 Services (Refactored)

* `DiceService`: Handles generating dice and READY state
* `ScoringService`: Contains all logic for evaluating scoring combinations

---

## 🔒 Auth
Anonymous sign-in for joining players
* Includes logout option in toolbar
* On small screens:

  * Toolbar hides
  * Hamburger menu toggles logout

---

## 📱 Responsive Design

* Dice layout wraps on small screens
* Header minimized in landscape mode
* Cards and buttons scale appropriately

