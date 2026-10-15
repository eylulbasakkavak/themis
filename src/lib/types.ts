import type { MulakatDegerlendirmesi } from "./mulakatDegerlendirme";

export type MulakatRolu = "Kulüp Müdürü" | "İK";

export type SurecDurumu =
  | "ilk_belge_seti_bekleniyor"
  | "ikinci_belge_seti_bekleniyor"
  | "mulakat_sonucu_bekleniyor"
  | "mulakata_katilmadi"
  | "akademi_egitimine_hazir"
  | "akademi_daveti_onayi_bekliyor"
  | "ik_onayi_bekliyor"
  | "ileride_degerlendirilebilir"
  | "akademi_egitmeni"
  | "akademiyi_tamamladi"
  | "egitmen"
  | "pasif"
  | "akademiye_katilmadi"
  | "surec_sonlandirildi"
  | "reddedildi";

export type BelgeDurumu = "yuklenmedi" | "yuklendi";

export type Belge = {
  ad: string;
  durum: BelgeDurumu;
  tarih?: string;
};

export type AksiyonKaydi = {
  tarih: string;
  aksiyon: string;
  yapan: string;
  detay?: string;
};

/** Eğitmen sözleşme tipi (PRD 10.2). */
export type IstihdamTipi =
  | "Tam Zamanlı"
  | "Yarı Zamanlı"
  | "Kiracı"
  | "Alt Kiracı"
  | "Grup Ders Eğitmeni"
  | "Instructor";

/** PGM/Flyby'dan gelen, Themis'te değiştirilemeyen salt okunur sözleşme/kulüp geçmişi kaydı. */
export type SozlesmeKaydi = {
  kulup: string;
  sozlesmeTipi: IstihdamTipi;
  altSozlesmeTipi?: string;
  baslangicTarihi: string;
  bitisTarihi?: string;
  durum: "Devam Ediyor" | "Sona Erdi";
  bitisNedeni?: string;
};

export type TemelEgitimDersi = {
  dersAdi: string;
  durum: "Geçti" | "Kaldı";
};

/** Eğitmenin aldığı bir temel eğitim (ör. 1. Kademe Temel Eğitimi) ve içindeki derslerin
 * kaldı/geçti sonucu. */
export type TemelEgitimBelgesi = {
  id: string;
  egitimAdi: string;
  tarih: string;
  dersler: TemelEgitimDersi[];
  belge?: Belge;
};

/** Flyby'daki tanımlı sözleşmeden gelen branş bilgisi (bu prototipte mock/manuel alan). */
export type SozlesmeTipi = "PT/Fitness" | "GX" | "Pilates" | "Havuz";

export type MobilAlanYonetimi = {
  smsNumarasi: boolean;
  ePosta: boolean;
  sosyalMedya: boolean;
};

/** İhtar kaydının üst kategorisi. Yeni kategori gerekirse listeye eklenmesi yeterli. */
export const IHTAR_KATEGORILERI = ["A", "B", "C", "D", "E"] as const;
export type IhtarKategorisi = (typeof IHTAR_KATEGORILERI)[number];

/** Eğitmen detay sayfasındaki İhtar Kaydı alt-özelliği. */
export type IhtarKaydi = {
  id?: string;
  tarih: string;
  kategori?: IhtarKategorisi;
  sebep: string;
  kaydeden: string;
  // PRD 11.4: KM/KMY'nin girdiği ihtar İK onayına düşer. Alan yoksa kayıt onaylı sayılır.
  onaylandi?: boolean;
  redSebebi?: string;
};

/**
 * Bir federasyon sertifikasının yıllık vize kaydı — her sertifika senede bir vizelenmeli.
 * "Vizeletme yapıldı" kontrolü, o yıla ait vize belgesinin yüklenmiş olmasından türetilir
 * (ayrı bir checkbox alanı tutulmaz, tek doğruluk kaynağı belge durumu olur).
 */
export type FederasyonVizeKaydi = {
  yil: number;
  belge: Belge;
  onaylandi: boolean;
  redSebebi?: string;
  yukleyen: string;
};

