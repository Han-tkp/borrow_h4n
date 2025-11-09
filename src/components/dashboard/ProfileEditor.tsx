
import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUser } from '../../api/firestoreApi';
import { useAppContext } from '../../App';

const ProfileEditor = ({ onSuccess }) => {
    const { user, hideModal } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        department: '',
        agencyAddress: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setLoading(true);
            getUserProfile(user.uid)
                .then(profile => {
                    if (profile) {
                        setFormData({
                            name: profile.name || '',
                            phoneNumber: profile.phoneNumber || '',
                            department: profile.department || '',
                            agencyAddress: profile.agencyAddress || ''
                        });
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch user profile:", err);
                    setError('Failed to load profile data.');
                    setLoading(false);
                });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await updateUser(user.uid, formData);
            alert('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
            onSuccess();
        } catch (err) {
            setError(err.message);
            alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.name) {
        return <p>Loading profile...</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <h3 className="text-lg font-semibold">แก้ไขข้อมูลส่วนตัว</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อ-สกุล</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">เบอร์โทร</label>
                <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">หน่วยงาน</label>
                <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">ที่อยู่หน่วยงาน</label>
                <input
                    type="text"
                    name="agencyAddress"
                    value={formData.agencyAddress}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={hideModal} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">ยกเลิก</button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={loading}
                >
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </div>
        </form>
    );
};

export default ProfileEditor;
