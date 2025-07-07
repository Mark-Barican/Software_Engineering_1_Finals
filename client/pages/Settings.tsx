import React from "react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 border border-brand-border-light">
        <h1 className="text-4xl font-inknut text-brand-orange mb-8 text-center">Settings</h1>
        <div className="space-y-10">
          {/* Profile Settings */}
          <section>
            <h2 className="text-2xl font-abhaya text-black mb-4">Profile Settings</h2>
            <p className="text-brand-text-secondary font-actor mb-2">Update your personal information and email address.</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">(Profile settings form coming soon)</div>
          </section>

          {/* Notification Preferences */}
          <section>
            <h2 className="text-2xl font-abhaya text-black mb-4">Notification Preferences</h2>
            <p className="text-brand-text-secondary font-actor mb-2">Choose how you want to receive updates about your library account.</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">(Notification preferences coming soon)</div>
          </section>

          {/* Library Preferences */}
          <section>
            <h2 className="text-2xl font-abhaya text-black mb-4">Library Preferences</h2>
            <p className="text-brand-text-secondary font-actor mb-2">Set your default search filters and display options for the library system.</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">(Library preferences coming soon)</div>
          </section>

          {/* Account Management */}
          <section>
            <h2 className="text-2xl font-abhaya text-black mb-4">Account Management</h2>
            <p className="text-brand-text-secondary font-actor mb-2">Manage your account, change your password, or delete your account.</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">(Account management options coming soon)</div>
          </section>
        </div>
      </div>
    </div>
  );
} 