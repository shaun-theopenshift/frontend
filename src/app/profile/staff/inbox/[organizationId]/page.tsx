"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, Window, MessageList, MessageInput, LoadingIndicator } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

export default function StaffInbox({ params }: { params: { organizationId: string } }) {
  const { user, isLoading: isUserLoading } = useUser();

  // Sanitize IDs by replacing the invalid '|' character to make them Stream-compatible
  const organizationId = params.organizationId.replace(/\|/g, '-');
  const staffUserId = user?.sub?.replace(/\|/g, '-');

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!organizationId || !staffUserId) {
      return;
    }

    const client = new StreamChat(process.env.NEXT_PUBLIC_STREAM_API_KEY!);

    const initChat = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: staffUserId }),
        });

        if (!response.ok) {
          throw new Error('Failed to get chat token');
        }

        const { token } = await response.json();
        
        await client.connectUser({ id: staffUserId }, token);
        setChatClient(client);

        const channelId = `messaging-${organizationId}-${staffUserId}`;
        const newChannel = client.channel('messaging', channelId, {
          name: `Chat with organization ${organizationId}`,
          members: [staffUserId, organizationId],
        } as any);

        await newChannel.watch();
        setChannel(newChannel);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initChat();

    return () => {
      client.disconnectUser();
    };
  }, [organizationId, staffUserId]);

  if (isUserLoading || !chatClient || !channel) {
    return <LoadingIndicator />;
  }

  return (
    <div style={{ height: 'calc(100vh - 100px)' }}>
       <h1>Chat with Organization</h1>
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