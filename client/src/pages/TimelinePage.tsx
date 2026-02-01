import { useEffect, useState } from 'react';
import { timelineAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import toast from 'react-hot-toast';
import { addDays, format, subDays } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/i18n/LanguageContext';

export default function TimelinePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeline, setTimeline] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<any[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 1, estimatedTime: 30 });
  const { t, lang } = useLanguage();

  useEffect(() => {
    fetchTimeline();

    socketService.onTimelineUpdated((tl) => {
      setTimeline(tl);
      setTasks(tl.tasks || []);
      setTimeBlocks(tl.timeBlocks || []);
      toast(t('时间表已更新'), { icon: '??' });
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [currentDate]);

  const locale = lang === 'zh' ? zhCN : enUS;
  const dateLabel = lang === 'zh'
    ? format(currentDate, 'yyyy年MM月dd日', { locale })
    : format(currentDate, 'MMM dd, yyyy', { locale });

  const fetchTimeline = async () => {
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const response = await timelineAPI.getByDate(dateStr);
      setTimeline(response.data);
      setTasks(response.data.tasks || []);
      setTimeBlocks(response.data.timeBlocks || []);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    }
  };

  const handlePrevDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddTask = async () => {
    if (!newTask.title) {
      toast.error(t('请输入任务标题'));
      return;
    }

    const updatedTasks = [
      ...tasks,
      {
        id: Date.now().toString(),
        title: newTask.title,
        priority: newTask.priority,
        status: 'pending',
        estimatedTime: newTask.estimatedTime,
        completedAt: null,
      },
    ];

    try {
      await updateTimeline({ tasks: updatedTasks });
      setTasks(updatedTasks);
      setNewTask({ title: '', priority: 1, estimatedTime: 30 });
      setIsAddingTask(false);
      toast.success(t('任务已添加'));
    } catch (error) {
      toast.error(t('添加任务失败'));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    try {
      await updateTimeline({ tasks: updatedTasks });
      setTasks(updatedTasks);
      toast.success(t('任务已删除'));
    } catch (error) {
      toast.error(t('删除任务失败'));
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        const newStatus = t.status === 'completed' ? 'pending' : 'completed';
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
        };
      }
      return t;
    });

    try {
      await updateTimeline({ tasks: updatedTasks });
      setTasks(updatedTasks);
    } catch (error) {
      toast.error(t('更新任务状态失败'));
    }
  };

  const handleAddTimeBlock = async () => {
    const start = prompt(t('开始时间 (HH:mm):'));
    const end = prompt(t('结束时间 (HH:mm):'));
    const task = prompt(t('任务内容:'));
    const category = prompt(t('类别 (work/study/rest/meeting):')) || 'work';

    if (!start || !end || !task) return;

    const updatedBlocks = [
      ...timeBlocks,
      {
        id: Date.now().toString(),
        start,
        end,
        task,
        category,
        color: getCategoryColor(category),
      },
    ];

    try {
      await updateTimeline({ timeBlocks: updatedBlocks });
      setTimeBlocks(updatedBlocks);
      toast.success(t('时间块已添加'));
    } catch (error) {
      toast.error(t('添加时间块失败'));
    }
  };

  const handleDeleteTimeBlock = async (blockId: string) => {
    const updatedBlocks = timeBlocks.filter((b) => b.id !== blockId);
    try {
      await updateTimeline({ timeBlocks: updatedBlocks });
      setTimeBlocks(updatedBlocks);
      toast.success(t('时间块已删除'));
    } catch (error) {
      toast.error(t('删除时间块失败'));
    }
  };

  const updateTimeline = async (data: any) => {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    await timelineAPI.update(dateStr, data);
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      work: '#3b82f6',
      study: '#10b981',
      rest: '#f59e0b',
      meeting: '#ef4444',
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      work: t('工作'),
      study: t('学习'),
      rest: t('休息'),
      meeting: t('会议'),
    };
    return map[category] || category;
  };

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('时间表')}</h1>
        <p className="text-gray-600 mt-1">{t('规划和追踪您的时间分配')}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <button
          onClick={handlePrevDay}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{dateLabel}</h2>
          <p className="text-sm text-gray-600">{format(currentDate, 'EEEE', { locale })}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-lg btn-soft"
          >
            {t('今天')}
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{t('任务完成率')}</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{completionRate}%</span>
            <span className="text-sm text-gray-500 mb-1">
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{t('时间利用率')}</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {timeline?.utilizationRate || 0}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {t('工作时长: {hours}小时', { hours: Math.floor((timeline?.totalWorkTime || 0) / 60) })}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">{t('时间分布')}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t('工作')}</span>
              <span className="font-medium">{Math.floor((timeline?.statistics?.work || 0) / 60)}h</span>
            </div>
            <div className="flex justify-between">
              <span>{t('学习')}</span>
              <span className="font-medium">{Math.floor((timeline?.statistics?.study || 0) / 60)}h</span>
            </div>
            <div className="flex justify-between">
              <span>{t('休息')}</span>
              <span className="font-medium">{Math.floor((timeline?.statistics?.rest || 0) / 60)}h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('任务看板')}</h2>
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center px-3 py-1 rounded-lg btn-soft text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              {t('添加')}
            </button>
          </div>
          <div className="p-6 space-y-3">
            {isAddingTask && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder={t('任务标题...')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 rounded-lg btn-soft text-sm"
                  >
                    {t('保存')}
                  </button>
                  <button
                    onClick={() => setIsAddingTask(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                  >
                    {t('取消')}
                  </button>
                </div>
              </div>
            )}

            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  task.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleTaskStatus(task.id)}
                      className="mt-1 w-5 h-5"
                    />
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          task.status === 'completed'
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('预计 {minutes} 分钟', { minutes: task.estimatedTime })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {tasks.length === 0 && !isAddingTask && (
              <div className="text-center py-8 text-gray-500">
                <p>{t('还没有任务，点击上方按钮添加')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('时间轴')}</h2>
            <button
              onClick={handleAddTimeBlock}
              className="flex items-center px-3 py-1 rounded-lg btn-soft text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              {t('添加')}
            </button>
          </div>
          <div className="p-6 space-y-2">
            {timeBlocks
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((block) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 hover:bg-gray-50 transition-colors"
                  style={{ borderLeftColor: block.color }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {block.start} - {block.end}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        {getCategoryLabel(block.category)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{block.task}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTimeBlock(block.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}

            {timeBlocks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>{t('还没有时间块，点击上方按钮添加')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
