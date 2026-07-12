'use client';

import { useState } from 'react';

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'privacy', label: 'Privacy' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [bio, setBio] = useState('Tech enthusiast and writer.');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(false);
  const [theme, setTheme] = useState('system');
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [readingHistory, setReadingHistory] = useState(true);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    fontSize: '0.88rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '2rem',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  };

  const subtextStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    color: 'var(--text-tertiary)',
    marginBottom: '1.25rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', gap: '2rem' }}>
        {/* Sidebar */}
        <nav style={{ width: '200px', flexShrink: 0 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Settings
          </h1>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    background: activeTab === tab.id ? 'var(--primary-muted)' : 'transparent',
                    borderLeft: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'all 0.2s var(--ease-out-expo)',
                  }}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: 'var(--card-shadow)',
          }}>
            {/* Profile */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={headingStyle}>Profile</h2>
                <p style={subtextStyle}>Update your personal information and how others see you.</p>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'var(--primary-light)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700,
                    color: 'var(--primary)', flexShrink: 0,
                  }}>
                    JD
                  </div>
                  <div>
                    <button style={{
                      padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
                      transition: 'border-color 0.2s',
                    }}>
                      Upload Photo
                    </button>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <div style={sectionStyle}>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div style={sectionStyle}>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </div>

                <div style={sectionStyle}>
                  <label style={labelStyle}>Bio</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Account */}
            {activeTab === 'account' && (
              <div>
                <h2 style={headingStyle}>Account</h2>
                <p style={subtextStyle}>Manage your account settings and credentials.</p>

                <div style={sectionStyle}>
                  <label style={labelStyle}>Change Email</label>
                  <input
                    style={inputStyle}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    type="email"
                    placeholder="new-email@example.com"
                  />
                </div>

                <div style={sectionStyle}>
                  <label style={labelStyle}>Current Password</label>
                  <input
                    style={inputStyle}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>

                <div style={sectionStyle}>
                  <label style={labelStyle}>New Password</label>
                  <input
                    style={inputStyle}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>

                <div style={{
                  marginTop: '2.5rem', padding: '1.25rem', borderRadius: '12px',
                  border: '1px solid var(--error)', background: 'var(--error-light)',
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--error)', marginBottom: '0.35rem' }}>
                    Danger Zone
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button style={{
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--error)',
                    background: 'transparent', color: 'var(--error)', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
                    transition: 'background 0.2s',
                  }}>
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div>
                <h2 style={headingStyle}>Notifications</h2>
                <p style={subtextStyle}>Choose what notifications you receive.</p>

                {[
                  { label: 'Email Notifications', desc: 'Receive updates about your account via email', value: emailNotifications, setter: setEmailNotifications },
                  { label: 'Comment Notifications', desc: 'Get notified when someone comments on your articles', value: commentNotifications, setter: setCommentNotifications },
                  { label: 'Follow Notifications', desc: 'Get notified when someone follows you', value: followNotifications, setter: setFollowNotifications },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 0', borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.setter(!item.value)}
                      aria-label={`Toggle ${item.label}`}
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: item.value ? 'var(--primary)' : 'var(--border)',
                        position: 'relative', transition: 'background 0.2s', padding: 0, flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: '2px', left: item.value ? '22px' : '2px',
                        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div>
                <h2 style={headingStyle}>Appearance</h2>
                <p style={subtextStyle}>Customize the look and feel of the application.</p>

                <label style={labelStyle}>Theme</label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      style={{
                        padding: '10px 20px', borderRadius: '8px', border: '1px solid',
                        borderColor: theme === option.value ? 'var(--primary)' : 'var(--border)',
                        background: theme === option.value ? 'var(--primary-muted)' : 'var(--bg-elevated)',
                        color: theme === option.value ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
              <div>
                <h2 style={headingStyle}>Privacy</h2>
                <p style={subtextStyle}>Control your privacy and data settings.</p>

                {[
                  { label: 'Profile Visibility', desc: 'Make your profile visible to other users', value: profileVisibility, setter: setProfileVisibility },
                  { label: 'Reading History', desc: 'Save your reading history for recommendations', value: readingHistory, setter: setReadingHistory },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 0', borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.setter(!item.value)}
                      aria-label={`Toggle ${item.label}`}
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        background: item.value ? 'var(--primary)' : 'var(--border)',
                        position: 'relative', transition: 'background 0.2s', padding: 0, flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: '2px', left: item.value ? '22px' : '2px',
                        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Save button */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: 'var(--primary)', color: '#fff', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600,
                transition: 'background 0.2s',
              }}>
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
