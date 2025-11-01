import React from 'react';

interface Props {
    onConfirm: () => void;
    onCancel: () => void;
}

const ReactivateUserModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
    return (
        <div>
            <p className="mb-4">มีผู้ใช้ที่มีอีเมลนี้อยู่แล้วและถูกลบไป คุณต้องการเปิดใช้งานบัญชีนี้อีกครั้งหรือไม่?</p>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 text-sm">ยกเลิก</button>
                <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm">เปิดใช้งาน</button>
            </div>
        </div>
    );
};

export default ReactivateUserModal;
