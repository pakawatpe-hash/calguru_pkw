import React, { useState } from "react";
import Onboarding from "./Onboarding"; // หน้ากรอกข้อมูล
import Dashboard from "./Dashboard"; // หน้าสรุปผลและสแกนอาหาร

export default function App() {
  const [userData, setUserData] = useState(null); // เก็บข้อมูลที่คำนวณแล้ว

  return (
    <div className="min-h-screen bg-gray-50">
      {!userData ? (
        <Onboarding onComplete={(data) => setUserData(data)} />
      ) : (
        <Dashboard data={userData} />
      )}
    </div>
  );
}
