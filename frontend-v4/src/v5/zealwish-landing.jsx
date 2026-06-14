const { useEffect, useState, useCallback } = React;

const ZEALWISH_BROWSER_AVATAR_FALLBACK = "assets/zealwish-main-character.png";

const voiceLines = [
  "“Welcome back. You sounded tired yesterday — better today?”",
  "“You never finished the story about the rooftop. Start there.”",
  "“Day 27 together. I kept the moment you laughed at your own joke.”"
];

function TopBar({ onConnectWallet, wallet }) {
  const walletLabel =
    wallet?.shortAddress ||
    (wallet?.status === "connecting" ? "Connecting..." : "Connect OKX Wallet");
  return (
    <header className="topbar">
      <a className="brand display" href="#top" aria-label="ZEALWISH home">ZEALWISH</a>
      <nav className="nav" aria-label="Primary navigation">
        <a href="web.html#/home">ZEALWISH Web</a>
        <a href="#create">Create</a>
        <a href="#web3">Web3</a>
        <a href="#memory">Memory</a>
        <a href="#worlds">Worlds</a>
      </nav>
      <div className="topbar-actions">
        <a className="secondary-button edge" href="web.html#/home">Open ZEALWISH Web</a>
        <button className="wallet-button edge" onClick={onConnectWallet}>{walletLabel}</button>
      </div>
    </header>
  );
}

