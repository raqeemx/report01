/**
 * نظام تقييم الآلات والمعدات
 * ملف التخزين السحابي باستخدام RESTful Table API
 * يمكن استخدامه كبديل أو إضافة للتخزين المحلي
 */

const APIStorage = {
    // اسم الجداول
    TABLES: {
        REPORTS: 'reports',
        MACHINES: 'machines',
        SETTINGS: 'settings',
        TEMPLATES: 'templates'
    },

    // هل التخزين السحابي مفعل؟
    isEnabled: false,

    /**
     * تفعيل التخزين السحابي
     */
    enable: function() {
        this.isEnabled = true;
        console.log('Cloud storage enabled');
    },

    /**
     * تعطيل التخزين السحابي
     */
    disable: function() {
        this.isEnabled = false;
        console.log('Cloud storage disabled');
    },

    /**
     * ==========================================
     * التقارير
     * ==========================================
     */

    /**
     * حفظ تقرير
     */
    saveReport: async function(report) {
        try {
            const method = report.id ? 'PUT' : 'POST';
            const url = report.id 
                ? `tables/${this.TABLES.REPORTS}/${report.id}`
                : `tables/${this.TABLES.REPORTS}`;

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...report,
                    machines: JSON.stringify(report.machines || []), // تحويل المصفوفة لنص
                    updatedAt: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to save report');
            
            const savedReport = await response.json();
            savedReport.machines = JSON.parse(savedReport.machines || '[]');
            
            // حفظ محلياً أيضاً للوصول السريع
            Storage.saveReport(report);
            
            return savedReport;
        } catch (error) {
            console.error('API Error saving report:', error);
            // الاعتماد على التخزين المحلي كاحتياطي
            return Storage.saveReport(report);
        }
    },

    /**
     * الحصول على جميع التقارير
     */
    getReports: async function(page = 1, limit = 100) {
        try {
            const response = await fetch(
                `tables/${this.TABLES.REPORTS}?page=${page}&limit=${limit}&sort=-created_at`
            );
            
            if (!response.ok) throw new Error('Failed to fetch reports');
            
            const data = await response.json();
            
            // تحويل الآلات من نص إلى مصفوفة
            data.data = data.data.map(report => ({
                ...report,
                machines: JSON.parse(report.machines || '[]')
            }));
            
            return data;
        } catch (error) {
            console.error('API Error fetching reports:', error);
            // الاعتماد على التخزين المحلي
            return {
                data: Storage.getReports(),
                total: Storage.getReports().length,
                page: 1,
                limit: limit
            };
        }
    },

    /**
     * الحصول على تقرير واحد
     */
    getReport: async function(id) {
        try {
            const response = await fetch(`tables/${this.TABLES.REPORTS}/${id}`);
            
            if (!response.ok) throw new Error('Report not found');
            
            const report = await response.json();
            report.machines = JSON.parse(report.machines || '[]');
            
            return report;
        } catch (error) {
            console.error('API Error fetching report:', error);
            return Storage.getReport(id);
        }
    },

    /**
     * حذف تقرير
     */
    deleteReport: async function(id) {
        try {
            const response = await fetch(`tables/${this.TABLES.REPORTS}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete report');
            
            // حذف محلياً أيضاً
            Storage.deleteReport(id);
            
            return true;
        } catch (error) {
            console.error('API Error deleting report:', error);
            return Storage.deleteReport(id);
        }
    },

    /**
     * البحث في التقارير
     */
    searchReports: async function(query, filters = {}) {
        try {
            let url = `tables/${this.TABLES.REPORTS}?`;
            
            if (query) url += `search=${encodeURIComponent(query)}&`;
            if (filters.type) url += `evaluationType=${filters.type}&`;
            if (filters.status) url += `status=${filters.status}&`;
            
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            data.data = data.data.map(report => ({
                ...report,
                machines: JSON.parse(report.machines || '[]')
            }));
            
            return data.data;
        } catch (error) {
            console.error('API Error searching reports:', error);
            return Storage.searchReports(query, filters);
        }
    },

    /**
     * ==========================================
     * الإعدادات
     * ==========================================
     */

    /**
     * حفظ الإعدادات
     */
    saveSettings: async function(settings) {
        try {
            // نستخدم ID ثابت للإعدادات
            const settingsId = 'main-settings';
            
            const existing = await this.getSettings();
            const method = existing ? 'PUT' : 'POST';
            const url = existing 
                ? `tables/${this.TABLES.SETTINGS}/${settingsId}`
                : `tables/${this.TABLES.SETTINGS}`;

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: settingsId,
                    data: JSON.stringify(settings)
                })
            });

            if (!response.ok) throw new Error('Failed to save settings');
            
            // حفظ محلياً
            Storage.saveSettings(settings);
            
            return true;
        } catch (error) {
            console.error('API Error saving settings:', error);
            return Storage.saveSettings(settings);
        }
    },

    /**
     * الحصول على الإعدادات
     */
    getSettings: async function() {
        try {
            const response = await fetch(`tables/${this.TABLES.SETTINGS}/main-settings`);
            
            if (!response.ok) return Storage.getSettings();
            
            const result = await response.json();
            return JSON.parse(result.data || '{}');
        } catch (error) {
            console.error('API Error fetching settings:', error);
            return Storage.getSettings();
        }
    },

    /**
     * ==========================================
     * المزامنة
     * ==========================================
     */

    /**
     * مزامنة البيانات المحلية مع السحابة
     */
    syncAll: async function() {
        if (!this.isEnabled) {
            console.log('Cloud storage not enabled');
            return false;
        }

        try {
            Utils.showToast('جاري المزامنة...', 'info');
            
            // مزامنة التقارير
            const localReports = Storage.getReports();
            for (const report of localReports) {
                await this.saveReport(report);
            }
            
            // مزامنة الإعدادات
            const localSettings = Storage.getSettings();
            if (localSettings) {
                await this.saveSettings(localSettings);
            }
            
            Utils.showToast('تمت المزامنة بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Sync error:', error);
            Utils.showToast('فشلت المزامنة', 'error');
            return false;
        }
    },

    /**
     * تحميل البيانات من السحابة إلى المحلي
     */
    pullFromCloud: async function() {
        if (!this.isEnabled) {
            console.log('Cloud storage not enabled');
            return false;
        }

        try {
            Utils.showToast('جاري تحميل البيانات...', 'info');
            
            // تحميل التقارير
            const cloudData = await this.getReports(1, 1000);
            if (cloudData.data && cloudData.data.length > 0) {
                for (const report of cloudData.data) {
                    Storage.saveReport(report);
                }
            }
            
            // تحميل الإعدادات
            const cloudSettings = await this.getSettings();
            if (cloudSettings) {
                Storage.saveSettings(cloudSettings);
            }
            
            Utils.showToast('تم تحميل البيانات بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Pull error:', error);
            Utils.showToast('فشل تحميل البيانات', 'error');
            return false;
        }
    },

    /**
     * الحصول على إحصائيات التقارير
     */
    getReportStats: async function() {
        try {
            const reports = await this.getReports(1, 1000);
            const data = reports.data || [];
            
            return {
                total: data.length,
                completed: data.filter(r => r.status === 'completed').length,
                draft: data.filter(r => r.status === 'draft').length,
                totalValue: data.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0),
                lastReport: data.length > 0 ? data[0] : null
            };
        } catch (error) {
            console.error('API Error getting stats:', error);
            return Storage.getReportStats();
        }
    }
};

// جعله متاحاً عالمياً
window.APIStorage = APIStorage;
