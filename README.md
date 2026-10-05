# Themis — Eğitmen Yaşam Döngüsü Yönetimi (Prototip)

Themis; bir kişinin eğitmen adayı olarak eklendiği andan itibaren işe alım, akademi, eğitmenliğe geçiş, sertifika ve vize takibi, kulüp / sözleşme değişikliği, işten çıkış, eğitmen karnesi ve raporlama süreçlerinin tek yerden yönetildiği uygulamanın **tıklanabilir prototipidir**.

> Bu bir prototiptir: içindeki kişiler ve kayıtlar örnek (uydurma) veridir, gerçek sistemlere (Flyby, CMS) bağlı değildir. Yaptığınız işlemler sayfa yenilenince sıfırlanır.

---

## Bilgisayarınızda çalıştırma (adım adım)

Aşağıdaki adımları **bir kez** yapmanız yeterli. Toplam 10–15 dakika sürer. Teknik bilgi gerekmez.

### 1. Node.js'i kurun (bir kez)

Themis'in çalışması için bilgisayarınızda **Node.js** programı olmalıdır.

1. **https://nodejs.org** adresine gidin.
2. **"LTS"** yazan yeşil butona tıklayıp indirin (ör. *Node.js 22 LTS*).
3. İnen dosyayı açın ve kurulum ekranında **"Devam / Next"** diyerek kurulumu bitirin. Ayarları değiştirmenize gerek yok.

> Zaten kurulu olup olmadığından emin değilseniz 3. adımdaki terminalde `node -v` yazıp Enter'a basın. `v20` veya daha büyük bir sayı görüyorsanız kuruludur.

### 2. Themis dosyalarını indirin

1. Bu GitHub sayfasında sağ üstteki yeşil **"Code"** butonuna tıklayın.
2. Açılan menüden **"Download ZIP"** seçin.
3. İnen ZIP dosyasına çift tıklayarak açın. Çıkan klasörü kolay bulacağınız bir yere, örneğin **Masaüstü**'ne taşıyın.

### 3. Terminali açın

- **Mac:** `Cmd (⌘) + Boşluk` tuşlarına basın, **Terminal** yazın ve Enter'a basın.
- **Windows:** Başlat menüsüne **PowerShell** yazın ve açın.

Karşınıza yazı yazabileceğiniz bir pencere gelecek. Aşağıdaki komutları bu pencereye **yazıp (veya kopyalayıp yapıştırıp) Enter'a basarak** çalıştıracaksınız.

### 4. Terminalde Themis klasörüne geçin

