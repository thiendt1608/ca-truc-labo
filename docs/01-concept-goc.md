# Concept: Game Web mô phỏng Kỹ thuật Xét nghiệm Y học

## 1. Bối cảnh và trend

Ý tưởng này khá có cửa, thậm chí về mặt concept còn có một lợi thế mà các game kiểu “Tiệm Trà Nhỏ / Tiệm Mì Cay / Bán bánh mì” không có: **ngành Xét nghiệm Y học có sẵn một hệ thống quy trình, kiến thức và rất nhiều tình huống để biến thành gameplay**.

Trong khoảng cuối tháng 9/2026, hàng loạt game mô phỏng nghề nghiệp đời thường như mở quán trà sữa, bán xôi, bánh mì, cá viên chiên, spa thú cưng, logistics… đang được chia sẻ mạnh trên Threads/TikTok/Facebook. Điểm chung là chúng đều là **game rất đơn giản, vào thẳng gameplay, chơi trên trình duyệt và đặc biệt hợp điện thoại**.

Riêng **Tiệm Trà Nhỏ** có website chơi trực tiếp trên browser, hỗ trợ điện thoại và máy tính, không cần cài app.

Sức hút của những game này không nằm ở gameplay sâu kiểu Genshin hay PUBG. Nó là cảm giác:

> “Một công việc rất bình thường ngoài đời → được biến thành một mini game → chơi 5–10 phút → thấy vừa quen vừa hài.”

Đó chính xác là thứ có thể áp vào **phòng xét nghiệm**.

---

# 2. Tại sao Xét nghiệm Y học lại hợp để làm game?

Bản thân nghề này đã có cấu trúc gameplay rất rõ.

WHO mô tả quy trình chính của phòng xét nghiệm thành 3 giai đoạn:

**Pre-analytical → Analytical → Post-analytical**

Tức là từ lúc mẫu được lấy/tiếp nhận/xử lý → thực hiện xét nghiệm → xác nhận và trả kết quả.

Ngoài ra, WHO có bộ tài liệu đào tạo về:

- Sample management
- Sample collection
- Sample rejection
- Transport/storage
- Quality control
- Westgard rules
- Information management
- Laboratory organization

Nói cách khác, game designer không cần phải tự bịa gameplay từ số 0. Quy trình nghề nghiệp đã có sẵn rất nhiều thứ có thể chuyển thành mechanics.

Chương trình Medical Laboratory Technology cũng bao gồm nhiều mảng như:

- Phlebotomy
- Microbiology
- Urinalysis
- Clinical chemistry
- Immunohematology
- Hematology
- Hemostasis
- Mycology/parasitology
- Immunology/infectious serology
- Clinical practice

Ở Việt Nam, chương trình Kỹ thuật Xét nghiệm Y học của Đại học Y Dược TP.HCM cũng có chương trình đào tạo riêng và được cập nhật từ năm học 2023–2024.

=> **Nguồn kiến thức để làm game là dư.**

Thậm chí cái nguy hiểm lại là **có quá nhiều kiến thức**, dễ làm game thành app học bài chứ không còn là game.

---

# 3. Không nên làm game theo kiểu “học Xét nghiệm”

Không nên biến game thành dạng:

> “Chọn xét nghiệm phù hợp với bệnh nhân → đọc kết quả → chẩn đoán bệnh.”

Cách này rất dễ biến game thành quiz y khoa.

Hướng phù hợp hơn là:

# **“Một ngày làm kỹ thuật viên xét nghiệm”**

Người chơi vào vai một nhân viên mới trong laboratory.

Mỗi ngày là một ca làm.

Ví dụ:

> **07:30 — Ca sáng bắt đầu**
>
> Có 12 mẫu đang chờ xử lý.

**Mẫu #001**
- CBC
- Hb
- Hct
- WBC
- PLT

**Mẫu #002**
- Glucose
- AST
- ALT
- Creatinine

**Mẫu #003**
- Urinalysis

Và người chơi phải thực sự xử lý chúng.

---

