import { useAppStore } from '../store/appStore';

export interface Reminder {
  id: string;
  type: 'checkin' | 'reflection' | 'wellness';
  title: string;
  message: string;
  scheduledFor: number;
  isRecurring: boolean;
  recurringDays?: number[]; // 0=Sunday, 1=Monday, etc.
  recurringTime?: string; // "09:00"
  isActive: boolean;
  createdAt: number;
}

class ReminderService {
  private notifications: Notification[] = [];
  
  constructor() {
    this.requestPermission();
    this.scheduleDefaultReminders();
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  scheduleDefaultReminders() {
    const hasPermission = localStorage.getItem('clear.notifications') === '1';
    if (!hasPermission) return;

    // Daily check-in reminder
    this.scheduleRecurringReminder({
      id: 'daily-checkin',
      type: 'checkin',
      title: '🌟 Daily Wellness Check-in',
      message: 'How are you feeling today? Take a moment to check in with yourself.',
      scheduledFor: Date.now(),
      isRecurring: true,
      recurringDays: [1, 2, 3, 4, 5, 6, 0], // Every day
      recurringTime: '09:00',
      isActive: true,
      createdAt: Date.now()
    });

    // Evening reflection reminder
    this.scheduleRecurringReminder({
      id: 'evening-reflection',
      type: 'reflection',
      title: '🌙 Evening Reflection',
      message: 'Take a few minutes to reflect on your day in your private vault.',
      scheduledFor: Date.now(),
      isRecurring: true,
      recurringDays: [1, 2, 3, 4, 5, 6, 0], // Every day
      recurringTime: '20:00',
      isActive: true,
      createdAt: Date.now()
    });

    // Weekly wellness check
    this.scheduleRecurringReminder({
      id: 'weekly-wellness',
      type: 'wellness',
      title: '📊 Weekly Wellness Review',
      message: 'Check your wellness insights and celebrate your progress!',
      scheduledFor: Date.now(),
      isRecurring: true,
      recurringDays: [0], // Sunday
      recurringTime: '10:00',
      isActive: true,
      createdAt: Date.now()
    });
  }

  scheduleRecurringReminder(reminder: Reminder) {
    if (!reminder.isRecurring || !reminder.recurringDays || !reminder.recurringTime) return;

    const [hours, minutes] = reminder.recurringTime.split(':').map(Number);
    
    reminder.recurringDays.forEach(dayOfWeek => {
      const now = new Date();
      const scheduledDate = new Date();
      
      // Calculate next occurrence of this day
      const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
      scheduledDate.setDate(now.getDate() + (daysUntilTarget === 0 && now.getHours() >= hours ? 7 : daysUntilTarget));
      scheduledDate.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for next week
      if (scheduledDate <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 7);
      }

      this.scheduleNotification(reminder, scheduledDate.getTime());
    });
  }

  scheduleNotification(reminder: Reminder, timestamp: number) {
    const delay = timestamp - Date.now();
    if (delay <= 0) return;

    setTimeout(() => {
      this.showNotification(reminder);
      
      // Reschedule if recurring
      if (reminder.isRecurring) {
        this.scheduleRecurringReminder(reminder);
      }
    }, delay);
  }

  async showNotification(reminder: Reminder) {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const notification = new Notification(reminder.title, {
      body: reminder.message,
      icon: '/pwa-192x192.png',
      badge: '/favicon.svg',
      tag: reminder.id,
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Open Clear' },
        { action: 'snooze', title: 'Remind me later' }
      ]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate to appropriate page
      if (reminder.type === 'checkin') {
        window.location.hash = '#/checkin';
      } else if (reminder.type === 'reflection') {
        window.location.hash = '#/vault';
      } else if (reminder.type === 'wellness') {
        window.location.hash = '#/insights';
      }
    };

    this.notifications.push(notification);
  }

  // Streak-based intelligent reminders
  checkStreakReminders() {
    const checkIns = useAppStore.getState().checkIns;
    const lastCheckIn = checkIns[checkIns.length - 1];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Streak break warning
    if (!lastCheckIn || lastCheckIn.createdAt < oneDayAgo) {
      const daysSinceLastCheckIn = lastCheckIn ? 
        Math.floor((now - lastCheckIn.createdAt) / (24 * 60 * 60 * 1000)) : 1;

      if (daysSinceLastCheckIn === 1) {
        this.showNotification({
          id: 'streak-warning',
          type: 'checkin',
          title: '🔥 Don\'t break your streak!',
          message: 'You haven\'t checked in today. Keep your wellness journey going!',
          scheduledFor: now,
          isRecurring: false,
          isActive: true,
          createdAt: now
        });
      } else if (daysSinceLastCheckIn === 3) {
        this.showNotification({
          id: 'comeback-gentle',
          type: 'checkin',
          title: '💙 We miss you',
          message: 'No pressure, but your wellness matters. Come back when you\'re ready.',
          scheduledFor: now,
          isRecurring: false,
          isActive: true,
          createdAt: now
        });
      }
    }
  }

  // Mood-based intelligent reminders
  checkMoodReminders() {
    const checkIns = useAppStore.getState().checkIns;
    const recentCheckIns = checkIns.filter(c => c.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (recentCheckIns.length >= 3) {
      const sadCount = recentCheckIns.filter(c => c.mood === 'sad').length;
      const tiredCount = recentCheckIns.filter(c => c.mood === 'tired').length;
      
      // Gentle support for difficult periods
      if (sadCount >= 3) {
        this.showNotification({
          id: 'support-sad',
          type: 'wellness',
          title: '🤗 You\'re not alone',
          message: 'It looks like you\'ve been having a tough time. Consider checking our safety resources.',
          scheduledFor: Date.now(),
          isRecurring: false,
          isActive: true,
          createdAt: Date.now()
        });
      }
      
      // Energy boost suggestions
      if (tiredCount >= 3) {
        this.showNotification({
          id: 'energy-boost',
          type: 'wellness',
          title: '⚡ Feeling tired lately?',
          message: 'You\'ve been feeling tired. Remember to take care of your basics: sleep, food, movement.',
          scheduledFor: Date.now(),
          isRecurring: false,
          isActive: true,
          createdAt: Date.now()
        });
      }
    }
  }

  // Celebration reminders
  checkCelebrationReminders() {
    const { checkIns } = useAppStore.getState();
    const streak = this.calculateStreak(checkIns);
    
    // Milestone celebrations
    if ([7, 14, 30, 60, 100].includes(streak)) {
      this.showNotification({
        id: `celebration-${streak}`,
        type: 'wellness',
        title: `🎉 ${streak} Day Streak!`,
        message: `Amazing! You've checked in for ${streak} days in a row. You're building a powerful habit!`,
        scheduledFor: Date.now(),
        isRecurring: false,
        isActive: true,
        createdAt: Date.now()
      });
    }
  }

  calculateStreak(entries: any[]): number {
    if (entries.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 365; i++) {
      const dayStart = currentDate.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const hasEntry = entries.some(entry => 
        entry.createdAt >= dayStart && entry.createdAt < dayEnd
      );
      
      if (hasEntry) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  startIntelligentReminders() {
    // Check every hour for intelligent reminders
    setInterval(() => {
      this.checkStreakReminders();
      this.checkMoodReminders();
      this.checkCelebrationReminders();
    }, 60 * 60 * 1000); // Every hour
  }
}

export const reminderService = new ReminderService();
