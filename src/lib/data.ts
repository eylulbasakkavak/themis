import { AKADEMI_TANIMLARI } from "./akademiData";
import {
  akademiKatilimcilariUret,
  SOYADLAR,
  adaySureciOrnekleriUret,
  mulakatBekleyenAdaylarUret,
  sentetikEgitmenlerUret,
  themisIdUret,
} from "./egitmenUret";
import { ALT_SOZLESME_TIPLERI, EGITIM_BILGISI_SECENEKLERI } from "./egitmenSecenekleri";
import { TEMEL_EGITIM_DERSLERI } from "./sertifika";
import {
  adlariTeklestir,
  akademiBittiMi,
  kaydiTutarliHaleGetir,
  ornekSinavDurumu,
} from "./veriTutarliligi";
import type { AdayEgitmen, EgitmenSertifikasi, TemelEgitimSonucu } from "./types";

const elleGirilenAdaylar: Omit<AdayEgitmen, "themisId">[] = [
  {
    id: "1",
    ad: "Ahmet",
    soyad: "Yıldız",
    telefon: "0532 111 22 33",
    eposta: "ahmet.yildiz@gmail.com",
    kulup: "Beşiktaş",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "12.08.2026",
    surecDurumu: "ilk_belge_seti_bekleniyor",
    sporGecmisi: "8 yıl amatör basketbol, kişisel antrenörlük sertifikası yok",
    isDeneyimi: "2 yıl özel ders veren serbest antrenör",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklenmedi" },
      { ad: "Aday CV'si", durum: "yuklenmedi" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklenmedi" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      { tarih: "10.08.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Ahmet Yıldız (kendisi)" },
      {
        tarih: "12.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
    ],
  },
  {
    id: "2",
    ad: "Zeynep",
    soyad: "Kaya",
    telefon: "0544 222 33 44",
    eposta: "zeynep.kaya@hotmail.com",
    kulup: "Kadıköy",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "09.08.2026",
    surecDurumu: "ilk_belge_seti_bekleniyor",
    sporGecmisi: "Pilates enstrüktörlüğü sertifikası, 3 yıl stüdyo deneyimi",
    isDeneyimi: "3 yıl özel pilates stüdyosunda eğitmenlik",
    cinsiyet: "Kadın",
    egitimBilgisi: "Lisans - Alan Dışı Bölüm (Mezun)",
    federasyonKademeDurumu: "1. Kademe belgem yok. 1. Kademe temel eğitimim de yok.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "3 yıl özel pilates stüdyosunda enstrüktörlük",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "09.08.2026" },
      { ad: "Aday CV'si", durum: "yuklenmedi" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      { tarih: "05.08.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Zeynep Kaya (kendisi)" },
      { tarih: "09.08.2026", aksiyon: "Akademi eğitimine davet edildi", yapan: "Elif Su (İK)" },
      {
        tarih: "09.08.2026",
        aksiyon: "Mülakat Formu yüklendi ve otonom onaylandı",
        yapan: "Elif Su (İK)",
      },
    ],
  },
  {
    id: "3",
    ad: "Murat",
    soyad: "Çelik",
    telefon: "0555 333 44 55",
    eposta: "murat.celik@yandex.com",
    kulup: "Ataşehir",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Barış Ç.",
    basvuruTarihi: "03.08.2026",
    surecDurumu: "ikinci_belge_seti_bekleniyor",
    sporGecmisi: "Eskrim milli takım altyapısı, 5 yıl antrenörlük",
    isDeneyimi: "4 yıl özel akademi eğitmenliği",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "2. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "5 yıl eskrim antrenörlüğü, 4 yıl özel akademi eğitmenliği",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "03.08.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "03.08.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "03.08.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      { tarih: "28.07.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Murat Çelik (kendisi)" },
      {
        tarih: "01.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Barış Ç. (Kulüp Müdürü)",
      },
      { tarih: "03.08.2026", aksiyon: "3 belge yüklendi", yapan: "Barış Ç. (Kulüp Müdürü)" },
    ],
  },
  {
    id: "4",
    ad: "Elif",
    soyad: "Şahin",
    telefon: "0506 444 55 66",
    eposta: "elif.sahin@gmail.com",
    kulup: "Bakırköy",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "20.07.2026",
    surecDurumu: "akademi_egitmeni",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "20.07.2026",
    mulakatPlanlananTarihi: "20.07.2026",
    mulakatPlanlayanKisi: "Elif Su (İK)",
    mulakatPlanlamaTarihi: "19.07.2026",
    sporGecmisi: "6 yıl yüzme antrenörlüğü, cankurtaranlık sertifikası",
    isDeneyimi: "2 yıl belediye spor okulu eğitmenliği",
    cinsiyet: "Kadın",
    egitimBilgisi: "Ön Lisans - Spor Bilimleri Bölümü (Mezun)",
    federasyonKademeDurumu: "1. Kademe belgem var. 2. Kademe temel eğitimim yok.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "6 yıl yüzme antrenörlüğü, cankurtaranlık sertifikası",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "25.07.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "20.07.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "20.07.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "24.07.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "24.07.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "25.07.2026" },
    ],
    ayakkabiNo: "38",
    beden: "M",
    ustBeden: "M",
    altBeden: "M",
    aksiyonGecmisi: [
      { tarih: "18.07.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Elif Şahin (kendisi)" },
      { tarih: "20.07.2026", aksiyon: "Akademi eğitimine davet edildi", yapan: "Elif Su (İK)" },
      {
        tarih: "20.07.2026",
        aksiyon: "İlk belge seti yüklendi, otonom onaylandı",
        yapan: "Elif Su (İK)",
      },
      { tarih: "25.07.2026", aksiyon: "İkinci belge seti onaylandı", yapan: "Elif Su (İK)" },
      {
        tarih: "26.07.2026",
        aksiyon:
          "Akademi Eğitmeni sözleşmesi atandı, mevcut dijital üyelik sözleşmesi sonlandırıldı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "26.07.2026",
        aksiyon: "Ayakkabı numarası ve beden bilgisi alındı",
        yapan: "Elif Su (İK)",
      },
    ],
  },
  {
    id: "5",
    ad: "Burak",
    soyad: "Öztürk",
    telefon: "0533 555 66 77",
    eposta: "burak.ozturk@icloud.com",
    kulup: "Maslak",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Aslı Kurt",
    basvuruTarihi: "15.07.2026",
    surecDurumu: "akademi_egitmeni",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "15.07.2026",
    sporGecmisi: "10 yıl vücut geliştirme, PT sertifikası",
    isDeneyimi: "5 yıl özel spor salonu eğitmenliği",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lisans - Alan Dışı Bölüm (Mezun)",
    federasyonKademeDurumu: "3. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "10 yıl vücut geliştirme, PT sertifikası",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "21.07.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "16.07.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "16.07.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "17.07.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "20.07.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "20.07.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "21.07.2026" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    ayakkabiNo: "42",
    beden: "L",
    ustBeden: "L",
    altBeden: "L",
    aksiyonGecmisi: [
      { tarih: "12.07.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Burak Öztürk (kendisi)" },
      {
        tarih: "15.07.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Aslı Kurt (Kulüp Müdürü)",
      },
      {
        tarih: "17.07.2026",
        aksiyon: "İlk belge seti İK tarafından onaylandı",
        yapan: "Elif Su (İK)",
      },
      { tarih: "21.07.2026", aksiyon: "İkinci belge seti onaylandı", yapan: "Elif Su (İK)" },
      {
        tarih: "22.07.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
    ],
  },
  {
    id: "6",
    ad: "Selin",
    soyad: "Arslan",
    telefon: "0542 666 77 88",
    eposta: "selin.arslan@gmail.com",
    kulup: "Bostancı",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "02.06.2026",
    surecDurumu: "akademiyi_tamamladi",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "02.06.2026",
    sporGecmisi: "Reformer pilates enstrüktörü, 4 yıl deneyim",
    isDeneyimi: "4 yıl butik pilates stüdyosu",
    cinsiyet: "Kadın",
    egitimBilgisi: "Lisans - Alan Dışı Bölüm (Mezun)",
    federasyonKademeDurumu:
      "1. Kademe belgem yok. 1. Kademe temel eğitimim var. 1. Kademe kursunu bekliyorum.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "4 yıl reformer pilates enstrüktörlüğü",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "08.06.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "03.06.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "03.06.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "07.06.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "07.06.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "08.06.2026" },
    ],
    ayakkabiNo: "37",
    beden: "S",
    ustBeden: "S",
    altBeden: "S",
    aksiyonGecmisi: [
      { tarih: "01.06.2026", aksiyon: "Akademi eğitimine davet edildi", yapan: "Elif Su (İK)" },
      {
        tarih: "09.06.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "18.08.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
    ],
  },
  {
    id: "7",
    ad: "Kerem",
    soyad: "Aydın",
    telefon: "0536 777 88 99",
    eposta: "kerem.aydin@gmail.com",
    kulup: "Etiler",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "28.05.2026",
    surecDurumu: "akademiyi_tamamladi",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "28.05.2026",
    sporGecmisi: "Crossfit L1 antrenör, 6 yıl deneyim",
    isDeneyimi: "6 yıl fonksiyonel antrenman salonu eğitmenliği",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "2. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "6 yıl crossfit antrenörlüğü",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "03.06.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "29.05.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "29.05.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "30.05.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "02.06.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "02.06.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "03.06.2026" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    ayakkabiNo: "43",
    beden: "XL",
    ustBeden: "XL",
    altBeden: "XL",
    aksiyonGecmisi: [
      {
        tarih: "27.05.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
      {
        tarih: "04.06.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "17.08.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
    ],
  },
  {
    id: "8",
    ad: "Deniz",
    soyad: "Koç",
    telefon: "0507 888 99 00",
    eposta: "deniz.koc@outlook.com",
    kulup: "Ümraniye",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "10.06.2026",
    surecDurumu: "akademiyi_tamamladi",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "10.06.2026",
    sporGecmisi: "Yoga eğitmeni sertifikası (RYT-200)",
    isDeneyimi: "2 yıl serbest yoga eğitmenliği",
    cinsiyet: "Kadın",
    egitimBilgisi: "Lisans - Alan Dışı Bölüm (Mezun)",
    federasyonKademeDurumu: "1. Kademe belgem yok. 1. Kademe temel eğitimim de yok.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "2 yıl serbest yoga eğitmenliği",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "15.06.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "11.06.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "11.06.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "14.06.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "14.06.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "15.06.2026" },
    ],
    ayakkabiNo: "36",
    beden: "S",
    ustBeden: "S",
    altBeden: "S",
    aksiyonGecmisi: [
      { tarih: "09.06.2026", aksiyon: "Akademi eğitimine davet edildi", yapan: "Elif Su (İK)" },
      {
        tarih: "16.06.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "19.08.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
    ],
  },
  {
    id: "9",
    ad: "Ece",
    soyad: "Yılmaz",
    telefon: "0505 111 44 77",
    eposta: "ece.yilmaz@gmail.com",
    kulup: "Levent",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Aslı Kurt",
    basvuruTarihi: "05.03.2026",
    surecDurumu: "egitmen",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "05.03.2026",
    akademiDonemiId: "d11k",
    sporGecmisi: "Atletizm milli sporcu geçmişi, PT sertifikası",
    isDeneyimi: "7 yıl özel antrenörlük",
    cinsiyet: "Kadın",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "3. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "7 yıl özel antrenörlük",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    istihdamTipi: "Tam Zamanlı",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "11.03.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "06.03.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "06.03.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "07.03.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "10.03.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "10.03.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "11.03.2026" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    ayakkabiNo: "39",
    beden: "M",
    ustBeden: "M",
    altBeden: "M",
    // Ana federasyon sertifikası — federasyonKademeDurumu "3. Kademe belgem var." ile
    // uyumlu olarak Fitness Federasyonu kademe belgesini temsil eder.
    federasyonDurumBelgesi: {
      ad: "Federasyon Sertifikası",
      durum: "yuklendi",
      tarih: "15.03.2026",
    },
    federasyonDurumBelgesiOnaylandi: true,
    federasyonDurumVizeleri: [
      {
        yil: 2025,
        belge: {
          ad: "Federasyon Sertifikası 2025 Vize Belgesi",
          durum: "yuklendi",
          tarih: "10.02.2025",
        },
        onaylandi: true,
        yukleyen: "Aslı Kurt (Kulüp Müdürü)",
      },
    ],
    digerSertifikalar: [
      {
        id: "9-fs1",
        tip: "Pilates Federasyonu",
        belge: { ad: "Pilates Federasyonu", durum: "yuklendi", tarih: "20.03.2026" },
        onaylandi: true,
        yukleyen: "Aslı Kurt (Kulüp Müdürü)",
        vizeler: [
          {
            yil: 2025,
            belge: {
              ad: "Pilates Federasyonu 2025 Vize Belgesi",
              durum: "yuklendi",
              tarih: "18.02.2025",
            },
            onaylandi: true,
            yukleyen: "Aslı Kurt (Kulüp Müdürü)",
          },
          {
            yil: 2026,
            belge: {
              ad: "Pilates Federasyonu 2026 Vize Belgesi",
              durum: "yuklendi",
              tarih: "22.02.2026",
            },
            onaylandi: true,
            yukleyen: "Aslı Kurt (Kulüp Müdürü)",
          },
        ],
      },
      {
        id: "9-fs2",
        tip: "Yoga Federasyonu",
        belge: { ad: "Yoga Federasyonu", durum: "yuklendi", tarih: "20.03.2026" },
        onaylandi: true,
        yukleyen: "Aslı Kurt (Kulüp Müdürü)",
        vizeler: [
          {
            yil: 2025,
            belge: {
              ad: "Yoga Federasyonu 2025 Vize Belgesi",
              durum: "yuklendi",
              tarih: "18.02.2025",
            },
            onaylandi: true,
            yukleyen: "Aslı Kurt (Kulüp Müdürü)",
          },
        ],
      },
      {
        id: "9-fs3",
        tip: "Dans Federasyonu",
        belge: { ad: "Dans Federasyonu", durum: "yuklendi", tarih: "25.03.2026" },
        onaylandi: false,
        yukleyen: "Aslı Kurt (Kulüp Müdürü)",
      },
    ],
    sozlesmeGecmisi: [
      {
        kulup: "Levent",
        sozlesmeTipi: "Tam Zamanlı",
        baslangicTarihi: "22.05.2026",
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      {
        tarih: "12.03.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "20.05.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "22.05.2026",
        aksiyon:
          "Tam Zamanlı Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı",
        yapan: "Sistem (Themis) — toplu işlem",
      },
    ],
  },
  {
    id: "10",
    ad: "Onur",
    soyad: "Kaplan",
    telefon: "0532 222 55 88",
    eposta: "onur.kaplan@gmail.com",
    kulup: "Şişli",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "18.02.2026",
    surecDurumu: "egitmen",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "18.02.2026",
    sporGecmisi: "Boks antrenörü, 5 yıl deneyim",
    isDeneyimi: "3 yıl boks salonu eğitmenliği",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lise mezunu",
    federasyonKademeDurumu: "2. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "5 yıl boks antrenörlüğü",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    istihdamTipi: "Yarı Zamanlı",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "23.02.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "19.02.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "19.02.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "22.02.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "22.02.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "23.02.2026" },
    ],
    ayakkabiNo: "44",
    beden: "L",
    ustBeden: "L",
    altBeden: "L",
    sozlesmeGecmisi: [
      {
        kulup: "Şişli",
        sozlesmeTipi: "Yarı Zamanlı",
        baslangicTarihi: "04.05.2026",
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      {
        tarih: "24.02.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "02.05.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "04.05.2026",
        aksiyon:
          "Yarı Zamanlı Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı",
        yapan: "Sistem (Themis) — toplu işlem",
      },
    ],
  },
  {
    id: "11",
    ad: "Gizem",
    soyad: "Aksoy",
    telefon: "0531 999 22 11",
    eposta: "gizem.aksoy@gmail.com",
    kulup: "Bahçeşehir",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Barış Ç.",
    basvuruTarihi: "01.08.2026",
    surecDurumu: "reddedildi",
    gorusmeSonucu: "Olumsuz",
    gorusmeSonucuTarihi: "01.08.2026",
    sporGecmisi: "Zumba eğitmeni, 1 yıl deneyim",
    isDeneyimi: "Deneyim yok",
    cinsiyet: "Kadın",
    egitimBilgisi: "Lise mezunu",
    federasyonKademeDurumu: "1. Kademe belgem yok. 1. Kademe temel eğitimim de yok.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "1 yıl zumba eğitmenliği",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "02.08.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "02.08.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "02.08.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      {
        tarih: "01.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Barış Ç. (Kulüp Müdürü)",
      },
      {
        tarih: "02.08.2026",
        aksiyon: "Mülakat Formu ve Bölge Müdürü Onayı İK tarafından reddedildi",
        yapan: "Elif Su (İK)",
        detay: "Görüşme sonucu olumsuz olarak değerlendirildi",
      },
      { tarih: "03.08.2026", aksiyon: "Aday süreci sonlandırıldı", yapan: "Elif Su (İK)" },
    ],
  },
  {
    id: "12",
    ad: "Yağmur",
    soyad: "Demir",
    telefon: "0538 111 33 55",
    eposta: "yagmur.demir@gmail.com",
    kulup: "Beşiktaş",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "18.08.2026",
    surecDurumu: "ilk_belge_seti_bekleniyor",
    sporGecmisi: "Voleybol altyapı antrenörlüğü, 3 yıl deneyim",
    isDeneyimi: "1 yıl okul spor kulübü eğitmenliği",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklenmedi" },
      { ad: "Aday CV'si", durum: "yuklenmedi" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklenmedi" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      {
        tarih: "18.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
    ],
  },
  {
    id: "13",
    ad: "Cem",
    soyad: "Aydemir",
    telefon: "0543 222 44 66",
    eposta: "cem.aydemir@gmail.com",
    kulup: "Kadıköy",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "19.08.2026",
    surecDurumu: "ilk_belge_seti_bekleniyor",
    sporGecmisi: "Masa tenisi kulüp antrenörü, 2 yıl deneyim",
    isDeneyimi: "Deneyim yok",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklenmedi" },
      { ad: "Aday CV'si", durum: "yuklenmedi" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      {
        tarih: "19.08.2026",
        aksiyon: "İK tarafından mülakata davet edildi",
        yapan: "Elif Su (İK)",
      },
    ],
  },
  {
    id: "14",
    ad: "Aslı",
    soyad: "Yıldırım",
    telefon: "0555 777 11 22",
    eposta: "asli.yildirim@gmail.com",
    kulup: "Maslak",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Aslı Kurt",
    basvuruTarihi: "20.08.2026",
    surecDurumu: "ilk_belge_seti_bekleniyor",
    sporGecmisi: "Fitness enstrüktörü, 4 yıl deneyim",
    isDeneyimi: "4 yıl özel spor salonu eğitmenliği",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklenmedi" },
      { ad: "Aday CV'si", durum: "yuklenmedi" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklenmedi" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      {
        tarih: "20.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Aslı Kurt (Kulüp Müdürü)",
      },
    ],
  },
  {
    id: "15",
    ad: "Berk",
    soyad: "Şimşek",
    telefon: "0546 333 88 12",
    eposta: "berk.simsek@gmail.com",
    kulup: "Ümraniye",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "20.08.2026",
    surecDurumu: "ilk_belge_seti_bekleniyor",
    sporGecmisi: "Basketbol altyapı antrenörlüğü, 2 yıl deneyim",
    isDeneyimi: "Deneyim yok",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklenmedi" },
      { ad: "Aday CV'si", durum: "yuklenmedi" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklenmedi" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklenmedi" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklenmedi" },
    ],
    aksiyonGecmisi: [
      {
        tarih: "20.08.2026",
        aksiyon: "İK tarafından mülakata davet edildi",
        yapan: "Elif Su (İK)",
      },
    ],
  },
  {
    id: "16",
    ad: "Alper",
    soyad: "Güneş",
    telefon: "0533 444 12 34",
    eposta: "alper.gunes@gmail.com",
    kulup: "Beşiktaş",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "10.01.2026",
    surecDurumu: "egitmen",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "10.01.2026",
    akademiDonemiId: "d11k",
    sporGecmisi: "Futbol altyapı antrenörlüğü, 6 yıl deneyim",
    isDeneyimi: "4 yıl özel spor kulübü eğitmenliği",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "2. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "6 yıl futbol altyapı antrenörlüğü",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    istihdamTipi: "Tam Zamanlı",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "16.01.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "11.01.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "11.01.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "12.01.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "15.01.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "15.01.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "16.01.2026" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    ayakkabiNo: "41",
    beden: "L",
    ustBeden: "L",
    altBeden: "L",
    sozlesmeGecmisi: [
      {
        kulup: "Ümraniye",
        sozlesmeTipi: "Yarı Zamanlı",
        baslangicTarihi: "10.06.2023",
        bitisTarihi: "20.12.2025",
        durum: "Sona Erdi",
        bitisNedeni: "Kulüp değişikliği",
      },
      {
        kulup: "Beşiktaş",
        sozlesmeTipi: "Tam Zamanlı",
        baslangicTarihi: "27.03.2026",
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      {
        tarih: "17.01.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "25.03.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "27.03.2026",
        aksiyon:
          "Tam Zamanlı Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı",
        yapan: "Sistem (Themis) — toplu işlem",
      },
    ],
  },
  {
    id: "17",
    ad: "Pelin",
    soyad: "Sarı",
    telefon: "0544 555 23 45",
    eposta: "pelin.sari@gmail.com",
    kulup: "Bostancı",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "05.01.2026",
    surecDurumu: "egitmen",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "05.01.2026",
    akademiDonemiId: "d18",
    sporGecmisi: "Reformer pilates enstrüktörü, 5 yıl deneyim",
    isDeneyimi: "3 yıl butik pilates stüdyosu",
    cinsiyet: "Kadın",
    egitimBilgisi: "Ön Lisans - Alan Dışı Bölüm (Mezun)",
    federasyonKademeDurumu:
      "1. Kademe belgem yok. 1. Kademe temel eğitimim var. 1. Kademe kursunu bekliyorum.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "5 yıl reformer pilates enstrüktörlüğü",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    istihdamTipi: "Yarı Zamanlı",
    title: "Pilates Eğitmeni",
    sozlesmeTipi: "Pilates",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "10.01.2026" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "06.01.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "06.01.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "09.01.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "09.01.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "10.01.2026" },
    ],
    ayakkabiNo: "38",
    beden: "S",
    ustBeden: "S",
    altBeden: "S",
    sozlesmeGecmisi: [
      {
        kulup: "Bostancı",
        sozlesmeTipi: "Yarı Zamanlı",
        baslangicTarihi: "22.03.2026",
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      {
        tarih: "11.01.2026",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "20.03.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "22.03.2026",
        aksiyon:
          "Yarı Zamanlı Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı",
        yapan: "Sistem (Themis) — toplu işlem",
      },
    ],
  },
  {
    id: "18",
    ad: "Tolga",
    soyad: "Erdem",
    telefon: "0535 666 34 56",
    eposta: "tolga.erdem@gmail.com",
    kulup: "Etiler",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "12.12.2025",
    surecDurumu: "egitmen",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "12.12.2025",
    sporGecmisi: "Crossfit L2 antrenör, 8 yıl deneyim",
    isDeneyimi: "5 yıl kendi stüdyosunda bağımsız eğitmenlik",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "3. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "8 yıl crossfit antrenörlüğü",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    istihdamTipi: "Kiracı",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "18.12.2025" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "13.12.2025" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "13.12.2025" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "14.12.2025" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "17.12.2025" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "17.12.2025" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "18.12.2025" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    ayakkabiNo: "43",
    beden: "XL",
    ustBeden: "XL",
    altBeden: "XL",
    sozlesmeGecmisi: [
      {
        kulup: "Etiler",
        sozlesmeTipi: "Kiracı",
        baslangicTarihi: "02.03.2026",
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      {
        tarih: "19.12.2025",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "28.02.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "02.03.2026",
        aksiyon: "Kiracı Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı",
        yapan: "Sistem (Themis) — toplu işlem",
      },
    ],
  },
  {
    id: "19",
    ad: "Ayşe",
    soyad: "Bulut",
    telefon: "0536 777 45 67",
    eposta: "ayse.bulut@gmail.com",
    kulup: "Kadıköy",
    mulakatiYapanRol: "İK",
    mulakatiYapan: "Elif Su",
    basvuruTarihi: "08.12.2025",
    surecDurumu: "egitmen",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "08.12.2025",
    sporGecmisi: "Yüzme antrenörü, cankurtaranlık sertifikası, 6 yıl deneyim",
    isDeneyimi: "4 yıl kendi bağımsız yüzme dersleri",
    cinsiyet: "Kadın",
    egitimBilgisi: "Ön Lisans - Spor Bilimleri Bölümü (Mezun)",
    federasyonKademeDurumu: "2. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "6 yıl yüzme antrenörlüğü, cankurtaranlık sertifikası",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    istihdamTipi: "Kiracı",
    title: "Yüzme Eğitmeni",
    sozlesmeTipi: "Havuz",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "13.12.2025" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "09.12.2025" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "09.12.2025" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "12.12.2025" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "12.12.2025" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "13.12.2025" },
    ],
    ayakkabiNo: "37",
    beden: "M",
    ustBeden: "M",
    altBeden: "M",
    sozlesmeGecmisi: [
      {
        kulup: "Kadıköy",
        sozlesmeTipi: "Kiracı",
        baslangicTarihi: "26.02.2026",
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      {
        tarih: "14.12.2025",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "24.02.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "26.02.2026",
        aksiyon: "Kiracı Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı",
        yapan: "Sistem (Themis) — toplu işlem",
      },
    ],
  },
  {
    id: "20",
    ad: "Kaan",
    soyad: "Uslu",
    telefon: "0537 888 56 78",
    eposta: "kaan.uslu@gmail.com",
    kulup: "Ümraniye",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Barış Ç.",
    basvuruTarihi: "03.11.2025",
    surecDurumu: "egitmen",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "03.11.2025",
    sporGecmisi: "Vücut geliştirme, PT sertifikası, 9 yıl deneyim",
    isDeneyimi: "6 yıl özel spor salonu eğitmenliği",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lisans - Alan Dışı Bölüm (Mezun)",
    federasyonKademeDurumu: "3. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "9 yıl vücut geliştirme antrenörlüğü",
    akademiMulakatTipi: "Kısa Dönem Akademi Mülakatı (1 Hafta)",
    istihdamTipi: "Tam Zamanlı",
    vergiLevhasi: { ad: "Vergi Levhası", durum: "yuklendi", tarih: "06.11.2025" },
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "04.11.2025" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "04.11.2025" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "05.11.2025" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "08.11.2025" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "08.11.2025" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "09.11.2025" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    ayakkabiNo: "42",
    beden: "L",
    ustBeden: "L",
    altBeden: "L",
    sozlesmeGecmisi: [
      {
        kulup: "Ümraniye",
        sozlesmeTipi: "Tam Zamanlı",
        baslangicTarihi: "22.01.2026",
        durum: "Devam Ediyor",
      },
    ],
    aksiyonGecmisi: [
      {
        tarih: "10.11.2025",
        aksiyon: "Akademi Eğitmeni sözleşmesi atandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "20.01.2026",
        aksiyon: "Akademi eğitimi başarıyla tamamlandı",
        yapan: "Sistem (Themis)",
      },
      {
        tarih: "22.01.2026",
        aksiyon:
          "Tam Zamanlı Eğitmen statüsüne geçirildi, PGM Eğitmen Self-Employee sözleşmesi atandı",
        yapan: "Sistem (Themis) — toplu işlem",
      },
    ],
  },
  {
    id: "90",
    ad: "Selin",
    soyad: "Aslan",
    telefon: "0536 909 09 09",
    eposta: "selin.aslan@gmail.com",
    kulup: "Beşiktaş",
    mulakatiYapanRol: "Kulüp Müdürü",
    // Bildirim testinin çalışması için burada oturum açan Kulüp Müdürü ile
    // (bkz. CurrentUserContext#KULLANICILAR) aynı isim kullanılıyor.
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "20.08.2026",
    surecDurumu: "mulakat_sonucu_bekleniyor",
    cinsiyet: "Kadın",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "2. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "3 yıl grup dersi eğitmenliği",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    formKulup: "Beşiktaş",
    formTarih: "20.08.2026",
    formAdSoyad: "Selin Aslan",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "20.08.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "20.08.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "20.08.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "21.08.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "21.08.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "21.08.2026" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    dijitalOryantasyonTamamlandi: true,
    aksiyonGecmisi: [
      { tarih: "18.08.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Selin Aslan (kendisi)" },
      {
        tarih: "20.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
      {
        tarih: "20.08.2026",
        aksiyon: "Mülakat Formu dolduruldu",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
      {
        tarih: "21.08.2026",
        aksiyon: "İkinci belge seti İK tarafından onaylandı",
        yapan: "Elif Su (İK)",
      },
    ],
  },
  {
    id: "91",
    ad: "Kerem",
    soyad: "Toprak",
    telefon: "0536 919 19 19",
    eposta: "kerem.toprak@gmail.com",
    kulup: "Beşiktaş",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "21.08.2026",
    surecDurumu: "ikinci_belge_seti_bekleniyor",
    cinsiyet: "Erkek",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "3. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Evet",
    antrenorlukGecmisiDetay: "5 yıl fitness eğitmenliği",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    formKulup: "Beşiktaş",
    formTarih: "21.08.2026",
    formAdSoyad: "Kerem Toprak",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "21.08.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "21.08.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "21.08.2026" },
    ],
    // İkinci set belgeleri tamamlanmış, henüz İK onayına gönderilmedi — "Onaya
    // Gönder" bildirim testinin başlangıç noktası bu aday.
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "22.08.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "22.08.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "22.08.2026" },
    ],
    dijitalOryantasyonTamamlandi: true,
    aksiyonGecmisi: [
      { tarih: "19.08.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Kerem Toprak (kendisi)" },
      {
        tarih: "21.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
      {
        tarih: "21.08.2026",
        aksiyon: "Mülakat Formu dolduruldu",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
    ],
  },
  {
    id: "92",
    ad: "Buse",
    soyad: "Erdem",
    telefon: "0536 929 29 29",
    eposta: "buse.erdem@gmail.com",
    kulup: "Beşiktaş",
    mulakatiYapanRol: "Kulüp Müdürü",
    mulakatiYapan: "Mert Aydın",
    basvuruTarihi: "10.08.2026",
    // Mülakat sonucu Olumlu, ama akademi daveti formu (vergi levhası, BM onaylı
    // konaklama, akademi hesabı, yönlendirilecek tarih) henüz doldurulmadı — bu
    // adayda "Akademi Eğitimine Davet" testinin başlangıç noktası budur.
    surecDurumu: "akademi_egitimine_hazir",
    gorusmeSonucu: "Olumlu",
    gorusmeSonucuTarihi: "17.08.2026",
    cinsiyet: "Kadın",
    egitimBilgisi: "Lisans - Spor Bilimleri Fakültesi veya Besyo (Mezun)",
    federasyonKademeDurumu: "2. Kademe belgem var.",
    antrenorlukGecmisiVarMi: "Hayır",
    akademiMulakatTipi: "Standart Akademi Mülakatı (4 Hafta)",
    formKulup: "Beşiktaş",
    formTarih: "10.08.2026",
    formAdSoyad: "Buse Erdem",
    ilkBelgeSeti: [
      { ad: "Mülakat Formu", durum: "yuklendi", tarih: "10.08.2026" },
      { ad: "Aday CV'si", durum: "yuklendi", tarih: "10.08.2026" },
      { ad: "Bölge Müdürü Onayı", durum: "yuklendi", tarih: "10.08.2026" },
    ],
    ikinciBelgeSeti: [
      { ad: "Adli Sicil Belgesi", durum: "yuklendi", tarih: "11.08.2026" },
      { ad: "Öğrenim Durumu Belgesi", durum: "yuklendi", tarih: "11.08.2026" },
      { ad: "Fiziki Oryantasyon Formu", durum: "yuklendi", tarih: "11.08.2026" },
    ],
    ikinciBelgeSetiOnaylandi: true,
    dijitalOryantasyonTamamlandi: true,
    mulakatPlanlananTarihi: "14.08.2026",
    mulakatPlanlayanKisi: "Elif Su (İK)",
    mulakatPlanlamaTarihi: "12.08.2026",
    aksiyonGecmisi: [
      { tarih: "08.08.2026", aksiyon: "Dijital üyelik açıldı", yapan: "Buse Erdem (kendisi)" },
      {
        tarih: "10.08.2026",
        aksiyon: "Akademi eğitimine davet edildi",
        yapan: "Mert Aydın (Kulüp Müdürü)",
      },
      { tarih: "11.08.2026", aksiyon: "Belge seti İK tarafından onaylandı", yapan: "Elif Su (İK)" },
      {
        tarih: "12.08.2026",
        aksiyon: "Mülakat 14.08.2026 tarihine planlandı",
        yapan: "Elif Su (İK)",
      },
      {
        tarih: "17.08.2026",
        aksiyon: "Mülakat sonucu Olumlu olarak girildi",
        yapan: "Elif Su (İK)",
      },
    ],
  },
];

