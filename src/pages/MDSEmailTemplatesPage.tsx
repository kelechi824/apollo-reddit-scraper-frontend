import React from "react";

// Apollo Logo SVG Component from Figma
const ApolloLogo = () => (
  <svg width="139" height="38" viewBox="0 0 139 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M76.9365 11.002C79.5376 11.002 81.7387 11.9957 83.2842 13.7461C84.8249 15.4911 85.6826 17.9521 85.6826 20.8428C85.6825 23.7333 84.8248 26.1935 83.2842 27.9385C81.7387 29.689 79.5377 30.6826 76.9365 30.6826C74.7117 30.6826 72.9183 29.8379 71.6543 28.6514V36.9004H67.4121V11.4678H71.6543V13.0547C72.9192 11.8564 74.7134 11.002 76.9365 11.002ZM14.8984 21.3594C14.8976 19.1417 17.2556 17.7186 19.2158 18.7559L30.8984 24.9385L31.3691 25.1875L31.0908 25.6416C30.1661 27.1501 29.006 28.4985 27.6621 29.6357L27.3242 29.9209L27 29.6211L17.8525 21.1621C17.8167 21.1289 17.7882 21.1213 17.7676 21.1201C17.7421 21.1187 17.7091 21.1256 17.6777 21.1455C17.6465 21.1654 17.6268 21.192 17.6172 21.2158C17.6094 21.2352 17.6033 21.2646 17.6182 21.3115L21.1562 32.4609L21.3203 32.9756L20.7939 33.0986C19.5782 33.3842 18.311 33.5361 17.0088 33.5361C16.4503 33.5361 15.8978 33.5084 15.3535 33.4541L14.9033 33.4092V32.9561L14.8984 21.3594ZM12.6777 14.9541C14.8953 14.9535 16.3156 17.3141 15.2793 19.2744L9.11816 30.9307L8.86914 31.4014L8.41504 31.124C6.90827 30.203 5.56128 29.0464 4.42383 27.707L4.13672 27.3701L4.4375 27.0439L12.875 17.9102C12.9078 17.8745 12.9148 17.846 12.916 17.8252C12.9174 17.7995 12.9105 17.7668 12.8906 17.7354C12.8706 17.7039 12.844 17.6834 12.8203 17.6738C12.801 17.6661 12.7721 17.661 12.7256 17.6758L1.58594 21.2148L1.07324 21.3779L0.948242 20.8535C0.655579 19.6224 0.5 18.3379 0.5 17.0176C0.500012 16.4753 0.527154 15.9392 0.578125 15.4111L0.621094 14.96L1.0752 14.959L12.6777 14.9541ZM95.958 11.002C101.417 11.002 105.366 15.177 105.366 20.8428C105.366 26.5084 101.417 30.6836 95.958 30.6836C90.5191 30.6834 86.59 26.5062 86.5898 20.8428C86.5898 15.1792 90.519 11.0022 95.958 11.002ZM128.421 11.002C133.86 11.002 137.79 15.1791 137.79 20.8428C137.79 26.5063 133.86 30.6836 128.421 30.6836C122.962 30.6834 119.014 26.5083 119.014 20.8428C119.014 15.1771 122.962 11.0021 128.421 11.002ZM55.6836 3.84668L55.8125 4.15234L66.5176 29.5215L66.8105 30.2158H62.1709L62.043 29.9053L58.8672 22.1445H48.5674L45.5254 29.8984L45.4014 30.2158H40.959L41.2422 29.5264L51.666 4.15723L51.793 3.84668H55.6836ZM111.075 3.84668V30.2158H106.833V3.84668H111.075ZM117.547 3.84668V30.2158H113.305V3.84668H117.547ZM95.958 14.7412C94.3928 14.7413 93.1614 15.3179 92.3125 16.335C91.4549 17.3625 90.9482 18.8883 90.9482 20.8428C90.9483 22.7973 91.4549 24.3231 92.3125 25.3506C93.1614 26.3676 94.3929 26.9442 95.958 26.9443C97.5365 26.9443 98.7786 26.3661 99.6338 25.3486C100.497 24.3211 101.007 22.7963 101.007 20.8428C101.007 18.889 100.497 17.3635 99.6338 16.3359C98.7786 15.3185 97.5365 14.7412 95.958 14.7412ZM128.421 14.7412C126.843 14.7413 125.601 15.3187 124.746 16.3359C123.882 17.3635 123.372 18.889 123.372 20.8428C123.372 22.7964 123.883 24.3211 124.746 25.3486C125.601 26.3661 126.842 26.9443 128.421 26.9443C129.986 26.9443 131.218 26.3677 132.067 25.3506C132.925 24.3231 133.432 22.7973 133.432 20.8428C133.432 18.8884 132.925 17.3625 132.067 16.335C131.218 15.3178 129.986 14.7412 128.421 14.7412ZM76.625 14.8184C75.0959 14.8185 73.8278 15.385 72.9395 16.3398C72.0485 17.2977 71.5107 18.678 71.5107 20.3467V21.3389C71.5108 23.0073 72.0485 24.3871 72.9395 25.3447C73.8278 26.2995 75.0959 26.8661 76.625 26.8662C78.1157 26.8662 79.2659 26.3149 80.0547 25.3252C80.855 24.3209 81.3242 22.813 81.3242 20.8428C81.3242 18.8725 80.8549 17.3647 80.0547 16.3604C79.2659 15.3705 78.1158 14.8184 76.625 14.8184ZM25.5938 2.90723C27.1063 3.83042 28.4578 4.99046 29.5986 6.33496L29.8857 6.67285L29.585 6.99805L21.1025 16.1807C21.0693 16.2167 21.0627 16.2457 21.0615 16.2666C21.0601 16.2923 21.067 16.3251 21.0869 16.3564C21.1069 16.3877 21.1336 16.4075 21.1572 16.417C21.1765 16.4247 21.2054 16.4308 21.252 16.416L32.4404 12.8613L32.9551 12.6973L33.0791 13.2227C33.3656 14.4416 33.5176 15.7129 33.5176 17.0186C33.5176 17.58 33.4892 18.1348 33.4346 18.6816L33.3896 19.1318H32.9375L21.2998 19.1367C19.0824 19.1377 17.6612 16.7777 18.6973 14.8174L24.8916 3.09961L25.1396 2.62988L25.5938 2.90723ZM50.208 18.1582H57.1807L53.6377 9.70215L50.208 18.1582ZM19.0791 12.7324C19.0797 14.9499 16.7209 16.3724 14.7607 15.335L3.08301 9.15527L2.61426 8.90723L2.88965 8.45312C3.80806 6.94075 4.96246 5.58859 6.30078 4.44629L6.63867 4.1582L6.96484 4.45996L16.124 12.9297C16.1601 12.963 16.1893 12.9695 16.21 12.9707C16.2354 12.9721 16.2676 12.9652 16.2988 12.9453C16.3301 12.9254 16.3498 12.8988 16.3594 12.875C16.3671 12.8556 16.3732 12.8269 16.3584 12.7803L12.8066 1.58789L12.6436 1.0752L13.167 0.950195C14.4 0.656219 15.6867 0.5 17.0088 0.5C17.5535 0.500014 18.0915 0.527547 18.6221 0.579102L19.0732 0.62207V1.07617L19.0791 12.7324Z" fill="#1A1A1A" stroke="#EDEBE8"/>
  </svg>
);

