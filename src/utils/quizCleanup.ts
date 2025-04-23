
import { firestore } from '@/lib/firebase';
import { doc, collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { Quiz, QuizSubmission } from '@/types';

export const deleteOldQuizzes = async (userId: string, daysOld: number = 90) => {
  try {
    // Calculate the timestamp for quizzes older than the specified days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Query for quizzes created by the user before the cutoff date
    const quizzesRef = collection(firestore, 'quizzes');
    const q = query(
      quizzesRef, 
      where('createdBy', '==', userId),
      where('createdAt', '<', Timestamp.fromDate(cutoffDate))
    );

    const querySnapshot = await getDocs(q);
    
    // Delete each old quiz and its submissions
    const deletionPromises = querySnapshot.docs.map(async (quizDoc) => {
      const quizId = quizDoc.id;
      
      // Delete quiz submissions
      const submissionsRef = collection(firestore, 'submissions');
      const submissionsQuery = query(submissionsRef, where('quizId', '==', quizId));
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      // Delete submissions first
      await Promise.all(
        submissionsSnapshot.docs.map(submissionDoc => 
          deleteDoc(doc(firestore, 'submissions', submissionDoc.id))
        )
      );

      // Then delete the quiz
      await deleteDoc(doc(firestore, 'quizzes', quizId));
    });

    await Promise.all(deletionPromises);

    return {
      deletedQuizCount: querySnapshot.size
    };
  } catch (error) {
    console.error('Error deleting old quizzes:', error);
    throw error;
  }
};

export const deleteInactiveQuizzes = async (userId: string, minResponses: number = 5) => {
  try {
    // Query for quizzes with very few responses
    const quizzesRef = collection(firestore, 'quizzes');
    const q = query(
      quizzesRef, 
      where('createdBy', '==', userId),
      where('responses', '<=', minResponses)
    );

    const querySnapshot = await getDocs(q);
    
    // Delete each inactive quiz and its submissions
    const deletionPromises = querySnapshot.docs.map(async (quizDoc) => {
      const quizId = quizDoc.id;
      
      // Delete quiz submissions
      const submissionsRef = collection(firestore, 'submissions');
      const submissionsQuery = query(submissionsRef, where('quizId', '==', quizId));
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      // Delete submissions first
      await Promise.all(
        submissionsSnapshot.docs.map(submissionDoc => 
          deleteDoc(doc(firestore, 'submissions', submissionDoc.id))
        )
      );

      // Then delete the quiz
      await deleteDoc(doc(firestore, 'quizzes', quizId));
    });

    await Promise.all(deletionPromises);

    return {
      deletedQuizCount: querySnapshot.size
    };
  } catch (error) {
    console.error('Error deleting inactive quizzes:', error);
    throw error;
  }
};