function VoiceWave({ bars = 26, className = "" }) {
  const heights = Array.from({ length: bars }, (_, i) => {
    const h = 0.3 + 0.62 * Math.abs(Math.sin(i * 0.85) * Math.cos(i * 0.37));
    return Math.round(h * 100) / 100;
  });
  return (
    <div className={`voice-wave ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <i key={i} style={{ "--h": h, "--i": i }} />
      ))}
    </div>
  );
}

function VoicePanel() {
  const [lineIndex, setLineIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setLineIndex((index) => (index + 1) % voiceLines.length),
      4200
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="voice-panel" role="presentation">
      <div className="voice-panel-head mono">
        <span className="live-dot" aria-hidden="true" />
        Voice session / live
      </div>
      <VoiceWave bars={30} />
      <p className="voice-line mono" key={lineIndex}>{voiceLines[lineIndex]}</p>
    </div>
  );
}

function Web3Rail() {
  const nodes = [
    ["TALK", "Speak first", "Voice sessions, zero setup"],
    ["AI", "Shape a character", "Personality, voice, origin"],
    ["NFT", "Mint the passport", "Identity and provenance"],
    ["WORLD", "Carry it forward", "Games, agents, creators"]
  ];

  return (
    <div className="web3-rail" aria-label="From voice to ownership flow">
      {nodes.map(([code, title, body]) => (
        <div className="rail-node" key={code}>
          <span className="rail-code mono">{code}</span>
          <b>{title}</b>
          <small>{body}</small>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-copy">
        <div className="kicker mono">Voice-first AI companion / Wallet-owned identity</div>
        <h1 className="display">ZEALWISH</h1>
        <h2>Talk to a character that <span>remembers</span> you.</h2>
        <p>
          Press talk and a living character answers — voice first, keyboard optional.
          It keeps your moments, learns your rhythms, and grows a personality that
          belongs to your wallet, not a platform database.
        </p>
        <div className="actions">
          <a className="primary-button edge" href="web.html#/talk">Start talking — free</a>
          <a className="secondary-button edge" href="web.html#/create">Create your character</a>
        </div>
        <div className="signal-strip mono" aria-label="Product pillars">
          <div><strong>01</strong><span>Voice-first sessions</span></div>
          <div><strong>02</strong><span>Living memory</span></div>
          <div><strong>03</strong><span>Wallet-owned</span></div>
          <div><strong>04</strong><span>Cross-world identity</span></div>
        </div>
        <Web3Rail />
      </div>

      <div className="character-stage" aria-label="ZEALWISH character preview">
        <div className="frame edge" />
        <div className="character-card">
          <div className="character-tag mono edge">ZEALWISH-0001 / Alive</div>
          <picture>
            <source srcSet="assets/zealwish-main-character.webp" type="image/webp" />
            <img
              src={ZEALWISH_BROWSER_AVATAR_FALLBACK}
              alt="ZEALWISH red signal AI character"
              loading="eager"
            />
          </picture>
          <VoicePanel />
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const words = ["Voice", "Memory", "Wallet", "NFT Passport", "Presence", "Own", "Carry", "Evolve"];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track mono">
        {[...words, ...words, ...words, ...words].map((word, index) => (
          <span key={`${word}-${index}`}><b>ZEALWISH</b> / {word}</span>
        ))}
      </div>
    </div>
  );
}

function Web3IntroSection() {
  const cards = [
    ["01 / Wallet", "Wallet-Owned Identity", "The user begins with a wallet-controlled account, not another platform-locked profile trapped inside one app."],
    ["02 / NFT", "Character Passport NFT", "A unique token can represent the AI character's identity, provenance, permissions, and future creator assets."],
    ["03 / Memory", "Memory Vault", "Important relationship memories can stay private off-chain while hashes, permissions, and ownership proofs preserve continuity."],
    ["04 / Chain", "Blockchain Anchor", "The chain is the neutral ownership layer that helps a character move into games, agent tools, and creator worlds."]
  ];

  return (
    <section id="web3" className="section ownership-thesis">
      <div className="thesis-panel edge">
        <div className="thesis-copy">
          <div className="tag mono">Built for ownership, not speculation</div>
          <h2>A wallet-owned character, not another platform-locked chatbot.</h2>
          <p>
            The Web3 story is simple: wallet, NFT, and blockchain are ownership
            infrastructure. They clarify who controls the character, how identity can be
            verified, and how memory continuity can survive beyond one platform.
          </p>
        </div>
        <div className="thesis-grid">
          {cards.map(([code, title, body]) => (
            <article className="thesis-card" key={code}>
              <div className="code mono">{code}</div>
              <h3 className="display">{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({ index, title, children }) {
  return (
    <article className="feature">
      <div className="feature-index mono">0{index}</div>
      <div>
        <h3 className="display">{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  );
}

function CreateSection() {
  return (
    <section id="create" className="section">
      <div className="section-heading">
        <div className="eyebrow mono">For every person, not one niche</div>
        <h2>Not a productivity bot. A character life system.</h2>
        <p>
          The best companion products prove one thing: people return for presence,
          memory, and personality. ZEALWISH adds the missing layer — the character can
          belong to the user's wallet, not the platform database.
        </p>
      </div>
      <div className="feature-grid">
        <Feature index="1" title="Create Your Character">
          Design a character with a visual identity, personality, voice, and origin.
          Start from a prompt, then shape the being through conversation.
        </Feature>
        <Feature index="2" title="Grow Through Memory">
          Voice sessions, moments, preferences, rituals, and emotional context become a
          relationship timeline instead of disposable chat history.
        </Feature>
        <Feature index="3" title="Own the Identity">
          The character identity can become a wallet-linked passport, backed by an
          ownership token and carried across future apps, worlds, games, and creator
          experiences.
        </Feature>
      </div>
    </section>
  );
}

function Step({ number, title, children }) {
  return (
    <article className="step edge">
      <div className="number display">{number}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

function MemorySection() {
  return (
    <section id="memory" className="section">
      <div className="section-heading">
        <div className="eyebrow mono">Memory creates continuity</div>
        <h2>A companion becomes real when it remembers.</h2>
        <p>
          ZEALWISH turns memory into the emotional spine of the product: what happened,
          what changed, what your character learned, and why the bond keeps growing.
        </p>
      </div>
      <div className="flow">
        <Step number="01" title="Seed">
          Choose a visual style, personality direction, and origin signal for your first character.
        </Step>
        <Step number="02" title="Talk">
          Build a relationship through daily voice sessions, quiet check-ins, and shared moments.
        </Step>
        <Step number="03" title="Remember">
          Important memories become a structured vault, not a lost scroll of old chats.
        </Step>
        <Step number="04" title="Carry">
          Your character identity can move into new platforms, games, and creator worlds.
        </Step>
      </div>
    </section>
  );
}

function OwnershipSection() {
  const items = [
    ["WALLET", "Wallet-Owned Identity", "A user-controlled wallet becomes the entry point for an AI character profile with visual traits, personality, provenance, and relationship state."],
    ["NFT", "Character Passport NFT", "NFT is not the product. Ownership is. The passport represents the right to carry the character identity forward."],
    ["CHAIN", "Blockchain Anchor", "Identity proofs, creator provenance, and permission records can live on neutral rails instead of a single platform database."],
    ["MEM", "Memory Vault", "Selective memories can be backed up as durable records, preserving continuity beyond one app while keeping private data protected."]
  ];
  return (
    <section id="ownership" className="section ownership">
      <div className="quote-panel edge">
        <h2 className="display">NFT is not the product. Ownership is.</h2>
        <p>
          When an AI character holds your memories, taste, relationship history, and
          digital identity, the wallet should prove continuity and control instead of
          locking the relationship inside one company forever.
        </p>
      </div>
      <div className="protocol-list">
        {items.map(([code, title, body]) => (
          <article className="protocol-item edge" key={code}>
            <div className="label mono">{code}</div>
            <div className="copy">
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorldsSection() {
  return (
    <section id="worlds" className="section">
      <div className="section-heading">
        <div className="eyebrow mono">Creator market and future worlds</div>
        <h2>Characters should travel farther than one chat window.</h2>
        <p>
          ZEALWISH starts with companion creation and memory, then expands toward creator
          skins, playable personalities, interoperable agents, and community-made
          character worlds.
        </p>
      </div>
      <div className="market-grid">
        <div className="memory-ledger edge">
          <div className="ledger-row mono"><time>DAY 001</time><strong>Character identity generated</strong><span>created</span></div>
          <div className="ledger-row mono"><time>DAY 027</time><strong>First relationship milestone unlocked</strong><span>memory</span></div>
          <div className="ledger-row mono"><time>DAY 042</time><strong>Creator skin attached to character profile</strong><span>market</span></div>
          <div className="ledger-row mono"><time>DAY 100</time><strong>Portable identity exported to a new world</strong><span>future</span></div>
        </div>
        <aside className="creator-card edge">
          <h3 className="display">Built for players, creators, collectors, and companion users.</h3>
          <p>
            The audience is broad by design: game players, virtual character fans,
            creators, collectors, and anyone who wants a long-term AI companion that
            feels personally theirs.
          </p>
          <div className="mini-grid">
            <div className="mini-tile"><b>Players</b>Bring a character into game-like worlds.</div>
            <div className="mini-tile"><b>Creators</b>Publish styles, skins, scenes, and lore.</div>
            <div className="mini-tile"><b>Companions</b>Build continuity through memory.</div>
            <div className="mini-tile"><b>Collectors</b>Own identity, not just media.</div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta">
      <div>
        <VoiceWave bars={18} className="voice-wave-cta" />
        <h2 className="display">Say the first word.</h2>
        <p>
          One voice session is all it takes. Meet a character today, and own the
          relationship — memory, identity, and all — for every world that comes next.
        </p>
        <div className="actions">
          <a className="primary-button edge" href="web.html#/talk">Start talking — free</a>
          <a className="secondary-button edge" href="web.html#/create">Create your character</a>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [wallet, setWallet] = useState(
    () => window.ZEALWISH_WALLET?.getState?.() || { status: "idle", shortAddress: "", error: "" }
  );

  useEffect(() => window.ZEALWISH_WALLET?.onChange?.(setWallet), []);

  const handleConnectWallet = useCallback(async () => {
    if (!window.ZEALWISH_WALLET?.connect) {
      setWallet({ status: "error", error: "OKX Wallet service is not loaded.", shortAddress: "" });
      return;
    }
    const next = await window.ZEALWISH_WALLET.connect();
    setWallet(next);
  }, []);

  return (
    <main className="shell">
      <TopBar onConnectWallet={handleConnectWallet} wallet={wallet} />
      <Hero />
      <Ticker />
      <Web3IntroSection />
      <CreateSection />
      <MemorySection />
      <OwnershipSection />
      <WorldsSection />
      <FinalCTA />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
