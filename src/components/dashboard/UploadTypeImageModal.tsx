import React, { useState, useEffect } from 'react';
import { getEquipmentTypes, uploadEquipmentTypeImage } from '../../api/firestoreApi';
import { db } from '../../api/firebase'; // Import db to fetch current image URL

interface UploadTypeImageModalProps {
    onSuccess: () => void;
    onClose: () => void;
}

const UploadTypeImageModal: React.FC<UploadTypeImageModalProps> = ({ onSuccess, onClose }) => {
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // New state for current image
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getEquipmentTypes().then(types => {
            setEquipmentTypes(types);
            if (types.length > 0) {
                setSelectedType(types[0]);
            }
        }).catch(err => {
            console.error("Error fetching equipment types:", err);
            setError('ไม่สามารถโหลดประเภทอุปกรณ์ได้');
        });
    }, []);

    // Fetch current image URL when selectedType changes
    useEffect(() => {
        if (selectedType) {
            db.collection("equipmentTypes").doc(selectedType).get()
                .then(doc => {
                    if (doc.exists) {
                        setCurrentImageUrl(doc.data()?.imageUrl || null);
                    } else {
                        setCurrentImageUrl(null);
                    }
                })
                .catch(err => console.error("Error fetching current type image:", err));
        }
    }, [selectedType]);

    // Cleanup for image preview URL
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImagePreviewUrl(URL.createObjectURL(selectedFile)); // Create preview URL
        } else {
            setFile(null);
            setImagePreviewUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedType) {
            setError('โปรดเลือกประเภทอุปกรณ์');
            return;
        }
        if (!file) {
            setError('โปรดเลือกรูปภาพที่จะอัปโหลด');
            return;
        }

        setLoading(true);
        try {
            await uploadEquipmentTypeImage(selectedType, file);
            alert(`อัปโหลดรูปภาพสำหรับประเภท ${selectedType} เรียบร้อยแล้ว`);
            
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to upload type image:", err);
            setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
                <label htmlFor="equipmentType" className="block text-sm font-medium text-gray-700">เลือกประเภทอุปกรณ์</label>
                <select
                    id="equipmentType"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                >
                    {equipmentTypes.length === 0 ? (
                        <option value="" disabled>ไม่มีประเภทอุปกรณ์</option>
                    ) : (
                        equipmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))
                    )}
                </select>
            </div>
            {currentImageUrl && !imagePreviewUrl && (
                <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">รูปภาพปัจจุบัน:</label>
                    <img src={currentImageUrl} alt="Current Image" className="max-w-full h-32 object-contain rounded-md border border-gray-300" />
                </div>
            )}
            <div>
                <label htmlFor="typeImageFile" className="block text-sm font-medium text-gray-700">เลือกรูปภาพใหม่</label>
                <input
                    type="file"
                    id="typeImageFile"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {imagePreviewUrl && (
                    <div className="mt-2">
                        <img src={imagePreviewUrl} alt="Image Preview" className="max-w-full h-32 object-contain rounded-md border border-gray-300" />
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200">ยกเลิก</button>
                <button type="submit" disabled={loading || !file} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
                    {loading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                </button>
            </div>
        </form>
    );
};

export default UploadTypeImageModal;
