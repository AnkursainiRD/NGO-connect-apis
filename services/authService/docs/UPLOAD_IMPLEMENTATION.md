# Direct Upload with Cloudinary - Implementation Guide

This guide explains how to implement secure direct upload to Cloudinary using signed URLs.

## 🎯 Architecture Overview

```
Frontend                Backend (Auth Service)           Cloudinary
────────                ─────────────────────            ──────────
   │                            │                            │
   │  1. Request Upload URL     │                            │
   ├──────────────────────────► │                            │
   │                            │                            │
   │  2. Generate Signed URL    │                            │
   │  ◄──────────────────────── │                            │
   │                            │                            │
   │  3. Upload File Directly   │                            │
   ├────────────────────────────┼──────────────────────────► │
   │                            │                            │
   │  4. Receive Upload Result  │                            │
   │  ◄────────────────────────────────────────────────────┤
   │                            │                            │
   │  5. Save URL to Database   │                            │
   ├──────────────────────────► │                            │
   │                            │  6. Update user avatar_url │
   │  6. Success Response       │    in database             │
   │  ◄──────────────────────── │                            │
```

## 🔐 Environment Setup

Add these to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=ngo_connect
CLOUDINARY_FOLDER=ngo-connect/avatars
MAX_FILE_SIZE=5242880
```

Get these credentials from: https://cloudinary.com/console

## 📡 API Endpoints

### 1. Get Avatar Upload URL

**Request:**
```http
POST /api/v1/upload/avatar-url
Content-Type: application/json

{
  "userId": "12345"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signed upload URL generated successfully",
  "data": {
    "upload": {
      "url": "https://api.cloudinary.com/v1_1/your_cloud/image/upload",
      "params": {
        "timestamp": 1700000000,
        "folder": "ngo-connect/avatars/avatars",
        "resource_type": "image",
        "allowed_formats": "jpg,jpeg,png,webp",
        "public_id": "avatar_12345_1700000000",
        "transformation": {
          "width": 500,
          "height": 500,
          "crop": "fill",
          "gravity": "face",
          "quality": "auto"
        },
        "signature": "abc123...",
        "api_key": "your_api_key"
      },
      "cloudName": "your_cloud",
      "maxFileSize": 2097152,
      "allowedFormats": ["jpg", "jpeg", "png", "webp"],
      "expiresAt": "2025-11-26T22:45:00.000Z"
    }
  },
  "timestamp": "2025-11-26T21:45:00.000Z"
}
```

### 2. Update Avatar URL

**Request:**
```http
POST /api/v1/upload/update-avatar
Content-Type: application/json

{
  "userId": "12345",
  "avatarUrl": "https://res.cloudinary.com/your_cloud/image/upload/v123/ngo-connect/avatars/avatars/avatar_12345.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": {
    "user": {
      "id": "12345",
      "name": "Ankur Saini",
      "email": "ankur@example.com",
      "avatar_url": "https://res.cloudinary.com/your_cloud/image/upload/v123/ngo-connect/avatars/avatars/avatar_12345.jpg"
    }
  },
  "timestamp": "2025-11-26T21:45:00.000Z"
}
```

## 💻 Frontend Implementation

### React Example with Axios

```javascript
import axios from 'axios';

const uploadAvatar = async (userId, file) => {
  try {
    // Step 1: Get signed upload URL from backend
    const { data: urlData } = await axios.post('/api/v1/upload/avatar-url', {
      userId
    });

    const { url, params, maxFileSize, allowedFormats } = urlData.data.upload;

    // Validate file size
    if (file.size > maxFileSize) {
      throw new Error(`File size must be less than ${maxFileSize / 1024 / 1024}MB`);
    }

    // Validate file format
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedFormats.includes(fileExt)) {
      throw new Error(`File must be one of: ${allowedFormats.join(', ')}`);
    }

    // Step 2: Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Append all signed parameters
    Object.keys(params).forEach(key => {
      if (typeof params[key] === 'object') {
        formData.append(key, JSON.stringify(params[key]));
      } else {
        formData.append(key, params[key]);
      }
    });

    // Step 3: Upload directly to Cloudinary
    const { data: uploadResult } = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });

    // Step 4: Save the uploaded image URL to your database
    const { data: updateData } = await axios.post('/api/v1/upload/update-avatar', {
      userId,
      avatarUrl: uploadResult.secure_url
    });

    return updateData.data.user;

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Usage
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const updatedUser = await uploadAvatar('12345', file);
    console.log('Avatar uploaded:', updatedUser.avatar_url);
  }
};
```

### Vue 3 Example

```vue
<template>
  <div>
    <input
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      @change="handleFileUpload"
    />
    <div v-if="uploading">
      Uploading: {{ uploadProgress }}%
    </div>
    <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const uploading = ref(false);
