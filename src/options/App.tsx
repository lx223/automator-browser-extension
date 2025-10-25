import React from 'react'
import { useSettings } from '../hooks/useSettings'

const OptionsApp: React.FC = () => {
  const { settings, isLoading, handleSettingChange, handleResetSettings } = useSettings();

  if (isLoading) {
    return (
      <div className="options-container">
        <div className="loading">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>Overtabbed Extension Settings</h1>
        <p>Configure your extension preferences</p>
      </header>

      <main className="options-main">
        <section className="settings-section">
          <h2>General Settings</h2>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.extensionEnabled}
                onChange={(e) => handleSettingChange('extensionEnabled', e.target.checked)}
              />
              Enable Extension
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoHighlight}
                onChange={(e) => handleSettingChange('autoHighlight', e.target.checked)}
              />
              Auto-highlight elements
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h2>Appearance</h2>
          
          <div className="setting-item">
            <label htmlFor="theme">Theme:</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="highlightColor">Highlight Color:</label>
            <input
              type="color"
              id="highlightColor"
              value={settings.highlightColor}
              onChange={(e) => handleSettingChange('highlightColor', e.target.value)}
            />
          </div>
        </section>

        <section className="settings-section">
          <h2>Actions</h2>
          
          <button onClick={handleResetSettings} className="reset-btn">
            Reset to Defaults
          </button>
        </section>
      </main>

      <footer className="options-footer">
        <p>Settings are automatically saved</p>
      </footer>
    </div>
  )
}

export default OptionsApp