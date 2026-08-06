import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import SearchableSelect from "../components/SearchableSelect";
import { COUNTRIES } from "../utils/countries";
import { ALL_TIMEZONES } from "../utils/timezone";

function Settings() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setThemeState] = useState("dark");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  const [shareCode, setShareCode] = useState("");
  const [showAcceptInput, setShowAcceptInput] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  const [shareLocation, setShareLocation] = useState(true);
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [locationMsg, setLocationMsg] = useState("");

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setName(data.name || "");
      setUsername(data.username || "");
      setAvatarUrl(data.avatar_url || "");
      setThemeState(data.theme || "dark");
      setShareLocation(data.share_location !== false);
      setCountry(data.country || "");
      setTimezone(data.timezone || "UTC");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const applyTheme = (selectedTheme: string) => {
    const isDark =
      selectedTheme === "dark" ||
      (selectedTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("vtryse-theme", selectedTheme);
  };

  const handleThemeChange = async (newTheme: string) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name,
        username,
        avatar_url: avatarUrl,
        theme: newTheme,
      });

    if (error) setErrorMsg(error.message);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(newAvatarUrl);

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name, username, avatar_url: newAvatarUrl, theme });

    if (error) setErrorMsg(error.message);
    else setSuccessMsg("Profile picture updated!");

    setUploading(false);
  };

  const handleSaveAccount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("CURRENT USER:", user);

    const { data: whoamiData, error: whoamiError } =
      await supabase.rpc("whoami");
    console.log("WHOAMI:", whoamiData, whoamiError);

    if (!user) return;

    console.log("UPSERT PAYLOAD ID:", user.id);

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name, username, avatar_url: avatarUrl, theme });

    if (error) {
      console.log("UPSERT ERROR:", error);
      setErrorMsg(error.message);
      setSuccessMsg("");
    } else {
      setErrorMsg("");
      setSuccessMsg("Saved successfully!");
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg("");

    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMsg("Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMsg(error.message);
    } else {
      setPasswordMsg("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleShareWithOthers = async () => {
    const { data, error } = await supabase.rpc("create_share_code");
    if (error) {
      setShareMsg("Failed to generate code: " + error.message);
    } else {
      setShareCode(data);
      setShareMsg("");
    }
  };

  const handleAcceptSharing = async () => {
    if (!redeemCode) {
      setShareMsg("Enter a code first");
      return;
    }
    const { data, error } = await supabase.rpc("redeem_share_code", {
      input_code: redeemCode,
    });
    if (error || !data) {
      setShareMsg("Invalid or expired code");
    } else {
      setShareMsg("Successfully joined the shared dashboard! Refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleToggleShareLocation = async () => {
    const newValue = !shareLocation;
    setShareLocation(newValue);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ share_location: newValue })
      .eq("id", user.id);

    if (error) setErrorMsg(error.message);
  };

  const handleSaveLocation = async () => {
    setLocationMsg("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name,
        username,
        avatar_url: avatarUrl,
        theme,
        country,
        timezone,
      });

    if (error) setLocationMsg(error.message);
    else setLocationMsg("Location saved!");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This cannot be undone.",
    );
    if (!confirmed) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.functions.invoke("delete-account", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      setErrorMsg("Failed to delete account: " + error.message);
    } else {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const sectionLabel =
    "text-[11px] font-medium text-text-muted uppercase tracking-widest mb-4";
  const card = "bg-surface border border-border-subtle rounded-xl p-5 mb-4";
  const inputStyle =
    "border border-border-subtle bg-void p-2.5 rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-trace transition-colors";
  const primaryBtn =
    "bg-hover text-white px-4 py-2 rounded-lg text-sm hover:bg-trace-dim transition-colors";
  const secondaryBtn =
    "border border-border-subtle text-text-primary px-4 py-2 rounded-lg text-sm hover:bg-surface-hover transition-colors";

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-xl font-semibold mb-8 text-text-primary">Settings</h1>

      {/* Account */}
      <div className={card}>
        <p className={sectionLabel}>Account</p>

        <div className="flex items-center gap-4 mb-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border border-border-subtle"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center text-text-muted text-xs">
              No photo
            </div>
          )}
          <label className="text-sm text-trace cursor-pointer hover:underline">
            {uploading ? "Uploading..." : "Change photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputStyle}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputStyle}
          />
        </div>

        <button onClick={handleSaveAccount} className={primaryBtn}>
          Save Changes
        </button>

        {errorMsg && <p className="text-[#E02626] text-xs mt-2">{errorMsg}</p>}
        {successMsg && (
          <p className="text-[#DBD7D7] text-xs mt-2">{successMsg}</p>
        )}
      </div>

      {/* Privacy */}
      <div className={card}>
        <p className={sectionLabel}>Privacy</p>

        <div className="flex flex-col gap-2 mb-3">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputStyle}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputStyle}
          />
        </div>

        <button onClick={handleChangePassword} className={primaryBtn}>
          Update Password
        </button>

        {passwordMsg && (
          <p
            className={`text-xs mt-2 ${passwordMsg.includes("success") ? "text-green-400" : "text-red-400"}`}
          >
            {passwordMsg}
          </p>
        )}
      </div>

      {/* Theme */}
      <div className={card}>
        <p className={sectionLabel}>Theme</p>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                theme === t
                  ? "bg-hover hover:bg-trace-dim text-white hover:text-text-primary"
                  : "border border-border-subtle text-text-muted hover:bg-trace-dim hover:text-text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Country & Timezone */}
      <div className={card}>
        <p className={sectionLabel}>Country & Timezone</p>

        <div className="flex flex-col gap-2 mb-3">
          <SearchableSelect
            options={COUNTRIES.map((c) => ({ value: c.name, label: c.name }))}
            value={country}
            onChange={(val) => {
              setCountry(val);
              const match = COUNTRIES.find((c) => c.name === val);
              if (match) setTimezone(match.timezone);
            }}
            placeholder="Search country..."
          />
          <SearchableSelect
            options={ALL_TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
            value={timezone}
            onChange={setTimezone}
            placeholder="Search timezone..."
          />
        </div>

        <button onClick={handleSaveLocation} className={primaryBtn}>
          Save
        </button>

        {locationMsg && (
          <p
            className={`text-xs mt-2 ${locationMsg.includes("saved") ? "text-green-400" : "text-red-400"}`}
          >
            {locationMsg}
          </p>
        )}
      </div>

      {/* Location Sharing */}
      <div className={card}>
        <p className={sectionLabel}>Location Sharing</p>
        <p className="text-xs text-text-muted mb-3">
          Show your location, time, and weather to people sharing your
          dashboard.
        </p>
        <button
          onClick={handleToggleShareLocation}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            shareLocation
              ? "bg-hover text-white hover:bg-trace-dim"
              : "border border-border-subtle text-text-muted hover:bg-surface-hover"
          }`}
        >
          {shareLocation ? "Sharing Enabled" : "Sharing Disabled"}
        </button>
      </div>

      {/* Sharing */}
      <div className={card}>
        <p className={sectionLabel}>Sharing</p>

        <div className="flex flex-col gap-3">
          <div>
            <button onClick={handleShareWithOthers} className={primaryBtn}>
              Share with Others
            </button>
            {shareCode && (
              <div className="mt-3 bg-void border border-border-subtle rounded-lg p-3">
                <p className="text-[11px] text-text-muted mb-1">
                  Share this code
                </p>
                <p className="text-lg font-mono font-semibold text-trace tracking-widest">
                  {shareCode}
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowAcceptInput(!showAcceptInput)}
              className={secondaryBtn}
            >
              Accept Sharing
            </button>
            {showAcceptInput && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className={`${inputStyle} flex-1 font-mono tracking-widest`}
                />
                <button onClick={handleAcceptSharing} className={primaryBtn}>
                  Join
                </button>
              </div>
            )}
          </div>

          {shareMsg && (
            <p
              className={`text-xs ${shareMsg.includes("Success") ? "text-green-400" : "text-red-400"}`}
            >
              {shareMsg}
            </p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-900/40 rounded-xl p-5">
        <p className="text-[11px] font-medium text-red-400 uppercase tracking-widest mb-2">
          Danger Zone
        </p>
        <p className="text-xs text-text-muted mb-4">
          This action is permanent and cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-900/80 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Settings;
