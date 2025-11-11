import { db, auth, storage } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    startAfter,
    documentId,
    WriteBatch,
    Query,
    QueryDocumentSnapshot,
    DocumentData,
    setDoc
} from 'firebase/firestore';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser as deleteAuthUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './firebase';

// --- Helper --- //
export const logAdminActivity = (batch: WriteBatch, action: string, details: any) => {
    const logRef = doc(collection(db, 'activityLog'));
    const currentUser = auth.currentUser; // Get current user here

    const logData: any = {
        action,
        timestamp: serverTimestamp(),
        ...details,
    };

    // If a specific user_id is provided in details, use it for filtering
    if (details.user_id) {
        logData.user_id = details.user_id;
    }

    // If an admin/current user is logged in, log their ID and name
    if (currentUser) {
        logData.adminId = currentUser.uid;
        logData.adminName = currentUser.displayName || currentUser.email;
    }

    batch.set(logRef, logData);
};

// --- User Profile --- //
export const getUserProfile = async (uid: string) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
};

export const createUserProfile = (uid: string, data: any) => {
    const batch = writeBatch(db);
    const userRef = doc(db, "users", uid);
    batch.set(userRef, {
        uid,
        ...data,
        createdAt: serverTimestamp()
    });
    return batch.commit();
};

// --- Equipment --- //
export const getEquipmentList = async (filters: { q?: string, f?: string, t?: string, includeDeleted?: boolean } = {}) => {
    const { q, f, t, includeDeleted } = filters;
    
    const queryConstraints = [];
    if (f && f !== 'all') {
        queryConstraints.push(where("status", "==", f));
    } else if (!includeDeleted) { // Default behavior: exclude deleted items unless explicitly requested
        queryConstraints.push(where("status", "!=", "deleted"));
    }
    if (t) {
        queryConstraints.push(where("type", "==", t));
    }
    
    const equipmentQuery = query(collection(db, "equipment"), ...queryConstraints);

    const [equipmentSnapshot, typesSnapshot] = await Promise.all([
        getDocs(equipmentQuery),
        getDocs(collection(db, "equipmentTypes")) // Fetch all equipment types
    ]);

    const typeImageMap = new Map();
    typesSnapshot.docs.forEach(doc => {
        typeImageMap.set(doc.id, doc.data().imageUrl);
    });

    let equipmentList = equipmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        typeImageUrl: typeImageMap.get(doc.data().type) || null // Add typeImageUrl
    }));

    if (q) {
        const lowerCaseQuery = q.toLowerCase();
        equipmentList = equipmentList.filter(e =>
            (e.name?.toLowerCase().includes(lowerCaseQuery)) ||
            (e.serial?.toLowerCase().includes(lowerCaseQuery)) ||
            (e.type?.toLowerCase().includes(lowerCaseQuery))
            );
    }
    return equipmentList;
};

export const getEquipmentTypes = async () => {
    const snapshot = await getDocs(collection(db, 'equipment'));
    const types = snapshot.docs.map(doc => doc.data().type);
    return [...new Set(types)];
};


// --- User Approvals & Management --- //


export const getAllUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateUser = async (uid: string, data: any) => {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    const oldUserData = (await getDoc(userRef)).data(); // Fetch old data for logging
    batch.update(userRef, data);
    logAdminActivity(batch, 'UPDATE_USER', { uid, oldData: oldUserData, newData: data });
    return batch.commit();
};

export const deleteUser = async (uid: string, reason: string) => {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    const deletedUserData = (await getDoc(userRef)).data(); // Fetch data before deletion

    batch.update(userRef, { status: 'deleted' }); // Soft delete from Firestore

    try {
        await deleteUserFromAuth(uid); // Attempt to delete from Firebase Auth
    } catch (error: any) {
        console.warn("Could not delete user from Firebase Authentication via client-side. This typically requires Firebase Admin SDK on a backend (e.g., Cloud Function) to delete other users' auth accounts.", error.message);
        // Continue with Firestore deletion and logging even if Auth deletion fails (e.g., admin deleting another user)
    }

    logAdminActivity(batch, 'DELETE_USER', { userId: uid, email: deletedUserData?.email, name: deletedUserData?.name, reason });
    return batch.commit();
};

export const recoverUser = async (uid: string) => {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    batch.update(userRef, { status: 'active' });
    logAdminActivity(batch, 'RECOVER_USER', { userId: uid });
    return batch.commit();
};

