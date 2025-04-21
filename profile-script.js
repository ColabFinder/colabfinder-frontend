// profile-script.js

// ✅ Initialize Supabase first!
const supabase = window.supabase.createClient(
  "https://eqpmbcbaqgdmrhwmvlya.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcG1iY2JhcWdkbXJod212bHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDg4ODQsImV4cCI6MjA2MDQyNDg4NH0.V3SwBCiBkGO_YxTKnE7jbdFthmXAJNbiEVcjsLUYCaM"
);

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  document.getElementById("email").value = user.email;

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, bio")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.log("Profile load error:", error.message);
  } else {
    document.getElementById("full-name").value = data.full_name || "";
    document.getElementById("avatar-url").value = data.avatar_url || "";
    document.getElementById("bio").value = data.bio || "";

    if (data.avatar_url) {
      document.getElementById("avatar-preview").src = data.avatar_url;
    }
  }

  document.getElementById("save-profile").addEventListener("click", async () => {
    const fullName = document.getElementById("full-name").value;
    const avatarUrl = document.getElementById("avatar-url").value;
    const bio = document.getElementById("bio").value;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        bio: bio
      });

    if (error) {
      alert("Failed to update profile: " + error.message);
    } else {
      alert("Profile updated!");
      document.getElementById("avatar-preview").src = avatarUrl;
    }
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });
});
