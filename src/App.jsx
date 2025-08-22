import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function PokerLoca() {
  // ---------------- UI STATE ----------------
  const [hand, setHand] = useState([]);
  const [board, setBoard] = useState([]);
  const [step, setStep] = useState("preflop");
  const [message, setMessage] = useState("Click 'Deal Hand' to start!");
  const [page, setPage] = useState("trainer"); // menu control

  // ---------------- DECK HELPERS ----------------
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

  function makeOrderedDeck(){
    const deck = [];
    for (const s of suits) {
      for (const v of values) deck.push(v + s);
    }
    return deck; // length 52
  }

  const newDeck = () => {
    // Shuffled deck for gameplay
    const deck = makeOrderedDeck();
    return deck.sort(() => Math.random() - 0.5);
  };

  const [deck, setDeck] = useState(newDeck());

  // ---------------- GAME ACTIONS ----------------
  const dealHand = () => {
    const freshDeck = newDeck();
    setHand([freshDeck[0], freshDeck[1]]);
    setBoard([]);
    setStep("flop");
    setDeck(freshDeck.slice(2));
    setMessage("Flop is next. What's your move?");
  };

  const dealFlop = () => {
    setBoard(deck.slice(0,3));
    setDeck(deck.slice(3));
    setStep("turn");
    setMessage("Turn card. Stay sharp!");
  };

  const dealTurn = () => {
    setBoard(prev => [...prev, deck[0]]);
    setDeck(deck.slice(1));
    setStep("river");
    setMessage("River time! Final card.");
  };

  const dealRiver = () => {
    setBoard(prev => [...prev, deck[0]]);
    setDeck(deck.slice(1));
    setStep("showdown");
    setMessage("Showdown! Evaluate your hand.");
  };

  // ---------------- PRESENTATION ----------------
  const Card = ({ card, index, small=false }) => (
    <motion.div
      key={index}
      className={`${small ? 'w-10 h-16 text-lg' : 'w-16 h-24 text-2xl'} rounded-lg flex items-center justify-center font-bold shadow-md bg-white border ${card.includes("♥") || card.includes("♦") ? 'text-red-600' : 'text-black'}`}
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      {card}
    </motion.div>
  );

  const RankingRow = ({ title, cards, description }) => (
    <motion.div
      className="flex items-center space-x-3 p-3 bg-black/40 rounded-xl shadow-md hover:bg-black/60 transition"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex space-x-1">
        {cards.map((c, i) => <Card key={i} card={c} index={i} small={true} />)}
      </div>
      <div>
        <div className="font-semibold text-lg">{title}</div>
        <p className="text-xs text-slate-300">{description}</p>
      </div>
    </motion.div>
  );

  const rankingData = [
    { title: 'Royal Flush', cards: ['A♠','K♠','Q♠','J♠','10♠'], desc: 'Ace-high straight flush. The absolute nuts—only possible in one suit.' },
    { title: 'Straight Flush', cards: ['5♥','6♥','7♥','8♥','9♥'], desc: 'Five in a row, same suit. Higher top card beats a lower one.' },
    { title: 'Four of a Kind', cards: ['9♣','9♦','9♥','9♠','K♦'], desc: 'All four cards of the same rank plus any fifth card (kicker).' },
    { title: 'Full House', cards: ['Q♣','Q♦','Q♠','5♥','5♣'], desc: 'Three of one rank + two of another. Higher trips decide ties.' },
    { title: 'Flush', cards: ['2♦','7♦','9♦','J♦','K♦'], desc: 'Any five cards of the same suit, not in sequence. Compare highest cards.' },
    { title: 'Straight', cards: ['4♣','5♦','6♠','7♥','8♠'], desc: 'Five in a row, mixed suits. A2345 (wheel) is the lowest straight.' },
    { title: 'Three of a Kind', cards: ['7♣','7♦','7♠','K♥','2♣'], desc: 'Three cards of the same rank plus two kickers.' },
    { title: 'Two Pair', cards: ['J♣','J♦','3♠','3♥','9♦'], desc: 'Two different pairs plus a kicker. Highest pair first, then second, then kicker.' },
    { title: 'One Pair', cards: ['A♣','A♦','4♠','8♥','9♣'], desc: 'Two cards of the same rank plus three kickers. Kickers break ties.' },
    { title: 'High Card', cards: ['2♣','7♦','9♥','J♠','K♣'], desc: 'No combination. Compare highest card, then next highest, and so on.' }
  ];

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-green-800 to-green-900 text-white p-6">
      <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg tracking-wide">PokerLoca 🃏</h1>

      {/* Navigation Menu */}
      <div className="flex flex-wrap gap-3 mb-10">
        <button onClick={() => setPage("trainer")} className={`px-4 py-2 rounded-full font-bold shadow-lg ${page==='trainer' ? 'bg-yellow-500 text-black' : 'bg-black/40'}`}>Trainer</button>
        <button onClick={() => setPage("basics")} className={`px-4 py-2 rounded-full font-bold shadow-lg ${page==='basics' ? 'bg-yellow-500 text-black' : 'bg-black/40'}`}>Basics</button>
        <button onClick={() => setPage("rankings")} className={`px-4 py-2 rounded-full font-bold shadow-lg ${page==='rankings' ? 'bg-yellow-500 text-black' : 'bg-black/40'}`}>Hand Rankings</button>
      </div>

      {page === "trainer" && (
        <>
          {/* Player hand */}
          <div className="flex space-x-4 mb-6">
            {hand.map((c,i) => <Card card={c} key={i} index={i} />)}
          </div>

          {/* Board */}
          <div className="flex space-x-4 mb-6">
            {board.map((c,i) => <Card card={c} key={i} index={i} />)}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 mb-6 justify-center">
            {step === "preflop" && (
              <button onClick={dealHand} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition">🎲 Deal Hand</button>
            )}
            {step === "flop" && (
              <button onClick={dealFlop} className="bg-red-500 hover:bg-red-600 font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition">🔥 Deal Flop</button>
            )}
            {step === "turn" && (
              <button onClick={dealTurn} className="bg-blue-500 hover:bg-blue-600 font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition">➡️ Deal Turn</button>
            )}
            {step === "river" && (
              <button onClick={dealRiver} className="bg-purple-500 hover:bg-purple-600 font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition">🏁 Deal River</button>
            )}
            {step === "showdown" && (
              <button onClick={dealHand} className="bg-green-500 hover:bg-green-600 font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition">🔄 New Hand</button>
            )}
          </div>

          {/* Coach message */}
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-semibold mt-4 bg-black/40 rounded-xl px-6 py-4 shadow-inner max-w-lg text-center"
          >
            {message}
          </motion.div>
        </>
      )}

      {page === "basics" && (
        <div className="mt-6 bg-black/30 rounded-2xl p-6 shadow-lg max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">📘 Poker Basics</h2>
          <p className="mb-2">• Each player gets 2 hole cards. Use them + the 5 community cards to make the best 5-card hand.</p>
          <p className="mb-2">• Betting happens before the flop, after the flop, after the turn, and after the river.</p>
          <p className="mb-2">• If more than one player is left after the river → showdown.</p>
        </div>
      )}

      {page === "rankings" && (
        <div className="mt-6 bg-black/30 rounded-2xl p-6 shadow-lg w-full max-w-3xl">
          <h2 className="text-2xl font-bold mb-2">🏆 Hand Rankings (Best → Worst)</h2>
          <div className="space-y-3">
            {rankingData.map((r, idx) => (
              <RankingRow key={idx} title={r.title} cards={r.cards} description={r.desc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
