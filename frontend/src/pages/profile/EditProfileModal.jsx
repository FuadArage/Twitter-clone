import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const EditProfileModal = () => {
  const queryClient = useQueryClient();

  const initialState = {
    fullName: "",
    username: "",
    email: "",
    bio: "",
    link: "",
    newPassword: "",
    currentPassword: "",
  };

  const [formData, setFormData] = useState(initialState);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Profile Updated Successfully");

      // ✅ reset form
      setFormData(initialState);

      // ✅ close modal
      document.getElementById("edit_profile_modal").close();

      // ✅ refresh data
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <button
        className="btn btn-outline rounded-full btn-sm"
        onClick={() =>
          document.getElementById("edit_profile_modal").showModal()
        }
      >
        Edit profile
      </button>

      <dialog id="edit_profile_modal" className="modal">
        <div className="modal-box border border-gray-700 rounded-md">
          <h3 className="font-bold text-lg mb-4">Update Profile</h3>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              updateProfile();
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className="input input-bordered flex-1"
                value={formData.fullName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                className="input input-bordered flex-1"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="input input-bordered flex-1"
                value={formData.email}
                onChange={handleChange}
              />
              <textarea
                name="bio"
                placeholder="Bio"
                className="input input-bordered flex-1"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                name="currentPassword"
                placeholder="Current Password"
                className="input input-bordered flex-1"
                value={formData.currentPassword}
                onChange={handleChange}
              />
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                className="input input-bordered flex-1"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <input
              type="text"
              name="link"
              placeholder="Link"
              className="input input-bordered"
              value={formData.link}
              onChange={handleChange}
            />

            <button
              type="submit"
              className="btn btn-primary rounded-full text-white"
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Update"}
            </button>
          </form>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default EditProfileModal;


