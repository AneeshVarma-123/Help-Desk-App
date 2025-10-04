import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, AlertCircle, Plus, Send, LogOut, LogIn } from 'lucide-react';

const API_URL = 'https://helpdesk-backend.onrender.com/api';

const HelpDeskApp = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tickets, setTickets] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Auth form states
  const [showAuthForm, setShowAuthForm] = useState(!token);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'Medium'
  });

  // Fetch user data on mount
  useEffect(() => {
    if (token) {
      fetchUser();
      fetchTickets();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/user`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setShowAuthForm(false);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to fetch user data');
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tickets`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
      setLoading(false);
    }
  };

  const fetchTicketById = async (id) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${id}`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Failed to load ticket details');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuthForm(false);
        fetchTickets();
      } else {
        setError(data.msg || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Server error. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTickets([]);
    setSelectedTicket(null);
    setShowAuthForm(true);
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(newTicket)
      });

      const data = await res.json();

      if (res.ok) {
        setTickets([data, ...tickets]);
        setNewTicket({ title: '', description: '', priority: 'Medium' });
        setShowCreateForm(false);
        setError('');
      } else {
        setError(data.msg || 'Failed to create ticket');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket');
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (res.ok) {
        setTickets(tickets.map(t => t._id === ticketId ? data : t));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(data);
        }
      } else {
        setError(data.msg || 'Failed to update ticket');
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket');
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    try {
      const res = await fetch(`${API_URL}/tickets/${selectedTicket._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ text: newComment })
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedTicket(data);
        setTickets(tickets.map(t => t._id === data._id ? data : t));
        setNewComment('');
        setError('');
      } else {
        setError(data.msg || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const getSLAStatus = (ticket) => {
    const now = new Date();
    const deadline = new Date(ticket.slaDeadline);
    const timeLeft = deadline - now;
    const hoursLeft = timeLeft / (1000 * 60 * 60);
    
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return { status: 'Met', color: 'text-green-600', bg: 'bg-green-50' };
    }
    if (hoursLeft < 0) {
      return { status: 'Breached', color: 'text-red-600', bg: 'bg-red-50' };
    }
    if (hoursLeft < 1) {
      return { status: 'Critical', color: 'text-orange-600', bg: 'bg-orange-50' };
    }
    return { status: 'On Track', color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const formatTimeLeft = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff < 0) {
      return `Overdue by ${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-100 text-blue-700',
      'In Progress': 'bg-yellow-100 text-yellow-700',
      Resolved: 'bg-green-100 text-green-700',
      Closed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: 'bg-red-100 text-red-700',
      High: 'bg-orange-100 text-orange-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Low: 'bg-green-100 text-green-700'
    };
    return colors[priority];
  };

  // Auth Form
  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2">Help Desk</h1>
          <p className="text-gray-600 text-center mb-6">
            {isLogin ? 'Login to your account' : 'Create a new account'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg mb-3"
                required
              />
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg mb-3"
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg mb-3"
              required
            />

            {!isLogin && (
              <select
                value={authForm.role}
                onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg mb-4"
              >
                <option value="customer">Customer</option>
                <option value="agent">Agent</option>
              </select>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Help Desk</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold text-lg">Tickets</h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                </button>
              </div>

              {showCreateForm && (
                <div className="p-4 border-b bg-gray-50">
                  <input
                    type="text"
                    placeholder="Ticket Title"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  />
                  <textarea
                    placeholder="Description"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    rows="3"
                  />
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                  <button
                    onClick={createTicket}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Ticket
                  </button>
                </div>
              )}

              <div className="divide-y max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : tickets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No tickets yet</div>
                ) : (
                  tickets.map(ticket => {
                    const sla = getSLAStatus(ticket);
                    return (
                      <div
                        key={ticket._id}
                        onClick={() => fetchTicketById(ticket._id)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedTicket?._id === ticket._id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-sm">{ticket.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${sla.bg} ${sla.color}`}>
                            {sla.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{formatTimeLeft(ticket.slaDeadline)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedTicket.title}</h2>
                      <p className="text-gray-600">{selectedTicket.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Created by: {selectedTicket.createdBy?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <span className={`px-3 py-1 rounded ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority} Priority
                    </span>
                    <span className={`px-3 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  {/* SLA Info */}
                  <div className={`p-4 rounded-lg ${getSLAStatus(selectedTicket).bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={getSLAStatus(selectedTicket).color} size={20} />
                      <span className={`font-semibold ${getSLAStatus(selectedTicket).color}`}>
                        SLA: {getSLAStatus(selectedTicket).status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {formatTimeLeft(selectedTicket.slaDeadline)}
                    </p>
                  </div>

                  {/* Status Actions */}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateTicketStatus(selectedTicket._id, 'In Progress')}
                      className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateTicketStatus(selectedTicket._id, 'Resolved')}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => updateTicketStatus(selectedTicket._id, 'Closed')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <MessageSquare size={20} />
                    Comments ({selectedTicket.comments?.length || 0})
                  </h3>

                  <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                    {selectedTicket.comments?.map(comment => (
                      <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-sm">
                            {comment.user?.name || comment.userName || 'User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addComment()}
                      className="flex-1 px-4 py-2 border rounded-lg"
                    />
                    <button
                      onClick={addComment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Send size={16} />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDeskApp;