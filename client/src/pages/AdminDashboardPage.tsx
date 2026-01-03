// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('users'); // Default to users tab
  const [data, setData] = useState({ posts: [], memos: [], meetings: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, memosRes, meetingsRes, usersRes] = await Promise.all([
        adminAPI.getPosts(),
        adminAPI.getMemos(),
        adminAPI.getMeetings(),
        adminAPI.getAllUsers(),
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

    } catch (error) {
      console.error("数据加载失败:", error);
      setData({ posts: [], memos: [], meetings: [], users: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('确定要删除吗？')) return;
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
        alert('暂未开放此类型的删除权限');
      }
    } catch (error) {
      alert('删除操作失败');
    }
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

  const displayList = getFilteredList();

  const styles = {
    container: { padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    title: { margin: 0, color: '#333' },
    searchBox: { 
      padding: '10px 15px', 
      width: '300px', 
      borderRadius: '20px', 
      border: '2px solid #007bff', 
      outline: 'none',
      fontSize: '15px'
    },
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
    deleteBtn: { backgroundColor: '#ff4d4f', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' },
    meta: { fontSize: '12px', color: '#999', marginTop: '5px' },
    empty: { textAlign: 'center', color: '#999', marginTop: '50px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛡️ 管理员控制台</h1>
        <input 
          type="text" 
          placeholder="🔍 搜索..."
          style={styles.searchBox}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'users')} onClick={() => setActiveTab('users')}>
          👥 用户管理 ({data.users?.length || 0})
        </button>
        <button style={styles.tab(activeTab === 'posts')} onClick={() => setActiveTab('posts')}>
          📝 帖子管理 ({data.posts?.length || 0})
        </button>
        <button style={styles.tab(activeTab === 'memos')} onClick={() => setActiveTab('memos')}>
          📌 备忘录 ({data.memos?.length || 0})
        </button>
        <button style={styles.tab(activeTab === 'meetings')} onClick={() => setActiveTab('meetings')}>
          📅 会议 ({data.meetings?.length || 0})
        </button>
      </div>

      {loading ? (
        <div style={styles.empty}>加载数据中...</div>
      ) : (
        <div>
          {(!Array.isArray(displayList) || displayList.length === 0) ? (
            <div style={styles.empty}>没有找到相关内容</div>
          ) : (
            displayList.map((item) => (
              <div key={item.id || item._id || Math.random()} style={styles.card}>
                <div style={styles.row}>
                  <div style={{flex: 1}}>
                    {activeTab === 'users' ? (
                      <>
                        <div style={{fontWeight: 'bold', fontSize: '16px'}}>{item.username}</div>
                        <div style={{color: '#555', marginTop: '5px'}}>{item.email}</div>
                        <div style={styles.meta}>ID: {item.id || item._id}</div>
                      </>
                    ) : (
                      <>
                        <div style={{fontWeight: 'bold', fontSize: '16px'}}>
                          {item.title || item.subject || '无标题'}
                        </div>
                        <div style={{color: '#555', marginTop: '5px'}}>
                          {item.content || item.description || '无内容详情'}
                        </div>
                        <div style={styles.meta}>
                          ID: {item.id || item._id} |
                          发布者: {item.author?.username || item.creator?.username || item.user?.username || '未知'}
                        </div>
                      </>
                    )}
                  </div>
                  {(activeTab === 'posts' || activeTab === 'users') && (
                    <button 
                      style={styles.deleteBtn} 
                      onClick={() => handleDelete(item.id || item._id, activeTab)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
