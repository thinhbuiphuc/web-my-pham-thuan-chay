require("dotenv").config();
const mongoose = require("mongoose");
const KnowledgeBase = require("./models/KnowledgeBase");
const { embedText } = require("./utils/gemini");

// Nap them tri thuc de Chatbot biet ve 7 san pham Cocoon dang ban tren web
// (ten/loai da phu hop/thanh phan chinh) + giai thich khai niem cho cac hoat chat
// chinh xuat hien trong 7 san pham nhung chua duoc nap tu truoc (Niacinamide,
// Salicylic Acid, Centella Asiatica, Sodium Hyaluronate, Vitamin C ben, bo loc
// chong nang hoa hoc, Caffeine, Panthenol/hoa hong, Astaxanthin).
const chunks = [
  // ===== 7 san pham =====
  {
    documentTitle: "San pham: Gel rua mat ca phe Dak Lak (COC-RUAMAT-001)",
    textChunk:
      "Gel rua mat ca phe Dak Lak (thuong hieu Cocoon, ma san pham COC-RUAMAT-001, dung tich 140ml, gia 192.000d) la san pham lam sach da mat, phu hop cho ca 4 loai da (da dau, da kho, da hon hop, da nhay cam). Thanh phan chinh: Coffea Arabica Seed Oil va Coffea Robusta Extract (chiet xuat ca phe Dak Lak, giau Caffeine - chong oxy hoa va ho tro kiem dau), nhom amino acid tu nhien (Alanine, Arginine, Glycine, Histidine, Proline, Serine - thanh phan duong am tu nhien NMF cua da), va Tocopherol (Vitamin E, chong oxy hoa). Cong dung: lam sach sau, ho tro chong oxy hoa nho Caffeine, dung duoc hang ngay cho moi loai da.",
  },
  {
    documentTitle: "San pham: Tinh chat bi dao N7 (COC-SERUM-001)",
    textChunk:
      "Tinh chat bi dao N7 (thuong hieu Cocoon, ma san pham COC-SERUM-001, dung tich 30ml, gia 195.000d, thuoc nhom Serum) phu hop cho da dau va da hon hop. Thanh phan chinh: Niacinamide 7% (kiem dau, thu nho lo chan long), Salicylic Acid 0.8% (BHA - lam sach sau lo chan long, ho tro giam mun), Benincasa Hispida Extract (chiet xuat bi dao), Madecassic Acid va Asiaticoside (TECA tu rau ma - lam diu), Melaleuca Alternifolia Leaf Oil (tinh dau tram tra - khang khuan nhe), Acetyl Glucosamine va Ferulic Acid (ho tro chong oxy hoa). Cong dung: giam nhon, thu nho lo chan long, ho tro lam sach da mun cho da dau/da hon hop.",
  },
  {
    documentTitle: "San pham: Sua chong nang bi dao SPF50+ PA++++ (COC-CHONGNANG-001)",
    textChunk:
      "Sua chong nang bi dao SPF50+ PA++++ (thuong hieu Cocoon, ma san pham COC-CHONGNANG-001, dung tich 50ml, gia 432.000d) phu hop cho da dau va da nhay cam. Su dung bo loc chong nang hoa hoc pho rong the he moi: Tinosorb M, Tinosorb A2B, Uvinul A Plus, Neo Heliopan AP, Ethylhexyl Triazone, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Avobenzone - bao ve da khoi ca tia UVA va UVB. Ket hop chiet xuat bi dao (Benincasa Hispida) va Melanin ho tro chong oxy hoa. Ket cau mong nhe, khong gay bi da, phu hop dung hang ngay cho da dau va da nhay cam de bi kich ung voi kem chong nang thong thuong.",
  },
  {
    documentTitle: "San pham: Nuoc bi dao can bang da (COC-TONER-001)",
    textChunk:
      "Nuoc bi dao can bang da (thuong hieu Cocoon, ma san pham COC-TONER-001, dung tich 140ml, gia 192.000d, thuoc nhom Toner) phu hop cho da dau va da hon hop. Thanh phan chinh: Benincasa Hispida Extract (bi dao), Centella Asiatica Extract cung Asiaticoside/Madecassoside (rau ma - lam diu, phuc hoi), Melaleuca Alternifolia Leaf Oil (tram tra), Glycyrrhiza Glabra Root Extract (cam thao - lam diu, lam sang nhe), Niacinamide (kiem dau) va Sodium Hyaluronate (cap am). Cong dung: cap am, lam diu da va kiem dau nhe, dung sau buoc lam sach de can bang lai do pH cho da dau/da hon hop.",
  },
  {
    documentTitle: "San pham: Thach hoa hong duong am (COC-DUONGAM-001)",
    textChunk:
      "Thach hoa hong duong am (thuong hieu Cocoon, ma san pham COC-DUONGAM-001, dung tich 30ml, gia 192.000d, thuoc nhom Kem duong am) phu hop cho da kho va da hon hop. Thanh phan chinh: Rosa Damascena Flower Water (nuoc hoa hong), Saccharide Isomerate/Pentavitin (duong am dai han), nhom amino acid NMF tu nhien (Alanine, Arginine, Glycine, Histidine, Proline, Serine) va Sodium Hyaluronate (Hyaluronic Acid - cap am sau). Cong dung: cap am sau va khoa am lau dai, phu hop cho da kho thieu am hoac da hon hop can duong am ma khong gay nhon bi.",
  },
  {
    documentTitle: "San pham: Tinh chat nghe Hung Yen C22 (COC-SERUM-002)",
    textChunk:
      "Tinh chat nghe Hung Yen C22 (thuong hieu Cocoon, ma san pham COC-SERUM-002, dung tich 30ml, gia 457.000d, thuoc nhom Serum) phu hop cho ca 4 loai da (da dau, da kho, da hon hop, da nhay cam). Thanh phan chinh: Curcuma Longa Root Extract (chiet xuat nghe Hung Yen), 3-O-Ethyl Ascorbic Acid 22% (dang Vitamin C ben, it kich ung hon L-Ascorbic Acid thong thuong), Hexylresorcinol 1% (ho tro lam sang), Niacinamide 4%, Acetyl Glucosamine 2% va Ferulic Acid 0.5% (chong oxy hoa, tang hieu qua Vitamin C). Cong dung: lam sang da, mo tham nam/tham sau mun, giup deu mau da theo thoi gian (can dung deu dan vai tuan den vai thang), nen dung kem chong nang ban ngay khi dung san pham nay.",
  },
  {
    documentTitle: "San pham: Nuoc tay trang hoa hong (COC-TAYTRANG-001)",
    textChunk:
      "Nuoc tay trang hoa hong (thuong hieu Cocoon, ma san pham COC-TAYTRANG-001, dung tich 310ml, gia 241.000d, thuoc nhom Sua rua mat & Tay trang) phu hop cho ca 4 loai da. Thanh phan chinh: Rosa Damascena Flower Water (nuoc hoa hong), Panthenol (Vitamin B5 - lam diu, phuc hoi da), Astaxanthin (chong oxy hoa manh chiet xuat tu vi tao), Polyglyceryl-4 Laurate va Polyglyceryl-4 Caprylate/Caprate (chat hoat dong be mat goc duong, diu nhe hon Sulfate/SLS thong thuong). Cong dung: lam sach sau lop trang diem va bui ban ma khong gay kho cang da, phu hop dung hang ngay cho moi loai da ke ca da nhay cam.",
  },
  // ===== Khai niem hoat chat (chua co tu truoc) =====
  {
    documentTitle: "Niacinamide (Vitamin B3) trong my pham",
    textChunk:
      "Niacinamide (Vitamin B3, Nicotinamide) la hoat chat da chuc nang pho bien trong my pham, thuong dung o nong do 2-10%. Co che: ho tro cung co hang rao bao ve da (tang tong hop ceramide), dieu tiet tuyen ba nhon (giam nhon), lam sang vet tham sau viem, va co tinh chat chong oxy hoa nhe. Duoc danh gia an toan va dung nap tot voi da, it gay kich ung so voi cac hoat chat trai da khac (Retinol, AHA/BHA nong do cao). Mot so nguon cu canh bao Niacinamide ket hop Vitamin C co the gay do hoac mat tac dung ca hai - nghien cuu hien dai cho thay dieu nay khong dung ro rang o dieu kien pH thong thuong cua my pham hien nay, van co the dung chung duoc. Phu hop cho da dau, da hon hop, va da co van de tham mun.",
  },
  {
    documentTitle: "Salicylic Acid (BHA) trong my pham",
    textChunk:
      "Salicylic Acid (BHA - Beta Hydroxy Acid) la hoat chat tan trong dau, thuong dung nong do 0.5-2% trong san pham tay te bao chet hoa hoc. Co che: xuyen sau vao lo chan long (nho tinh tan dau), lam tan lien ket giua te bao chet va ba nhon, giup thong thoang lo chan long va ho tro giam mun dau den/mun cam. Phu hop dac biet cho da dau, da hon hop thien dau, da co lo chan long to hoac de bit tac. Luu y: co the gay kho/kich ung neu dung nong do cao hoac qua thuong xuyen, khong nen dung chung luc voi Retinol/AHA nong do cao de tranh kich ung cong don; nguoi di ung Aspirin (cung nhom Salicylate) nen than trong khi su dung.",
  },
  {
    documentTitle: "Centella Asiatica (rau ma) / TECA trong my pham",
    textChunk:
      "Centella Asiatica (rau ma) la chiet xuat thuc vat duoc dung rong rai trong my pham de lam diu da, thuong xuat hien duoi dang Centella Asiatica Extract hoac dang tinh khiet hoa TECA (gom 4 hoat chat chinh: Asiaticoside, Madecassoside, Asiatic Acid, Madecassic Acid). Co che: thuc day tong hop collagen, khang viem, ho tro phuc hoi hang rao da va lam diu kich ung. Duoc dung pho bien cho da nhay cam, da dang kich ung/mun viem, hoac sau cac buoc dieu tri gay kho da (Retinol, BHA/AHA, laser). Duoc xem la mot trong nhung hoat chat lam diu co du lieu khoa hoc ho tro tuong doi ro rang, it gay kich ung ke ca voi da nhay cam.",
  },
  {
    documentTitle: "Sodium Hyaluronate (Hyaluronic Acid) trong my pham",
    textChunk:
      "Sodium Hyaluronate la dang muoi cua Hyaluronic Acid (Acid Hyaluronic), pho bien hon trong my pham vi phan tu nho hon nen tham thau vao da tot hon dang Acid goc. Co che: la chat hut am (humectant) co kha nang giu nuoc gap nhieu lan trong luong ban than, giup cap am be mat va lop trung bi da. Phu hop cho moi loai da, dac biet da kho, da thieu am. Luu y quan trong: Hyaluronic Acid/Sodium Hyaluronate chi cap am hieu qua khi dung dung cach (thoa len da con am, sau do khoa am bang kem duong/dau) - dung trong moi truong qua kho (dieu hoa, khong khi hanh) ma khong khoa am co the phan tac dung, hut nguoc am tu lop sau da len be mat roi bay hoi.",
  },
  {
    documentTitle: "Vitamin C ben (3-O-Ethyl Ascorbic Acid) va Ferulic Acid",
    textChunk:
      "3-O-Ethyl Ascorbic Acid la mot dan xuat ben cua Vitamin C (L-Ascorbic Acid), duoc thiet ke on dinh hon voi anh sang/khong khi va it gay kich ung hon dang Vitamin C nguyen ban, tuy hieu qua lam sang da co the thap hon nhe so voi L-Ascorbic Acid nong do tuong duong theo mot so nghien cuu. Co che chung cua Vitamin C: uc che enzyme tyrosinase (giam san sinh melanin), chong oxy hoa, ho tro lam mo tham sau viem va deu mau da theo thoi gian (thuong can vai tuan den vai thang su dung deu). Ferulic Acid thuong duoc ket hop cung Vitamin C vi co tac dung hiep dong chong oxy hoa va giup on dinh Vitamin C tot hon. Phu hop cho da co van de tham/khong deu mau; luu y Vitamin C co the gay kich ung nhe o da qua nhay cam, va nen dung kem chong nang ban ngay vi mot so dang Vitamin C co the tang nhay cam voi anh sang.",
  },
  {
    documentTitle: "Bo loc chong nang hoa hoc (Tinosorb, Avobenzone, Uvinul...)",
    textChunk:
      "Cac bo loc chong nang hoa hoc (chemical/organic sunscreen filter) nhu Tinosorb M, Tinosorb A2B, Avobenzone, Uvinul A Plus, Ethylhexyl Triazone, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine la cac hop chat huu co hap thu tia UV (UVA/UVB) va chuyen hoa thanh nhiet nang vo hai. Uu diem so voi bo loc vat ly (Zinc Oxide, Titanium Dioxide): ket cau mong nhe hon, khong de lai vet trang, thuong duoc ket hop nhieu loai de dat pho bao ve rong (UVA+UVB) va chi so cao (SPF/PA). Mot so bo loc cu (Oxybenzone) tung bi lo ngai ve kha nang gay roi loan noi tiet/anh huong san ho, nhung cac bo loc the he moi (Tinosorb, Uvinul...) duoc danh gia an toan hon va it gay kich ung. Phu hop cho da dau/da nhay cam vi it gay bit tac lo chan long so voi mot so bo loc vat ly.",
  },
  {
    documentTitle: "Caffeine trong my pham",
    textChunk:
      "Caffeine la hoat chat chiet xuat tu ca phe (Coffea Arabica/Robusta) hoac tra, duoc dung trong my pham voi vai tro chinh: chong oxy hoa (trung hoa goc tu do), ho tro co mach mau nhe (thuong thay trong san pham vung mat giam bong/tham quang), va co the ho tro kiem dau nhe do tac dong len tuyen ba nhon. Duoc xem la hoat chat an toan, it gay kich ung, phu hop cho da dau va da hon hop. Hieu qua 'giam mo/cellulite' cua Caffeine thoa ngoai da thuong duoc quang cao qua muc so voi bang chung khoa hoc thuc te (tac dung tai cho, tam thoi, khong thay the giam can/tap luyen).",
  },
  {
    documentTitle: "Panthenol (Vitamin B5) va Rosa Damascena (nuoc hoa hong)",
    textChunk:
      "Panthenol (Provitamin B5, chuyen hoa thanh Acid Pantothenic khi tham vao da) la hoat chat duong am va lam diu pho bien, co kha nang ho tro phuc hoi hang rao bao ve da, giam do do/kich ung nhe, thuong dung trong san pham cho da nhay cam hoac sau khi tay trang/lam sach. Rosa Damascena Flower Water (nuoc hoa hong) la nguyen lieu tu nhien co tinh chat lam diu nhe, cap am va tao mui huong dac trung, tuy hieu qua duong da cua rieng nuoc hoa hong thuong khong manh bang cac hoat chat chuc nang khac (Niacinamide, HA...) nen thuong dong vai tro ho tro/nen cho san pham hon la hoat chat chinh.",
  },
  {
    documentTitle: "Astaxanthin trong my pham",
    textChunk:
      "Astaxanthin la mot loai carotenoid (sac to do cam) chiet xuat tu vi tao (Haematococcus Pluvialis), duoc xem la mot trong nhung chat chong oxy hoa manh duoc biet den, manh hon Vitamin C va Vitamin E theo mot so nghien cuu in vitro. Trong my pham, Astaxanthin duoc dung de ho tro chong oxy hoa, bao ve da khoi goc tu do va tac hai cua tia UV/anh sang xanh (chi ho tro, khong thay the kem chong nang), va co the cai thien do dan hoi da theo mot so nghien cuu quy mo nho. Day la hoat chat tuong doi moi trong my pham, con thieu nhieu nghien cuu lam sang quy mo lon tren nguoi de khang dinh chac chan hieu qua dai han.",
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
      console.log("LOI:", chunk.documentTitle, "-", error.message);
    }
  }

  console.log(`\nKet qua: ${success} thanh cong, ${failed} loi / tong ${chunks.length}`);
  await mongoose.disconnect();
})();
