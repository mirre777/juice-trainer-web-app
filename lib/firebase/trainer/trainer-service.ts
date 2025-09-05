import { arrayUnion, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "../firebase"
import { SimpleTrainer } from "./types"

interface AcceptInvitationResult {
  success: boolean
  trainerId: string
  clientId: string
}


export const acceptInvitation = async (invitationCode: string, userId: string): Promise<AcceptInvitationResult> => {
  const trainer = await getTrainerByInviteCode(invitationCode);
  // add userId to pendingUsers inside the trainer document
  await updateDoc(doc(db, "users", trainer.id), {
    pendingUsers: arrayUnion(userId),
  });

  await updateDoc(doc(db, "users", userId), {
    trainerId: trainer.id,
  });

  return {
    success: true,
    trainerId: trainer.id,
    clientId: userId,
  }
}

const getTrainerByInviteCode = async (invitationCode: string): Promise<SimpleTrainer> => {
    const trainerRef = collection(db, "users")
    const trainerQuery = query(trainerRef, where("role", "==", "trainer"), where("universalInviteCode", "==", invitationCode))
    const trainerSnapshot = await getDocs(trainerQuery)
    if (trainerSnapshot.empty) {
        throw new Error("Trainer not found")
    }

    const trainer = trainerSnapshot.docs[0]
    return {
      id: trainer.id,
      ...trainer.data(),
    } as SimpleTrainer
}