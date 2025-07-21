import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Activity {
  _id: string;
  type: string;
  createdAt: string; // Changed from timestamp
  userId?: { name: string; email: string };
  bookId?: { title: string };
  details: string;
}

const getActivityTypeBadge = (type: string) => {
  switch (type) {
    case 'new_user': return 'bg-blue-100 text-blue-800';
    case 'book_added': return 'bg-green-100 text-green-800';
    case 'loan_issued': return 'bg-yellow-100 text-yellow-800';
    case 'loan_returned': return 'bg-indigo-100 text-indigo-800';
    case 'reservation_created': return 'bg-purple-100 text-purple-800';
    case 'settings_changed': return 'bg-pink-100 text-pink-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ActivityLogs() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/activity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        toast.error('Failed to fetch activity logs.');
      }
    } catch (error) {
      toast.error('Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading activity logs...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Activity Logs</h1>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity._id}>
                <TableCell>{format(new Date(activity.createdAt), 'PPpp')}</TableCell>
                <TableCell>
                  <Badge className={`${getActivityTypeBadge(activity.type)}`}>
                    {activity.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{activity.details}</TableCell>
                <TableCell>
                  {activity.userId ? (
                    <div>
                      <div>{activity.userId.name}</div>
                      <div className="text-sm text-gray-500">{activity.userId.email}</div>
                    </div>
                  ) : (
                    'System'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 