/**
 * Federasyon Durumu & Sertifikalar tab'ındaki "Federasyon Sertifikaları" listesi — her kayıt
 * farklı bir federasyon/disiplin tipine ait olabilir (Pilates, Jimnastik, Fitness, Yoga, Dans
 * vb.), bu yüzden her biri kendi tipi/ID'si/belgesi/onay durumu/vize geçmişiyle ayrı bir kayıt
 * olarak tutulur.
 */
export type FederasyonSertifikasi = {
  id: string;
  tip: string;
  sertifikaNo?: string;
  belge: Belge;
  onaylandi: boolean;
  redSebebi?: string;
  yukleyen: string;
  vizeler?: FederasyonVizeKaydi[];
};

/**
 * Eğitmenin bir branştaki federasyon sertifikası ve vizesi (PRD 12.2, 12.4). Belgeyi KM/KMY
 * yükler, İK onaylayınca eğitmenin o branştaki kademesi güncellenir.
 */
export type EgitmenSertifikasi = {
  id: string;
  brans: string;
  kademe: number;
  belgeTarihi: string;
  onaylandi: boolean;
  belge?: Belge;
  yukleyen?: string;
  redSebebi?: string;
  // Geçerli (İK onaylı) son vize; uyarılar ve durum işaretleri bu tarihe göre hesaplanır.
  vizeDonemi?: string;
  // "DD.MM.YYYY"
  vizeBitisTarihi?: string;
  // Girilen tüm vize kayıtları (onay bekleyen ve reddedilenler dahil).
  vizeler?: SertifikaVizesi[];
};

/** Sertifikaya bağlı vize kaydı (PRD 12.4): KM/KMY girer, İK belgeyle karşılaştırıp onaylar. */
export type SertifikaVizesi = {
  id: string;
  donem: string;
  // "DD.MM.YYYY"
  bitisTarihi: string;
  belge: Belge;
  onaylandi: boolean;
  redSebebi?: string;
  yukleyen: string;
  tarih: string;
};

export type TemelEgitimSonucuTipi = "Geçti" | "Kaldı" | "Katılmadı";

/**
 * Anadolu Üniversitesi temel eğitim sınavı sonucu (PRD 12.3); İK onayına düşer. Her branşın
 * temel eğitimi ayrıdır: sınav yalnızca girildiği branşta sayılır.
 */
export type TemelEgitimSonucu = {
  id: string;
  // Sınavın girildiği branş (yoksa Fitness); sınav yalnızca bu branşın temel eğitiminde sayılır.
  brans?: string;
  hedefKademe: number;
  // "DD.MM.YYYY"
  sinavTarihi: string;
  sonuc: TemelEgitimSonucuTipi;
  // Ders adı → Geçti / Kaldı (sonuç "Katılmadı" ise boş).
  dersler: Record<string, "Geçti" | "Kaldı">;
  mazeret?: string;
  // Sınav sonuç belgesi (görsel / PDF). Eğitmen MAC+ içindeki Themis arayüzünden yükler; ders
  // sonuçları bu belgeden okunur. Katılmadı ise belge yoktur.
  belge?: Belge;
  // Kaydın geldiği yer: eğitmenin MAC+ yüklemesi ya da Themis'ten (İK / KM) giriş.
  kaynak?: "MAC+" | "Themis";
  onaylandi: boolean;
  redSebebi?: string;
  yukleyen: string;
  tarih: string;
};

/**
 * Kademe geçişi için gereken federasyon gelişim semineri (bkz. BRANS_TANIMLARI.gecisler).
 * KM/KMY girer, İK onaylar; yalnızca aktif kademe belgesinden sonraki seminerler sayılır.
 */
export type GelisimSemineri = {
  id: string;
  brans: string;
  ad: string;
  // "DD.MM.YYYY"
  seminerTarihi: string;
  belge: Belge;
  onaylandi: boolean;
  redSebebi?: string;
  yukleyen: string;
  tarih: string;
};

