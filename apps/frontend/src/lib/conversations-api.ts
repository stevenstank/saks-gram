import { apiGet, apiPost } from "./api";

export type ConversationListItem = {
  id: string;
  participants: Array<{
    id: string;
    username: string;
    avatar: string | null;
  }>;
  lastMessage: {
    id: string;
    senderId: string;
    type: "TEXT" | "POST";
    text: string | null;
    postId: string | null;
    createdAt: string;
  } | null;
  updatedAt: string;
};

type GetConversationsResponse = {
  success: boolean;
  data: {
    conversations: ConversationListItem[];
  };
};

type StartConversationResponse = {
  success: boolean;
  data: {
    conversation: {
      id: string;
      participants: string[];
      lastMessageId: string | null;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export async function getConversations(): Promise<ConversationListItem[]> {
  const response = await apiGet<GetConversationsResponse>("/api/conversations");

  if (!response.success || !response.data || !Array.isArray(response.data.conversations)) {
    throw new Error("Invalid conversations response");
  }

  return response.data.conversations;
}

export async function startConversation(userId: string): Promise<string> {
  const response = await apiPost<StartConversationResponse>(
    "/api/conversations",
    { targetUserId: userId },
  );

  if (!response.success || !response.data?.conversation?.id) {
    throw new Error("Invalid start conversation response");
  }

  return response.data.conversation.id;
}
