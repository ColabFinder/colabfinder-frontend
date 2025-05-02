// dashboard-script.js – Runs on dashboard.html to fetch and display user data
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Ensure the user is logged in
  const user = supabase.auth.user();
  if (!user) {
    // No user session, redirect to login page
    window.location.href = "index.html";  // go back to login if not authenticated
    return;
  }

  // 2. Fetch profile data from 'profiles' table (assuming a table named 'profiles' with user info)
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, bio, avatar_url, collab_type, skills, platforms')
    .eq('id', user.id)
    .single();
  if (profileError) {
    console.error("Error fetching profile:", profileError);
    profile = {
      full_name: user.user_metadata?.full_name || "(Name not set)",
      email: user.email,
      bio: "",
      avatar_url: ""
    };
  }

  // Update profile section with fetched data
  document.getElementById('profile-name').textContent = profile.full_name || "(No name)";
  document.getElementById('profile-email').textContent = profile.email || user.email;
  document.getElementById('profile-bio').textContent = profile.bio || "(No bio)";
  const avatarImg = document.getElementById('avatar-img');
  if (profile.avatar_url) {
    avatarImg.src = profile.avatar_url;
  } else {
    avatarImg.src = "fallback-avatar.png"; // ensure fallback if no avatar URL
  }

  // 3. Fetch collaborations from 'collaborations' table for this user
  let { data: collabs, error: collabError } = await supabase
    .from('collaborations')
    .select('*')
    .eq('user_id', user.id);
  const collabListEl = document.getElementById('collab-list');
  collabListEl.innerHTML = "";  // clear "Loading..." placeholder

  if (collabError) {
    console.error("Error fetching collaborations:", collabError);
    collabListEl.innerHTML = "<li>Error loading collaborations.</li>";
  } else if (!collabs || collabs.length === 0) {
    // No collaborations found
    collabListEl.innerHTML = "<li>No collaborations found.</li>";
  } else {
    // Populate list with collaborations
    collabs.forEach(col => {
      const li = document.createElement('li');
      li.textContent = `${col.title} – ${col.type || 'Collaboration'}`;  // show title and type
      // Add an "Edit" link for each collaboration
      const editLink = document.createElement('a');
      editLink.href = `edit-collaboration.html?id=${col.id}`;
      editLink.textContent = " (Edit)";
      editLink.style.marginLeft = "8px";
      li.appendChild(editLink);
      collabListEl.appendChild(li);
    });
  }

  // 4. Handle logout
  document.getElementById('logout-link').addEventListener('click', async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    // After sign out, redirect to login
    window.location.href = "index.html";
  });
});
