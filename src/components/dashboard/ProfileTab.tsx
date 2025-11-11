import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUser } from '../../api/firestoreApi';
import { useAppContext } from '../../context/AppContext';

const ProfileTab = () => {
    const { user, showToast } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        department: '',
        agencyAddress: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getUserProfile(user.uid)
                .then(profile => {
                    if (profile) {
                        setFormData({
                            name: profile.name || '',
                            email: profile.email || '',
                            phoneNumber: profile.phoneNumber || '',
                            department: profile.department || '',
                            agencyAddress: profile.agencyAddress || ''
                        });
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch user profile:", err);
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
        try {
            const { email, ...updateData } = formData; // Exclude email from update data
            await updateUser(user.uid, updateData);
            showToast('Success', 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
        } catch (err) {
            showToast('Error', 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="tab-content">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--text-color-dark)] mb-4">ข้อมูลส่วนตัว</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
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
                        <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                            disabled
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
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileTab;
