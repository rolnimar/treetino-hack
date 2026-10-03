import { useEffect, useState } from 'react';
import type { ProtocolInfo } from '@treetino/contracts';

export function App() {
  const [protocol, setProtocol] = useState<ProtocolInfo | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/protocol', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Backend unavailable');
        return (await response.json()) as ProtocolInfo;
      })
      .then(setProtocol)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError'))
          setUnavailable(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <main>
      <header>
        <a className="brand" href="/">
          treetino<span aria-hidden="true">↗</span>
        </a>
        <span className="network">
          <span className="dot" />
          Solana devnet
        </span>
      </header>
      <section className="hero">
        <p className="eyebrow">SHARED OWNERSHIP · CLEAN ENERGY</p>
        <h1>
          A little share.
          <br />A lasting <em>impact.</em>
        </h1>
        <p className="intro">
          Fund an energy tree together. Share in the revenue from the energy it
          produces.
        </p>
        <a className="button" href="#how-it-works">
          How it works <span aria-hidden="true">↓</span>
        </a>
        <div className="tree" aria-hidden="true">
          <div className="canopy c1" />
          <div className="canopy c2" />
          <div className="canopy c3" />
          <div className="trunk" />
          <div className="ground" />
        </div>
      </section>
      <section
        className="steps"
        id="how-it-works"
        aria-label="How Treetino works"
      >
        <article>
          <span>01 / FUND</span>
          <h2>Own a part of a tree.</h2>
          <p>
            Contribute USDC toward a tree and receive shares in its energy
            revenue.
          </p>
        </article>
        <article>
          <span>02 / GENERATE</span>
          <h2>Energy with a purpose.</h2>
          <p>
            An installed tree supplies energy to a client and reports its
            production.
          </p>
        </article>
        <article>
          <span>03 / SHARE</span>
          <h2>Revenue comes back.</h2>
          <p>
            When the client pays for that energy, shareholders can claim their
            portion.
          </p>
        </article>
      </section>
      <footer>
        <p>Treetino · Devnet demo</p>
        <p role="status">
          {protocol
            ? 'Backend connected'
            : unavailable
              ? 'Backend unavailable'
              : 'Connecting to backend…'}
        </p>
      </footer>
    </main>
  );
}
