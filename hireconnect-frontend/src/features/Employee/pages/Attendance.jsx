import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  HOLIDAY_UPDATE_EVENT,
  HOLIDAY_UPDATE_STORAGE_KEY,
  buildHolidayMapByDate,
  fetchHolidays,
} from "../../../lib/holidaysApi";
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || import.meta.env?.APP_BASE_URL?.trim() || "").replace(/\/+$/, "").replace(/\/api$/i, "");
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const getApiBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim();
  return (fromEnv || "").replace(/\/+$/, "").replace(/\/api$/i, "");
};

const APIBASEURL = getApiBaseUrl();

const buildAuthHeader = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

export default function Attendance() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const calendarYearOptions = Array.from({ length: 21 }, (_, index) => today.getFullYear() - 10 + index);
  const [status, setStatus] = useState('notstarted');
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [shiftDate, setShiftDate] = useState(null);
  const [workStartedToday, setWorkStartedToday] = useState(false);
  
  const intervalRef = useRef(null);
  
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const [calendarData, setCalendarData] = useState({});
  const [holidayMap, setHolidayMap] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const toDateKey = (date) => {
    if (!date || isNaN(date)) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const getUserStorageKey = (key) => {
    const userId = localStorage.getItem('userId');
    return userId ? `${key}_${userId}` : key;
  };

  const shouldDisplayShiftTimes = () => {
    const todayKey = toDateKey(today);
    return shiftDate === todayKey || (workStartedToday && shiftStartTime);
  };

  const generateCalendarDays = (month, year, backendData = {}, holidaysByDate = {}) => {
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const todayKey = toDateKey(new Date());

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);
      const isToday = dateKey === todayKey;
      
      const backendDay = backendData[dateKey] || backendData.days?.find(d => d.date === dateKey);
      const holidaysForDate = holidaysByDate[dateKey] || [];
      const holidayNames = holidaysForDate.map((holiday) => holiday?.name).filter(Boolean);
      const hasHoliday = holidayNames.length > 0;
      
      days.push({
        date: dateKey,
        day: day.toString(),
        status: hasHoliday ? 'HOLIDAY' : backendDay?.status || 'ABSENT',
        statusColor: hasHoliday ? '#A855F7' : backendDay?.statusColor || '#DC2626',
        textColor: hasHoliday ? '#ffffff' : backendDay?.textColor || '#ffffff',
        holidayName: holidayNames.join(', '),
        holidayNames,
        isToday
      });
    }
    
    return days;
  };

  const fetchCalendarData = async (month, year) => {
    const authHeader = buildAuthHeader();
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !authHeader) return;

    setLoadingCalendar(true);
    try {
      const response = await fetch(
        `${APIBASEURL}/api/attendance/calendar/${userId}/${year}/${month + 1}`,
        {
          method: 'GET',
          headers: { 'Authorization': authHeader }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch calendar');
      const result = await response.json();
      setCalendarData(result?.data || {});

      const holidays = await fetchHolidays({ year, month: month + 1 });
      setHolidayMap(buildHolidayMapByDate(holidays));
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setCalendarData({});
      setHolidayMap({});
    } finally {
      setLoadingCalendar(false);
    }
  };

  const fetchNotifications = async () => {
    const authHeader = buildAuthHeader();
    if (!authHeader) return;

    setLoadingNotifications(true);
    try {
      const response = await fetch(`${APIBASEURL}/api/notifications`, {
        method: 'GET',
        headers: { 'Authorization': authHeader }
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');
      const result = await response.json();
      setNotifications(result?.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (id) => {
    const authHeader = buildAuthHeader();
    if (!authHeader) return;

    try {
      await fetch(`${APIBASEURL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': authHeader }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    const authHeader = buildAuthHeader();
    if (!authHeader) return;

    try {
      await fetch(`${APIBASEURL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColors = (statusColor, textColor) => {
    if (!statusColor || !textColor) {
      return {
        bgStyle: { backgroundColor: '#ffffff' },
        borderStyle: { borderColor: '#e5e7eb' },
        textStyle: { color: '#374151' }
      };
    }
    
    return {
      bgStyle: { backgroundColor: statusColor },
      borderStyle: { borderColor: statusColor },
      textStyle: { color: textColor }
    };
  };

  const renderCalendar = () => {
    const cells = [];
    const todayKey = toDateKey(new Date());

    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-12" />);
    }

    const calendarDays = generateCalendarDays(currentMonth, currentYear, calendarData, holidayMap);
    
    calendarDays.forEach((dayData) => {
      const key = dayData.date;
      const isToday = dayData.isToday;
      const isSelected = key === selectedDate;
      
      const colors = getStatusColors(dayData.statusColor, dayData.textColor);
      
      const tooltip = dayData.holidayNames?.length
        ? `${dayData.holidayNames.join(', ')} (Holiday)`
        : `${dayData.status.replace(/_/g, ' ')}`;
      
      cells.push(
        <button
          key={key}
          type="button"
          onClick={() => setSelectedDate(key)}
          className={`
            relative flex flex-col items-center justify-center h-16 rounded-2xl border text-xs cursor-pointer
            transition-all px-2 hover:scale-105 hover:shadow-md
            ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 shadow-lg' : ''}
            ${isSelected ? 'outline outline-2 outline-blue-600 shadow-blue-200' : ''}
          `}
          style={{
            backgroundColor: colors.bgStyle.backgroundColor,
            borderColor: colors.borderStyle.borderColor,
            color: colors.textStyle.color
          }}
          title={tooltip}
        >
          <span className="text-sm font-semibold leading-tight">{dayData.day}</span>
          {dayData.holidayNames?.length > 0 && (
            <span className="mt-0.5 w-full max-h-6 overflow-y-auto text-center text-[8px] font-semibold leading-tight">
              {dayData.holidayNames.map((name, index) => (
                <span key={`${key}-${name}-${index}`} className="block truncate">
                  {name}
                </span>
              ))}
            </span>
          )}
        </button>
      );
    });

    const totalCells = 42;
    while (cells.length < totalCells) {
      cells.push(<div key={`empty-${cells.length}`} className="h-12" />);
    }

    return cells;
  };

  const loadTodayAttendance = async () => {
    const authHeader = buildAuthHeader();
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !authHeader) return;

    const todayKey = toDateKey(today);
    try {
      const resp = await fetch(`${APIBASEURL}/api/attendance/today/${userId}`, {
        method: 'GET',
        headers: { 'Authorization': authHeader }
      });
      const parsed = await resp.json().catch(() => null);
      const payload = parsed?.data ? parsed.data : parsed;

      const backendStatus = payload?.status || payload?.data?.status;
      const totalSeconds = payload?.totalSeconds ?? payload?.data?.totalSeconds ?? 0;
      const currentBreakSeconds = payload?.totalBreakSeconds ?? payload?.data?.totalBreakSeconds ?? 0;
      const startTime = payload?.shiftStartTime || payload?.data?.shiftStartTime;
      const endTime = payload?.shiftEndTime || payload?.data?.shiftEndTime;

      const storedStartTime = localStorage.getItem(getUserStorageKey('shiftStartTime'));
      const storedEndTime = localStorage.getItem(getUserStorageKey('shiftEndTime'));
      const storedShiftDate = localStorage.getItem(getUserStorageKey('shiftDate'));
      const completedDate = localStorage.getItem(getUserStorageKey('workCompletedToday'));

      const formatTimeFromBackend = (timeStr) => {
        if (!timeStr) return null;
        
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
          return timeStr;
        }
        
        try {
          const date = new Date(`2000-01-01 ${timeStr}`);
          return date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          });
        } catch (e) {
          return timeStr;
        }
      };

      if (completedDate === todayKey) {
        setWorkStartedToday(true);
        setStatus('completed');
      }

      if (startTime) {
        const formattedStartTime = formatTimeFromBackend(startTime);
        setShiftStartTime(formattedStartTime);
        setShiftDate(todayKey);
        localStorage.setItem(getUserStorageKey('shiftStartTime'), formattedStartTime);
      } else if (storedStartTime && storedShiftDate === todayKey) {
        setShiftStartTime(storedStartTime);
        setShiftDate(todayKey);
      }

      if (endTime) {
        const formattedEndTime = formatTimeFromBackend(endTime);
        setShiftEndTime(formattedEndTime);
        setShiftDate(todayKey);
        localStorage.setItem(getUserStorageKey('shiftEndTime'), formattedEndTime);
      } else if (storedEndTime && storedShiftDate === todayKey) {
        setShiftEndTime(storedEndTime);
        setShiftDate(todayKey);
      }

      if (backendStatus === 'working') {
        setStatus('working');
        setWorkSeconds(Number(totalSeconds) || 0);
        setWorkStartedToday(true);
        localStorage.setItem(getUserStorageKey('workStartedToday'), 'true');
        localStorage.setItem(getUserStorageKey('workStartDate'), todayKey);
        localStorage.setItem(getUserStorageKey('shiftDate'), todayKey);

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setWorkSeconds(prev => prev + 1), 1000);
      } else if (backendStatus === 'on_break' || backendStatus === 'onbreak') {
        setStatus('onbreak');
        setWorkSeconds(Number(totalSeconds) || 0);
        setBreakSeconds(Number(currentBreakSeconds) || 0);
        setWorkStartedToday(true);
        localStorage.setItem(getUserStorageKey('workStartedToday'), 'true');
        localStorage.setItem(getUserStorageKey('workStartDate'), todayKey);
        localStorage.setItem(getUserStorageKey('shiftDate'), todayKey);

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => setBreakSeconds(prev => prev + 1), 1000);
      } else if (backendStatus === 'completed' || backendStatus === 'COMPLETED' || 
                 backendStatus === 'HALF_DAY' || backendStatus === 'half_day' ||
                 backendStatus === 'PRESENT' || backendStatus === 'present') {
        setStatus('completed');
        setWorkSeconds(Number(totalSeconds) || 0);
        setBreakSeconds(Number(currentBreakSeconds) || 0);
        setWorkStartedToday(true);
        localStorage.setItem(getUserStorageKey('workStartedToday'), 'true');
        localStorage.setItem(getUserStorageKey('workStartDate'), todayKey);
        localStorage.setItem(getUserStorageKey('shiftDate'), todayKey);
        localStorage.setItem(getUserStorageKey('workCompletedToday'), todayKey);
      } else {
        const storedDate = localStorage.getItem(getUserStorageKey('workStartDate'));
        const storedShiftDate2 = localStorage.getItem(getUserStorageKey('shiftDate'));
        if (storedDate === todayKey) {
          setWorkStartedToday(true);
          setShiftDate(storedShiftDate2);
        } else {
          setWorkStartedToday(false);
          setShiftStartTime(null);
          setShiftEndTime(null);
          setShiftDate(null);
          localStorage.removeItem(getUserStorageKey('workStartedToday'));
          localStorage.removeItem(getUserStorageKey('workStartDate'));
          localStorage.removeItem(getUserStorageKey('shiftDate'));
          localStorage.removeItem(getUserStorageKey('shiftStartTime'));
          localStorage.removeItem(getUserStorageKey('shiftEndTime'));
          localStorage.removeItem(getUserStorageKey('workCompletedToday'));
          setStatus('notstarted');
        }
      }
    } catch (error) {
      console.error('Failed to load todays attendance:', error);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
    fetchCalendarData(currentMonth, currentYear);
    fetchNotifications();

    const notificationInterval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(notificationInterval);
    };
  }, []);

  useEffect(() => {
    fetchCalendarData(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    const onHolidayUpdate = () => fetchCalendarData(currentMonth, currentYear);
    const onHolidayStorageUpdated = (event) => {
      if (event?.key !== HOLIDAY_UPDATE_STORAGE_KEY) return;
      fetchCalendarData(currentMonth, currentYear);
    };
    const intervalId = setInterval(() => fetchCalendarData(currentMonth, currentYear), 60 * 1000);
    window.addEventListener(HOLIDAY_UPDATE_EVENT, onHolidayUpdate);
    window.addEventListener("storage", onHolidayStorageUpdated);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener(HOLIDAY_UPDATE_EVENT, onHolidayUpdate);
      window.removeEventListener("storage", onHolidayStorageUpdated);
    };
  }, [currentMonth, currentYear]);

  const startWork = async () => {
    if (workStartedToday) {
      alert('Work has already been started today. You cannot start work multiple times in a day.');
      return;
    }

    const authHeader = buildAuthHeader();
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !authHeader) {
      alert('User not logged in. Make sure token and userId are in localStorage.');
      return;
    }

    const payload = { employeeId: userId };
    try {
      const response = await fetch(`${APIBASEURL}/api/attendance/start-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload)
      });
      const parsed = await response.json().catch(() => null);

      if (!response.ok) {
        const message = parsed?.message || parsed?.data?.message || parsed || parsed?.error || 'Unable to start work';
        alert(message);
        return;
      }

      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: true });
      const todayKey = toDateKey(today);

      setShiftStartTime(timeString);
      setShiftDate(todayKey);
      setStatus('working');
      setWorkStartedToday(true);
      localStorage.setItem(getUserStorageKey('workStartedToday'), 'true');
      localStorage.setItem(getUserStorageKey('workStartDate'), todayKey);
      localStorage.setItem(getUserStorageKey('shiftDate'), todayKey);
      localStorage.setItem(getUserStorageKey('shiftStartTime'), timeString);

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => setWorkSeconds(prev => prev + 1), 1000);

      fetchCalendarData(currentMonth, currentYear);
    } catch (error) {
      console.error('Start Work API Error:', error);
      alert('Network error while starting work.');
    }
  };

  const startBreak = async () => {
    const authHeader = buildAuthHeader();
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !authHeader) {
      alert('User not logged in.');
      return;
    }

    const payload = { employeeId: userId };
    try {
      const response = await fetch(`${APIBASEURL}/api/attendance/break-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload)
      });
      const parsed = await response.json().catch(() => null);

      if (!response.ok) {
        const message = parsed?.message || 'Cannot start break';
        if (message.includes('automatically ended') || message.includes('exceeded 9 hours')) {
          alert(message);
          await loadTodayAttendance();
          fetchCalendarData(currentMonth, currentYear);
          return;
        }
        alert(message);
        return;
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setStatus('onbreak');
      intervalRef.current = setInterval(() => setBreakSeconds(prev => prev + 1), 1000);

      fetchCalendarData(currentMonth, currentYear);
    } catch (error) {
      console.error('Break Start API Error:', error);
      alert('Network error while starting break.');
    }
  };

  const resumeWork = async () => {
    const authHeader = buildAuthHeader();
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !authHeader) {
      alert('User not logged in.');
      return;
    }

    const payload = { employeeId: userId };
    try {
      const response = await fetch(`${APIBASEURL}/api/attendance/break-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload)
      });
      const parsed = await response.json().catch(() => null);

      if (!response.ok) {
        const message = parsed?.message || 'Cannot resume work';
        if (message.includes('automatically ended') || message.includes('exceeded 9 hours')) {
          alert(message);
          await loadTodayAttendance();
          fetchCalendarData(currentMonth, currentYear);
          return;
        }
        alert(message);
        return;
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus('working');
      intervalRef.current = setInterval(() => setWorkSeconds(prev => prev + 1), 1000);

      fetchCalendarData(currentMonth, currentYear);
    } catch (error) {
      console.error('Resume Work API Error:', error);
      alert('Network error while resuming work.');
    }
  };

  const endWork = async () => {
    const authHeader = buildAuthHeader();
    const userId = Number(localStorage.getItem('userId'));
    if (!userId || !authHeader) {
      alert('User not logged in.');
      return;
    }

    const payload = { employeeId: userId };
    try {
      const response = await fetch(`${APIBASEURL}/api/attendance/end-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(payload)
      });
      const parsed = await response.json().catch(() => null);

      if (!response.ok) {
        const message = parsed?.message || 'Cannot end work';
        alert(message);
        return;
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;

      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: true });
      const todayKey = toDateKey(today);

      setShiftEndTime(timeString);
      setShiftDate(todayKey);
      setStatus('completed');
      localStorage.setItem(getUserStorageKey('workCompletedToday'), todayKey);
      setWorkStartedToday(true);
      localStorage.setItem(getUserStorageKey('shiftEndTime'), timeString);
      localStorage.setItem(getUserStorageKey('shiftDate'), todayKey);

      fetchCalendarData(currentMonth, currentYear);
      
      const timesheetAutoSubmitted = parsed?.data?.timesheetAutoSubmitted || false;
      if (!timesheetAutoSubmitted) {
        setShowTimesheetModal(true);
      } else {
        alert('Work ended. Timesheet was automatically submitted.');
      }
    } catch (error) {
      console.error('End Work API Error:', error);
      alert('Network error while ending work.');
    }
  };

  const changeMonth = (dir) => {
    if (dir === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const formatSeconds = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const totalWorkToday = workSeconds;
  const totalBreakToday = breakSeconds;

  const Modal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-2xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  // ✅ NEW APPROACH: Timesheet Modal with Uncontrolled Components using Refs
  const TimesheetModal = ({ onClose }) => {
    const tasksRef = useRef(null);
    const remarksRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      const authHeader = buildAuthHeader();
      const userId = Number(localStorage.getItem('userId'));
      
      if (!authHeader || !userId) {
        alert('User not logged in.');
        return;
      }

      const tasks = tasksRef.current?.value || '';
      const remarks = remarksRef.current?.value || '';

      if (!tasks.trim()) {
        alert('Please enter the tasks you completed.');
        return;
      }

      const payload = {
        employeeId: userId,
        tasks: tasks.trim(),
        remarks: remarks.trim(),
        date: toDateKey(today)
      };

      setIsSubmitting(true);
      try {
        const response = await fetch(`${APIBASEURL}/api/attendance/save-timesheet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          const message = result?.message || 'Failed to submit timesheet';
          alert(message);
          setIsSubmitting(false);
          return;
        }

        alert('Timesheet submitted successfully!');
        onClose();
        fetchCalendarData(currentMonth, currentYear);
        fetchNotifications();
      } catch (error) {
        console.error('Timesheet API Error:', error);
        alert('Error submitting timesheet.');
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="timesheet-tasks" className="block text-sm font-medium text-gray-700 mb-1">
            Tasks Completed Today
          </label>
          <textarea
            ref={tasksRef}
            id="timesheet-tasks"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe the tasks you completed today&#10;• Task 1: Description&#10;• Task 2: Description&#10;• Task 3: Description"
            rows={6}
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            List all tasks you completed. You can use multiple lines and bullet points.
          </p>
        </div>
        <div>
          <label htmlFor="timesheet-remarks" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Remarks (Optional)
          </label>
          <textarea
            ref={remarksRef}
            id="timesheet-remarks"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Add any additional comments or notes about your workday"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
          </button>
        </div>
      </div>
    );
  };

  const LeaveForm = ({ onCancel, onSubmit }) => {
    const [type, setType] = useState('ANNUAL_LEAVE');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const reasonRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);

    const todayDate = useMemo(() => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }, []);

    const handleStartChange = (e) => {
      const value = e.target.value;
      setStart(value);

      if (end && new Date(end) < new Date(value)) {
        setEnd('');
      }
    };

    const submitLeaveToAPI = async () => {
      const reason = reasonRef.current?.value || '';

      if (!start || !end || !reason.trim()) {
        alert('Please fill all fields');
        return;
      }

      if (new Date(start) > new Date(end)) {
        alert('End date cannot be before start date');
        return;
      }

      const authHeader = buildAuthHeader();
      const employeeId = Number(localStorage.getItem('userId'));
      if (!employeeId || !authHeader) {
        alert('User not logged in.');
        return;
      }

      const payload = {
        employeeId,
        type: type,
        startDate: start,
        endDate: end,
        reason: reason.trim()
      };

      setSubmitting(true);
      try {
        const response = await fetch(`${APIBASEURL}/api/leaves/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          const message = result?.message || result?.data?.message || 'Failed to submit leave';
          alert(message);
          setSubmitting(false);
          return;
        }

        alert('Leave applied successfully!');
        onSubmit(payload);
        fetchNotifications();
      } catch (error) {
        console.error('Leave API Error:', error);
        alert('Error submitting leave request.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type
          </label>
          <select
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={submitting}
          >
            <option value="ANNUAL_LEAVE">Annual Leave</option>
            <option value="EARNED_LEAVE">Earned Leave</option>
            <option value="SICK_LEAVE">Sick Leave</option>
            <option value="CASUAL_LEAVE">Casual Leave</option>
            <option value="MATERNITY_LEAVE">Maternity Leave</option>
            <option value="PATERNITY_LEAVE">Paternity Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={start}
              onChange={handleStartChange}
              min={todayDate}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              min={start || todayDate}
              disabled={!start || submitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <textarea
            ref={reasonRef}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter reason for leave"
            rows={3}
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={submitLeaveToAPI}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    );
  };

  // ✅ NEW APPROACH: Correction Form with Uncontrolled Component using Ref
  const CorrectionForm = ({ dateKey, onCancel, onSubmit }) => {
    const [date, setDate] = useState(dateKey);
    const reasonRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);

    const getTodayDateString = () => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const submitCorrectionToAPI = async () => {
      const reason = reasonRef.current?.value || '';

      if (!date || !reason.trim()) {
        alert('Please fill all fields');
        return;
      }

      const authHeader = buildAuthHeader();
      const employeeId = Number(localStorage.getItem('userId'));
      if (!employeeId || !authHeader) {
        alert('User not logged in.');
        return;
      }

      const payload = {
        employeeId,
        date: date,
        reason: reason.trim(),
        action: 'mark_present'
      };

      setSubmitting(true);
      try {
        const response = await fetch(`${APIBASEURL}/api/attendance/correction-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          const message = result?.message || result?.data?.message || 'Failed to submit correction';
          alert(message);
          setSubmitting(false);
          return;
        }

        alert('Correction request submitted successfully!');
        onSubmit({ date, reason });
        fetchNotifications();
      } catch (error) {
        console.error('Correction API Error:', error);
        alert('Error submitting correction request.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date to Correct</label>
          <input
            type="date"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayDateString()}
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Correction</label>
          <textarea
            ref={reasonRef}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Explain what needs to be corrected&#10;• Reason 1&#10;• Reason 2"
            rows={3}
            disabled={submitting}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={submitCorrectionToAPI}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] px-6 py-6">
      <div className="w-full bg-[#011A8B] text-white rounded-3xl px-8 py-6 mb-8 shadow-md">
        <h1 className="text-3xl font-semibold mb-2">Attendance Dashboard</h1>
        <p className="text-sm text-blue-100 max-w-xl">
          Monitor your real-time attendance, manage leaves and request corrections in one place.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Attendance Calendar</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changeMonth('prev')}
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600 text-lg hover:scale-110 transition"
                  title="Previous Month"
                >
                  ‹
                </button>
                <select
                  value={currentMonth}
                  onChange={(event) => setCurrentMonth(Number(event.target.value))}
                  className="h-8 rounded-lg border border-gray-200 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label="Select month"
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={currentYear}
                  onChange={(event) => setCurrentYear(Number(event.target.value))}
                  className="h-8 rounded-lg border border-gray-200 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label="Select year"
                >
                  {calendarYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => changeMonth('next')}
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-100 text-gray-600 text-lg hover:scale-110 transition"
                  title="Next Month"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-3">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            {loadingCalendar ? (
              <div className="grid grid-cols-7 gap-2 h-48 flex items-center justify-center text-center py-8 text-gray-500">
                <div>Loading calendar...</div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 text-xs min-h-[240px]">{renderCalendar()}</div>
            )}
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#16A34A' }}></span>
                Present (Full)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#F97316' }}></span>
                Half Day
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#DC2626' }}></span>
                Absent
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#FACC15' }}></span>
                Leave
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2563EB' }}></span>
                Compensation Off
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#374151' }}></span>
                Weekend
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#A855F7' }}></span>
                Holiday
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#0EA5E9' }}></span>
                Working
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
              Real-Time Attendance Overview
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-2">Current Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold capitalize">
                  {status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 tracking-wider">
                  {formatSeconds(totalWorkToday)}
                </div>
                <p className="text-sm text-gray-500 mt-2">Work Time</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 tracking-wider">
                  {formatSeconds(totalBreakToday)}
                </div>
                <p className="text-sm text-gray-500 mt-2">Break Time</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6 mt-6">
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Shift Start: </span>
                  {shouldDisplayShiftTimes() ? shiftStartTime || 'N/A' : 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Shift End: </span>
                  {shouldDisplayShiftTimes() ? shiftEndTime || 'N/A' : 'N/A'}
                </p>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Total Work Duration: </span>
                  {formatDuration(workSeconds)}
                </p>
                <p>
                  <span className="font-medium">Total Break Duration: </span>
                  {formatDuration(breakSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-80 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Punch Controls</h2>
            <p className="text-xs text-gray-500 mb-2">Status</p>
            <div className="mb-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold capitalize">
                {status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="space-y-3 mb-5">
              {status === 'notstarted' && (
                <button
                  className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 transition disabled:opacity-50"
                  onClick={startWork}
                  disabled={workStartedToday}
                >
                  Start Work
                </button>
              )}
              {status === 'working' && (
                <>
                  <button
                    className="w-full rounded-full bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold py-2.5 transition"
                    onClick={startBreak}
                  >
                    Start Break
                  </button>
                  <button
                    className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 transition"
                    onClick={endWork}
                  >
                    End Work
                  </button>
                </>
              )}
              {status === 'onbreak' && (
                <>
                  <button
                    className="w-full rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2.5 transition"
                    onClick={resumeWork}
                  >
                    Resume Work
                  </button>
                  <button
                    className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 transition"
                    onClick={endWork}
                  >
                    End Work
                  </button>
                </>
              )}
              {status === 'completed' && (
                <div className="text-center text-xs text-gray-500 py-4">
                  Work completed for today
                </div>
              )}
            </div>
            {status !== 'completed' && (
              <div className="flex justify-between items-center bg-slate-50 rounded-2xl px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500">Work</p>
                  <p className="text-lg font-semibold text-gray-800">{formatSeconds(workSeconds)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Break</p>
                  <p className="text-lg font-semibold text-gray-800">{formatSeconds(breakSeconds)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <button
                className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 transition"
                onClick={() => setShowLeaveModal(true)}
              >
                Apply Leave
              </button>
              <button
                className="w-full rounded-full bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold py-2.5 transition"
                onClick={() => setShowCorrectionModal(true)}
              >
                Request Correction
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Notifications</h2>
            {loadingNotifications ? (
              <p className="text-xs text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-gray-500">No notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border transition-all ${
                      notif.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatNotificationTime(notif.createdAt)}</p>
                      </div>
                      <div className="flex gap-1">
                        {!notif.isRead && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-blue-600 hover:text-blue-700 text-xs font-bold px-2"
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-red-600 hover:text-red-700 text-lg leading-none px-1"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ✅ COMPLETELY NEW APPROACH: Using refs for uncontrolled components */}
      {showTimesheetModal && (
        <Modal title="Submit Timesheet" onClose={() => setShowTimesheetModal(false)}>
          <TimesheetModal onClose={() => setShowTimesheetModal(false)} />
        </Modal>
      )}

      {showLeaveModal && (
        <Modal title="Request Leave" onClose={() => setShowLeaveModal(false)}>
          <LeaveForm
            onCancel={() => setShowLeaveModal(false)}
            onSubmit={(data) => {
              setShowLeaveModal(false);
              fetchCalendarData(currentMonth, currentYear);
            }}
          />
        </Modal>
      )}

      {showCorrectionModal && (
        <Modal title="Request Attendance Correction" onClose={() => setShowCorrectionModal(false)}>
          <CorrectionForm
            dateKey={selectedDate}
            onCancel={() => setShowCorrectionModal(false)}
            onSubmit={(payload) => {
              setShowCorrectionModal(false);
              fetchCalendarData(currentMonth, currentYear);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
