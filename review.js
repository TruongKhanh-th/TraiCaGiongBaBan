// 🔹 Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDUMMY-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 🔹 Lấy tên trang để lưu riêng từng loại cá
const fishName = document.title;

// 🔹 Xử lý chọn sao
const stars = document.querySelectorAll('.star');
let selectedRating = 0;

stars.forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.value);
    stars.forEach(s => s.classList.remove('selected'));
    for (let i = 0; i < selectedRating; i++) {
      stars[i].classList.add('selected');
    }
  });
});

// 🔹 Gửi đánh giá
document.getElementById('submitReview').addEventListener('click', () => {
  const name = document.getElementById('reviewerName').value.trim();
  const content = document.getElementById('reviewContent').value.trim();

  if (!name || !content || selectedRating === 0) {
    alert("Vui lòng chọn số sao, nhập tên và nội dung đánh giá.");
    return;
  }

  const reviewRef = db.ref(`reviews/${fishName}`).push();
  reviewRef.set({
    name,
    content,
    rating: selectedRating,
    timestamp: Date.now()
  });

  document.getElementById('reviewerName').value = '';
  document.getElementById('reviewContent').value = '';
  stars.forEach(s => s.classList.remove('selected'));
  selectedRating = 0;
});

// 🔹 Hiển thị danh sách đánh giá
const reviewList = document.getElementById('reviewList');

db.ref(`reviews/${fishName}`).on('value', snapshot => {
  reviewList.innerHTML = '';
  snapshot.forEach(child => {
    const r = child.val();
    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <strong>${r.name}</strong> - ${'★'.repeat(r.rating)}<br>
      ${r.content}<br>
      <button class="btn btn-delete" onclick="deleteReview('${child.key}')">Xóa</button>
    `;
    reviewList.prepend(item);
  });
});

// 🔹 Xóa đánh giá
function deleteReview(key) {
  if (confirm("Bạn có chắc muốn xóa đánh giá này?")) {
    db.ref(`reviews/${fishName}/${key}`).remove();
  }
}
