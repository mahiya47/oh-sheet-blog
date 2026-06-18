import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import Avatar from '../components/Avatar.jsx';
import Feed from '../components/Feed.jsx';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { search } = useStore();
  const { posts, users } = search(q);

  if (!q.trim()) {
    return <div className="empty"><p>Type something in the search bar to find sheets and people.</p></div>;
  }

  return (
    <>
      <h1 style={{ textTransform: 'uppercase', fontSize: '1.3rem' }}>
        Results for “{q}”
      </h1>

      {users.length > 0 && (
        <section className="panel">
          <h2 className="panel-head">People ({users.length})</h2>
          {users.map((u) => (
            <Link key={u.id} to={`/profile/${u.id}`} className="mini-row" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar user={u} size={36} />
              <span>
                <span className="display" style={{ color: 'var(--text)', display: 'block', fontWeight: 700 }}>{u.displayName}</span>
                <span className="meta">@{u.username}</span>
              </span>
            </Link>
          ))}
        </section>
      )}

      <h2 style={{ textTransform: 'uppercase', fontSize: '1rem', color: 'var(--text-muted)' }}>
        Sheets ({posts.length})
      </h2>
      <Feed posts={posts} emptyTitle={`No sheets match “${q}”.`} />
    </>
  );
}
