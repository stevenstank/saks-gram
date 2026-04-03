"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { startConversation } from "../lib/conversations-api";
import { getAllUsers, type DiscoverUser } from "../lib/profile-api";
import { sendPostMessage } from "../lib/messages-api";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";

type SharePostModalProps = {
  isOpen: boolean;
  postId: string;
  onClose: () => void;
};

export function SharePostModal({ isOpen, postId, onClose }: SharePostModalProps) {
  const { token, user } = useAuth();
  const { showErrorToast, showSuccessToast } = useToast();

  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !token) {
      return;
    }

    setIsLoading(true);

    getAllUsers(token)
      .then((userItems) => {
        setUsers(userItems.filter((item) => item.id !== user?.id));
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to load share targets";
        showErrorToast(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, showErrorToast, token, user?.id]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((item) => item.username.toLowerCase().includes(query));
  }, [search, users]);

  async function sendToUser(targetUser: DiscoverUser): Promise<void> {
    if (!token) {
      showErrorToast("Missing authentication token");
      return;
    }

    setSendingToId(targetUser.id);

    try {
      const conversationId = await startConversation(token, targetUser.id);
      await sendPostMessage(token, conversationId, postId);
      showSuccessToast(`Shared with @${targetUser.username}`);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to share post";
      showErrorToast(message);
    } finally {
      setSendingToId(null);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-800 bg-[#111111] shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 className="text-base font-semibold text-white">Share post</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white">
            Close
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="share-search-users" className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
              Search users
            </label>
            <input
              id="share-search-users"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username"
              className="w-full rounded-xl border border-gray-700 bg-[#181818] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
            />
          </div>

          {isLoading ? <p className="text-sm text-gray-400">Loading users...</p> : null}

          {!isLoading ? (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Users</h3>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-800 bg-[#0f0f0f] p-2">
                {filteredUsers.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-gray-500">No matching users</p>
                ) : (
                  filteredUsers.map((targetUser) => (
                    <button
                      key={targetUser.id}
                      type="button"
                      onClick={() => {
                        void sendToUser(targetUser);
                      }}
                      disabled={sendingToId !== null}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Avatar src={targetUser.avatar ?? null} alt={`${targetUser.username} avatar`} name={targetUser.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">@{targetUser.username}</p>
                      </div>
                      {sendingToId === targetUser.id ? (
                        <span className="text-xs text-gray-500">Sending...</span>
                      ) : (
                        <span className="text-xs text-gray-500">Send</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </section>
          ) : null}

          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
