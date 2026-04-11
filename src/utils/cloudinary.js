export const uploadToCloudinary = async (file) => {
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  if (!file) {
    throw new Error('No file provided');
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.');
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'abandoned_locations');

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary response error:', errorText);
      
      let errorMessage = 'Upload failed';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {}
      
      throw new Error(`${errorMessage}`);
    }

    const data = await response.json();
    
    // Apply transformations in URL after upload
    const baseUrl = data.secure_url;
    const publicId = data.public_id;
    
    // Create transformed URL (add transformations in URL)
    const transformedUrl = baseUrl.replace(
      '/upload/', 
      '/upload/q_auto,f_auto,w_1920,h_1080,c_limit/'
    );

    return {
      url: transformedUrl,
      publicId: publicId,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      originalUrl: data.secure_url
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    if (error.message.includes('unsigned upload')) {
      throw new Error('Image upload configuration error. Please contact support.');
    } else if (error.message.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to image service. Please try again.');
    } else {
      throw new Error('Failed to upload image. ' + error.message);
    }
  }
};