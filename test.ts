import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const studentRef = doc(db, 'teachers', 'dummy-teacher', 'classes', 'dummy-class', 'batches', 'dummy-batch', 'students', 'dummy-student');
    await setDoc(studentRef, { test: 1 });
    console.log("Success");
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();
