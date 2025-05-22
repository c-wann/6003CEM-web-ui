"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Hotel {
  _id: string;
  name: string;
  address: string;
  price: number;
  rating: number;
  availability: boolean;
  roomsAvailable: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function FavoritesPage() {
  const [favorite, setFavorite] = useState<{ hotels: string[] } | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Fetch user's favorite hotel IDs
  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/favorites/list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch favorites");
        const data = await res.json();
        setFavorite(data.favorite);
      } catch (err: any) {
        setError(err.message || "Error loading favorites");
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  // Fetch all hotels and filter by favorite IDs
  useEffect(() => {
    if (!favorite || !favorite.hotels.length) return;
    const fetchHotels = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/hotels", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch hotels");
        const data = await res.json();
        setHotels(data.filter((h: Hotel) => favorite.hotels.includes(h._id)));
      } catch (err: any) {
        setError(err.message || "Error loading hotels");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [favorite]);

  const handleRemove = async (hotelId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/favorites/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hotelId }),
      });
      if (!res.ok) throw new Error("Failed to remove favorite");
      setHotels(hotels.filter(h => h._id !== hotelId));
    } catch (err: any) {
      setError(err.message || "Error removing favorite");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Favorite Hotels</h1>
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => router.push("/")}
          >
            Back to Hotels
          </button>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading favorites...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : !hotels.length ? (
          <div className="text-center text-gray-500">No favorite hotels found.</div>
        ) : (
          <div className="grid gap-6">
            {hotels.map(hotel => (
              <div
                key={hotel._id}
                className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6 border border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">{hotel.name}</h2>
                  <div className="text-gray-600 dark:text-gray-300 text-sm mb-1">{hotel.address}</div>
                  <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <span>Price: <span className="font-medium">${hotel.price}</span></span>
                    <span>Rating: <span className="font-medium">{hotel.rating}</span></span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-200">
                    <span>Rooms: <span className="font-medium">{hotel.roomsAvailable}</span></span>
                    <span>Status: <span className={hotel.availability ? "text-green-600" : "text-red-600"}>{hotel.availability ? "Available" : "Unavailable"}</span></span>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm"
                  onClick={() => handleRemove(hotel._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