/**
 * Akademide olan / akademiyi tamamlamış örnek kayıtların akademisi girilmemişse, akademi
 * tipine uygun örnek bir akademiye atanır (bkz. akademiData).
 */
function akademiAtamasiTamamla<T extends Omit<AdayEgitmen, "themisId">>(a: T): T {
  const akademideMi =
    a.surecDurumu === "akademi_egitmeni" || a.surecDurumu === "akademiyi_tamamladi";
  if (!akademideMi || a.akademiDonemiId) return a;
  // Kısa dönem → tamamlanmış Dönem 11; akademisi devam eden → Dönem 19; bitiren → Dönem 18.
  const akademi = a.akademiMulakatTipi?.startsWith("Kısa")
    ? AKADEMI_TANIMLARI.d11k
    : a.surecDurumu === "akademi_egitmeni"
      ? AKADEMI_TANIMLARI.d19
      : AKADEMI_TANIMLARI.d18;
  return {
    ...a,
    akademiDonemiId: akademi.id,
    yonlendirilecekAkademiTarihi: akademi.baslangicTarihi,
  };
}

// Örnek vize bitişleri bugüne göre dağıtılır ki geçmiş / 30 gün içinde bitecek / geçerli
// durumların hepsi listede görünsün.
const VIZE_GUN_KAYDIRMALARI = [
  -5, 140, 210, 300, -2, 95, 180, 260, 12, 120, 330, 160, 6, 240, 3, 200, 75, 45,
];

