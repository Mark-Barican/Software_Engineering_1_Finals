import React from "react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="relative bg-white p-8 pt-10 rounded-none shadow-lg w-full max-w-sm flex flex-col items-center">
        {/* Close Icon */}
        <button className="absolute top-4 right-4 text-2xl text-black hover:text-gray-700" aria-label="Close">
          &times;
        </button>
        <h1 className="text-3xl font-serif font-normal mb-8 text-center text-black">Login now</h1>
        {/* Google Button */}
        <button className="flex items-center justify-center w-full border border-gray-300 py-2 mb-6 text-gray-800 font-semibold text-base gap-2">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
        {/* Divider */}
        <div className="flex items-center w-full mb-6">
          <hr className="flex-1 border-gray-300" />
          <span className="mx-3 text-gray-500 text-sm">or</span>
          <hr className="flex-1 border-gray-300" />
        </div>
        {/* Email Field */}
        <div className="w-full mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Email Address <span className="text-red-600">*</span>
          </label>
          <input type="email" placeholder="Enter an email address" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none" />
        </div>
        {/* Password Field */}
        <div className="w-full mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Password <span className="text-red-600">*</span>
          </label>
          <input type="password" placeholder="Enter your password" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none" />
        </div>
        {/* Checkbox */}
        <div className="w-full mb-6 flex items-center">
          <input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />
        </div>
        {/* Log in Button */}
        <button className="w-full bg-red-700 text-white py-2 text-base font-semibold rounded-none">Log in</button>
      </div>
    </div>
  );
} 