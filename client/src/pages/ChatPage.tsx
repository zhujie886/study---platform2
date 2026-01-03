import React from 'react';
import { useParams } from 'react-router-dom';

const ChatPage: React.FC = () => {
    const { targetUserId } = useParams<{ targetUserId: string }>();

    return (
        <div>
            <h1>Chat with User {targetUserId}</h1>
            {/* Chat interface will go here */}
        </div>
    );
};

export default ChatPage;