# 4. Gameplay loop

Core loop có thể là:

**Nhận mẫu → kiểm tra mẫu → chuẩn bị → chạy xét nghiệm → QC → xử lý kết quả → trả kết quả → nhận tiền/XP → nâng cấp labo**

Nó rất giống các game bán hàng:

**Nhận order → pha chế → giao → nhận tiền → nâng cấp quán**

Chỉ khác là:

**Order = mẫu bệnh phẩm**

**Pha chế = quy trình xét nghiệm**

---

# 5. Ví dụ gameplay thực tế

## 🧪 Mẫu máu — CBC

Game đưa cho người chơi:

> **Bệnh nhân A**  
> **Xét nghiệm: CBC**

Màn hình hiện một số tube.

Người chơi phải chọn đúng tube/mẫu tương ứng với xét nghiệm.

### Step 1 — Sample check

Game đưa ra các tình huống:

- Mẫu bị đông?
- Thể tích không đủ?
- Nhãn mẫu sai?
- Mẫu bị tan huyết?
- Mẫu không đúng loại?

Người chơi chọn:

**Accept / Reject**

Đây chính là gameplay lấy từ phần sample management và quality management.

---

## Step 2 — Processing

Ví dụ:

**Ly tâm → lấy plasma/serum → đưa vào analyzer**

Người chơi phải thao tác.

Có thể làm theo kiểu mini-game:

- Kéo tube vào centrifuge
- Chọn chế độ
- Start
- Chờ
- Lấy mẫu ra

Không cần mô phỏng vật lý phức tạp.

Chỉ cần:

**đúng / sai + timing + accuracy**

---

# 6. Mechanic QC — một điểm khác biệt rất mạnh

Đây là một trong những phần có thể khiến game khác hoàn toàn các game bán hàng.

Ví dụ:

> Analyzer hôm nay chạy QC.

Có 3 mức:

- Control Low
- Normal
- High

Người chơi xem biểu đồ QC.

Sau vài ngày:

> 🔴 **QC bất thường**

Game hỏi:

> “Có tiếp tục chạy mẫu bệnh nhân không?”

Các lựa chọn:

- A. Chạy luôn
- B. Kiểm tra QC
- C. Bỏ qua cảnh báo
- D. Tắt analyzer

Nếu chọn sai:

> ⚠️ 7 mẫu bệnh nhân bị ảnh hưởng.

WHO có training content về quantitative QC và Westgard multirule system, nên đây không phải gameplay bịa ra.

---

# 7. Random events — nơi gameplay có thể trở nên vui và viral

Game có thể có **random events**.

### 08:12

> 🔔 **CẤP CỨU**
>
> Khoa Cấp cứu gửi 5 mẫu STAT.

Timer bắt đầu.

### 09:21

> 🔔 **Mẫu bị hemolysis**

M phải quyết định:

> Reject hay tiếp tục?

### 10:05

> 🔔 **Analyzer báo lỗi**

Có 15 mẫu đang chờ.

M phải xử lý.

### 11:40

> 🔔 **Bác sĩ gọi hỏi kết quả**

Nhưng mẫu chưa hoàn thành.

### 13:15

> 🔔 **QC ngoài khoảng kiểm soát**

Tất cả mẫu bị pause.

Điều này tạo cảm giác:

> **“Ủa tưởng làm xét nghiệm chill lắm?”**

Nó cũng phù hợp với trend mô phỏng công việc thật: biến một công việc đời thường thành các tình huống nhỏ, gây stress hoặc hài hước.

---

# 8. Chia game thành từng Department

Đây là thứ giúp game có progression và sống lâu hơn.

## 🩸 Hematology Lab

Có thể unlock:

- CBC
- RBC
- WBC
- PLT
- Hb
- Hct
- Blood smear
- Coagulation

Gameplay:

**CBC analyzer + microscope mini-game**

---

## 🧪 Clinical Chemistry

Có thể unlock:

- Glucose
- Urea
- Creatinine
- AST
- ALT
- Bilirubin
- Lipid profile

