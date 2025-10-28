import { db, auth } from './firebase';
import firebase from 'firebase/compat/app';

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

    const snapshot = await equipmentQuery.get();
    let equipmentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (q) {
        const lowerCaseQuery = q.toLowerCase();
        equipmentList = equipmentList.filter(e =>
            (e.name?.toLowerCase().includes(lowerCaseQuery)) ||
            (e.serial?.toLowerCase().includes(lowerCaseQuery))
        );
    }
    return equipmentList;
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

export const registerWithEmail = (email, password, fullName, otherData) => {
    return auth.createUserWithEmailAndPassword(email, password);
};

// --- Equipment Management --- //
export const addEquipment = (data: any) => {
    const batch = db.batch();
    const docRef = db.collection("equipment").doc();
    const newData = { ...data, status: 'available', createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    batch.set(docRef, newData);
    logAdminActivity(batch, 'ADD_EQUIPMENT', { equipmentId: docRef.id, name: data.name, serial: data.serial, type: data.type });
    return batch.commit();
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
    batch.delete(docRef);
    logAdminActivity(batch, 'DELETE_EQUIPMENT', { equipmentId: id, name: deletedEquipmentData?.name, serial: deletedEquipmentData?.serial, reason });
    return batch.commit();
};

export const deleteMultipleEquipment = async (ids: string[], reason: string) => {
    const batch = db.batch();
    const deletedEquipmentDetails: any[] = [];

    for (const id of ids) {
        const docRef = db.collection('equipment').doc(id);
        const deletedData = (await docRef.get()).data(); // Fetch data before deletion
        batch.delete(docRef);
        deletedEquipmentDetails.push({ id, name: deletedData?.name, serial: deletedData?.serial });
    }
    logAdminActivity(batch, 'BATCH_DELETE_EQUIPMENT', { equipmentIds: ids, count: ids.length, reason, details: deletedEquipmentDetails });
    return batch.commit();
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
    logAdminActivity(batch, 'CREATE_BORROW_REQUEST', { borrowId: borrowRef.id, purpose: borrowData.purpose, equipmentIds: borrowData.equipment_ids });
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
    logAdminActivity(batch, 'APPROVE_BORROW', { borrowId, equipmentIds: borrowData?.equipment_ids });
    return batch.commit();
};

export const rejectBorrow = async (borrowId: string) => {
    const batch = db.batch();
    const borrowRef = db.collection('borrows').doc(borrowId);
    const borrowData = (await borrowRef.get()).data();
    batch.update(borrowRef, { status: "rejected" });
    logAdminActivity(batch, 'REJECT_BORROW', { borrowId, equipmentIds: borrowData?.equipment_ids });
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

export const getActivityLog = async () => {
    const snapshot = await db.collection("activityLog").orderBy("timestamp", "desc").limit(100).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAssessmentHistory = async () => {
    const snapshot = await db.collection("assessments").orderBy("date", "desc").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
