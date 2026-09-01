"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { API_BASE_URL, authHeaders, getStoredUser, handleAuthError } from "@/lib/api";

/**
 * AdminUserList - (Admin) quan ly tai khoan khach hang: xem danh sach, khoa/mo khoa, xoa
 * (chi xoa duoc neu tai khoan chua tung dat don hang, backend tu chan neu da co don).
 * Nut doi vai tro dang an vi website hien chi co 1 admin; backend PUT /api/users/:id
 * van nhan { role } neu can bat lai sau nay (them nhan vien).
 * GET /api/users, PUT/DELETE /api/users/:id
 */
export default function AdminUserList() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Không tải được danh sách tài khoản");
        return;
      }

      setUsers(json.data);
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateUserData = async (targetId, payload) => {
    setSavingId(targetId);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${targetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Cập nhật tài khoản thất bại");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === targetId ? json.data : u))
      );
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setSavingId(null);
    }
  };

  const toggleLock = (targetUser) => {
    updateUserData(targetUser._id, { isLocked: !targetUser.isLocked });
  };

  const handleDelete = async (targetUser) => {
    if (
      !window.confirm(
        `Xoá vĩnh viễn tài khoản "${targetUser.fullName}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setSavingId(targetUser._id);
    setListError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${targetUser._id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (handleAuthError(json)) return;
        setListError(json.message || "Xoá tài khoản thất bại");
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
    } catch {
      setListError("Không thể kết nối máy chủ, vui lòng thử lại sau");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout title="Quản lý người dùng">
      <div className="max-w-5xl">
        {listError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {listError}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden overflow-x-auto">
          {loading ? (
            <p className="text-stone-500 text-sm p-6">Đang tải danh sách...</p>
          ) : users.length === 0 ? (
            <p className="text-stone-500 text-sm p-6">Chưa có tài khoản nào.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-100">
                  <th className="p-3 font-medium">Họ tên</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">SĐT</th>
                  <th className="p-3 font-medium">Vai trò</th>
                  <th className="p-3 font-medium">Trạng thái</th>
                  <th className="p-3 font-medium">Ngày tạo</th>
                  <th className="p-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="p-3 text-stone-800">{u.fullName}</td>
                    <td className="p-3 text-stone-500">{u.email}</td>
                    <td className="p-3 text-stone-500">{u.phone}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          u.role === "admin"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Khách hàng"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          u.isLocked
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {u.isLocked ? "Đã khoá" : "Hoạt động"}
                      </span>
                    </td>
                    <td className="p-3 text-stone-500">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={savingId === u._id || u._id === user?.id}
                        onClick={() => toggleLock(u)}
                        className={`hover:underline mr-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline ${
                          u.isLocked ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {u.isLocked ? "Mở khoá" : "Khoá"}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === u._id || u._id === user?.id}
                        onClick={() => handleDelete(u)}
                        className="text-red-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
