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

// Load current profile data to pre-fill form
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

    // Pre-fill form fields with current profile data
    document.getElementById('full-name').value = profile.full_name || '';
    document.getElementById('avatar-url').value = profile.avatar_url || '';
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('collab-type').value = profile.collab_type || '';
    document.getElementById('skills').value = profile.skills || '';
    document.getElementById('platforms').value = profile.platforms || '';
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

// Save updated profile data
async function saveProfile(event) {
  event.preventDefault(); // Prevent form from submitting the default way

  const fullName = document.getElementById('full-name').value;
  const avatarUrl = document.getElementById('avatar-url').value;
  const bio = document.getElementById('bio').value;
  const collabType = document.getElementById('collab-type').value;
  const skills = document.getElementById('skills').value;
  const platforms = document.getElementById('platforms').value;

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        bio: bio,
        collab_type: collabType,
        skills: skills,
        platforms: platforms,
      });

    if (error) {
      console.error("Profile update error:", error);
    } else {
      alert("Profile updated successfully!");
      window.location.href = "profile.html"; // Redirect back to profile page
    }
  } catch (error) {
    console.error("Error updating profile:", error);
  }
}

// Event listeners
document.getElementById('edit-profile-form').addEventListener('submit', saveProfile);
document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = "profile.html"; // Go back to profile page
});

// Call loadProfile when the page loads
document.addEventListener('DOMContentLoaded', loadProfile);
