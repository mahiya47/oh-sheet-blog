import { useState } from 'react';
import { Mail, Hash } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

const BLANK = { type: 'complaint', subject: '', body: '' };

export default function SupportPage() {
  const toast = useToast();
  const [form, setForm] = useState(BLANK);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = () => {
    if (!form.subject.trim() || !form.body.trim()) {
      return toast('Add a subject and a description first.', 'danger');
    }
    toast("Request submitted — we'll be in touch.", 'accent');
    setForm(BLANK);
  };

  return (
    <div className="content-card">
      <h1>Help &amp; support</h1>
      <p>Something broke, or just want to say hi? Drop us a sheet and the team will get back to you.</p>

      <div className="editor" style={{ marginTop: 'var(--space-5)' }}>
        <div className="field">
          <label htmlFor="type">Issue type</label>
          <select id="type" value={form.type} onChange={set('type')}>
            <option value="complaint">Report a bug</option>
            <option value="account">Account access</option>
            <option value="feedback">General feedback</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input id="subject" type="text" value={form.subject} onChange={set('subject')} placeholder="Briefly describe the issue…" />
        </div>
        <div className="field">
          <label htmlFor="body">Description</label>
          <textarea id="body" value={form.body} onChange={set('body')} placeholder="Steps to reproduce, browser, what you expected…" />
        </div>
        <div className="editor-foot">
          <button type="button" className="btn btn-ghost" onClick={() => setForm(BLANK)}>Discard</button>
          <button type="button" className="btn btn-accent" onClick={onSubmit}>Submit request</button>
        </div>
      </div>

      <h2>Other ways to reach us</h2>
      <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={18} /> support@ohsheet.dev</p>
      <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Hash size={18} /> @OhSheetSupport on X</p>
    </div>
  );
}
