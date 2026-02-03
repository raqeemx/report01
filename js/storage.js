/**
 * نظام تقييم الآلات والمعدات
 * ملف إدارة التخزين (Storage)
 */

const Storage = {
    // مفاتيح التخزين
    KEYS: {
        SETTINGS: 'valuation_settings',
        REPORTS: 'valuation_reports',
        TEMPLATES: 'valuation_templates',
        DRAFTS: 'valuation_drafts'
    },

    /**
     * ===============================
     * الإعدادات
     * ===============================
     */
    
    /**
     * حفظ الإعدادات
     */
    saveSettings: function(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    /**
     * الحصول على الإعدادات
     */
    getSettings: function() {
        try {
            const settings = localStorage.getItem(this.KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : null;
        } catch (e) {
            console.error('Error getting settings:', e);
            return null;
        }
    },

    /**
     * ===============================
     * التقارير
     * ===============================
     */

    /**
     * حفظ تقرير جديد
     */
    saveReport: function(report) {
        try {
            const reports = this.getReports() || [];
            
            // إضافة معرف إذا لم يكن موجوداً
            if (!report.id) {
                report.id = Utils.generateId();
            }
            
            // إضافة تاريخ الإنشاء والتحديث
            const now = new Date().toISOString();
            if (!report.createdAt) {
                report.createdAt = now;
            }
            report.updatedAt = now;
            
            // البحث عن تقرير موجود
            const existingIndex = reports.findIndex(r => r.id === report.id);
            
            if (existingIndex !== -1) {
                // تحديث تقرير موجود
                reports[existingIndex] = { ...reports[existingIndex], ...report };
            } else {
                // إضافة تقرير جديد
                reports.unshift(report);
            }
            
            localStorage.setItem(this.KEYS.REPORTS, JSON.stringify(reports));
            return report;
        } catch (e) {
            console.error('Error saving report:', e);
            return null;
        }
    },

    /**
     * الحصول على جميع التقارير
     */
    getReports: function() {
        try {
            const reports = localStorage.getItem(this.KEYS.REPORTS);
            return reports ? JSON.parse(reports) : [];
        } catch (e) {
            console.error('Error getting reports:', e);
            return [];
        }
    },

    /**
     * الحصول على تقرير محدد
     */
    getReport: function(id) {
        const reports = this.getReports();
        return reports.find(r => r.id === id) || null;
    },

    /**
     * حذف تقرير
     */
    deleteReport: function(id) {
        try {
            let reports = this.getReports();
            reports = reports.filter(r => r.id !== id);
            localStorage.setItem(this.KEYS.REPORTS, JSON.stringify(reports));
            return true;
        } catch (e) {
            console.error('Error deleting report:', e);
            return false;
        }
    },

    /**
     * البحث في التقارير
     */
    searchReports: function(query, filters = {}) {
        let reports = this.getReports();
        
        // البحث النصي
        if (query) {
            query = query.toLowerCase();
            reports = reports.filter(r => 
                (r.projectNumber && r.projectNumber.toLowerCase().includes(query)) ||
                (r.clientName && r.clientName.toLowerCase().includes(query)) ||
                (r.clientId && r.clientId.toLowerCase().includes(query))
            );
        }
        
        // فلترة حسب النوع
        if (filters.type) {
            reports = reports.filter(r => r.evaluationType === filters.type);
        }
        
        // فلترة حسب الحالة
        if (filters.status) {
            reports = reports.filter(r => r.status === filters.status);
        }
        
        // فلترة حسب التاريخ
        if (filters.startDate) {
            reports = reports.filter(r => new Date(r.evaluationDate) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            reports = reports.filter(r => new Date(r.evaluationDate) <= new Date(filters.endDate));
        }
        
        return reports;
    },

    /**
     * الحصول على إحصائيات التقارير
     */
    getReportStats: function() {
        const reports = this.getReports();
        
        return {
            total: reports.length,
            completed: reports.filter(r => r.status === 'completed').length,
            draft: reports.filter(r => r.status === 'draft').length,
            totalValue: reports.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0),
            lastReport: reports.length > 0 ? reports[0] : null
        };
    },

    /**
     * ===============================
     * المسودات
     * ===============================
     */

    /**
     * حفظ مسودة
     */
    saveDraft: function(draft) {
        try {
            const drafts = this.getDrafts() || {};
            draft.savedAt = new Date().toISOString();
            drafts[draft.id || 'current'] = draft;
            localStorage.setItem(this.KEYS.DRAFTS, JSON.stringify(drafts));
            return true;
        } catch (e) {
            console.error('Error saving draft:', e);
            return false;
        }
    },

    /**
     * الحصول على مسودة
     */
    getDraft: function(id = 'current') {
        try {
            const drafts = this.getDrafts();
            return drafts[id] || null;
        } catch (e) {
            console.error('Error getting draft:', e);
            return null;
        }
    },

    /**
     * الحصول على جميع المسودات
     */
    getDrafts: function() {
        try {
            const drafts = localStorage.getItem(this.KEYS.DRAFTS);
            return drafts ? JSON.parse(drafts) : {};
        } catch (e) {
            console.error('Error getting drafts:', e);
            return {};
        }
    },

    /**
     * حذف مسودة
     */
    deleteDraft: function(id = 'current') {
        try {
            const drafts = this.getDrafts();
            delete drafts[id];
            localStorage.setItem(this.KEYS.DRAFTS, JSON.stringify(drafts));
            return true;
        } catch (e) {
            console.error('Error deleting draft:', e);
            return false;
        }
    },

    /**
     * ===============================
     * القوالب
     * ===============================
     */

    /**
     * حفظ قالب
     */
    saveTemplate: function(template) {
        try {
            const templates = this.getTemplates() || [];
            
            if (!template.id) {
                template.id = Utils.generateId();
            }
            
            const now = new Date().toISOString();
            if (!template.createdAt) {
                template.createdAt = now;
            }
            template.updatedAt = now;
            
            const existingIndex = templates.findIndex(t => t.id === template.id);
            
            if (existingIndex !== -1) {
                templates[existingIndex] = template;
            } else {
                templates.push(template);
            }
            
            localStorage.setItem(this.KEYS.TEMPLATES, JSON.stringify(templates));
            return template;
        } catch (e) {
            console.error('Error saving template:', e);
            return null;
        }
    },

    /**
     * الحصول على جميع القوالب
     */
    getTemplates: function() {
        try {
            const templates = localStorage.getItem(this.KEYS.TEMPLATES);
            return templates ? JSON.parse(templates) : [];
        } catch (e) {
            console.error('Error getting templates:', e);
            return [];
        }
    },

    /**
     * الحصول على قالب محدد
     */
    getTemplate: function(id) {
        const templates = this.getTemplates();
        return templates.find(t => t.id === id) || null;
    },

    /**
     * حذف قالب
     */
    deleteTemplate: function(id) {
        try {
            let templates = this.getTemplates();
            templates = templates.filter(t => t.id !== id);
            localStorage.setItem(this.KEYS.TEMPLATES, JSON.stringify(templates));
            return true;
        } catch (e) {
            console.error('Error deleting template:', e);
            return false;
        }
    },

    /**
     * ===============================
     * النسخ الاحتياطي
     * ===============================
     */

    /**
     * تصدير جميع البيانات
     */
    exportAll: function() {
        return {
            settings: this.getSettings(),
            reports: this.getReports(),
            templates: this.getTemplates(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    },

    /**
     * استيراد البيانات
     */
    importAll: function(data) {
        try {
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            if (data.reports) {
                localStorage.setItem(this.KEYS.REPORTS, JSON.stringify(data.reports));
            }
            if (data.templates) {
                localStorage.setItem(this.KEYS.TEMPLATES, JSON.stringify(data.templates));
            }
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    },

    /**
     * مسح جميع البيانات
     */
    clearAll: function() {
        try {
            localStorage.removeItem(this.KEYS.SETTINGS);
            localStorage.removeItem(this.KEYS.REPORTS);
            localStorage.removeItem(this.KEYS.TEMPLATES);
            localStorage.removeItem(this.KEYS.DRAFTS);
            return true;
        } catch (e) {
            console.error('Error clearing data:', e);
            return false;
        }
    },

    /**
     * الحصول على حجم التخزين المستخدم
     */
    getStorageSize: function() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // ~2 bytes per char
            }
        }
        return total;
    },

    /**
     * فحص دعم localStorage
     */
    isSupported: function() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// جعل Storage متاحاً عالمياً
window.Storage = Storage;

// التحقق من دعم التخزين المحلي
if (!Storage.isSupported()) {
    console.warn('localStorage is not supported. Data will not persist.');
}
