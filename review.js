// ========================
// 🔹 Cấu hình Firebase
// ========================
const firebaseConfig = {
  apiKey: "AIzaSyACK383pbLnLA1refbDu6XQ4Dp_SqdHGW8",
  authDomain: "traicababan.firebaseapp.com",
  databaseURL: "https://traicababan-default-rtdb.firebaseio.com",
  projectId: "traicababan",
  storageBucket: "traicababan.appspot.com",
  messagingSenderId: "168039844429",
  appId: "1:168039844429:web:9f709934c6e6ad25d22a04",
  measurementId: "G-WE9MJJBPJW"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// 👉 Email admin
const ADMIN_EMAIL = "truongquockahnh8526@gmail.com";

// ========================
// 🔹 Lấy tên cá theo tiêu đề
// ========================
const fishName = document.title
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/\s+/g, "-");

// ========================
// 🔹 Đăng nhập / Đăng xuất Google
// ========================
const loginBtn = document.createElement("button");
loginBtn.className = "btn";
loginBtn.textContent = "🔑 Đăng nhập Google";
loginBtn.style.margin = "10px 0";
document.body.insertBefore(loginBtn, document.body.firstChild);

let currentUser = null;
let lastReviewsData = null;

loginBtn.addEventListener("click", () => {
  if (currentUser) auth.signOut();
  else auth.signInWithPopup(provider);
});

auth.onAuthStateChanged(user => {
  currentUser = user;
  loginBtn.textContent = user
    ? `👋 ${user.displayName} (Đăng xuất)`
    : "🔑 Đăng nhập Google";
  renderReviews(lastReviewsData);
});

// ========================
// 🔹 Lấy điểm từ thanh kéo
// ========================
let selectedRating = parseInt(document.getElementById("ratingRange").value);
document.getElementById("ratingRange").addEventListener("input", (e) => {
  selectedRating = parseInt(e.target.value);
  document.getElementById("ratingValue").textContent = selectedRating;
});

// ========================
// 🔹 Gửi đánh giá
// ========================
document.getElementById("submitReview").addEventListener("click", () => {
  console.log("🟢 Nút gửi được bấm");

  const name = document.getElementById("reviewerName").value.trim();
  const content = document.getElementById("reviewContent").value.trim();

  if (!name || !content) {
    alert("Vui lòng nhập tên và nội dung đánh giá!");
    return;
  }

  const review = {
    name,
    content,
    rating: selectedRating,
    timestamp: new Date().toISOString(),
  };

  console.log("📨 Gửi lên Firebase:", review);

  db.ref(`review/${fishName}`).push(review)
    .then(() => {
      console.log("✅ Đã lưu thành công");
      document.getElementById("reviewerName").value = "";
      document.getElementById("reviewContent").value = "";
      document.getElementById("ratingRange").value = 5;
      document.getElementById("ratingValue").textContent = "5";
      selectedRating = 5;
    })
    .catch(err => console.error("❌ Lỗi khi lưu:", err));
});

// ========================
// 🔹 Trả lời & Xóa đánh giá
// ========================
function replyReview(reviewId) {
  const replyName = prompt("Nhập tên của bạn:");
  if (!replyName) return;
  const replyText = prompt("Nhập nội dung trả lời:");
  if (!replyText) return;

  const reply = {
    name: replyName,
    text: replyText,
    timestamp: new Date().toISOString(),
  };
  db.ref(`reviews/${fishName}/${reviewId}/replies`).push(reply);
}

function deleteReview(reviewId) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Chỉ admin mới có thể xóa đánh giá!");
    return;
  }
  if (confirm("Bạn có chắc muốn xóa đánh giá này?")) {
    db.ref(`reviews/${fishName}/${reviewId}`).remove();
  }
}

function deleteReply(reviewId, replyId) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Chỉ admin mới có thể xóa phản hồi!");
    return;
  }
  if (confirm("Bạn có chắc muốn xóa phản hồi này?")) {
    db.ref(`reviews/${fishName}/${reviewId}/replies/${replyId}`).remove();
  }
}

// ========================
// 🔹 Hiển thị danh sách đánh giá
// ========================
const listContainer = document.getElementById("reviewList");
const avgRating = document.getElementById("avgRating");
const totalReviews = document.getElementById("totalReviews");

function renderReviews(data) {
  lastReviewsData = data;
  listContainer.innerHTML = "";
  let total = 0, count = 0;

  if (!data) {
    listContainer.innerHTML = "<p>Chưa có đánh giá nào.</p>";
    avgRating.textContent = "0";
    totalReviews.textContent = "0";
    return;
  }

  const reviews = Object.entries(data).reverse();
  reviews.forEach(([id, r]) => {
    total += r.rating;
    count++;

    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <strong>${r.name}</strong> - Điểm: <b>${r.rating}/10</b><br>
      ${r.content}<br>
      <small>${new Date(r.timestamp).toLocaleString()}</small><br>
      <button class="btn" style="background:#666;" onclick="replyReview('${id}')">Trả lời</button>
      ${currentUser && currentUser.email === ADMIN_EMAIL ? `<button class="btn btn-delete" onclick="deleteReview('${id}')">Xóa</button>` : ""}
    `;

    if (r.replies) {
      Object.entries(r.replies).forEach(([rid, rep]) => {
        const repDiv = document.createElement("div");
        repDiv.className = "reply";
        repDiv.style.marginLeft = "20px";
        repDiv.style.background = "#eef";
        repDiv.style.padding = "6px";
        repDiv.style.borderRadius = "6px";
        repDiv.innerHTML = `
          <strong>${rep.name}:</strong> ${rep.text}<br>
          <small>${new Date(rep.timestamp).toLocaleString()}</small><br>
          ${currentUser && currentUser.email === ADMIN_EMAIL ? `<button class="btn btn-delete" style="background:#b32d2e;padding:3px 6px;" onclick="deleteReply('${id}','${rid}')">Xóa</button>` : ""}
        `;
        div.appendChild(repDiv);
      });
    }

    listContainer.appendChild(div);
  });

  avgRating.textContent = (total / count).toFixed(1);
  totalReviews.textContent = count;
}

db.ref(`reviews/${fishName}`).on("value", snapshot => renderReviews(snapshot.val()));
