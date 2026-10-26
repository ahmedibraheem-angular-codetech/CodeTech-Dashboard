import type { LegalDocument } from '../models/legal-document.model';

const termsAr = `
<p>مرحبًا بك في موقع كود التقنية. باستخدامك للموقع أو أي من خدماتنا فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل المتابعة.</p>
<h3>01- قبول الشروط</h3>
<p>باستخدامك للموقع فإنك تقر بأنك قرأت هذه الشروط وفهمتها ووافقت عليها. إذا كنت لا توافق على أي بند منها، يرجى التوقف عن استخدام الموقع.</p>
<h3>02- استخدام الموقع</h3>
<div class="legal-doc__columns">
  <div>
    <h4>الاستخدام المسموح</h4>
    <ul>
      <li>التصفح والاطلاع على المحتوى المنشور</li>
      <li>التواصل معنا عبر النماذج المتاحة</li>
      <li>طلب الخدمات وفق القنوات الرسمية</li>
    </ul>
  </div>
  <div>
    <h4>الاستخدام غير المسموح</h4>
    <ul>
      <li>محاولة اختراق أو تعطيل الموقع</li>
      <li>إعادة نشر المحتوى دون إذن</li>
      <li>استخدام الموقع لأغراض غير مشروعة</li>
    </ul>
  </div>
</div>
<h3>03- الخدمات</h3>
<ul>
  <li>نقدم حلولًا رقمية وتصميم وتطوير مواقع وتطبيقات</li>
  <li>تفاصيل كل خدمة يتم الاتفاق عليها في عرض السعر أو العقد</li>
  <li>يحق لنا تحديث نطاق الخدمات أو إيقافها مع الإشعار المناسب</li>
</ul>
<h3>04- الملكية الفكرية</h3>
<p>جميع العلامات التجارية والنصوص والتصاميم والبرمجيات المعروضة على الموقع مملوكة لكود التقنية أو لمرخصيها، ولا يجوز نسخها أو استخدامها دون موافقة خطية مسبقة.</p>
<h3>05- الدفع والتعاقد</h3>
<p>تتم المدفوعات وفق الاتفاق التعاقدي. قد نطلب دفعة مقدمة قبل بدء العمل، ولا تُسترد المبالغ المدفوعة إلا وفق سياسة الإلغاء المتفق عليها.</p>
<h3>06- إخلاء المسؤولية</h3>
<p>نبذل جهدًا معقولًا لضمان دقة المحتوى، لكننا لا نضمن خلوه من الأخطاء أو انقطاع الخدمة. استخدامك للموقع يكون على مسؤوليتك.</p>
<h3>07- التعديلات على الشروط</h3>
<p>يحق لنا تحديث هذه الشروط في أي وقت. يسري التحديث من تاريخ نشره على الموقع، ويُعد استمرارك في الاستخدام موافقة على النسخة المحدّثة.</p>
<h3>08- القانون الواجب التطبيق</h3>
<p>تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتكون المحاكم المختصة في الرياض هي الجهة المختصة بالنظر في أي نزاع.</p>
<h3>09- للاستفسارات القانونية</h3>
<p class="legal-doc__contact"><i class="pi pi-envelope"></i> Legal@Code-Tech.sa</p>
<p class="legal-doc__contact"><i class="pi pi-phone"></i> +966 50 000 0000</p>
<p class="legal-doc__contact"><i class="pi pi-map-marker"></i> الرياض، المملكة العربية السعودية</p>
`.trim();

const termsEn = `
<p>Welcome to CodeTech. By using the website or any of our services you agree to these terms. Please read them carefully.</p>
<h3>01- Acceptance</h3>
<p>By using the site you confirm that you have read, understood, and agreed to these terms. If you disagree with any part, please stop using the site.</p>
<h3>02- Site use</h3>
<div class="legal-doc__columns">
  <div>
    <h4>Allowed use</h4>
    <ul>
      <li>Browse published content</li>
      <li>Contact us through available forms</li>
      <li>Request services via official channels</li>
    </ul>
  </div>
  <div>
    <h4>Prohibited use</h4>
    <ul>
      <li>Attempting to breach or disrupt the site</li>
      <li>Republishing content without permission</li>
      <li>Using the site for unlawful purposes</li>
    </ul>
  </div>
</div>
<h3>03- Services</h3>
<ul>
  <li>We provide digital solutions, design, and development</li>
  <li>Service details are agreed in a quote or contract</li>
  <li>We may update or pause services with reasonable notice</li>
</ul>
<h3>04- Intellectual property</h3>
<p>All trademarks, text, designs, and software on the site belong to CodeTech or its licensors and may not be used without prior written consent.</p>
<h3>05- Payment and contracts</h3>
<p>Payments follow the contract. An advance may be required before work starts. Paid amounts are refundable only under the agreed cancellation policy.</p>
<h3>06- Disclaimer</h3>
<p>We take reasonable care to keep content accurate, but we do not guarantee error-free content or uninterrupted service. Use of the site is at your own risk.</p>
<h3>07- Changes to terms</h3>
<p>We may update these terms at any time. Updates take effect when published, and continued use means you accept the updated version.</p>
<h3>08- Governing law</h3>
<p>These terms are governed by the laws of Saudi Arabia. Courts in Riyadh have jurisdiction over any dispute.</p>
<h3>09- Legal inquiries</h3>
<p class="legal-doc__contact"><i class="pi pi-envelope"></i> Legal@Code-Tech.sa</p>
<p class="legal-doc__contact"><i class="pi pi-phone"></i> +966 50 000 0000</p>
<p class="legal-doc__contact"><i class="pi pi-map-marker"></i> Riyadh, Saudi Arabia</p>
`.trim();

