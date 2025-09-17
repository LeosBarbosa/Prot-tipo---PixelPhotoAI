/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ImageViewer from './ImageViewer';
import FooterActions from './FooterActions';
import FloatingControls from './FloatingControls';

interface EditorModalLayoutProps {
    controls: React.ReactNode;
}

const EditorModalLayout: React.FC<EditorModalLayoutProps> = ({ controls }) => {
    return (
        <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            <main className="flex-grow flex items-center justify-center p-4 bg-black/20 relative">
                <ImageViewer />
                <FloatingControls />
            </main>
            <aside className="w-full lg:w-96 lg:flex-shrink-0 bg-gray-900/40 border-l border-gray-700/50 flex flex-col">
                <div className="flex-grow p-4 overflow-y-auto">
                    {controls}
                </div>
                <FooterActions />
            </aside>
        </div>
    );
};
export default EditorModalLayout;