import { GitBranch, Info } from 'lucide-react';
import { STATIC_PAGES } from '../data/staticContent.js';

const ICONS = { GitBranch, Info };

// One component renders all four info pages from data in staticContent.js,
// instead of the four near-identical HTML files the original shipped.
export default function StaticPage({ page }) {
  const data = STATIC_PAGES[page];
  if (!data) return null;

  return (
    <div className="content-card">
      <h1>{data.title}</h1>
      {data.blocks.map((block, i) => {
        if (block.type === 'h2') return <h2 key={i}>{block.text}</h2>;
        if (block.type === 'p') return <p key={i}>{block.text}</p>;
        if (block.type === 'ul') {
          return (
            <ul key={i}>
              {block.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
        }
        if (block.type === 'callout') {
          const Icon = ICONS[block.icon] || Info;
          return (
            <div className="callout" key={i}>
              <Icon size={40} />
              <div>
                <h2>{block.title}</h2>
                <p>{block.text}</p>
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
