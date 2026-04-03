import { apiDelete, apiGet, apiPost } from "./api";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertConversationId(conversationId: string): void {
  if (!conversationId || !UUID_REGEX.test(conversationId)) {
    throw new Error("Invalid conversationId");
  }
}

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: "TEXT" | "POST";
  text: string | null;
  postId: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
  post: {
    id: string;
    image: string | null;
    caption: string;
    author: {
      id: string;
      username: string;
      avatar: string | null;
    };
  } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type GetConversationMessagesResponse = {
  success: boolean;
  data: {
    messages: ConversationMessage[];
    pagination: Pagination;
  };
};

type SendMessageResponse = {
  success: boolean;
  message: string;
  data: {
    message: {
      id: string;
      conversationId: string;
      senderId: string;
      type: "TEXT" | "POST";
      text: string | null;
      postId: string | null;
      createdAt: string;
    };
  };
};

export async function getConversationMessages(
  conversationId: string,
  page = 1,
  limit = 40,
): Promise<{ messages: ConversationMessage[]; pagination: Pagination }> {
  assertConversationId(conversationId);

  const response = await apiGet<GetConversationMessagesResponse>(
    `/api/messages/conversation/${encodeURIComponent(conversationId)}?page=${page}&limit=${limit}`,
  );

  if (!response.success || !response.data || !Array.isArray(response.data.messages)) {
    throw new Error("Invalid messages response");
  }

  return {
    messages: response.data.messages,
    pagination: response.data.pagination,
  };
}

export async function sendTextMessage(
  conversationId: string,
  text: string,
): Promise<SendMessageResponse["data"]["message"]> {
  assertConversationId(conversationId);

  const response = await apiPost<SendMessageResponse>(
    "/api/messages",
    {
      conversationId,
      type: "TEXT",
      text,
    },
  );

  if (!response.success || !response.data?.message) {
    throw new Error("Invalid send message response");
  }

  return response.data.message;
}

export async function sendPostMessage(
  conversationId: string,
  postId: string,
): Promise<SendMessageResponse["data"]["message"]> {
  assertConversationId(conversationId);

  const response = await apiPost<SendMessageResponse>(
    "/api/messages",
    {
      conversationId,
      type: "POST",
      postId,
    },
  );

  if (!response.success || !response.data?.message) {
    throw new Error("Invalid send message response");
  }

  return response.data.message;
}

type DeleteMessageResponse = {
  success: boolean;
  message: string;
};

export async function deleteMessage(messageId: string): Promise<void> {
  if (!messageId || messageId.trim() === "") {
    throw new Error("Invalid messageId");
  }

  const response = await apiDelete<DeleteMessageResponse>(`/api/messages/${encodeURIComponent(messageId)}`);

  if (!response.success) {
    throw new Error("Failed to delete message");
  }
}
