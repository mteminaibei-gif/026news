'use client';

import { useState } from 'react';

const steps = [
  { number: 1, label: 'About You' },
  { number: 2, label: 'Portfolio' },
  { number: 3, label: 'Review' },
  { number: 4, label: 'Submitted' },
];

const niches = ['Technology', 'Business', 'Health', 'Sports', 'Entertainment', 'Science', 'Politics', 'Lifestyle'];
const experienceLevels = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'];

export default function AuthorApplyPage() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [niche, setNiche] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [motivation, setMotivation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const btnPrimary: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.88rem',
    fontWeight: 600,
    transition: 'background 0.2s',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.88rem',
    fontWeight: 500,
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '620px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>026NEWS</h1>
        </div>

        {/* Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.number} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', fontWeight: 600,
                  background: step >= s.number ? 'var(--primary)' : 'var(--bg-elevated)',
                  color: step >= s.number ? '#fff' : 'var(--text-muted)',
                  border: step >= s.number ? 'none' : '1px solid var(--border)',
                  transition: 'all 0.3s',
                }}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <span style={{
                  fontSize: '0.72rem', color: step >= s.number ? 'var(--primary)' : 'var(--text-muted)',
                  marginTop: '4px', fontWeight: step >= s.number ? 500 : 400,
                }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: '60px', height: '2px', margin: '0 8px', marginBottom: '18px',
                  background: step > s.number ? 'var(--primary)' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: 'var(--card-shadow)',
        }}>
          {/* Step 1: About You */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                About You
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Tell us a bit about yourself to get started.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Professional Title</label>
                <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tech Author" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Writing Niche</label>
                <select style={inputStyle} value={niche} onChange={(e) => setNiche(e.target.value)}>
                  <option value="">Select a niche</option>
                  {niches.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Bio</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your writing experience..."
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Years of Experience</label>
                <select style={inputStyle} value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option value="">Select experience level</option>
                  {experienceLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={btnPrimary} onClick={() => setStep(2)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 2: Portfolio */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Your Portfolio
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Share your work and professional presence.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Portfolio URL</label>
                <input style={inputStyle} value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>LinkedIn Profile</label>
                <input style={inputStyle} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
              </div>

              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Upload your writing samples
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  PDF, DOC, or TXT files up to 10MB
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={btnSecondary} onClick={() => setStep(1)}>Back</button>
                <button style={btnPrimary} onClick={() => setStep(3)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Review & Submit
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Review the benefits and submit your application.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: '💰', title: '70% Revenue Share', desc: 'Keep the majority of your earnings' },
                  { icon: '📊', title: 'Analytics Dashboard', desc: 'Track your article performance' },
                  { icon: '💳', title: 'M-Pesa Withdrawals', desc: 'Get paid directly to your M-Pesa' },
                  { icon: '✍️', title: 'Rich Editor', desc: 'Powerful writing and editing tools' },
                ].map((perk) => (
                  <div key={perk.title} style={{
                    padding: '1rem', borderRadius: '10px',
                    background: 'var(--primary-muted)', border: '1px solid var(--border-subtle)',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{perk.icon}</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '2px' }}>
                      {perk.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{perk.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Why do you want to write for 026NEWS?</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Share your motivation..."
                />
              </div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem',
              }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
                I agree to the terms and conditions
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button style={btnSecondary} onClick={() => setStep(2)}>Back</button>
                <button style={btnPrimary} onClick={() => setStep(4)}>Submit Application</button>
              </div>
            </div>
          )}

          {/* Step 4: Submitted */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'var(--success-light)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2rem',
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Application Submitted!
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                Thank you for applying to become a writer on 026NEWS. We&apos;ll review your application and get back to you within 48 hours.
              </p>
              <button style={btnPrimary} onClick={() => window.location.href = '/'}>
                Back to Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