const uploadProgress = ref(0);
const avatarUrl = ref('');

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    uploading.value = true;
    uploadProgress.value = 0;

    // Get signed URL
    const { data: urlData } = await axios.post('/api/v1/upload/avatar-url', {
      userId: '12345'
    });

    const { url, params } = urlData.data.upload;

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(params).forEach(key => {
      formData.append(key, typeof params[key] === 'object' 
        ? JSON.stringify(params[key]) 
        : params[key]
      );
    });

    // Upload to Cloudinary
    const { data: uploadResult } = await axios.post(url, formData, {
      onUploadProgress: (e) => {
        uploadProgress.value = Math.round((e.loaded * 100) / e.total);
      }
    });

    // Update database
    await axios.post('/api/v1/upload/update-avatar', {
      userId: '12345',
      avatarUrl: uploadResult.secure_url
    });

    avatarUrl.value = uploadResult.secure_url;

  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed: ' + error.message);
  } finally {
    uploading.value = false;
  }
};
</script>
```

## 🔒 Security Features

1. **Signed URLs** - URLs expire after 1 hour
2. **File Type Validation** - Only allowed formats can be uploaded
3. **File Size Limits** - Enforced on both client and Cloudinary
4. **URL Validation** - Backend validates Cloudinary URLs before saving
5. **Transformations** - Images automatically optimized (width, height, quality)
6. **Authentication** - TODO: Add middleware to verify authenticated users

## 📋 Available Upload Types

### Avatar Upload
```javascript
POST /api/v1/upload/avatar-url
{
  "userId": "12345"
}
```
- Max size: 2MB
- Formats: jpg, jpeg, png, webp
- Auto-resize: 500x500px, face detection
- Folder: `ngo-connect/avatars/avatars/`

### Document Upload
```javascript
POST /api/v1/upload/document-url
{
  "userId": "12345",
  "documentType": "id_proof"
}
```
- Max size: 10MB
- Formats: pdf, doc, docx, xls, xlsx
- Folder: `ngo-connect/avatars/documents/{documentType}/`

### NGO Image Upload
```javascript
POST /api/v1/upload/ngo-image-url
{
  "ngoId": "67890",
  "imageType": "logo"  // or "banner", "gallery"
}
```
- Max size: 5MB
- Formats: jpg, jpeg, png, webp
- Logo: 400x400px
- Banner: 1920x1080px max
- Folder: `ngo-connect/avatars/ngos/{ngoId}/{imageType}/`

## 🧪 Testing

### Using cURL

```bash
# 1. Get upload URL
curl -X POST http://localhost:3001/api/v1/upload/avatar-url \
  -H "Content-Type: application/json" \
  -d '{"userId": "12345"}'

# 2. Upload to Cloudinary (use the URL and params from step 1)
curl -X POST "https://api.cloudinary.com/v1_1/your_cloud/image/upload" \
  -F "file=@avatar.jpg" \
  -F "timestamp=1700000000" \
  -F "signature=abc123..." \
  -F "api_key=your_api_key" \
  -F "folder=ngo-connect/avatars" \
  # ... other params

# 3. Update database
curl -X POST http://localhost:3001/api/v1/upload/update-avatar \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345",
    "avatarUrl": "https://res.cloudinary.com/your_cloud/image/upload/v123/avatar.jpg"
  }'
```

## ⚡ Benefits of This Approach

1. **Zero Server Load** - Files never touch your backend
2. **Fast Uploads** - Direct to Cloudinary's global CDN
3. **Secure** - Time-limited signed URLs
4. **Scalable** - No server storage needed
5. **Cost Effective** - Only pay for Cloudinary storage
6. **Auto-Optimization** - Cloudinary handles image processing
7. **Microservices Ready** - Auth service doesn't handle files

## 🚀 Next Steps

1. Add authentication middleware to protect upload endpoints
2. Add user authorization (users can only upload their own avatar)
3. Implement file deletion when user updates avatar
4. Add upload progress tracking
5. Add client-side image preview before upload
6. Add webhook to track successful uploads
