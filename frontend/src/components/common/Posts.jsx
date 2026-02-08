import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const Posts = ({ feedType, username, userId }) => {
  // Determine API endpoint based on feedType
  const getPostEndPoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/posts/all";
      case "following":
        return "/api/posts/following";
      case "posts":
        // fallback to empty string if username is undefined
        return username ? `/api/posts/user/${username}` : "/api/posts/all";
      case "likes":
        // fallback to empty string if userId is undefined
        return userId ? `/api/posts/likes/${userId}` : "/api/posts/all";
      default:
        return "/api/posts/all";
    }
  };

  const POST_ENDPOINT = getPostEndPoint();

  const {
    data: posts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["posts", feedType, username, userId], // include dependencies in queryKey
    queryFn: async () => {
      const res = await fetch(POST_ENDPOINT);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data;
    },
    keepPreviousData: true, // optional: prevents UI flicker when switching tabs
  });

  // Refetch when username, feedType, or userId changes
  useEffect(() => {
    refetch();
  }, [feedType, username, userId, refetch]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center gap-2">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!isLoading && !isRefetching && posts?.length === 0 && (
        <p className="text-center my-4 text-slate-400">
          No posts in this tab. Switch 👻
        </p>
      )}

      {!isLoading && !isRefetching && posts?.length > 0 && (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </>
  );
};

export default Posts;
