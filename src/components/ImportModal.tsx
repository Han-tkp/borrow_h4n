import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import catImage from '../img/cat.jpeg';
import { importEquipment } from '../api/firestoreApi'; // Import importEquipment

// Helper function to get row values with case-insensitive and trimmed keys
const getRowValue = (row, keyMap) => {
    const rowKeys = Object.keys(row).map(k => k.trim().toLowerCase());
    for (const key of keyMap) {
        const rowIndex = rowKeys.indexOf(key.toLowerCase());
        if (rowIndex !== -1) {
            return row[Object.keys(row)[rowIndex]];
        }
    }
    return undefined;
};

const ImportModal = ({ onSuccess, onClose }) => {
    const [activeTab, setActiveTab] = useState('csv');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelectClick = (type: string) => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = `.${type}, .xls, .xlsx`;
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        const fileType = file.name.split('.').pop()?.toLowerCase();

        reader.onload = async (event) => {
            const fileData = event.target?.result;
            let importedData: any[] = [];
            let parseError = false;

            try {
                if (fileType === 'csv') {
                    const text = fileData as string;
                    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                    const dataLines = lines[0].toLowerCase().includes('name,serial') ? lines.slice(1) : lines;
                    importedData = dataLines.map(line => {
                        const values = line.split(',').map(v => v.trim());
                        return { name: values[0], serial: values[1], type: values[2], department: values[3], price: Number(values[4]) || 0, notes: values[5], status: values[6] || 'available' };
                    });
                } else if (fileType === 'xlsx' || fileType === 'xls') {
                    const workbook = XLSX.read(fileData, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    
                    importedData = json.map((row: any) => ({
                        name: getRowValue(row, ['name', 'ชื่ออุปกรณ์']),
                        serial: getRowValue(row, ['serial', 'เลขที่หรือรหัส']),
                        type: getRowValue(row, ['type', 'ประเภท']),
                        department: getRowValue(row, ['department', 'หน่วยงาน', 'ใช้ประจำที่']),
                        price: Number(getRowValue(row, ['price', 'ราคา'])) || 0,
                        notes: getRowValue(row, ['notes', 'หมายเหตุ']) || '',
                        status: getRowValue(row, ['status', 'สถานะ']) || 'available'
                    })).filter(item => item.name && item.serial); // Filter out empty rows
                }

                if (parseError || importedData.length === 0) {
                    alert('ไม่สามารถประมวลผลไฟล์ได้ หรือไม่พบข้อมูลในไฟล์ โปรดตรวจสอบรูปแบบและชื่อคอลัมน์ในไฟล์อีกครั้ง');
                    return;
                }

                const confirmation = window.confirm(`พบข้อมูล ${importedData.length} รายการจากไฟล์ ${file.name}\n\nต้องการนำเข้าข้อมูลเหล่านี้หรือไม่?`);
                if (confirmation) {
                    await importEquipment(importedData);
                    alert(`นำเข้า ${importedData.length} รายการสำเร็จ!`);
                    onSuccess();
                    onClose();
                }

            } catch (error) {
                console.error("Error parsing or importing file:", error);
                alert('เกิดข้อผิดพลาดในการอ่านหรือนำเข้าไฟล์ โปรดตรวจสอบรูปแบบไฟล์ให้ถูกต้อง');
            }
        };

        if (fileType === 'xlsx' || fileType === 'xls') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
        
        e.target.value = '';
    };

    const csvExample = `เครื่องพ่น ULV,SN-123,เครื่องพ่น,ศตม.,5000,หมายเหตุ,available`;

    return (
        <div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} />
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('csv')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'csv' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        CSV
                    </button>
                    <button onClick={() => setActiveTab('excel')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'excel' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Excel
                    </button>
                </nav>
            </div>

            <div className="pt-6">
                {activeTab === 'csv' && (
                    <div className="space-y-4">
                        <h4 className="font-semibold">รูปแบบไฟล์ CSV</h4>
                        <p className="text-sm text-gray-600">ไฟล์ต้องมีคอลัมน์เรียงตามลำดับ (ไม่ต้องมีหัวข้อก็ได้):</p>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded">name, serial, type, department, price, notes, status</p>
                        <h5 className="font-semibold text-sm">ตัวอย่าง:</h5>
                        <pre className="text-xs bg-gray-100 p-3 rounded">{csvExample}</pre>
                        <img src={catImage} alt="Example Placeholder" className="w-32 h-32 object-cover rounded-lg"/>
                        <button onClick={() => handleFileSelectClick('csv')} className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">เลือกไฟล์ .csv</button>
                    </div>
                )}
                {activeTab === 'excel' && (
                     <div className="space-y-4">
                        <h4 className="font-semibold">รูปแบบไฟล์ Excel</h4>
                        <p className="text-sm text-gray-600">ไฟล์ Excel ควรมีหัวข้อคอลัมน์ (Header) เป็นภาษาไทยหรืออังกฤษก็ได้ ดังนี้:</p>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded">name (ชื่ออุปกรณ์), serial (เลขที่หรือรหัส), type (ประเภท), department (หน่วยงาน), price (ราคา), notes (หมายเหตุ), status (สถานะ)</p>
                        <img src={catImage} alt="Example Placeholder" className="w-32 h-32 object-cover rounded-lg"/>
                        <button onClick={() => handleFileSelectClick('xlsx')} className="mt-4 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">เลือกไฟล์ .xlsx หรือ .xls</button>
                    </div>
                )}
            </div>
        </div>  
    );
};

export default ImportModal;

