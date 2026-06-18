import { Link } from 'react-router-dom';
import { Sheet } from 'lucide-react';
import SheetCard from './SheetCard.jsx';

// Renders a list of posts, or a friendly empty state. Used by the main feed,
// the following feed, trending, profile, and search.
export default function Feed({ posts, emptyTitle = 'No sheets here yet.', emptyHint, emptyTo, emptyToLabel }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="empty">
        <Sheet size={32} />
        <p>{emptyTitle}</p>
        {emptyHint && <p style={{ marginTop: 6 }}>{emptyHint}</p>}
        {emptyTo && (
          <p style={{ marginTop: 12 }}>
            <Link to={emptyTo}>{emptyToLabel || 'Explore'}</Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="feed-col">
      {posts.map((post) => <SheetCard key={post.id} post={post} />)}
    </div>
  );
}
