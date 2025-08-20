import React, { useMemo, useState } from "react";

// ----- Card + Deck helpers -----
const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"]; // T = Ten
const SUITS = ["♠","♥","♦","♣"];
const RANK_VALUE = Object.fromEntries(RANKS.map((r,i)=>[r, i+2]));

function makeDeck(){
  const deck = [];
  for(const s of SUITS){
    for(const r of RANKS){
      deck.push({ r, s, code: r + s, v: RANK_VALUE[r] });
    }
  }
  return deck;
}
function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// Small utility
const byDesc = (a,b)=>b-a;

// Evaluate the best category from 7 cards (simple but solid)
function evaluate7(cards){
  // cards: array of {r,s,v}
  const counts = new Map(); // rank -> count
  const suitMap = new Map(); // suit -> cards
  for(const c of cards){
    counts.set(c.v, (counts.get(c.v)||0)+1);
    (suitMap.get(c.s) || suitMap.set(c.s, []).get(c.s)).push(c);
  }

  // Build sorted arrays
  const ranksDesc = [...counts.keys()].sort(byDesc);
  const groups = ranksDesc.map(v=>({v, n: counts.get(v)})); // e.g., {v:14, n:2}

  // Flush? (≥5 same suit)
  let flushSuit = null; let flushCards = null;
  for(const [s,arr] of suitMap.entries()){
    if(arr.length >= 5){ flushSuit = s; flushCards = arr.sort((a,b)=>b.v-a.v); break; }
  }

  // Straight helper (from array of card values unique, desc)
  function straightHigh(values){
    // values: unique, desc
    const uniq = [...new Set(values)].sort(byDesc);
    // Add wheel (A-5): treat Ace as 1
    if(uniq[0] === 14) uniq.push(1);
    let run=1;
    for(let i=0;i<uniq.length-1;i++){
      if(uniq[i] - 1 === uniq[i+1]){ run++; if(run>=5) return uniq[i-3]; } else { run=1; }
    }
    return null; // no straight
  }

  // Straight
  const straightTop = straightHigh(cards.map(c=>c.v));

  // Straight Flush
  let sfTop = null;
  if(flushSuit){
    const flushVals = flushCards.map(c=>c.v);
    sfTop = straightHigh(flushVals);
  }

  // Tally for pairs/trips/quads
  const quads = groups.find(g=>g.n===4);
  const trips = groups.filter(g=>g.n===3);
  const pairs = groups.filter(g=>g.n===2);

  // Category rank order number + label
  // 8 SF, 7 Quads, 6 FullHouse, 5 Flush, 4 Straight, 3 Trips, 2 TwoPair, 1 Pair, 0 High
  if(sfTop) return { rank: 8, name: sfTop===14?"Royal Flush":"Straight Flush" };
  if(quads) return { rank: 7, name: `Four of a Kind (${displayRank(quads.v)})` };
  if(trips.length && (pairs.length || trips.length>1)){
    // Full house: 3+2 or 3+3
    const topTrip = trips[0];
    const topPair = pairs[0] || trips[1];
    return { rank: 6, name: `Full House (${displayRank(topTrip.v)} over ${displayRank(topPair.v)})` };
  }
  if(flushSuit) return { rank:5, name:`Flush (${flushSuit})` };
  if(straightTop) return { rank:4, name:`Straight (high ${displayRank(straightTop)})` };
  if(trips.length) return { rank:3, name:`Three of a Kind (${displayRank(trips[0].v)})` };
  if(pairs.length>=2) return { rank:2, name:`Two Pair (${displayRank(pairs[0].v)} & ${displayRank(pairs[1].v)})` };
  if(pairs.length===1) return { rank:1, name:`One Pair (${displayRank(pairs[0].v)})` };
  const high = Math.max(...cards.map(c=>c.v));
  return { rank:0, name:`High Card (${displayRank(high)})` };
}

function displayRank(v){
  if(v===14) return "A"; if(v===13) return "K"; if(v===12) return "Q"; if(v===11) return "J"; if(v===10) return "10"; return String(v);
}

