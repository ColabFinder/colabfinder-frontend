// Supabase Initialization
const { createClient } = supabase;
const supabaseUrl = 'https://eqpmbcbaqgdmrhwmvlya.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'YOUR_SUPABASE_KEY'; // Replace with your Supabase anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Check if user is logged in
const user = supabase.auth.user();
if (!user) {
  window.location.href = "login.html"; // Redirect to login if no user is logged in
}

// Load user profile and collaborations
async function loadProfile() {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, bio, avatar_url, collab_type, skills, platforms')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error("Profile load error:", profileError);
      return;
    }

    // Update profile information on the page
    document.getElementById('full-name').textContent = profile.full_name || 'N/A';
    document.getElementById('email').textContent = profile.email || 'N/A';
    document.getElementById('bio').textContent = profile.bio || 'N/A';
    document.getElementById('profile-avatar').src = profile.avatar_url || 'https://via.placeholder.com/100';
    
    // Display collaboration data
    loadCollaborations();

  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

// Load collaborations
async function loadCollaborations() {
  try {
    const { data: collaborations, error: collaborationsError } = await supabase
      .from('collaborations')
      .select('*')
      .eq('user_id', user.id);

    if (collaborationsError) {
      console.error("Error loading collaborations:", collaborationsError);
      return;
    }

    const collaborationsList = document.getElementById('collaborations-list');
    collaborationsList.innerHTML = ''; // Clear current list

    if (collaborations.length === 0) {
      collaborationsList.innerHTML = '<li>No collaborations found.</li>';
    } else {
      collaborations.forEach(collab => {
        const listItem = document.createElement('li');
        listItem.textContent = `Collaboration: ${collab.name} - Status: ${collab.status}`;
        collaborationsList.appendChild(listItem);
      });
    }
  } catch (error) {
    console.error("Error loading collaborations:", error);
  }
}

// Event listener for editing the profile
document.getElementById('edit-profile-btn').addEventListener('click', () => {
  window.location.href = "edit-profile.html"; // Redirect to edit profile page
});

// Event listener for adding collaboration
document.getElementById('add-collaboration-btn').addEventListener('click', () => {
  window.location.href = "add-collaboration.html"; // Redirect to add collaboration page
});

// Call loadProfile when the page loads
document.addEventListener('DOMContentLoaded', loadProfile);
