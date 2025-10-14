import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import logo from './assets/logo.png';
import './App.css';

// Import Shadcn components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Set up axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';

const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { phone, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name}!`);
      return true;
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials. Please check your phone number and password.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous errors
    
    const success = await login(phone, password);
    if (!success) {
      setError('Invalid credentials. Please check your phone number and password.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src={logo} alt="KHPL" className="mx-auto h-28 sm:h-36 w-auto" />
          <p className="text-sm sm:text-base text-gray-600 mt-3">Sign in to your account</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Welcome Back</CardTitle>
            <CardDescription className="text-sm sm:text-base">Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  data-testid="login-phone-input"
                  className={error ? "border-red-300 focus:border-red-500" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="login-password-input"
                  className={error ? "border-red-300 focus:border-red-500" : ""}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
                data-testid="login-submit-button"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RegisterFromInvitation = () => {
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    aadhaar_id: ''
  });
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');
    if (inviteToken) {
      setToken(inviteToken);
      fetchInvitationDetails(inviteToken);
    }
  }, []);

  const fetchInvitationDetails = async (inviteToken) => {
    try {
      const response = await axios.get(`${API}/invitation/${inviteToken}`);
      setInvitationDetails(response.data);
    } catch (error) {
      toast.error('Invalid or expired invitation link');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare registration data, handling empty email
      const registrationData = {
        token,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        address: formData.address || null,
        aadhaar_id: formData.aadhaar_id,
        email: formData.email.trim() || null  // Convert empty string to null
      };
      
      const response = await axios.post(`${API}/auth/register`, registrationData);
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      toast.success('Registration successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert>
          <AlertDescription>
            Invalid invitation link. Please check your invitation email.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Complete Your Registration</CardTitle>
            {invitationDetails && (
              <CardDescription>
                You've been invited to join as: {invitationDetails.email}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  data-testid="register-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  data-testid="register-phone-input"
                />
                <p className="text-xs text-gray-500">This will be used for login</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  data-testid="register-email-input"
                />
                <p className="text-xs text-gray-500">Optional - for notifications only</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  data-testid="register-password-input"
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  data-testid="register-address-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar_id">Aadhaar ID *</Label>
                <Input
                  id="aadhaar_id"
                  placeholder="Enter your 12-digit Aadhaar ID"
                  value={formData.aadhaar_id}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setFormData({...formData, aadhaar_id: value});
                  }}
                  maxLength={12}
                  required
                  data-testid="register-aadhaar-input"
                />
                <p className="text-xs text-gray-500">Enter 12-digit Aadhaar ID (numbers only)</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={isLoading || !formData.aadhaar_id || formData.aadhaar_id.length !== 12}
                data-testid="register-submit-button"
              >
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [myTeam, setMyTeam] = useState([]);
  const [teamTree, setTeamTree] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tree');
  const [showWhatsAppShare, setShowWhatsAppShare] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    fetchStats();
    fetchMyTeam();
    fetchTeamTree();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ total_downline: 0, level: 0 }); // Set default values
    }
  };

  const fetchMyTeam = async () => {
    try {
      const response = await axios.get(`${API}/my-team`);
      setMyTeam(response.data);
    } catch (error) {
      console.error('Failed to fetch team:', error);
      setMyTeam([]); // Set default empty array
    }
  };

  const fetchTeamTree = async () => {
    try {
      const response = await axios.get(`${API}/team-tree`);
      setTeamTree(response.data);
    } catch (error) {
      console.error('Failed to fetch team tree:', error);
      setTeamTree(null); // Set default null
    }
  };

  const handleInvite = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/invite`, inviteData);
      toast.success('Invitation created successfully!');
      
      // Store invitation details for WhatsApp sharing
      const inviteLink = `${window.location.origin}/register?token=${response.data.invitation_token}`;
      const message = `🎉 You're invited to join KHPL Team!

Hi ${inviteData.name},

You've been invited to join our team on our platform. Click the link below to create your account:

${inviteLink}

📋 Required fields for registration:
• Full Name
• Phone Number (used for login)
• Password
• 12-digit Aadhaar ID

📧 Email address is optional.

This invitation expires in 7 days.

Best regards,
${user?.name || 'Team Leader'}`;

      // Copy to clipboard
      navigator.clipboard.writeText(message);
      
      // Show WhatsApp share dialog
      setInviteMessage(message);
      setShowWhatsAppShare(true);
      setShowInviteDialog(false);
      setInviteData({ name: '' });
      
      fetchStats();
      fetchMyTeam();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create invitation';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to create invitation');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get all levels in the tree
  const getAllLevels = (node, levels = []) => {
    if (!node) return levels;
    levels.push(node.level);
    if (node.children) {
      node.children.forEach(child => getAllLevels(child, levels));
    }
    return levels;
  };

  const renderTreeNode = (node, isRoot = false, level = 0) => {
    if (!node) return null;

    // Calculate spacing based on level to prevent overlap
    const spacingClass = level === 0 ? 'space-x-16' : level === 1 ? 'space-x-12' : 'space-x-8';

    return (
      <div className="flex flex-col items-center relative" key={node.id}>
        {/* Node Card */}
        <div className={`relative ${isRoot ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-white border-2 border-gray-200'} rounded-lg p-3 shadow-lg w-[160px] sm:w-[200px]`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <div className={`w-3 h-3 ${isRoot ? 'bg-white' : 'bg-blue-500'} rounded-full mr-2`}></div>
              <span className="font-semibold text-[11px] sm:text-xs">{node.name}</span>
            </div>
            <div className="text-[11px] sm:text-xs opacity-80 truncate">{node.email}</div>
            <Badge variant={isRoot ? "secondary" : "outline"} className="mt-1 text-[10px] sm:text-xs px-2 py-0">
              L{node.level}
            </Badge>
            <div className="text-[11px] sm:text-xs mt-1 opacity-70">
              {node.children_count} members
            </div>
          </div>
        </div>

        {/* Children Container */}
        {node.children && node.children.length > 0 && (
          <div className="mt-6 relative">
            {/* Vertical line from parent to children level */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-6 bg-gray-300 top-[-24px]"></div>
            
            {/* Children row */}
            <div className={`flex items-start ${spacingClass}`}>
              {node.children.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center relative">
                  {/* Horizontal line to child */}
                  <div className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 w-full h-px bg-gray-300"></div>
                  
                  {/* Vertical line from horizontal to child */}
                  <div className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 w-px h-6 bg-gray-300"></div>
                  
                  {/* Child Node */}
                  {renderTreeNode(child, false, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="py-2 sm:py-3 flex items-center justify-between">
            {/* Left: Logo + Owner badge */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <img src={logo} alt="KHPL" className="h-10 sm:h-16 w-auto flex-shrink-0" />
              {user?.is_owner && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm whitespace-nowrap">Owner</Badge>
              )}
            </div>

            {/* Right: Welcome + Logout */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-xs sm:text-base text-gray-700 truncate hidden sm:inline">
                Welcome, {user?.name}
              </span>
              <span className="text-xs text-gray-700 truncate sm:hidden">
                {user?.name}
              </span>
              <Button
                variant="outline"
                className="h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0"
                onClick={logout}
                data-testid="logout-button"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Combined Stats Card */}
        <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1 sm:mb-2" data-testid="total-downline-count">
                  {stats?.total_downline || 0}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Total Team Members</p>
                <p className="text-xs text-gray-500">All members in your network</p>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-1 sm:mb-2" data-testid="user-level">
                  {stats?.level || 0}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Your Level</p>
                <p className="text-xs text-gray-500">Position in hierarchy</p>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">
                  {myTeam.length}/2
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">Direct Members</p>
                <p className="text-xs text-gray-500">Maximum allowed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Team Member Button - Always Visible */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Team Management</h2>
            <p className="text-xs sm:text-sm text-gray-600">Manage your team members and view hierarchy</p>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-5 py-2.5" 
                data-testid="add-member-button"
                disabled={myTeam.length >= 2}
              >
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-sm">+</span>
                  </div>
                  <span className="text-sm sm:text-base">Add Team Member ({myTeam.length}/2)</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-semibold">📱 Create WhatsApp Invitation</DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-gray-600">
                  Create an invitation link to share via WhatsApp. You can invite up to 2 direct members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-name" className="text-sm font-medium">Team Member Name</Label>
                  <Input id="invite-name" placeholder="Enter their full name" value={inviteData.name} onChange={(e) => setInviteData({...inviteData, name: e.target.value})} data-testid="invite-name-input" className="h-10 sm:h-11" />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>How it works:</strong> We'll create a personalized invitation link that you can share via WhatsApp or any messaging app. The recipient will need to provide their name, phone number (for login), password, and 12-digit Aadhaar ID. Email is optional.
                  </p>
                </div>
                <Button onClick={handleInvite} className="w-full h-10 sm:h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" disabled={isLoading || !inviteData.name} data-testid="send-invitation-button">
                  {isLoading ? 'Creating Invitation...' : '📱 Create WhatsApp Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* WhatsApp Share Dialog */}
          <Dialog open={showWhatsAppShare} onOpenChange={setShowWhatsAppShare}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">📱 Share Invitation</DialogTitle>
                <DialogDescription className="text-center">
                  Your invitation has been created! Choose how to share it:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Message copied to clipboard:</p>
                  <p className="text-xs text-gray-800 whitespace-pre-wrap">{inviteMessage}</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => {
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
                      window.open(whatsappUrl, '_blank');
                      setShowWhatsAppShare(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    📱 Share on WhatsApp
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(inviteMessage);
                      toast.success('Message copied to clipboard!');
                      setShowWhatsAppShare(false);
                    }}
                    variant="outline"
                  >
                    📋 Copy Message Again
                  </Button>
                  
                  <Button 
                    onClick={() => setShowWhatsAppShare(false)}
                    variant="ghost"
                  >
                    ✕ Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="tree" className="space-y-4 sm:space-y-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              <button onClick={() => setActiveTab('tree')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'tree' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'tree' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span>Team Hierarchy</span>
                </div>
              </button>
              <button onClick={() => setActiveTab('team')} className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'team' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${activeTab === 'team' ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span>My Team Members</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Direct Team Members</h3>
                    <p className="text-sm text-gray-600">Your immediate team members (Maximum 2 allowed)</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {myTeam.length}/2 members
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myTeam.map((member) => (
                    <Card key={member.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900">{member.name}</CardTitle>
                            <CardDescription className="text-gray-600">{member.email}</CardDescription>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">Level {member.level}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 text-sm">
                          {member.aadhaar_id && (
                            <div className="flex items-center text-gray-600">
                              <span className="mr-2">🆔</span>
                              <span>Aadhaar: {member.aadhaar_id}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center text-gray-600">
                              <span className="mr-2">📞</span>
                              <span>{member.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center text-gray-600">
                            <span className="mr-2">👥</span>
                            <span>{member.children_count} direct members</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <span className="mr-2">📅</span>
                            <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {myTeam.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-2xl">👥</span>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-700">No team members yet</p>
                          <p className="text-sm text-gray-500 mt-1">You can invite up to 2 direct team members</p>
                          <p className="text-sm text-gray-500">Start by inviting your first member!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    Team Hierarchy
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    <span className="text-sm sm:text-base">Visual representation of your entire team structure</span>
                    {teamTree && (
                      <span className="block mt-2 text-xs sm:text-sm font-medium text-blue-700">
                        📊 {stats?.total_downline || 0} total members across {Math.max(...getAllLevels(teamTree)) + 1} levels
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {teamTree ? (
                    <div className="overflow-x-auto overflow-y-auto max-h-[65vh] sm:max-h-[600px] py-6 sm:py-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" data-testid="team-tree" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
                      <div className="flex justify-center min-w-max px-4 sm:px-8">
                        {renderTreeNode(teamTree, true)}
                      </div>
                      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 bg-gray-50 py-2.5 sm:py-3 mx-4 sm:mx-6 rounded-lg">
                        💡 Scroll horizontally to view the complete team tree
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <span className="text-xl sm:text-2xl">🌳</span>
                      </div>
                      <p className="text-gray-500 text-base sm:text-lg">Loading team hierarchy...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs>

      </div>
    </div>
  );
};

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterFromInvitation /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
};

const AppWithAuth = () => {
  return (
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  );
};

export default AppWithAuth;