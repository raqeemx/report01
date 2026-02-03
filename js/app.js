/**
 * نظام تقييم الآلات والمعدات
 * الملف الرئيسي للتطبيق (App)
 */

// ==========================================
// تهيئة التطبيق
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // تهيئة المكونات العامة
    initNavigation();
    initThemeToggle();
    initModals();
    
    // تهيئة الصفحة حسب نوعها
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'index':
            initHomePage();
            break;
        case 'new-report':
            if (typeof FormHandler !== 'undefined') {
                FormHandler.init();
            }
            break;
        case 'reports':
            // يتم تهيئتها في الصفحة نفسها
            break;
        case 'preview':
            // يتم تهيئتها في الصفحة نفسها
            break;
        case 'settings':
            // يتم تهيئتها في الصفحة نفسها
            break;
    }
    
    // تهيئة اختصارات لوحة المفاتيح
    initKeyboardShortcuts();
});

// ==========================================
// تحديد الصفحة الحالية
// ==========================================

function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '') || 'index';
    return filename;
}

// ==========================================
// تهيئة التنقل
// ==========================================

function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('show');
            if (navOverlay) {
                navOverlay.classList.toggle('show');
            }
        });
    }
    
    if (navOverlay) {
        navOverlay.addEventListener('click', function() {
            navMenu.classList.remove('show');
            navOverlay.classList.remove('show');
        });
    }
    
    // إغلاق القائمة عند تغيير حجم الشاشة
    window.addEventListener('resize', function() {
        if (window.innerWidth > 767) {
            if (navMenu) navMenu.classList.remove('show');
            if (navOverlay) navOverlay.classList.remove('show');
        }
    });
}

// ==========================================
// تهيئة الوضع الليلي
// ==========================================

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    // تحميل الإعداد المحفوظ
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// ==========================================
// تهيئة النوافذ المنبثقة
// ==========================================

function initModals() {
    // إغلاق Modal عند النقر خارجها
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
    
    // إغلاق بـ ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
}

// ==========================================
// تهيئة الصفحة الرئيسية
// ==========================================

function initHomePage() {
    // تحميل الإحصائيات
    loadHomeStats();
    
    // تحميل أحدث التقارير
    loadRecentReports();
    
    // تهيئة أزرار الإجراءات
    initHomeActions();
}

function loadHomeStats() {
    const stats = Storage.getReportStats();
    
    document.getElementById('totalReports').textContent = stats.total;
    document.getElementById('completedReports').textContent = stats.completed;
    document.getElementById('draftReports').textContent = stats.draft;
    
    if (stats.lastReport) {
        document.getElementById('lastReport').textContent = Utils.formatDate(stats.lastReport.evaluationDate);
    } else {
        document.getElementById('lastReport').textContent = '-';
    }
}

