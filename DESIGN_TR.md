## 1. Mimari ve Veri Modeli

### 1.1. Genel Mimari

- **AppModule**
  - `ConfigModule.forRoot({ isGlobal: true })` ile ortam değişkenlerinin yönetimi.
  - `MongooseModule.forRoot(process.env.MONGODB_URI)` ile MongoDB Atlas bağlantısı.
  - `TransactionsModule` import edilerek domain mantığı bu modüle ayrıldı.

- **TransactionsModule**
  - `TransactionsController`  
    - HTTP endpoint’leri:
      - `POST /transactions`
      - `GET /transactions`
      - `GET /transactions/:id`
      - `PATCH /transactions/:id/stage`
    - Sadece HTTP seviyesinde routing, DTO kullanımı ve cevap dönüşünden sorumlu.
  - `TransactionsService`  
    - Transaction oluşturma (`create`)
    - Tekil getirme (`getById`)
    - Listeleme (`list`)
    - Aşama güncelleme (`updateStage`)
    - Stage geçiş kuralları (`ALLOWED` state machine haritası)
    - `completed` aşamasında komisyon hesaplamayı tetikler.
  - `CommissionService`  
    - Toplam hizmet bedelini şirket ve agent’lar arasında bölme kuralını kapsar.
    - Şirket payı: %50
    - Agent payı: %50 → tek agent ise tamamı, iki agent ise eşit bölünür.
    - Commission kuralının ayrı bir serviste olması, bu politikanın bağımsız değiştirilebilmesini sağlar.
  - `Transaction` Mongoose şeması  
    - Mongo tarafındaki ana domain dokümanını temsil eder.

- **Cross-Cutting Yapılar**
  - `HttpExceptionFilter`
    - Tüm `HttpException` tiplerini yakalar.
    - Cevapları `BaseResponse` formatında standardize eder: `{ DATA, MESSAGE, STATUS_CODE, SUCCESS }`.
    - DTO’lardan gelen prefix’li validation mesajlarını olduğu gibi döndürür, diğer durumlarda `ResponseMessages` enum’una göre genel mesaj üretir.
  - `BaseResponse<T>`
    - Tüm API çıktıları için tek tip bir response gövdesi sağlar.
  - `ValidationMessages.enum` ve `ResponseMessages.enum`
    - Validation ve hata mesajlarını merkezi ve tip güvenli hale getirir.
    - DTO’lar ve servisler aynı mesaj üretim mekanizmasını paylaşır.

Bu yapı ile:
- Controller katmanı sade tutuldu (HTTP ve DTO odaklı).
- İş kuralları servis katmanında toplandı (`TransactionsService`, `CommissionService`).
- Hata formatı ve mesaj üretimi gibi yatay konular özel katmana taşındı.

### 1.2. MongoDB Veri Modeli

#### Transaction Dokümanı

`Transaction` şeması:

- `propertyId: ObjectId`
- `listingAgentId: ObjectId`
- `sellingAgentId: ObjectId`
- `totalServiceFee: number`
- `stage: 'agreement' | 'earnest_money' | 'title_deed' | 'completed'`
- `financialBreakdown: { company: number; agents: { agentId: ObjectId; amount: number; reason: string }[]; total: number } | null`
- `createdAt`, `updatedAt` (Mongoose `timestamps`)

**Stage Yönetimi**

- `stage` alanı:
  - Veri modelinde saklanıyor.
  - `ALLOWED` haritası ile iş kuralı olarak da kullanılıyor:
    - `agreement → earnest_money → title_deed → completed`
- `completed` aşamasına geçişte:
  - `CommissionService.calculate(...)` çağrılıyor.
  - Dönüş değeri `financialBreakdown` alanına yazılıyor.

**Financial Breakdown Yaklaşımı (Embedded)**

- Finansal kırılım doğrudan `Transaction` dokümanı içinde tutuluyor:
  - Tek sorguda hem işlem hem de “kim ne kadar aldı” bilgisi okunabiliyor.
  - Okuma tarafında ekstra join/aggregation ihtiyacını azaltıyor.

Bu yapı, case’in temel ihtiyacı olan:
- “Transaction yaşam döngüsü”
- “Komisyon dağılımı”
- “Tek transaction için şeffaf finansal görünürlük”

gereksinimlerini basit ve okunabilir bir şekilde karşılıyor.

### 1.3. Alternatifler ve Neden Tercih Edilmedi?

#### Alternatif 1: Ayrı `CommissionPayout` Koleksiyonu

- Örnek model:
  - `CommissionPayout { transactionId, agentId, role, amount, companyShare? }`
- Artıları:
  - Çok büyük raporlama senaryolarında (örneğin sadece agent bazlı raporlar) daha esnek.
  - Commission kayıtları bağımsız bir yaşam döngüsüne sahip olsaydı (iptal, düzeltme vb.), daha uygun bir yapı olabilirdi.
- Eksileri:
  - Tek bir transaction için finansal kırılımı görmek için ek sorgu/aggregation gerektirir.
  - Bu case’in kapsamı ve süresi için gereksiz karmaşıklık ekler.
- Bu yüzden, basitlik ve okunabilirlik adına **embedded breakdown** yaklaşımı tercih edildi.

#### Alternatif 2: Komisyonu Hiç Saklamayıp Her Okumada Dinamik Hesaplamak

