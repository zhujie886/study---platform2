import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Dialog } from '@headlessui/react';
import { calendarAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CalendarPage() {
  const calendarRef = useRef<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    eventTitle: '',
    description: '',
    startTime: '',
    endTime: '',
    color: '#3b82f6',
    location: '',
    attendees: [] as string[],
    isAllDay: false,
    reminders: [15],
  });

  useEffect(() => {
    fetchEvents();

    // WebSocket实时更新
    socketService.onCalendarCreated((event) => {
      setEvents((prev) => [...prev, formatEventForCalendar(event)]);
      toast.success('日历事件已创建');
    });

    socketService.onCalendarUpdated((event) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? formatEventForCalendar(event) : e))
      );
      toast('日历事件已更新', { icon: '🔄' });
    });

    socketService.onCalendarDeleted(({ id }) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast('日历事件已删除', { icon: '🗑️' });
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await calendarAPI.getAll();
      setEvents(response.data.map(formatEventForCalendar));
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const formatEventForCalendar = (event: any) => ({
    id: event.id,
    title: event.eventTitle,
    start: event.startTime,
    end: event.endTime,
    backgroundColor: event.color,
    borderColor: event.color,
    allDay: event.isAllDay,
    extendedProps: {
      description: event.description,
      location: event.location,
      attendees: event.attendees,
      source: event.source,
    },
  });

  const handleDateSelect = (selectInfo: any) => {
    setIsEditMode(false);
    setSelectedEvent(null);
    setFormData({
      eventTitle: '',
      description: '',
      startTime: selectInfo.startStr,
      endTime: selectInfo.endStr,
      color: '#3b82f6',
      location: '',
      attendees: [],
      isAllDay: selectInfo.allDay,
      reminders: [15],
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    setIsEditMode(true);
    setSelectedEvent(event);
    setFormData({
      eventTitle: event.title,
      description: event.extendedProps.description || '',
      startTime: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(event.end || event.start, "yyyy-MM-dd'T'HH:mm"),
      color: event.backgroundColor,
      location: event.extendedProps.location || '',
      attendees: event.extendedProps.attendees || [],
      isAllDay: event.allDay,
      reminders: [15],
    });
    setIsModalOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!formData.eventTitle || !formData.startTime || !formData.endTime) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      await calendarAPI.create(formData);
      toast.success('日历事件创建成功！');
      setIsModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('时间冲突！该时间段已有其他事件');
      } else {
        toast.error('创建失败');
      }
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      await calendarAPI.update(selectedEvent.id, formData);
      toast.success('日历事件更新成功！');
      setIsModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('时间冲突！该时间段已有其他事件');
      } else {
        toast.error('更新失败');
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!confirm('确定要删除这个事件吗？')) return;

    try {
      await calendarAPI.delete(selectedEvent.id);
      toast.success('删除成功');
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleEventDrop = async (info: any) => {
    try {
      await calendarAPI.update(info.event.id, {
        startTime: info.event.start,
        endTime: info.event.end || info.event.start,
      });
      toast.success('事件时间已更新');
    } catch (error: any) {
      info.revert();
      if (error.response?.status === 409) {
        toast.error('时间冲突！无法移动到该时间段');
      } else {
        toast.error('更新失败');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">日历</h1>
        <p className="text-gray-600 mt-1">管理您的日程安排和会议</p>
      </div>

      {/* 日历 */}
      <div className="bg-white rounded-lg shadow p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{
            today: '今天',
            month: '月',
            week: '周',
            day: '日',
            list: '列表',
          }}
          locale="zh-cn"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop}
          height="auto"
        />
      </div>

      {/* 事件模态框 */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">
                {isEditMode ? '编辑事件' : '创建事件'}
              </Dialog.Title>

              <div className="space-y-4">
                {/* 事件标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    事件标题 *
                  </label>
                  <input
                    type="text"
                    value={formData.eventTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, eventTitle: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="输入事件标题..."
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="输入事件描述..."
                  />
                </div>

                {/* 开始时间 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始时间 *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束时间 *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* 地点 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    地点
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="输入事件地点..."
                  />
                </div>

                {/* 颜色 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    颜色
                  </label>
                  <div className="flex gap-2">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-10 h-10 rounded-lg transition-transform ${
                            formData.color === color ? 'scale-110 ring-2 ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>

                {/* 全天事件 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) =>
                      setFormData({ ...formData, isAllDay: e.target.checked })
                    }
                    className="w-4 h-4 mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">全天事件</label>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={isEditMode ? handleUpdateEvent : handleCreateEvent}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {isEditMode ? '更新' : '创建'}
                </button>
                {isEditMode && (
                  <button
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    删除
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}



