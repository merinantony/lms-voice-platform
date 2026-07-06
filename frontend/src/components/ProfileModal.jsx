import { useState } from 'react';
import api from '../api';

export default function ProfileModal({ user, onClose, onProfileUpdate }) {
    const [phone, setPhone] = useState(user.phone || '');
    const [schoolName, setSchoolName] = useState(user.school_name || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    
    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [infoSuccess, setInfoSuccess] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        try {
            const response = await api.post('/profile/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            const updatedUser = response.data.user;
            localStorage.setItem('student_data', JSON.stringify(updatedUser));
            onProfileUpdate(updatedUser);
            alert('Avatar uploaded successfully!');
            setAvatarFile(null);
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert('Failed to upload image. Make sure it is less than 2MB.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setInfoSuccess('');
        try {
            const response = await api.put('/profile', {
                phone,
                school_name: schoolName
            });
            const updatedUser = response.data.user;
            localStorage.setItem('student_data', JSON.stringify(updatedUser));
            onProfileUpdate(updatedUser);
            setInfoSuccess('Profile details updated successfully!');
        } catch (error) {
            console.error('Profile info update error:', error);
            alert('Failed to update profile details.');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        try {
            await api.put('/profile/password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword
            });
            setPasswordSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Password change error:', error);
            if (error.response?.data?.errors?.current_password) {
                setPasswordError(error.response.data.errors.current_password[0]);
            } else if (error.response?.data?.errors?.new_password) {
                setPasswordError(error.response.data.errors.new_password[0]);
            } else {
                setPasswordError('Current password is incorrect or values are invalid.');
            }
        }
    };

    const avatarUrl = user.avatar_url 
        ? (user.avatar_url.startsWith('http') ? user.avatar_url : `http://127.0.0.1:8000${user.avatar_url}`)
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 relative my-8">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl transition"
                    title="Close"
                >
                    ✕
                </button>
                <h3 className="text-xl font-black text-white mb-6 border-b border-slate-800 pb-3">Edit Profile</h3>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Avatar Upload Block */}
                    <div className="flex flex-col items-center border-b border-slate-800 pb-6">
                        <div className="relative w-24 h-24 mb-4 select-none">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover rounded-full border-2 border-indigo-500" />
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full border-2 border-indigo-500" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black font-serif border-2 border-indigo-400">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center space-x-3 text-sm">
                            <label className="cursor-pointer bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white px-4 py-2 rounded-xl font-bold border border-slate-700 transition">
                                Choose Photo
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                            </label>
                            {avatarFile && (
                                <button
                                    onClick={handleAvatarUpload}
                                    disabled={uploadingAvatar}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md"
                                >
                                    {uploadingAvatar ? 'Uploading...' : 'Save Photo'}
                                </button>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2">JPEG or PNG. Max size 2MB.</span>
                    </div>

                    {/* Profile Information Form */}
                    <form onSubmit={handleInfoSubmit} className="space-y-4 border-b border-slate-800 pb-6">
                        <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-2">School & Contact details</h4>
                        {infoSuccess && (
                            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs px-3 py-2 rounded-xl">
                                {infoSuccess}
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone Number</label>
                                <input 
                                    type="tel"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">School Name</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    placeholder="Enter your school name"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition"
                        >
                            Save School Details
                        </button>
                    </form>

                    {/* Password reset form */}
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 pb-2">
                        <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-2">Change Password</h4>
                        
                        {passwordError && (
                            <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs px-3 py-2 rounded-xl">
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs px-3 py-2 rounded-xl">
                                {passwordSuccess}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Current Password</label>
                            <input 
                                type="password"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Password</label>
                                <input 
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Confirm New Password</label>
                                <input 
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2.5 bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold rounded-xl transition shadow-md"
                        >
                            Reset Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