Gameplay:

**Sample → reagent → analyzer → QC → result**

Đây là một trong những department dễ làm nhất.

---

## 🚽 Urinalysis

Gameplay:

**Nhận mẫu nước tiểu → physical exam → strip → đọc màu → microscopy**

Có thể làm UI rất trực quan, thậm chí khá cute.

---

## 🦠 Microbiology

Mảng này có rất nhiều game mechanics:

**Sample → culture → incubation → colony → Gram stain → microscope → identification**

Người chơi có thể:

- Kéo colony vào microscope
- Quan sát
- Phân loại Gram + / Gram -
- Mở dần các level/technique mới

---

## 🧬 Molecular Lab

Có thể để ở late-game:

**DNA extraction → PCR → electrophoresis / molecular testing**

Nhìn rất “tech” và tạo cảm giác progression mạnh.

---

## 🩸 Blood Bank / Transfusion

Phần này thậm chí có thể thành một game mode riêng:

- Blood grouping
- Crossmatch
- Compatibility
- Inventory

Quản lý inventory máu cũng rất hợp với gameplay management.

---

# 9. Mechanic “Sample Routing”

Đây có thể trở thành mechanic đặc trưng của game.

Một lúc game ném vào người chơi rất nhiều mẫu:

**20 mẫu**

Người chơi phải nhanh chóng routing:

```text
Sample
  │
  ├── CBC ─────────→ Hematology
  │
  ├── Glucose ─────→ Chemistry
  │
  ├── Urine ───────→ Urinalysis
  │
  ├── Culture ─────→ Microbiology
  │
  └── PCR ─────────→ Molecular
```

Giống một sorting game.

Ban đầu:

> 5 mẫu / ngày

Sau đó:

> 30 mẫu

Sau đó:

> 100 mẫu

Cuối game:

> **Hospital Rush Hour**

Có 80 mẫu cùng lúc.

Người chơi phải quản lý workflow.

Đây là chỗ biến kiến thức chuyên môn thành **gameplay thực sự**, thay vì quiz.

---

# 10. Hệ thống Lab Reputation

Mỗi ngày cuối ca có thể hiển thị báo cáo:

```text
━━━━━━━━━━━━━━━━━━━
       DAILY REPORT
━━━━━━━━━━━━━━━━━━━

Samples processed: 47

Accuracy             ⭐⭐⭐⭐⭐
Turnaround Time      ⭐⭐⭐⭐☆
Sample rejection     ⭐⭐⭐⭐⭐
QC performance       ⭐⭐⭐⭐⭐
Patient satisfaction  ⭐⭐⭐⭐☆

Revenue               $1,240
XP                    +850

Lab Reputation        74 → 79
━━━━━━━━━━━━━━━━━━━
```

Sau đó mở phần:

> **Upgrade Lab**

Người chơi có thể mua/nâng cấp:

- Centrifuge
- Microscope
- Hematology analyzer
- Chemistry analyzer
- Refrigerator
- Barcode printer
- LIS terminal
- Biosafety cabinet

Như vậy gameplay có thể tiến hóa từ:

**Technician Simulator**

→ **Laboratory Management Simulator**

---

# 11. Cây progression

Một cây progression đơn giản có thể như sau:

```text
                 🏥 HOSPITAL LAB
                       │
             ┌─────────┴─────────┐
             │                   │
       🩸 Hematology        🧪 Chemistry
             │                   │
        Coagulation         Immunoassay
             │                   │
             └─────────┬─────────┘
                       │
                 🦠 Microbiology
                       │
                 🧬 Molecular
                       │
                🏆 Master Lab
```

Mỗi department mở một gameplay mới.

---

# 12. “Ẩn” kiến thức trong gameplay

Không nhất thiết bắt người chơi đọc lý thuyết.

Ví dụ game đưa:

> **Sample #24**  
> Serum có màu bất thường.

Người chơi chọn:

**Accept / Reject**

Nếu sai:

> ❌ Wrong decision

Sau đó hiện giải thích ngắn:

