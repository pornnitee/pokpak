const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Pokdeng API is running!");
});

app.post("/api/pokdeng", (req, res) => {
  const { playHands, gameType } = req.body;

  if (!playHands || !Array.isArray(playHands)) {
    return res
      .status(400)
      .json({ error: "Invalid or missing playHands array" });
  }

  if (![1, 2].includes(gameType)) {
    return res
      .status(400)
      .json({ error: "Invalid or missing gameType (must be 1 or 2)" });
  }

  const result = playHands.map((hand) => {
    if (gameType === 1) return decideActionV1(hand);
    if (gameType === 2) return decideActionV2(hand, playHands);
  });

  res.json(result);
});

// ---------- Common Functions ----------
function calculatePoints(cards) {
  let total = cards.reduce((sum, card) => {
    return sum + (card.number > 10 ? 0 : card.number);
  }, 0);
  return total % 10;
}

function isPok(cards) {
  return cards.length === 2 && [8, 9].includes(calculatePoints(cards));
}

function isDeng(cards) {
  return (
    cards.length === 2 &&
    (cards[0].suit === cards[1].suit || cards[0].number === cards[1].number)
  );
}

function buildFullDeck() {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const deck = [];
  for (let number = 1; number <= 13; number++) {
    for (const suit of suits) {
      deck.push({ number, suit });
    }
  }
  return deck;
}

// ---------- Logic V1 ----------
function decideActionV1(hand) {
  const point = calculatePoints(hand);
  const pok = isPok(hand);
  const deng = isDeng(hand);

  if (pok) return "stand";
  if (point >= 7 || (point >= 5 && deng)) return "stand";
  return "hit";
}

// ---------- Logic V2 ----------
function decideActionV2(hand, allPlayHands) {
  const point = calculatePoints(hand);
  const pok = isPok(hand);
  const deng = isDeng(hand);

  const highCards = hand.filter((card) =>
    [10, 11, 12, 13].includes(card.number)
  );
  if (highCards.length === 2) {
    return "hit";
  }

  const fullDeck = buildFullDeck();
  const usedCards = [...allPlayHands].flat();
  const remainingDeck = fullDeck.filter(
    (card) =>
      !usedCards.some(
        (used) => used.number === card.number && used.suit === card.suit
      )
  );

  let countGoodDraws = 0;
  for (const drawCard of remainingDeck) {
    const simulatedHand = [...hand, drawCard];
    const newPoint = calculatePoints(simulatedHand);
    if (newPoint > 7) {
      countGoodDraws++;
    }
  }

  const chance = countGoodDraws / remainingDeck.length;
  if (chance > 0.7) return "hit";

  if (pok) return "stand";
  if (point >= 7 || (point >= 5 && deng)) return "stand";
  return "hit";
}

app.listen(PORT, () => {
  console.log(`✅ Pokdeng API running on http://localhost:${PORT}`);
});
