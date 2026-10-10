import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  fetchHobbyAnalytics,
  fetchUsers,
  toggleUserBan,
} from '../api/adminDashboardService';
import './AdminDashboard.css';

const HOBBY_COLORS = {
  Coding: '#58a6ff',
  Chess: '#e3b341',
  Drawing: '#ff7b72',
  Gaming: '#bc8cff',
  Music: '#f0883e',
  Fitness: '#3fb950',
};

export default function AdminDashboard() {
  const { isAdmin, authChecked } = useApp();
  const navigate = useNavigate();

  // Active tab: 'analytics' or 'users'
  const [activeTab, setActiveTab] = useState('analytics');

  // Analytics data state
  const [hobbiesData, setHobbiesData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // User moderation state
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'BANNED'
  const [sortByDeleted, setSortByDeleted] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Chart.js canvas & instance references
  const pieCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  // Redirect non-admins safely
  useEffect(() => {
    if (authChecked && !isAdmin) {
      navigate('/feed', { replace: true });
    }
  }, [authChecked, isAdmin, navigate]);

  // Load real data from backend
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [analytics, users] = await Promise.all([
          fetchHobbyAnalytics(),
          fetchUsers(''),
        ]);
        if (isMounted) {
          setHobbiesData(
            analytics.map((h) => ({
              ...h,
              color: HOBBY_COLORS[h.id] || '#ff4500',
            }))
          );
          setUsersList(users);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard data', err);
      } finally {
        if (isMounted) {
          setLoadingAnalytics(false);
          setLoadingUsers(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Search Input
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const results = await fetchUsers(searchQuery);
        if (isMounted) {
          setUsersList(results);
        }
      } catch (err) {
        console.error('Search failed', err);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Toggle user ban
  const handleToggleBan = async (targetUser) => {
    if (targetUser.isAdmin || targetUser.username?.toLowerCase() === 'admin') {
      alert('Admin accounts cannot be banned.');
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      const res = await toggleUserBan(targetUser.id, targetUser.isBanned);
      if (res && res.success) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === targetUser.id ? { ...u, isBanned: res.isBanned } : u
          )
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to update user ban status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let list = usersList.filter((u) => {
      if (statusFilter === 'ACTIVE') return !u.isBanned;
      if (statusFilter === 'BANNED') return u.isBanned;
      return true;
    });

    if (sortByDeleted) {
      list = [...list].sort((a, b) => (b.deletedPosts ?? 0) - (a.deletedPosts ?? 0));
    }

    return list;
  }, [usersList, statusFilter, sortByDeleted]);

  // KPI Calculations from real database metrics
  const totalPosts = useMemo(() => {
    return hobbiesData.reduce((acc, h) => acc + (h.postVolume || 0), 0);
  }, [hobbiesData]);

  const totalComments = useMemo(() => {
    return hobbiesData.reduce((acc, h) => acc + (h.commentCount || 0), 0);
  }, [hobbiesData]);

  const totalUpvotes = useMemo(() => {
    return hobbiesData.reduce((acc, h) => acc + (h.upvotes || 0), 0);
  }, [hobbiesData]);

  const totalBannedUsers = useMemo(() => {
    return usersList.filter((u) => u.isBanned).length;
  }, [usersList]);

  // Max post volume for Bar Chart scaling
  const maxPostVolume = useMemo(() => {
    if (hobbiesData.length === 0) return 1;
    return Math.max(...hobbiesData.map((h) => h.postVolume || 0), 1);
  }, [hobbiesData]);

  // Donut Chart Calculations (SVG stroke-dasharray based on post volume share)
  const donutSegments = useMemo(() => {
    const totalVolume = totalPosts || 1;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    return hobbiesData
      .filter((h) => (h.postVolume || 0) > 0)
      .map((hobby) => {
        const fraction = (hobby.postVolume || 0) / totalVolume;
        const strokeDasharray = `${fraction * circumference} ${circumference}`;
        const strokeDashoffset = -accumulatedAngle * circumference;
        accumulatedAngle += fraction;

        return {
          ...hobby,
          percentage: Math.round(fraction * 100),
          strokeDasharray,
          strokeDashoffset,
        };
      });
  }, [hobbiesData, totalPosts]);

  // Initialize and update Chart.js instances
  useEffect(() => {
    if (activeTab !== 'analytics') return;

    let isDestroyed = false;

    const renderCharts = () => {
      if (isDestroyed || !window.Chart) return;

      if (pieChartRef.current) {
        pieChartRef.current.destroy();
        pieChartRef.current = null;
      }
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }

      if (pieCanvasRef.current && donutSegments.length > 0) {
        const ctx = pieCanvasRef.current.getContext('2d');
        pieChartRef.current = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: donutSegments.map((s) => s.label),
            datasets: [
              {
                data: donutSegments.map((s) => s.postVolume),
                backgroundColor: donutSegments.map((s) => s.color || '#ff4500'),
                borderColor: '#161b22',
                borderWidth: 2,
                hoverOffset: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1b1e2b',
                titleColor: '#ffffff',
                bodyColor: '#c9d1d9',
                borderColor: '#30363d',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const val = context.parsed || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                    return ` ${label}: ${val} posts (${pct}%)`;
                  },
                },
              },
            },
            cutout: '70%',
          },
        });
      }

      if (barCanvasRef.current && hobbiesData.length > 0) {
        const ctx = barCanvasRef.current.getContext('2d');
        barChartRef.current = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: hobbiesData.map((h) => `${h.icon} ${h.label}`),
            datasets: [
              {
                label: 'Posts',
                data: hobbiesData.map((h) => h.postVolume || 0),
                backgroundColor: hobbiesData.map((h) => h.color || '#ff4500'),
                borderRadius: 5,
                borderSkipped: false,
                barThickness: 15,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 },
            scales: {
              x: {
                grid: { color: 'rgba(255, 255, 255, 0.06)' },
                ticks: {
                  color: '#8b949e',
                  font: { size: 11 },
                  stepSize: 1,
                },
              },
              y: {
                grid: { display: false },
                ticks: {
                  color: '#e6edf3',
                  font: { size: 12, weight: '600' },
                },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1b1e2b',
                titleColor: '#ffffff',
                bodyColor: '#c9d1d9',
                borderColor: '#30363d',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                  label: (context) => ` Posts: ${context.parsed.x}`,
                },
              },
            },
          },
        });
      }
    };

    if (window.Chart) {
      renderCharts();
    } else {
      const timer = setInterval(() => {
        if (window.Chart) {
          clearInterval(timer);
          renderCharts();
        }
      }, 100);
      return () => {
        clearInterval(timer);
        isDestroyed = true;
      };
    }

    return () => {
      isDestroyed = true;
      if (pieChartRef.current) {
        pieChartRef.current.destroy();
        pieChartRef.current = null;
      }
      if (barChartRef.current) {
        barChartRef.current.destroy();
        barChartRef.current = null;
      }
    };
  }, [activeTab, donutSegments, hobbiesData]);

  return (
    <div className="admin-dashboard-container">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-title-area">
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Analytics and User Moderation</p>
        </div>
        <Link to="/feed" className="admin-back-btn">
          
        </Link>
      </header>

      {/* Tabs */}
      <nav className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Hobby Analytics
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management ({usersList.length})
        </button>
      </nav>

      {/* TAB 1: HOBBY ANALYTICS */}
      {activeTab === 'analytics' && (
        <section className="analytics-section">
          {/* Summary KPIs */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div
                className="kpi-icon-badge"
                style={{ backgroundColor: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff' }}
              >
                👥
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Registered Users</span>
                <span className="kpi-value">{usersList.length}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div
                className="kpi-icon-badge"
                style={{ backgroundColor: 'rgba(255, 69, 0, 0.15)', color: '#ff4500' }}
              >
                📝
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Total Posts</span>
                <span className="kpi-value">{totalPosts}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div
                className="kpi-icon-badge"
                style={{ backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950' }}
              >
                💬
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Total Comments</span>
                <span className="kpi-value">{totalComments}</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div
                className="kpi-icon-badge"
                style={{ backgroundColor: 'rgba(227, 179, 65, 0.15)', color: '#e3b341' }}
              >
                👍
              </div>
              <div className="kpi-content">
                <span className="kpi-label">Total Upvotes</span>
                <span className="kpi-value">{totalUpvotes}</span>
              </div>
            </div>
          </div>

          {/* Visualizers Row: Donut Chart & Bar Chart (Powered by Chart.js) */}
          <div className="admin-charts-row">
            {/* Chart 1: Donut Chart - Powered by Chart.js */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Post Donut Chart</h3>
                <span className="chart-badge">Chart.js</span>
              </div>

              <div className="donut-chart-container">
                <div className="donut-svg-wrapper">
                  <canvas ref={pieCanvasRef} width="180" height="180" />
                  <div className="donut-center-label">
                    <div className="donut-center-number">{totalPosts}</div>
                    <div className="donut-center-text">Posts</div>
                  </div>
                </div>

                <div className="donut-legend">
                  {donutSegments.length === 0 ? (
                    <div style={{ color: '#8b949e', fontSize: '13px' }}>No posts published yet.</div>
                  ) : (
                    donutSegments.map((seg) => (
                      <div key={seg.id} className="legend-item">
                        <div className="legend-info">
                          <span
                            className="legend-color-dot"
                            style={{ backgroundColor: seg.color || '#ff4500' }}
                          />
                          <span className="legend-label">
                            {seg.icon} {seg.label}
                          </span>
                        </div>
                        <span className="legend-val">
                          {seg.postVolume} ({seg.percentage}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Chart 2: Bar Chart - Powered by Chart.js */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Posts by Hobby</h3>
                <span className="chart-badge">Chart.js</span>
              </div>

              <div className="bar-chart-container" style={{ position: 'relative', height: '220px', width: '100%' }}>
                <canvas ref={barCanvasRef} />
              </div>
            </div>
          </div>

          {/* Detailed Hobbies Table */}
          <div className="admin-table-card">
            <div className="admin-table-header-box">
              <h3>Community Breakdown</h3>
              <span className="chart-badge">{hobbiesData.length} Hobbies</span>
            </div>

            <div className="admin-table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Community</th>
                    <th>Posts</th>
                    <th>Comments</th>
                    <th>Likes / Dislikes</th>
                    <th>Top Contributor</th>
                  </tr>
                </thead>
                <tbody>
                  {hobbiesData.map((h) => {
                    const totalVotes = (h.upvotes || 0) + (h.downvotes || 0);
                    return (
                      <tr key={h.id}>
                        <td>
                          <div className="community-cell">
                            <span className="community-icon-box">{h.icon}</span>
                            <span>{h.label}</span>
                          </div>
                        </td>
                        <td>
                          <strong>{h.postVolume || 0}</strong>
                        </td>
                        <td>
                          <span className="count-chip">{h.commentCount || 0}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#3fb950', fontSize: '13px', fontWeight: '600' }}>
                              👍 {h.upvotes || 0}
                            </span>
                            <span style={{ color: '#8b949e', fontSize: '12px' }}>/</span>
                            <span style={{ color: '#f85149', fontSize: '13px', fontWeight: '600' }}>
                              👎 {h.downvotes || 0}
                            </span>
                            {totalVotes > 0 && (
                              <span style={{ color: '#8b949e', fontSize: '12px', marginLeft: '4px' }}>
                                ({h.likeRatio}% likes)
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {h.topContributor ? (
                            <span className="top-contributor-tag">
                              @{h.topContributor.username} ({h.topContributor.postCount}{' '}
                              {h.topContributor.postCount === 1 ? 'post' : 'posts'})
                            </span>
                          ) : (
                            <span style={{ color: '#8b949e', fontSize: '13px' }}>None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: USER MANAGEMENT & MODERATION */}
      {activeTab === 'users' && (
        <section className="users-section">
          {/* Controls: Search and Status Filters */}
          <div className="user-controls-bar">
            <div className="search-wrapper">
              <span className="search-icon-svg">🔍</span>
              <input
                type="text"
                className="search-input-field"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="user-filter-pills">
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({usersList.length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Active ({usersList.filter((u) => !u.isBanned).length})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'BANNED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('BANNED')}
              >
                Banned ({totalBannedUsers})
              </button>
              <button
                type="button"
                className={`filter-pill-btn ${sortByDeleted ? 'active' : ''}`}
                onClick={() => setSortByDeleted((prev) => !prev)}
                title="Sort users by number of posts deleted"
              >
                Sort by Deleted {sortByDeleted ? '▼' : '⇅'}
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="admin-table-card">
            <div className="admin-table-header-box">
              <h3>Users ({filteredUsers.length})</h3>
              <span className="chart-badge">Records</span>
            </div>

            <div className="admin-table-responsive">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Active Posts</th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSortByDeleted((prev) => !prev)}
                      title="Click to sort by posts deleted"
                    >
                      Deleted Posts {sortByDeleted ? '▼' : '⇅'}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-table-state">
                        No users found matching &ldquo;{searchQuery}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isTargetAdmin =
                        u.isAdmin || u.role === 'ADMIN' || u.username?.toLowerCase() === 'admin';
                      const isLoadingAction = actionLoadingId === u.id;

                      return (
                        <tr key={u.id}>
                          {/* User Identity */}
                          <td>
                            <div className="user-identity-cell">
                              <div className="user-avatar-circle">
                                {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="user-name-meta">
                                <span className="username-title">{u.username}</span>
                                {u.email && (
                                  <span className="user-email-text">{u.email}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td>
                            {isTargetAdmin ? (
                              <span className="admin-shield-tag">ADMIN</span>
                            ) : (
                              <span style={{ color: '#8b949e', fontSize: '13px' }}>Member</span>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            {u.isBanned ? (
                              <span className="status-pill banned">● Banned</span>
                            ) : (
                              <span className="status-pill active">● Active</span>
                            )}
                          </td>

                          {/* Active Posts Created */}
                          <td>
                            <strong>{u.activePosts ?? 0}</strong>
                          </td>

                          {/* Deleted Posts (Audit) */}
                          <td>
                            {(u.deletedPosts ?? 0) > 0 ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  backgroundColor: 'rgba(248, 81, 73, 0.15)',
                                  color: '#f85149',
                                  fontWeight: '600',
                                  fontSize: '12px',
                                }}
                              >
                                {u.deletedPosts} deleted
                              </span>
                            ) : (
                              <span style={{ color: '#8b949e', fontSize: '13px' }}>0</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td>
                            {isTargetAdmin ? (
                              <span className="admin-protected-label">Protected</span>
                            ) : (
                              <button
                                type="button"
                                className={`action-btn ${u.isBanned ? 'unban-btn' : 'ban-btn'}`}
                                onClick={() => handleToggleBan(u)}
                                disabled={isLoadingAction}
                              >
                                {isLoadingAction
                                  ? 'Updating…'
                                  : u.isBanned
                                  ? 'Unban User'
                                  : 'Ban User'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
