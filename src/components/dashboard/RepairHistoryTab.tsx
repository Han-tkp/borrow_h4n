import React from 'react';

interface RepairHistoryTabProps {
    userId: string;
}

const RepairHistoryTab: React.FC<RepairHistoryTabProps> = ({ userId }) => {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">ประวัติการซ่อมของฉันสำหรับผู้ใช้: {userId}</h2>
            <p>เนื้อหาประวัติการซ่อมจะแสดงที่นี่</p>
        </div>
    );
};

export default RepairHistoryTab;