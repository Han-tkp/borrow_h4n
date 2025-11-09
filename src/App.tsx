import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { auth } from './api/firebase';
import { getUserProfile, createUserProfile, updateUser } from './api/firestoreApi'; // Added updateUser
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar
    const navigate = useNavigate();
    const location = useLocation();

    const showToast = (type: 'Success' | 'Error', message: string) => {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.remove('hidden', 'bg-green-500', 'bg-red-500');

        if (type === 'Success') {
            toast.classList.add('bg-green-500');
        } else {
            toast.classList.add('bg-red-500');
        }

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    };

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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        console.log('Auth listener effect is running.');
                const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
                    console.log('onAuthStateChanged callback fired.');
                    if (firebaseUser) {
                        console.log('User is signed in:', firebaseUser.uid);
                        let userProfile = await getUserProfile(firebaseUser.uid);
        
                        if (userProfile) {
                            // If profile exists, check its status
                            const specialRoles = ['admin', 'approver', 'technician'];
                            if (userProfile.status !== 'active' && specialRoles.includes(userProfile.role)) {
                                console.log('Found staff account with inactive status. Activating now...');
                                await updateUser(firebaseUser.uid, { status: 'active' });
                                userProfile.status = 'active'; // Update local object for this session
                            }

                            if (userProfile.status === 'active') {
                                console.log('User is active, navigating to dashboard.');
                                // Determine if this is the main system account by email
                                const isMainAdmin = firebaseUser.email === 'admin@nrt.web.app';
                                userProfile.isMainAccount = isMainAdmin; // Add this property
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
                            // This case should ideally not be hit if profiles are created upon registration.
                            // However, as a fallback, we can sign the user out.
                            alert('ไม่พบบัญชีผู้ใช้ของคุณ โปรดติดต่อผู้ดูแลระบบ');
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
        <AppContext.Provider value={{ user, handleLogout, showModal, hideModal, showToast }}>
            <div className="min-h-screen transition-all duration-300">
                <Header toggleSidebar={toggleSidebar} />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/equipment" element={<EquipmentShowcase />} />
                        <Route path="/dashboard" element={user ? <Dashboard userRole={user.role} /> : <LoginPage />} />
                    </Routes>
                </main>
                <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
                <Modal isOpen={isModalOpen} title={modalTitle} onClose={hideModal}>
                    {modalContent}
                </Modal>
                <Toast />
                {location.pathname === '/' && <Footer />}
            </div>
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
export default App;