/**
 * Öğrenim bilgisinin spor eğitimi ayrıntısı (bölüm, uzmanlık branşı, ders alınan branşlar…).
 * Ayrıca girilmez; öğrenim bilgisiyle gelir. Temel eğitim muafiyetleri ve mezuniyetle doğrudan
 * başvurulabilecek kademe buradan otomatik hesaplanır (bkz. temelEgitim.ts). Mezuniyet yalnızca
 * temel eğitimden muaf tutar; federasyonun uygulamalı eğitimi ve sınavı her durumda zorunludur.
 */
export type SporEgitimiTuru =
  "antrenorluk" | "spor_bilimleri" | "spor_lisesi" | "yok";

export type SporEgitimi = {
  tur: SporEgitimiTuru;
  // Antrenörlük dışı spor bilimleri bölümü: beden eğitimi öğretmenliği, spor yöneticiliği…
  bolum?: string;
  // "DD.MM.YYYY" — 4 yıllık muafiyetler bu tarihten başlar.
  mezuniyetTarihi?: string;
  // Antrenörlük Eğitimi bölümü: uzmanlık branşı.
  uzmanlikBransi?: string;
  // Antrenörlük: uzmanlık dışında ders alınan tek branş. Diğer bölümler: ilgili branşlar.
  dersAlinanBranslar?: { brans: string; donem: number }[];
  // Spor lisesi: okulda eğitim görülen branş.
  liseBransi?: string;
  // Spor bilimleri öğretim elemanı (en az 3 yıl uygulamalı ders) — öğrenim türünden bağımsız.
  ogretimElemani?: { brans: string; yil: number };
};

/** Bir GX dersi için akademi kararı: sistem önerisinden farklı olabilir; neden zorunludur. */
export type GxKarari = {
  ders: string;
  karar: "verebilir" | "veremez";
  neden: string;
  yapan: string;
  tarih: string;
};

export type AkademiTipi =
  | "Standart Akademi Mülakatı (4 Hafta)"
  | "Kısa Dönem Akademi Mülakatı (1 Hafta)";

export type YoklamaDurumu = "Geldi" | "Gelmedi";

/** Akademinin bir eğitim gününün yoklaması (ilk gün hariç). */
export type GunlukYoklama = {
  // Eğitim günü, "DD.MM.YYYY".
  tarih: string;
  yoklama: Record<string, YoklamaDurumu>;
  alan: string;
  alinmaTarihi: string;
};

/** Akademi menüsünde Akademi Yöneticisi tarafından oluşturulan akademi (PRD 7). */
export type AkademiDonemi = {
  id: string;
  ad: string;
  tip: AkademiTipi;
  // "DD.MM.YYYY"; bitiş tarihi başlangıç ve tipe göre otomatik hesaplanır (bkz. lib/akademi).
  baslangicTarihi: string;
  bitisTarihi: string;
  kontenjan: number;
  // Akademi daveti onaylanan adaylar bu listeye yazılır (PRD 6). Gelmeyen aday listeden
  // çıkmaz; kontenjan geri açılmaz (PRD 8.1).
  kayitlilar: string[];
  // Akademinin ilk günü alınan yoklama (PRD 8); alınana kadar tanımsızdır. İlk gün gelmeyenin
  // Akademi Eğitmeni sözleşmesi kapatılır.
  yoklama?: Record<string, YoklamaDurumu>;
  yoklamaAlan?: string;
  yoklamaTarihi?: string;
  // İlk günden sonraki her eğitim gününün yoklaması (yalnızca ilk gün gelenler için).
  gunlukYoklamalar?: GunlukYoklama[];
  // Henüz aday kaydedilmemiş akademi iptal edilebilir (PRD 7.1).
  iptal?: boolean;
};

/**
 * Bir eğitmenin akademiden mezun olduktan sonra girdiği sınavlar/değerlendirmeler
 * (PRD: Akademi Sonuç Sayfası). Her eğitmen, katıldığı akademi dönemi başına bir kayda sahiptir.
 */
/** Sınav Excel'indeki bir puan kolonu: üst satırdaki grup ve alt satırdaki ders başlığı. */
export type SinavBasligi = { grup: string; ad: string };

/**
 * Bir eğitmenin akademi sınav sonuçları (PRD 9). Themis puan hesaplamaz; Excel'deki tüm
 * başlıklar ve puanlar olduğu gibi saklanır. Puanlar 100 üzerindendir.
 */
