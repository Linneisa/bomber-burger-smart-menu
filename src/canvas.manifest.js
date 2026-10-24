export const manifest = {
  screens: {
    scr_ea3mb6: { name: "Halaman Utama", route: "/", position: { "x": 160, "y": 220 } },
    scr_cwn7pc: { name: "Input Preferensi AI", route: "/preferensi", position: { "x": 1560, "y": 220 } },
    scr_f1kp8t: { name: "Input Preferensi (terisi)", route: "/preferensi", state: { "selections": { "rasa": ["tidak-pedas"], "protein": ["chicken"], "budget": ["mid"], "porsi": ["normal"], "hindari": [] }, "text": "aku suka ayam, nggak terlalu pedas" }, position: { "x": 2960, "y": 220 } },
    scr_j12tkm: { name: "Loading AI", route: "/hasil", state: { "status": "loading", "holdLoading": true, "selections": { "rasa": ["tidak-pedas"], "protein": ["chicken"], "budget": ["mid"], "porsi": ["normal"], "hindari": [] }, "text": "aku suka ayam, nggak terlalu pedas" }, position: { "x": 4360, "y": 220 } },
    scr_qf7zk4: { name: "Hasil Rekomendasi AI", route: "/hasil", state: { "status": "done", "selections": { "rasa": ["tidak-pedas"], "protein": ["chicken"], "budget": ["mid"], "porsi": ["normal"], "hindari": [] }, "text": "aku suka ayam, nggak terlalu pedas" }, position: { "x": 5760, "y": 220 } },
    scr_xuahb4: { name: "Eksplorasi Menu", route: "/menu", position: { "x": 160, "y": 2200 } },
    scr_vswe6d: { name: "Detail Menu", route: "/menu/buffalo-chicken", position: { "x": 1560, "y": 2200 } },
    scr_k0k31i: { name: "Pilihanku", route: "/pilihanku", state: { "picks": ["katsu-chicken", "buffalo-chicken", "french-fries"] }, position: { "x": 1560, "y": 4180 } },
    scr_matyvk: { name: "Pilihanku (kosong)", route: "/pilihanku", state: { "picks": [] }, position: { "x": 160, "y": 4180 } }
  },
  sections: {
    sec_vhtsuq: { name: "AI Preference & Recommendation Flow", x: 0, y: 0, width: 7120, height: 1180 },
    sec_kcfnja: { name: "Menu Exploration Flow", x: 0, y: 1980, width: 2920, height: 1180 },
    sec_snschm: { name: "My Choices", x: 0, y: 3960, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_vhtsuq", children: [
    { kind: "screen", id: "scr_ea3mb6" },
    { kind: "screen", id: "scr_cwn7pc" },
    { kind: "screen", id: "scr_f1kp8t" },
    { kind: "screen", id: "scr_j12tkm" },
    { kind: "screen", id: "scr_qf7zk4" }]
  },
  { kind: "section", id: "sec_kcfnja", children: [
    { kind: "screen", id: "scr_xuahb4" },
    { kind: "screen", id: "scr_vswe6d" }]
  },
  { kind: "section", id: "sec_snschm", children: [
    { kind: "screen", id: "scr_matyvk" },
    { kind: "screen", id: "scr_k0k31i" }]
  }]

};