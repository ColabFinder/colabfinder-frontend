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

    // If no profile exists, create a new one
    if (!data || data.length === 0) {
      console.log("No profile found for user.");
      document.getElementById("full-name").value = "";
      document.getElementById("avatar-url").value = "";
      document.getElementById("bio").value = "";

      // Optionally create a new profile here if none exists
      await supabase.from("profiles").insert([
        {
          user_id: user.id,
          full_name: "",
          avatar_url: "",
          bio: "",
        },
      ]);

    } else if (data.length > 1) {
      console.log("Multiple profiles found. Taking the first profile.");

      const profile = data[0];
      document.getElementById("full-name").value = profile.full_name || "";
      document.getElementById("avatar-url").value = profile.avatar_url || "";
      document.getElementById("bio").value = profile.bio || "";

      if (profile.avatar_url) {
        document.getElementById("avatar-preview").src = profile.avatar_url;
      }

      // Deleting duplicate profiles (keeping the first one)
      await supabase
        .from("profiles")
        .delete()
        .eq("user_id", user.id)
        .neq("id", profile.id);  // Ensure we are using the correct profile ID
    } else {
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

  // Save Profile
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

  // Logout functionality
  document.getElementById("logout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/login.html";
  });
});
