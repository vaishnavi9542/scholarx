import { useEffect, useMemo, useState } from 'react';
import {
  clearToken,
  createTask,
  deleteTask,
  fetchTasks,
  getToken,
  login,
  me,
  register,
  setToken,
  updateTask
} from './api';

const demoCredentials = {
  email: 'demo@scholarx.dev',
  password: 'Password123!'
};

const emptyDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  dueDate: ''
};

const defaultAuth = {
  name: '',
  email: '',
  password: ''
};

const statusLabels = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done'
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

function formatDate(value) {
  if (!value) {
    return 'No deadline';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function App() {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    highPriority: 0,
    completionRate: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all'
  });
  const [draft, setDraft] = useState(emptyDraft);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(defaultAuth);
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const [profile, taskPayload] = await Promise.all([me(), fetchTasks(filters)]);

        if (cancelled) {
          return;
        }

        setUser(profile.user);
        setTasks(taskPayload.tasks);
        setSummary(taskPayload.summary);
        setMessage('');
        setError('');
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        clearToken();
        setTokenState('');
        setUser(null);
        setTasks([]);
        setSummary({
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          highPriority: 0,
          completionRate: 0
        });
        setError(requestError.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters, token]);

  const completionWidth = `${summary.completionRate}%`;

  const taskStats = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status !== 'done').length;
    const blockedTasks = tasks.filter((task) => task.priority === 'high' && task.status !== 'done').length;

    return [
      { label: 'Total tasks', value: summary.total, tone: 'neutral' },
      { label: 'Completed', value: summary.completed, tone: 'positive' },
      { label: 'In progress', value: summary.inProgress, tone: 'focus' },
      { label: 'Overdue', value: summary.overdue, tone: 'warning' },
      { label: 'High priority', value: summary.highPriority, tone: 'danger' },
      { label: 'Open work', value: openTasks, tone: 'neutral' },
      { label: 'Risk items', value: blockedTasks, tone: 'danger' }
    ];
  }, [summary, tasks]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = authMode === 'login' ? await login(authForm) : await register(authForm);
      setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
      setAuthForm(defaultAuth);
      setMessage(`Signed in as ${response.user.name}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDemoLogin() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await login(demoCredentials);
      setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
      setMessage('Loaded the demo workspace');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    clearToken();
    setTokenState('');
    setUser(null);
    setTasks([]);
    setDraft(emptyDraft);
    setEditingTaskId('');
    setMessage('');
    setError('');
  }

  function beginEdit(task) {
    setEditingTaskId(task.id);
    setDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      dueDate: task.dueDate
    });
  }

  function resetDraft() {
    setDraft(emptyDraft);
    setEditingTaskId('');
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, draft);
        setMessage('Task updated');
      } else {
        await createTask(draft);
        setMessage('Task created');
      }

      resetDraft();
      const payload = await fetchTasks(filters);
      setTasks(payload.tasks);
      setSummary(payload.summary);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTask(taskId) {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await deleteTask(taskId);
      const payload = await fetchTasks(filters);
      setTasks(payload.tasks);
      setSummary(payload.summary);
      if (editingTaskId === taskId) {
        resetDraft();
      }
      setMessage('Task removed');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <main className="auth-grid">
          <section className="auth-hero">
            <p className="eyebrow">ScholarX dashboard</p>
            <h1>Task management that feels fast, calm, and visible.</h1>
            <p className="lede">
              Track priorities, monitor progress, and keep team work moving without bouncing between tools.
            </p>
            <div className="hero-points">
              <span>Live task metrics</span>
              <span>JWT auth scaffold</span>
              <span>Mongo-ready backend</span>
            </div>
          </section>

          <section className="auth-card">
            <div className="auth-toggle">
              <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
                Sign in
              </button>
              <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>
                Create account
              </button>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' ? (
                <label>
                  Name
                  <input
                    value={authForm.name}
                    onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                    placeholder="Avery Collins"
                  />
                </label>
              ) : null}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                  placeholder="••••••••"
                />
              </label>

              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? 'Working…' : authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
              <button className="secondary-button" type="button" onClick={handleDemoLogin} disabled={busy}>
                Use demo workspace
              </button>
            </form>

            {message ? <p className="status success">{message}</p> : null}
            {error ? <p className="status error">{error}</p> : null}
            <p className="auth-footnote">
              Demo access uses <strong>{demoCredentials.email}</strong> and <strong>{demoCredentials.password}</strong>.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className="sidebar">
        <div>
          <p className="eyebrow">ScholarX</p>
          <h2>{user?.name || 'Task hub'}</h2>
          <p className="sidebar-copy">A focused command center for planning, tracking, and delivery.</p>
        </div>

        <div className="sidebar-section">
          <p className="section-label">Quick filters</p>
          <label>
            Search
            <input
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Search title, assignee, or notes"
            />
          </label>
          <label>
            Status
            <select
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label>
            Priority
            <select
              value={filters.priority}
              onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <button className="ghost-button" type="button" onClick={() => setFilters({ search: '', status: 'all', priority: 'all' })}>
            Reset filters
          </button>
        </div>

        <div className="sidebar-section">
          <p className="section-label">Session</p>
          <p className="sidebar-copy">Signed in as {user?.email}</p>
          <button className="secondary-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="hero-bar">
          <div>
            <p className="eyebrow">Task management dashboard</p>
            <h1>Focus the team on the work that actually moves.</h1>
          </div>
          <div className="hero-actions">
            <span className="pill">{summary.total} tasks</span>
            <span className="pill pill-positive">{summary.completionRate}% complete</span>
          </div>
        </header>

        {message ? <p className="status success">{message}</p> : null}
        {error ? <p className="status error">{error}</p> : null}
        {loading ? <p className="status neutral">Refreshing data…</p> : null}

        <section className="stats-grid">
          {taskStats.map((card) => (
            <article className={`stat-card tone-${card.tone}`} key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <section className="progress-panel">
          <div className="progress-copy">
            <p className="section-label">Completion</p>
            <strong>{summary.completionRate}%</strong>
          </div>
          <div className="progress-track">
            <span className="progress-fill" style={{ width: completionWidth }} />
          </div>
          <div className="status-row">
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = tasks.filter((task) => task.status === status).length;
              return (
                <div key={status} className="status-chip">
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section className="content-grid">
          <article className="panel form-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Task editor</p>
                <h3>{editingTaskId ? 'Edit task' : 'Create task'}</h3>
              </div>
              {editingTaskId ? (
                <button className="ghost-button" type="button" onClick={resetDraft}>
                  Cancel edit
                </button>
              ) : null}
            </div>

            <form className="task-form" onSubmit={handleTaskSubmit}>
              <label>
                Title
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="Plan launch checklist"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  placeholder="Add context, blockers, and expected outcome"
                  rows="4"
                />
              </label>

              <div className="field-grid">
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                  >
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={draft.priority}
                    onChange={(event) => setDraft({ ...draft, priority: event.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              <div className="field-grid">
                <label>
                  Assignee
                  <input
                    value={draft.assignee}
                    onChange={(event) => setDraft({ ...draft, assignee: event.target.value })}
                    placeholder="Team member"
                  />
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    value={draft.dueDate}
                    onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
                  />
                </label>
              </div>

              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editingTaskId ? 'Update task' : 'Add task'}
              </button>
            </form>
          </article>

          <article className="panel list-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Task board</p>
                <h3>{tasks.length} matching tasks</h3>
              </div>
            </div>

            <div className="task-list">
              {tasks.length === 0 ? (
                <div className="empty-state">
                  <h4>No tasks match your filters</h4>
                  <p>Try clearing the filters or adding a new task to get the board moving.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <article className="task-card" key={task.id}>
                    <div className="task-card-top">
                      <div>
                        <h4>{task.title}</h4>
                        <p>{task.description || 'No description provided.'}</p>
                      </div>
                      <span className={`badge badge-${task.status}`}>{statusLabels[task.status]}</span>
                    </div>

                    <div className="task-meta">
                      <span>{priorityLabels[task.priority]} priority</span>
                      <span>Owner: {task.assignee}</span>
                      <span>Due {formatDate(task.dueDate)}</span>
                    </div>

                    <div className="task-actions">
                      <button className="ghost-button" type="button" onClick={() => beginEdit(task)}>
                        Edit
                      </button>
                      <button className="danger-button" type="button" onClick={() => handleDeleteTask(task.id)} disabled={busy}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
