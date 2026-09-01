require("dotenv").config();
const mongoose = require("mongoose");
const KnowledgeBase = require("./models/KnowledgeBase");
const { embedText } = require("./utils/gemini");

// Noi dung tom tat da duoc Cowork kiem chung do tin cay (xem progress-cowork.md,
// muc "Link tham khao") - dung lam du lieu mau dau tien cho kho tri thuc RAG.
const chunks = [
  {
    documentTitle: "Paraben - chat bao quan trong my pham",
    textChunk:
      "Paraben la hop chat tong hop (este cua PHBA) dung lam chat bao quan trong my pham. Gioi han nong do an toan theo SCCS (EU)/FDA: Methylparaben va Ethylparaben toi da 0.4-0.8%, Propylparaben va Butylparaben toi da 0.19%. EU da cam 5 dan xuat (Isopropylparaben, Isobutylparaben, Pentylparaben, Phenylparaben, Benzylparaben) tu nam 2014 do thieu du lieu an toan. Rui ro chinh cua Paraben la kich ung da o nong do cao hoac tren da nhay cam; Methylparaben tuong tac voi tia UVB co the gay lao hoa da. Anh huong len tuyen giap/sinh san moi chi o muc mot so nghien cuu tren dong vat cho thay, chua ket luan chac chan tren nguoi. Ket luan: Paraben an toan trong nguong quy dinh, can can trong voi da nhay cam hoac khi dung nong do cao, khong nen coi la chat doc hai tuyet doi.",
  },
  {
    documentTitle: "Sulfate - chat hoat dong be mat trong my pham",
    textChunk:
      "Sulfate la muoi/ester cua acid sulfuric, pho bien nhat trong my pham la 2 chat hoat dong be mat anion: Sodium Lauryl Sulfate (SLS) va Sodium Laureth Sulfate (SLES). Co che lam sach: phan tu co dau ua nuoc va dau ky nuoc, lien ket voi dau/bui ban roi cuon troi theo nuoc. Sulfate duoc dung pho bien trong sua rua mat, dau goi, sua tam, kem danh rang vi kha nang tao bot tot va chi phi thap. Tac dung phu chinh: tay rua manh co the cuon troi lop lipid bao ve da, gay kho hoac kich ung o da nhay cam, viem da co dia - day la quan ngai duoc da lieu cong nhan rong rai, khong phai doc tinh toan than. Hien chua co bang chung khoa hoc Sulfate gay hai suc khoe o nong do quy dinh an toan; tin don SLS gay ung thu la ngo nhan pho bien, khong co co so.",
  },
  {
    documentTitle: "Huong lieu tong hop (Fragrance/Parfum) trong my pham",
    textChunk:
      "Huong lieu tong hop la hon hop hoa chat tao mui duoc dung trong my pham/hoa my pham/cong nghiep de che mui kho chiu, tao dau an thuong hieu, on dinh va re hon huong lieu tu nhien. Can luu y: mot so nguon dua ra so lieu '95% hoa chat huong lieu tong hop tu dau mo gay ung thu' nhung thieu nguon cu the, de bi phong dai, can kiem chung them truoc khi su dung. Mot nhom hoat chat thuong bi nham la 'huong lieu tong hop gay kich ung' gom Linalool, Citronellol, Limonene, Geraniol, Eugenol - day thuc chat la nhom 26 chat gay di ung (allergen) duoc EU quy dinh phai cong bo nhan, phan lon co nguon goc tu tinh dau tu nhien chu khong rieng tong hop. Alcohol (con) la dung moi rieng, khong phai thanh phan huong lieu. Nguoi dung nhay cam voi huong lieu (ca tu nhien lan tong hop) co the bi kich ung da, can kiem tra bang thanh phan INCI truoc khi su dung.",
  },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });

  let success = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const embeddingVector = await embedText(chunk.textChunk);
      await KnowledgeBase.create({
        documentTitle: chunk.documentTitle,
        textChunk: chunk.textChunk,
        embeddingVector,
      });
      success++;
      console.log("OK:", chunk.documentTitle);
    } catch (error) {
      failed++;
      console.log("LOI (mong doi neu Gemini key chua hoat dong):", chunk.documentTitle, "-", error.message);
    }
  }

  console.log(`\nKet qua: ${success} thanh cong, ${failed} loi / tong ${chunks.length}`);
  await mongoose.disconnect();
})();