const privacyAr = `
<p>توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية بياناتك عند زيارة موقع كود التقنية أو استخدام خدماتنا.</p>
<h3>01- البيانات التي نجمعها</h3>
<p>قد نجمع بيانات الاتصال والبيانات التقنية اللازمة لتشغيل الموقع وتحسين التجربة، مثل الاسم والبريد وبيانات الجهاز وسجلات الاستخدام.</p>
<h3>02- كيف نستخدم البيانات</h3>
<ul>
  <li>الرد على الاستفسارات وطلبات الخدمات</li>
  <li>تحسين أداء الموقع وتجربة الاستخدام</li>
  <li>الامتثال للمتطلبات النظامية عند الاقتضاء</li>
</ul>
<h3>03- مشاركة البيانات</h3>
<p>لا نبيع بياناتك الشخصية. قد نشاركها مع مزودي خدمات موثوقين يساعدوننا في التشغيل، أو عند الالتزام بطلب نظامي.</p>
<h3>04- ملفات تعريف الارتباط</h3>
<p>نستخدم ملفات تعريف الارتباط لتحسين الأداء وتذكر تفضيلاتك. يمكنك إدارة إعدادات المتصفح للتحكم فيها.</p>
<h3>05- حماية البيانات</h3>
<p>نطبّق تدابير تقنية وتنظيمية معقولة لحماية بياناتك من الوصول غير المصرح به أو الفقدان أو التعديل.</p>
<h3>06- حقوقك</h3>
<p>يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها ضمن الحدود النظامية عبر قنوات التواصل أدناه.</p>
<h3>07- تحديث السياسة</h3>
<p>قد نحدّث هذه السياسة من وقت لآخر، ويُعد استمرار استخدام الموقع بعد التحديث موافقة على النسخة الجديدة.</p>
<h3>08- للتواصل بشأن الخصوصية</h3>
<p class="legal-doc__contact"><i class="pi pi-envelope"></i> privacy@codetech.sa</p>
<p class="legal-doc__contact"><i class="pi pi-phone"></i> +966 11 000 0000</p>
<p class="legal-doc__contact"><i class="pi pi-map-marker"></i> الرياض، المملكة العربية السعودية</p>
`.trim();

const privacyEn = `
<p>This privacy policy explains how CodeTech collects, uses, and protects your data when you visit our website or use our services.</p>
<h3>01- Data we collect</h3>
<p>We may collect contact and technical data needed to run the site and improve the experience, such as name, email, device data, and usage logs.</p>
<h3>02- How we use data</h3>
<ul>
  <li>Respond to inquiries and service requests</li>
  <li>Improve site performance and usability</li>
  <li>Meet legal requirements when needed</li>
</ul>
<h3>03- Sharing data</h3>
<p>We do not sell personal data. We may share it with trusted providers who help us operate, or when required by law.</p>
<h3>04- Cookies</h3>
<p>We use cookies to improve performance and remember preferences. You can manage them in your browser settings.</p>
<h3>05- Data protection</h3>
<p>We apply reasonable technical and organizational measures to protect your data from unauthorized access, loss, or alteration.</p>
<h3>06- Your rights</h3>
<p>You may request access, correction, or deletion of your data within legal limits through the contacts below.</p>
<h3>07- Policy updates</h3>
<p>We may update this policy from time to time. Continued use after an update means you accept the new version.</p>
<h3>08- Privacy contact</h3>
<p class="legal-doc__contact"><i class="pi pi-envelope"></i> privacy@codetech.sa</p>
<p class="legal-doc__contact"><i class="pi pi-phone"></i> +966 11 000 0000</p>
<p class="legal-doc__contact"><i class="pi pi-map-marker"></i> Riyadh, Saudi Arabia</p>
`.trim();

export const LEGAL_DOCUMENTS_SEED: LegalDocument[] = [
  {
    kind: 'terms',
    content: { ar: termsAr, en: termsEn },
    updatedAt: '2026-10-09',
  },
  {
    kind: 'privacy',
    content: { ar: privacyAr, en: privacyEn },
    updatedAt: '2026-10-09',
  },
];
