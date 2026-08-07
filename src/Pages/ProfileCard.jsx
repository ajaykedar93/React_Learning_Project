import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Phone, MapPin, Mail, Briefcase, Globe, Copy, Check, ExternalLink, Edit3, Save, X, Camera, Loader, Move, Maximize, ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const ProfileCard = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [noDataFound, setNoDataFound] = useState(false);
  
  // Image position state
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempImageData, setTempImageData] = useState(null);
  const [isImageUpdated, setIsImageUpdated] = useState(false);
  
  // Default static data
  const defaultData = {
    id: null,
    name: "",
    profession: "",
    instagram: "",
    phone1: "",
    phone2: "",
    email1: "",
    email2: "",
    address: {
      street: "",
      city: "",
      taluka: "",
      district: "",
      state: "",
      pincode: ""
    },
    avatar: null
  };

  const [userData, setUserData] = useState(defaultData);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(defaultData);
  const [copiedField, setCopiedField] = useState(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState(null);

  const canvasRef = useRef(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoDataFound(false);
      
      const response = await fetch('http://localhost:5000/api/personal-users/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        const user = result.data[0];
        
        const userDataObj = {
          id: user.id,
          name: user.full_name || "",
          profession: user.profession || "",
          instagram: user.instagram || "",
          phone1: user.phone1 || "",
          phone2: user.phone2 || "",
          email1: user.email1 || "",
          email2: user.email2 || "",
          address: {
            street: user.street || "",
            city: user.city || "",
            taluka: user.taluka || "",
            district: user.district || "",
            state: user.state || "",
            pincode: user.pincode || ""
          },
          avatar: user.profile_image_url || user.profile_image || null
        };
        
        setUserData(userDataObj);
        setSavedLogoUrl(userDataObj.avatar);
        setNoDataFound(false);
      } else {
        setNoDataFound(true);
        setUserData(defaultData);
        setSavedLogoUrl(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data.');
      setNoDataFound(true);
      setUserData(defaultData);
      setSavedLogoUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // CROP IMAGE - ROUND SHAPE WITH ZOOM & POSITION
  // =============================================
  const cropImage = async (imageSource) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Determine crop size (use the larger dimension for square)
          const size = Math.max(img.width, img.height);
          canvas.width = size;
          canvas.height = size;
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Save context
          ctx.save();
          
          // Center the image
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // Apply transformations
          ctx.translate(centerX, centerY);
          ctx.scale(imageScale, imageScale);
          ctx.translate(imagePosition.x, imagePosition.y);
          
          // Draw image centered
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          
          // Restore context
          ctx.restore();
          
          // Create circular clipping path
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          
          // Redraw image with clipping
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.translate(centerX, centerY);
          ctx.scale(imageScale, imageScale);
          ctx.translate(imagePosition.x, imagePosition.y);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.restore();
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.95);
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        // Try loading without crossOrigin
        const img2 = new Image();
        img2.src = imageSource;
        img2.onload = () => {
          // Use the same logic with img2
          const size = Math.max(img2.width, img2.height);
          canvas.width = size;
          canvas.height = size;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          ctx.translate(centerX, centerY);
          ctx.scale(imageScale, imageScale);
          ctx.translate(imagePosition.x, imagePosition.y);
          ctx.drawImage(img2, -img2.width / 2, -img2.height / 2);
          ctx.restore();
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.translate(centerX, centerY);
          ctx.scale(imageScale, imageScale);
          ctx.translate(imagePosition.x, imagePosition.y);
          ctx.drawImage(img2, -img2.width / 2, -img2.height / 2);
          ctx.restore();
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.95);
        };
        img2.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      img.src = imageSource;
    });
  };

  // =============================================
  // SAVE LOGO ONLY - CROPPED ROUND IMAGE
  // =============================================
  const saveLogoOnly = async () => {
    try {
      setSavingLogo(true);
      setError(null);
      
      const avatarSource = editData.avatar || userData.avatar;
      
      if (!avatarSource) {
        setError('No image to save');
        setSavingLogo(false);
        return;
      }

      // Crop the image with current zoom and position
      const croppedBlob = await cropImage(avatarSource);
      
      if (!croppedBlob) {
        throw new Error('Failed to crop image');
      }
      
      const formData = new FormData();
      formData.append('profile_image', croppedBlob, 'profile_cropped.jpg');
      formData.append('full_name', userData.name || 'User');
      formData.append('profession', userData.profession || '');
      formData.append('instagram', userData.instagram || '');
      formData.append('phone1', userData.phone1 || '');
      formData.append('phone2', userData.phone2 || '');
      formData.append('email1', userData.email1 || '');
      formData.append('email2', userData.email2 || '');
      formData.append('street', userData.address.street || '');
      formData.append('city', userData.address.city || '');
      formData.append('taluka', userData.address.taluka || '');
      formData.append('district', userData.address.district || '');
      formData.append('state', userData.address.state || '');
      formData.append('pincode', userData.address.pincode || '');

      let response;
      let url;
      
      if (userData.id) {
        url = `http://localhost:5000/api/personal-users/update-logo/${userData.id}`;
        response = await fetch(url, {
          method: 'PUT',
          body: formData
        });
      } else {
        url = 'http://localhost:5000/api/personal-users/add';
        response = await fetch(url, {
          method: 'POST',
          body: formData
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const savedData = result.data;
        const savedImageUrl = savedData.profile_image_url || savedData.profile_image;
        
        const updatedUserData = {
          ...userData,
          id: savedData.id || userData.id,
          avatar: savedImageUrl
        };
        setUserData(updatedUserData);
        setSavedLogoUrl(savedImageUrl);
        setEditData(prev => ({ ...prev, avatar: savedImageUrl }));
        setShowManageModal(false);
        setError(null);
        setNoDataFound(false);
        resetImagePosition();
        setIsImageUpdated(false);
        setTempImageData(null);
        setSuccessMessage('✅ Logo saved successfully!');
        return result;
      } else {
        throw new Error(result.message || 'Failed to save logo');
      }
      
    } catch (err) {
      console.error('Error saving logo:', err);
      setError(err.message || 'Failed to save logo');
      throw err;
    } finally {
      setSavingLogo(false);
    }
  };

  // =============================================
  // SAVE PAGE DATA - TEXT FIELDS ONLY
  // =============================================
  const savePageData = async (data) => {
    try {
      setSaving(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('full_name', data.name || 'User');
      formData.append('profession', data.profession || '');
      formData.append('instagram', data.instagram || '');
      formData.append('phone1', data.phone1 || '');
      formData.append('phone2', data.phone2 || '');
      formData.append('email1', data.email1 || '');
      formData.append('email2', data.email2 || '');
      formData.append('street', data.address.street || '');
      formData.append('city', data.address.city || '');
      formData.append('taluka', data.address.taluka || '');
      formData.append('district', data.address.district || '');
      formData.append('state', data.address.state || '');
      formData.append('pincode', data.address.pincode || '');
      
      const logoToKeep = savedLogoUrl || userData.avatar;
      if (logoToKeep) {
        formData.append('profile_image_url', logoToKeep);
      }

      let response;
      let url;
      
      if (data.id) {
        url = `http://localhost:5000/api/personal-users/update/${data.id}`;
        response = await fetch(url, {
          method: 'PUT',
          body: formData
        });
      } else {
        url = 'http://localhost:5000/api/personal-users/add';
        response = await fetch(url, {
          method: 'POST',
          body: formData
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const result = await response.json();
      
      if (result.success) {
        const savedData = result.data;
        const updatedUserData = {
          ...data,
          id: savedData.id || data.id,
          avatar: savedLogoUrl || userData.avatar
        };
        setUserData(updatedUserData);
        setNoDataFound(false);
        setIsEditing(false);
        setSuccessMessage('✅ Page saved successfully!');
        return result;
      } else {
        throw new Error(result.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        await savePageData(editData);
        setError(null);
        setShowManageModal(false);
        resetImagePosition();
      } catch (err) {
        console.error('Save failed:', err);
      }
    } else {
      setEditData({ ...userData });
      setIsEditing(true);
      setError(null);
      setShowManageModal(false);
      resetImagePosition();
      setIsImageUpdated(false);
      setTempImageData(null);
    }
  };

  const handleCancel = () => {
    setEditData({ ...userData });
    setIsEditing(false);
    setError(null);
    setShowManageModal(false);
    resetImagePosition();
    setIsImageUpdated(false);
    setTempImageData(null);
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleUpdateImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setTempImageData(imageData);
        setEditData(prev => ({ ...prev, avatar: imageData }));
        resetImagePosition();
        setIsImageUpdated(true);
        setShowManageModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManageImage = () => {
    if (editData.avatar || userData.avatar) {
      setShowManageModal(true);
      resetImagePosition();
    }
  };

  const resetImagePosition = () => {
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1);
  };

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.1, 2.5));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const moveUp = () => {
    setImagePosition(prev => ({ ...prev, y: prev.y - 10 }));
  };

  const moveDown = () => {
    setImagePosition(prev => ({ ...prev, y: prev.y + 10 }));
  };

  const moveLeft = () => {
    setImagePosition(prev => ({ ...prev, x: prev.x - 10 }));
  };

  const moveRight = () => {
    setImagePosition(prev => ({ ...prev, x: prev.x + 10 }));
  };

  const resetPosition = () => {
    resetImagePosition();
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - imagePosition.x, 
      y: e.clientY - imagePosition.y 
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setImagePosition({ 
        x: e.clientX - dragStart.x, 
        y: e.clientY - dragStart.y 
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ 
      x: touch.clientX - imagePosition.x, 
      y: touch.clientY - imagePosition.y 
    });
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      const touch = e.touches[0];
      setImagePosition({ 
        x: touch.clientX - dragStart.x, 
        y: touch.clientY - dragStart.y 
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const openImageModal = () => {
    if (userData.avatar || savedLogoUrl) {
      setShowImageModal(true);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const displayAvatar = savedLogoUrl || userData.avatar;
  const data = isEditing ? editData : userData;

  const InstagramIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#0f0f1a'
      }}>
        <Loader size={40} color="#7C3AED" className="animate-spin" />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; padding: 0; background: #0f0f1a; font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .profile-container {
          display: flex; justify-content: center; align-items: center;
          min-height: auto; padding: 0;
          background: transparent;
          width: 100%;
        }
        
        .profile-card {
          animation: cardEntry 0.8s ease forwards;
          width: 100%; max-width: 520px; margin: 0 auto;
          position: relative; overflow: visible;
          background: linear-gradient(145deg, rgba(42,54,110,0.92), rgba(43,72,130,0.72) 48%, rgba(79,55,135,0.72));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(125,211,252,0.42);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.42), 0 0 32px rgba(56,189,248,0.12), inset 0 1px 0 rgba(255,255,255,0.16);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .profile-card:hover { border-color: rgba(125,211,252,0.72); box-shadow: 0 28px 70px rgba(0,0,0,0.5), 0 0 38px rgba(56,189,248,0.18), inset 0 1px 0 rgba(255,255,255,0.2); transform: translateY(-2px); }
        
        .profile-card * { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; }
        
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(124,58,237,0.2); }
          50% { box-shadow: 0 0 60px rgba(124,58,237,0.4); }
        }
        
        .avatar-wrapper { animation: float 5s ease-in-out infinite; }
        .avatar-wrapper:hover .avatar-hover-overlay { opacity: 1; }
        
        .info-row-hover {
          transition: all 0.3s ease; cursor: pointer;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        .info-row-hover:hover {
          transform: translateX(5px);
          background: rgba(124,58,237,0.2) !important;
          border-color: rgba(196,181,253,0.45) !important;
          box-shadow: 0 8px 22px rgba(124,58,237,0.12);
        }
        
        .edit-input {
          background: rgba(255,255,255,0.11);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px; padding: 0.5rem 0.8rem;
          color: white; font-size: 0.85rem; font-weight: 500;
          width: 100%; outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
        }
        
        .edit-input::placeholder { color: rgba(255,255,255,0.55); }
        
        .edit-input:focus {
          border-color: rgba(196,181,253,0.75);
          box-shadow: 0 0 20px rgba(124,58,237,0.1);
          background: rgba(124,58,237,0.16);
        }
        
        .error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          color: #fca5a5;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        
        .success-message {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          color: #6EE7B7;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          text-align: center;
          animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .no-data-message {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          color: #93C5FD;
          font-size: 0.8rem;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .saving-indicator {
          position: fixed;
          top: 20px; right: 20px;
          background: rgba(16, 185, 129, 0.9);
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          z-index: 1000;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
          animation: slideIn 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(20px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
          padding: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .modal-content {
          background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          padding: 24px;
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          position: relative;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
        }

        .modal-image-container {
          width: 350px;
          height: 350px;
          max-width: 70vw;
          max-height: 45vh;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
          position: relative;
          border: 2px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 60px rgba(124,58,237,0.15);
          flex-shrink: 0;
        }

        .modal-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.1s ease;
          user-select: none;
          -webkit-user-drag: none;
          display: block;
        }

        .view-modal-image-container {
          width: 500px;
          height: 500px;
          max-width: 80vw;
          max-height: 70vh;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
          position: relative;
          border: 2px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 80px rgba(124,58,237,0.15);
          flex-shrink: 0;
        }

        .view-modal-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          user-select: none;
          -webkit-user-drag: none;
          display: block;
        }

        .profile-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.8rem;
          font-weight: 800;
          color: rgba(255,255,255,0.7);
          position: relative;
          z-index: 1;
          border: 3px solid rgba(255,255,255,0.15);
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .modal-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
          transform: scale(1.1);
        }

        .manage-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.09);
          border-radius: 14px;
          border: 1px solid rgba(196,181,253,0.22);
          width: 100%;
          flex-shrink: 0;
        }

        .controls-row {
          display: flex;
          gap: 6px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .control-btn {
          min-width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.88);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0 10px;
          font-size: 13px;
          font-weight: 600;
        }

        .control-btn:hover {
          background: rgba(124,58,237,0.3);
          border-color: rgba(196,181,253,0.62);
          transform: scale(1.05);
          color: white;
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .control-btn.primary {
          background: rgba(124,58,237,0.15);
          border-color: rgba(124,58,237,0.25);
          color: #A78BFA;
        }

        .control-btn.primary:hover {
          background: rgba(124,58,237,0.25);
        }

        /* Modal buttons at bottom - INSIDE CARD */
        .modal-actions {
          display: flex;
          gap: 12px;
          width: 100%;
          justify-content: center;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .modal-btn {
          padding: 10px 28px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
          justify-content: center;
        }

        .modal-btn:hover {
          transform: scale(1.04);
        }

        .modal-btn:active {
          transform: scale(0.96);
        }

        .modal-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .modal-btn.save-logo {
          background: linear-gradient(135deg, #7C3AED, #6D28D9);
          color: white;
          box-shadow: 0 8px 30px rgba(124,58,237,0.3);
        }

        .modal-btn.save-logo:hover {
          box-shadow: 0 12px 40px rgba(124,58,237,0.4);
        }

        .modal-btn.cancel {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .modal-btn.cancel:hover {
          background: rgba(124,58,237,0.28);
          border-color: rgba(196,181,253,0.55);
          color: white;
        }

        .modal-hint {
          color: rgba(255,255,255,0.2);
          font-size: 0.55rem;
          text-align: center;
          flex-shrink: 0;
        }

        /* Logo buttons - space between buttons and name */
        .logo-buttons-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          width: 100%;
        }

        .logo-buttons {
          display: flex;
          gap: 8px;
        }

        .logo-btn {
          padding: 5px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.9);
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .logo-btn:hover {
          background: rgba(124,58,237,0.28);
          border-color: rgba(196,181,253,0.55);
          transform: scale(1.05);
          color: white;
        }

        .logo-btn.update-btn {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.2);
          color: #6EE7B7;
        }

        .logo-btn.update-btn:hover {
          background: rgba(16, 185, 129, 0.2);
        }

        .logo-btn.manage-btn {
          background: rgba(124, 58, 237, 0.12);
          border-color: rgba(124, 58, 237, 0.2);
          color: #A78BFA;
        }

        .logo-btn.manage-btn:hover {
          background: rgba(124, 58, 237, 0.2);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .profile-container { padding: 12px; }
          .profile-card { padding: 20px; border-radius: 24px; max-width: 100%; }
          .profile-avatar { width: 90px; height: 90px; font-size: 2.2rem; }
          .name-title h2 { font-size: 1.5rem; }
          .modal-content { padding: 18px; border-radius: 22px; max-width: 95%; }
          .modal-image-container { width: 280px; height: 280px; max-width: 75vw; max-height: 45vh; }
          .view-modal-image-container { width: 350px; height: 350px; max-width: 80vw; max-height: 55vh; }
          .control-btn { min-width: 36px; height: 36px; font-size: 12px; padding: 0 8px; }
          .modal-btn { padding: 8px 20px; font-size: 0.8rem; min-width: 90px; }
        }

        @media (max-width: 480px) {
          .profile-container { padding: 8px; }
          .profile-card { padding: 16px; border-radius: 20px; }
          .profile-avatar { width: 80px; height: 80px; font-size: 1.8rem; }
          .name-title h2 { font-size: 1.3rem; }
          .modal-content { padding: 14px; border-radius: 18px; gap: 10px; max-width: 98%; }
          .modal-image-container { width: 220px; height: 220px; max-width: 70vw; max-height: 40vh; }
          .view-modal-image-container { width: 280px; height: 280px; max-width: 75vw; max-height: 50vh; }
          .manage-controls { padding: 6px 8px; }
          .control-btn { min-width: 32px; height: 32px; font-size: 11px; padding: 0 6px; }
          .modal-btn { padding: 6px 14px; font-size: 0.7rem; min-width: 70px; }
          .logo-btn { padding: 4px 12px; font-size: 0.65rem; }
          .logo-buttons-wrapper { gap: 8px; margin-bottom: 10px; }
          .modal-actions { padding-top: 10px; gap: 8px; }
        }
      `}</style>

      {/* ✅ ADDED: id="profile-card" for navbar navigation */}
      <div id="profile-card" className="profile-container">
        {saving && (
          <div className="saving-indicator">
            <Loader size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Saving Page...
          </div>
        )}

        {savingLogo && (
          <div className="saving-indicator" style={{ background: 'rgba(124,58,237,0.9)' }}>
            <Loader size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
            Saving Logo...
          </div>
        )}

        {/* Manage Modal - Buttons at bottom INSIDE card */}
        {showManageModal && (editData.avatar || userData.avatar) && createPortal(
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close-btn" onClick={() => setShowManageModal(false)}>
                <X size={20} />
              </button>
              
              <div 
                className="modal-image-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img 
                  src={editData.avatar || userData.avatar} 
                  alt="Profile Edit"
                  style={{
                    transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  draggable={false}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.1)',
                  pointerEvents: 'none',
                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)'
                }} />
              </div>

              <div className="manage-controls">
                <div className="controls-row">
                  <button className="control-btn" onClick={handleZoomIn} title="Zoom In">
                    <ZoomIn size={15} />
                  </button>
                  <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">
                    <ZoomOut size={15} />
                  </button>
                  <button className="control-btn primary" onClick={resetPosition} title="Reset">
                    <Move size={15} />
                  </button>
                </div>
                <div className="controls-row">
                  <button className="control-btn" onClick={moveUp} title="Up">
                    <ArrowUp size={15} />
                  </button>
                </div>
                <div className="controls-row">
                  <button className="control-btn" onClick={moveLeft} title="Left">
                    <ArrowLeft size={15} />
                  </button>
                  <button className="control-btn primary" onClick={resetPosition} title="Center" style={{ fontSize: '16px' }}>
                    ⊙
                  </button>
                  <button className="control-btn" onClick={moveRight} title="Right">
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="controls-row">
                  <button className="control-btn" onClick={moveDown} title="Down">
                    <ArrowDown size={15} />
                  </button>
                </div>
              </div>

              {/* Buttons at bottom - INSIDE modal card */}
              <div className="modal-actions">
                <button 
                  className="modal-btn save-logo" 
                  onClick={saveLogoOnly}
                  disabled={savingLogo}
                >
                  {savingLogo ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Logo
                </button>
                <button 
                  className="modal-btn cancel" 
                  onClick={() => setShowManageModal(false)}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>

              <div className="modal-hint">
                Drag or use controls • Click ⊙ to reset
              </div>
            </div>
          </div>
        , document.body)}

        {/* View Modal */}
        {showImageModal && displayAvatar && !isEditing && createPortal(
          <div className="modal-overlay" onClick={closeImageModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeImageModal}>
                <X size={20} />
              </button>
              
              <div className="view-modal-image-container">
                <img 
                  src={displayAvatar} 
                  alt="Profile"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        , document.body)}

        {/* Profile Card */}
        <div className="profile-card">
          <div style={{
            position: 'absolute',
            top: '-80px', right: '-80px',
            width: '200px', height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-80px', left: '-80px',
            width: '180px', height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'pulse 4s ease-in-out infinite 2s'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
            
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
            
            {noDataFound && !isEditing && !loading && (
              <div className="no-data-message">
                📝 No profile data found. Click Edit to add your details.
              </div>
            )}
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {isEditing && (
                <button 
                  onClick={handleCancel} 
                  style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.88)',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={saving}
                >
                  <X size={18} />
                </button>
              )}
              <button 
                onClick={handleEditToggle} 
                style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: isEditing ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)',
                  border: isEditing ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(124,58,237,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: isEditing ? '#6EE7B7' : '#A78BFA',
                  transition: 'all 0.3s ease'
                }}
                disabled={saving}
              >
                {isEditing ? <Save size={18} /> : <Edit3 size={18} />}
              </button>
            </div>

            {/* Avatar Section */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              marginBottom: '1.5rem',
              padding: '1.5rem',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(124,58,237,0.08))',
              borderRadius: '24px',
              border: '1px solid rgba(196,181,253,0.2)',
            }}>
              <div className="avatar-wrapper" style={{ position: 'relative', marginBottom: '10px' }}>
                <div style={{
                  position: 'absolute', inset: '-5px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))',
                  filter: 'blur(12px)',
                  opacity: 0.6
                }} />
                <div 
                  onClick={!isEditing && displayAvatar ? openImageModal : undefined}
                  className="profile-avatar"
                  style={{
                    background: displayAvatar ? 'transparent' : 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))',
                    cursor: !isEditing && displayAvatar ? 'pointer' : 'default',
                  }}
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Profile" draggable={false} />
                  ) : (
                    'AK'
                  )}
                  {isEditing && (
                    <label className="avatar-hover-overlay" style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      cursor: 'pointer',
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'all 0.3s ease',
                      opacity: 0,
                      gap: '4px',
                      zIndex: 2
                    }}>
                      <Camera size={24} color="white" />
                      <span style={{ fontSize: '0.55rem', color: 'white', fontWeight: '600' }}>Change</span>
                      <input type="file" accept="image/*" hidden onChange={handleUpdateImage} />
                    </label>
                  )}
                  {!isEditing && displayAvatar && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '50%',
                      opacity: 0,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1
                    }}>
                      <Maximize size={28} color="white" />
                    </div>
                  )}
                </div>
              </div>

              <style>{`
                .avatar-wrapper:hover .avatar-hover-overlay { opacity: 1 !important; }
                .avatar-wrapper:hover div:last-child { opacity: 1 !important; }
              `}</style>

              {/* Logo controls are available only in edit mode. */}
              {isEditing && (
                <div className="logo-buttons-wrapper">
                  <div className="logo-buttons">
                    <label className="logo-btn update-btn">
                      <Camera size={13} /> Update
                      <input type="file" accept="image/*" hidden onChange={handleUpdateImage} />
                    </label>
                    <button className="logo-btn manage-btn" onClick={handleManageImage} disabled={!displayAvatar}>
                      <Move size={13} /> Manage
                    </button>
                  </div>
                </div>
              )}

              {/* Name & Title */}
              <div className="name-title" style={{ width: '100%', textAlign: 'center' }}>
                {isEditing ? (
                  <>
                    <input className="edit-input" value={data.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter Name" style={{ fontSize: '1.4rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.4rem' }} />
                    <input className="edit-input" value={data.profession} onChange={(e) => handleChange('profession', e.target.value)} placeholder="Enter Profession" style={{ fontSize: '0.8rem', textAlign: 'center' }} />
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', marginBottom: '0.3rem', letterSpacing: '-0.02em' }}>
                      {data.name || 'No Name'}
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '10px', 
                        background: 'rgba(124,58,237,0.15)', 
                        border: '1px solid rgba(124,58,237,0.15)',
                        color: '#A78BFA', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        letterSpacing: '0.02em'
                      }}>
                        <Briefcase size={14} color="#A78BFA" /> {data.profession || 'No Profession'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', marginBottom: '1.5rem' }} />

            {/* Contact Information */}
            <h3 style={{
              fontSize: '0.7rem', fontWeight: '700', color: '#D8C7FF',
              textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem'
            }}>
              <Globe size={14} color="#C4B5FD" /> Contact Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              
              <InfoRow icon={<InstagramIcon />} iconBg="linear-gradient(45deg, #833AB4, #FD1D1D, #F77737, #FCAF45)" label="Instagram" value={data.instagram} isEditing={isEditing} onChange={(v) => handleChange('instagram', v)}>
                <CopyBtn onClick={() => handleCopy(data.instagram || 'Not set', 'ig')} copied={copiedField === 'ig'} />
                {data.instagram && (
                  <a href={`https://instagram.com/${data.instagram}`} target="_blank" rel="noopener noreferrer" style={linkBtn}><ExternalLink size={13} color="rgba(255,255,255,0.4)" /></a>
                )}
              </InfoRow>

              <InfoRow icon={<Phone size={14} color="#6EE7B7" />} iconBg="rgba(16,185,129,0.1)" label="Primary Phone" value={data.phone1} isEditing={isEditing} onChange={(v) => handleChange('phone1', v)}>
                <CopyBtn onClick={() => handleCopy(data.phone1 || 'Not set', 'p1')} copied={copiedField === 'p1'} />
              </InfoRow>

              <InfoRow icon={<Phone size={14} color="#6EE7B7" />} iconBg="rgba(16,185,129,0.1)" label="Secondary Phone" value={data.phone2} isEditing={isEditing} onChange={(v) => handleChange('phone2', v)}>
                <CopyBtn onClick={() => handleCopy(data.phone2 || 'Not set', 'p2')} copied={copiedField === 'p2'} />
              </InfoRow>

              <InfoRow icon={<Mail size={14} color="#FCD34D" />} iconBg="rgba(251,191,36,0.08)" label="Email" value={data.email1} isEditing={isEditing} onChange={(v) => handleChange('email1', v)}>
                <CopyBtn onClick={() => handleCopy(data.email1 || 'Not set', 'e1')} copied={copiedField === 'e1'} />
              </InfoRow>

              <InfoRow icon={<Mail size={14} color="#FCD34D" />} iconBg="rgba(251,191,36,0.08)" label="Email 2" value={data.email2} isEditing={isEditing} onChange={(v) => handleChange('email2', v)}>
                <CopyBtn onClick={() => handleCopy(data.email2 || 'Not set', 'e2')} copied={copiedField === 'e2'} />
              </InfoRow>

              <div className="info-row-hover" style={{
                padding: '0.7rem 0.9rem', borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', gap: '0.8rem', width: '100%' }}>
                  <div style={{ ...iconBoxStyle, background: 'rgba(236,72,153,0.08)', flexShrink: 0 }}>
                    <MapPin size={14} color="#F9A8D4" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', marginBottom: '0.15rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Address</div>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <input className="edit-input" value={data.address.street} onChange={(e) => handleAddressChange('street', e.target.value)} placeholder="Street" style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }} />
                        <input className="edit-input" value={data.address.city} onChange={(e) => handleAddressChange('city', e.target.value)} placeholder="City" style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }} />
                        <input className="edit-input" value={data.address.taluka} onChange={(e) => handleAddressChange('taluka', e.target.value)} placeholder="Taluka" style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }} />
                        <input className="edit-input" value={data.address.district} onChange={(e) => handleAddressChange('district', e.target.value)} placeholder="District" style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }} />
                        <input className="edit-input" value={data.address.state} onChange={(e) => handleAddressChange('state', e.target.value)} placeholder="State" style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }} />
                        <input className="edit-input" value={data.address.pincode} onChange={(e) => handleAddressChange('pincode', e.target.value)} placeholder="Pincode" style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }} />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', lineHeight: '1.6', letterSpacing: '0.01em' }}>
                        {data.address.street || 'No street'}<br />
                        {data.address.city || 'No city'}, {data.address.taluka || 'No taluka'}<br />
                        {data.address.district || 'No district'}, {data.address.state || 'No state'}
                        {data.address.pincode && (
                          <span style={{ display: 'inline-block', marginTop: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: '600' }}>{data.address.pincode}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <CopyBtn onClick={() => handleCopy(`${data.address.street || ''}, ${data.address.city || ''}, ${data.address.taluka || ''}, ${data.address.district || ''}, ${data.address.state || ''} ${data.address.pincode || ''}`, 'addr')} copied={copiedField === 'addr'} />
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const InfoRow = ({ icon, iconBg, label, value, isEditing, onChange, children }) => (
  <div className="info-row-hover" style={{
    padding: '0.7rem 0.9rem', borderRadius: '14px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(125,211,252,0.28)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '0.5rem',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
      <div style={{ ...iconBoxStyle, background: iconBg, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.68)', fontWeight: '600', marginBottom: '0.15rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
        {isEditing ? (
          <input className="edit-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${label}`} style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }} />
        ) : (
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#FFFFFF', letterSpacing: '0.01em' }}>{value || 'Not set'}</div>
        )}
      </div>
    </div>
    <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>{children}</div>
  </div>
);

const CopyBtn = ({ onClick, copied }) => (
  <button onClick={onClick} style={{
    width: '28px', height: '28px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(125,211,252,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s ease',
    color: 'rgba(255,255,255,0.82)'
  }}>
    {copied ? <Check size={13} color="#6EE7B7" /> : <Copy size={13} />}
  </button>
);

const iconBoxStyle = {
  width: '34px', height: '34px', borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
};

const linkBtn = {
  width: '28px', height: '28px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.18)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  textDecoration: 'none', transition: 'all 0.2s ease',
  color: 'rgba(255,255,255,0.82)'
};

export default ProfileCard;
