import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/nft_rental";
  await mongoose.connect(uri);
  console.log("MongoDB ulandi:", uri);

  // Boshqa loyihadan qolgan eski "id_1" unique indexni avtomatik tozalaymiz
  // (agar mavjud bo'lmasa xato beradi, buni e'tiborsiz qoldiramiz — normal holat)
  try {
    await mongoose.connection.collection("nfts").dropIndex("id_1");
    console.log("Eski 'id_1' index nfts kolleksiyasidan olib tashlandi");
  } catch (e) {
    // index topilmadi — hech narsa qilish shart emas
  }
}
