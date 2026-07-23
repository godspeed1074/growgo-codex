import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  browserSessionPersistence,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";

let emulatorConnectionsApplied = false;

export async function createDevelopmentAlphaFirebaseRuntime(runtimeContract) {
  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: runtimeContract.firebase.apiKey,
          authDomain: runtimeContract.firebase.authDomain,
          projectId: runtimeContract.firebase.projectId,
          storageBucket: runtimeContract.firebase.storageBucket,
          messagingSenderId: runtimeContract.firebase.messagingSenderId,
          appId: runtimeContract.firebase.appId,
          measurementId: runtimeContract.firebase.measurementId ?? undefined
        });

  const auth = getAuth(app);
  const functions = getFunctions(app, "australia-southeast1");

  await setPersistence(auth, browserSessionPersistence);

  if (runtimeContract.connectionMode === "emulator" && !emulatorConnectionsApplied) {
    connectAuthEmulator(
      auth,
      `http://${runtimeContract.emulator.auth.host}:${runtimeContract.emulator.auth.port}`,
      { disableWarnings: true }
    );
    connectFunctionsEmulator(
      functions,
      runtimeContract.emulator.functions.host,
      runtimeContract.emulator.functions.port
    );
    emulatorConnectionsApplied = true;
  }

  const provider = new GoogleAuthProvider();

  return {
    onAuthStateChanged(callback) {
      return onAuthStateChanged(auth, callback);
    },
    async signIn() {
      await signInWithPopup(auth, provider);
    },
    async signOut() {
      await firebaseSignOut(auth);
    },
    async bootstrapPlayer(payload) {
      const callable = httpsCallable(functions, "bootstrapPlayer");
      const response = await callable(payload);
      return response.data;
    },
    async getPlayerSnapshot() {
      const callable = httpsCallable(functions, "getPlayerSnapshot");
      const response = await callable({});
      return response.data.player ?? null;
    }
  };
}
