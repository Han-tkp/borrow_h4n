import { db, auth, storage } from './firebase';
import firebase from 'firebase/app';
import 'firebase/firestore';

// --- Helper --- //
const logAdminActivity = (batch, action: string, details: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const logRef = db.collection('activityLog').doc();
    batch.set(logRef, {
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email,
        action,
        details,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

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
    logAdminActivity(batch, 'CREATE_USER', { uid, email: data.email, name: data.name });
    return batch.commit();
};

// --- Equipment --- //
export const getEquipmentList = async (filters: { q?: string, f?: string, t?: string } = {}) => {
    const { q, f, t } = filters;
    let equipmentQuery: firebase.firestore.Query = db.collection("equipment");

    if (f && f !== 'all') {
        equipmentQuery = equipmentQuery.where("status", "==", f);
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
export const getPendingUsers = async () => {
    const snapshot = await db.collection("users").where("status", "==", "pending_approval").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const approveUser = (userId: string) => {
    const batch = db.batch();
    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, { status: "active" });
    logAdminActivity(batch, 'APPROVE_USER', { userId });
    return batch.commit();
};

export const rejectUser = (userId: string) => {
    const batch = db.batch();
    const userRef = db.collection('users').doc(userId);
    batch.delete(userRef);
    logAdminActivity(batch, 'REJECT_USER', { userId });
    return batch.commit();
};

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
    const deletedUserData = (await userRef.get()).data(); // Fetch data before soft delete
    batch.update(userRef, { status: 'deleted' });
    logAdminActivity(batch, 'DELETE_USER', { userId: uid, email: deletedUserData?.email, name: deletedUserData?.name, reason });
    return batch.commit();
};

// --- Auth --- //
export const signInWithEmail = (email, password) => {
    return auth.signInWithEmailAndPassword(email, password);
};

export const registerWithEmail = async (email, password, fullName, otherData) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    if (user) {
        await user.updateProfile({ displayName: fullName });
        await createUserProfile(user.uid, {
            name: fullName,
            email: user.email,
            role: otherData.role || 'user',
            status: 'active', // Set status to active by default for admin-created users
        });
    }
    return userCredential;
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

            batch.delete(docRef);

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

export const getBorrowHistory = async (userId: string) => {
    const snapshot = await db.collection("borrows").where("user_id", "==", userId).orderBy("request_date", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getBorrowRequests = async () => {
    const snapshot = await db.collection("borrows").where("status", "==", "pending_borrow_approval").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const approveBorrow = async (borrowId: string) => {
    const batch = db.batch();
    const borrowRef = db.collection('borrows').doc(borrowId);
    const borrowData = (await borrowRef.get()).data();
    batch.update(borrowRef, { status: "pending_delivery" });
    logAdminActivity(batch, 'APPROVE_BORROW', { borrowId, equipmentRequests: borrowData?.equipment_requests });
    return batch.commit();
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

export const getReturnQueue = async () => {
    const snapshot = await db.collection("borrows").where("status", "==", "borrowed").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getRepairRequests = async () => {
    const snapshot = await db.collection("repairs").where("status", "==", "pending_repair_approval").get();
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
export const getReportData = async (filterMonth?: string) => {
    let borrowsQuery: firebase.firestore.Query = db.collection("borrows");
    let repairsQuery: firebase.firestore.Query = db.collection("repairs");

    if (filterMonth) {
        const year = parseInt(filterMonth.split('-')[0]);
        const month = parseInt(filterMonth.split('-')[1]) - 1;
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 1);

        borrowsQuery = borrowsQuery.where('request_date', '>=', startDate).where('request_date', '<', endDate);
        repairsQuery = repairsQuery.where('request_date', '>=', startDate).where('request_date', '<', endDate);
    }

    const [borrowSnapshot, repairSnapshot] = await Promise.all([
        borrowsQuery.get(),
        repairsQuery.get(),
    ]);

    const borrows = borrowSnapshot.docs.map(doc => doc.data());
    const repairs = repairSnapshot.docs.map(doc => doc.data());

    const totalBorrows = borrows.length;
    const totalRepairs = repairs.length;
    const totalRepairCost = repairs.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

    const borrowingByType = borrows.flatMap(b => b.equipment_requests || []).reduce((acc: any, req: any) => {
        acc[req.type] = (acc[req.type] || 0) + req.quantity;
        return acc;
    }, {});

    return {
        totalBorrows,
        totalRepairs,
        totalRepairCost,
        borrowingByType,
    };
};

export const getActivityLog = async (date?: string, isMainAccount: boolean = false, currentUserId?: string) => {
    let query: firebase.firestore.Query = db.collection("activityLog").orderBy("timestamp", "desc");

    if (!isMainAccount && currentUserId) {
        // Non-main accounts only see their own logs
        query = query.where('adminId', '==', currentUserId);
    } else if (!isMainAccount && !currentUserId) {
        // Fallback: if not main account and no user ID, return empty.
        return [];
    }
    // If isMainAccount is true, no adminId filter is applied, so it fetches all logs.

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

export const clearActivityLog = async () => {
    const snapshot = await db.collection('activityLog').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    logAdminActivity(batch, 'CLEAR_ACTIVITY_LOG', { count: snapshot.size });
    return batch.commit();
};

export const clearAssessmentHistory = async () => {
    const snapshot = await db.collection('assessments').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    logAdminActivity(batch, 'CLEAR_ASSESSMENT_HISTORY', { count: snapshot.size });
    return batch.commit();
};

export const clearBorrowHistory = async () => {
    const snapshot = await db.collection('borrows').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    logAdminActivity(batch, 'CLEAR_BORROW_HISTORY', { count: snapshot.size });
    return batch.commit();
};

export const clearRepairHistory = async () => {
    const snapshot = await db.collection('repairs').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    logAdminActivity(batch, 'CLEAR_REPAIR_HISTORY', { count: snapshot.size });
    return batch.commit();
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

export const getAssessmentHistory = async () => {
    const snapshot = await db.collection("assessments").orderBy("date", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
