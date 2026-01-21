import React, { useState, useEffect } from "react";

export default function Dashboard({ data }) {
  const [eaten, setEaten] = useState(() => {
    const saved = localStorage.getItem("daily_eaten_record");
    return saved ? JSON.parse(saved) : { cal: 0, p: 0, c: 0, f: 0 };
  });

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    localStorage.setItem("daily_eaten_record", JSON.stringify(eaten));
  }, [eaten]);

  // 🔑 คีย์ชุดเก่าของพี่ (Google Vision + Spoonacular)
  const GOOGLE_API_KEY = "AIzaSyC3aKkGUC-T9dJEgh9rX1uPuf8_YVmszgQ";
  const SPOONACULAR_KEY = "3d47002b56ab44109678e493199fa3de";

  const remainingCal = data.targetCal - eaten.cal;
  const progress = (eaten.cal / data.targetCal) * 100;

  // 🇹🇭 ฐานข้อมูลคำแปลเมนูไทย (Original Logic)
  const THAI_MENU_MAP = {
    basil: "Thai Basil Chicken with Rice",
    "stir-frying": "Stir-fried meat with basil",
    curry: "Thai Green Curry",
    "pad thai": "Pad Thai noodles",
    "som tum": "Thai Papaya Salad",
    "tom yum": "Tom Yum Goong",
    egg: "Fried Egg",
    pork: "Grilled Pork",
    rice: "Steamed White Rice",
  };

  const getRealNutrition = async (foodName) => {
    const searchQuery = THAI_MENU_MAP[foodName.toLowerCase()] || foodName;
    try {
      const res = await fetch(
        `https://api.spoonacular.com/recipes/guessNutrition?title=${searchQuery}&apiKey=${SPOONACULAR_KEY}`
      );
      const data = await res.json();
      return {
        name: searchQuery,
        cal: data.calories.value,
        p: data.protein.value,
        c: data.carbs.value,
        f: data.fat.value,
      };
    } catch (err) {
      return null;
    }
  };

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
        // 1. ส่งรูปไปให้ Google Vision ดูว่าคืออะไร
        const visionRes = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requests: [
                {
                  image: { content: base64Data },
                  features: [{ type: "LABEL_DETECTION", maxResults: 15 }],
                },
              ],
            }),
          }
        );
        const visionData = await visionRes.json();
        const labels = visionData.responses[0].labelAnnotations;

        // 2. กรองคำที่ไม่ใช่ชื่ออาหารออก
        const commonWords = [
          "food", "dish", "cuisine", "recipe", "plate", 
          "meal", "tableware", "produce", "ingredient", "cooking"
        ];
        const targetItems = labels
          .filter((l) => !commonWords.includes(l.description.toLowerCase()))
          .slice(0, 4);

        let mealSum = { cal: 0, p: 0, c: 0, f: 0 };
        let itemsDetected = [];

        // 3. เอาชื่ออาหารไปถาม Spoonacular เพื่อขอแคลอรี่
        for (let item of targetItems) {
          const nut = await getRealNutrition(item.description);
          if (nut) {
            let weight = 0.5;
            const name = item.description.toLowerCase();
            if (name.includes("rice")) weight = 0.5;
            if (name.includes("chicken") || name.includes("basil") || name.includes("pork")) weight = 0.6;
            if (name.includes("egg")) weight = 1.0;

            mealSum.cal += nut.cal * weight;
            mealSum.p += nut.p * weight;
            mealSum.c += nut.c * weight;
            mealSum.f += nut.f * weight;
            itemsDetected.push(nut.name);
          }
        }

        if (itemsDetected.length > 0) {
          alert(`ตรวจพบ: ${itemsDetected.join(", ")}\nพลังงานรวม: ${Math.round(mealSum.cal)} kcal`);
          setEaten((prev) => ({
            cal: prev.cal + Math.round(mealSum.cal),
            p: prev.p + Math.round(mealSum.p),
            c: prev.c + Math.round(mealSum.c),
            f: prev.f + Math.round(mealSum.f),
          }));
        } else {
            alert("ไม่พบข้อมูลโภชนาการสำหรับรูปนี้");
        }
      } catch (error) {
        alert("การสแกนขัดข้อง");
        console.error(error);
      } finally {
        setIsScanning(false);
      }
    };
  };

  const handleReset = () => {
    if (window.confirm("คุณต้องการล้างข้อมูลวันนี้หรือไม่?")) {
      setEaten({ cal: 0, p: 0, c: 0, f: 0 });
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <p style={{ color: "#999", margin: 0, fontSize: "14px" }}>สวัสดีครับ!</p>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700" }}>ระบบคำนวน Calorie</h2>
        </div>
        <button onClick={handleReset} style={resetBtnStyle}>เริ่มวันใหม่</button>
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
        <span style={{ fontSize: "20px", marginRight: "10px" }}>📷</span>
        {isScanning ? "กำลังวิเคราะห์..." : "ถ่ายรูปอาหาร"}
        {!isScanning && (
          <input type="file" accept="image/*" capture="environment" onChange={handleScan} style={{ display: "none" }} />
        )}
      </label>
    </div>
  );
}

// --- Styles ---
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
