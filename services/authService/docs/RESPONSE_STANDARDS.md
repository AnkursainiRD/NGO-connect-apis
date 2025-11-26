# API Response Standards

This document defines the standardized response format for all Auth Service endpoints.

## Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data here
  },
  "timestamp": "2025-11-26T15:45:30.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": [] // Optional, for validation errors
  },
  "timestamp": "2025-11-26T15:45:30.000Z"
}
```

## Available Response Helpers

### Success Responses

#### `successResponse(res, options)`
Generic success response (200)
```javascript
import { successResponse } from '@utils/response.js';

return successResponse(res, {
  data: { user: userData },
  message: 'User retrieved successfully'
});
```

#### `createdResponse(res, options)`
Resource created (201)
```javascript
import { createdResponse } from '@utils/response.js';

return createdResponse(res, {
  data: { user: newUser },
  message: 'User created successfully'
});
```

### Error Responses

#### `errorResponse(res, options)`
Generic error response
```javascript
import { errorResponse } from '@utils/response.js';

return errorResponse(res, {
  message: 'Invalid credentials',
  code: 'INVALID_CREDENTIALS',
  statusCode: 401
});
```

#### `conflictResponse(res, message)`
Resource already exists (409)
```javascript
import { conflictResponse } from '@utils/response.js';

return conflictResponse(res, 'Email already registered');
```

#### `unauthorizedResponse(res, message)`
Unauthorized access (401)
```javascript
import { unauthorizedResponse } from '@utils/response.js';

return unauthorizedResponse(res, 'Invalid token');
```

#### `forbiddenResponse(res, message)`
Forbidden access (403)
```javascript
import { forbiddenResponse } from '@utils/response.js';

return forbiddenResponse(res, 'Insufficient permissions');
```

#### `notFoundResponse(res, message)`
Resource not found (404)
```javascript
import { notFoundResponse } from '@utils/response.js';

return notFoundResponse(res, 'User not found');
```

#### `internalErrorResponse(res, message)`
Server error (500)
```javascript
import { internalErrorResponse } from '@utils/response.js';

return internalErrorResponse(res, 'Failed to process request');
```

### Specialized Responses

#### `paginatedResponse(res, options)`
Paginated list response
```javascript
import { paginatedResponse } from '@utils/response.js';

return paginatedResponse(res, {
  data: users,
  page: 1,
  limit: 10,
  total: 100,
  message: 'Users retrieved successfully'
});
```

Response includes metadata:
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2025-11-26T15:45:30.000Z"
}
```

## HTTP Status Codes

| Code | Helper | Use Case |
|------|--------|----------|
| 200 | `successResponse` | Successful GET, PUT, PATCH |
| 201 | `createdResponse` | Successful POST (resource created) |
| 204 | `noContentResponse` | Successful DELETE |
| 400 | `errorResponse` | Bad request / validation error |
| 401 | `unauthorizedResponse` | Authentication required |
| 403 | `forbiddenResponse` | Authenticated but not authorized |
| 404 | `notFoundResponse` | Resource not found |
| 409 | `conflictResponse` | Resource already exists |
| 500 | `internalErrorResponse` | Server error |

## Error Codes

Standard error codes used across the service:

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Not authorized |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource already exists |
| `INTERNAL_ERROR` | Server error |
| `INVALID_CREDENTIALS` | Wrong email/password |
| `TOKEN_EXPIRED` | JWT token expired |
| `TOKEN_INVALID` | JWT token invalid |
| `EMAIL_NOT_VERIFIED` | Email not verified |
| `ACCOUNT_LOCKED` | Account temporarily locked |

## Usage Examples

### Registration Example
```javascript
register = async (req, res) => {
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return conflictResponse(res, 'Email already registered');
    }
    
    const newUser = await User.create(userData);
    return createdResponse(res, {
      data: { user: newUser.toJSON() },
      message: 'User registered successfully'
    });
  } catch (error) {
    return internalErrorResponse(res, 'Failed to register user');
  }
}
```

### Login Example
```javascript
login = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }
    
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }
    
    return successResponse(res, {
      data: { 
        user: user.toJSON(),
        token: accessToken,
        refreshToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    return internalErrorResponse(res, 'Failed to login');
  }
}
```
