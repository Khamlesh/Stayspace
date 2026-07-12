# StaySpace Backend

A Flask REST API bridge that connects the React frontend to the C++ core engine and MySQL database.

## Features

- 🔗 **REST API Bridge**: Thin API layer that invokes C++ executable
- 🔐 **Authentication**: User registration, login, and token validation
- 🏠 **Property Management**: Property search, listing, and details
- 💰 **Payment Integration**: Simulated payment processing
- 📧 **Error Handling**: Graceful error responses with detailed messages

## Tech Stack

- **Flask 3.1.3** - Web framework
- **Python 3.8+** - Programming language
- **MySQL 8.0** - Database (via C++ wrapper)

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment support

### Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Start the Flask development server:

```bash
python app.py
```

The API will be available at `http://127.0.0.1:5000`

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Create new user account
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/logout` - User logout
- **GET** `/api/auth/validate` - Validate token
- **POST** `/api/auth/change_password` - Change password
- **POST** `/api/auth/forgot_password` - Forgot password

### Properties
- **GET** `/api/properties` - List all properties with filters
- **POST** `/api/properties` - Create new property (host only)
- **GET** `/api/properties/<id>` - Get property details

### Root
- **GET** `/` - API status and available routes

## Request/Response Format

### Register Request
```json
{
  "token": "user_token",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "role": "Guest"
}
```

### Login Request
```json
{
  "token": "user_token",
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

### Login Response
```json
{
  "status": "success",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Guest",
    "token": "eyJhbGc..."
  }
}
```

## Architecture

The Flask backend implements a thin bridge pattern:

1. **Client Request** → Flask API endpoint
2. **Parameter Validation** → Extract and validate request data
3. **C++ Invocation** → Execute `stayspace_core.exe` with JSON parameters
4. **Response Parsing** → Parse C++ output JSON
5. **API Response** → Return structured response to client

## Configuration

Key files:
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies

Environment setup:
- The C++ executable path is checked before execution
- MySQL database must be running and accessible
- C++ executable must be compiled in `../CPP/stayspace_core.exe`

## Error Handling

The API returns standard HTTP status codes:
- **200 OK** - Successful request
- **400 Bad Request** - Invalid parameters
- **401 Unauthorized** - Authentication failed
- **500 Internal Server Error** - Server error

Error responses include a descriptive message:
```json
{
  "status": "error",
  "message": "Detailed error description",
  "data": null
}
```

## Development

### Adding New Endpoints

1. Add route in `app.py`:
```python
@app.route('/api/new-endpoint', methods=['POST'])
def new_endpoint():
    data = request.get_json()
    result = _invoke_core('module', 'action', data)
    return result
```

2. Implement corresponding action in C++ core

3. Update React frontend API client

## Security Notes

- All requests are logged
- Input validation occurs before C++ invocation
- Database credentials are stored in environment variables
- Tokens are validated via C++ core authentication
- No sensitive data is logged

## Troubleshooting

### Module NotFoundError: No module named 'flask'

Run: `pip install -r requirements.txt`

### C++ executable not found

Ensure `stayspace_core.exe` is built in `../CPP/` directory

### Database connection refused

Check MySQL is running and credentials are correct in `.env`

## License

Proprietary - StaySpace 2024