- Yalnızca `totalServiceFee`, `listingAgentId`, `sellingAgentId` saklanır.
- Her `GET /transactions/:id` isteğinde komisyon yeniden hesaplanır.
- Artıları:
  - Komisyon oranları değişirse geçmiş veriyi migrate etmek gerekmez.
- Eksileri:
  - O transaction oluşturulurken geçerli olan gerçek kural setini ve sonucu kaybetmiş oluruz (audit zayıflar).
  - İndirim, kampanya, özel anlaşma gibi durumlarda “gerçekleşen” hesaplamayı izlemek zorlaşır.
- Bu yüzden, hesaplanmış breakdown’ı transaction’a yazmak, **izlenebilirlik** açısından daha güvenilir bulundu.

---

## 2. En Zor / En Riskli Kısım

### 2.1. Financial Breakdown’ı Transaction İçinde Tutmak

- **Risk**
  - Sistem büyüyüp çok sayıda transaction ve raporlama ihtiyacı oluşursa:
    - Transaction dokümanları şişebilir.
    - Bazı rapor sorguları için index ve performans optimizasyonu daha karmaşık hale gelebilir.
- **Riskin Yönetimi**
  - Komisyon hesaplama mantığı `CommissionService` içinde soyutlandı:
    - İleride breakdown’ı ayrı bir koleksiyona taşımak gerekirse, yalnızca bu servis ve `Transaction` şemasındaki `financialBreakdown` alanı güncellenecek.
  - `financialBreakdown` nullable bırakıldı, böylece gerektiğinde kademeli migrasyon yapılabilir.

### 2.2. Stage Geçişlerini Katı Bir State Machine ile Sınırlandırmak

- **Risk**
  - Gerçek hayatta bazen geri dönüşler veya manuel düzeltmeler gerekebilir:
    - Örneğin `title_deed` aşamasından tekrar `earnest_money` aşamasına dönme,
    - `completed` olmuş bir transaction üzerinde istisnai müdahale.
  - Şu anki `ALLOWED` tablosu sadece ileri yönlü geçişe izin veriyor.
- **Riskin Yönetimi**
  - Case’in tanımı “transaction sürecinin ideal, takip edilebilir akışı”na odaklandığı için:
    - Basit, ileri yönlü bir state machine tercih edildi.
  - Geçiş kuralları tek bir merkezde (`ALLOWED`) tutulduğu için:
    - İleride rollback/cancel gibi ek aşamalar ya da özel geçişler eklemek kolay.
    - Gerekirse bu yapı bir konfigürasyon tablosuna veya rule engine’e taşınabilir.

---

## 3. Gerçek Hayatta Devamı Ne Olur?

### 3.1. Auditing ve History

- Neden:
  - Emlak işlemlerinde “kim, ne zaman, hangi aşamaya aldı?” sorusu hukuki ve operasyonel açıdan kritik.
  - Şu an sadece son state saklanıyor.
- Geliştirme Fikri:
  - `TransactionHistory` dokümanı veya `Transaction` içinde embedded `history` alanı:
    - `{ stageFrom, stageTo, changedBy, changedAt, note }`
  - Her `updateStage` çağrısında otomatik olarak history kaydı oluşturmak.

### 3.2. Kimlik Doğrulama ve Yetkilendirme (Auth & RBAC)

- Neden:
  - Gerçek sistemde farklı roller olur: admin, danışman, muhasebe gibi.
  - Her rolün görebileceği/güncelleyebileceği transaction seti farklı olabilir.
- Geliştirme Fikri:
  - NestJS `AuthModule` (örneğin JWT tabanlı) eklenmesi.
  - Role-based guard’lar:
    - Bazı roller sadece okuma yapabilir.
    - Stage güncelleme ve komisyon görüntüleme yetkileri rol bazlı sınırlandırılabilir.

### 3.3. Esnek Kural Motoru (Rule Engine) ile Komisyon Politikası

- Neden:
  - Şu an sabit bir kural var: %50 şirket, %50 agent; aynı agent ise %50, iki farklı agent ise %25 + %25.
  - Gerçek dünyada kampanyalar, farklı portföy tipleri, özel anlaşmalar gibi istisnalar olabilir.
- Geliştirme Fikri:
  - Komisyon kurallarını konfigüre edilebilir hale getirmek:
    - Örneğin bir `CommissionRule` tablosu veya basit bir rule engine.
    - Property tipi, lokasyon, tarih aralığı gibi parametrelere göre oran belirlemek.
  - `CommissionService` bu kural motorunu kullanarak hesaplama yapar.

### 3.4. Raporlama ve Dashboard’lar

- Neden:
  - Yönetimsel ihtiyaçlar için:
    - Dönemsel ciro,
    - Agent bazlı performans,
    - Şirket/agent gelir oranları.
- Geliştirme Fikri:
  - Özel rapor endpoint’leri (`/reports/...`) eklemek.
  - Gerekirse bu endpoint’ler için projection, aggregation pipeline ve index optimizasyonu uygulamak.

### 3.5. Operasyonel İyileştirmeler

- Queue veya event-driven yapı:
  - Büyük hacimli işlemlerde stage geçişleri veya komisyon hesaplamasını async hale getirmek.
- Observability:
  - Yapılandırılmış logging,
  - Metrics (Prometheus / Grafana),
  - Health check ve readiness endpoint’leri ile daha sağlam prod ortamı.

