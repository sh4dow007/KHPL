# KHLP - Team Management System

A modern team management application built with React and FastAPI.

## Features

- **User Authentication**: JWT-based authentication system
- **Team Management**: Add up to 2 direct team members per user
- **Hierarchy Visualization**: Beautiful vertical tree structure
- **Invitation System**: Email-based invitation flow with secure tokens
- **Aadhaar Integration**: Mandatory Aadhaar ID verification
- **Real-time Statistics**: Team member counts and hierarchy levels
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Beautiful component library
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor driver
- **JWT** - Secure authentication tokens
- **Pydantic** - Data validation and serialization

### Deployment
- **Frontend**: Netlify (FREE)
- **Backend**: Render.com (FREE)
- **Database**: MongoDB Atlas M0 (FREE)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account
- Render.com account
- Netlify account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd KHPL
   ```

2. **Setup Admin Credentials**
   ```bash
   python3 setup_admin.py
   ```
   This interactive script will help you set up admin credentials and environment variables.

3. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   # .env file is created by setup_admin.py
   python -m uvicorn server:app --reload
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   yarn start
   ```

### Admin Login

After running the setup script, you can login with:
- **Phone Number**: The phone number you provided during setup
- **Password**: The password you provided during setup

**Note**: The system uses phone numbers for login, not email addresses.

### Production Deployment

Follow the complete deployment guide: [FLYIO_DEPLOYMENT_GUIDE.md](./FLYIO_DEPLOYMENT_GUIDE.md)

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register from invitation
- `POST /api/invite` - Send invitation
- `GET /api/invitation/{token}` - Get invitation details
- `GET /api/my-team` - Get direct team members
- `GET /api/team-tree` - Get team hierarchy
- `GET /api/stats` - Get user statistics

## Environment Variables

### Backend (.env)
```bash
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/khlp_database
DB_NAME=khlp_database
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=https://your-frontend-url.netlify.app
```

### Frontend (.env.local)
```bash
REACT_APP_BACKEND_URL=https://your-backend-url.fly.dev
```

## Owner Setup

The owner account is created automatically on first startup using environment variables:

- **OWNER_EMAIL**: Your email address
- **OWNER_PASSWORD**: Your secure password

**⚠️ Set these in your `.env` file before first startup!**

## Project Structure

```
KHPL/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile        # Docker configuration
│   └── fly.toml          # Fly.io configuration
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React application
│   │   ├── components/   # UI components
│   │   └── lib/          # Utility functions
│   ├── package.json      # Node.js dependencies
│   └── netlify.toml      # Netlify configuration
└── FLYIO_DEPLOYMENT_GUIDE.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the deployment guide for troubleshooting
- Review the API documentation

---

**Built with ❤️ for modern MLM management**