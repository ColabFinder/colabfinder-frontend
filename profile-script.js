<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Profile</title>
</head>
<body>
  <h1>Your Profile</h1>

  <div>
    <img id="avatar" src="https://ui-avatars.com/api/?name=User&background=random" width="100" />
    <p><strong>User Avatar</strong></p>
  </div>

  <form id="profile-form">
    <div>
      <label for="full-name">Full Name</label>
      <input type="text" id="full-name" name="full-name" />
    </div>

    <div>
      <label for="email">Email</label>
      <input type="email" id="email" name="email" readonly />
    </div>

    <div>
      <label for="bio">Bio</label>
      <textarea id="bio" name="bio"></textarea>
    </div>

    <div>
      <label for="avatar-url">Avatar URL</label>
      <input type="text" id="avatar-url" name="avatar-url" placeholder="Enter avatar URL" />
    </div>

    <button type="submit">Save Profile</button>
    <button type="button" id="logout-button">Logout</button>
  </form>

  <script src="profile-script.js"></script>
</body>
</html>
