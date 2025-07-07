import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { Pencil } from "lucide-react";

export default function MyAccount() {
  const { user } = useAuth();

  // Placeholder data for demonstration
  const profile = {
    username: user?.name || "student@jdlcitech.ph",
    email: user?.email || "student@jdlcitech.ph",
    firstName: "Student",
    lastName: "Hi",
    country: "Not Specified",
    role: "Student",
    institution: "CIT - College of Arts and Technology",
    googleConnected: true,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-8">
      <div className="w-full max-w-4xl">
        {/* Back to account */}
        <div className="mb-4">
          <Link to="/" className="text-black flex items-center gap-2 hover:underline">
            <span className="text-lg">&#8592;</span> Back to account
          </Link>
        </div>
        {/* Logo */}
        <div className="flex justify-start mb-8">
          <img src="/logo.jpg" alt="Logo" className="h-20 w-20" />
        </div>
        {/* Profile Section */}
        <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
          <h1 className="text-2xl font-semibold mb-2">Profile</h1>
          <p className="mb-8 text-gray-700">Update your profile information so you can access the library easily at all times</p>

          {/* Account Information */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-2">Account Information</h2>
            <div className="mb-1">
              <span className="font-semibold">USER NAME</span><br />
              <span>{profile.username}</span>
            </div>
            <div className="text-gray-500 text-sm mb-2">
              This account is connected to your google account
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Personal Information</h2>
              <button className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">
                <Pencil size={16} /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <span className="font-semibold">CONTACT EMAIL</span><br />
                <span>{profile.email}</span>
              </div>
              <div></div>
              <div>
                <span className="font-semibold">FIRST NAME</span><br />
                <span>{profile.firstName}</span>
              </div>
              <div>
                <span className="font-semibold">LAST NAME</span><br />
                <span>{profile.lastName}</span>
              </div>
              <div>
                <span className="font-semibold">COUNTRY</span><br />
                <span>{profile.country}</span>
              </div>
            </div>
          </div>

          {/* Role and Institution */}
          <div className="mb-8">
            <div className="mb-2">
              <span className="font-semibold">ROLE</span><br />
              <span>{profile.role}</span>
            </div>
            <div>
              <span className="font-semibold">INSTITUTION OR UNIVERSITY</span><br />
              <span>{profile.institution}</span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="border-t pt-4 mt-4">
            <h2 className="font-bold mb-2">Terms & Conditions</h2>
            <p className="text-sm text-gray-600">
              You have agreed to the <a href="#" className="underline">Terms and Conditions of Use</a> and the <a href="#" className="underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 