/** Akademi sınav puanına yapılan elle düzeltme (İK / Sistem Yöneticisi); iz kaydı. */
export type SinavDuzeltmesi = {
  // Düzeltilen dersin basliklar içindeki sırası.
  baslikIndeksi: number;
  eski: number | null;
  yeni: number | null;
  aciklama: string;
  yapan: string;
  tarih: string;
};

/**
 * Bir akademideki tek bir sınavın sonucu (PRD 9). Bir akademide 3 sınav hakkı vardır: 1. sınavda
 * kalan 2. sınava, 2. sınavda kalan 3. sınava yalnızca kaldığı derslerden girer. Genel sonuç
 * denemelerden hesaplanır (bkz. akademiSinav.ts).
 */
export type AkademiSinavSonucu = {
  id: string;
  egitmenId: string;
  akademiDonemiId?: string;
  sinavNo: 1 | 2 | 3;
  basliklar: SinavBasligi[];
  // basliklar ile aynı sırada; boş hücre (o derse girilmedi) null.
  puanlar: (number | null)[];
  // Bu sınav sonrası hesaplanan genel sonuç (Fitness Teorik + Uygulama derslerinin hepsi 70+).
  genelSonuc: "Geçti" | "Kaldı";
  // Genel sonuç kolonunun Excel'deki başlığı (örn. "PERSONAL TRAINING").
  genelSonucBasligi: string;
  yuklemeTarihi: string;
  yukleyen: string;
  duzeltmeler?: SinavDuzeltmesi[];
};

