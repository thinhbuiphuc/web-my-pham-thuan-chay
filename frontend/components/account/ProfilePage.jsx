"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Header from "@/components/layout/Header";
import { API_BASE_URL, authHeaders, getToken, handleAuthError } from "@/lib/api";

const SKIN_TYPES = [
  { value: "chua_xac_dinh", label: "Chưa xác định" },
  { value: "da_dau", label: "Da dầu" },
  { value: "da_kho", label: "Da khô" },
  { value: "da_hon_hop", label: "Da hỗn hợp" },
  { value: "da_nhay_cam", label: "Da nhạy cảm" },
];

const emptyAddressForm = {
  recipientName: "",
  phone: "",
  addressText: "",
  isDefault: false,
};

/**
 * ProfilePage - Quan ly tai khoan ca nhan
 * Goi GET /api/auth/me, PUT /api/auth/profile, PUT /api/auth/change-password
 * So dia chi: POST/PUT/DELETE /api/auth/addresses
 */
export default function ProfilePage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    skinType: "chua_xac_dinh",
    allergicIngredients: [],
  });
  const [allergyInput, setAllergyInput] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressError, setAddressError] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAddressSection, setShowAddressSection] = useState(false);

  const applyProfileData = (data) => {
    setProfileForm({
      fullName: data.fullName || "",
      phone: data.phone || "",
      skinType: data.skinProfile?.skinType || "chua_xac_dinh",
      allergicIngredients: data.skinProfile?.allergicIngredients || [],
    });
    setAddresses(data.addresses || []);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!getToken()) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { ...authHeaders() },
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          if (handleAuthError(json)) return;
          setProfileError(json.message || "Không tải được hồ sơ cá nhân");
          return;
        }

        applyProfileData(json.data);
      } catch (err) {
        setProfileError("Không thể kết nối máy chủ, vui lòng thử lại sau");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddAllergy = (e) => {
    e.preventDefault();
    const value = allergyInput.trim();
    if (!value) return;

    // Khong them trung (so sanh khong phan biet hoa/thuong de tranh trung
    // nghia nhung khac cach viet hoa)
    const alreadyExists = profileForm.allergicIngredients.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );
    if (!alreadyExists) {
      setProfileForm((prev) => ({
        ...prev,
        allergicIngredients: [...prev.allergicIngredients, value],
      }));
    }
    setAllergyInput("");
  };

  const handleRemoveAllergy = (value) => {
    setProfileForm((prev) => ({
      ...prev,
      allergicIngredients: prev.allergicIngredients.filter((item) => item !== value),
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!profileForm.fullName.trim() || !profileForm.phone.trim()) {
      setProfileError("Vui lòng nhập đầy đủ Họ tên và Số điện thoại");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          phone: profileForm.phone.trim(),
          skinProfile: {
            skinType: profileForm.skinType,
            allergicIngredients: profileForm.allergicIngredients,
          },
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setProfileError(json.message || "Cập nhật thất bại, vui lòng thử lại");
        return;
      }

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, fullName: json.data.fullName })
      );

      setProfileSuccess("Cập nhật thông tin cá nhân thành công");
    } catch (err) {
      setProfileError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setProfileSaving(false);
    }
  };

  const openAddAddressForm = () => {
    // Dien san Ho ten/SDT tu thong tin ca nhan, do phan lon dia chi dung chung
    // nguoi nhan voi tai khoan - nguoi dung van sua duoc neu dia chi nay khac
    // (vd: giao toi cong ty, dung SDT khac voi tai khoan)
    setAddressForm({
      ...emptyAddressForm,
      recipientName: profileForm.fullName,
      phone: profileForm.phone,
    });
    setEditingAddressId(null);
    setAddressError("");
    setShowAddressForm(true);
  };

  const openEditAddressForm = (address) => {
    setAddressForm({
      recipientName: address.recipientName,
      phone: address.phone,
      addressText: address.addressText,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address._id);
    setAddressError("");
    setShowAddressForm(true);
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setAddressError("");
  };

  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressError("");

    if (
      !addressForm.recipientName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.addressText.trim()
    ) {
      setAddressError("Vui lòng nhập đầy đủ Người nhận, Số điện thoại và Địa chỉ");
      return;
    }

    setAddressSaving(true);
    try {
      const url = editingAddressId
        ? `${API_BASE_URL}/api/auth/addresses/${editingAddressId}`
        : `${API_BASE_URL}/api/auth/addresses`;
      const res = await fetch(url, {
        method: editingAddressId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          recipientName: addressForm.recipientName.trim(),
          phone: addressForm.phone.trim(),
          addressText: addressForm.addressText.trim(),
          isDefault: addressForm.isDefault,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setAddressError(json.message || "Lưu địa chỉ thất bại, vui lòng thử lại");
        return;
      }

      setAddresses(json.data.addresses || []);
      closeAddressForm();
    } catch (err) {
      setAddressError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (address) => {
    if (
      !window.confirm(
        `Xoá địa chỉ "${address.addressText}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setDeletingAddressId(address._id);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/auth/addresses/${address._id}`,
        {
          method: "DELETE",
          headers: { ...authHeaders() },
        }
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setAddressError(json.message || "Xoá địa chỉ thất bại");
        return;
      }

      setAddresses(json.data.addresses || []);
    } catch (err) {
      setAddressError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setPasswordError("Vui lòng nhập đầy đủ Mật khẩu cũ và Mật khẩu mới");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("Mật khẩu mới nhập lại không khớp");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setPasswordError(json.message || "Đổi mật khẩu thất bại");
        return;
      }

      setPasswordSuccess("Đổi mật khẩu thành công");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setPasswordError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Bạn có chắc muốn đăng xuất không?")) {
      return;
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-stone-800 mb-6">
          Tài khoản của tôi
        </h1>

        {!loggedIn ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3">
            Vui lòng{" "}
            <Link href="/login" className="font-medium underline">
              đăng nhập
            </Link>{" "}
            để xem thông tin tài khoản.
          </div>
        ) : loading ? (
          <p className="text-stone-500 text-sm">Đang tải thông tin...</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <button
                type="button"
                onClick={() => setShowProfileForm((v) => !v)}
                className="w-full flex items-center justify-between font-medium text-stone-800"
              >
                Thông tin cá nhân
                <ChevronDown
                  size={18}
                  className={`text-stone-400 transition-transform ${
                    showProfileForm ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProfileForm && (
                <form
                  onSubmit={handleProfileSubmit}
                  className="space-y-4 mt-4"
                >
                  {profileError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
                      {profileSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Họ và tên
                    </label>
                    <input
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Loại da
                    </label>
                    <select
                      name="skinType"
                      value={profileForm.skinType}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    >
                      {SKIN_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Thành phần bị dị ứng
                    </label>
                    <p className="text-xs text-stone-400 mb-2">
                      Nhập tên thành phần (VD: Paraben, Sulfate...) rồi bấm &quot;Thêm&quot;. Dữ liệu này giúp Chatbot AI cảnh báo khi tư vấn sản phẩm chứa thành phần bạn dị ứng.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddAllergy(e);
                        }}
                        placeholder="VD: Paraben"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={handleAddAllergy}
                        className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 transition"
                      >
                        Thêm
                      </button>
                    </div>
                    {profileForm.allergicIngredients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profileForm.allergicIngredients.map((item) => (
                          <span
                            key={item}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => handleRemoveAllergy(item)}
                              aria-label={`Xoá ${item}`}
                              className="text-red-400 hover:text-red-600"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <button
                type="button"
                onClick={() => setShowAddressSection((v) => !v)}
                className="w-full flex items-center justify-between font-medium text-stone-800"
              >
                Sổ địa chỉ giao hàng
                <ChevronDown
                  size={18}
                  className={`text-stone-400 transition-transform ${
                    showAddressSection ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAddressSection && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between -mt-1">
                    <p className="text-xs text-stone-400">
                      Lưu sẵn nhiều địa chỉ (nhà riêng, công ty...) để chọn
                      nhanh lúc đặt hàng, không cần nhập lại mỗi lần
                    </p>
                    <button
                      type="button"
                      onClick={openAddAddressForm}
                      className="text-sm font-medium text-emerald-700 hover:underline whitespace-nowrap ml-3"
                    >
                      + Thêm địa chỉ
                    </button>
                  </div>

                  {addressError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                      {addressError}
                    </div>
                  )}

                  {showAddressForm && (
                <form
                  onSubmit={handleAddressSubmit}
                  className="border border-stone-200 rounded-xl p-4 space-y-3 bg-stone-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-stone-700">
                      {editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
                    </p>
                    <button
                      type="button"
                      onClick={closeAddressForm}
                      className="text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="recipientName"
                      value={addressForm.recipientName}
                      onChange={handleAddressFormChange}
                      placeholder="Người nhận"
                      className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    />
                    <input
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressFormChange}
                      placeholder="Số điện thoại"
                      className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    />
                  </div>

                  <textarea
                    name="addressText"
                    value={addressForm.addressText}
                    onChange={handleAddressFormChange}
                    rows={2}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
                  />

                  <label className="flex items-center gap-1.5 text-sm text-stone-600">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) =>
                        setAddressForm((prev) => ({
                          ...prev,
                          isDefault: e.target.checked,
                        }))
                      }
                      className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-400"
                    />
                    Đặt làm địa chỉ mặc định
                  </label>

                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {addressSaving
                      ? "Đang lưu..."
                      : editingAddressId
                      ? "Cập nhật địa chỉ"
                      : "Lưu địa chỉ"}
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <p className="text-stone-500 text-sm">
                  Chưa có địa chỉ nào được lưu.
                </p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((address) => (
                    <div
                      key={address._id}
                      className="flex items-start justify-between gap-3 border border-stone-200 rounded-xl p-3"
                    >
                      <div className="text-sm">
                        <p className="text-stone-800 font-medium">
                          {address.recipientName} - {address.phone}{" "}
                          {address.isDefault && (
                            <span className="ml-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              Mặc định
                            </span>
                          )}
                        </p>
                        <p className="text-stone-500 mt-0.5">
                          {address.addressText}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditAddressForm(address)}
                          className="text-emerald-700 hover:underline text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={deletingAddressId === address._id}
                          onClick={() => handleDeleteAddress(address)}
                          className="text-red-600 hover:underline text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <button
                type="button"
                onClick={() => setShowPasswordForm((v) => !v)}
                className="w-full flex items-center justify-between font-medium text-stone-800"
              >
                Đổi mật khẩu
                <ChevronDown
                  size={18}
                  className={`text-stone-400 transition-transform ${
                    showPasswordForm ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showPasswordForm && (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4 mt-4"
                >
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
                      {passwordSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Mật khẩu cũ
                    </label>
                    <input
                      name="oldPassword"
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">
                        Mật khẩu mới
                      </label>
                      <input
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">
                        Nhập lại
                      </label>
                      <input
                        name="confirmNewPassword"
                        type="password"
                        value={passwordForm.confirmNewPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="w-full py-2.5 rounded-xl bg-stone-800 text-white font-medium hover:bg-stone-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {passwordSaving ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                  </button>
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
