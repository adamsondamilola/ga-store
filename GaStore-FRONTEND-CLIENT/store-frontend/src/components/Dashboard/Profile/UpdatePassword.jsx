"use client";

import { useState } from "react";
import { FiLock, FiShield } from "react-icons/fi";
import requestHandler from "@/utils/requestHandler";
import endpointsPath from "@/constants/EndpointsPath";
import toast from "react-hot-toast";
import { DashboardPageShell, DashboardPanel } from "../PageShell";

const UpdatePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await requestHandler.put(
        `${endpointsPath.profile}/update-password`,
        {
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        },
        true
      );

      if (response.statusCode !== 200) {
        toast.error(response.result.message || "Error updating password");
      } else {
        toast.success(response.result.message);
        setNewPassword("");
        setConfirmNewPassword("");
        setCurrentPassword("");
      }
    } catch (error) {
      console.log("Error:", error);
      toast.error("Error updating password");
    }

    setIsLoading(false);
  };

  return (
    <DashboardPageShell
      eyebrow="Security"
      title="Update Password"
      description="Keep your account secure with a strong password."
    >
      <DashboardPanel className="max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4ec] text-[#ea580c]">
            <FiShield className="text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Password Settings</h2>
            <p className="text-sm text-gray-500">Use at least one strong, memorable password.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            {
              id: "currentPassword",
              label: "Current Password",
              value: currentPassword,
              setter: setCurrentPassword,
            },
            {
              id: "newPassword",
              label: "New Password",
              value: newPassword,
              setter: setNewPassword,
            },
            {
              id: "confirmNewPassword",
              label: "Confirm New Password",
              value: confirmNewPassword,
              setter: setConfirmNewPassword,
            },
          ].map((field) => (
            <div key={field.id}>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor={field.id}>
                {field.label}
              </label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id={field.id}
                  type="password"
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full rounded-2xl border border-[#e8ded6] bg-[#fcfaf8] py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#f3c9a7] focus:bg-white"
                />
              </div>
            </div>
          ))}

          <button
            className={`w-full rounded-2xl py-3 text-sm font-semibold text-white transition ${
              isLoading ? "cursor-not-allowed bg-gray-400" : "bg-gray-950 hover:bg-black"
            }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </DashboardPanel>
    </DashboardPageShell>
  );
};

export default UpdatePassword;