// Image assets from Figma design
const emailIcon = "/c2fdd2e5c44671599a6d5754d56aa83f1bc2715c.svg";
const historyIcon = "/c708de996d9e4cf18d37bb601d5bd1da65f16d7e.svg";
const growthIcon = "/4d0140f9b77f2fb8acbdaabcc7edbc9b111b4027.svg";
const chartIcon = "/ed2e8182b80ed48c3df4b704af804cf2b58518a3.svg";
const youtubeIcon = "/82ba8b6a6cc6391d98b878ae7b016d778ec508e3.svg";
const instagramIcon = "/862c5e1b0ceb03183d078b5b878d4cf8d5a50aae.svg";
const tiktokIcon = "/fda0106804e9b31bf7ee8f257fe5ea3fd9a72e24.svg";

/**
 * MDS Email Templates Page Component
 * 
 * Shows both Desktop and Mobile versions side by side for comparison.
 * Desktop on the left, Mobile on the right.
 * 
 * Why this matters: Side-by-side view allows for easy comparison
 * and validation of responsive design implementation.
 */
const MDSEmailTemplatesPage: React.FC = () => {
  // Main container for side-by-side layout
  const mainContainerStyle: React.CSSProperties = {
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 20px',
    gap: '40px',
  };

  // Desktop version container
  const desktopContainerStyle: React.CSSProperties = {
    backgroundColor: '#edebe8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 32px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
  };

  const desktopContentWrapperStyle: React.CSSProperties = {
    width: '600px',
  };

  // Mobile version container
  const mobileContainerStyle: React.CSSProperties = {
    backgroundColor: '#edebe8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    width: '375px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    maxHeight: '812px',
    overflowY: 'auto',
  };

  const mobileContentWrapperStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '343px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '32px 0',
    width: '100%',
  };

  const heroSectionStyle: React.CSSProperties = {
    backgroundColor: '#fdffa8',
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '32px',
  };

  // Desktop styles
  const desktopHeadlineStyle: React.CSSProperties = {
    fontSize: '34px',
    fontWeight: 500,
    lineHeight: '38px',
    letterSpacing: '-0.34px',
    color: '#1a1a1a',
    marginBottom: '16px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const desktopBodyTextStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    color: '#47423d',
    marginBottom: '12px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  // Mobile styles
  const mobileHeadlineStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 500,
    lineHeight: '32px',
    letterSpacing: '-0.28px',
    color: '#1a1a1a',
    marginBottom: '16px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const mobileBodyTextStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '22px',
    color: '#47423d',
    marginBottom: '12px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const linkStyle: React.CSSProperties = {
    color: '#603fab',
    fontWeight: 500,
    textDecoration: 'underline',
    textUnderlinePosition: 'from-font',
  };

  const desktopButtonStyle: React.CSSProperties = {
    backgroundColor: '#243031',
    color: '#ffffff',
    padding: '16px 24px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '-0.18px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    marginTop: '20px',
  };

  const mobileButtonStyle: React.CSSProperties = {
    backgroundColor: '#243031',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '-0.16px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    marginTop: '16px',
    width: '100%',
  };

  const mainSectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '32px',
  };

  const mobileSectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  };

  const desktopSectionTitleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 500,
    lineHeight: '32px',
    letterSpacing: '-0.28px',
    color: '#1a1a1a',
    marginBottom: '32px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const mobileSectionTitleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 500,
    lineHeight: '28px',
    letterSpacing: '-0.22px',
    color: '#1a1a1a',
    marginBottom: '24px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const desktopListItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '32px',
  };

  const mobileListItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px',
  };

  const desktopIconBoxStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    backgroundColor: '#d4caf7',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const mobileIconBoxStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    backgroundColor: '#d4caf7',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const desktopListTextStyle: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#1a1a1a',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const mobileListTextStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#1a1a1a',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const desktopCalloutBoxStyle: React.CSSProperties = {
    border: '3px solid #243031',
    borderRadius: '12px',
    padding: '32px',
    marginTop: '32px',
    marginBottom: '32px',
  };

  const mobileCalloutBoxStyle: React.CSSProperties = {
    border: '2px solid #243031',
    borderRadius: '12px',
    padding: '24px',
    marginTop: '24px',
    marginBottom: '24px',
  };

  const eyebrowStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.28px',
    textTransform: 'uppercase',
    color: '#47423d',
    marginBottom: '16px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const mobileEyebrowStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '14px',
    letterSpacing: '0.24px',
    textTransform: 'uppercase',
    color: '#47423d',
    marginBottom: '12px',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '40px 32px',
    width: '100%',
  };

  const socialIconsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const footerLinksStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const footerLinkStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#603fab',
    textDecoration: 'underline',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  const copyrightStyle: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#47423d',
    textAlign: 'center',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  };

  // Label styles
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-30px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  return (
    <div style={mainContainerStyle}>
      {/* Desktop Version */}
      <div style={{ position: 'relative' }}>
        <span style={labelStyle}>Desktop View</span>
        <div style={desktopContainerStyle}>
          <div style={desktopContentWrapperStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <ApolloLogo />
          </div>

          {/* Hero Section */}
          <div style={heroSectionStyle}>
            <h1 style={desktopHeadlineStyle}>
              We get it—nothing stalls pipeline faster than emails stuck in spam.
            </h1>
            <p style={desktopBodyTextStyle}>
              Poor deliverability hurts credibility, slows down conversations, and dries up opportunities.
            </p>
            <p style={desktopBodyTextStyle}>
              That's why we're introducing{' '}
              <span style={linkStyle}>Email Warmup</span>
              , the easiest way to improve deliverability and ensure your emails hit inboxes, not spam folders.
            </p>
            <button style={desktopButtonStyle}>Learn more</button>
          </div>

          {/* Main Features Section */}
          <div style={mainSectionStyle}>
            <h2 style={desktopSectionTitleStyle}>
              With Apollo's Email Warmup, you can:
            </h2>

            {/* Feature List */}
            <div>
              <div style={desktopListItemStyle}>
                <div style={desktopIconBoxStyle}>
                  <img src={emailIcon} alt="" style={{ width: '24px', height: '24px' }} />
                </div>
                <div style={desktopListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Reduce deliverability headaches</strong>
                  {' '}with automated inbox activity
                </div>
              </div>

              <div style={desktopListItemStyle}>
                <div style={desktopIconBoxStyle}>
                  <img src={historyIcon} alt="" style={{ width: '24px', height: '24px' }} />
                </div>
                <div style={desktopListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Ramp up new mailboxes faster</strong>
                  {' '}to start prospecting sooner
                </div>
              </div>

              <div style={desktopListItemStyle}>
                <div style={desktopIconBoxStyle}>
                  <img src={growthIcon} alt="" style={{ width: '24px', height: '24px' }} />
                </div>
                <div style={desktopListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Boost campaign results</strong>
                  {' '}with more emails landing in inboxes
                </div>
              </div>

              <div style={desktopListItemStyle}>
                <div style={desktopIconBoxStyle}>
                  <img src={chartIcon} alt="" style={{ width: '24px', height: '24px' }} />
                </div>
                <div style={desktopListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Monitor domain health</strong>
                  {' '}and get real-time alerts before issues arise
                </div>
              </div>
            </div>

            {/* Pricing Callout */}
            <div style={desktopCalloutBoxStyle}>
              <p style={eyebrowStyle}>PRICING</p>
              <h3 style={{ ...desktopSectionTitleStyle, marginBottom: '16px' }}>
                All paid users can warm up one mailbox at no additional cost.
              </h3>
              <p style={{ ...desktopBodyTextStyle, marginBottom: 0 }}>
                Need more? Additional mailboxes (for free or paid users) can be warmed using Unified Credits or Export Credits—on a per-mailbox, per-month basis.
              </p>
            </div>

            {/* CTA Button */}
            <button style={desktopButtonStyle}>Warm up your inbox</button>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            {/* Social Icons */}
            <div style={socialIconsStyle}>
              <img src={youtubeIcon} alt="YouTube" style={{ width: '40px', height: '40px' }} />
              <img src={instagramIcon} alt="Instagram" style={{ width: '40px', height: '40px' }} />
              <img src={tiktokIcon} alt="TikTok" style={{ width: '40px', height: '40px' }} />
            </div>

            {/* Footer Links */}
            <div style={footerLinksStyle}>
              <a href="#" style={footerLinkStyle}>Manage preferences</a>
              <a href="#" style={footerLinkStyle}>Unsubscribe</a>
            </div>

            {/* Copyright */}
            <p style={copyrightStyle}>
              ©2025 Apollo. All rights reserved.<br />
              535 Mission St. San Francisco, CA 94115
            </p>

            {/* Footer Logo */}
            <ApolloLogo />
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div style={{ position: 'relative' }}>
        <span style={labelStyle}>Mobile View</span>
        <div style={mobileContainerStyle}>
        <div style={mobileContentWrapperStyle}>
          {/* Header */}
          <div style={{ ...headerStyle, padding: '24px 0' }}>
            <ApolloLogo />
          </div>

          {/* Hero Section */}
          <div style={{ ...heroSectionStyle, padding: '24px', marginBottom: '24px' }}>
            <h1 style={mobileHeadlineStyle}>
              We get it—nothing stalls pipeline faster than emails stuck in spam.
            </h1>
            <p style={mobileBodyTextStyle}>
              Poor deliverability hurts credibility, slows down conversations, and dries up opportunities.
            </p>
            <p style={mobileBodyTextStyle}>
              That's why we're introducing{' '}
              <span style={linkStyle}>Email Warmup</span>
              , the easiest way to improve deliverability and ensure your emails hit inboxes, not spam folders.
            </p>
            <button style={mobileButtonStyle}>Learn more</button>
          </div>

          {/* Main Features Section */}
          <div style={mobileSectionStyle}>
            <h2 style={mobileSectionTitleStyle}>
              With Apollo's Email Warmup, you can:
            </h2>

            {/* Feature List */}
            <div>
              <div style={mobileListItemStyle}>
                <div style={mobileIconBoxStyle}>
                  <img src={emailIcon} alt="" style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={mobileListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Reduce deliverability headaches</strong>
                  {' '}with automated inbox activity
                </div>
              </div>

              <div style={mobileListItemStyle}>
                <div style={mobileIconBoxStyle}>
                  <img src={historyIcon} alt="" style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={mobileListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Ramp up new mailboxes faster</strong>
                  {' '}to start prospecting sooner
                </div>
              </div>

              <div style={mobileListItemStyle}>
                <div style={mobileIconBoxStyle}>
                  <img src={growthIcon} alt="" style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={mobileListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Boost campaign results</strong>
                  {' '}with more emails landing in inboxes
                </div>
              </div>

              <div style={mobileListItemStyle}>
                <div style={mobileIconBoxStyle}>
                  <img src={chartIcon} alt="" style={{ width: '20px', height: '20px' }} />
                </div>
                <div style={mobileListTextStyle}>
                  <strong style={{ fontWeight: 500 }}>Monitor domain health</strong>
                  {' '}and get real-time alerts before issues arise
                </div>
              </div>
            </div>

            {/* Pricing Callout */}
            <div style={mobileCalloutBoxStyle}>
              <p style={mobileEyebrowStyle}>PRICING</p>
              <h3 style={{ ...mobileSectionTitleStyle, marginBottom: '12px' }}>
                All paid users can warm up one mailbox at no additional cost.
              </h3>
              <p style={{ ...mobileBodyTextStyle, marginBottom: 0 }}>
                Need more? Additional mailboxes (for free or paid users) can be warmed using Unified Credits or Export Credits—on a per-mailbox, per-month basis.
              </p>
            </div>

            {/* CTA Button */}
            <button style={mobileButtonStyle}>Warm up your inbox</button>
          </div>

          {/* Footer */}
          <div style={{ ...footerStyle, padding: '32px 24px' }}>
            {/* Social Icons */}
            <div style={socialIconsStyle}>
              <img src={youtubeIcon} alt="YouTube" style={{ width: '32px', height: '32px' }} />
              <img src={instagramIcon} alt="Instagram" style={{ width: '32px', height: '32px' }} />
              <img src={tiktokIcon} alt="TikTok" style={{ width: '32px', height: '32px' }} />
            </div>

            {/* Footer Links */}
            <div style={footerLinksStyle}>
              <a href="#" style={footerLinkStyle}>Manage preferences</a>
              <a href="#" style={footerLinkStyle}>Unsubscribe</a>
            </div>

            {/* Copyright */}
            <p style={copyrightStyle}>
              ©2025 Apollo. All rights reserved.<br />
              535 Mission St. San Francisco, CA 94115
            </p>

            {/* Footer Logo */}
            <ApolloLogo />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default MDSEmailTemplatesPage;