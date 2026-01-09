// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { useLanguage } from '@/i18n/LanguageContext';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('users'); // Default to users tab
  const { t } = useLanguage();
  const [data, setData] = useState({ posts: [], memos: [], meetings: [], users: [] });
  const [stats, setStats] = useState({ totals: {}, last7d: {} });
  const [logs, setLogs] = useState('');
  const [logType, setLogType] = useState('err');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab, logType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, memosRes, meetingsRes, usersRes, statsRes] = await Promise.all([
        adminAPI.getPosts(),
        adminAPI.getMemos(),
        adminAPI.getMeetings(),
        adminAPI.getAllUsers(),
        adminAPI.getStats(),
      ]);

      const safeGetArray = (res: any) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
            if (res.data.posts && Array.isArray(res.data.posts)) return res.data.posts;
            if (res.data.memos && Array.isArray(res.data.memos)) return res.data.memos;
            if (res.data.meetings && Array.isArray(res.data.meetings)) return res.data.meetings;
            if (res.data.users && Array.isArray(res.data.users)) return res.data.users;
        }
        return [];
      };

      setData({
        posts: safeGetArray(postsRes),
        memos: safeGetArray(memosRes),
        meetings: safeGetArray(meetingsRes),
        users: safeGetArray(usersRes),
      });
      setStats(statsRes?.data || { totals: {}, last7d: {} });

      if (activeTab === 'logs') {
        const logsRes = await adminAPI.logs({ type: logType, lines: 400 });
        setLogs(logsRes?.data?.content || '');
      }

    } catch (error) {
      console.error("数据加载失败:", error);
      setData({ posts: [], memos: [], meetings: [], users: [] });
      setStats({ totals: {}, last7d: {} });
      setLogs('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(t('admin.confirm.delete'))) return;
    try {
      if (type === 'posts') {
        await adminAPI.deletePost(id);
        setData(prev => ({
            ...prev,
            posts: prev.posts.filter(item => item._id !== id)
        }));
      } else if (type === 'users') {
        await adminAPI.deleteUser(id);
        setData(prev => ({
            ...prev,
            users: prev.users.filter(item => item._id !== id)
        }));
      } else {
        alert(t('admin.delete.notAllowed'));
      }
    } catch (error) {
      alert(t('admin.delete.failed'));
    }
  };

  const handleResetPassword = async (user) => {
    const newPassword = window.prompt(t('admin.reset.prompt'), '');
    if (!newPassword) return;
    if (newPassword.trim().length < 6) {
      alert(t('admin.reset.tooShort'));
      return;
    }
    try {
      await adminAPI.resetUserPassword(user.id || user._id, { password: newPassword.trim() });
      alert(t('admin.reset.success'));
    } catch (error) {
      alert(t('admin.reset.failed'));
    }
  };

  const handleMute = async (user) => {
    const daysRaw = window.prompt(t('admin.mute.daysPrompt'), '7');
    const reason = window.prompt(t('admin.mute.reasonPrompt'), '') || '';
    try {
      await adminAPI.muteUser(user.id || user._id, {
        days: daysRaw ? daysRaw.trim() : undefined,
        reason
      });
      fetchData();
    } catch (error) {
      alert(t('admin.mute.failed'));
    }
  };

  const handleUnmute = async (user) => {
    try {
      await adminAPI.unmuteUser(user.id || user._id);
      fetchData();
    } catch (error) {
      alert(t('admin.unmute.failed'));
    }
  };

  const formatDate = (value) => {
    if (!value) return t('common.none');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('common.none');
    return date.toLocaleString();
  };

  const getFilteredList = () => {
    const list = Array.isArray(data[activeTab]) ? data[activeTab] : [];

    if (!searchTerm.trim()) return list;

    const lowerTerm = searchTerm.toLowerCase();

    return list.filter(item => {
      if (activeTab === 'users') {
        const username = (item.username || '').toLowerCase();
        const email = (item.email || '').toLowerCase();
        return username.includes(lowerTerm) || email.includes(lowerTerm);
      }
      const content = (item.content || item.title || item.description || item.subject || '').toLowerCase();
      const user = (item.author?.username || item.creator?.username || item.user?.username || '').toLowerCase();
      return content.includes(lowerTerm) || user.includes(lowerTerm);
    });
  };

  const listTabs = ['users', 'posts', 'memos', 'meetings'];
  const displayList = listTabs.includes(activeTab) ? getFilteredList() : [];

  const styles = {
    container: { padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    title: { margin: 0, color: '#333' },
    refreshBtn: {
      padding: '8px 14px',
      borderRadius: '999px',
      border: '1px solid #cbd5f5',
      background: '#eef2ff',
      color: '#1f2a44',
      cursor: 'pointer'
    },
    searchBox: { 
      padding: '10px 15px', 
      width: '300px', 
      borderRadius: '20px', 
      border: '2px solid #007bff', 
      outline: 'none',
      fontSize: '15px'
    },
    statsGrid: {
      display: 'grid',
      gap: '12px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      marginBottom: '20px'
    },
    statCard: { border: '1px solid #eee', borderRadius: '12px', padding: '12px 14px', background: '#fff' },
    statLabel: { fontSize: '12px', color: '#6b7280' },
    statValue: { fontSize: '20px', fontWeight: 700, marginTop: '6px' },
    statSub: { marginTop: '6px', fontSize: '12px', color: '#9ca3af' },
    tabs: { display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px' },
    tab: (isActive) => ({
      padding: '10px 20px',
      cursor: 'pointer',
      borderBottom: isActive ? '3px solid #007bff' : 'none',
      color: isActive ? '#007bff' : '#666',
      fontWeight: isActive ? 'bold' : 'normal',
      background: 'none',
      border: 'none',
      fontSize: '16px'
    }),
    card: { border: '1px solid #eee', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', backgroundColor: 'white' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    actionGroup: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    resetBtn: { backgroundColor: '#5b6bff', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' },
    muteBtn: { backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' },
    unmuteBtn: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' },
    deleteBtn: { backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' },
    meta: { fontSize: '12px', color: '#999', marginTop: '5px' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '999px', fontSize: '12px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
    logControls: { display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' },
    logButton: { padding: '6px 12px', borderRadius: '999px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' },
    logButtonActive: { padding: '6px 12px', borderRadius: '999px', border: '1px solid #818cf8', background: '#eef2ff', cursor: 'pointer' },
    logBox: { background: '#0f172a', color: '#e2e8f0', padding: '12px', borderRadius: '10px', fontSize: '12px', whiteSpace: 'pre-wrap', minHeight: '200px' },
    empty: { textAlign: 'center', color: '#999', marginTop: '50px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛡️ {t('admin.dashboard.title')}</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder={`🔍 ${t('admin.search.placeholder')}`}
            style={styles.searchBox}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button style={styles.refreshBtn} onClick={fetchData}>{t('admin.dashboard.refresh')}</button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        {[
          { key: 'users', label: t('admin.stats.users'), value: stats.totals?.users, sub: t('admin.stats.new7d', { count: stats.last7d?.users || 0 }) },
          { key: 'posts', label: t('admin.stats.posts'), value: stats.totals?.posts, sub: t('admin.stats.new7d', { count: stats.last7d?.posts || 0 }) },
          { key: 'comments', label: t('admin.stats.comments'), value: stats.totals?.comments, sub: t('admin.stats.new7d', { count: stats.last7d?.comments || 0 }) },
          { key: 'questions', label: t('admin.stats.questions'), value: stats.totals?.questions, sub: t('admin.stats.new7d', { count: stats.last7d?.questions || 0 }) },
          { key: 'answers', label: t('admin.stats.answers'), value: stats.totals?.answers, sub: t('admin.stats.new7d', { count: stats.last7d?.answers || 0 }) },
          { key: 'messages', label: t('admin.stats.messages'), value: stats.totals?.messages, sub: t('admin.stats.new7d', { count: stats.last7d?.messages || 0 }) },
          { key: 'barrages', label: t('admin.stats.barrages'), value: stats.totals?.barrages, sub: t('admin.stats.new7d', { count: stats.last7d?.barrages || 0 }) },
          { key: 'meetings', label: t('admin.stats.meetings'), value: stats.totals?.meetings, sub: t('admin.stats.new7d', { count: stats.last7d?.meetings || 0 }) },
          { key: 'memos', label: t('admin.stats.memos'), value: stats.totals?.memos, sub: t('admin.stats.new7d', { count: stats.last7d?.memos || 0 }) },
          { key: 'muted', label: t('admin.stats.muted'), value: stats.totals?.mutedUsers, sub: t('admin.stats.active') },
        ].map((card) => (
          <div key={card.key} style={styles.statCard}>
            <div style={styles.statLabel}>{card.label}</div>
            <div style={styles.statValue}>{card.value ?? 0}</div>
            <div style={styles.statSub}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'users')} onClick={() => setActiveTab('users')}>
          👥 {t('admin.tab.users')} ({data.users?.length || 0})
        </button>
        <button style={styles.tab(activeTab === 'posts')} onClick={() => setActiveTab('posts')}>
          📝 {t('admin.tab.posts')} ({data.posts?.length || 0})
        </button>
        <button style={styles.tab(activeTab === 'memos')} onClick={() => setActiveTab('memos')}>
          📌 {t('admin.tab.memos')} ({data.memos?.length || 0})
        </button>
        <button style={styles.tab(activeTab === 'meetings')} onClick={() => setActiveTab('meetings')}>
          📅 {t('admin.tab.meetings')} ({data.meetings?.length || 0})
        </button>
        <button style={styles.tab(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
          📟 {t('admin.tab.logs')}
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>{t('admin.loading')}</div>
      ) : activeTab === 'logs' ? (
        <div>
          <div style={styles.logControls}>
            <button
              style={logType === 'err' ? styles.logButtonActive : styles.logButton}
              onClick={() => setLogType('err')}
            >
              {t('admin.logs.err')}
            </button>
            <button
              style={logType === 'out' ? styles.logButtonActive : styles.logButton}
              onClick={() => setLogType('out')}
            >
              {t('admin.logs.out')}
            </button>
          </div>
          <div style={styles.logBox}>{logs || t('admin.logs.empty')}</div>
        </div>
      ) : (
        <div>
          {(!Array.isArray(displayList) || displayList.length === 0) ? (
            <div style={styles.empty}>{t('admin.empty')}</div>
          ) : (
            displayList.map((item) => {
              const itemId = item.id || item._id;
              const muted = !!item.isMuted && (!item.mutedUntil || new Date(item.mutedUntil) > new Date());
              return (
                <div key={itemId || Math.random()} style={styles.card}>
                  <div style={styles.row}>
                    <div style={{flex: 1}}>
                      {activeTab === 'users' ? (
                        <>
                          <div style={{fontWeight: 'bold', fontSize: '16px'}}>{item.username}</div>
                          <div style={{color: '#555', marginTop: '5px'}}>{item.email}</div>
                          <div style={styles.meta}>ID: {itemId}</div>
                          {muted && (
                            <div style={{ marginTop: '8px' }}>
                              <span style={styles.badge}>{t('admin.badge.muted')}</span>
                              <div style={styles.meta}>{t('admin.label.expire')}: {formatDate(item.mutedUntil)}</div>
                              {item.muteReason ? <div style={styles.meta}>{t('admin.label.reason')}: {item.muteReason}</div> : null}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{fontWeight: 'bold', fontSize: '16px'}}>
                            {item.title || item.subject || t('admin.fallback.title')}
                          </div>
                          <div style={{color: '#555', marginTop: '5px'}}>
                            {item.content || item.description || t('admin.fallback.content')}
                          </div>
                          <div style={styles.meta}>
                            ID: {itemId} |
                            {t('admin.label.publisher')}: {item.author?.username || item.creator?.username || item.user?.username || t('admin.fallback.unknown')}
                          </div>
                        </>
                      )}
                    </div>
                    {activeTab === 'users' && (
                      <div style={styles.actionGroup}>
                        <button
                          style={styles.resetBtn}
                          onClick={() => handleResetPassword(item)}
                        >
                          {t('admin.action.resetPassword')}
                        </button>
                        {muted ? (
                          <button
                            style={styles.unmuteBtn}
                            onClick={() => handleUnmute(item)}
                          >
                            {t('admin.action.unmute')}
                          </button>
                        ) : (
                          <button
                            style={styles.muteBtn}
                            onClick={() => handleMute(item)}
                          >
                            {t('admin.action.mute')}
                          </button>
                        )}
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(itemId, activeTab)}
                        >
                          {t('admin.action.delete')}
                        </button>
                      </div>
                    )}
                    {activeTab === 'posts' && (
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(itemId, activeTab)}
                      >
                        {t('admin.action.delete')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
