import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Settings {
  libraryName: string;
  libraryLogoUrl: string;
  contactEmail: string;
  maxBooksPerUser: number;
  loanDurationDays: number;
  finePerDay: number;
  notificationEmail: string;
}

const defaultSettings: Settings = {
  libraryName: '',
  libraryLogoUrl: '',
  contactEmail: '',
  maxBooksPerUser: 5,
  loanDurationDays: 14,
  finePerDay: 5,
  notificationEmail: '',
};

export default function GeneralSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        // Only show error if no settings are loaded
        setSettings(defaultSettings);
        toast.error('Failed to fetch settings.');
      }
    } catch (error) {
      // Only show error if no settings are loaded
      setSettings(defaultSettings);
      toast.error('Failed to fetch settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'maxBooksPerUser' || name === 'loanDurationDays' || name === 'finePerDay' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        toast.success('Settings updated successfully!');
      } else {
        toast.error('Failed to update settings.');
      }
    } catch (error) {
      toast.error('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">General Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Library Name</label>
          <Input name="libraryName" value={settings.libraryName} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Library Logo URL</label>
          <Input name="libraryLogoUrl" value={settings.libraryLogoUrl} onChange={handleChange} />
        </div>
        <div>
          <label className="block font-medium mb-1">Contact Email</label>
          <Input name="contactEmail" value={settings.contactEmail} onChange={handleChange} type="email" />
        </div>
        <div>
          <label className="block font-medium mb-1">Max Books Per User</label>
          <Input name="maxBooksPerUser" value={settings.maxBooksPerUser} onChange={handleChange} type="number" min={1} />
        </div>
        <div>
          <label className="block font-medium mb-1">Loan Duration (days)</label>
          <Input name="loanDurationDays" value={settings.loanDurationDays} onChange={handleChange} type="number" min={1} />
        </div>
        <div>
          <label className="block font-medium mb-1">Fine Per Day</label>
          <Input name="finePerDay" value={settings.finePerDay} onChange={handleChange} type="number" min={0} />
        </div>
        <div>
          <label className="block font-medium mb-1">Notification Email</label>
          <Input name="notificationEmail" value={settings.notificationEmail} onChange={handleChange} type="email" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </div>
      </form>
    </div>
  );
} 