1. Terminale `cd` yazın ve **bir boşluk** bırakın (henüz Enter'a basmayın).
2. 2. adımda açtığınız **Themis klasörünü fareyle sürükleyip terminal penceresinin içine bırakın.** Klasörün yolu otomatik yazılır.
3. Şimdi **Enter**'a basın.

Örnek (Mac):

```
cd /Users/adiniz/Desktop/themis-main
```

### 5. Gerekli paketleri yükleyin (bir kez)

Şu komutu yazıp Enter'a basın:

```
npm install
```

İnternetten gerekli dosyalar indirilecek; 1–3 dakika sürebilir. Bitince terminal yeniden komut beklemeye başlar. Ekranda sarı "warning" yazıları görürseniz sorun değildir.

### 6. Themis'i başlatın

```
npm run dev
```

Birkaç saniye sonra ekranda şuna benzer bir satır görünür:

```
▲ Next.js ...
- Local:   http://localhost:3000
```

### 7. Tarayıcıda açın

Tarayıcınızda (Chrome, Safari, Edge…) şu adrese gidin:

**http://localhost:3000**

Themis açılacaktır. İlk açılış 10–20 saniye sürebilir.

> ⚠️ Themis'i kullandığınız sürece **terminal penceresini kapatmayın.** Terminal kapanırsa uygulama da durur.

### Kapatmak için

Terminal penceresine tıklayıp **`Ctrl + C`** tuşlarına basın (Mac'te de `Ctrl`). Ardından pencereyi kapatabilirsiniz.

### Bir dahaki sefere açmak için

Kurulum adımlarını tekrar yapmanıza gerek yok. Sadece:

1. Terminali açın (3. adım),
2. Themis klasörüne geçin (4. adım),
3. `npm run dev` yazın (6. adım),
4. Tarayıcıda **http://localhost:3000** adresini açın.

---

## Prototipi kullanırken bilmeniz gerekenler

- **Rol değiştirme:** Uygulama **İK** rolüyle açılır. Sağ üstteki isme tıklayarak **Kulüp Müdürü** veya **Sistem Yöneticisi** görünümüne geçebilirsiniz. Bazı ekranlar (Onay Talepleri, toplu işlemler, mülakat planlama) yalnızca İK'da görünür.
- **Veriler örnektir:** Yaklaşık 220 örnek kişi (aday, akademi eğitmeni, eğitmen, süreci biten) ve geçmiş akademiler yüklüdür.
- **Yaptığınız işlemler kaydedilmez:** Sayfayı yenilediğinizde (Mac: `Cmd + R`, Windows: `F5`) her şey başlangıç haline döner. Deneme yaparken bir şey bozulursa sayfayı yenilemeniz yeterlidir.

### Göz atabileceğiniz başlıca ekranlar

| Menü | Ne gösterir |
|---|---|
| **Aday Süreci → Eğitmenler** | Aday, akademi, aktif ve süreci biten herkes; özet kartlar filtre gibi çalışır. Bir kişiye tıklayınca profil ve **Sonraki Aksiyon** kartı açılır. |
| **Aday Süreci → Onay Talepleri** | Kulüp müdürlerinin gönderdiği belge, davet, sertifika, vize, temel eğitim ve ihtar onayları (İK). |
| **Akademi** | Akademi dönemleri, doluluk, yoklama ve sınav sonuçları. |
| **Eğitmen Karne** | Karneden çıkarılan / ligi sabitlenen eğitmenler, GX stüdyo sayıları, metrik limitleri. |
| **Toplu İşlemler** | Toplu aday ekleme, toplu mülakat sonucu, toplu sınav sonucu (Excel), toplu eğitmenliğe geçiş, toplu vizeletme. |
| **Raporlama** | Filtre ekleyip kolon seçerek esnek rapor oluşturma ve Excel indirme. |
| **Bildirimler** | Onay talepleri ve vize uyarıları (30 gün / 7 gün kala / bitiş günü). |

---

## Sorun giderme

**`npm: command not found` veya `'npm' tanınmıyor` hatası**
Node.js kurulmamış ya da kurulumdan sonra terminal yeniden açılmamış. 1. adımı yapın, terminali **kapatıp yeniden açın** ve tekrar deneyin.

**`cd` komutunda "No such file or directory" / "yol bulunamadı" hatası**
Klasör yolu yanlış yazılmış. 4. adımdaki gibi klasörü sürükleyip bırakmayı deneyin.

**`npm run dev` sonrası "Port 3000 is in use" uyarısı**
3000 numaralı adresi başka bir program kullanıyor. Şu komutla başka bir adreste açın ve tarayıcıda **http://localhost:3001** adresine gidin:

```
npm run dev -- -p 3001
```

**Sayfa açılmıyor / "This site can't be reached"**
Terminalde `npm run dev` komutunun hâlâ çalıştığından (pencerenin açık olduğundan) emin olun.

**`npm install` sırasında kırmızı hata**
İnternet bağlantınızı kontrol edip komutu tekrar çalıştırın. Sorun devam ederse terminaldeki hata mesajının ekran görüntüsünü ürün ekibine iletin.

---

## Geliştiriciler için

- Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
- Node.js **20.9 veya üzeri** gerekir.
- Komutlar: `npm run dev` (geliştirme), `npm run build` (derleme), `npm run lint` (kod kontrolü)
- Örnek veri: `src/lib/data.ts`, tutarlılık kuralları: `src/lib/veriTutarliligi.ts`
