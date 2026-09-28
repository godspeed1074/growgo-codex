(function attachDevelopmentAlphaClientConfig(globalScope) {
  const hostname = String(globalScope.location?.hostname ?? "").toLowerCase();
  const isLoopback = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const isHttpsDeployment = globalScope.location?.protocol === "https:";

  // Persist the existing Rubberlips-only pilot across website releases.
  // The gameplay bridge checks the UID; the server checks UID, buff and its
  // own kill switch. This transport flag grants no capture permissions.
  globalScope.__GROWGO_AUTO_CAPTURE_BATCH_PILOT__ = false; // Rolled back after field-test regression.

  globalScope.__GROWGO_DEVELOPMENT_ALPHA_CLIENT_CONFIG__ = Object.freeze({
    // Localhost talks only to the Firebase emulators. An HTTPS deployment uses
    // the same public Firebase app identifiers, but connects to the real
    // development project and never exposes emulator credentials to players.
    environment: isLoopback || isHttpsDeployment ? "development" : "unknown",
    connectionMode: isLoopback ? "emulator" : "live",

    firebase: Object.freeze({
      apiKey: "AIzaSyDxq6LaaS9VoFc9m_izLepGU6ByFE3fnVE",
      authDomain: "growgo-development.firebaseapp.com",
      projectId: "growgo-development",
      storageBucket: "growgo-development.firebasestorage.app",
      messagingSenderId: "281913453165",
      appId: "1:281913453165:web:7b937b175ac01396382d64",
      measurementId: ""
    }),

    ...(isLoopback
      ? {
          emulator: Object.freeze({
            auth: Object.freeze({ host: "127.0.0.1", port: 9099 }),
            functions: Object.freeze({ host: "127.0.0.1", port: 5003 }),
            firestore: Object.freeze({ host: "127.0.0.1", port: 8088 })
          }),
          // A local operator can opt in for an emulator sign-in without a
          // password being committed to the project or shipped to Vercel.
          emulatorAuth: Object.freeze({
            email: globalScope.__GROWGO_LOCAL_EMULATOR_EMAIL__ ?? "",
            password: globalScope.__GROWGO_LOCAL_EMULATOR_PASSWORD__ ?? ""
          })
        }
      : {}),

    // The server allowlist is authoritative. Keeping this empty prevents the
    // browser bundle from revealing the private tester list.
    inviteMirror: Object.freeze({
      requiredProvider: "google.com",
      allowedEmails: []
    })
  });
})(globalThis);
