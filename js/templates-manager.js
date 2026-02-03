/**
 * نظام تقييم الآلات والمعدات
 * ملف إدارة القوالب
 */

const TemplatesManager = {
    /**
     * القوالب الافتراضية
     */
    defaultTemplates: [
        {
            id: 'default-sale',
            name: 'قالب تقييم البيع',
            type: 'sale',
            description: 'قالب افتراضي لتقارير تقييم البيع',
            sections: ['intro', 'client', 'scope', 'machines', 'values', 'basis', 'recommendations', 'signatures'],
            introText: 'بناءً على طلب العميل، قام فريقنا المتخصص بإجراء تقييم شامل للآلات والمعدات المذكورة في هذا التقرير، وذلك وفقاً للمعايير المهنية المعتمدة في مجال تقييم الأصول المنقولة.',
            isDefault: true
        },
        {
            id: 'default-insurance',
            name: 'قالب تقييم التأمين',
            type: 'insurance',
            description: 'قالب افتراضي لتقارير تقييم التأمين',
            sections: ['intro', 'client', 'scope', 'machines', 'values', 'basis', 'recommendations', 'signatures'],
            introText: 'تم إعداد هذا التقرير لأغراض التأمين بناءً على طلب العميل، ويتضمن تقييماً شاملاً للآلات والمعدات المحددة لتحديد قيمة التغطية التأمينية المناسبة.',
            isDefault: true
        },
        {
            id: 'default-bank',
            name: 'قالب تقييم التمويل البنكي',
            type: 'bank',
            description: 'قالب افتراضي لتقارير التمويل البنكي',
            sections: ['intro', 'client', 'scope', 'machines', 'values', 'basis', 'recommendations', 'signatures'],
            introText: 'تم إعداد هذا التقرير بناءً على طلب الجهة الممولة، ويتضمن تقييماً للأصول المقدمة كضمان للحصول على التمويل، وذلك وفقاً للمعايير المهنية المعتمدة.',
            isDefault: true
        },
        {
            id: 'default-guarantee',
            name: 'قالب تقييم الضمان',
            type: 'guarantee',
            description: 'قالب افتراضي لتقارير الضمان',
            sections: ['intro', 'client', 'scope', 'machines', 'values', 'basis', 'recommendations', 'signatures'],
            introText: 'تم إعداد هذا التقرير لأغراض تقييم الأصول كضمانات للعقود والالتزامات المالية.',
            isDefault: true
        },
        {
            id: 'default-accounting',
            name: 'قالب تقييم المحاسبة',
            type: 'accounting',
            description: 'قالب افتراضي لتقارير المحاسبة',
            sections: ['intro', 'client', 'scope', 'machines', 'values', 'basis', 'recommendations', 'signatures'],
            introText: 'تم إعداد هذا التقرير لأغراض تحديد القيمة الدفترية وحساب الاستهلاك للأغراض المحاسبية.',
            isDefault: true
        }
    ],

    /**
     * الحصول على جميع القوالب
     */
    getAll: function() {
        const customTemplates = Storage.getTemplates() || [];
        return [...this.defaultTemplates, ...customTemplates];
    },

    /**
     * الحصول على قالب بالمعرف
     */
    getById: function(id) {
        const allTemplates = this.getAll();
        return allTemplates.find(t => t.id === id) || null;
    },

    /**
     * الحصول على قالب حسب النوع
     */
    getByType: function(type) {
        const allTemplates = this.getAll();
        return allTemplates.filter(t => t.type === type);
    },

    /**
     * حفظ قالب جديد
     */
    save: function(template) {
        if (!template.id) {
            template.id = Utils.generateId();
        }
        template.isDefault = false;
        template.createdAt = template.createdAt || new Date().toISOString();
        template.updatedAt = new Date().toISOString();
        
        return Storage.saveTemplate(template);
    },

    /**
     * حذف قالب
     */
    delete: function(id) {
        const template = this.getById(id);
        if (template && template.isDefault) {
            Utils.showToast('لا يمكن حذف القوالب الافتراضية', 'error');
            return false;
        }
        return Storage.deleteTemplate(id);
    },

    /**
     * إنشاء قالب من تقرير
     */
    createFromReport: function(report, templateName) {
        const template = {
            name: templateName || `قالب من تقرير ${report.projectNumber}`,
            type: report.evaluationType,
            description: 'قالب تم إنشاؤه من تقرير سابق',
            sections: ['intro', 'client', 'scope', 'machines', 'values', 'basis', 'recommendations', 'signatures'],
            introText: report.introText || this.defaultTemplates[0].introText,
            valuationBasis: report.valuationBasis,
            recommendations: report.recommendations,
            // حفظ البيانات الافتراضية
            defaults: {
                evaluationType: report.evaluationType,
                valuationMethod: report.valuationMethod,
                currency: report.currency
            }
        };
        
        return this.save(template);
    },

    /**
     * تطبيق قالب على تقرير جديد
     */
    applyToReport: function(templateId, reportData = {}) {
        const template = this.getById(templateId);
        if (!template) return reportData;
        
        return {
            ...reportData,
            evaluationType: template.type,
            introText: template.introText,
            valuationBasis: template.valuationBasis || '',
            recommendations: template.recommendations || '',
            ...(template.defaults || {})
        };
    },

    /**
     * عرض نافذة اختيار القالب
     */
    showSelector: function(onSelect) {
        const templates = this.getAll();
        
        let templatesHTML = templates.map(t => `
            <div class="template-card" data-id="${t.id}">
                <div class="template-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="template-info">
                    <h4>${t.name}</h4>
                    <p>${t.description || ''}</p>
                    ${t.isDefault ? '<span class="badge">افتراضي</span>' : ''}
                </div>
            </div>
        `).join('');
        
        Swal.fire({
            title: 'اختر قالب',
            html: `
                <div class="templates-grid" style="max-height: 400px; overflow-y: auto;">
                    ${templatesHTML}
                </div>
            `,
            showCancelButton: true,
            cancelButtonText: 'إلغاء',
            showConfirmButton: false,
            width: 600,
            didOpen: () => {
                const cards = document.querySelectorAll('.template-card');
                cards.forEach(card => {
                    card.addEventListener('click', () => {
                        const templateId = card.dataset.id;
                        Swal.close();
                        if (onSelect) onSelect(templateId);
                    });
                });
            }
        });
    }
};

// جعله متاحاً عالمياً
window.TemplatesManager = TemplatesManager;
