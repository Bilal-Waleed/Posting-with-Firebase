import {
    auth,
    db,
    signOut,
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    deleteDoc,
  } from "./firebase.js";
  
  const logoutButton = document.getElementById("logout-btn");
  const welcomeMessage = document.getElementById("welcome-message");
  const createPostBtn = document.getElementById("create-post-btn");
  const createPostModal = document.getElementById("create-post-modal");
  const closeModalIcon = document.getElementById("close-modal");
  const postText = document.getElementById("post-text");
  const postButton = document.getElementById("post-btn");
  const searchResultsContainer = document.getElementById("search-results-container");
  const myPostsBtn = document.getElementById("my-posts-btn");
  const modalTitle = document.getElementById("modal-title");
  
  let unsubscribePosts = null;
  let showingMyPosts = false;
  let currentEditingPostId = null;
  
  document.addEventListener("DOMContentLoaded", async () => {
    const loggedInUserUID = localStorage.getItem("loggedInUserUID");
  
    if (loggedInUserUID) {
      const userDoc = await getDoc(doc(db, "users", loggedInUserUID));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        welcomeMessage.textContent = `Welcome, ${userData.username}!`;
      } else {
        localStorage.removeItem("loggedInUserUID");
        window.location.href = "login.html";
      }
      loadPosts();
    } else {
      window.location.href = "login.html";
    }
  });
  
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("loggedInUserUID");
      alert("Logged out successfully!");
      window.location.href = "login.html";
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });
  
  createPostBtn.addEventListener("click", () => {
    openPostModal("Create Post", "");
  });
  
  closeModalIcon.addEventListener("click", closePostModal);
  
  postButton.addEventListener("click", async () => {
    const postContent = postText.value.trim();
  
    if (!postContent) {
      alert("Please enter some text for your post.");
      return;
    }
  
    if (postContent.length > 180) {
      alert(`Post content is too long! Please keep it under 180 characters. Current length: ${postContent.length}`);
      return;
    }
  
    const loggedInUserUID = localStorage.getItem("loggedInUserUID");
  
    try {
      if (currentEditingPostId) {
        await updateDoc(doc(db, "posts", currentEditingPostId), {
          content: postContent,
        });
        console.log("Post updated successfully!");
      } else {
        const newPostRef = await addDoc(collection(db, "posts"), {
          uid: loggedInUserUID,
          content: postContent,
          createdAt: serverTimestamp(),
        });
  
        // Optimistically update UI
        renderPost({
          id: newPostRef.id,
          uid: loggedInUserUID,
          content: postContent,
          createdAt: new Date(),
        });
        console.log("Post created successfully!");
      }
  
      postText.value = "";
      closePostModal();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });
  
  myPostsBtn.addEventListener("click", () => {
    showingMyPosts ? loadPosts() : loadMyPosts();
    myPostsBtn.textContent = showingMyPosts ? "My Posts" : "All Posts";
    showingMyPosts = !showingMyPosts;
  });
  
  function loadPosts() {
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    setupSnapshotListener(postsQuery);
  }
  
  function loadMyPosts() {
    const loggedInUserUID = localStorage.getItem("loggedInUserUID");
    if (!loggedInUserUID) return;
  
    const myPostsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    setupSnapshotListener(myPostsQuery, true);
  }
  
  function setupSnapshotListener(queryRef, filterByUser = false) {
    if (unsubscribePosts) unsubscribePosts();
  
    unsubscribePosts = onSnapshot(queryRef, (snapshot) => {
      const posts = [];
      snapshot.forEach((doc) => {
        const postData = doc.data();
        if (postData.createdAt) {
          if (!filterByUser || postData.uid === localStorage.getItem("loggedInUserUID")) {
            posts.push({ ...postData, id: doc.id });
          }
        }
      });
      renderPosts(posts);
    });
  }
  
  function renderPosts(posts) {
    searchResultsContainer.innerHTML = "";
    posts.forEach((post) => renderPost(post));
  }
  
  async function renderPost(post) {
    const postElement = document.createElement("div");
    postElement.classList.add("post-card");
  
    let username = "Unknown User";
  
    try {
      const userDoc = await getDoc(doc(db, "users", post.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        username = userData.username;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  
    const postTime = post.createdAt?.toDate?.()?.toLocaleTimeString("en-PK", {
        hour: "2-digit",
        minute: "2-digit",
      }) || "No timestamp";
      
      postElement.innerHTML = `
        <p><strong>${username}</strong> - ${postTime}</p>
        <p>${post.content}</p>
        <div class="post-actions"></div>
      `;
      
  
    const postActions = postElement.querySelector(".post-actions");
  
    const loggedInUserUID = localStorage.getItem("loggedInUserUID");
  
    if (post.uid === loggedInUserUID && showingMyPosts) {
      const editButton = document.createElement("button");
      editButton.classList.add("action-btn", "edit-btn");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        openPostModal("Edit Post", post.content, post.id);
      });
  
      const deleteButton = document.createElement("button");
      deleteButton.classList.add("action-btn", "delete-btn");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this post?")) {
          deletePost(post.id);
        }
      });
  
      postActions.appendChild(editButton);
      postActions.appendChild(deleteButton);
    }
  
    searchResultsContainer.appendChild(postElement);
  }
  
  function openPostModal(title, content = "", postId = null) {
    modalTitle.textContent = title;
    postText.value = content;
    currentEditingPostId = postId;
    createPostModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  
  function closePostModal() {
    createPostModal.classList.add("hidden");
    document.body.style.overflow = "auto";
    currentEditingPostId = null;
  }
  
  async function deletePost(postId) {
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      alert(`Error deleting post: ${error.message}`);
    }
  }
  