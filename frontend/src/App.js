import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import logo from './assets/logo.png';
import InstallPrompt from './components/InstallPrompt';
import InstallButton from './components/InstallButton';
import './App.css';

// Import Shadcn components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import TreeGraph from './components/TreeGraph';
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
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchCurrentUser();
      } else {
        setLoading(false);
      }

      // Handle installation parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('install') === 'true') {
        // This is an installation window, try to trigger installation
        setTimeout(() => {
          if (window.deferredPrompt) {
            console.log('Triggering installation from install parameter');
            window.deferredPrompt.prompt();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error in AuthProvider useEffect:', error);
      setLoading(false);
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      // Don't throw error, just log it and continue
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
              
              {/* PWA Install Button */}
              <InstallButton 
                variant="outline" 
                size="sm" 
                className="w-full text-gray-600 hover:text-gray-800 mt-4 border-t border-gray-200"
                showText={true}
              >
                📱 Install KHPL App
              </InstallButton>
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

  const checkAadhaarUniqueness = async (aadhaarId) => {
    if (!aadhaarId || aadhaarId.length !== 12) {
      return true; // Don't check if Aadhaar is not complete
    }
    
    try {
      // We'll check this during registration, but we can add a real-time check here if needed
      // For now, we'll rely on the backend validation
      return true;
    } catch (error) {
      console.error('Error checking Aadhaar uniqueness:', error);
      return true; // Allow submission, backend will handle the validation
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
  // Helper to truncate long names with an end ellipsis (keep beginning)
  const formatDisplayName = (name, maxChars = 18) => {
    if (!name) return '';
    const trimmed = String(name).trim();
    if (trimmed.length <= maxChars) return trimmed;
    // Aim to cut at a word boundary near maxChars
    const slice = trimmed.slice(0, maxChars);
    const lastSpace = slice.lastIndexOf(' ');
    const base = lastSpace > 8 ? slice.slice(0, lastSpace) : slice; // avoid cutting too short
    return `${base}…`;
  };
  const [editingPoints, setEditingPoints] = useState({});
  const [pointsInputs, setPointsInputs] = useState({});

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

  // Update points inside teamTree immediately after a successful save
  const updateTreePoints = (node, targetId, newPoints) => {
    if (!node) return node;
    const updated = { ...node };
    if (updated.id === targetId) {
      updated.points = newPoints;
    }
    if (Array.isArray(updated.children) && updated.children.length) {
      updated.children = updated.children.map((child) => updateTreePoints(child, targetId, newPoints));
    }
    return updated;
  };

  const handleSavePointsInTree = async (userId, newPoints) => {
    try {
      await axios.put(`${API}/user/${userId}/points`, { points: newPoints });
      // optimistic update: reflect immediately in tree and myTeam
      setTeamTree((prev) => (prev ? updateTreePoints(prev, userId, newPoints) : prev));
      setMyTeam((prev) => prev.map((m) => (m.id === userId ? { ...m, points: newPoints } : m)));
      toast.success('Points updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update points';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to update points');
      return false;
    }
  };

  const handleDeleteMember = async (userId, userName) => {
    try {
      await axios.delete(`${API}/user/${userId}`);
      toast.success(`Member ${userName} and all descendants deleted successfully`);
      // Refresh team data
      fetchStats();
      fetchMyTeam();
      fetchTeamTree();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete member';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to delete member');
    }
  };

  const handlePointsEdit = (memberId, currentPoints) => {
    setEditingPoints({ ...editingPoints, [memberId]: true });
    setPointsInputs({ ...pointsInputs, [memberId]: currentPoints || 0 });
  };

  const handlePointsSave = async (memberId) => {
    try {
      const pointsValue = parseInt(pointsInputs[memberId]) || 0;
      await axios.put(`${API}/user/${memberId}/points`, { points: pointsValue });
      toast.success('Points updated successfully');
      setEditingPoints({ ...editingPoints, [memberId]: false });
      // Refresh team data
      fetchMyTeam();
      fetchStats();
      fetchTeamTree();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update points';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to update points');
    }
  };

  const handlePointsCancel = (memberId, originalPoints) => {
    setEditingPoints({ ...editingPoints, [memberId]: false });
    setPointsInputs({ ...pointsInputs, [memberId]: originalPoints || 0 });
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

            {/* Right: Welcome + Install + Logout */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-xs sm:text-base text-gray-700 truncate hidden sm:inline">
                Welcome, {user?.name}
              </span>
              <span className="text-xs text-gray-700 truncate sm:hidden">
                {user?.name}
              </span>
              
              {/* Install App Button */}
              <InstallButton
                variant="outline"
                size="sm"
                className="h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0"
                showText={false}
                tooltipPosition="right"
                title="Install KHPL as an app"
              />
              
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
                    <Card key={member.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 relative">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900" title={member.name}>{formatDisplayName(member.name, 18)}</CardTitle>
                            <CardDescription className="text-gray-600">{member.phone}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800">Level {member.level}</Badge>
                            {user?.is_owner && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                    title="Delete member"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete <strong>{member.name}</strong>? This action will permanently delete this member and all their descendants from the team. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteMember(member.id, member.name)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
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
                          <div className="flex items-center justify-between text-gray-600 pt-2 border-t border-gray-200">
                            <div className="flex items-center">
                              <span className="mr-2">⭐</span>
                              <span>Points:</span>
                            </div>
                            {user?.is_owner && editingPoints[member.id] ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={pointsInputs[member.id] || 0}
                                  onChange={(e) => setPointsInputs({ ...pointsInputs, [member.id]: parseInt(e.target.value) || 0 })}
                                  className="w-20 h-8 text-sm"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => handlePointsSave(member.id)}
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => handlePointsCancel(member.id, member.points)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-blue-600">{member.points || 0}</span>
                                {user?.is_owner && (
                                  <button
                                    onClick={() => handlePointsEdit(member.id, member.points)}
                                    className="text-blue-500 hover:text-blue-700 p-1"
                                    title="Edit points"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
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
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {teamTree ? (
                    <div className="py-4 sm:py-6" data-testid="team-tree">
                      <TreeGraph
                        data={teamTree}
                        isOwner={user?.is_owner}
                        onDeleteUser={handleDeleteMember}
                        onSavePoints={handleSavePointsInTree}
                        formatDisplayName={formatDisplayName}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4"><span className="text-xl sm:text-2xl">🌳</span></div>
                      <p className="text-gray-500 text-base sm:text-lg">Loading team hierarchy...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs>

      </div>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading KHPL...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we initialize the app</p>
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