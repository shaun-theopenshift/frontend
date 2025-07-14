"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, Window, MessageList, MessageInput, LoadingIndicator } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

export default function OrganizationInbox({ params }: { params: { applicantId: string } }) {
  const { user, isLoading: isUserLoading } = useUser();

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user || !user.sub) {
      return;
    }

    const applicantId = decodeURIComponent(params.applicantId).replace(/\|/g, '-');
    const organizationUserId = user.sub.replace(/\|/g, '-');

    const client = new StreamChat(process.env.NEXT_PUBLIC_STREAM_API_KEY!);

    const initChat = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: organizationUserId }),
        });

        if (!response.ok) {
          throw new Error('Failed to get chat token');
        }
        const { token } = await response.json();
        
        await client.connectUser({ id: organizationUserId }, token);
        setChatClient(client);
        
        const newChannel = client.channel('messaging', {
            members: [organizationUserId, applicantId],
            name: `Chat with applicant ${applicantId}`,
        });
        
        await newChannel.watch();
        setChannel(newChannel);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initChat();

    return () => {
      // Disconnect the user when the component unmounts or the user changes
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [user, params.applicantId]);

  if (isUserLoading || !chatClient || !channel) {
    return <LoadingIndicator />;
  }

  return (
    <div style={{ height: 'calc(100vh - 100px)' }}>
       <h1>Chat with Applicant</h1>
      <Chat client={chatClient} theme="messaging light">
        <Channel channel={channel}>
          <Window>
            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
} 