import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { FaArrowLeft, FaLink } from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { formatMemberSinceDate, formatPostDate } from "../../utils/db/date";

const ProfilePage = () => {
  const [coverImg, setCoverImg] = useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [feedType, setFeedType] = useState("posts");

  const coverImgRef = useRef(null);
  const profileImgRef = useRef(null);

  // Strip @ if URL has it
  const { username: rawUsername } = useParams();
  const username= rawUsername.startsWith("@")
    ? rawUsername.slice(1)
    : rawUsername;

// const {username} = useParams()

  // TODO: replace with actual logged-in user from context/auth
  const authUser = { username: "fuad_arage" };
  const isMyProfile = authUser?.username === username;
  // Fetch user profile
  const { data: user, isLoading } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/profile/${username}`);
      const data = await res.json();
      console.log("USER FROM API 👉", data);
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
  });
  const memberSinceDate = user?.createdAt
    ? formatMemberSinceDate(user.createdAt)
    : "";

  const handleImgChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "coverImg") setCoverImg(reader.result);
      if (type === "profileImg") setProfileImg(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen">
      {/* HEADER */}
      {isLoading && <ProfileHeaderSkeleton />}
      {!isLoading && !user && (
        <p className="text-center text-lg mt-4">User not found</p>
      )}

      {!isLoading && user && (
        <>
          {/* Top bar */}
          <div className="flex gap-10 px-4 py-2 items-center">
            <Link to="/">
              <FaArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex flex-col">
              <p className="font-bold text-lg">{user.fullName}</p>
              <span className="text-sm text-slate-500">
                {user.posts?.length || 0} posts
              </span>
            </div>
          </div>

          {/* Cover Image */}
          <div className="relative group">
            <img
              src={coverImg || user.coverImg || "/cover.png"}
              className="h-52 w-full object-cover"
              alt="cover"
            />

            {isMyProfile && (
              <div
                className="absolute top-2 right-2 p-2 bg-gray-800 bg-opacity-75 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition"
                onClick={() => coverImgRef.current.click()}
              >
                <MdEdit className="w-5 h-5 text-white" />
              </div>
            )}

            <input
              type="file"
              hidden
              accept="image/*"
              ref={coverImgRef}
              onChange={(e) => handleImgChange(e, "coverImg")}
            />

            {/* Profile Avatar */}
            <div className="avatar absolute -bottom-16 left-4">
              <div className="w-32 rounded-full relative group">
                <img
                  src={
                    profileImg || user.profileImg || "/avatar-placeholder.png"
                  }
                />
                {isMyProfile && (
                  <div
                    className="absolute top-5 right-3 p-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 cursor-pointer"
                    onClick={() => profileImgRef.current.click()}
                  >
                    <MdEdit className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
            <input
              type="file"
              hidden
              accept="image/*"
              ref={profileImgRef}
              onChange={(e) => handleImgChange(e, "profileImg")}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end px-4 mt-5">
            {isMyProfile && <EditProfileModal />}
            {!isMyProfile && (
              <button className="btn btn-outline rounded-full btn-sm">
                Follow
              </button>
            )}
            {(coverImg || profileImg) && (
              <button
                className="btn btn-primary rounded-full btn-sm text-white px-4 ml-2"
                onClick={() => alert("Profile updated successfully")}
              >
                Update
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col gap-4 mt-14 px-4">
            <div>
              <span className="font-bold text-lg">{user.fullName}</span>
              <span className="text-sm text-slate-500">@{user.username}</span>
              <p className="text-sm my-1">{user.bio}</p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              {user.link && (
                <div className="flex items-center gap-1">
                  <FaLink className="w-3 h-3 text-slate-500" />
                  <a
                    href={user.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {user.link}
                  </a>
                </div>
              )}

              {/* FIXED: Compute join date inside JSX */}
              <div className="flex items-center gap-1">
                <IoCalendarOutline className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">
                  joined {memberSinceDate}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex gap-1 items-center">
                <span className="font-bold text-xs">
                  {user.following?.length}
                </span>
                <span className="text-slate-500 text-xs">Following</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="font-bold text-xs">
                  {user?.followers?.length}
                </span>
                <span className="text-slate-500 text-xs">Followers</span>
              </div>
            </div>
          </div>

          {/* Feed Tabs */}
          <div className="flex w-full border-b border-gray-700 mt-4">
            <div
              className="flex-1 text-center p-3 cursor-pointer hover:bg-secondary relative"
              onClick={() => setFeedType("posts")}
            >
              Posts
              {feedType === "posts" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full" />
              )}
            </div>
            <div
              className="flex-1 text-center p-3 cursor-pointer hover:bg-secondary relative"
              onClick={() => setFeedType("likes")}
            >
              Likes
              {feedType === "likes" && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full" />
              )}
            </div>
          </div>
        </>
      )}

      {/* Posts */}
      <Posts feedType={feedType} username={username} userId={user?._id} />
    </div>
  );
};

export default ProfilePage;
