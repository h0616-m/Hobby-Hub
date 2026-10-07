import { useState, useEffect, useMemo } from 'react';
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

          {/* Visualizers Row: Donut Chart & Bar Chart */}
          <div className="admin-charts-row">
            {/* Chart 1: Donut Chart - Post Share */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Post Pi chart</h3>
                <span className="chart-badge">Posts shared</span>
              </div>

              <div className="donut-chart-container">
                <div className="donut-svg-wrapper">
                  <svg width="180" height="180" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      fill="transparent"
                      stroke="#21262d"
                      strokeWidth="20"
                    />
                    {donutSegments.map((segment) => (
                      <circle
                        key={segment.id}
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke={segment.color || '#ff4500'}
                        strokeWidth="20"
                        strokeDasharray={segment.strokeDasharray}
                        strokeDashoffset={segment.strokeDashoffset}
                        style={{
                          transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease',
                          transform: 'rotate(-90deg)',
                          transformOrigin: '80px 80px',
                        }}
                      />
                    ))}
                  </svg>
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

            {/* Chart 2: Bar Chart - Post Volume */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Posts by Hobby</h3>
                <span className="chart-badge">Posts</span>
              </div>

              <div className="bar-chart-container">
                {hobbiesData.map((hobby) => {
                  const widthPercent = Math.round(
                    ((hobby.postVolume || 0) / maxPostVolume) * 100
                  );
                  return (
                    <div key={hobby.id} className="bar-row">
                      <div className="bar-row-info">
                        <span className="bar-row-label">
                          <span>{hobby.icon}</span>
                          <span>{hobby.label}</span>
                        </span>
                        <span className="bar-row-val">
                          {hobby.postVolume} {hobby.postVolume === 1 ? 'post' : 'posts'}
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: hobby.color || '#ff4500',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
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
