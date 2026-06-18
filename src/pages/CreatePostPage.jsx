import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { useToast } from '../context/ToastContext.jsx';

const MAX = 500;

export default function CreatePostPage() {
  const { createPost } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [content, setContent] = useState('');

  const over = content.length > MAX;
  const empty = content.trim().length === 0;

  const onPost = () => {
    if (empty) return toast('Your sheet is empty.', 'danger');
    if (over) return toast(`Too long — trim ${content.length - MAX} characters.`, 'danger');
    createPost(content);
    toast('Sheet posted!', 'accent');
    navigate('/feed');
  };

  return (
    <div className="editor">
      <div className="editor-head">
        <h1>Create a sheet</h1>
        <button type="button" className="icon-btn" onClick={() => navigate('/feed')} aria-label="Close editor">
          <X size={18} />
        </button>
      </div>

      <div className="field">
        <label htmlFor="sheet-content">Content</label>
        <textarea
          id="sheet-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thought, lesson, or snippet…"
          autoFocus
        />
        <span className={`char-count ${over ? 'over' : ''}`}>{content.length} / {MAX}</span>
      </div>

      <div className="editor-foot">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/feed')}>Discard</button>
        <button type="button" className="btn btn-accent" onClick={onPost} disabled={empty || over}>Post sheet</button>
      </div>
    </div>
  );
}
