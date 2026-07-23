(function attachDevelopmentAlphaClientConfig(globalScope) {
  globalScope.__GROWGO_DEVELOPMENT_ALPHA_CLIENT_CONFIG__ = Object.freeze({
    environment: "development",
    connectionMode: "emulator",

    firebase: Object.freeze({
      apiKey: "AIzaSyDxq6LaaS9VoFc9m_izLepGU6ByFE3fnVE",
      authDomain: "growgo-development.firebaseapp.com",
      projectId: "growgo-development",
      storageBucket: "growgo-development.firebasestorage.app",
      messagingSenderId: "281913453165",
      appId: "1:281913453165:web:7b937b175ac01396382d64",
      measurementId: ""
    }),

    emulator: Object.freeze({
      auth: Object.freeze({
        host: "127.0.0.1",
        port: 9099
      }),
      functions: Object.freeze({
        host: "127.0.0.1",
        port: 5003
      }),
      firestore: Object.freeze({
        host: "127.0.0.1",
        port: 8088
      })
    }),

    emulatorAuth: Object.freeze({
      email: "test@growgo.local",
      password: "Mike3989"
    }),

    inviteMirror: Object.freeze({
      requiredProvider: "password",
      allowedEmails: [
        "test@growgo.local"
      ]
    })
  });
})(globalThis);
