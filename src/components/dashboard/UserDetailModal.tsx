import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../../api/firestoreApi';
import { roleMap } from '../../utils/helpers';

interface UserDetailModalProps {
    userId: string;
    onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, onClose }) => {
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const profile = await getUserProfile(userId);
                setUserProfile(profile);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
            setLoading(false);
        };

        fetchUserProfile();
    }, [userId]);

    if (loading) {
        return <div className="p-4 text-center">กำลังโหลดข้อมูลผู้ใช้...</div>;
    }

    if (!userProfile) {
        return <div className="p-4 text-center text-red-600">ไม่พบข้อมูลผู้ใช้</div>;
    }

    return (
        <div className="p-4 text-slate-800">
            <h3 className="text-lg font-semibold mb-4">รายละเอียดผู้ใช้</h3>
            <div className="space-y-2 text-sm">
                <p><strong>ชื่อ:</strong> {userProfile.name || 'N/A'}</p>
                <p><strong>อีเมล:</strong> {userProfile.email || 'N/A'}</p>
                <p><strong>บทบาท:</strong> {roleMap[userProfile.role] || userProfile.role || 'N/A'}</p>
                <p><strong>หน่วยงาน:</strong> {userProfile.agency || 'N/A'}</p>
                <p><strong>ที่อยู่:</strong> {userProfile.address || 'N/A'}</p>
                <p><strong>สถานะ:</strong> {userProfile.status === 'active' ? 'ใช้งาน' : userProfile.status === 'deleted' ? 'ถูกลบ' : userProfile.status || 'N/A'}</p>
                <p><strong>เบอร์โทรศัพท์:</strong> {userProfile.phone_number || 'N/A'}</p>
                <p><strong>ID ผู้ใช้:</strong> <code className="font-mono">{userProfile.uid || 'N/A'}</code></p>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">ปิด</button>
            </div>
        </div>
    );
};

export default UserDetailModal;
