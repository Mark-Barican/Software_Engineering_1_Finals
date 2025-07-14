import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { toast } from "sonner";
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, LogOut } from "lucide-react";

interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  ipAddress: string;
}

interface Session {
  sessionId: string;
  deviceInfo: DeviceInfo;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

export default function SessionManagement() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        toast.error("Failed to load sessions");
      }
    } catch (error) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
        toast.success("The session has been successfully revoked");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to revoke session");
      }
    } catch (error) {
      toast.error("Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllSessions = async () => {
    setRevoking("all");
    try {
      const response = await fetch("/api/sessions", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSessions(prev => prev.filter(session => session.isCurrent));
        toast.success("All other sessions have been revoked");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to revoke sessions");
      }
    } catch (error) {
      toast.error("Failed to revoke sessions");
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Sessions</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const otherSessions = sessions.filter(session => !session.isCurrent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Active Sessions</h2>
        {otherSessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <LogOut className="w-4 h-4 mr-2" />
                Revoke All Other Sessions
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke All Other Sessions</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign out all other devices except the current one. You'll need to sign in again on those devices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={revokeAllSessions}
                  disabled={revoking === "all"}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {revoking === "all" ? "Revoking..." : "Revoke All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.sessionId} className={session.isCurrent ? "border-orange-200 bg-orange-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.deviceInfo.device)}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {session.deviceInfo.browser} on {session.deviceInfo.os}
                      {session.isCurrent && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Current Session
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {session.deviceInfo.device} Device
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <LogOut className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will sign out this device. The user will need to sign in again on that device.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeSession(session.sessionId)}
                          disabled={revoking === session.sessionId}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {revoking === session.sessionId ? "Revoking..." : "Revoke"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">IP Address:</span>
                  <span className="font-mono">{session.deviceInfo.ipAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Last Activity:</span>
                  <span>{getTimeAgo(session.lastActivity)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Created:</span>
                  <span>{formatDate(session.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active sessions found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 