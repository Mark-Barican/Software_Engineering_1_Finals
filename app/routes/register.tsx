import React from "react";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="relative w-full max-w-sm p-8 bg-white shadow-lg border border-gray-200">
        {/* Close button */}
        <button className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700" aria-label="Close" disabled>
          ×
        </button>
        <h1 className="text-2xl font-serif font-normal mb-6 text-center text-black">Register for free</h1>
        {/* Google button */}
        <button className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 mb-4 font-medium text-gray-700 hover:bg-gray-50" disabled>
          <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 29.8 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.5 20-21 0-1.3-.1-2.7-.3-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3 15.6 3 8.1 8.5 6.3 14.7z"/><path fill="#FBBC05" d="M24 45c5.8 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.8 36 26.1 37.5 24 37.5c-5.7 0-10.5-3.8-12.2-9.1l-7 5.4C8.1 39.5 15.6 45 24 45z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.7 8.5-11.7 8.5-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-8.4 0-15.9 5.5-18.7 13.1l7 5.1C15.5 16.1 19.4 13 24 13c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-8.4 0-15.9 5.5-18.7 13.1l7 5.1C15.5 16.1 19.4 13 24 13c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-8.4 0-15.9 5.5-18.7 13.1z"/></g></svg>
          Continue with Google
        </button>
        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="mx-2 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-700 text-gray-800"
              placeholder="Enter an email address"
            />
          </div>
          <button
            type="button"
            className="w-full py-2 px-4 bg-red-700 text-white font-semibold text-base border-none mt-2"
          >
            Create account
          </button>
        </form>
      </div>
    </div>
  );
} 