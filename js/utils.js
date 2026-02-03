/**
 * نظام تقييم الآلات والمعدات
 * ملف الدوال المساعدة (Utils)
 */

const Utils = {
    /**
     * توليد معرف فريد UUID
     */
    generateId: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * توليد رقم تقرير تسلسلي
     */
    generateReportNumber: function() {
        const settings = Storage.getSettings() || {};
        const prefix = settings.reportPrefix || 'RPT';
        const nextNumber = settings.nextReportNumber || 1;
        const year = new Date().getFullYear();
        
        // تحديث الرقم التالي
        settings.nextReportNumber = nextNumber + 1;
        Storage.saveSettings(settings);
        
        return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
    },

    /**
     * تنسيق التاريخ
     */
    formatDate: function(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const settings = Storage.getSettings() || {};
        const format = settings.dateFormat || 'DD/MM/YYYY';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        switch (format) {
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            default:
                return `${day}/${month}/${year}`;
        }
    },

    /**
     * تنسيق العملة
     */
    formatCurrency: function(amount, currency) {
        if (!amount && amount !== 0) return '-';
        
        const num = parseFloat(amount);
        if (isNaN(num)) return amount;
        
        currency = currency || 'SAR';
        const currencySymbols = {
            'SAR': 'ر.س',
            'USD': '$',
            'EUR': '€',
            'AED': 'د.إ'
        };
        
        const formatted = num.toLocaleString('ar-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        return `${formatted} ${currencySymbols[currency] || currency}`;
    },

    /**
     * تحويل الرقم إلى نص عربي
     */
    numberToArabicWords: function(number) {
        if (number === 0) return 'صفر';
        
        const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
        const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
        const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 
                       'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
        const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 
                          'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
        
        const num = Math.floor(Math.abs(number));
        const decimal = Math.round((Math.abs(number) - num) * 100);
        
        if (num === 0) {
            return decimal > 0 ? `${this.convertGroup(decimal)} هللة` : 'صفر';
        }
        
        let result = '';
        
        // الملايين
        const millions = Math.floor(num / 1000000);
        if (millions > 0) {
            if (millions === 1) result += 'مليون ';
            else if (millions === 2) result += 'مليونان ';
            else if (millions >= 3 && millions <= 10) result += ones[millions] + ' ملايين ';
            else result += this.convertGroup(millions) + ' مليون ';
        }
        
        // الآلاف
        const thousands = Math.floor((num % 1000000) / 1000);
        if (thousands > 0) {
            if (result) result += 'و';
            if (thousands === 1) result += 'ألف ';
            else if (thousands === 2) result += 'ألفان ';
            else if (thousands >= 3 && thousands <= 10) result += ones[thousands] + ' آلاف ';
            else result += this.convertGroup(thousands) + ' ألف ';
        }
        
        // المئات والعشرات والآحاد
        const remainder = num % 1000;
        if (remainder > 0) {
            if (result) result += 'و';
            result += this.convertGroup(remainder) + ' ';
        }
        
        // إضافة الهللات
        if (decimal > 0) {
            result += 'و' + this.convertGroup(decimal) + ' هللة';
        }
        
        return result.trim();
    },

    /**
     * تحويل مجموعة من 3 أرقام
     */
    convertGroup: function(num) {
        const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
        const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
        const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 
                       'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
        const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 
                          'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
        
        let result = '';
        
        const h = Math.floor(num / 100);
        const t = Math.floor((num % 100) / 10);
        const o = num % 10;
        
        if (h > 0) {
            result += hundreds[h];
        }
        
        if (t === 1 && o > 0) {
            if (result) result += ' و';
            result += teens[o];
        } else {
            if (o > 0) {
                if (result) result += ' و';
                result += ones[o];
            }
            if (t > 1) {
                if (result) result += ' و';
                result += tens[t];
            } else if (t === 1 && o === 0) {
                if (result) result += ' و';
                result += 'عشرة';
            }
        }
        
        return result || 'صفر';
    },

    /**
     * الحصول على اسم نوع التقييم
     */
    getEvaluationTypeName: function(type) {
        const types = {
            'sale': 'تقييم لأغراض البيع',
            'insurance': 'تقييم لأغراض التأمين',
            'bank': 'تقييم للتمويل البنكي',
            'guarantee': 'تقييم للضمان',
            'accounting': 'تقييم لأغراض المحاسبة',
            'other': 'تقييم لأغراض أخرى'
        };
        return types[type] || type || '-';
    },

    /**
     * الحصول على اسم طريقة التقييم
     */
    getValuationMethodName: function(method) {
        const methods = {
            'market': 'القيمة السوقية',
            'book': 'القيمة الدفترية',
            'replacement': 'قيمة الاستبدال',
            'liquidation': 'قيمة التصفية',
            'income': 'طريقة الدخل',
            'cost': 'طريقة التكلفة'
        };
        return methods[method] || method || '-';
    },

    /**
     * الحصول على اسم الحالة
     */
    getConditionName: function(condition) {
        const conditions = {
            'excellent': 'ممتازة',
            'very_good': 'جيدة جداً',
            'good': 'جيدة',
            'acceptable': 'مقبولة',
            'poor': 'رديئة'
        };
        return conditions[condition] || condition || '-';
    },

    /**
     * الحصول على اسم الاستخدام
     */
    getUsageName: function(usage) {
        const usages = {
            'active': 'نشط',
            'stopped': 'متوقف',
            'maintenance': 'قيد الصيانة'
        };
        return usages[usage] || usage || '-';
    },

    /**
     * ضغط الصورة
     */
    compressImage: function(file, maxWidth = 1024, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * التحقق من صحة البريد الإلكتروني
     */
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * التحقق من صحة رقم الجوال السعودي
     */
    isValidSaudiPhone: function(phone) {
        const re = /^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
        return re.test(phone.replace(/\s/g, ''));
    },

    /**
     * عرض رسالة Toast
     */
    showToast: function(message, type = 'info') {
        if (typeof Swal !== 'undefined') {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            
            Toast.fire({
                icon: type,
                title: message
            });
        }
    },

    /**
     * نسخ نص إلى الحافظة
     */
    copyToClipboard: function(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('تم النسخ بنجاح', 'success');
            });
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('تم النسخ بنجاح', 'success');
        }
    },

    /**
     * تأخير التنفيذ (debounce)
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * الحصول على معلمات URL
     */
    getUrlParams: function() {
        return new URLSearchParams(window.location.search);
    },

    /**
     * تحميل ملف
     */
    downloadFile: function(content, filename, type = 'application/json') {
        const blob = new Blob([content], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
};

// جعل Utils متاحاً عالمياً
window.Utils = Utils;
