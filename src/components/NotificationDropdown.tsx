import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    fullName: string;
    email: string;
  };
  relatedProduct?: {
    name: string;
    sku: string;
  };
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getAll(false, undefined, 20);
      setNotifications(response.data);
      setUnreadCount(response.unreadCount || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`flex flex-col items-start gap-2 py-3 ${
                  !notification.isRead ? 'bg-orange-50' : ''
                }`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                      <span className="text-xs font-medium text-orange-600">
                        {getNotificationType(notification.type)}
                      </span>
                    </div>
                    <p className="text-sm">{notification.message}</p>
                    {notification.relatedProduct && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.relatedProduct.name} ({notification.relatedProduct.sku})
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  function getNotificationType(type: string): string {
    switch (type) {
      case 'reorder':
        return 'Reorder';
      case 'restock':
        return 'Restock';
      default:
        return 'System';
    }
  }
}

