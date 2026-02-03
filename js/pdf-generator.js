/**
 * نظام تقييم الآلات والمعدات
 * ملف توليد PDF
 */

const PDFGenerator = {
    /**
     * توليد PDF من HTML
     */
    generateFromHTML: async function(elementId, filename) {
        const element = document.getElementById(elementId);
        
        if (!element) {
            console.error('Element not found:', elementId);
            return false;
        }
        
        // التحقق من وجود html2pdf
        if (typeof html2pdf === 'undefined') {
            console.error('html2pdf library not loaded');
            return false;
        }
        
        const opt = {
            margin: [10, 10, 10, 10],
            filename: filename || 'تقرير_تقييم.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            },
            pagebreak: { mode: 'avoid-all', before: '.page-break' }
        };
        
        try {
            await html2pdf().set(opt).from(element).save();
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            return false;
        }
    },

    /**
     * توليد PDF مع التقدم
     */
    generateWithProgress: async function(elementId, filename, onProgress) {
        const element = document.getElementById(elementId);
        
        if (!element) {
            if (onProgress) onProgress({ status: 'error', message: 'العنصر غير موجود' });
            return false;
        }
        
        if (typeof html2pdf === 'undefined') {
            if (onProgress) onProgress({ status: 'error', message: 'مكتبة PDF غير متوفرة' });
            return false;
        }
        
        const opt = {
            margin: [10, 10, 10, 10],
            filename: filename || 'تقرير_تقييم.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            }
        };
        
        try {
            if (onProgress) onProgress({ status: 'processing', progress: 10, message: 'جاري تحضير المستند...' });
            
            const worker = html2pdf().set(opt).from(element);
            
            if (onProgress) onProgress({ status: 'processing', progress: 30, message: 'جاري تحويل الصفحة...' });
            
            await worker.save();
            
            if (onProgress) onProgress({ status: 'complete', progress: 100, message: 'تم إنشاء PDF بنجاح' });
            
            return true;
        } catch (error) {
            if (onProgress) onProgress({ status: 'error', message: 'حدث خطأ أثناء الإنشاء' });
            console.error('Error generating PDF:', error);
            return false;
        }
    },

    /**
     * طباعة العنصر
     */
    print: function(elementId) {
        const element = document.getElementById(elementId);
        
        if (!element) {
            console.error('Element not found:', elementId);
            return;
        }
        
        // فتح نافذة طباعة
        const printWindow = window.open('', '_blank');
        
        // نسخ الستايلات
        const styles = document.querySelectorAll('link[rel="stylesheet"], style');
        let styleHTML = '';
        styles.forEach(style => {
            styleHTML += style.outerHTML;
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>طباعة التقرير</title>
                ${styleHTML}
                <style>
                    body {
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @media print {
                        body {
                            print-color-adjust: exact !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                    }
                </style>
            </head>
            <body>
                ${element.outerHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // انتظار تحميل الصور
        setTimeout(() => {
            printWindow.print();
        }, 500);
    },

    /**
     * تصدير كصورة
     */
    exportAsImage: async function(elementId, filename) {
        const element = document.getElementById(elementId);
        
        if (!element) {
            console.error('Element not found:', elementId);
            return false;
        }
        
        if (typeof html2canvas === 'undefined') {
            console.error('html2canvas library not loaded');
            return false;
        }
        
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            const link = document.createElement('a');
            link.download = filename || 'تقرير_تقييم.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            return true;
        } catch (error) {
            console.error('Error exporting as image:', error);
            return false;
        }
    }
};

// جعل PDFGenerator متاحاً عالمياً
window.PDFGenerator = PDFGenerator;
