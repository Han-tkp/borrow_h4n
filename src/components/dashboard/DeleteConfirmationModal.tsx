import React, { useState } from 'react';

interface Props {
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<Props> = ({ onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
        } else {
            alert('โปรดระบุเหตุผลในการลบ');
        }
    };

    return (
        <div>
            <p className="mb-4">โปรดระบุเหตุผลในการลบผู้ใช้ (สถานะจะเปลี่ยนเป็น deleted):</p>
            <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-black"
                rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 text-sm">ยกเลิก</button>
                <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">ยืนยันการลบ</button>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
