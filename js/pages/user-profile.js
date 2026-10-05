// User’s own profile page

'use-strict'; // Strict mode ON in local browser.

import { createPostCard } from '../ui/postCard.js';

import { load } from '../api/storage.js';
import { getUserPosts } from '../api/posts.js';
import { getProfile, unfollowUser } from '../api/profiles.js';

async function displayUserProfile() {
  const container = document.querySelector('.media-box');
  if (!container) return;

  const currentUser = load('profile');
  if (!currentUser) {
    container.innerHTML = `<p>Login to view your profile.</p>`;
    return;
  }

  const username = currentUser.name;
  document.title = `${username}'s Profile`;

  // Fetch profile info
  const profileData = await getProfile(username);
  const profile = profileData.data;

  // Basic profile info
  container.innerHTML = `
  <div class="mx-5">
    <p><strong>Name:</strong> ${profile.name}</p>
    <p><strong>Email:</strong> ${profile.email}</p>
    <p><strong>Followers:</strong> ${profile._count.followers}</p>
    <p><strong>Following:</strong> ${profile._count.following}</p>
    <p><strong>Posts:</strong> ${profile._count.posts}</p>

    <h4>Users you follow</h4>
    <ul class="following-list"></ul>

    <hr>
    <h3>Your Posts</h3>    
  </div>

  <div class="user-posts"></div>
  `;

  // List of users you follow
  const followingList = container.querySelector('.following-list');

  if (profile.following.length === 0) {
    followingList.innerHTML = '<li>Not following anyone</li>';
  } else {
    profile.following.forEach((user) => {
      const li = document.createElement('li');

      li.innerHTML = `
      <span>${user.name}</span>
      <button class="unfollow-btn" data-username="${user.name}">
      Unfollow
      </button>
      `;

      followingList.appendChild(li);
    });
  }

  // Unfollow button
  followingList.querySelectorAll('.unfollow-btn').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      const username = event.target.dataset.username;

      if (!confirm(`Unfollow ${username}?`)) return;

      await unfollowUser(username);

      // Refresh profile page
      displayUserProfile();
    });
  });

  // Fetch user's own posts
  const postsData = await getUserPosts(username);
  const posts = postsData.data;

  const postsContainer = container.querySelector('.user-posts');

  if (!posts || posts.length === 0) {
    postsContainer.innerHTML = "<p>You haven't made any posts yet.</p>";
    return;
  }

  // Display posts / Render
  posts.forEach((post) => {
    const postCard = createPostCard(post, { showViewUser: false });
    postsContainer.appendChild(postCard);
  });
}

// Run setup
displayUserProfile();
