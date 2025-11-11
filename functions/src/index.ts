import { onDocumentCreated, FirestoreEvent } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { UserRecord } from "firebase-admin/auth";

admin.initializeApp();

// Set global options for the function
setGlobalOptions({ timeoutSeconds: 540, memory: "1GiB" });

export const deleteAllUsers = onDocumentCreated("tasks/{taskId}", async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  const snap = event.data;
  if (!snap) {
    logger.log("No data associated with the event. Exiting.");
    return;
  }

  const taskRef = snap.ref;
  const taskData = snap.data();
  const taskId = event.params.taskId;

  // Ensure it's the correct task
  if (taskData?.task !== 'deleteAllUsers') {
    logger.log(`Task ${taskId} is not deleteAllUsers. Skipping.`);
    return;
  }

  const adminUid = taskData.adminUid;

  if (!adminUid) {
    const msg = `Task ${taskId} is missing adminUid. Aborting.`;
    logger.error(msg);
    await taskRef.update({ status: 'error', message: msg });
    return;
  }

  try {
    await taskRef.update({ status: 'verifying_admin' });
    // Verify the adminUid actually belongs to an admin
    const adminUserRecord = await admin.auth().getUser(adminUid);
    const adminClaims = adminUserRecord.customClaims;

    if (adminClaims?.role !== 'admin') {
        const adminDoc = await admin.firestore().collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            const msg = `User ${adminUid} is not an admin. Cannot proceed.`;
            logger.error(msg);
            await taskRef.update({ status: 'error', message: msg });
            return;
        }
    }

    await taskRef.update({ status: 'collecting_users' });
    logger.log("Starting user deletion process...");

    // Get all admin UIDs from Firestore to create a safe list
    const adminDocs = await admin.firestore().collection('users').where('role', '==', 'admin').get();
    logger.log(`Found ${adminDocs.size} documents in 'users' collection with role 'admin'.`);
    const adminUidSet = new Set(adminDocs.docs.map(doc => doc.id));
    logger.log(`Found ${adminUidSet.size} admin accounts to preserve:`, Array.from(adminUidSet));

    const uidsToDelete: string[] = [];
    let totalUserCount = 0;
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      totalUserCount += listUsersResult.users.length;
      listUsersResult.users.forEach((userRecord: UserRecord) => {
        if (!adminUidSet.has(userRecord.uid)) {
          uidsToDelete.push(userRecord.uid);
        } else {
          logger.log(`Skipping deletion for admin user: ${userRecord.email} (UID: ${userRecord.uid}).`);
        }
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    logger.log(`Total users scanned in Auth: ${totalUserCount}. Found ${uidsToDelete.length} non-admin users to delete.`);
    await taskRef.update({
        status: 'deleting',
        totalAuthUsers: totalUserCount,
        adminsToPreserve: adminUidSet.size,
        usersToDelete: uidsToDelete.length
    });

    if (uidsToDelete.length === 0) {
        logger.log("No users to delete. Task complete.");
        await taskRef.update({ status: 'complete', message: 'No non-admin users found to delete.' });
        return;
    }

    // Batch delete from Auth (max 1000 per call)
    const deletePromises: Promise<admin.auth.DeleteUsersResult>[] = [];
    for (let i = 0; i < uidsToDelete.length; i += 1000) {
      const chunk = uidsToDelete.slice(i, i + 1000);
      deletePromises.push(admin.auth().deleteUsers(chunk));
    }

    const results = await Promise.all(deletePromises);

    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    const failedUids = new Set<string>();
    results.forEach(result => {
      totalSuccessCount += result.successCount;
      totalFailureCount += result.failureCount;
      result.errors.forEach(err => failedUids.add(err.uid));
    });

    logger.log(`Successfully deleted ${totalSuccessCount} users from Authentication.`);
    if (totalFailureCount > 0) {
      logger.error(`Failed to delete ${totalFailureCount} users from Authentication. UIDs: ${Array.from(failedUids).join(', ')}`);
    }

    // Batch delete from Firestore
    const successfulUids = uidsToDelete.filter(uid => !failedUids.has(uid));
    if (successfulUids.length > 0) {
      const firestore = admin.firestore();
      const firestorePromises: Promise<any>[] = [];
      for (let i = 0; i < successfulUids.length; i += 500) {
        const chunk = successfulUids.slice(i, i + 500);
        const batch = firestore.batch();
        chunk.forEach((uid) => {
          const userRef = firestore.collection("users").doc(uid);
          batch.delete(userRef);
        });
        firestorePromises.push(batch.commit());
      }
      await Promise.all(firestorePromises);
      logger.log(`Successfully deleted ${successfulUids.length} user documents from Firestore.`);
    }

    const finalMessage = `User deletion task finished. Auth Deleted: ${totalSuccessCount}. Auth Failed: ${totalFailureCount}. Firestore Deleted: ${successfulUids.length}.`;
    logger.log(finalMessage);
    await taskRef.update({
        status: 'complete',
        message: finalMessage,
        deletedAuthCount: totalSuccessCount,
        failedAuthCount: totalFailureCount,
        deletedFirestoreCount: successfulUids.length
    });

  } catch (error: any) {
    const errorMessage = error.message || 'An unknown error occurred.';
    logger.error(`Error processing task ${taskId}:`, error);
    await taskRef.update({ status: 'error', message: errorMessage });
  }
});