// Simple strategy hints
function recommendAction(street, hole, board){
  const cards = [...hole, ...board];
  const evaln = evaluate7(cards);

  const suitCounts = SUITS.map(s=>cards.filter(c=>c.s===s).length);
  const hasFlushDraw = suitCounts.some(n=>n===4);

  // crude straight-draw detector: any 4 within a 5-value window
  const uniq = [...new Set(cards.map(c=>c.v))].sort(byDesc);
  let hasStraightDraw = false;
  if(uniq[0]===14) uniq.push(1);
  for(let i=0;i<uniq.length;i++){
    const base = uniq[i];
    const window = new Set(uniq.filter(v=>v<=base && v>=base-4));
    if(window.size>=4){ hasStraightDraw = true; break; }
  }

  // Preflop: starting hand table (very simplified)
  if(street === "preflop"){
    const [a,b] = hole.map(c=>c.v).sort((x,y)=>y-x);
    const suited = hole[0].s === hole[1].s;
    const connected = Math.abs(hole[0].v - hole[1].v) === 1;
    const pair = a===b;

    if(pair && a>=8) return { move:"Raise", reason:"Strong pair preflop (8s+)." };
    if((a===14 && b>=10) || (a>=13 && b>=11)) return { move:"Raise", reason:"Two big cards play well." };
    if(suited && connected && a>=10) return { move:"Call/Raise", reason:"Suited connectors have good potential." };
    if(pair) return { move:"Call", reason:"Small pair can try to see a flop." };
    return { move:"Fold", reason:"Weak starting hand—save chips." };
  }

  // Postflop rules based on category
  if(evaln.rank>=3) return { move:"Bet", reason:`${evaln.name} is strong—bet about half the pot.` };
  if(evaln.rank===2 || evaln.rank===1){
    // One or two pair
    return { move:"Bet/Check", reason:`${evaln.name}. Bet small if few players; otherwise check/call small.` };
  }
  if(hasFlushDraw || hasStraightDraw) return { move:"Check/Call Small", reason:"You have a draw—see the next card cheaply." };
  return { move:"Check/Fold", reason:"Nothing yet—don’t invest chips without a hand." };
}

function Card({c, dim=false}){
  if(!c) return null;
  const isRed = c.s === "♥" || c.s === "♦";
  return (
    <div className={`w-12 h-16 rounded-2xl border bg-white flex flex-col items-center justify-center shadow ${dim?"opacity-60":""}`}>
      <div className="text-sm font-semibold">{c.r}</div>
      <div className={`text-xl ${isRed?"text-red-500":""}`}>{c.s}</div>
    </div>
  );
}

function Pill({children}){
  return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">{children}</span>;
}

