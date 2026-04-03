"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { getCurrentUser, updateProfile, uploadAvatar } from "../../../lib/profile-api";
import { Button } from "../../../components/ui/button";

type EditableProfile = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
};

export default function EditProfilePage() {
  const { token, isBootstrapping } = useAuth();
  const { showErrorToast, showSuccessToast } = useToast();
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [bio, setBio] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (!token) {
      setError("You must be logged in to edit your profile");
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    setError(null);

    getCurrentUser(token)
      .then((user) => {
        setProfile(user);
        setBio(user.bio ?? "");
        setPreviewUrl(user.avatar ?? null);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load profile";
        setError(message);
        showErrorToast(message);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [isBootstrapping, showErrorToast, token]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const avatarFallback = useMemo(() => {
    if (!profile?.username) {
      return "?";
    }

    return profile.username.slice(0, 1).toUpperCase();
  }, [profile?.username]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      const message = "You must be logged in to edit your profile";
      setError(message);
      showErrorToast(message);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let nextAvatar = profile?.avatar ?? null;

      if (selectedFile) {
        nextAvatar = await uploadAvatar(selectedFile, token);
      }

      const updated = await updateProfile(
        {
          bio: bio.trim() === "" ? null : bio.trim(),
          avatar: nextAvatar,
        },
        token,
      );

      setProfile(updated);
      setBio(updated.bio ?? "");
      setPreviewUrl(updated.avatar ?? null);
      setSelectedFile(null);
      const message = "Profile updated successfully";
      setSuccess(message);
      showSuccessToast(message);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to update profile";
      setError(message);
      showErrorToast(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoadingProfile || isBootstrapping) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-2xl rounded-2xl border border-gray-800 bg-[#111111] p-6 shadow-sm">
          <p className="text-sm text-gray-400">Loading edit form...</p>
        </section>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-2xl rounded-2xl border border-red-900/50 bg-red-950/30 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-300">Edit Profile Error</h1>
          <p className="mt-2 text-sm text-red-300">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-2xl rounded-2xl border border-gray-800 bg-[#111111] p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-semibold text-white">Edit Profile</h1>
        <p className="mt-1 text-sm text-gray-400">Update your bio and avatar.</p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="h-20 w-20 rounded-full border border-gray-800 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-800 text-xl font-semibold text-white">
                {avatarFallback}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white" htmlFor="avatar">
                Upload avatar
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
                className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-md file:border file:border-gray-800 file:bg-gray-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
              />
              <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB.</p>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-sm font-medium text-white">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={280}
              rows={4}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
              placeholder="Tell people a little about yourself"
            />
            <p className="mt-1 text-xs text-gray-400">{bio.length}/280</p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {success ? <p className="rounded-lg bg-emerald-900/40 px-3 py-2 text-sm text-emerald-300">{success}</p> : null}

          <Button type="submit" loading={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </section>
    </main>
  );
}