export const deleteUserFromAuth = async (uid: string) => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
        try {
            await deleteAuthUser(currentUser);
            console.log("User successfully deleted from Firebase Authentication.");
            return true;
        } catch (error) {
            console.error("Error deleting user from Firebase Authentication:", error);
            throw error;
        }
    } else {
        // This case means an admin is trying to delete another user's auth account from client-side, which is not allowed.
        // Admin deletion of other users' auth accounts must be done via Firebase Admin SDK on the backend.
        console.warn("Attempted to delete another user's auth account from client-side. This operation is not allowed directly.");
        return false; // Indicate that auth deletion was not performed
    }
};

// --- Auth --- //

// Helper to initialize and get the secondary app instance
let secondaryApp: FirebaseApp;
const getSecondaryApp = () => {
    if (secondaryApp) {
        return secondaryApp;
    }
    const secondaryAppName = 'secondary-auth-app';
    const existingApp = getApps().find(app => app.name === secondaryAppName);
    if (existingApp) {
        secondaryApp = existingApp;
    } else {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }
    return secondaryApp;
};


export const signInWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (email, password, fullName, otherData) => {
    // This function is for PUBLIC registration.
    const app = getSecondaryApp();
    const secondaryAuth = getAuth(app);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;

        if (user) {
            await updateProfile(user, { displayName: fullName });
            // Public registration creates a user profile with 'active' status.
            await createUserProfile(user.uid, {
                name: fullName,
                email: user.email,
                role: 'user', // Public registration always defaults to 'user'
                status: 'active',
                ...otherData
            });
        }
        await secondaryAuth.signOut();
        return userCredential;
    } catch (error) {
        await secondaryAuth.signOut();
        throw error;
    }
};

export const createUserByAdmin = async (email, password, fullName, otherData) => {
    // This function is for ADMIN user creation.
    const app = getSecondaryApp();
    const secondaryAuth = getAuth(app);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;

        if (user) {
            await updateProfile(user, { displayName: fullName });

            // Create profile and log admin activity in the same batch
            const batch = writeBatch(db);
            const userRef = doc(db, "users", user.uid);
            const userData = {
                uid: user.uid,
                name: fullName,
                email: user.email,
                role: otherData.role || 'user',
                status: 'active', // Admin-created users are active by default
                createdAt: serverTimestamp(),
                ...otherData
            };
            batch.set(userRef, userData);
            logAdminActivity(batch, 'CREATE_USER', { uid: user.uid, email: userData.email, name: userData.name });
            await batch.commit();
        }
        await secondaryAuth.signOut();
        return userCredential;
    } catch (error) {
        await secondaryAuth.signOut();
        throw error;
    }
};

export const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        return reauthenticateWithCredential(user, credential);
    }
    throw new Error("User not found or email not available.");
};

// --- Equipment Management --- //
export const addEquipment = async (data: any) => {
    const batch = writeBatch(db);
    const docRef = doc(collection(db, "equipment"));
    const newData = { ...data, status: 'available', createdAt: serverTimestamp() };
    batch.set(docRef, newData);
    logAdminActivity(batch, 'ADD_EQUIPMENT', { equipmentId: docRef.id, name: data.name, serial: data.serial, type: data.type });
    await batch.commit();
    return docRef.id;
};

export const updateStatusOfMultipleEquipment = async (ids: string[], status: string) => {
    const batch = writeBatch(db);
    const affectedEquipmentDetails: any[] = [];

    for (const id of ids) {
        const docRef = doc(db, 'equipment', id);
        const oldEquipmentData = (await getDoc(docRef)).data(); // Fetch old data
        batch.update(docRef, { status });
        affectedEquipmentDetails.push({ id, oldStatus: oldEquipmentData?.status, newStatus: status, name: oldEquipmentData?.name, serial: oldEquipmentData?.serial });
    }
    logAdminActivity(batch, 'BATCH_UPDATE_STATUS', { equipmentIds: ids, count: ids.length, newStatus: status, details: affectedEquipmentDetails });
    return batch.commit();
};

export const deleteEquipment = async (id: string, reason: string) => {
    const batch = writeBatch(db);
    const docRef = doc(db, 'equipment', id);
    const deletedEquipmentData = (await getDoc(docRef)).data(); // Fetch data before deletion
    batch.update(docRef, { status: 'deleted' });
    logAdminActivity(batch, 'DELETE_EQUIPMENT', { equipmentId: id, name: deletedEquipmentData?.name, serial: deletedEquipmentData?.serial, reason });
    return batch.commit();
};

