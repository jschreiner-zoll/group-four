/**
 * Blackjack game logic. Manages deck, hands, and game state.
 * State is returned as a plain object so it can be persisted across modal open/close.
 */

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank, 10);
}

function handTotal(hand) {
  let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
  let aces = hand.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function createInitialState() {
  return { playerHand: [], dealerHand: [], deck: [], status: 'idle', message: '' };
}

export function deal(state) {
  const deck = createDeck();
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];

  const playerTotal = handTotal(playerHand);
  if (playerTotal === 21) {
    return { deck, playerHand, dealerHand, status: 'blackjack', message: 'Blackjack! You win!' };
  }
  return { deck, playerHand, dealerHand, status: 'playing', message: '' };
}

export function hit(state) {
  if (state.status !== 'playing') return state;
  const deck = [...state.deck];
  const playerHand = [...state.playerHand, deck.pop()];
  const total = handTotal(playerHand);

  if (total > 21) {
    return { ...state, deck, playerHand, status: 'bust', message: 'Bust! You lose.' };
  }
  if (total === 21) {
    return stand({ ...state, deck, playerHand });
  }
  return { ...state, deck, playerHand };
}

export function stand(state) {
  if (state.status !== 'playing') return state;
  const deck = [...state.deck];
  const dealerHand = [...state.dealerHand];

  while (handTotal(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }

  const playerTotal = handTotal(state.playerHand);
  const dealerTotal = handTotal(dealerHand);

  let message;
  let status;
  if (dealerTotal > 21) {
    message = 'Dealer busts! You win!';
    status = 'win';
  } else if (dealerTotal > playerTotal) {
    message = 'Dealer wins.';
    status = 'lose';
  } else if (playerTotal > dealerTotal) {
    message = 'You win!';
    status = 'win';
  } else {
    message = 'Push (tie).';
    status = 'push';
  }

  return { ...state, deck, dealerHand, status, message };
}

export function getHandTotal(hand) {
  return handTotal(hand);
}
