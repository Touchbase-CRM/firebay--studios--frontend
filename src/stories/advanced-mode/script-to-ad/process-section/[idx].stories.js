import React from 'react';

export default {
    title: 'Advanced Mode/Process Section Documentation',
};

export const Documentation = () => (
    <div>
        <h1>Process Section Documentation</h1>
        <p>This document explains the organization and guidelines for updating the <code>ProcessSection</code> component found in <code>src/pages/advanced-mode/script-to-ad/process-section/[idx].js</code>.</p>

        <h2>Organization Guidelines</h2>
        <p>Below is the starting comment that must <strong>not</strong> be deleted under any circumstances:</p>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {`
/* DO NOT DELETE THIS COMMENT under any circumstance.
Title: How src/pages/advanced-mode/script-to-ad/process-section/[idx].js should be organized when you update it.
In this file, ===== xxxx ====== indicates the theme of the code block. 
When you are adding a new feature, create a new theme that explains the feature you are building.
For example, if you are adding a new audio filter, create a new theme called "Audio Filter" and add all the parent code blocks under it.
Shared code blocks should be organized under the "Misc Functions" theme. Existing themes must be maintained.
Any theme that is too long to read without scrolling, must be placed within #region : <theme name> #endregion to make it compact.
*/
      `}
        </pre>

        <h3>Explanation</h3>
        <ul>
            <li><strong>Themes</strong>: Use <code>===== xxxx ======</code> to indicate different themes within the code. Themes help organize your code logically.</li>
            <li><strong>New Features</strong>: When adding a new feature, create a corresponding theme and place all relevant code blocks under it.</li>
            <li><strong>Shared Code Blocks</strong>: Any code shared across features should be placed under the "Misc Functions" theme.</li>
            <li><strong>Code Blocks Length</strong>: If a theme becomes too long, wrap it with <code>#region</code> and <code>#endregion</code> to make it more compact and easier to navigate.</li>
        </ul>

        <h3>Example</h3>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {`
// ===== Audio Filter =====
// Code related to audio filtering should be placed here.
function applyAudioFilter() {
  // Logic for the audio filter
}
      `}
        </pre>
    </div>
);
