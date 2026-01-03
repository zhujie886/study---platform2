import { useEffect, useState } from 'react';

export interface Task {
  id: string;
  content: string;
  time: string; // ISO string or simple time string
  isCompleted: boolean;
}

const STORAGE_KEY = 'user_smart_tasks';

// 获取所有任务
export const getTasks = (): Task[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

// 保存任务并触发更新事件
export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event('tasks-updated'));
};

// React Hook: 让组件能够实时监听到任务变化
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(getTasks());

  useEffect(() => {
    const handler = () => setTasks(getTasks());
    window.addEventListener('tasks-updated', handler);
    // 同时监听 storage 事件以支持多标签页同步
    window.addEventListener('storage', handler);
    
    return () => {
      window.removeEventListener('tasks-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const addTask = (content: string, time: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      content,
      time,
      isCompleted: false
    };
    const newTasks = [...tasks, newTask];
    // 自动按时间排序
    newTasks.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    saveTasks(newTasks);
  };

  const removeTask = (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    saveTasks(newTasks);
  };

  const toggleTask = (id: string) => {
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    saveTasks(newTasks);
  };

  return { tasks, addTask, removeTask, toggleTask };
};