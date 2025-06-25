import { Link } from "react-router-dom";
import React, { useRef } from "react";

const bookshelfImg = "/bookshelf-banner.jpg";

const featuredBooks = [
  { title: "Moby Dick", cover: "https://image.yes24.com/goods/97447880/XL" },
  { title: "The War of the Worlds", cover: "https://s2982.pcdn.co/wp-content/uploads/2013/06/war-of-the-worlds-cover-by-kjell-roger-ringstad-686x1024.jpg.webp" },
  { title: "Alice's Adventures in Wonderland", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1658589705i/61665436.jpg" },
  { title: "The Great Gatsby", cover: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781471173936/the-great-gatsby-9781471173936_lg.jpg" },
];

const newArrivals = [
  { title: "Sunrise on the Reaping", author: "Suzanne Collins", cover: "https://m.media-amazon.com/images/I/71mC7kMhg6L._SL1500_.jpg" },
  { title: "Intermezzo", author: "Sally Rooney", cover: "https://cdn.kqed.org/wp-content/uploads/sites/2/2024/09/intermezzo.jpeg" },
  { title: "Main Street Millionaire", author: "Cody Sanchez", cover: "https://img1.od-cdn.com/ImageType-100/1191-1/%7BB6156C97-4473-4326-AABF-2DB46F211EAF%7DIMG100.JPG" },
  { title: "The Emperor of Gladness", author: "Ocean Vuong", cover: "https://th.bing.com/th/id/OIP.mzDv3x4ijoIwVDHluhc77wHaLM?rs=1&pid=ImgDetMain&cb=idpwebp2&o=7&rm=3" },
  { title: "Never Flinch", author: "Stephen King", cover: "https://ew.com/thmb/D1eg-HdorVQ877I1ShOLgbysrdI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Stephen-King-Never-Flinch-111324-2-3c4840fda35048dfa4df66633f8e01f2.jpg" },
];

export function meta() {
  return [
    { title: "Library" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;
    const scrollAmount = 220; // width of one book + gap
    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="w-full bg-gray-50 border-b border-gray-200 text-center text-sm py-2 flex justify-center items-center text-gray-800">
        <span>New library access? <Link to="/login" className="underline text-blue-700">Log in</Link></span>
      </div>
      {/* Main Header */}
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
      {/* Sub-header Links */}
      <div className="flex justify-end px-8 pb-1 text-sm gap-6">
        <Link to="#" className="hover:underline">Browse</Link>
        <Link to="#" className="hover:underline">Saved Books</Link>
      </div>

      {/* Main Search Section */}
      <section className="bg-white px-8 pt-8 pb-4 flex flex-col items-center border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-serif font-normal mb-4 text-center text-black">Discover a world, organized for your ease.</h1>
        <hr className="mb-6 border-gray-300" />
        <div className="w-full max-w-2xl mx-auto relative">
          {/* Advanced Search link */}
          <Link to="/advanced-search" className="absolute right-0 top-0 text-sm text-gray-700 underline z-10">Advanced Search</Link>
          {/* Dropdown */}
          <select
            className="border-t border-l border-r border-gray-900 bg-white px-4 py-2 text-gray-900 outline-none w-40 mb-0"
            style={{ borderBottom: 'none', borderRadius: 0 }}
          >
            <option>All Content</option>
          </select>
          {/* Input with search button */}
          <form className="relative w-full" onSubmit={e => e.preventDefault()}>
            <input
              type="text"
              placeholder="Search through a collection of written works"
              className="w-full px-4 py-2 border border-gray-900 text-gray-900 outline-none pr-10"
              style={{ borderRadius: 0 }}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 p-0 m-0 bg-transparent border-none focus:outline-none" aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* Bookshelf Banner */}
      <div className="w-full" style={{ height: 324, backgroundImage: `url('${bookshelfImg}')`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />

      {/* Featured Books and Message */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-6 px-8 py-12 bg-white mx-auto">
        <div
          className="relative flex flex-col items-center md:items-end justify-center min-w-[240px]"
          style={{ height: 500, width: 500, marginRight: "24px" }}
        >
          {/* Diamond/Cross formation, no overlap */}
          {/* Top center */}
          <img
            src={featuredBooks[1].cover}
            alt={featuredBooks[1].title}
            className="w-40 h-60 object-cover shadow-md absolute transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer"
            style={{
              top: 0,
              left: 180,
              zIndex: 3,
            }}
          />
          {/* Left */}
          <img
            src={featuredBooks[0].cover}
            alt={featuredBooks[0].title}
            className="w-40 h-60 object-cover shadow-md absolute transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer"
            style={{
              top: 140,
              left: 0,
              zIndex: 2,
            }}
          />
          {/* Right */}
          <img
            src={featuredBooks[3].cover}
            alt={featuredBooks[3].title}
            className="w-40 h-60 object-cover shadow-md absolute transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer"
            style={{
              top: 140,
              left: 360,
              zIndex: 2,
            }}
          />
          {/* Bottom center */}
          <img
            src={featuredBooks[2].cover}
            alt={featuredBooks[2].title}
            className="w-40 h-60 object-cover shadow-md absolute transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer"
            style={{
              top: 280,
              left: 180,
              zIndex: 1,
            }}
          />
          <div style={{ height: 420 }} />
        </div>
        <div className="max-w-md text-center md:text-left p-6 flex flex-col justify-center items-center md:items-start">
          <h2 className="text-xl font-serif font-normal mb-2">Books take you to a different world</h2>
          <p className="text-gray-700 mb-4">All books are rich in story and knowledge and here, you are yet to discover thousands of these stories.</p>
          <button className="px-4 py-2 border border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white transition">Browse Catalog</button>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="px-8 pb-12 mt-16 flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4 text-gray-800">New Arrivals</h2>
        <div className="relative w-full max-w-5xl flex items-center justify-center">
          {/* Left Arrow */}
          <button
            onClick={() => scrollCarousel("left")}
            className="absolute left-0 z-10 p-2 disabled:opacity-30 bg-transparent border-none focus:outline-none"
            style={{ top: "50%", transform: "translateY(-50%)" }}
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="black" className="w-6 h-6 transition-transform duration-200 ease-in-out hover:scale-125">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          {/* Carousel */}
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto pb-2 px-10 scroll-smooth no-scrollbar w-full"
            style={{ scrollBehavior: "smooth" }}
          >
            {newArrivals.map((book, idx) => (
              <div key={idx} className="flex flex-col items-center min-w-[160px]">
                <img src={book.cover} alt={book.title} className="w-40 h-60 object-cover rounded mb-2 transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer" />
                <span className="font-semibold text-gray-800 text-center text-sm">{book.title}</span>
                <span className="text-gray-600 text-xs text-center">{book.author}</span>
              </div>
            ))}
          </div>
          {/* Right Arrow */}
          <button
            onClick={() => scrollCarousel("right")}
            className="absolute right-0 z-10 p-2 disabled:opacity-30 bg-transparent border-none focus:outline-none"
            style={{ top: "50%", transform: "translateY(-50%)" }}
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="black" className="w-6 h-6 transition-transform duration-200 ease-in-out hover:scale-125">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}
