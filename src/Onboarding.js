import React, { useState } from "react";

export default function Onboarding({ onComplete }) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState("loss");

  const handleStart = () => {
    if (!weight || !height || !age) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนก่อนเริ่มนะครับ");
      return;
    }

    // แปลงค่าเป็น Number เพื่อความแม่นยำในการคำนวณ
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    // สูตร Mifflin-St Jeor (สำหรับผู้ชาย)
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const tdee = bmr * 1.5; // สำหรับกิจกรรมปานกลาง

    // ตั้งเป้าหมาย: ลดไขมัน (-500) หรือ เพิ่มกล้ามเนื้อ (+300)
    const target = goal === "gain" ? tdee + 300 : tdee - 500;

    onComplete({
      name: "เปเปอร์", // ดึงจากชื่อเล่นของคุณ
      targetCal: Math.round(target),
      protein: Math.round((target * 0.3) / 4), // โปรตีน 30%
      carbs: Math.round((target * 0.4) / 4), // คาร์บ 40%
      fat: Math.round((target * 0.3) / 9), // ไขมัน 30%
    });
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>
          ยินดีต้อนรับสู่ <span style={{ color: "#FF7A30" }}>AI Calorie</span>
        </h1>
        <p style={subtitleStyle}>
          มาตั้งค่าเป้าหมายเพื่อหุ่นที่ดีของคุณกันครับ
        </p>

        <div style={inputGroup}>
          <label style={labelStyle}>น้ำหนัก (กก.)</label>
          <input
            type="number"
            placeholder="เช่น 70"
            style={inputStyle}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>ส่วนสูง (ซม.)</label>
          <input
            type="number"
            placeholder="เช่น 175"
            style={inputStyle}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>

        <div style={inputGroup}>
          <label style={labelStyle}>อายุ (ปี)</label>
          <input
            type="number"
            placeholder="เช่น 20"
            style={inputStyle}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <label style={labelStyle}>เป้าหมายของคุณ</label>
        <div style={goalGroup}>
          <button
            onClick={() => setGoal("loss")}
            style={goal === "loss" ? activeGoalBtn : inactiveGoalBtn}
          >
            🔥 ลดไขมัน
          </button>
          <button
            onClick={() => setGoal("gain")}
            style={goal === "gain" ? activeGoalBtn : inactiveGoalBtn}
          >
            💪 เพิ่มกล้ามเนื้อ
          </button>
        </div>

        <button onClick={handleStart} style={primaryBtn}>
          เริ่มคำนวณและเข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}

// --- Styles (เหมือนเดิมที่คุณทำไว้ ซึ่งสวยอยู่แล้วครับ) ---
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  backgroundColor: "#F8F9FB",
  padding: "20px",
};
const cardStyle = {
  backgroundColor: "white",
  padding: "40px 30px",
  borderRadius: "32px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
  maxWidth: "400px",
  width: "100%",
  textAlign: "center",
};
const titleStyle = {
  fontSize: "24px",
  fontWeight: "800",
  marginBottom: "10px",
  color: "#333",
};
const subtitleStyle = { fontSize: "14px", color: "#999", marginBottom: "30px" };
const inputGroup = { textAlign: "left", marginBottom: "20px" };
const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  color: "#666",
  marginBottom: "8px",
  marginLeft: "4px",
};
const inputStyle = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: "16px",
  border: "1.5px solid #EEE",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#FAFAFA",
};
const goalGroup = { display: "flex", gap: "12px", marginBottom: "30px" };
const baseGoalBtn = {
  flex: 1,
  padding: "14px",
  borderRadius: "16px",
  border: "none",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.3s",
};
const activeGoalBtn = {
  ...baseGoalBtn,
  backgroundColor: "#333",
  color: "white",
};
const inactiveGoalBtn = {
  ...baseGoalBtn,
  backgroundColor: "#EEE",
  color: "#666",
};
const primaryBtn = {
  width: "100%",
  padding: "18px",
  borderRadius: "18px",
  border: "none",
  backgroundColor: "#FF7A30",
  color: "white",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(255, 122, 48, 0.2)",
  marginTop: "10px",
};
