"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../hooks/use-auth";
import { getCurrentUser, updateProfile, uploadAvatar } from "../../../lib/profile-api";

type EditableProfile = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
};

export default function EditProfilePage() {
  const { token, isBootstrapping } = useAuth();
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
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [isBootstrapping, token]);

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
      setError("You must be logged in to edit your profile");
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
      setSuccess("Profile updated successfully");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to update profile";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoadingProfile || isBootstrapping) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading edit form...</p>
        </section>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-rose-800">Edit Profile Error</h1>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Update your bio and avatar.</p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="h-20 w-20 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500">
                {avatarFallback}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="avatar">
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
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 5MB.</p>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-sm font-medium text-slate-700">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={280}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              placeholder="Tell people a little about yourself"
            />
            <p className="mt-1 text-xs text-slate-500">{bio.length}/280</p>
          </div>

          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          {success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>
    </main>
  );
}
