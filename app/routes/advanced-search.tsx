import React from "react";
import { Link } from "react-router-dom";

export default function AdvancedSearch() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full bg-gray-50 border-b border-gray-200 text-center text-sm py-2 flex justify-center items-center text-gray-800">
        <span>New library access? <a href="/login" className="underline text-blue-700">Log in</a></span>
      </div>
      <header className="flex items-center justify-between px-8 py-3 bg-white">
        <div className="flex items-center gap-2 -ml-8">
          <img src="/logo.jpg" alt="Logo" className="h-14" />
        </div>
        <div className="flex items-center gap-2">
          <a href="/register" className="border border-gray-700 rounded px-3 py-1 text-gray-700 hover:bg-gray-100 transition">Register</a>
          <a href="/login" className="px-3 py-1 bg-red-700 text-white rounded">Log in</a>
          <a href="#" aria-label="FAQs or About Us" className="ml-4 flex items-center justify-center w-8 h-8 border border-gray-400 rounded-full text-gray-700 hover:bg-gray-100 transition text-xl font-bold">?</a>
        </div>
      </header>
      <div className="flex justify-end px-8 pb-1 text-sm gap-6">
        <a href="#" className="hover:underline">Browse</a>
        <a href="#" className="hover:underline">Saved Books</a>
      </div>

      {/* Main Content */}
      <main className="max-w-xl mx-auto pt-10 pb-24 font-sans relative">
        {/* Back Arrow Button */}
        <Link to="/" className="absolute -left-12 top-2 p-2 focus:outline-none" aria-label="Back to Home">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="black" className="w-7 h-7 transition-transform duration-200 ease-in-out hover:scale-125">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-serif font-normal mb-0.5 text-black leading-tight">Advanced Search</h1>
        <div className="text-base text-gray-700 mb-6 font-sans">All Content</div>
        <hr className="mb-10 border-gray-300" />

        {/* Construct your search query */}
        <section className="mb-14">
          <h2 className="text-lg font-serif font-semibold mb-2 text-gray-900">Construct your search query</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-base mb-1.5 text-gray-900 font-sans text-left">TITLE</label>
              <input type="text" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base" />
            </div>
            <div>
              <label className="block text-base mb-1.5 text-gray-900 font-sans text-left">AUTHOR</label>
              <input type="text" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base" />
            </div>
            <div>
              <label className="block text-base mb-1.5 text-gray-900 font-sans text-left">GENRE</label>
              <select className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base">
                <option>All fields</option>
              </select>
            </div>
            <button type="submit" className="mt-3 px-5 py-2 bg-red-700 text-white text-base font-semibold border-none shadow-sm">Submit Advanced Search</button>
          </form>
        </section>

        {/* Narrow Results */}
        <section className="mb-14">
          <div className="text-lg font-serif font-semibold mb-2 text-gray-900">Narrow results</div>
          <hr className="mb-10 border-gray-300" />
          <div className="flex flex-wrap gap-12 mb-6">
            <div>
              <div className="mb-2 font-semibold text-base font-sans text-left text-gray-900">ITEM TYPE</div>
              <div className="flex flex-col gap-2 text-base font-sans">
                <label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Articles</label>
                <label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Reviews</label>
                <label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Books</label>
              </div>
            </div>
            <div>
              <div className="mb-2 font-semibold text-base font-sans">&nbsp;</div>
              <div className="flex flex-col gap-2 text-base font-sans">
                <label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Research Reports</label>
                <label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Miscellaneous</label>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-base mb-1.5 text-gray-900 font-sans text-left">LANGUAGE</label>
            <select className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base">
              <option>All Languages</option>
            </select>
          </div>
          <div className="flex gap-6 mb-6">
            <div className="flex-1">
              <label className="block text-base mb-1.5 text-gray-900 font-sans text-left">PUBLICATION DATE</label>
              <div className="flex gap-2">
                <input type="text" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base" placeholder="FROM" />
                <input type="text" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base" placeholder="TO" />
              </div>
              <input type="text" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base mt-2" placeholder="(yyyy or yyyy-mm or yyyy-mm-dd)" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-base mb-1.5 text-gray-900 font-sans text-left">JOURNAL OR BOOK TITLE</label>
            <input type="text" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base" />
          </div>
          <div className="mb-6">
            <label className="block text-base mb-1.5 text-gray-900 font-sans text-left">ISBN</label>
            <input type="text" className="w-full border border-gray-400 px-3 py-2 text-gray-900 outline-none text-base" />
          </div>
        </section>
        <hr className="mb-10 border-gray-300" />
        {/* Advanced Filter */}
        <section>
          <h2 className="text-lg font-serif font-semibold mb-2 text-gray-900">Advanced Filter</h2>
          <div className="text-base text-gray-700 mb-2 font-sans">Narrow by discipline and/or journal</div>
          <hr className="mb-4 border-gray-300" />
          <div className="text-base font-sans ml-4">
            <div className="mb-2 font-sans text-left text-gray-900">Return results for:</div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Crime (129 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Romance (68 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Fantasy (13 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Action (10 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Mystery (87 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Comedy (91 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Horror (15 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Poetry (115 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Drama (47 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Historical (173 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Children (141 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Young Adult (117 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Philosophical (17 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Science (156 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Religious (86 titles)</label></div>
            <div className="mb-2"><label className="text-gray-900 flex items-center gap-2"><input type="checkbox" className="mr-2 w-4 h-4 border border-gray-400 bg-white appearance-none checked:bg-red-700 checked:border-red-700 focus:ring-2 focus:ring-red-200 transition" />Graphic Novel (10 titles)</label></div>
          </div>
        </section>
      </main>
    </div>
  );
} 