> “Một số tình trạng của mẫu có thể ảnh hưởng đến kết quả xét nghiệm. Mẫu không đạt yêu cầu có thể cần được từ chối hoặc xử lý theo quy trình của labo.”

Như vậy người chơi **học mà không cảm thấy đang học**.

---

# 13. Có đủ kiến thức và dữ liệu để làm game không?

## Câu trả lời: Có, và còn khá dư.

Có thể xây database theo dạng:

```text
Department
    ↓
Test
    ↓
Specimen
    ↓
Requirements
    ↓
Procedure
    ↓
Possible Errors
    ↓
QC
    ↓
Result
    ↓
Case
```

Ví dụ:

```json
{
  "test": "CBC",
  "department": "hematology",
  "specimen": "blood",
  "steps": [
    "...",
    "...",
    "..."
  ],
  "possible_errors": [
    "...",
    "...",
    "..."
  ]
}
```

Mỗi patient/case chỉ là một configuration khác nhau.

---

# 14. Nguồn kiến thức nên sử dụng

Không nên tự bịa medical data.

Có thể xây knowledge base riêng cho game dựa trên:

- Giáo trình Xét nghiệm Y học
- Tài liệu đào tạo đại học
- WHO
- CLSI
- ISO 15189
- Tài liệu của bệnh viện/trường đại học
- Tài liệu IVD/manufacturer khi phù hợp

Cần đặc biệt chú ý **bản quyền và tính cập nhật**.

Các giá trị tham chiếu, quy trình cụ thể, loại tube, thời gian xử lý… không nên coi là những con số “đúng tuyệt đối” cho mọi labo. Một số thứ phụ thuộc phương pháp, thiết bị, manufacturer và SOP của từng nơi.

Ví dụ, chính thành phần của blood collection tube cũng có thể ảnh hưởng đến kết quả xét nghiệm và là nguồn của pre-analytical error.

Vì vậy game nên được định vị là:

> **Educational simulation**

chứ không quảng bá là:

> “Phần mềm mô phỏng bệnh viện chính xác 100%.”

---

# 15. Lợi thế rất lớn: có domain expert để validate

Nếu team có người học **Kỹ thuật Xét nghiệm Y học**, đây là một lợi thế rất lớn để kiểm tra gameplay và kiến thức.

Workflow phù hợp:

```text
Developer
   ↓
Xây gameplay
   ↓
Xét nghiệm student / domain expert
   ↓
Validate
   ↓
AI hỗ trợ generate case/content draft
   ↓
Expert review
   ↓
Developer đưa vào game
```

Cách này tốt hơn nhiều so với việc chỉ để developer và AI tự nghĩ kiến thức y khoa.

---

# 16. Định vị sản phẩm

Không nên đặt định vị là:

> **“Game học Xét nghiệm Y học”**

vì nghe như một sản phẩm EdTech.

Nên định vị là:

> **“Một game mô phỏng cuộc sống của kỹ thuật viên xét nghiệm.”**

Cái đầu tiên nghe như app học bài.

Cái thứ hai nghe như game.

---

# 17. Một số hướng tên game

## LAB LIFE

*Ca trực hôm nay có gì?*

---

## LAB SHIFT

*You handle the samples. We handle the chaos.*

---

## CA TRỰC LABO

Ví dụ flow truyền thông:

> **07:00 — Nhận ca**  
> **07:30 — Mẫu bắt đầu đổ về**  
> **08:15 — Analyzer lỗi**  
> **09:00 — STAT!!!**  
> **12:00 — Chưa được nghỉ**

Điểm “đời” và meme hóa này có thể tạo ra sức hút tốt.

---

# 18. MVP nên nhỏ

Không nên làm toàn bộ ngành Xét nghiệm ngay từ đầu.

MVP chỉ cần:

```text
🏥 Laboratory
      │
      ├── 🩸 Hematology
      │
      └── 🧪 Chemistry
```

Scope gợi ý:

