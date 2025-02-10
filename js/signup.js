import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp
} from "./firebase.js";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const username = document.getElementById("username").value.trim();

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const userData = {
        username: username,
        email: email,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", user.uid), userData);
    }

    localStorage.setItem("loggedInUserUID", user.uid);
    alert("Account created successfully!");
    window.location.href = "dash-post.html"; 
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      alert("This email is already in use. Please log in.");
      window.location.href = "login.html";
    } else if (error.code === "auth/weak-password") {
      alert("Password is too weak. Please use a stronger password.");
    } else {
      alert(`Error: ${error.message}`);
    }
  }
});

document.getElementById("googleSignup").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      const username = user.displayName || "Google User";
      const userData = {
        username: username,
        email: user.email,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", user.uid), userData);
    }

    localStorage.setItem("loggedInUserUID", user.uid);
    alert("Signed up successfully with Google!");
    window.location.href = "dash-post.html";
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      alert("Google Sign-Up was canceled. Please try again.");
    } else if (error.code === "auth/credential-already-in-use") {
      alert("This Google account is already linked to another account. Please log in.");
      window.location.href = "login.html";
    } else {
      alert(`Error: ${error.message}`);
    }
  }
});
