"use client";
import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [page, setPage] = useState<'login' | 'register' | 'hotels' | 'favorites' | 'messages'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [favorite, setFavorite] = useState<{ hotels: string[] }>({ hotels: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [role, setRole] = useState('user');
  const [operatorCode, setOperatorCode] = useState('');

  // Add state for editing hotel
  const [editingHotel, setEditingHotel] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Message state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageHotelId, setMessageHotelId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});

  // Helper: check if user is operator (simple demo, you may want to decode JWT in real app)
  const isOperator = () => {
    // For demo, store role in localStorage after login/register
    return localStorage.getItem('role') === 'operator';
  };

  // Edit hotel handlers
  const startEditHotel = (hotel: any) => {
    setEditingHotel(hotel);
    setEditForm({
      name: hotel.name,
      address: hotel.address,
      price: hotel.price,
      rating: hotel.rating,
      availability: hotel.availability,
      roomsAvailable: hotel.roomsAvailable,
    });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setEditForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value,
    }));
  };

  const submitEditHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3001/hotels/${editingHotel._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update hotel");
      // Update hotel in list
      setHotels(hotels => hotels.map(h => h._id === editingHotel._id ? { ...h, ...editForm } : h));
      setEditingHotel(null);
    } catch (err: any) {
      setError(err.message || "Error updating hotel");
    } finally {
      setLoading(false);
    }
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!messageHotelId || !messageText) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hotelId: messageHotelId, message: messageText }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setShowMessageModal(false);
      setMessageText("");
      setMessageHotelId(null);
    } catch (err: any) {
      setError(err.message || "Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Operator reply handler
  const handleReply = async (msgId: string) => {
    if (!replyText[msgId]) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3001/messages/${msgId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response: replyText[msgId] }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      setMessages(msgs => msgs.map(m => m._id === msgId ? { ...m, operatorResponse: replyText[msgId] } : m));
      setReplyText(rt => ({ ...rt, [msgId]: "" }));
    } catch (err: any) {
      setError(err.message || "Error replying to message");
    } finally {
      setLoading(false);
    }
  };

  // Operator delete handler
  const handleDeleteMessage = async (msgId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3001/messages/${msgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete message");
      setMessages(msgs => msgs.filter(m => m._id !== msgId));
    } catch (err: any) {
      setError(err.message || "Error deleting message");
    } finally {
      setLoading(false);
    }
  };

  // On mount, check for token and role
  useEffect(() => {
    const t = localStorage.getItem("token");
    const r = localStorage.getItem("role") || "user";
    setRole(r);
    if (t) {
      setToken(t);
      setPage('hotels');
    }
  }, []);

  // Fetch hotels
  useEffect(() => {
    if (page === 'hotels' && token) {
      setLoading(true);
      fetch("http://localhost:3001/hotels", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setHotels(data))
        .catch(() => setError("Failed to fetch hotels"))
        .finally(() => setLoading(false));
    }
  }, [page, token]);

  // Fetch favorites
  useEffect(() => {
    if (page === 'favorites' && token) {
      setLoading(true);
      fetch("http://localhost:3001/favorites/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setFavorite(data.favorite))
        .catch(() => setError("Failed to fetch favorites"))
        .finally(() => setLoading(false));
    }
  }, [page, token]);

  // Fetch messages for user or operator
  useEffect(() => {
    if (page === 'messages' && token) {
      const url = isOperator()
        ? 'http://localhost:3001/messages/operator'
        : 'http://localhost:3001/messages/user';
      setLoading(true);
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setMessages(data.messages || []))
        .catch(() => setError("Failed to fetch messages"))
        .finally(() => setLoading(false));
    }
  }, [page, token]);

  // Fetch favorites on mount and when hotels page is shown
  useEffect(() => {
    if ((page === 'hotels' || page === 'favorites') && token) {
      setLoading(true);
      fetch("http://localhost:3001/favorites/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setFavorite(data.favorite))
        .catch(() => setError("Failed to fetch favorites"))
        .finally(() => setLoading(false));
    }
  }, [page, token]);

  // SPA navigation helpers
  const goTo = (p: typeof page) => {
    setError("");
    setPage(p);
  };

  // Login logic
  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        if (data.role) {
          localStorage.setItem("role", data.role);
          setRole(data.role);
        } else {
          localStorage.setItem("role", "user");
          setRole("user");
        }
        setToken(data.token);
        setPage('hotels');
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Register logic
  const handleRegister = async (form: any) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 201) {
        // Save role to localStorage so it is available after login
        if (form.role) {
          localStorage.setItem("role", form.role);
          setRole(form.role);
        } else {
          localStorage.setItem("role", "user");
          setRole("user");
        }
        setPage('login');
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole("user");
    setPage('login');
  };

  // Profile image upload
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      setProfileImage(base64Image);
      await fetch("http://localhost:3001/auth/upload-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ base64Image }),
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove favorite
  const handleRemoveFavorite = async (hotelId: string) => {
    setLoading(true);
    try {
      await fetch("http://localhost:3001/favorites/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hotelId }),
      });
      setFavorite(fav => fav ? { ...fav, hotels: fav.hotels.filter(id => id !== hotelId) } : fav);
    } catch {
      setError("Error removing favorite");
    } finally {
      setLoading(false);
    }
  };

  // Render
  if (page === 'login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <form
          onSubmit={e => { e.preventDefault(); handleLogin((e.target as any).username.value, (e.target as any).password.value); }}
          className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-8 w-full max-w-sm flex flex-col gap-6 border border-gray-200 dark:border-neutral-800"
        >
          <h2 className="text-2xl font-bold text-center mb-2">Sign in</h2>
          <p className="text-center text-sm mb-2 text-gray-600 dark:text-gray-300">
            Don&apos;t have an account?{' '}
            <button type="button" className="text-blue-600 hover:underline" onClick={() => goTo('register')}>Register</button>
          </p>
          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <input id="username" name="username" type="text" className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    );
  }

  if (page === 'register') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <form
          onSubmit={e => {
            e.preventDefault();
            const form: any = {
              username: (e.target as any).username.value,
              email: (e.target as any).email.value,
              password: (e.target as any).password.value,
              role,
              ...(role === 'operator' ? { operatorCode } : {}),
            };
            handleRegister(form);
          }}
          className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-8 w-full max-w-sm flex flex-col gap-6 border border-gray-200 dark:border-neutral-800"
        >
          <h2 className="text-2xl font-bold text-center mb-2">Register</h2>
          <p className="text-center text-sm mb-2 text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <button type="button" className="text-blue-600 hover:underline" onClick={() => goTo('login')}>Sign in</button>
          </p>
          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <input id="username" name="username" type="text" className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-sm font-medium">Role</label>
            <select id="role" name="role" value={role} onChange={e => setRole(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="user">User</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          {role === 'operator' && (
            <div className="flex flex-col gap-2">
              <label htmlFor="operatorCode" className="text-sm font-medium">Operator Code</label>
              <input id="operatorCode" name="operatorCode" type="text" value={operatorCode} onChange={e => setOperatorCode(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          )}
          <button type="submit" className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
        </form>
      </div>
    );
  }

  if (page === 'hotels') {
    const filteredHotels = hotels.filter(hotel =>
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.address.toLowerCase().includes(search.toLowerCase())
    );
    // Helper: check if hotel is in favorites
    const isFavorite = (hotelId: string) => favorite?.hotels.includes(hotelId);
    // Add/Remove favorite handlers
    const handleToggleFavorite = async (hotelId: string) => {
      if (!token) return;
      setError("");
      // Optimistic update
      const wasFavorited = favorite.hotels.includes(hotelId);
      setFavorite(prev => ({ hotels: wasFavorited ? prev.hotels.filter(id => id !== hotelId) : [...prev.hotels, hotelId] }));
      try {
        const endpoint = wasFavorited ? '/favorites/remove' : '/favorites/add';
        const method = wasFavorited ? 'DELETE' : 'POST';
        const res = await fetch(`http://localhost:3001${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ hotelId }),
        });
        if (!res.ok) throw new Error('Failed to update favorite');
        // Re-fetch authoritative list
        const listRes = await fetch('http://localhost:3001/favorites/list', { headers: { Authorization: `Bearer ${token}` } });
        if (!listRes.ok) throw new Error('Failed to fetch favorites');
        const { favorite: fresh } = await listRes.json();
        setFavorite(fresh);
      } catch (err: any) {
        // Revert on error
        setFavorite(prev => ({ hotels: wasFavorited ? [...prev.hotels, hotelId] : prev.hotels.filter(id => id !== hotelId) }));
        setError(err.message || 'Error updating favorites');
      }
    };
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">Hotels</h1>
          </div>
          <div className="relative">
            <button
              className="w-10 h-10 rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center focus:outline-none"
              onClick={() => setShowProfileMenu(v => !v)}
              aria-label="User menu"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-10">
                <div className="flex flex-col p-4 gap-2">
                  <div className="text-xs text-gray-500 mb-2">Role: {localStorage.getItem('role') || 'user'}</div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <span>Update profile image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                  </label>
                  <button className="text-left text-blue-600 hover:underline text-sm" onClick={() => { goTo('favorites'); setShowProfileMenu(false); }}>Manage favorite list</button>
                  <button className="text-left text-blue-600 hover:underline text-sm" onClick={() => { setPage('messages'); setShowProfileMenu(false); }}>Messages</button>
                  <button className="text-left text-red-600 hover:underline text-sm" onClick={handleLogout}>Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder="Search hotels by name or address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-3xl mx-auto mb-6 px-4 py-2 rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 block"
        />
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center text-gray-500">Loading hotels...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center text-gray-500">No hotels found.</div>
          ) : (
            <div className="grid gap-6">
              {filteredHotels.map(hotel => (
                <div key={hotel._id} className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6 border border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-4 relative">
                  {editingHotel && editingHotel._id === hotel._id ? (
                    <form onSubmit={submitEditHotel} className="flex-1 flex flex-col gap-2">
                      <input name="name" value={editForm.name} onChange={handleEditFormChange} className="px-2 py-1 rounded border" required />
                      <input name="address" value={editForm.address} onChange={handleEditFormChange} className="px-2 py-1 rounded border" required />
                      <input name="price" type="number" value={editForm.price} onChange={handleEditFormChange} className="px-2 py-1 rounded border" required />
                      <input name="rating" type="number" step="0.1" value={editForm.rating} onChange={handleEditFormChange} className="px-2 py-1 rounded border" required />
                      <input name="roomsAvailable" type="number" value={editForm.roomsAvailable} onChange={handleEditFormChange} className="px-2 py-1 rounded border" required />
                      <label className="flex items-center gap-2">
                        <input name="availability" type="checkbox" checked={editForm.availability} onChange={handleEditFormChange} />
                        Available
                      </label>
                      <div className="flex gap-2 mt-2">
                        <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white">Save</button>
                        <button type="button" className="px-4 py-1 rounded bg-gray-300" onClick={() => setEditingHotel(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
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
                  )}
                  {!(editingHotel && editingHotel._id === hotel._id) && (
                    <div className="mt-4 flex flex-col gap-2">
                      {/* User actions: message and favorite */}
                      {!isOperator() && token && (
                        <>
                          <button
                            onClick={() => { setShowMessageModal(true); setMessageHotelId(hotel._id); }}
                            className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs shadow"
                            type="button"
                          >
                            Message
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(hotel._id)}
                            className="px-2 py-1 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold text-xs shadow"
                            type="button"
                          >
                            {isFavorite(hotel._id) ? '★ Favorite' : '☆ Favorite'}
                          </button>
                        </>
                      )}
                      {/* Operator action: edit */}
                      {isOperator() && token && (
                        <button
                          onClick={() => startEditHotel(hotel)}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow"
                          type="button"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {showMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Send Message to Operator</h3>
              <textarea
                className="w-full p-2 rounded border border-gray-300 dark:border-neutral-700 mb-4 bg-gray-100 dark:bg-neutral-800"
                rows={4}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Type your message..."
              />
              <div className="flex gap-2 justify-end">
                <button className="px-4 py-1 rounded bg-gray-300" onClick={() => setShowMessageModal(false)}>Cancel</button>
                <button className="px-4 py-1 rounded bg-blue-600 text-white" onClick={handleSendMessage} disabled={loading || !messageText}>{loading ? "Sending..." : "Send"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (page === 'favorites') {
    const favoriteHotels = hotels.filter(h => favorite?.hotels.includes(h._id));
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">My Favorite Hotels</h1>
            <button className="text-blue-600 hover:underline text-sm" onClick={() => goTo('hotels')}>Back to Hotels</button>
          </div>
          {loading ? (
            <div className="text-center text-gray-500">Loading favorites...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : !favoriteHotels.length ? (
            <div className="text-center text-gray-500">No favorite hotels found.</div>
          ) : (
            <div className="grid gap-6">
              {favoriteHotels.map(hotel => (
                <div key={hotel._id} className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6 border border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-4">
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
                  <button className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-sm" onClick={() => handleRemoveFavorite(hotel._id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (page === 'messages') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{isOperator() ? 'Operator' : 'My'} Messages</h1>
            <button className="text-blue-600 hover:underline text-sm" onClick={() => goTo('hotels')}>Back to Hotels</button>
          </div>
          {loading ? (
            <div className="text-center text-gray-500">Loading messages...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : !messages.length ? (
            <div className="text-center text-gray-500">No messages found.</div>
          ) : (
            <div className="grid gap-6">
              {messages.map(msg => {
                let hotelDisplay = "";
                if (msg.hotel && typeof msg.hotel === 'object') {
                  hotelDisplay = msg.hotel.name || msg.hotel._id || '[object]';
                } else if (typeof msg.hotel === 'string') {
                  hotelDisplay = msg.hotel;
                }
                let userDisplay = "";
                if (msg.user && typeof msg.user === 'object') {
                  userDisplay = msg.user.username || msg.user._id || '[object]';
                } else if (typeof msg.user === 'string') {
                  userDisplay = msg.user;
                }
                return (
                  <div key={msg._id} className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6 border border-gray-200 dark:border-neutral-800 flex flex-col gap-2 relative">
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><span className="font-semibold">Hotel:</span> {hotelDisplay}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><span className="font-semibold">User:</span> {userDisplay}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><span className="font-semibold">Message:</span> {msg.userMessage}</div>
                    {msg.operatorResponse && (
                      <div className="text-sm text-green-700 dark:text-green-400 mb-1"><span className="font-semibold">Operator Response:</span> {msg.operatorResponse}</div>
                    )}
                    {isOperator() && !msg.operatorResponse && (
                      <div className="flex gap-2 mt-2">
                        <input
                          className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-neutral-700"
                          placeholder="Type reply..."
                          value={replyText[msg._id] || ""}
                          onChange={e => setReplyText(rt => ({ ...rt, [msg._id]: e.target.value }))}
                        />
                        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => handleReply(msg._id)} disabled={loading || !(replyText[msg._id] && replyText[msg._id].trim())}>Reply</button>
                      </div>
                    )}
                    {isOperator() && (
                      <button className="absolute right-4 top-4 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow" onClick={() => handleDeleteMessage(msg._id)} disabled={loading}>Delete</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