export type AdayEgitmen = {
  id: string;
  // Kişinin Flyby'daki üyelik ID'si (PRD: Themis ID = Flyby ID). Tekildir; kişiyle ilgili
  // tüm süreçler ve sistemler arası eşleşme bu ID üzerinden yapılır.
  themisId: string;
  ad: string;
  soyad: string;
  telefon: string;
  eposta?: string;
  kulup: string;
  mulakatiYapanRol: MulakatRolu;
  mulakatiYapan: string;
  basvuruTarihi: string;
  surecDurumu: SurecDurumu;
  // "İleride Değerlendirilebilir" PRD'den önceki akıştan kalan eski bir değerdir; yeni
  // değerlendirmeler yalnızca Olumlu / Olumsuz / Katılmadı üretir (bkz. mulakatDegerlendirme.ts).
  gorusmeSonucu?:
    "Olumlu" | "Olumsuz" | "Katılmadı" | "İleride Değerlendirilebilir";
  // Akademi mülakatının 6 kriterli değerlendirmesi ve ek alanları (PRD 5.3–5.5).
  mulakatDegerlendirmesi?: MulakatDegerlendirmesi;
  // Mülakat sonucunun doldurulduğu gün (PRD): database'e kaydedilir, eğitmen
  // profilinde ve aday listeleme sayfasında görüntülenir/filtrelenir.
  gorusmeSonucuTarihi?: string;
  // "Olumsuz" seçildiğinde zorunlu, mülakatı yapan (İK + akademi eğitmeni) tarafından girilir.
  olumsuzOlmaNedeni?: string;
  sporGecmisi?: string;
  isDeneyimi?: string;
  egitimBilgisi?: string;
  kisiselBilgiNotu?: string;
  formKulup?: string;
  formTarih?: string;
  formAdSoyad?: string;
  // Mülakat Formu — PRD 4.3'teki yapılandırılmış sorular.
  cinsiyet?: "Kadın" | "Erkek";
  federasyonKademeDurumu?: string;
  // Federasyon kademe belgesinin alındığı tarih ("YYYY-MM-DD"); "… Kademe belgem var"
  // seçildiğinde zorunlu. Raporlamada kullanılır.
  federasyonBelgeTarihi?: string;
  // Sadece "Denklik Bekliyor (Öğrenci)" seçildiğinde doldurulur.
  denklikMezuniyetTarihi?: string;
  antrenorlukGecmisiVarMi?: "Evet" | "Hayır";
  // "Evet" seçildiğinde: antrenörlük geçmişi için yapılandırılmış seçenekler henüz
  // netleşmedi (PRD: "seçenekler konuşulup belirlenecek") — geçici serbest metin.
  antrenorlukGecmisiDetay?: string;
  // Antrenörlük geçmişi "Evet" ise mülakat formunda sorulan yapılandırılmış alanlar;
  // antrenorlukGecmisiDetay formda "Deneyim özeti" olarak gösterilir.
  grupDersiVerebilir?: boolean;
  toplamDeneyim?: string;
  sonGorevYeri?: string;
  // Mülakat formunu dolduran kişi (varsayılan: mulakatiYapan) ve formun sonundaki serbest not.
  formMulakatiYapan?: string;
  mulakatDegerlendirmeNotu?: string;
  akademiMulakatTipi?: AkademiTipi;
  ilkBelgeSeti: Belge[];
  ikinciBelgeSeti: Belge[];
  // Canlı eğitmen olduktan sonra İK'nın yüklediği sözleşmeler (bkz. CANLI_EGITMEN_SOZLESMELERI);
  // KM/KMY yalnızca görüntüler ve indirir.
  canliEgitmenSozlesmeleri?: Belge[];
  ikinciBelgeSetiOnaylandi?: boolean;
  ikinciBelgeSetiRedSebebi?: string;
  // İkinci belge setini yükleyen KM/KMY tarafından işaretlenir (PRD 4.4).
  dijitalOryantasyonTamamlandi?: boolean;
  // Mülakat Planla — İK, her iki belge seti onaylandıktan sonra gerçek mülakatın
  // tarihini burada belirler (PRD 4.5). Belirlenene kadar Mülakat Sonucu girilemez.
  mulakatPlanlananTarihi?: string;
  mulakatPlanlananSaat?: string;
  mulakatPlanlayanKisi?: string;
  mulakatPlanlamaTarihi?: string;
  // Akademi Eğitimine Davet (PRD 4.7) — mülakat sonucu Olumlu olan adaylar için,
  // KM/KMY tarafından doldurulup İK onayına gönderilir.
  vergiLevhasi?: Belge;
  bmOnayliKonaklama?: "Evet" | "Hayır";
  akademiHesabiAcildiMi?: boolean;
  // Sadece akademiHesabiAcildiMi true iken zorunlu; dijital üye id'siyle aynıdır.
  akademiHesapUserId?: string;
  yonlendirilecekAkademiTarihi?: string;
  akademiDavetiRedSebebi?: string;
  // Akademi Eğitimine Davet formunda seçilen akademi dönemi (Akademi ana menüsünde tanımlanır).
  akademiDonemiId?: string;
  // Yoklamada "Gelmedi" işaretlendiği akademiler (PRD 8.2); profilde
  // "Akademiye katılmadı – [akademi tarihi]" olarak gösterilir.
  katilmadigiAkademiler?: {
    akademiId: string;
    akademiAdi: string;
    tarih: string;
  }[];
  // Eğitmen Detay Sayfası'nda Aday Eğitmenin Kişisel Bilgileri (PRD) alanları.
  macCampusId?: string;
  tcKimlikNo?: string;
  dogumTarihi?: string;
  ustBeden?: string;
  altBeden?: string;
  ayakkabiNo?: string;
  beden?: string;
  // Genel mezuniyet tarihi — mülakat formundaki denklikMezuniyetTarihi'nden ayrı.
  mezuniyetTarihi?: string;
  // Federasyon durumunu gösterir belge; ilk/ikinci belge setinin dışında, tek başına.
  // Mülakatı KM yaptıysa İK onayına düşer (otonom=İK'da direkt onaylı sayılır).
  federasyonDurumBelgesi?: Belge;
  federasyonDurumBelgesiOnaylandi?: boolean;
  federasyonDurumBelgesiRedSebebi?: string;
  federasyonDurumVizeleri?: FederasyonVizeKaydi[];
  // Branş bazında federasyon sertifikaları, kademe ve vize bilgisi (PRD 12).
  sertifikalar?: EgitmenSertifikasi[];
  // Federasyon Durumu & Sertifikalar tab'ındaki "Diğer Sertifikalar" listesi.
  digerSertifikalar?: FederasyonSertifikasi[];
  // Federasyon Durumu & Sertifikalar tab'ındaki "Temel Eğitim Belgeleri" listesi.
  temelEgitimBelgeleri?: TemelEgitimBelgesi[];
  // PRD 12.3 temel eğitim sınav sonuçları.
  temelEgitimSonuclari?: TemelEgitimSonucu[];
  // Kademe geçişleri için girilen gelişim seminerleri.
  gelisimSeminerleri?: GelisimSemineri[];
  // Öğrenim bilgisinin spor eğitimi ayrıntısı; yoksa egitimBilgisi'nden türetilir.
  sporEgitimi?: SporEgitimi;
  ihtarKayitlari?: IhtarKaydi[];
  // Eğitmen +1 hakkını kullanan üyeler (PRD 14); Flyby'dan gelir, raporda kolon olarak görünür.
  artiBirKullanimlari?: { uyeId: string; uyeAdi: string }[];
  istihdamTipi?: IstihdamTipi;
  // Alt sözleşme tipi, örn. "Kiracı Pilates Coach" (bkz. ALT_SOZLESME_TIPLERI).
  altSozlesmeTipi?: string;
  // GX ders yetkinliği kararları (İK / Sistem Yöneticisi); her dersin son kaydı geçerlidir.
  // Kayıt yoksa sistem önerisi (akademi sınavında 70+) geçerlidir.
  gxKararlari?: GxKarari[];
  // Kulüp atamasında seçilen eğitmen karne statüsü; Grup Ders Eğitmeni'nde yoktur.
  karneStatusu?: EgitmenLig;
  // Akademiyi tamamlayamayan / katılmayan adayın süreci sonlandırıldığında (PRD 10.1, 8.2).
  surecSonlandirma?: {
    neden: string;
    aciklama?: string;
    tarih: string;
    yapan: string;
  };
  // Flyby'daki tanımlı sözleşmeden gelir; Themis'te düzenlenemez, sadece görüntülenir.
  sozlesmeTipi?: SozlesmeTipi;
  // Sözleşme ve kulüp geçmişi; PGM/Flyby'dan gerçek zamanlı beslenir, Themis'te değiştirilemez.
  sozlesmeGecmisi?: SozlesmeKaydi[];
  // Eğitmenlikten işten çıkarıldığında (bkz. EgitmenIslemleriPaneli) doldurulur; Eğitmen
  // Yönetimi raporundaki "Aralıkta Çıkmış" filtresi ve Fesih Şekli/Nedeni sütunları içindir.
  cikisTarihi?: string;
  fesihSekli?: string;
  fesihNedeni?: string;
  // Eğitmen Detay/Düzenleme Sayfası alanları — akademi eğitmeni olunca doldurulur.
  biyografi?: string;
  title?: string;
  egitmenGrubu?: string;
  instagram?: string;
  digerKulupleri?: string[];
  altCalismaSekli?: string;
  konustuguDiller?: string[];
  mobilAlanYonetimi?: MobilAlanYonetimi;
  smsKodu?: string;
  aksiyonGecmisi: AksiyonKaydi[];
  // Bu oturumda kayıt üzerinde işlem yapıldığı an (listelerde en son işlem yapılan en üstte).
  sonIslemZamani?: number;
};

