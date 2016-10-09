# King of Telegram Bot :crown:
This is the official repository for the King of Telegram Bot developed during the HackUPC Fall 2016 :maple_leaf:.

It is an adaptation of the famous board game King of Tokyo, but with some adaptations to make it more playable and friendly in a chat environment like Telegram.

## How can I play it? :monkey_face:

### Install it into telegram
1. Add this bot to a group
2. In the group, start a new game with /start or join an already running game with /join
3. After at least two players have joined, start the game with /close. Once closed, nobody else can participate.

### Goal
Your goal is to be the first to achieve 20 stars :smile: (or be the last monkey on the game :speak_no_evil:)

### How to play
1. Roll the dices: at the starting of your turn, you must roll the 6 dices. After that, you can pick any subset of dices and roll them again.

2. Resolve the dices: The symbols you get after rolling the dices are the actions you can take during this turn:

	>- :one:, :two:, :three:: Score Points
	>- :zap:: Energy
	>- ⚔: Attack
	>- :heart:: Life

	- If you get a triple :one:, :two: or :three:, your score will increase equally to the number of the dices. Each additional repeated value will add an extra 'score' point.

	- Each :zap: dice will increment your 'energy' score. If you get 5 'energy' points, you will be automatically rewarded with an extra 'star' point.

	- The total number of ⚔ dices you get is the damage you will do this turn.
  	- If you are in Tokyo, you will deal damage to the players outside of Tokyo.
  	- If you aren't in Tokyo, you will deal damage to the player who is controlling Tokyo.

	- Each :heart: dice will increase in one your life points. The maximum number of life points you can get is 10 and you can only heal up if you are not in Tokyo.

3. Become the king of Tokyo :crown:: At the beginning of the game, the first player to get a ⚔ dice will get the control of Tokyo. If you are attacked while being in Tokyo, you can give your spot in Tokyo to the attacker and return to the outside. If you die while you are in Tokyo, the player who attacked you automatically gets the control of Tokyo.

Enjoy! :octocat:
