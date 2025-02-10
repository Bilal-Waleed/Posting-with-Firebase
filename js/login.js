import { auth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, doc, getDoc, db, serverTimestamp } from "./firebase.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      localStorage.setItem("loggedInUserUID", user.uid);
      alert("Logged in successfully!");
      window.location.href = "dash-post.html";
    } else {
      alert("User data not found in database. Redirecting to Sign-Up...");
      await auth.signOut();
      window.location.href = "signup.html"; 
    }
  } catch (error) {

    if (error.code === "auth/user-not-found") {
      alert("No account found with this email. Redirecting to Sign-Up...");
      window.location.href = "signup.html";
    } else if (error.code === "auth/wrong-password") {
      alert("Incorrect password. Please try again.");
    } else {
      alert(`Error: ${error.message}`);
    }
  }
});

document.getElementById("googleLogin").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      localStorage.setItem("loggedInUserUID", user.uid);
    } else {
      const username = user.displayName || "Google User";
      const newUser = { username, email: user.email, createdAt: serverTimestamp() };
      await setDoc(doc(db, "users", user.uid), newUser);
      localStorage.setItem("loggedInUserUID", user.uid);
    }

    alert("Logged in with Google!");
    window.location.href = "dash-post.html";
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});
