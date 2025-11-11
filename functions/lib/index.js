"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllUsers = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
// Deletes all non-admin users from Firebase Authentication.
exports.deleteAllUsers = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // Ensure the user calling the function is an admin.
    if (((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.role) !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only admins can run this function.");
    }
    const adminUid = (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid;
    try {
        const listUsersResult = await admin.auth().listUsers();
        const uidsToDelete = [];
        listUsersResult.users.forEach((userRecord) => {
            // Do not delete the admin who is calling the function.
            if (userRecord.uid !== adminUid) {
                uidsToDelete.push(userRecord.uid);
            }
        });
        if (uidsToDelete.length > 0) {
            await admin.auth().deleteUsers(uidsToDelete);
            console.log(`Successfully deleted ${uidsToDelete.length} users.`);
            // Now, delete the corresponding Firestore documents.
            const firestore = admin.firestore();
            const batch = firestore.batch();
            uidsToDelete.forEach((uid) => {
                const userRef = firestore.collection("users").doc(uid);
                batch.delete(userRef);
            });
            await batch.commit();
            console.log("Successfully deleted user documents from Firestore.");
        }
        return { message: `Successfully deleted ${uidsToDelete.length} users.` };
    }
    catch (error) {
        console.error("Error deleting users:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while deleting users.");
    }
});
//# sourceMappingURL=index.js.map