function Section({title, children, right}){
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl shadow p-4 md:p-6 border">
      <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg md:text-xl font-semibold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function PokerLoca(){
  const [tab, setTab] = useState("trainer");

  // Game state
  const [deck, setDeck] = useState(()=>shuffle(makeDeck()));
  const [hole, setHole] = useState([]); // 2
  const [board, setBoard] = useState([]); // up to 5
  const [street, setStreet] = useState("prehand");

  function freshHand(){
    const d = shuffle(makeDeck());
    const h = [d.pop(), d.pop()];
    setDeck(d); setHole(h); setBoard([]); setStreet("preflop");
  }
  function nextStreet(){
    const d = [...deck];
    if(street === "preflop"){
      // Flop (burn omitted for simplicity)
      const f = [d.pop(), d.pop(), d.pop()];
      setBoard(f); setDeck(d); setStreet("flop");
    } else if(street === "flop"){
      setBoard(prev=>[...prev, d.pop()]); setDeck(d); setStreet("turn");
    } else if(street === "turn"){
      setBoard(prev=>[...prev, d.pop()]); setDeck(d); setStreet("river");
    }
  }

  const evaluation = useMemo(()=>{
    if(hole.length===2){
      const cards = [...hole, ...board];
      return evaluate7(cards);
    }
    return null;
  }, [hole, board]);

  const reco = useMemo(()=>{
    if(hole.length<2) return null;
    if(street === "preflop") return recommendAction("preflop", hole, []);
    if(street === "flop") return recommendAction("flop", hole, board);
    if(street === "turn") return recommendAction("turn", hole, board);
    if(street === "river") return recommendAction("river", hole, board);
    return null;
  }, [street, hole, board]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-green-100 to-green-200 p-4 md:p-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Poker Loca</h1>
          <nav className="flex gap-2">
            {[
              {id:"basics", label:"Basics"},
              {id:"hands", label:"Hand Rankings"},
              {id:"trainer", label:"Interactive Trainer"}
            ].map(t=> (
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border border-slate-300 shadow-sm ${
                  tab === t.id
                    ? "bg-green-700 text-white"
                    : "bg-white text-slate-900 hover:bg-green-50"
                }`}>
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        {tab==="basics" && (
          <Section title="Texas Hold'em in One Screen">
            <ol className="list-decimal ml-6 space-y-2 text-slate-700">
              <li>You get <b>2 hidden cards</b> (hole cards).</li>
              <li>Table shows <b>5 shared cards</b> in 3 rounds: Flop (3), Turn (1), River (1).</li>
              <li>Make the <b>best 5-card hand</b> from your 2 + the 5 on the table.</li>
              <li>On your turn: <Pill>Fold</Pill>, <Pill>Check</Pill>, <Pill>Call</Pill>, or <Pill>Bet/Raise</Pill>.</li>
              <li>Win by everyone folding or having the best hand at showdown.</li>
            </ol>
            <div className="mt-4 text-sm text-slate-500">Tip: If you hit the flop (pair or better), bet ~½ the pot. If you miss, check/fold. Draws? Call small, fold to big bets.</div>
          </Section>
        )}

        {tab==="hands" && (
          <Section title="Hand Rankings (best → worst)">
            <div className="grid md:grid-cols-2 gap-4">
              {["Royal Flush","Straight Flush","Four of a Kind","Full House","Flush","Straight","Three of a Kind","Two Pair","One Pair","High Card"].map((h,i)=> (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-white">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-semibold">{i+1}</div>
                  <div className="font-medium">{h}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-slate-600">Memorize this order. Ties use kickers (highest side cards).</div>
          </Section>
        )}

        {tab==="trainer" && (
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <Section title="Table">
                {hole.length<2 ? (
                  <div className="flex flex-col items-center py-10 gap-4">
                    <div className="text-slate-600">Click below to deal a hand.</div>
                    <button onClick={freshHand} className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold shadow hover:bg-green-700">Deal Hand</button>
                  </div>
                ):(
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-slate-600 text-sm">
                      <div className="flex items-center gap-2">Street: <Pill>{street.toUpperCase()}</Pill></div>
                      <div className="flex items-center gap-2">Evaluation: <Pill>{evaluation?.name}</Pill></div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <Card c={hole[0]}/>
                      <Card c={hole[1]}/>
                      <span className="text-slate-400">•</span>
                      {board.map((c,idx)=>(<Card key={idx} c={c}/>))}
                      {Array.from({length: 5-board.length}).map((_,i)=>(<div key={i} className="w-12 h-16 rounded-2xl border-dashed border-2 border-slate-300 bg-white/30"/>))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {street!=="river" && (
                        <button onClick={nextStreet} className="px-3 py-2 rounded-xl bg-green-700 text-white text-sm font-semibold shadow hover:bg-green-800">Reveal Next Card</button>
                      )}
                      <button onClick={freshHand} className="px-3 py-2 rounded-xl bg-white border text-sm font-semibold hover:bg-slate-50">New Hand</button>
                    </div>
                  </div>
                )}
              </Section>

              {hole.length===2 && (
                <Section title="Coach Says" right={<Pill>{reco?.move}</Pill>}>
                  <div className="text-slate-700 leading-relaxed">
                    {reco?.reason}
                  </div>
                  <div className="mt-3 text-xs text-slate-500">Rule of thumb: Bet ~½ pot when it says “Bet”. “Check/Call Small” = call small bets only.</div>
                </Section>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Section title="Quick Tips">
                <ul className="space-y-2 text-slate-700 text-sm">
                  <li>Play <b>tight</b> preflop: big cards, pairs, suited connectors.</li>
                  <li>Hit the flop? <b>Bet small/medium</b>. Missed? <b>Check/Fold</b>.</li>
                  <li>Draws (1 card from straight/flush): <b>Call small</b>, fold to big bets.</li>
                  <li>Acting later = more info → you can play a bit looser.</li>
                </ul>
              </Section>
              <Section title="Mini Quiz: Which Wins?">
                <MiniQuiz/>
              </Section>
            </div>
          </div>
        )}

        <footer className="pt-2 text-center text-xs text-slate-500">
          Built for learning. No gambling here. Just vibes and probabilities.
        </footer>
      </div>
    </div>
  );
}

function MiniQuiz(){
  // curated examples so ties don’t happen
  const examples = [
    { a:["A♠","A♦","A♥","K♣","K♦"], b:["K♠","K♥","K♦","K♣","2♠"], correct:"b", why:"Four of a Kind beats Full House." },
    { a:["9♠","T♠","J♠","Q♠","K♠"], b:["2♥","2♦","2♣","2♠","A♦"], correct:"a", why:"Straight Flush beats Four of a Kind." },
    { a:["2♣","2♦","Q♥","Q♣","A♠"], b:["3♣","3♦","K♥","7♣","6♦"], correct:"a", why:"Two Pair beats One Pair." },
  ];
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState(null);
  const ex = examples[idx];
  function pick(c){ setChoice(c); }
  function next(){ setChoice(null); setIdx((i)=>(i+1)%examples.length); }

  return (
    <div>
      <div className="text-sm text-slate-600 mb-2">Pick the stronger 5-card hand:</div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={()=>pick("a")} className={`p-2 rounded-xl border bg-white text-left hover:bg-slate-50 ${choice==="a"?"ring-2 ring-green-500":""}`}>
          <HandRow codes={ex.a} label="Hand A"/>
        </button>
        <button onClick={()=>pick("b")} className={`p-2 rounded-xl border bg-white text-left hover:bg-slate-50 ${choice==="b"?"ring-2 ring-emerald-500":""}`}>
          <HandRow codes={ex.b} label="Hand B"/>
        </button>
      </div>
      {choice && (
        <div className="mt-2">
          {choice===ex.correct ? (
            <div className="text-green-700 text-sm font-medium">Correct! {ex.why}</div>
          ):(
            <div className="text-rose-700 text-sm font-medium">Not quite. {ex.why}</div>
          )}
          <button onClick={next} className="mt-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm">Next</button>
        </div>
      )}
    </div>
  );
}

function HandRow({codes, label}){
  const cs = codes.map(code=>({ r: code[0]==="T"?"10":code[0], s: code.slice(1) }));
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="flex gap-1">
        {cs.map((c,i)=>(<Card key={i} c={{r:c.r.toString(), s:c.s}}/>))}
      </div>
    </div>
  );
}