- 20–30 case
- 5–10 loại sample
- 10–15 test
- 5–10 random events
- 1 hệ thống upgrade
- 1 daily score

Sau khi validate được retention/gameplay mới mở rộng:

> Urinalysis → Microbiology → Immunology → Blood Bank → Molecular

---

# 19. Vì sao Web App rất phù hợp?

Không cần Unity.

Không cần 3D.

Không cần app store.

Không cần native mobile app.

Có thể làm theo hướng:

```text
Next.js / React
      +
TypeScript
      +
PWA
      +
LocalStorage / IndexedDB
```

Định hướng:

**Mobile-first**

Người dùng thấy link trên TikTok/Threads:

> “Thử làm kỹ thuật viên xét nghiệm 1 ngày xem bạn sống được bao lâu.”

Bấm vào.

Chơi ngay.

Không login.

Không download.

Sau khi chơi xong:

```text
Your Lab Score: 83/100

Bạn đã xử lý 42 mẫu.
Bạn làm sai 3 mẫu.
QC cứu bạn 2 lần.
```

→ **Share kết quả lên Threads/TikTok.**

Đây có thể là viral loop chính.

---

# 20. Kết luận

Ý tưởng **game web mô phỏng Kỹ thuật Xét nghiệm Y học** rất phù hợp với format game casual mô phỏng nghề nghiệp đang được quan tâm ở Việt Nam.

Nó có đủ 3 yếu tố quan trọng:

### 1. Trend

Người chơi đang quan tâm tới các game mô phỏng nghề nghiệp/công việc đời thường trên web/mobile.

### 2. Content

Xét nghiệm Y học có rất nhiều quy trình, department, sample type, test, QC và tình huống thực tế để chuyển thành mechanics.

### 3. Gameplay

Quan trọng nhất, ngành này **không chỉ có kiến thức để làm quiz mà còn có workflow để làm simulator**.

Vì vậy hướng hấp dẫn nhất không phải là:

> **“Game dạy xét nghiệm.”**

mà là:

> **“Game mô phỏng một ngày làm kỹ thuật viên xét nghiệm, trong đó người chơi tình cờ học được kiến thức xét nghiệm.”**

Đây là một concept đáng làm prototype thật, chứ không chỉ là ý tưởng cho vui.

---

# 21. Sources / Tài liệu tham khảo

> Các nguồn dưới đây là những nguồn đã được dùng để hỗ trợ các nhận định trong phân tích ban đầu. Khi phát triển game thật, nên xây một bộ nguồn domain chính thức và review lại từng mechanic/knowledge item.

1. WHO / Laboratory Quality Management System training toolkit  
   https://extranet.who.int/hslp/content/LQMS-training-toolkit

2. WHO / Laboratory Quality Management  
   https://www.who.int/activities/laboratory-quality-management

3. Đại học Y Dược TP.HCM / Kỹ thuật Xét nghiệm Y học  
   https://ump.edu.vn/tuyen-sinh-dao-tao/dai-hoc/dao-tao/ky-thuat-xet-nghiem-y-hoc

4. Portland Community College / Medical Laboratory Technology curriculum  
   https://www.pcc.edu/ccog/mlt/

5. Tiệm Trà Nhỏ  
   https://tiemtranho.com/

6. CafeBiz / Bài viết về trend game mô phỏng nghề nghiệp trên mạng xã hội  
   https://cafebiz.vn/nguoi-ban-xoi-nguoi-mo-quan-tra-sua-nguoi-lam-spa-ai-thich-hack-nao-thi-lam-logistic-trao-luu-game-mo-phong-chong-gai-doi-that-khien-ca-mxh-me-man-toi-ngay-176260929164124018.chn

7. PMC / Blood collection tube & pre-analytical errors  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC3936985/

---

# 22. Một câu pitch ngắn cho concept

> **CA TRỰC LABO — game web mô phỏng một ngày làm kỹ thuật viên xét nghiệm: nhận mẫu, xử lý mẫu, chạy máy, cứu QC, xử lý sự cố và cố gắng sống sót qua ca trực.**
