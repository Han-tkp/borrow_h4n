import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-[#119EEA] to-[#763CED] text-white shadow-inner mt-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <p className="font-bold text-lg">หน่วยควบคุมโรคติดต่อนำโดยแมลงที่ 12.4.4</p>
                        <p className="text-sm mt-2 opacity-90">11 ถนนระแงะมรรคา, ต.บางนาค, อ.เมือง, จ.นราธิวาส 96000</p>
                        <p className="text-sm opacity-90">โทร: 073-514-960</p>
                    </div>
                    <div className="text-center md:text-right text-sm">
                        <p className="opacity-90">&copy; {new Date().getFullYear()} All rights reserved.</p>
                        <p className="mt-1 opacity-90">Developed with ♥ by H4n</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