function loadRecentReports() {
    const reports = Storage.getReports().slice(0, 5);
    const tbody = document.getElementById('recentReportsBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.querySelector('.reports-table');
    
    if (!tbody) return;
    
    if (reports.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.classList.add('show');
        return;
    }
    
    if (table) table.style.display = 'table';
    if (emptyState) emptyState.classList.remove('show');
    
    tbody.innerHTML = reports.map(report => `
        <tr>
            <td><strong>${report.projectNumber || '-'}</strong></td>
            <td>${report.clientName || '-'}</td>
            <td>${Utils.getEvaluationTypeName(report.evaluationType)}</td>
            <td>${Utils.formatDate(report.evaluationDate)}</td>
            <td>
                <span class="status-badge ${report.status}">
                    <i class="fas fa-${report.status === 'completed' ? 'check-circle' : 'edit'}"></i>
                    ${report.status === 'completed' ? 'مكتمل' : 'مسودة'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-icon btn-sm" onclick="window.location.href='preview.html?id=${report.id}'" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-icon btn-sm" onclick="window.location.href='new-report.html?edit=${report.id}'" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-sm delete" onclick="deleteReportFromHome('${report.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function initHomeActions() {
    // تصدير البيانات
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const data = Storage.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            Utils.showToast('تم تصدير البيانات بنجاح', 'success');
        });
    }
    
    // استيراد البيانات
    const importBtn = document.getElementById('importData');
    const importModal = document.getElementById('importModal');
    const closeImportModal = document.getElementById('closeImportModal');
    const importFile = document.getElementById('importFile');
    const dropZone = document.getElementById('dropZone');
    
    if (importBtn && importModal) {
        importBtn.addEventListener('click', function() {
            importModal.classList.add('show');
        });
    }
    
    if (closeImportModal) {
        closeImportModal.addEventListener('click', function() {
            importModal.classList.remove('show');
        });
    }
    
    if (importFile) {
        importFile.addEventListener('change', handleImportFile);
    }
    
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/json') {
                processImportFile(file);
            } else {
                Utils.showToast('يرجى اختيار ملف JSON', 'error');
            }
        });
    }
}

function handleImportFile(e) {
    const file = e.target.files[0];
    if (file) {
        processImportFile(file);
    }
}

function processImportFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            Swal.fire({
                title: 'تأكيد الاستيراد',
                html: `
                    <p>سيتم استيراد:</p>
                    <ul style="text-align: right;">
                        <li>${data.reports?.length || 0} تقرير</li>
                        <li>${data.templates?.length || 0} قالب</li>
                    </ul>
                    <p class="text-warning">سيتم استبدال البيانات الحالية</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'استيراد',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (Storage.importAll(data)) {
                        document.getElementById('importModal').classList.remove('show');
                        loadHomeStats();
                        loadRecentReports();
                        Utils.showToast('تم استيراد البيانات بنجاح', 'success');
                    }
                }
            });
        } catch (err) {
            Utils.showToast('ملف غير صالح', 'error');
        }
    };
    reader.readAsText(file);
}

// حذف تقرير من الصفحة الرئيسية
function deleteReportFromHome(id) {
    Swal.fire({
        title: 'تأكيد الحذف',
        text: 'هل أنت متأكد من حذف هذا التقرير؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            Storage.deleteReport(id);
            loadHomeStats();
            loadRecentReports();
            Utils.showToast('تم حذف التقرير', 'success');
        }
    });
}

// جعلها متاحة عالمياً
window.deleteReportFromHome = deleteReportFromHome;

// ==========================================
// اختصارات لوحة المفاتيح
// ==========================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + S: حفظ
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (typeof FormHandler !== 'undefined' && FormHandler.saveDraft) {
                FormHandler.saveDraft(true);
            }
        }
        
        // Ctrl + P: طباعة
        if (e.ctrlKey && e.key === 'p') {
            const printBtn = document.getElementById('printBtn');
            if (printBtn) {
                e.preventDefault();
                printBtn.click();
            }
        }
        
        // Ctrl + N: تقرير جديد
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            window.location.href = 'new-report.html';
        }
    });
}

// ==========================================
// دوال مساعدة عامة
// ==========================================

// تنسيق الأرقام
function formatNumber(num) {
    return new Intl.NumberFormat('ar-SA').format(num);
}

// التحقق من الاتصال بالإنترنت
function isOnline() {
    return navigator.onLine;
}

// عرض Loading
function showLoading(message = 'جاري التحميل...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// إخفاء Loading
function hideLoading() {
    Swal.close();
}

// إظهار رسالة خطأ
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: message
    });
}

// إظهار رسالة نجاح
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'نجاح',
        text: message,
        timer: 1500,
        showConfirmButton: false
    });
}

// تأكيد الإجراء
function confirmAction(title, text) {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e3a8a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'نعم',
        cancelButtonText: 'إلغاء'
    });
}

// جعل الدوال متاحة عالمياً
window.formatNumber = formatNumber;
window.isOnline = isOnline;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.showSuccess = showSuccess;
window.confirmAction = confirmAction;
