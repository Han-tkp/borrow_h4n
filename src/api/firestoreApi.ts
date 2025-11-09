import { db, auth, storage, firebaseConfig } from './firebase';
import firebase from 'firebase/app';
import 'firebase/firestore';

// --- Helper --- //
export const logAdminActivity = (batch: firebase.firestore.WriteBatch, action: string, details: any) => {
    const logRef = db.collection('activityLog').doc();
    const currentUser = auth.currentUser; // Get current user here

    const logData: any = {
        action,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
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
    const userDoc = await db.collection("users").doc(uid).get();
    return userDoc.exists ? userDoc.data() : null;
};

export const createUserProfile = (uid: string, data: any) => {
    const batch = db.batch();
    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, {
        uid,
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    logAdminActivity(batch, 'CREATE_USER', { uid, email: data.email, name: data.name, phone_number: data.phone_number || null });
    return batch.commit();
};

// --- Equipment --- //
export const getEquipmentList = async (filters: { q?: string, f?: string, t?: string, includeDeleted?: boolean } = {}) => {
    const { q, f, t, includeDeleted } = filters;
    let equipmentQuery: firebase.firestore.Query = db.collection("equipment");

    if (f && f !== 'all') {
        equipmentQuery = equipmentQuery.where("status", "==", f);
    } else if (!includeDeleted) { // Default behavior: exclude deleted items unless explicitly requested
        equipmentQuery = equipmentQuery.where("status", "!=", "deleted");
    }
    if (t) {
        equipmentQuery = equipmentQuery.where("type", "==", t);
    }

    const [equipmentSnapshot, typesSnapshot] = await Promise.all([
        equipmentQuery.get(),
        db.collection("equipmentTypes").get() // Fetch all equipment types
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
    const snapshot = await db.collection('equipment').get();
    const types = snapshot.docs.map(doc => doc.data().type);
    return [...new Set(types)];
};


// --- User Approvals & Management --- //


export const getAllUsers = async () => {
    const snapshot = await db.collection("users").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateUser = async (uid: string, data: any) => {
    const batch = db.batch();
    const userRef = db.collection('users').doc(uid);
    const oldUserData = (await userRef.get()).data(); // Fetch old data for logging
    batch.update(userRef, data);
    logAdminActivity(batch, 'UPDATE_USER', { uid, oldData: oldUserData, newData: data });
    return batch.commit();
};

export const deleteUser = async (uid: string, reason: string) => {
    const batch = db.batch();
    const userRef = db.collection('users').doc(uid);
    const deletedUserData = (await userRef.get()).data(); // Fetch data before deletion

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
    const batch = db.batch();
    const userRef = db.collection('users').doc(uid);
    batch.update(userRef, { status: 'active' });
    logAdminActivity(batch, 'RECOVER_USER', { userId: uid });
    return batch.commit();
};

export const deleteUserFromAuth = async (uid: string) => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
        try {
            await currentUser.delete();
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
export const signInWithEmail = (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
};

export const registerWithEmail = async (email, password, fullName, otherData) => {
    // Initialize a temporary, secondary Firebase app to avoid session conflicts
    const secondaryAppName = 'secondary-auth-app';
    let secondaryApp;

    // Check if the app is already initialized, otherwise initialize it.
    const existingApp = firebase.apps.find(app => app.name === secondaryAppName);
    if (existingApp) {
        secondaryApp = existingApp;
    } else {
        secondaryApp = firebase.initializeApp(firebaseConfig, secondaryAppName);
    }

    try {
        // Create the user in the secondary app's auth service
        const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user) {
            // updateProfile updates the global user record, which is fine.
            await user.updateProfile({ displayName: fullName });

            // Create the user profile document using the main app's firestore instance.
            // This ensures that logAdminActivity uses the currently logged-in admin's credentials.
            await createUserProfile(user.uid, {
                name: fullName,
                email: user.email,
                role: otherData.role || 'user',
                status: 'active', // Set status to active for new users by default
            });
        }
        return userCredential;
    } finally {
        // Clean up the secondary app
        if (secondaryApp) {
            await secondaryApp.auth().signOut();
            await secondaryApp.delete();
        }
    }
};

export const reauthenticate = async (password: string) => {
    const user = auth.currentUser;
    if (user && user.email) {
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
        return user.reauthenticateWithCredential(credential);
    }
    throw new Error("User not found or email not available.");
};

// --- Equipment Management --- //
export const addEquipment = async (data: any) => {
    const batch = db.batch();
    const docRef = db.collection("equipment").doc();
    const newData = { ...data, status: 'available', createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    batch.set(docRef, newData);
    logAdminActivity(batch, 'ADD_EQUIPMENT', { equipmentId: docRef.id, name: data.name, serial: data.serial, type: data.type });
    await batch.commit();
    return docRef.id;
};

export const updateStatusOfMultipleEquipment = async (ids: string[], status: string) => {
    const batch = db.batch();
    const affectedEquipmentDetails: any[] = [];

    for (const id of ids) {
        const docRef = db.collection('equipment').doc(id);
        const oldEquipmentData = (await docRef.get()).data(); // Fetch old data
        batch.update(docRef, { status });
        affectedEquipmentDetails.push({ id, oldStatus: oldEquipmentData?.status, newStatus: status, name: oldEquipmentData?.name, serial: oldEquipmentData?.serial });
    }
    logAdminActivity(batch, 'BATCH_UPDATE_STATUS', { equipmentIds: ids, count: ids.length, newStatus: status, details: affectedEquipmentDetails });
    return batch.commit();
};

export const deleteEquipment = async (id: string, reason: string) => {
    const batch = db.batch();
    const docRef = db.collection('equipment').doc(id);
    const deletedEquipmentData = (await docRef.get()).data(); // Fetch data before deletion
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

        const batch = db.batch();

        const deletedEquipmentDetails: any[] = [];



        for (const id of chunk) {

            const docRef = db.collection('equipment').doc(id);

            const deletedData = (await docRef.get()).data(); // Fetch data before deletion

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
    const batch = db.batch();
    const importedDetails: any[] = [];

    equipment.forEach(item => {
        const docRef = db.collection('equipment').doc();
        batch.set(docRef, { ...item, status: item.status || 'available', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        importedDetails.push({ id: docRef.id, name: item.name, serial: item.serial });
    });
    logAdminActivity(batch, 'IMPORT_EQUIPMENT', { count: equipment.length, details: importedDetails });
    return batch.commit();
};




// --- Borrow & Repair --- //
export const createBorrowRequest = async (borrowData: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not logged in.");

    const batch = db.batch();
    const borrowRef = db.collection("borrows").doc();
    const due = new Date(borrowData.borrow_date);
    due.setDate(due.getDate() + 7);

    const newBorrowRequest = {
        ...borrowData,
        user_id: currentUser.uid,
        user_name: currentUser.displayName || currentUser.email,
        status: 'pending_borrow_approval',
        request_date: firebase.firestore.FieldValue.serverTimestamp(),
        due_date: due.toISOString().slice(0, 10),
    };
    batch.set(borrowRef, newBorrowRequest);
    logAdminActivity(batch, 'CREATE_BORROW_REQUEST', { borrowId: borrowRef.id, purpose: borrowData.purpose, equipmentRequests: borrowData.equipment_requests });
    return batch.commit();
};

export const getBorrowHistory = (userId: string | null, callback: (data: any[]) => void) => {
    let query: firebase.firestore.Query = db.collection("borrows");

    if (userId) {
        query = query.where("user_id", "==", userId);
    }

    const unsubscribe = query.orderBy("request_date", "desc").onSnapshot(snapshot => {
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
    const snapshot = await db.collection("borrows").where("status", "==", "pending_borrow_approval").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const approveBorrow = async (borrowId: string) => {
    const batch = db.batch();
    const borrowRef = db.collection('borrows').doc(borrowId);

    try {
        const borrowDoc = await borrowRef.get();
        if (!borrowDoc.exists) {
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
            const availableEquipmentQuery = await db.collection('equipment')
                .where('type', '==', req.type)
                .where('status', '==', 'available')
                .limit(req.quantity)
                .get();

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
            const equipmentRef = db.collection('equipment').doc(equip.id);
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
    const batch = db.batch();
    const borrowRef = db.collection('borrows').doc(borrowId);
    const borrowData = (await borrowRef.get()).data();
    batch.update(borrowRef, { status: "rejected" });
    logAdminActivity(batch, 'REJECT_BORROW', { borrowId, equipmentRequests: borrowData?.equipment_requests });
    return batch.commit();
};

export const getDeliveryQueue = async () => {
    const snapshot = await db.collection("borrows").where("status", "==", "pending_delivery").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBorrowedQueue = async () => {
    const snapshot = await db.collection("borrows").where("status", "==", "borrowed").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const processReturn = async (borrowId: string) => {
    const batch = db.batch();
    const borrowRef = db.collection('borrows').doc(borrowId);

    // Get the assigned equipment to copy to returned equipment
    const borrowDoc = await borrowRef.get();
    const borrowData = borrowDoc.data();

    batch.update(borrowRef, { 
        status: "returned_pending_assessment",
        returned_date: firebase.firestore.FieldValue.serverTimestamp(),
        equipment_returned: borrowData?.equipment_assigned || [] // Copy assigned to returned
    });

    logAdminActivity(batch, 'PROCESS_RETURN', { borrowId });

    return batch.commit();
};

export const getRepairRequests = async () => {
    const snapshot = await db.collection("repairs").where("status", "==", "pending_repair_approval").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTechnicianRepairQueue = async () => {
    const snapshot = await db.collection("repairs").where("status", "in", ["repair_approved", "repair_in_progress"]).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllRepairs = async () => {
    const snapshot = await db.collection("repairs").orderBy("request_date", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const approveRepair = async (repairId: string) => {
    const batch = db.batch();
    const repairRef = db.collection("repairs").doc(repairId);
    const repairDoc = await repairRef.get();
    const repairData = repairDoc.data();

    if (repairData?.equipment_id) {
        const equipmentRef = db.collection("equipment").doc(repairData.equipment_id);
        const equipmentData = (await equipmentRef.get()).data();
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
    const batch = db.batch();
    const repairRef = db.collection("repairs").doc(repairId);
    const repairDoc = await repairRef.get();
    const repairData = repairDoc.data();

    if (repairData?.equipment_id) {
        const equipmentRef = db.collection("equipment").doc(repairData.equipment_id);
        const equipmentData = (await equipmentRef.get()).data();
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
    let borrowsQuery: firebase.firestore.Query = db.collection("borrows");
    let repairsQuery: firebase.firestore.Query = db.collection("repairs");

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end day

        borrowsQuery = borrowsQuery.where('request_date', '>=', start).where('request_date', '<=', end);
        repairsQuery = repairsQuery.where('request_date', '>=', start).where('request_date', '<=', end);
    }

    // --- Unfiltered Queries for overall stats ---
    const allUsersQuery = db.collection("users").get();
    const allEquipmentQuery = db.collection("equipment").get();
    const allBorrowsQuery = db.collection("borrows").get();
    const allRepairsQuery = db.collection("repairs").get();
    
    const [
        borrowSnapshot,
        repairSnapshot,
        usersSnapshot,
        equipmentSnapshot,
        allBorrowsSnapshot,
        allRepairsSnapshot
    ] = await Promise.all([
        borrowsQuery.get(),
        repairsQuery.get(),
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
            const month = borrow.request_date.toDate().toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
    }, {});

    const repairsByMonth = allRepairs.reduce((acc, repair) => {
        if (repair.request_date) {
            const month = repair.request_date.toDate().toISOString().slice(0, 7);
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
    let query: firebase.firestore.Query = db.collection("activityLog").orderBy("timestamp", "desc");

    if (adminIdToFilter) {
        query = query.where('adminId', '==', adminIdToFilter);
    }

    if (borrowId) {
        query = query.where('borrowId', '==', borrowId);
    }

    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query = query.where('timestamp', '>=', startDate).where('timestamp', '<=', endDate);
    } else {
        query = query.limit(100); // Default limit if no date filter
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Helper function for robustly clearing a collection with cursor-based pagination
const clearCollectionWithCursor = async (collectionName: string, filterFn: (doc: firebase.firestore.QueryDocumentSnapshot) => boolean = () => true) => {
    const collectionRef = db.collection(collectionName);
    let deletedCount = 0;
    let lastVisible: firebase.firestore.QueryDocumentSnapshot | null = null;

    while (true) {
        let query = collectionRef.orderBy(firebase.firestore.FieldPath.documentId()).limit(500);
        if (lastVisible) {
            query = query.startAfter(lastVisible);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
            break;
        }

        const batch = db.batch();
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
    const folderRef = storage.ref(path);
    const res = await folderRef.listAll();

    // Delete all files
    const deleteFilePromises = res.items.map(itemRef => itemRef.delete());
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

        const logBatch = db.batch();
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
        const logBatch = db.batch();
        logAdminActivity(logBatch, 'CLEAR_ASSESSMENT_HISTORY', { count });
        await logBatch.commit();
    }
};

export const clearBorrowHistory = async () => {
    const count = await clearCollectionWithCursor('borrows');
    if (count > 0) {
        const logBatch = db.batch();
        logAdminActivity(logBatch, 'CLEAR_BORROW_HISTORY', { count });
        await logBatch.commit();
    }
};

export const clearRepairHistory = async () => {
    const count = await clearCollectionWithCursor('repairs');
    if (count > 0) {
        const logBatch = db.batch();
        logAdminActivity(logBatch, 'CLEAR_REPAIR_HISTORY', { count });
        await logBatch.commit();
    }
};

export const clearEquipmentData = async () => {
    const count = await clearCollectionWithCursor('equipment');
    if (count > 0) {
        const logBatch = db.batch();
        logAdminActivity(logBatch, 'CLEAR_EQUIPMENT_DATA', { count });
        await logBatch.commit();
    }
};

export const clearEquipmentTypes = async () => {
    const count = await clearCollectionWithCursor('equipmentTypes');
    if (count > 0) {
        const logBatch = db.batch();
        logAdminActivity(logBatch, 'CLEAR_EQUIPMENT_TYPES', { count });
        await logBatch.commit();
    }
};

export const clearStandardAssessments = async () => {
    const count = await clearCollectionWithCursor('standardAssessments');
    if (count > 0) {
        const logBatch = db.batch();
        logAdminActivity(logBatch, 'CLEAR_STANDARD_ASSESSMENTS', { count });
        await logBatch.commit();
    }
};

export const deleteAllUsersExceptAdmin = async (adminUid: string) => {
    console.warn("This function only deletes user data from Firestore, not their authentication accounts. A server-side solution (e.g., Firebase Cloud Function) is required to delete user authentication accounts.");
    alert("คำเตือน: ฟังก์ชันนี้จะลบข้อมูลผู้ใช้จากฐานข้อมูล Firestore เท่านั้น แต่จะไม่ลบบัญชีการยืนยันตัวตนของผู้ใช้ (Authentication accounts) หากต้องการลบข้อมูลทั้งหมดอย่างสมบูรณ์ โปรดใช้ Firebase Cloud Function");
    
    const userFilter = (doc: firebase.firestore.QueryDocumentSnapshot) => {
        const userData = doc.data();
        return doc.id !== adminUid && userData.role !== 'admin';
    };
    
    const deletedCount = await clearCollectionWithCursor('users', userFilter);

    if (deletedCount > 0) {
        const logBatch = db.batch();
        logAdminActivity(logBatch, 'DELETE_ALL_USERS_EXCEPT_ADMIN', { adminUid, deletedCount });
        await logBatch.commit();
    }
};

export const uploadEquipmentTypeImage = async (equipmentType: string, file: File) => {
    if (!file) throw new Error("No file provided for upload.");

    const storageRef = storage.ref();
    const fileExtension = file.name.split('.').pop();
    const fileName = `image.${fileExtension}`; // Standardize filename for type image
    const imageRef = storageRef.child(`equipment_types/${equipmentType}/${fileName}`);

    const uploadTask = await imageRef.put(file);
    const imageUrl = await uploadTask.ref.getDownloadURL();

    // Store the image URL in a new 'equipmentTypes' collection
    const typeRef = db.collection("equipmentTypes").doc(equipmentType);
    await typeRef.set({ imageUrl }, { merge: true }); // Use merge to not overwrite other fields if they exist

    return imageUrl;
};

export const getAssessmentHistory = async (userIdToFilter?: string | null) => {
    let query: firebase.firestore.Query = db.collection("assessments");

    if (userIdToFilter) {
        query = query.where("user_id", "==", userIdToFilter);
    }

    const snapshot = await query.orderBy("date", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAssessmentDetails = async (assessmentId: string) => {
    const assessmentDoc = await db.collection('assessments').doc(assessmentId).get();
    if (!assessmentDoc.exists) {
        console.error("No such assessment document!");
        return null;
    }
    return { id: assessmentDoc.id, ...assessmentDoc.data() };
};

// --- Technician Actions ---

export const logAssessmentAndConfirmDelivery = async (assessmentData: any) => {
    const batch = db.batch();
    const { borrowRequestId, equipmentId } = assessmentData;

    // 1. Log the assessment
    const assessmentRef = db.collection('assessments').doc();
    batch.set(assessmentRef, assessmentData);

    // 2. Update equipment status to "borrowed"
    const equipmentRef = db.collection('equipment').doc(equipmentId);
    batch.update(equipmentRef, { status: 'borrowed' });

    // 3. Update borrow request status to "borrowed"
    // This is a simplified approach. A more robust solution would check if all items are delivered.
    const borrowRef = db.collection('borrows').doc(borrowRequestId);
    batch.update(borrowRef, { status: 'borrowed' });

    logAdminActivity(batch, 'CONFIRM_DELIVERY', { borrowRequestId, equipmentId, assessmentId: assessmentRef.id });

    return batch.commit();
};

export const logAssessmentAndChangeEquipment = async (assessmentData: any, replacementId: string) => {
    const batch = db.batch();
    const { borrowRequestId, equipmentId: faultyEquipmentId } = assessmentData;

    // 1. Log the assessment
    const assessmentRef = db.collection('assessments').doc();
    batch.set(assessmentRef, assessmentData);

    // 2. Update faulty equipment status to "under_maintenance"
    const faultyEquipmentRef = db.collection('equipment').doc(faultyEquipmentId);
    batch.update(faultyEquipmentRef, { status: 'under_maintenance' });

    // 3. Update replacement equipment status to "borrowed"
    const replacementEquipmentRef = db.collection('equipment').doc(replacementId);
    batch.update(replacementEquipmentRef, { status: 'borrowed' });

    // 4. Fetch replacement equipment details and update the borrow request
    const borrowRef = db.collection('borrows').doc(borrowRequestId);
    const [borrowDoc, replacementDoc] = await Promise.all([borrowRef.get(), replacementEquipmentRef.get()]);
    
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
    
    // 5. Update borrow request status to "borrowed"
    // This assumes delivery is complete after assessment/change.
    batch.update(borrowRef, { status: 'borrowed' });

    logAdminActivity(batch, 'CHANGE_EQUIPMENT_AND_DELIVER', { 
        borrowRequestId, 
        faultyEquipmentId, 
        replacementId, 
        assessmentId: assessmentRef.id 
    });

    return batch.commit();
};

// --- Post-Return & Repair Workflow ---

export const getReturnQueue = async () => {
    // This should fetch borrow records with status 'returned_pending_assessment'
    const snapshot = await db.collection("borrows").where("status", "==", "returned_pending_assessment").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const submitPostAssessment = async (assessmentData: any) => {
    const batch = db.batch();
    const { equipmentId, isAbnormal, damageDescription, estimatedCost, borrowRequestId } = assessmentData;

    // 1. Log the assessment
    const assessmentRef = db.collection('assessments').doc();
    batch.set(assessmentRef, assessmentData);
    logAdminActivity(batch, 'POST_ASSESSMENT', { ...assessmentData, assessmentId: assessmentRef.id });

    const equipmentRef = db.collection('equipment').doc(equipmentId);

    if (isAbnormal) {
        // 2a. If abnormal, create a repair request and update equipment status
        const equipmentDoc = await equipmentRef.get();
        const equipmentData = equipmentDoc.data();

        const repairRef = db.collection('repairs').doc();
        batch.set(repairRef, {
            equipment_id: equipmentId, // Corrected field name
            equipment_name: equipmentData?.name || 'N/A',
            equipment_serial: equipmentData?.serial || 'N/A',
            equipment_type: equipmentData?.type || 'N/A',
            damage_description: damageDescription,
            cost: estimatedCost,
            status: 'pending_repair_approval',
            request_date: firebase.firestore.FieldValue.serverTimestamp(),
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
    const borrowRef = db.collection('borrows').doc(assessmentData.borrowRequestId);
    batch.update(borrowRef, { status: 'completed' });

    return batch.commit();
};



export const completeRepair = async (repairData: any) => {
    const batch = db.batch();
    const { repairId, repairDetails, finalCost, replacedParts, technicianId, technicianName } = repairData;

    // 1. Update the repair document
    const repairRef = db.collection('repairs').doc(repairId);
    batch.update(repairRef, {
        status: 'repair_completed',
        repair_details: repairDetails,
        final_cost: finalCost,
        replaced_parts: replacedParts,
        completed_at: firebase.firestore.FieldValue.serverTimestamp(),
        technician_id: technicianId,
        technician_name: technicianName,
    });

    // 2. Update the equipment status back to 'available'
    const repairDoc = await repairRef.get();
    const equipmentId = repairDoc.data()?.equipment_id;
    if (equipmentId) {
        const equipmentRef = db.collection('equipment').doc(equipmentId);
        batch.update(equipmentRef, { status: 'available' });
    }

    logAdminActivity(batch, 'COMPLETE_REPAIR', { repairId, equipmentId, user_id: technicianId });

    return batch.commit();
};

export const submitStandardAssessment = async (assessmentData: any) => {
    const batch = db.batch();
    const { equipmentId, newStatus, damageDescription, ...restOfData } = assessmentData;

    // 1. Create a new document in the standardAssessments collection
    const assessmentRef = db.collection('standardAssessments').doc();
    batch.set(assessmentRef, { equipmentId, newStatus, damageDescription, ...restOfData });

    // 2. Update the equipment status
    const equipmentRef = db.collection('equipment').doc(equipmentId);
    batch.update(equipmentRef, { status: newStatus });

    // 3. If status is 'under_maintenance', create a repair request
    if (newStatus === 'under_maintenance') {
        const repairRef = db.collection('repairs').doc();
        batch.set(repairRef, {
            equipment_id: equipmentId,
            equipment_name: restOfData.equipmentName,
            damage_description: damageDescription,
            status: 'repair_approved', // Automatically set to approved
            request_date: firebase.firestore.FieldValue.serverTimestamp(),
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
    const snapshot = await db.collection('standardAssessments').orderBy('assessedAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};