/** Eğitmen karnesindeki 8 alan — her biri 0-100 arası, data ekibi tarafından hesaplanır. */
export type EgitmenKarneAlanlari = {
  olcumProgram: number;
  grupDersi: number;
  ptDersi: number;
  alanHizmeti: number;
  npsPozitifCevap: number;
  calismaSuresi: number;
  kulupMemnuniyeti: number;
  kulupSadakati: number;
};

/**
 * Silver/Gold/Platinum/Diamond — Excel'den yüklenmez; ay sonunda final puana göre
 * Themis tarafından otomatik belirlenir (bkz. lib/karne.ts#ligBelirle).
 */
export type EgitmenLig = "Silver" | "Gold" | "Platinum" | "Diamond";

/**
 * Bir eğitmenin bir dönem (ay) için karne kaydı. Puan ve alanlar Themis içinde
 * hesaplanmaz; data ekibinin script/analiz çalışmasıyla üretilip Excel'den
 * Themis'e yüklenir, buradan itibaren veritabanında (bu prototipte
 * KarnelerContext state'inde) saklanır. Lig ise bu finalPuan'dan Themis
 * tarafından otomatik türetilir, kayda dahil değildir.
 */
export type EgitmenKarnesi = {
  id: string;
  egitmenId: string;
  donem: string;
  alanlar: EgitmenKarneAlanlari;
  finalPuan: number;
  yuklemeTarihi: string;
};

