 const city = "Cairo";
  const country = "EG";
  const method = 5;
  const prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
  const ayat = [
    { text: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي", ref: "سورة طه: 14" },
    { text: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ", ref: "سورة العنكبوت: 45" },
    { text: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ * الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ", ref: "سورة المؤمنون: 1-2" },
    { text: "وَالَّذِينَ هُمْ عَلَىٰ صَلَوَاتِهِمْ يُحَافِظُونَ", ref: "سورة المعارج: 34" },
    { text: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ", ref: "سورة البقرة: 238" },
    { text: "الصلاة عماد الدين، من أقامها فقد أقام الدين، ومن هدمها فقد هدم الدين", ref: "حديث شريف" },
    { text: "بين الرجل وبين الشرك والكفر ترك الصلاة", ref: "رواه مسلم" },
    { text: "أول ما يحاسب عليه العبد يوم القيامة الصلاة، فإن صلحت صلح سائر عمله", ref: "رواه الطبراني" },
    { text: "من حافظ عليها كانت له نورًا وبرهانًا ونجاة يوم القيامة", ref: "رواه أحمد" },
    { text: "ليس بين العبد والجنة إلا الصلاة", ref: "حديث شريف" }
  ];

  const heatmap = document.getElementById("heatmap");
  const tooltip = document.getElementById("tooltip");
  const monthsHeader = document.getElementById("monthsHeader");
  const prayerTimeInfo = document.getElementById("prayerTimeInfo");
  const year = new Date().getFullYear();
  
  document.getElementById("currentYear").textContent = year;

  let userName = localStorage.getItem("userName");
  if(!userName){
    userName = prompt("من فضلك أدخل اسمك 🙂");
    if(userName && userName.trim() !== ""){
      localStorage.setItem("userName", userName.trim());
    } else {
      userName = "ضيف";
    }
  }
  document.getElementById("welcomeText").textContent = `مرحبًا بك، ${userName} 🌸`;

  // متغيرات لتخزين أوقات الصلاة
  let prayerTimesToday = null;
  let prayerTimesTomorrow = null;
  let currentPrayerIndex = -1;
  let nextPrayerTime = null;

  // دالة لجلب أوقات الصلاة
  async function getPrayerTimes(date = null) {
    try {
      const targetDate = date || new Date();
      const dateStr = `${targetDate.getFullYear()}-${targetDate.getMonth()+1}-${targetDate.getDate()}`;
      const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${city}&country=${country}&method=${method}`;
      const res = await fetch(url);
      const data = await res.json();
      const timings = data.data.timings;
      return {
        "الفجر": timings.Fajr,
        "الظهر": timings.Dhuhr,
        "العصر": timings.Asr,
        "المغرب": timings.Maghrib,
        "العشاء": timings.Isha
      };
    } catch (error) {
      console.error("خطأ في جلب أوقات الصلاة:", error);
      return null;
    }
  }

  // تحويل وقت "HH:MM" إلى دقائق
  function timeStrToMinutes(timeStr) {
    if (!timeStr) return 0;
    timeStr = timeStr.replace(/[^0-9:]/g, "");
    let [hour, minute] = timeStr.split(":").map(Number);
    return hour * 60 + minute;
  }

  // تحويل الدقائق إلى نص "HH:MM"
  function minutesToTimeStr(minutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // تحديد الصلاة الحالية والصلوات القادمة
  function determineCurrentPrayer(prayerTimes) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    // أوقات الصلوات بالدقائق
    const fajrTime = timeStrToMinutes(prayerTimes["الفجر"]);
    const dhuhrTime = timeStrToMinutes(prayerTimes["الظهر"]);
    const asrTime = timeStrToMinutes(prayerTimes["العصر"]);
    const maghribTime = timeStrToMinutes(prayerTimes["المغرب"]);
    const ishaTime = timeStrToMinutes(prayerTimes["العشاء"]);
    
    // تحديد الصلاة الحالية
    if (nowMinutes >= fajrTime && nowMinutes < dhuhrTime) {
      return { index: 0, name: "الفجر", nextIndex: 1, nextName: "الظهر", nextTime: dhuhrTime };
    } else if (nowMinutes >= dhuhrTime && nowMinutes < asrTime) {
      return { index: 1, name: "الظهر", nextIndex: 2, nextName: "العصر", nextTime: asrTime };
    } else if (nowMinutes >= asrTime && nowMinutes < maghribTime) {
      return { index: 2, name: "العصر", nextIndex: 3, nextName: "المغرب", nextTime: maghribTime };
    } else if (nowMinutes >= maghribTime && nowMinutes < ishaTime) {
      return { index: 3, name: "المغرب", nextIndex: 4, nextName: "العشاء", nextTime: ishaTime };
    } else if (nowMinutes >= ishaTime || nowMinutes < fajrTime) {
      // إذا كان بعد العشاء أو قبل الفجر
      if (nowMinutes >= ishaTime) {
        // بعد العشاء، الصلاة القادمة هي الفجر في اليوم التالي
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { 
          index: 4, 
          name: "العشاء", 
          nextIndex: 0, 
          nextName: "الفجر", 
          nextTime: fajrTime + 24*60, // فجر اليوم التالي
          isNextDay: true 
        };
      } else {
        // قبل الفجر
        return { index: -1, name: "قبل الفجر", nextIndex: 0, nextName: "الفجر", nextTime: fajrTime };
      }
    }
    
    return { index: -1, name: "لا توجد صلاة حالية", nextIndex: 0, nextName: "الفجر", nextTime: fajrTime };
  }

  // تحديث معلومات الصلاة الحالية
  async function updatePrayerInfo() {
    if (!prayerTimesToday) {
      prayerTimesToday = await getPrayerTimes();
    }
    
    if (!prayerTimesToday) {
      prayerTimeInfo.innerHTML = "⚠️ تعذر جلب أوقات الصلاة";
      return;
    }
    
    const currentPrayer = determineCurrentPrayer(prayerTimesToday);
    currentPrayerIndex = currentPrayer.index;
    
    let infoHTML = "";
    
    if (currentPrayer.index >= 0) {
      const remainingTime = currentPrayer.nextTime - (new Date().getHours() * 60 + new Date().getMinutes());
      const remainingHours = Math.floor(remainingTime / 60);
      const remainingMinutes = remainingTime % 60;
      
      infoHTML = `
        <span class="current-prayer">🕌 الصلاة الحالية: ${currentPrayer.name}</span><br>
        ⏳ الوقت المتبقي للصلاة التالية (${currentPrayer.nextName}): 
        ${remainingHours > 0 ? remainingHours + " ساعة و " : ""}${remainingMinutes} دقيقة
      `;
    } else if (currentPrayer.index === -1 && currentPrayer.name === "قبل الفجر") {
      infoHTML = `
        <span class="current-prayer">🌙 قبل وقت الفجر</span><br>
        ⏰ الصلاة القادمة: الفجر الساعة ${prayerTimesToday["الفجر"]}
      `;
    }
    
    prayerTimeInfo.innerHTML = infoHTML;
    
    // تحديث كل 30 ثانية
    setTimeout(updatePrayerInfo, 30000);
  }

  // =========== تسجيل الصلاة حسب الوقت الحقيقي ===========
  async function recordPrayer(dateKeyLocal) {
    const now = new Date();
    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];
    
    // 1. منع التسجيل في أيام مستقبلية
    if (dateKeyLocal > todayKey) {
      alert("⛔ لا يمكن تسجيل صلوات لأيام مستقبلية!");
      return;
    }
    
    // 2. منع التسجيل في أيام ماضية (عدا اليوم)
    if (dateKeyLocal < todayKey) {
      alert("⛔ لا يمكن تعديل أيام ماضية! يمكنك فقط تسجيل صلوات اليوم.");
      return;
    }
    
    // 3. جلب أوقات الصلاة إذا لم تكن موجودة
    if (!prayerTimesToday) {
      prayerTimesToday = await getPrayerTimes();
      if (!prayerTimesToday) {
        alert("⚠️ تعذر جلب أوقات الصلاة. حاول مرة أخرى.");
        return;
      }
    }
    
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let currentLevel = parseInt(localStorage.getItem(todayKey) || 0);
    
    // تحديد الصلاة الحالية بناءً على الوقت
    const currentPrayer = determineCurrentPrayer(prayerTimesToday);
    
    // 4. التحقق إذا كانت الصلاة الحالية قد انتهى وقتها
    const prayerTimes = [
      timeStrToMinutes(prayerTimesToday["الفجر"]),
      timeStrToMinutes(prayerTimesToday["الظهر"]),
      timeStrToMinutes(prayerTimesToday["العصر"]),
      timeStrToMinutes(prayerTimesToday["المغرب"]),
      timeStrToMinutes(prayerTimesToday["العشاء"])
    ];
    
    // إذا لم تبدأ الصلاة بعد (مستقبلية)
    if (currentPrayer.index < 0) {
      alert("⏳ لم يحن وقت أي صلاة بعد. الصلاة القادمة: الفجر");
      return;
    }
    
    // 5. التحقق إذا كان المستخدم قد سجل هذه الصلاة بالفعل
    if (currentLevel > currentPrayer.index) {
      alert(`✔️ لقد سجلت صلاة ${currentPrayer.name} بالفعل.`);
      return;
    }
    
    // 6. التحقق إذا كان الوقت قد تجاوز الصلاة السابقة ولم يسجلها
    for (let i = 0; i < currentPrayer.index; i++) {
      if (currentLevel <= i && nowMinutes > prayerTimes[i]) {
        const prayerName = prayers[i];
        alert(`⚠️ فاتتك صلاة ${prayerName}! يجب عليك قضاؤها.\n\nيمكنك تسجيل الصلاة الحالية فقط.`);
        // break;
      }
    }
    
    // 7. تسجيل الصلاة الحالية فقط
    const newLevel = currentPrayer.index + 1;
    localStorage.setItem(todayKey, newLevel);
    renderCell(todayKey, newLevel);
    
    // 8. عرض آية إذا أكمل اليوم
    if (newLevel === 5) {
      const ayah = ayat[Math.floor(Math.random() * ayat.length)];
      document.getElementById("overlayText").textContent = `"${ayah.text}"`;
      document.getElementById("overlayRef").textContent = ayah.ref;
      document.getElementById("overlayAyah").style.display = "flex";
    }
    
    // 9. عرض إشعار النجاح
    tooltip.style.opacity = 1;
    const timeString = now.toLocaleTimeString("ar-EG", {hour: "2-digit", minute: "2-digit"});
    tooltip.innerHTML = `<strong>تم تسجيل صلاة ${currentPrayer.name}</strong><br>🕒 ${timeString}<br>الصلوات المسجلة: ${newLevel}/5`;
    
    // 10. تحديث الإحصائيات
    updateStats();
    updatePrayerStatus();
    
    // إخفاء الـ tooltip بعد 3 ثواني
    setTimeout(() => {
      tooltip.style.opacity = 0;
    }, 3000);
  }

  // تحديث حالة الصلوات اليوم
  function updatePrayerStatus() {
    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];
    const level = parseInt(localStorage.getItem(todayKey) || 0);
    
    let statusText = "";
    if (level === 0) {
      statusText = "لم تسجل أي صلاة اليوم";
    } else if (level === 5) {
      statusText = "🎉 مبروك! أكملت جميع الصلوات اليوم";
    } else {
      const nextPrayer = prayers[level];
      statusText = `✔️ سجلت ${level} صلاة/صلوات اليوم - الصلاة التالية: ${nextPrayer}`;
    }
    
    document.getElementById("lastPrayerInfo").textContent = statusText;
  }

  const months = [
    { name: "يناير", days: 31 },
    { name: "فبراير", days: (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28 },
    { name: "مارس", days: 31 },
    { name: "أبريل", days: 30 },
    { name: "مايو", days: 31 },
    { name: "يونيو", days: 30 },
    { name: "يوليو", days: 31 },
    { name: "أغسطس", days: 31 },
    { name: "سبتمبر", days: 30 },
    { name: "أكتوبر", days: 31 },
    { name: "نوفمبر", days: 30 },
    { name: "ديسمبر", days: 31 }
  ];

  let currentDate = new Date();
  let weekColumns = [];
  let currentWeek = [];
  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  // بناء الهيدر الخاص بالشهور
  let totalDays = 0;
  months.forEach((month, index) => {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month-label";
    if (index > 0) monthDiv.classList.add("month-separator");
    monthDiv.textContent = month.name;
    monthDiv.style.width = `${(month.days / 7) * 18 + (month.days / 7 - 1) * 4}px`;
    monthsHeader.appendChild(monthDiv);
    
    if (index > 0) {
      const divider = document.createElement("div");
      divider.className = "month-divider";
      divider.style.left = `${totalDays * 22 - 2}px`;
      document.querySelector(".heatmap-wrapper").appendChild(divider);
    }
    
    totalDays += month.days;
  });

  // حساب بداية اليوم الأول من السنة
  let startDay = currentDate.getDay()+1;
  let startOffset = (startDay === 6) ? 0 : startDay + 1;

  // إضافة أيام فارغة في بداية الأسبوع الأول
  for(let i = 0; i < startOffset; i++){
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty-day";
    currentWeek.push(emptyCell);
  }

  // بناء الـ heatmap مع تصنيف الأيام
  months.forEach((month, mIndex) => {
    for(let day = 1; day <= month.days; day++){
      const cell = document.createElement("div");
      const dateKey = currentDate.toISOString().split("T")[0];
      let level = parseInt(localStorage.getItem(dateKey) || 0);
      
      // تحديد نوع اليوم
      if (dateKey > todayDateStr) {
        // يوم مستقبلي - غير قابل للنقر
        cell.className = "day future-day";
        cell.title = "يوم مستقبلي - غير متاح للتسجيل";
      } else if (dateKey < todayDateStr) {
        // يوم ماضي - للعرض فقط
        cell.className = "day past-day";
        renderCell(dateKey, level, cell);
        cell.addEventListener("click", () => {
          alert("⛔ لا يمكن تعديل أيام ماضية!\n\nيمكنك فقط تسجيل صلوات اليوم الحالي.");
        });
      } else {
        // اليوم الحالي - قابل للتسجيل
        cell.className = "day today-active";
        renderCell(dateKey, level, cell);
        cell.addEventListener("click", () => recordPrayer(dateKey));
        cell.classList.add("today");
      }
      
      cell.dataset.date = dateKey;
      
      // إضافة tooltip
      cell.addEventListener("mouseenter", (e)=>{
        const level = parseInt(localStorage.getItem(dateKey)||0);
        tooltip.style.opacity = 1;
        const date = new Date(dateKey);
        const dayName = date.toLocaleDateString("ar-EG", {weekday:'long'});
        const dayNum = date.toLocaleDateString("ar-EG", {day:'numeric'});
        const monthName = date.toLocaleDateString("ar-EG", {month:'long'});
        
        let prayerText = "";
        if(level === 0) prayerText = "لا توجد صلوات مسجلة";
        else if(level === 1) prayerText = "صلاة واحدة";
        else if(level === 2) prayerText = "صلاتان";
        else if(level === 3) prayerText = "3 صلوات";
        else if(level === 4) prayerText = "4 صلوات";
        else if(level === 5) prayerText = "5 صلوات ✓";
        
        tooltip.innerHTML = `<strong>${dayName} ${dayNum} ${monthName}</strong><br>${prayerText}`;
        
        // تحديد موقع الـ tooltip
        const rect = e.target.getBoundingClientRect();
        const tooltipWidth = 220;
        
        let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top - 100;
        
        // إذا كان قريب من الأعلى، نضعه أسفل العنصر
        if (top < 20) {
          top = rect.bottom + 10;
        }
        
        // إذا كان قريب من اليمين، نضبطه
        if (left + tooltipWidth > window.innerWidth) {
          left = window.innerWidth - tooltipWidth - 10;
        }
        
        // إذا كان قريب من اليسار، نضبطه
        if (left < 10) {
          left = 10;
        }
        
        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
      });
      
      cell.addEventListener("mousemove", (e)=>{
        const rect = e.target.getBoundingClientRect();
        const tooltipWidth = 220;
        
        let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        let top = rect.top - 100;
        
        if (top < 20) {
          top = rect.bottom + 10;
        }
        
        if (left + tooltipWidth > window.innerWidth) {
          left = window.innerWidth - tooltipWidth - 10;
        }
        
        if (left < 10) {
          left = 10;
        }
        
        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
      });
      
      cell.addEventListener("mouseleave", ()=>{
        tooltip.style.opacity = 0;
      });
      
      currentWeek.push(cell);
      
      if(currentWeek.length === 7){
        weekColumns.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  // إضافة أيام فارغة في نهاية الأسبوع الأخير
  if(currentWeek.length > 0){
    while(currentWeek.length < 7){
      const emptyCell = document.createElement("div");
      emptyCell.className = "day empty-day";
      currentWeek.push(emptyCell);
    }
    weekColumns.push(currentWeek);
  }

  // إضافة الأعمدة إلى heatmap
  weekColumns.forEach(week => {
    const weekCol = document.createElement("div");
    weekCol.className = "week-column";
    week.forEach(day => weekCol.appendChild(day));
    heatmap.appendChild(weekCol);
  });

  function renderCell(dateKey, level, cell=null){
    if(!cell){
      cell = [...document.querySelectorAll(".day")].find(c=>c.dataset.date===dateKey);
    }
    if(!cell) return;
    
    cell.classList.remove("l1", "l2", "l3", "l4", "l5");
    
    if(level > 0) {
      cell.classList.add("l"+level);
    }
  }

  function updateStats() {
    let totalPrayers = 0;
    let perfectDays = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    let checkDate = new Date(`${year}-01-01`);
    
    while(checkDate <= today){
      const dateKey = checkDate.toISOString().split("T")[0];
      const level = parseInt(localStorage.getItem(dateKey) || 0);
      totalPrayers += level;
      
      if(level === 5){
        perfectDays++;
        tempStreak++;
        currentStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      
      checkDate.setDate(checkDate.getDate()+1);
    }
    
    document.getElementById('totalPrayers').textContent = totalPrayers;
    document.getElementById('perfectDays').textContent = perfectDays;
    document.getElementById('currentStreak').textContent = currentStreak;
  }

  function resetData(){
    if(confirm("هل أنت متأكد من مسح جميع البيانات؟\n\n⚠️ سيتم حذف جميع سجلات الصلوات ولا يمكن استعادتها.")){
      localStorage.clear();
      location.reload();
    }
  }

  function closeOverlay() {
    document.getElementById("overlayAyah").style.display = "none";
  }

  // تهيئة التطبيق
  async function initializeApp() {
    // جلب أوقات الصلاة
    prayerTimesToday = await getPrayerTimes();
    
    // تحديث المعلومات
    updateStats();
    updatePrayerStatus();
    if (prayerTimesToday) {
      updatePrayerInfo();
    }
    
    // تحديث حالة الصلوات كل 5 دقائق
    setInterval(updatePrayerStatus, 5 * 60 * 1000);
  }

  // تشغيل التطبيق
  initializeApp();