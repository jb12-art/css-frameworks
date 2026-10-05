// index.js
'use-strict'; // Strict mode ON in local browser.

import { createPostCard } from '../ui/postCard.js';

import {
  getPost,
  getPosts,
  createPost,
  deletePost,
  updatePost,
  searchPosts,
} from '../api/posts.js';

import { load } from '../api/storage.js';
import { setAuthListener } from '../api/auth.js';

let allPosts = []; // store posts globally
let visibleCount = 10; // 10 posts will be shown at a time
const POSTS_PER_LOAD = 10;

const loadMoreBtn = document.getElementById('load-more');

// ======================
// Fetch & Display posts
// ======================
/**
 * Load posts depending on search term.
 * If searchTerm is empty, load all posts
 * If searchTerm has text, search API is used
 * * @example
 * Write some words in the searchbar and see what show up.
 */
async function loadPosts(searchTerm = '') {
  if (searchTerm.trim() === '') {
    const data = await getPosts(100);
    allPosts = data.data;
  } else {
    const data = await searchPosts(searchTerm);
    allPosts = data.data;
  }
}

// =============================
// Display posts in the 'media-box'
// =============================
/**
 * Renders the posts to the feed area.
 */
async function displayPosts(searchTerm = '', fetch = false) {
  const container = document.querySelector('.media-box');
  if (!container) return;

  // Fetch from API (all or search)
  if (fetch) {
    await loadPosts(searchTerm);
  }

  const currentUser = load('profile'); // logged-in user
  container.innerHTML = ''; // Clear old posts

  if (allPosts.length === 0) {
    container.innerHTML = '<p>No posts found.</p>';
    loadMoreBtn.style.display = 'none';
    return;
  }

  // Show only a slice of posts
  const postsToShow = allPosts.slice(0, visibleCount);

  postsToShow.forEach((post) => {
    const postCard = createPostCard(post);
    container.appendChild(postCard);
  });

  loadMoreBtn.style.display = visibleCount < allPosts.length ? 'block' : 'none';

  // View all user's posts button
  document.querySelectorAll('.view-user-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const username = btn.dataset.username;

      // Open new browser window tab
      window.open(`user-posts.html?name=${username}`, '_blank');
    });
  });

  // Delete button
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      event.stopPropagation();

      const id = btn.dataset.id;
      // Alert popup on delete button
      if (!confirm('Delete this post?')) return; // Stop if user click Cancel

      await deletePost(id);

      allPosts = []; // refresh data
      displayPosts(searchInput.value);
    });
  });

  // Edit button
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      event.stopPropagation(); // Prevent navigation to post page

      const id = btn.dataset.id;
      // Fetch single post for edit
      const { data: post } = await getPost(id);

      const card = btn.closest('.js-post-card');
      card.innerHTML = `
      <h3>Edit Post</h3>
       <form class="edit-form">
          <label>Title:</label>
          <input type="text" class="bg-gray-50" id="editTitle" value="${
            post.title
          }" />
          <label>Body:</label>
          <textarea id="editBody">${post.body || ''}</textarea>
          <label>Image URL:</label>
          <input type="url" id="editImage" value="${post.media?.url || ''}" />
          <button type="submit">Save</button>
          <button type="button" class="cancel-btn">Cancel</button>
       </form>
      `;

      // Save button
      card.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();

        await updatePost(
          id,
          e.target.edittitle.value,
          e.target.editBody.value,
          e.target.editImage.value,
        );
        allPosts = [];
        displayPosts(searchInput.value); // reload posts
      });

      // Cancel edit button
      card.querySelector('.cancel-btn').addEventListener('click', () => {
        displayPosts(searchInput.value);
      });
    });
  });
}

// =============================
// Search input event listener
// =============================
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    visibleCount = POSTS_PER_LOAD; // reset
    displayPosts(searchInput.value, true);
  });
}

// =============================
// Create post form handle
// =============================
/**
 * Handles the form submission to create a new post.
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>}
 */
const postForm = document.getElementById('createPostForm');
if (postForm) {
  postForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = postForm.querySelector('#postTitle').value;
    const body = postForm.querySelector('#postBody').value;
    const imageUrl = postForm.querySelector('#postImage').value;

    await createPost(title, body, imageUrl);
    postForm.reset();
    visibleCount = POSTS_PER_LOAD;
    displayPosts(searchInput.value, true);
  });
}

// =============================
// View profile button
// =============================
/**
 * Navigates the logged-in user to their profile page.
 * Alerts user if no profile exists or not logged in.
 */
const viewProfileBtn = document.getElementById('viewProfileBtn');
if (viewProfileBtn) {
  viewProfileBtn.addEventListener('click', () => {
    const currentUser = load('profile');
    if (!currentUser) {
      alert('Please login first.');
      return;
    }
    window.location.href = 'user-profile.html';
  });
}

// Load more button logic
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    visibleCount += POSTS_PER_LOAD;
    displayPosts(searchInput.value);
  });
}

// =============================
// Run setup
// =============================
// Run displayPosts after login
displayPosts('', true);
setAuthListener();
