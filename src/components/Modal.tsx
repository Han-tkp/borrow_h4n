import React from 'react';

const Modal = ({ isOpen, title, children, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose} // Close modal on backdrop click
        >
            <div 
                id="modalContent"
                className="bg-white rounded-2xl p-6 text-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-100"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-800">&times;</button>
                </div>
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
