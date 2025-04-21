// profile-script.js

// Initialize Supabase first!
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

  try {
    const { data, error, count } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio")
      .eq("user_id", user.id);

    if (error) {
      console.log("Profile load error:", error.message);
      alert("Error loading profile");
    }

    // Handle no profile case (if data is empty or null)
    if (!data || data.length === 0) {
      console.log("No profile found for user.");
      document.getElementById("full-name").value = "";
      document.getElementById("avatar-url").value = "";
      document.getElementById("bio").value = "";
    } else if (data.length > 1) {
      // Handle multiple profiles for the same user (this shouldn't normally happen)
      console.log("Multiple profiles found. Taking the first profile.");
      // You can take the first profile (assuming only one is correct)
      const profile = data[0];
      document.getElementById("full-name").value = profile.full_name || "";
      document.getElementById("avatar-url").value = profile.avatar_url || "";
      document.getElementById("bio").value = profile.bio || "";

      if (profile.avatar_url) {
        document.getElementById("avatar-preview").src = profile.avatar_url;
      }

      // Optionally, you could delete the duplicate profiles or handle them appropriately
      // Example: deleting all but the first profile
      await supabase
        .from("profiles")
        .delete()
        .eq("user_id", user.id)
        .neq("id", profile.id);  // Ensure we are using the correct profile ID
    } else {
      // Successful profile load (only one profile)
      const profile = data[0];
      document.getElementById("full-name").value = profile.full_name || "";
      document.getElementById("avatar-url").value = profile.avatar_url || "";
      document.getElementById("bio").value = profile.bio || "";

      if (profile.avatar_url) {
        document.getElementById("avatar-preview").src = profile.avatar_url;
      }
    }
  } catch (error) {
    console.log("Error fetching profile data:", error);
  }

  document.getElementById("save-profile").addEventListener("click", async () => {
    const fullName = document.getElementById("full-name").value;
    const avatarUrl = document.getElementById("avatar-url").value;
    const bio = document.getElementById("bio").value;

    try {
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
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    }
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });
});
