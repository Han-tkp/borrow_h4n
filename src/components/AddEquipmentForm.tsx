import React, { useState } from 'react';
import { addEquipment, uploadEquipmentTypeImage } from '../api/firestoreApi';
import { useAppContext } from '../App';

const AddEquipmentForm = ({ onSuccess }) => {
    const { hideModal } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        serial: '',
        type: '',
        department: '',
        price: '',
        notes: '',
        status: 'available'
    });
    const [typeImageFile, setTypeImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'price') {
            if (/^\d*\.?\d*$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTypeImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setTypeImageFile(e.target.files[0]);
        } else {
            setTypeImageFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const equipmentData = {
                ...formData,
                price: parseFloat(formData.price) || 0
            };
            const equipmentId = await addEquipment(equipmentData);
            if (typeImageFile) {
                await uploadEquipmentTypeImage(formData.type, typeImageFile);
            }
            alert('เพิ่มอุปกรณ์เรียบร้อยแล้ว');
            onSuccess(); // Callback to refresh the equipment list
            hideModal();
        } catch (err) {
            console.error("Failed to add equipment:", err);
            alert('เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="ชื่ออุปกรณ์" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="serial" value={formData.serial} onChange={handleChange} placeholder="Serial Number" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="type" value={formData.type} onChange={handleChange} placeholder="ประเภท" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="department" value={formData.department} onChange={handleChange} placeholder="หน่วยงาน" required className="w-full px-3 py-2 border rounded-lg" />
            <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="ราคา" required className="w-full px-3 py-2 border rounded-lg" />
            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                <option value="available">ว่าง</option>
                <option value="borrowed">ถูกยืม</option>
                <option value="under_maintenance">ซ่อมบำรุง</option>
                <option value="pending_repair_approval">รออนุมัติซ่อม</option>
                <option value="deleted">ถูกลบ</option>
            </select>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="หมายเหตุ" className="w-full px-3 py-2 border rounded-lg"></textarea>
            <div>
                <label className="block text-sm font-medium text-gray-700">รูปภาพสำหรับประเภทอุปกรณ์นี้ (ไม่บังคับ)</label>
                <input type="file" accept="image/*" onChange={handleTypeImageFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={hideModal} className="px-4 py-2 rounded-lg bg-slate-200">ยกเลิก</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </div>
        </form>
    );
};

export default AddEquipmentForm;