export const deleteMultipleEquipment = async (ids: string[], reason: string) => {

    const batchSize = 499; // Firestore batch limit is 500. Keep it slightly below to be safe.
    const promises: Promise<void>[] = [];
    const allDeletedEquipmentDetails: any[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        const batch = writeBatch(db);
        const deletedEquipmentDetails: any[] = [];

        for (const id of chunk) {
            const docRef = doc(db, 'equipment', id);
            const deletedData = (await getDoc(docRef)).data(); // Fetch data before deletion
            batch.update(docRef, { status: 'deleted' }); // Soft delete
            deletedEquipmentDetails.push({ id, name: deletedData?.name, serial: deletedData?.serial });
        }

        logAdminActivity(batch, 'BATCH_DELETE_EQUIPMENT', {
            equipmentIds: chunk,
            count: chunk.length,
            reason,
            details: deletedEquipmentDetails
        });
        allDeletedEquipmentDetails.push(...deletedEquipmentDetails);
        promises.push(batch.commit());
    }

    await Promise.all(promises);
    return allDeletedEquipmentDetails; // Return details of all deleted equipment
};

export const importEquipment = async (equipment: any[]) => {
    const batch = writeBatch(db);
    const importedDetails: any[] = [];

    equipment.forEach(item => {
        const docRef = doc(collection(db, 'equipment'));
        batch.set(docRef, { ...item, status: item.status || 'available', createdAt: serverTimestamp() });
        importedDetails.push({ id: docRef.id, name: item.name, serial: item.serial });
    });
    logAdminActivity(batch, 'IMPORT_EQUIPMENT', { count: equipment.length, details: importedDetails });
    return batch.commit();
};

// --- Borrow & Repair --- //
export const createBorrowRequest = async (borrowData: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not logged in.");

    const batch = writeBatch(db);
    const borrowRef = doc(collection(db, "borrows"));
    const due = new Date(borrowData.borrow_date);
    due.setDate(due.getDate() + 7);

    const newBorrowRequest = {
        ...borrowData,
        user_id: currentUser.uid,
        user_name: currentUser.displayName || currentUser.email,
        status: 'pending_borrow_approval',
        request_date: serverTimestamp(),
        due_date: due.toISOString().slice(0, 10),
    };
    batch.set(borrowRef, newBorrowRequest);
    logAdminActivity(batch, 'CREATE_BORROW_REQUEST', { borrowId: borrowRef.id, purpose: borrowData.purpose, equipmentRequests: borrowData.equipment_requests });
    return batch.commit();
};

export const getBorrowHistory = (userId: string | null, callback: (data: any[]) => void) => {
    let q: Query<DocumentData>;
    const borrowsCol = collection(db, "borrows");

    if (userId) {
        q = query(borrowsCol, where("user_id", "==", userId), orderBy("request_date", "desc"));
    } else {
        q = query(borrowsCol, orderBy("request_date", "desc"));
    }

    const unsubscribe = onSnapshot(q, snapshot => {
        const mapStatusToDisplay = (status: string) => {
            switch (status) {
                case 'pending_borrow_approval': return 'รออนุมัติ';
                case 'pending_delivery': return 'รอส่งมอบ';
                case 'borrowed': return 'กำลังยืม';
                case 'returned_pending_assessment': return 'คืนแล้ว (รอตรวจสภาพ)';
                case 'completed': return 'เสร็จสิ้น';
                case 'rejected': return 'ถูกปฏิเสธ';
                default: return status;
            }
        };

        const history = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            displayStatus: mapStatusToDisplay(doc.data().status)
        }));
        callback(history);
    });

    return unsubscribe;
};

