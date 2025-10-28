import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth } from './api/firebase';
import { getUserProfile, createUserProfile } from './api/firestoreApi';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import Toast from './components/Toast';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import EquipmentShowcase from './components/EquipmentShowcase';

const AppContext = createContext<any>(null);

const App = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);
    const [modalTitle, setModalTitle] = useState('');
    const navigate = useNavigate();

    const showModal = (title: string, content: React.ReactNode) => {
        setModalTitle(title);
        setModalContent(content);
        setIsModalOpen(true);
    };

    const hideModal = () => {
        setIsModalOpen(false);
        setModalTitle('');
        setModalContent(null);
    };

    useEffect(() => {
        console.log('Auth listener effect is running.');
                const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
                    console.log('onAuthStateChanged callback fired.');
                    if (firebaseUser) {
                        console.log('User is signed in:', firebaseUser.uid);
                        let userProfile = await getUserProfile(firebaseUser.uid);
        
                                        if (!userProfile) {
                                            console.log('No profile found, creating new one...');
                                            const specialRoles: { [key: string]: string } = {
                                                'admin@nrt.web.app': 'admin',
                                                'approver@nrt.web.app': 'approver',
                                                'tech@nrt.web.app': 'technician',
                                                'user@nrt.web.app': 'user'
                                            };
                                            const role = specialRoles[firebaseUser.email!] || 'user';
                                            
                                            // Staff accounts are activated immediately, others need approval.
                                            const status = ['admin', 'approver', 'technician'].includes(role) ? 'active' : 'pending_approval';
                        
                                            const newUserProfile = { name: firebaseUser.displayName, email: firebaseUser.email, role: role, status: status };
                                            await createUserProfile(firebaseUser.uid, newUserProfile);
                        
                                            // If approval is needed, sign out and alert the user.
                                            if (status === 'pending_approval') {
                                                alert('ลงทะเบียนสำเร็จ! บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ');
                                                auth.signOut();
                                                setLoading(false);
                                                return; // Stop execution for this user
                                            }
                        
                                            // If user was auto-activated, proceed to log them in.
                                            console.log('Staff account auto-activated.');
                                            setUser({ uid: firebaseUser.uid, ...newUserProfile });
                                            navigate('/dashboard');
                                            setLoading(false);
                                            return; // Stop execution to prevent hitting the logic below
                                        }        
                                                        // If profile exists, check its status
                                                        const specialRoles = ['admin', 'approver', 'technician'];                                        if (userProfile.status !== 'active' && specialRoles.includes(userProfile.role)) {
                                            console.log('Found staff account with inactive status. Activating now...');
                                            await updateUser(firebaseUser.uid, { status: 'active' });
                                            userProfile.status = 'active'; // Update local object for this session
                                        }
                        
                                        if (userProfile.status === 'active') {
                                            console.log('User is active, navigating to dashboard.');
                                            setUser({ uid: firebaseUser.uid, ...userProfile });
                                            navigate('/dashboard');
                                        } else if (userProfile.status === 'pending_approval') {
                                            alert('บัญชีของคุณกำลังรอการอนุมัติ');
                                            auth.signOut();
                                        } else {
                                            alert('บัญชีของคุณถูกระงับหรือถูกลบ');
                                            auth.signOut();
                                        }        
                    } else {
                        console.log('User is signed out.');
                        setUser(null);
                        navigate('/');
                    }
                    setLoading(false);
                    console.log('Finished auth state change, loading is false.');
                });
        return () => unsubscribe();
    }, []); // <-- Dependency array changed to empty

    const handleLogout = () => {
        auth.signOut();
    };

    console.log(`State before render: loading=${loading}, user=${JSON.stringify(user)}`);

    if (loading) {
        return <div className="text-center p-12 text-white">Loading Application...</div>;
    }

    return (
        <AppContext.Provider value={{ user, handleLogout, showModal, hideModal }}>
            <div className="min-h-screen bg-grad text-white transition-all duration-300">
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/equipment" element={<EquipmentShowcase />} />
                        <Route path="/dashboard" element={user ? <Dashboard userRole={user.role} /> : <LoginPage />} />
                    </Routes>
                </main>
                <Sidebar />
                <Modal isOpen={isModalOpen} title={modalTitle} onClose={hideModal}>
                    {modalContent}
                </Modal>
                <Toast />
                <Footer />
            </div>
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
export default App;