/**
 * Ham metriklerin (data ekibinin puana çevirdiği sayılar) 100 puana denk gelen üst
 * sınırı. Bir dönem sonunda o dönemin dağılımına bakılarak belirlenir ve BİR SONRAKİ
 * döneme uygulanır — bu sınıra ulaşan/aşan eğitmen o metrikte 100 puan almış sayılır.
 */
export type MetrikLimitleri = {
  id: string;
  donem: string;
  fitStartTekil: number;
  fitStartTotal: number;
  grupDersiTekil: number;
  grupDersiTotal: number;
  ptTekil: number;
  ptTotal: number;
  alanHizmeti: number;
  npsPozitifCevap: number;
  calismaSuresi: number;
  girisTarihi: string;
  giren: string;
};

/**
 * Bir kulübün, dönem başında girilen GX Stüdyo sayısı. Kulüp ve dönem bazında
 * tutulur; her dönem başında güncellenir.
 */
export type KulupStudyoSayisi = {
  id: string;
  kulup: string;
  donem: string;
  gxSayisi: number;
  girisTarihi: string;
  giren: string;
};

/**
 * Bir eğitmenin, sağlık durumu/doğum izni/askerlik/tadilattaki kulüp vb. bir
 * sebeple belirli bir dönem için karneden çıkarılma kaydı. aktif=false olduğunda
 * eğitmen karneye geri dönmüştür, ama kayıt geçmiş (preview) olarak saklanmaya
 * devam eder — silmek ayrı bir işlemdir (bkz. KarnelerContext#haricSil).
 * suresiz=true ise elle "Geri Dahil Et" yapılana kadar tüm dönemlerde çıkarılmış
 * kalır; suresiz=false ise sadece donem alanındaki tek dönem için geçerlidir.
 */
export type KarneHaricKaydi = {
  id: string;
  egitmenId: string;
  donem: string;
  sebep: string;
  oncekiLig?: EgitmenLig;
  suresiz: boolean;
  aktif: boolean;
  girisTarihi: string;
  // Karneye geri dahil edildiği tarih; aktif=true olduğu sürece boştur.
  donusTarihi?: string;
  giren: string;
};

/**
 * Karneden çıkarmadan bağımsız: eğitmen karnede/görünür kalmaya devam eder, ama ligi
 * gerçek final puanından bağımsız olarak burada seçilen değere sabitlenir. Sebep,
 * "Fraud" veya "Diğer" (bkz. SABITLEME_SEBEPLERI) olabilir — Fraud artık ayrı bir
 * kalıcı liste değil, bu mekanizmanın bir sebep seçeneğidir ve aynı şekilde
 * düzenlenebilir/kaldırılabilir.
 */
export type KarneSabitlemeKaydi = {
  id: string;
  egitmenId: string;
  donem: string;
  lig: EgitmenLig;
  sebep: string;
  aktif: boolean;
  girisTarihi: string;
  giren: string;
};

/**
 * Belirli bir role/kişiye giden sistem bildirimi (ör. mülakat planlandığında talebi
 * açan KM/KMY'ye gönderilen bilgilendirme — bkz. PRD 4.5).
 */
export type Bildirim = {
  id: string;
  aliciRol: MulakatRolu;
  aliciAd: string;
  baslik: string;
  mesaj: string;
  planlayan: string;
  tarih: string;
  okundu: boolean;
  adayId?: string;
  // Belirtilirse tıklandığında /adaylar/{adayId} yerine bu adrese yönlendirir
  // (ör. İK onayı bekleyen bildirimler doğrudan Onay Talepleri sayfasına gider).
  link?: string;
};