export const getBorrowRequests = async () => {
    const q = query(collection(db, "borrows"), where("status", "==", "pending_borrow_approval"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const approveBorrow = async (borrowId: string) => {
    const batch = writeBatch(db);
    const borrowRef = doc(db, 'borrows', borrowId);

    try {
        const borrowDoc = await getDoc(borrowRef);
        if (!borrowDoc.exists()) {
            throw new Error("Borrow request not found!");
        }

        const borrowData = borrowDoc.data();
        const equipmentRequests = borrowData.equipment_requests;

        if (!equipmentRequests || equipmentRequests.length === 0) {
            throw new Error("No equipment requested in this borrow request.");
        }

        const assignedEquipmentDetails: any[] = [];

        // Find available equipment for all requested types
        for (const req of equipmentRequests) {
            const q = query(collection(db, 'equipment'),
                where('type', '==', req.type),
                where('status', '==', 'available'),
                limit(req.quantity)
            );
            const availableEquipmentQuery = await getDocs(q);

            if (availableEquipmentQuery.docs.length < req.quantity) {
                throw new Error(`ไม่พบเครื่อง ${req.type} ที่พร้อมใช้งานตามจำนวนที่ขอ (ต้องการ ${req.quantity} เครื่อง แต่ว่าง ${availableEquipmentQuery.docs.length} เครื่อง)`);
            }

            availableEquipmentQuery.docs.forEach(doc => {
                assignedEquipmentDetails.push({ id: doc.id, ...doc.data() });
            });
        }

        // 1. Update the borrow request with the assigned equipment and new status
        batch.update(borrowRef, { 
            status: "pending_delivery",
            equipment_assigned: assignedEquipmentDetails
        });

        // 2. Update the status of each assigned piece of equipment
        for (const equip of assignedEquipmentDetails) {
            const equipmentRef = doc(db, 'equipment', equip.id);
            batch.update(equipmentRef, { status: 'pending_delivery' });
        }

        logAdminActivity(batch, 'APPROVE_AND_AUTO_ASSIGN_BORROW', { 
            borrowId, 
            assignedEquipment: assignedEquipmentDetails.map(e => ({id: e.id, name: e.name, serial: e.serial}))
        });

        return batch.commit();

    } catch (error) {
        console.error("Error during auto-assignment and approval: ", error);
        // Re-throw the error to be caught by the calling function
        throw error;
    }
};

export const rejectBorrow = async (borrowId: string) => {
    const batch = writeBatch(db);
    const borrowRef = doc(db, 'borrows', borrowId);
    const borrowData = (await getDoc(borrowRef)).data();
    batch.update(borrowRef, { status: "rejected" });
    logAdminActivity(batch, 'REJECT_BORROW', { borrowId, equipmentRequests: borrowData?.equipment_requests });
    return batch.commit();
};

export const getEquipmentStatus = async (equipmentId: string): Promise<string> => {
    const equipmentDoc = await getDoc(doc(db, 'equipment', equipmentId));
    if (equipmentDoc.exists()) {
        return equipmentDoc.data()?.status || 'unknown';
    }
    throw new Error(`Equipment with ID ${equipmentId} not found.`);
};

export const updateBorrowStatus = async (borrowId: string, status: string) => {
    const batch = writeBatch(db);
    const borrowRef = doc(db, 'borrows', borrowId);
    batch.update(borrowRef, { status });
    logAdminActivity(batch, 'UPDATE_BORROW_STATUS', { borrowId, newStatus: status });
    return batch.commit();
};

export const getDeliveryQueue = async () => {
    const q = query(collection(db, "borrows"), where("status", "==", "pending_delivery"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBorrowedQueue = async () => {
    const q = query(collection(db, "borrows"), where("status", "==", "borrowed"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const processReturn = async (borrowId: string) => {
    const batch = writeBatch(db);
    const borrowRef = doc(db, 'borrows', borrowId);

    // Get the assigned equipment to copy to returned equipment
    const borrowDoc = await getDoc(borrowRef);
    const borrowData = borrowDoc.data();

    batch.update(borrowRef, { 
        status: "returned_pending_assessment",
        returned_date: serverTimestamp(),
        equipment_returned: borrowData?.equipment_assigned || [] // Copy assigned to returned
    });

    logAdminActivity(batch, 'PROCESS_RETURN', { borrowId });

    return batch.commit();
};

export const getRepairRequests = async () => {
    const q = query(collection(db, "repairs"), where("status", "==", "pending_repair_approval"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTechnicianRepairQueue = async () => {
    const q = query(collection(db, "repairs"), where("status", "in", ["repair_approved", "repair_in_progress"]));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllRepairs = async () => {
    const q = query(collection(db, "repairs"), orderBy("request_date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const approveRepair = async (repairId: string) => {
    const batch = writeBatch(db);
    const repairRef = doc(db, "repairs", repairId);
    const repairDoc = await getDoc(repairRef);
    const repairData = repairDoc.data();

    if (repairData?.equipment_id) {
        const equipmentRef = doc(db, "equipment", repairData.equipment_id);
        const equipmentData = (await getDoc(equipmentRef)).data();
        batch.update(equipmentRef, { status: 'under_maintenance' });
        batch.update(repairRef, { status: "repair_approved" });
        // The user.uid is typically the current user, or passed as an argument
        logAdminActivity(batch, 'APPROVE_REPAIR', { repairId, equipmentId: repairData.equipment_id, equipmentName: equipmentData?.name });
    } else {
        throw new Error("Repair record is missing equipment ID.");
    }
    return batch.commit();
};

export const rejectRepair = async (repairId: string) => {
    const batch = writeBatch(db);
    const repairRef = doc(db, "repairs", repairId);
    const repairDoc = await getDoc(repairRef);
    const repairData = repairDoc.data();

    if (repairData?.equipment_id) {
        const equipmentRef = doc(db, "equipment", repairData.equipment_id);
        const equipmentData = (await getDoc(equipmentRef)).data();
        batch.update(equipmentRef, { status: 'available' });
        batch.update(repairRef, { status: "repair_rejected" });
        logAdminActivity(batch, 'REJECT_REPAIR', { repairId, equipmentId: repairData.equipment_id, equipmentName: equipmentData?.name });
    } else {
        throw new Error("Repair record is missing equipment ID.");
    }
    return batch.commit();
};

// --- Reports & Other --- //
export const getReportData = async (startDate?: string, endDate?: string) => {
    // --- Date-filtered Queries ---
    let borrowsQuery: Query<DocumentData> = collection(db, "borrows");
    let repairsQuery: Query<DocumentData> = collection(db, "repairs");

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end day

        borrowsQuery = query(borrowsQuery, where('request_date', '>=', start), where('request_date', '<=', end));
        repairsQuery = query(repairsQuery, where('request_date', '>=', start), where('request_date', '<=', end));
    }

    // --- Unfiltered Queries for overall stats ---
    const allUsersQuery = getDocs(collection(db, "users"));
    const allEquipmentQuery = getDocs(collection(db, "equipment"));
    const allBorrowsQuery = getDocs(collection(db, "borrows"));
    const allRepairsQuery = getDocs(collection(db, "repairs"));
    
    const [
        borrowSnapshot,
        repairSnapshot,
        usersSnapshot,
        equipmentSnapshot,
        allBorrowsSnapshot,
        allRepairsSnapshot
    ] = await Promise.all([
        getDocs(borrowsQuery),
        getDocs(repairsQuery),
        allUsersQuery,
        allEquipmentQuery,
        allBorrowsQuery,
        allRepairsQuery
    ]);

    // --- Date-range Stats ---
    const dateRangeBorrows = borrowSnapshot.docs.map(doc => doc.data());
    const dateRangeRepairs = repairSnapshot.docs.map(doc => doc.data());
    const totalBorrowsInRange = dateRangeBorrows.length;
    const totalRepairsInRange = dateRangeRepairs.length;
    const totalRepairCostInRange = dateRangeRepairs.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
    const borrowingByTypeInRange = dateRangeBorrows.flatMap(b => b.equipment_requests || []).reduce((acc: any, req: any) => {
        acc[req.type] = (acc[req.type] || 0) + req.quantity;
        return acc;
    }, {});

    // --- Overall Stats ---
    const totalUsers = usersSnapshot.docs.length;
    const totalEquipment = equipmentSnapshot.docs.length;

    const equipmentStatusCounts = equipmentSnapshot.docs.reduce((acc, doc) => {
        const status = doc.data().status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const allBorrows = allBorrowsSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
    const allRepairs = allRepairsSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));

    const borrowsByMonth = allBorrows.reduce((acc, borrow) => {
        if (borrow.request_date) {
            const month = (borrow.request_date.toDate()).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
    }, {});

    const repairsByMonth = allRepairs.reduce((acc, repair) => {
        if (repair.request_date) {
            const month = (repair.request_date.toDate()).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
    }, {});


    return {
        // Date Range
        totalBorrows: totalBorrowsInRange,
        totalRepairs: totalRepairsInRange,
        totalRepairCost: totalRepairCostInRange,
        borrowingByType: borrowingByTypeInRange,
        // Overall
        totalUsers,
        totalEquipment,
        equipmentStatusCounts,
        borrowsByMonth,
        repairsByMonth
    };
};

export const getActivityLog = async (date?: string, isMainAccount: boolean = false, adminIdToFilter?: string | null, borrowId?: string) => {
    const queryConstraints = [];

    if (adminIdToFilter) {
        queryConstraints.push(where('adminId', '==', adminIdToFilter));
    }

    if (borrowId) {
        queryConstraints.push(where('borrowId', '==', borrowId));
    }

    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        queryConstraints.push(where('timestamp', '>=', startDate));
        queryConstraints.push(where('timestamp', '<=', endDate));
    } else {
        queryConstraints.push(limit(100)); // Default limit if no date filter
    }

    const q = query(collection(db, "activityLog"), orderBy("timestamp", "desc"), ...queryConstraints);

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Helper function for robustly clearing a collection with cursor-based pagination
const clearCollectionWithCursor = async (collectionName: string, filterFn: (doc: QueryDocumentSnapshot) => boolean = () => true) => {
    const collectionRef = collection(db, collectionName);
    let deletedCount = 0;
    let lastVisible: QueryDocumentSnapshot | null = null;

    while (true) {
        let q = query(collectionRef, orderBy(documentId()), limit(500));
        if (lastVisible) {
            q = query(q, startAfter(lastVisible));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            break;
        }

        const batch = writeBatch(db);
        let docsToDeleteInBatch = 0;
        snapshot.docs.forEach(doc => {
            if (filterFn(doc)) {
                batch.delete(doc.ref);
                docsToDeleteInBatch++;
            }
        });

        if (docsToDeleteInBatch > 0) {
            await batch.commit();
            deletedCount += docsToDeleteInBatch;
        }
        
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        
        if (snapshot.docs.length < 500) {
            break;
        }
    }
    return deletedCount;
};

const clearStorageFolder = async (path: string) => {
    const folderRef = ref(storage, path);
    const res = await listAll(folderRef);

    // Delete all files
    const deleteFilePromises = res.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deleteFilePromises);

    // Recursively delete all sub-folders
    const deleteFolderPromises = res.prefixes.map(folderRef => clearStorageFolder(folderRef.fullPath));
    await Promise.all(deleteFolderPromises);
};

export const clearAllStorage = async () => {
    try {
        console.log("Clearing Firebase Storage...");
        const equipmentTypesPromise = clearStorageFolder('equipment_types');
        const equipmentPromise = clearStorageFolder('equipment');

        await Promise.all([equipmentTypesPromise, equipmentPromise]);
        console.log("Firebase Storage cleared successfully.");

        const logBatch = writeBatch(db);
        logAdminActivity(logBatch, 'CLEAR_STORAGE', { details: 'All equipment and equipment type images have been deleted.' });
        await logBatch.commit();
    } catch (error) {
        console.error("Error clearing Firebase Storage:", error);
        // Optionally re-throw or handle the error as needed
        throw error;
    }
};


export const clearActivityLog = async () => {
    // Special case: We are about to log the clear actions, so we don't log the clearing of the log itself.
    // The new log entries will be the only ones left.
    await clearCollectionWithCursor('activityLog');
};

export const clearAssessmentHistory = async () => {
    const count = await clearCollectionWithCursor('assessments');
    if (count > 0) {
        const logBatch = writeBatch(db);
        logAdminActivity(logBatch, 'CLEAR_ASSESSMENT_HISTORY', { count });
        await logBatch.commit();
    }
};

export const clearBorrowHistory = async () => {
    const count = await clearCollectionWithCursor('borrows');
    if (count > 0) {
        const logBatch = writeBatch(db);
        logAdminActivity(logBatch, 'CLEAR_BORROW_HISTORY', { count });
        await logBatch.commit();
    }
};

export const clearRepairHistory = async () => {
    const count = await clearCollectionWithCursor('repairs');
    if (count > 0) {
        const logBatch = writeBatch(db);
        logAdminActivity(logBatch, 'CLEAR_REPAIR_HISTORY', { count });
        await logBatch.commit();
    }
};

export const clearEquipmentData = async () => {
    const count = await clearCollectionWithCursor('equipment');
    if (count > 0) {
        const logBatch = writeBatch(db);
        logAdminActivity(logBatch, 'CLEAR_EQUIPMENT_DATA', { count });
        await logBatch.commit();
    }
};

export const clearEquipmentTypes = async () => {
    const count = await clearCollectionWithCursor('equipmentTypes');
    if (count > 0) {
        const logBatch = writeBatch(db);
        logAdminActivity(logBatch, 'CLEAR_EQUIPMENT_TYPES', { count });
        await logBatch.commit();
    }
};

export const clearStandardAssessments = async () => {
    const count = await clearCollectionWithCursor('standardAssessments');
    if (count > 0) {
        const logBatch = writeBatch(db);
        logAdminActivity(logBatch, 'CLEAR_STANDARD_ASSESSMENTS', { count });
        await logBatch.commit();
    }
};

export const triggerDeleteAllUsersTask = async (adminUid: string) => {
    try {
        console.log("Triggering deleteAllUsers task...");
        const taskRef = doc(collection(db, 'tasks'));
        await setDoc(taskRef, {
            task: 'deleteAllUsers',
            adminUid: adminUid,
            createdAt: serverTimestamp()
        });
        console.log(`Task created with ID: ${taskRef.id}`);
        return { success: true, taskId: taskRef.id };
    } catch (error) {
        console.error("Error triggering deleteAllUsers task:", error);
        throw error;
    }
};

export const uploadEquipmentTypeImage = async (equipmentType: string, file: File) => {
    if (!file) throw new Error("No file provided for upload.");

    const fileExtension = file.name.split('.').pop();
    const fileName = `image.${fileExtension}`; // Standardize filename for type image
        const imageRef = ref(storage, `equipment_types/${equipmentType}/${fileName}`);
        console.log("Firebase Storage imageRef path:", imageRef.fullPath);
        const uploadTask = await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(uploadTask.ref);

    // Store the image URL in a new 'equipmentTypes' collection
    const typeRef = doc(db, "equipmentTypes", equipmentType);
    await setDoc(typeRef, { imageUrl }, { merge: true }); // Use setDoc with merge to create/update

    return imageUrl;
};

export const getAssessmentHistory = async (userIdToFilter?: string | null) => {
    let q: Query<DocumentData>;
    const assessmentsCol = collection(db, "assessments");

    if (userIdToFilter) {
        q = query(assessmentsCol, where("user_id", "==", userIdToFilter), orderBy("date", "desc"));
    } else {
        q = query(assessmentsCol, orderBy("date", "desc"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAssessmentDetails = async (assessmentId: string) => {
    const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
    if (!assessmentDoc.exists()) {
        console.error("No such assessment document!");
        return null;
    }
    return { id: assessmentDoc.id, ...assessmentDoc.data() };
};

// --- Technician Actions ---

export const logAssessmentAndConfirmDelivery = async (assessmentData: any) => {
    const batch = writeBatch(db);
    const { borrowRequestId, equipmentId } = assessmentData;

    // 1. Log the assessment
    const assessmentRef = doc(collection(db, 'assessments'));
    batch.set(assessmentRef, assessmentData);

    // 2. Update equipment status to "borrowed"
    const equipmentRef = doc(db, 'equipment', equipmentId);
    batch.update(equipmentRef, { status: 'borrowed' });

    logAdminActivity(batch, 'CONFIRM_DELIVERY', { borrowRequestId, equipmentId, assessmentId: assessmentRef.id });

    return batch.commit();
};

export const logAssessmentAndChangeEquipment = async (assessmentData: any, replacementId: string) => {
    const batch = writeBatch(db);
    const { borrowRequestId, equipmentId: faultyEquipmentId } = assessmentData;

    // 1. Log the assessment
    const assessmentRef = doc(collection(db, 'assessments'));
    batch.set(assessmentRef, assessmentData);

    // 2. Update faulty equipment status to "under_maintenance"
    const faultyEquipmentRef = doc(db, 'equipment', faultyEquipmentId);
    batch.update(faultyEquipmentRef, { status: 'under_maintenance' });

    // 3. Update replacement equipment status to "borrowed"
    const replacementEquipmentRef = doc(db, 'equipment', replacementId);
    batch.update(replacementEquipmentRef, { status: 'borrowed' });

    // 4. Fetch replacement equipment details and update the borrow request
    const borrowRef = doc(db, 'borrows', borrowRequestId);
    const [borrowDoc, replacementDoc] = await Promise.all([getDoc(borrowRef), getDoc(replacementEquipmentRef)]);
    
    const borrowData = borrowDoc.data();
    const replacementData = replacementDoc.data();

    if (borrowData && borrowData.equipment_assigned && replacementData) {
        const replacementDetail = {
            id: replacementDoc.id,
            name: replacementData.name,
            serial: replacementData.serial,
            type: replacementData.type,
        };
        const updatedEquipment = borrowData.equipment_assigned.map(equip => 
            equip.id === faultyEquipmentId ? replacementDetail : equip
        );
        batch.update(borrowRef, { equipment_assigned: updatedEquipment });
    }
    
    logAdminActivity(batch, 'CHANGE_EQUIPMENT_AND_DELIVER', { 
        borrowRequestId, 
        faultyEquipmentId, 
        replacementId, 
        assessmentId: assessmentRef.id 
    });

    return batch.commit();
};

export const logAssessmentAndSendForRepair = async (assessmentData: any) => {
    const batch = writeBatch(db);
    const { borrowRequestId, equipmentId, assessments, notes } = assessmentData;

    // 1. Log the assessment
    const assessmentRef = doc(collection(db, 'assessments'));
    batch.set(assessmentRef, { ...assessmentData, assessedAt: serverTimestamp() });

    // 2. Update equipment status to "under_maintenance"
    const equipmentRef = doc(db, 'equipment', equipmentId);
    batch.update(equipmentRef, { status: 'under_maintenance' });

    // 3. Create a repair request
    const equipmentDoc = await getDoc(equipmentRef);
    const equipmentData = equipmentDoc.data();

    const repairRef = doc(collection(db, 'repairs'));
    batch.set(repairRef, {
        equipment_id: equipmentId,
        equipment_name: equipmentData?.name || 'N/A',
        equipment_serial: equipmentData?.serial || 'N/A',
        equipment_type: equipmentData?.type || 'N/A',
        damage_description: notes || 'พบความเสียหายจากการตรวจสภาพก่อนส่งมอบ',
        status: 'pending_repair_approval',
        request_date: serverTimestamp(),
        borrow_request_id: borrowRequestId,
        assessment_id: assessmentRef.id
    });

    logAdminActivity(batch, 'ASSESS_AND_SEND_FOR_REPAIR', { borrowRequestId, equipmentId, assessmentId: assessmentRef.id });

    return batch.commit();
};

// --- Post-Return & Repair Workflow ---

export const getReturnQueue = async () => {
    // This should fetch borrow records with status 'returned_pending_assessment'
    const q = query(collection(db, "borrows"), where("status", "==", "returned_pending_assessment"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const submitPostAssessment = async (assessmentData: any) => {
    const batch = writeBatch(db);
    const { equipmentId, isAbnormal, damageDescription, estimatedCost, borrowRequestId } = assessmentData;

    // 1. Log the assessment
    const assessmentRef = doc(collection(db, 'assessments'));
    batch.set(assessmentRef, assessmentData);
    logAdminActivity(batch, 'POST_ASSESSMENT', { ...assessmentData, assessmentId: assessmentRef.id });

    const equipmentRef = doc(db, 'equipment', equipmentId);

    if (isAbnormal) {
        // 2a. If abnormal, create a repair request and update equipment status
        const equipmentDoc = await getDoc(equipmentRef);
        const equipmentData = equipmentDoc.data();

        const repairRef = doc(collection(db, 'repairs'));
        batch.set(repairRef, {
            equipment_id: equipmentId, // Corrected field name
            equipment_name: equipmentData?.name || 'N/A',
            equipment_serial: equipmentData?.serial || 'N/A',
            equipment_type: equipmentData?.type || 'N/A',
            damage_description: damageDescription,
            cost: estimatedCost,
            status: 'pending_repair_approval',
            request_date: serverTimestamp(),
            borrow_request_id: borrowRequestId, // Link back to the borrow request
            assessment_id: assessmentRef.id
        });
        batch.update(equipmentRef, { status: 'pending_repair_approval' });
        logAdminActivity(batch, 'CREATE_REPAIR_REQUEST_FROM_ASSESSMENT', { repairId: repairRef.id, equipmentId });
    } else {
        // 2b. If normal, set equipment status to available
        batch.update(equipmentRef, { status: 'available' });
    }

    // 3. Update the original borrow record status to 'completed'
    const borrowRef = doc(db, 'borrows', assessmentData.borrowRequestId);
    batch.update(borrowRef, { status: 'completed' });

    return batch.commit();
};



export const completeRepair = async (repairData: any) => {
    const batch = writeBatch(db);
    const { repairId, repairDetails, finalCost, replacedParts, technicianId, technicianName } = repairData;

    // 1. Update the repair document
    const repairRef = doc(db, 'repairs', repairId);
    batch.update(repairRef, {
        status: 'repair_completed',
        repair_details: repairDetails,
        final_cost: finalCost,
        replaced_parts: replacedParts,
        completed_at: serverTimestamp(),
        technician_id: technicianId,
        technician_name: technicianName,
    });

    // 2. Update the equipment status back to 'available'
    const repairDoc = await getDoc(repairRef);
    const equipmentId = repairDoc.data()?.equipment_id;
    if (equipmentId) {
        const equipmentRef = doc(db, 'equipment', equipmentId);
        batch.update(equipmentRef, { status: 'available' });
    }

    logAdminActivity(batch, 'COMPLETE_REPAIR', { repairId, equipmentId, user_id: technicianId });

    return batch.commit();
};

export const submitStandardAssessment = async (assessmentData: any) => {
    const batch = writeBatch(db);
    const { equipmentId, newStatus, damageDescription, ...restOfData } = assessmentData;

    // 1. Create a new document in the standardAssessments collection
    const assessmentRef = doc(collection(db, 'standardAssessments'));
    batch.set(assessmentRef, { equipmentId, newStatus, damageDescription, ...restOfData });

    // 2. Update the equipment status
    const equipmentRef = doc(db, 'equipment', equipmentId);
    batch.update(equipmentRef, { status: newStatus });

    // 3. If status is 'under_maintenance', create a repair request
    if (newStatus === 'under_maintenance') {
        const repairRef = doc(collection(db, 'repairs'));
        batch.set(repairRef, {
            equipment_id: equipmentId,
            equipment_name: restOfData.equipmentName,
            damage_description: damageDescription,
            status: 'repair_approved', // Automatically set to approved
            request_date: serverTimestamp(),
            assessment_id: assessmentRef.id // Link back to the standard assessment
        });
    }

    // 4. Log the activity
    logAdminActivity(batch, 'STANDARD_ASSESSMENT', { 
        assessmentId: assessmentRef.id,
        equipmentId,
        equipmentName: restOfData.equipmentName,
        newStatus 
    });

    return batch.commit();
};

export const getStandardAssessments = async () => {
    const q = query(collection(db, 'standardAssessments'), orderBy('assessedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};