import React from 'jsx-dom';

function MenuButtons({ props }) {
  const { myPlayer } = props;
  const ProfileButton = () => (
    <button
      className="menu-button"
      title="Edit Profile"
      alt="Edit Profile"
      onClick={() => this.createProfileFormInterface(myPlayer)}
    >
      <i className="fas fa-user"></i>
    </button>
  );

  const LogoutButton = () => (
    <button
      className="menu-button"
      title="Logout"
      alt="Logout"
      onClick={() => this.firebaseAuth.signOut()}
    >
      <i className="fas fa-sign-out-alt"></i>
    </button>
  );

  return (
    <div id="menu-buttons-wrapper">
      <ProfileButton />
      <LogoutButton />
    </div>
  );
}

export default MenuButtons;
