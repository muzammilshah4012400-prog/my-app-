"use client";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  // فرضی ڈیٹا (ٹیسٹنگ کے لیے)
  const [requests, setRequests] = useState([
    { id: 1, user: "Ahmad", amount: "500 PKR", txnId: "TXN12345", status: "Pending" },
    { id: 2, user: "Ali", amount: "1000 PKR", txnId: "TXN98765", status: "Pending" }
  ]);

  // کلاک ٹائم چیک کرنے کا فنکشن
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    
    // پاکستان کے ٹائم کے حساب سے گھنٹہ اور منٹ نکالنا
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // صحیح پاسورڈ موجودہ وقت ہوگا (جیسے 2018)
    const correctTimePassword = `${hours}${minutes}`;

    if (password === correctTimePassword) {
      setIsAuthorized(true);
      setError("");
    } else {
      setError("غلط پاسورڈ! (اشارہ: اس وقت کا صحیح ٹائم لکھیں، جیسے HHMM)");
    }
  };

  const handleAction = (id: number, status: string) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status } : req));
    alert(`درخواست ${status === "Approved" ? "قبول (Accept)" : "رد (Reject)"} کر دی گئی ہے!`);
  };

  if (!isAuthorized) {
    return (
      <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif", direction: "rtl" }}>
        <h2>🔐 ایڈمن سیکیورٹی لاک (Clock Time)</h2>
        <p>آگے بڑھنے کے لیے اپنے موبائل یا کمپیوٹر کی گھڑی کا موجودہ ٹائم (HHMM) لکھیں۔</p>
        <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
          <input 
            type="password" 
            placeholder="جیسے: 2018" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px", fontSize: "16px", borderRadius: "5px", border: "1px solid #ccc", textAlign: "center" }}
          />
          <button type="submit" style={{ padding: "10px 20px", marginRight: "10px", fontSize: "16px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            لاگ ان کریں
          </button>
        </form>
        {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif", direction: "rtl", textAlign: "right" }}>
      <h1 style={{ color: "#333" }}>📊 پاک والیٹ - ایڈمن پینل</h1>
      <p style={{ color: "green" }}>● کلاک ٹائم سیکیورٹی لاگ ان ایکٹو ہے</p>
      <hr style={{ margin: "20px 0" }} />

      <h3>📥 پینڈنگ پیمنٹ ریکویسٹ (Pending Requests)</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px", direction: "rtl" }}>
        <thead>
          <tr style={{ background: "#f4f4f4", textAlign: "right" }}>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>صارف کا نام</th>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>رقم</th>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>Tax / Txn ID</th>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>اسٹیٹس</th>
            <th style={{ padding: "12px", border: "1px solid #ddd" }}>ایکشن</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>{req.user}</td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>{req.amount}</td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}><code>{req.txnId}</code></td>
              <td style={{ padding: "12px", border: "1px solid #ddd", color: req.status === "Pending" ? "orange" : req.status === "Approved" ? "green" : "red" }}>{req.status}</td>
              <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                {req.status === "Pending" && (
                  <>
                    <button onClick={() => handleAction(req.id, "Approved")} style={{ background: "green", color: "white", border: "none", padding: "6px 12px", marginLeft: "5px", borderRadius: "4px", cursor: "pointer" }}>Accept</button>
                    <button onClick={() => handleAction(req.id, "Rejected")} style={{ background: "red", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}