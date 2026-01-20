import React, { useState, useEffect } from "react";

export default function Dashboard({ data }) {
  const [eaten, setEaten] = useState(() => {
    const saved = localStorage.getItem("daily_eaten_record_gemini");
    return saved ? JSON.parse(saved) : { cal: 0, p: 0, c: 0, f: 0 };
  });

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    localStorage.setItem("daily_eaten_record_gemini", JSON.stringify(eaten));
  }, [eaten]);

  // Key ล่าสุดของพี่
  const GEMINI_API_KEY = "AIzaSyDLmU4gcLNsx4HfgPGK_0rTZh9wXcGsqSA"; 

  const remainingCal = data.targetCal - eaten.cal;
  const progress = (eaten.cal / data.targetCal) * 100;

  const handleScan = async (event) => {
    if (isScanning) return;
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = reader.result.split(",")[1];

      try {
        const prompt = `
          Analyze this food image.
          Identify the dish name in THAI (ชื่อเมนู).
          Estimate calories, protein, carbs, and fat.
          
          Reply format:
          Dish: [Dish Name]
          Cal: [Number]
          Protein: [Number]
          Carbs: [Number]
          Fat: [Number]
          Breakdown: [Short description]
        `;

        // 🟢 แก้ไขจุดตาย: เปลี่ยนจาก v1beta เป็น v1 (ตัวเสถียร)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: file.type, data: base64Data } }
                ]
              }]
            })
          }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
           const errMsg = result.error ? result.error.message : "Unknown Error";
           alert(`AI Error (${response.status}): ${errMsg}`);
           throw new Error(errMsg);
        }

        const textResponse = result.candidates[0].content.parts[0].text;
        
        // Manual Parser (แกะค่าเอง ไม่ง้อ JSON)
        const extractValue = (keyword) => {
            const regex = new RegExp(`${keyword}:\\s*([\\d\\.]+)`, "i");
            const match = textResponse.match(regex);
            return match ? parseFloat(match[1]) : 0;
        };

        const nameMatch = textResponse.match(/Dish:\s*(.+)/i);
        const breakdownMatch = textResponse.match(/Breakdown:\s*(.+)/i);

        const nutrition = {
            name: nameMatch ? nameMatch[1].trim() : "อาหาร (AI)",
            breakdown: breakdownMatch ? breakdownMatch[1].trim() : "วิเคราะห์โดย AI",
            cal: extractValue("Cal"),
            p: extractValue("Protein"),
            c: extractValue("Carbs"),
            f: extractValue("Fat")
        };

        alert(`✅ เรียบร้อย!\nเมนู: ${nutrition.name}\n🔥 ${nutrition.cal} kcal`);

        setEaten(prev => ({
            cal: prev.cal + Math.round(nutrition.cal),
            p: prev.p + Math.round(nutrition.p),
            c: prev.c + Math.round(nutrition.c),
            f: prev.f + Math.round(nutrition.f),
        }));

      } catch (error) {
        console.error("Gemini Error:", error);
      } finally {
        setIsScanning(false);
      }
    };
  };

  const handleReset = () => {
    if (window.confirm("ล้างข้อมูลวันนี้ทั้งหมด?")) {
      setEaten({ cal: 0, p: 0, c: 0, f: 0 });
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <p style={{ color: "#999", margin: 0, fontSize: "14px" }}>สวัสดีครับ!</p>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700" }}>บันทึกอาหาร (API v1)</h2>
        </div>
        <button onClick={handleReset} style={resetBtnStyle}>Reset</button>
      </div>

      <div style={mainCardStyle}>
        <div style={ringWrapper}>
          <svg width="180" height="180" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke="#f3f3f3" strokeWidth="12" fill="none" />
            <circle
              cx="80" cy="80" r="70" stroke="#FF7A30" strokeWidth="12" fill="none"
              strokeDasharray="440"
              strokeDashoffset={440 - (440 * (progress > 100 ? 100 : progress)) / 100}
              strokeLinecap="round"
              style={{ transition: "1s ease-out" }}
            />
          </svg>
          <div style={insideText}>
            <span style={{ fontSize: "32px", fontWeight: "800", color: "#333" }}>
              {remainingCal < 0 ? 0 : remainingCal}
            </span>
            <span style={{ fontSize: "12px", color: "#999" }}>kcal ที่เหลือ</span>
          </div>
        </div>
      </div>

      <div style={macroGrid}>
        <MacroCard label="โปรตีน" eaten={eaten.p} target={data.protein} color="#4A90E2" unit="ก." />
        <MacroCard label="คาร์บ" eaten={eaten.c} target={data.carbs} color="#7ED321" unit="ก." />
        <MacroCard label="ไขมัน" eaten={eaten.f} target={data.fat} color="#F5A623" unit="ก." />
      </div>

      <label style={{...fabStyle, opacity: isScanning ? 0.7 : 1, cursor: isScanning ? "wait" : "pointer"}}>
        <span style={{ fontSize: "24px", marginRight: "10px" }}>⚡</span>
        {isScanning ? "กำลังวิเคราะห์ (v1)..." : "ถ่ายรูปอาหาร"}
        {!isScanning && (
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleScan}
            style={{ display: "none" }}
          />
        )}
      </label>
    </div>
  );
}

// Styles
const resetBtnStyle = { backgroundColor: "#f0f0f0", border: "none", padding: "8px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "600", color: "#666", cursor: "pointer" };
function MacroCard({ label, eaten, target, color, unit }) {
  const barWidth = (eaten / target) * 100;
  return (
    <div style={cardItem}>
      <div style={{ ...dot, backgroundColor: color }}></div>
      <span style={{ fontSize: "11px", color: "#666" }}>{label}</span>
      <div style={{ fontSize: "14px", fontWeight: "700", margin: "4px 0" }}>{Math.round(eaten)} / {target} {unit}</div>
      <div style={barBg}>
        <div style={{ ...barFill, width: `${barWidth > 100 ? 100 : barWidth}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}
const containerStyle = { padding: "24px", maxWidth: "420px", margin: "auto", backgroundColor: "#F8F9FB", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const mainCardStyle = { backgroundColor: "white", borderRadius: "30px", padding: "40px", boxShadow: "0 15px 35px rgba(0,0,0,0.05)", display: "flex", justifyContent: "center", marginBottom: "20px" };
const ringWrapper = { position: "relative", display: "flex", justifyContent: "center", alignItems: "center" };
const insideText = { position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" };
const macroGrid = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "100px" };
const cardItem = { backgroundColor: "white", padding: "16px", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" };
const dot = { width: "8px", height: "8px", borderRadius: "50%", marginBottom: "8px" };
const barBg = { width: "100%", height: "4px", backgroundColor: "#F0F0F0", borderRadius: "2px", overflow: "hidden" };
const barFill = { height: "100%", transition: "0.5s" };
const fabStyle = { position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "85%", maxWidth: "340px", backgroundColor: "#FF7A30", color: "white", padding: "18px", borderRadius: "20px", border: "none", fontWeight: "700", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.2)" };