/** Örnek vize bitişleri kişiden kişiye değişsin: geçmiş ve yaklaşan günler çeşitlendirilir. */
function vizeKaydirma(k: number, i: number): number {
  if (k < 0) return k - (i % 23);
  if (k <= 30) return Math.max(1, k + (i % 9) - 3);
  return k;
}

function gunSonra(gun: number): string {
  const d = new Date();
  d.setDate(d.getDate() + gun);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/** Eğitmen ve pasif eğitmen örnek kayıtlarına PRD 12 sertifika/vize verisi ekler. */
function sertifikalariTamamla<T extends AdayEgitmen>(a: T, i: number): T {
  if (a.sertifikalar) return a;
  // Aday ve akademi eğitmenleri: beyan ettikleri kademeye kadar her kademenin onaylı Fitness
  // belgesi (en yükseği geçerli vizeli) ve her kademenin, belgesinden önce geçilmiş temel eğitimi.
  if (a.surecDurumu !== "egitmen" && a.surecDurumu !== "pasif") {
    const k = Number(a.federasyonKademeDurumu?.match(/^(\d)\. Kademe belgem var/)?.[1]) || 1;
    const bitis = gunSonra(150 + (i % 150));
    const [g, ay, y] = a.basvuruTarihi.split(".").map(Number);
    const yaz = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    // j. kademe belgesi en yüksek kademeden (k - j) yıl önce; temel eğitim belgeden 2 ay önce.
    const belgeGunu = (j: number) => new Date(y - (k - j), ay - 1, g - 120);
    const temelGunu = (j: number) => {
      const d = belgeGunu(j);
      return new Date(d.getFullYear(), d.getMonth() - 2, d.getDate());
    };
    return {
      ...a,
      sertifikalar: Array.from({ length: k }, (_, idx) => {
        const j = k - idx;
        const tarih = yaz(belgeGunu(j));
        return {
          id: j === k ? `${a.id}-fitness` : `${a.id}-fitness-k${j}`,
          brans: "Fitness",
          kademe: j,
          belgeTarihi: tarih,
          onaylandi: true,
          belge: { ad: `Fitness ${j}. Kademe Belgesi.pdf`, durum: "yuklendi" as const, tarih },
          ...(j === k
            ? {
                vizeDonemi: `${Number(bitis.slice(-4)) - 1}-${bitis.slice(-4)} Sezonu`,
                vizeBitisTarihi: bitis,
              }
            : {}),
        };
      }),
      temelEgitimSonuclari:
        a.temelEgitimSonuclari ??
        Array.from({ length: k }, (_, idx) => {
          const tStr = yaz(temelGunu(idx + 1));
          return {
            id: `${a.id}-temel-Fitness-${idx + 1}`,
            brans: "Fitness",
            hedefKademe: idx + 1,
            sinavTarihi: tStr,
            sonuc: "Geçti" as const,
            dersler: Object.fromEntries(TEMEL_EGITIM_DERSLERI.map((d) => [d, "Geçti" as const])),
            onaylandi: true,
            yukleyen: "Mert Aydın (Kulüp Müdürü)",
            tarih: tStr,
          };
        }),
    };
  }
  // Belge tarihleri işe girişe göre: kademe 1 belgesi işe girişten önce (işe alım şartı),
  // daha yüksek kademeler işe girişten sonra alınmıştır.
  const isGiris =
    (a.sozlesmeGecmisi ?? [])
      .map((s) => s.baslangicTarihi.split(".").map(Number))
      .map(([g, ay, y]) => new Date(y, ay - 1, g))
      .sort((x, y) => x.getTime() - y.getTime())[0] ?? new Date(2025, 0, 15);
  const tarihStr = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  const isGirisOncesi = tarihStr(
    new Date(isGiris.getFullYear(), isGiris.getMonth(), isGiris.getDate() - 45)
  );
  const sonraki = (oran: number) =>
    tarihStr(new Date(isGiris.getTime() + (Date.now() - isGiris.getTime()) * oran));
  const kademe =
    Number(a.federasyonKademeDurumu?.match(/^(\d)\. Kademe belgem var/)?.[1]) || 1 + (i % 4);
  const vizeYili = (bitis: string) => `${Number(bitis.slice(-4)) - 1}-${bitis.slice(-4)} Sezonu`;
  const fitnessBitis = gunSonra(
    vizeKaydirma(VIZE_GUN_KAYDIRMALARI[i % VIZE_GUN_KAYDIRMALARI.length], i)
  );
  const sertifikalar: EgitmenSertifikasi[] = [
    {
      id: `${a.id}-fitness`,
      brans: "Fitness",
      kademe,
      belgeTarihi: kademe > 1 ? sonraki(0.6) : isGirisOncesi,
      onaylandi: true,
      vizeDonemi: vizeYili(fitnessBitis),
      vizeBitisTarihi: fitnessBitis,
    },
  ];
  if (i % 3 === 0) {
    const bitis = gunSonra(
      vizeKaydirma(VIZE_GUN_KAYDIRMALARI[(i + 5) % VIZE_GUN_KAYDIRMALARI.length], i)
    );
    sertifikalar.push({
      id: `${a.id}-pilates`,
      brans: "Pilates",
      kademe: 1 + (i % 2),
      belgeTarihi: sonraki(0.4),
      onaylandi: true,
      vizeDonemi: vizeYili(bitis),
      vizeBitisTarihi: bitis,
    });
  }
  if (i % 7 === 3) {
    const bitis = gunSonra(
      vizeKaydirma(VIZE_GUN_KAYDIRMALARI[(i + 9) % VIZE_GUN_KAYDIRMALARI.length], i)
    );
    sertifikalar.push({
      id: `${a.id}-boks`,
      brans: "Boks",
      kademe: 2,
      belgeTarihi: sonraki(0.75),
      onaylandi: true,
      vizeDonemi: vizeYili(bitis),
      vizeBitisTarihi: bitis,
    });
  }
  // Bazı eğitmenlerin KM'nin yüklediği yeni kademe belgesi İK onayı bekler.
  // Bir üst kademenin temel eğitimini geçip kursu tamamlamış, yeni belgesi İK onayında.
  const yeniBelgeOnayda = i % 11 === 4 && kademe < 5;
  if (yeniBelgeOnayda) {
    sertifikalar.push({
      id: `${a.id}-fitness-yeni`,
      brans: "Fitness",
      kademe: Math.min(5, kademe + 1),
      belgeTarihi: gunSonra(-3),
      onaylandi: false,
    });
  }
  // Kademe geçmişi: her branşta ulaşılan kademenin altındaki tüm eski belgeler (artık aktif
  // değil). Fitness 1. kademe belgesi işe girişten önce, ara kademeler aradaki yıllarda alınmıştır.
  for (const aktif of sertifikalar.filter((x) => x.onaylandi)) {
    for (let j = 1; j < aktif.kademe; j++) {
      sertifikalar.push({
        id: `${aktif.id}-k${j}`,
        brans: aktif.brans,
        kademe: j,
        belgeTarihi:
          aktif.brans === "Fitness" && j === 1
            ? isGirisOncesi
            : sonraki((0.6 * j) / aktif.kademe - 0.05),
        onaylandi: true,
      });
    }
  }
  // Her onaylı sertifikanın belgesi ve geçerli vizesinin kaydı.
  const tamamlanmis = sertifikalar.map((s) => ({
    ...s,
    belge: {
      ad: `${s.brans} ${s.kademe}. Kademe Belgesi.pdf`,
      durum: "yuklendi" as const,
      tarih: s.belgeTarihi,
    },
    yukleyen: "Mert Aydın (Kulüp Müdürü)",
    vizeler: s.vizeBitisTarihi
      ? [
          {
            id: `${s.id}-vize`,
            donem: s.vizeDonemi ?? "",
            bitisTarihi: s.vizeBitisTarihi,
            belge: { ad: "Vize Belgesi.pdf", durum: "yuklendi" as const, tarih: s.belgeTarihi },
            onaylandi: true,
            yukleyen: "Mert Aydın (Kulüp Müdürü)",
            tarih: s.belgeTarihi,
          },
        ]
      : [],
  }));
  // Temel eğitim: bazı eğitmenler bir üst kademenin temel eğitimini geçmiş (kurs bekleniyor),
  // bazılarının sonucu İK onayında.
  const dersler = (kalanlar: number) =>
    Object.fromEntries(
      TEMEL_EGITIM_DERSLERI.map((d, j) => [
        d,
        j < kalanlar ? ("Kaldı" as const) : ("Geçti" as const),
      ])
    );
  const temelEgitimSonuclari: TemelEgitimSonucu[] = yeniBelgeOnayda
    ? []
    : kademe < 5 && i % 4 === 0
      ? [
          {
            id: `${a.id}-temel-1`,
            brans: "Fitness",
            hedefKademe: kademe + 1,
            sinavTarihi: "14.06.2026",
            // Geçti / Katılmadı (mazeretli) / Kaldı (1–3 ders) örnekleri.
            sonuc: i % 12 === 0 ? "Geçti" : i % 12 === 4 ? "Katılmadı" : "Kaldı",
            dersler: i % 12 === 4 ? {} : dersler(i % 12 === 0 ? 0 : 1 + (i % 3)),
            mazeret: i % 12 === 4 ? "Sağlık raporu nedeniyle sınava katılamadı" : undefined,
            onaylandi: true,
            yukleyen: "Mert Aydın (Kulüp Müdürü)",
            tarih: "20.06.2026",
          },
        ]
      : kademe < 5 && i % 9 === 5
        ? [
            {
              id: `${a.id}-temel-1`,
              brans: "Fitness",
              hedefKademe: kademe + 1,
              sinavTarihi: "14.09.2026",
              sonuc: "Geçti",
              dersler: dersler(0),
              onaylandi: false,
              yukleyen: "Mert Aydın (Kulüp Müdürü)",
              tarih: "22.09.2026",
            },
          ]
        : [];
  // Geçmiş temel eğitimler: eğitmen ulaştığı her kademenin temel eğitimini geçmiştir
  // (3. kademe bir eğitmende 1., 2. ve 3. kademe temel eğitimleri).
  const enYuksek = new Map<string, number>();
  for (const s of tamamlanmis.filter((x) => x.onaylandi)) {
    enYuksek.set(s.brans, Math.max(enYuksek.get(s.brans) ?? 0, s.kademe));
  }
  // Yeni kademe belgesi onaydaysa o kademenin temel eğitimi de geçilmiştir.
  if (yeniBelgeOnayda) enYuksek.set("Fitness", kademe + 1);
  // Her temel eğitim, o kademenin belgesinden iki ay önce geçilmiştir (belgesi onayda olan
  // kademe için ise yakın zamanda).
  const temelTarihi = (brans: string, kademeNo: number) => {
    const belge = tamamlanmis.find((x) => x.brans === brans && x.kademe === kademeNo);
    if (!belge) return gunSonra(-40);
    const [g, ay, y] = belge.belgeTarihi.split(".").map(Number);
    const d = new Date(y, ay - 3, g);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };
  const gecmisTemel: TemelEgitimSonucu[] = [...enYuksek].flatMap(([brans, enUst]) =>
    Array.from({ length: enUst }, (_, k) => ({
      id: `${a.id}-temel-${brans}-${k + 1}`,
      brans,
      hedefKademe: k + 1,
      sinavTarihi: temelTarihi(brans, k + 1),
      sonuc: "Geçti" as const,
      dersler: dersler(0),
      onaylandi: true,
      yukleyen: "Mert Aydın (Kulüp Müdürü)",
      tarih: temelTarihi(brans, k + 1),
    }))
  );
  // Bazı eğitmenlerin yenilenen vizesi KM tarafından girilmiş, İK onayında (PRD 12.4).
  const vizeBekleyen = i % 13 === 6;
  return {
    ...a,
    sertifikalar: vizeBekleyen
      ? tamamlanmis.map((s) =>
          s.id === `${a.id}-fitness`
            ? {
                ...s,
                vizeler: [
                  ...s.vizeler,
                  {
                    id: `${s.id}-vize-yeni`,
                    donem: "2026-2027 Sezonu",
                    bitisTarihi: gunSonra(365),
                    belge: {
                      ad: "Vize Belgesi 2026.pdf",
                      durum: "yuklendi" as const,
                      tarih: gunSonra(-2),
                    },
                    onaylandi: false,
                    yukleyen: "Mert Aydın (Kulüp Müdürü)",
                    tarih: gunSonra(-2),
                  },
                ],
              }
            : s
        )
      : tamamlanmis,
    temelEgitimSonuclari: [...gecmisTemel, ...temelEgitimSonuclari],
  };
}

// Eğitmen Karne'yi gerçekçi bir ölçekte görebilmek için sentetik eğitmenlerle
// tamamlanır (elle girilenler + üretilenler = 50 eğitmen).
const tumAdaylar: AdayEgitmen[] = [
  ...elleGirilenAdaylar.map((a) => ({
    ...akademiAtamasiTamamla(a),
    themisId: themisIdUret(Number(a.id)),
  })),
  // Aktif ve pasif eğitmenler (ilk grup Eğitmen Karne verisiyle eşleşir).
  ...sentetikEgitmenlerUret(21, 43),
  ...sentetikEgitmenlerUret(400, 75, 17),
  // Aday süreci: mülakat bekleyenler ve her aşamadan örnekler.
  ...mulakatBekleyenAdaylarUret(100, 8),
  ...mulakatBekleyenAdaylarUret(120, 6, 9),
  ...adaySureciOrnekleriUret(300),
  ...adaySureciOrnekleriUret(340, 13),
  // Akademiler: biten Dönem 11 ve Dönem 18 (sınav sonuçlarıyla), devam eden Dönem 19,
  // yaklaşan Dönem 12 ve kontenjanı dolu Dönem 13.
  ...akademiKatilimcilariUret(200, 1, AKADEMI_TANIMLARI.d11k, [0]),
  ...akademiKatilimcilariUret(260, 7, AKADEMI_TANIMLARI.d11k, [4]),
  ...akademiKatilimcilariUret(270, 9, AKADEMI_TANIMLARI.d18, [6]),
  ...akademiKatilimcilariUret(210, 10, AKADEMI_TANIMLARI.d19),
  ...akademiKatilimcilariUret(220, 5, AKADEMI_TANIMLARI.d12k),
  ...akademiKatilimcilariUret(230, 4, AKADEMI_TANIMLARI.d13k),
].map((a): AdayEgitmen => {
  if (a.surecDurumu !== "akademi_egitmeni") return a;
  const sinav = akademiBittiMi(a.akademiDonemiId) ? ornekSinavDurumu(a.id) : null;
  // Bitmiş akademideki adaylar sınav sonucuna göre ilerler: geçenler eğitmenliğe geçişe hazır.
  if (sinav === "Geçti") return { ...a, surecDurumu: "akademiyi_tamamladi" };
  // Dönem 11'de sınavdan kalanların süreci İK tarafından sonlandırılmıştır (PRD 10.1).
  if (sinav === "Kaldı" && a.akademiDonemiId === "d11k") {
    return {
      ...a,
      surecDurumu: "surec_sonlandirildi",
      surecSonlandirma: {
        neden: "Akademi sınavlarından başarısız",
        aciklama: "Genel sınav sonucu Kaldı; Akademi Eğitmeni sözleşmesi kapatıldı.",
        tarih: "25.09.2026",
        yapan: "Elif Su (İK)",
      },
      aksiyonGecmisi: [
        ...a.aksiyonGecmisi,
        {
          tarih: "25.09.2026",
          aksiyon:
            "Süreç sonlandırıldı (Akademi sınavlarından başarısız); Akademi Eğitmeni sözleşmesi kapatıldı",
          yapan: "Elif Su (İK)",
        },
      ],
    };
  }
  // Devam eden Dönem 19'dan bir aday akademiyi yarıda bırakmıştır.
  if (a.id === "215") {
    return {
      ...a,
      surecDurumu: "surec_sonlandirildi",
      surecSonlandirma: {
        neden: "Akademiyi yarıda bıraktı",
        aciklama: "Kişisel nedenlerle akademiye devam edemeyeceğini bildirdi.",
        tarih: "02.10.2026",
        yapan: "Elif Su (İK)",
      },
      aksiyonGecmisi: [
        ...a.aksiyonGecmisi,
        {
          tarih: "02.10.2026",
          aksiyon:
            "Süreç sonlandırıldı (Akademiyi yarıda bıraktı); Akademi Eğitmeni sözleşmesi kapatıldı",
          yapan: "Elif Su (İK)",
        },
      ],
    };
  }
  return a;
});

const ORNEK_UYE_ADLARI = ["Ayşe Kaya", "Murat Demir", "Selin Aksoy", "Can Yıldız", "Ebru Şahin"];
const ORNEK_IHTAR_SEBEPLERI = ["Derse geç kalma", "Kıyafet kuralına uymama", "Üye şikayeti"];

/** Sözleşme tipini içeren bir alt sözleşme tipi; eşleşen yoksa listeden sırayla. */
function ornekAltSozlesmeTipi(a: AdayEgitmen, i: number): string {
  const uygunlar = ALT_SOZLESME_TIPLERI.filter((t) => a.istihdamTipi && t.includes(a.istihdamTipi));
  const liste = uygunlar.length ? uygunlar : ALT_SOZLESME_TIPLERI;
  return liste[i % liste.length];
}

/**
 * Raporlama (PRD 14) alanlarının örnek veride boş kalmaması için: TCKN, öğrenim durumu,
 * alt sözleşme tipi, ihtar kayıtları ve eğitmen +1 kullanımı eksikse deterministik örnek değerlerle doldurulur.
 */
function raporAlanlariniTamamla(a: AdayEgitmen, i: number): AdayEgitmen {
  const egitmenMi = a.surecDurumu === "egitmen" || a.surecDurumu === "pasif";
  return {
    ...a,
    tcKimlikNo: a.tcKimlikNo ?? String(10000000000 + ((Number(a.id) * 2654435761) % 89999999999)),
    altSozlesmeTipi: a.altSozlesmeTipi ?? (egitmenMi ? ornekAltSozlesmeTipi(a, i) : undefined),
    egitimBilgisi:
      a.egitimBilgisi ?? EGITIM_BILGISI_SECENEKLERI[i % EGITIM_BILGISI_SECENEKLERI.length],
    ihtarKayitlari:
      a.ihtarKayitlari ??
      (egitmenMi && i % 6 === 2
        ? [
            {
              id: `${a.id}-ihtar-1`,
              tarih: gunSonra(-40 - i),
              sebep: ORNEK_IHTAR_SEBEPLERI[i % ORNEK_IHTAR_SEBEPLERI.length],
              kaydeden: "Elif Su (İK)",
            },
            // Bazı ihtarlar KM tarafından girilmiş ve İK onayı bekliyor (PRD 11.4).
            ...(a.surecDurumu === "egitmen" && i % 4 === 0
              ? [
                  {
                    id: `${a.id}-ihtar-2`,
                    tarih: gunSonra(-3),
                    sebep: ORNEK_IHTAR_SEBEPLERI[(i + 1) % ORNEK_IHTAR_SEBEPLERI.length],
                    kaydeden: "Mert Aydın (Kulüp Müdürü)",
                    onaylandi: false,
                  },
                ]
              : []),
          ]
        : undefined),
    artiBirKullanimlari:
      a.artiBirKullanimlari ??
      (a.surecDurumu === "egitmen" && i % 4 === 1
        ? Array.from({ length: 1 + (i % 3) }, (_, j) => ({
            uyeId: String(700000 + i * 37 + j * 11),
            uyeAdi: ORNEK_UYE_ADLARI[(i + j) % ORNEK_UYE_ADLARI.length],
          }))
        : undefined),
  };
}

export const adayEgitmenler: AdayEgitmen[] = adlariTeklestir(
  tumAdaylar
    .map(kaydiTutarliHaleGetir)
    // Onaylı Fitness kademe belgesi olmayan kimse sistemde yer almaz.
    .filter((a) => /Kademe belgem var/.test(a.federasyonKademeDurumu ?? ""))
    .map(sertifikalariTamamla)
    .map(raporAlanlariniTamamla),
  SOYADLAR
);
