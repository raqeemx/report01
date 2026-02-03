/**
 * نظام تقييم الآلات والمعدات
 * ملف معالجة النماذج (Form Handler)
 */

const FormHandler = {
    // الحالة الحالية
    state: {
        currentStep: 1,
        totalSteps: 6,
        reportData: {},
        machines: [],
        isEditing: false,
        editId: null,
        autoSaveTimer: null
    },

    /**
     * تهيئة معالج النماذج
     */
    init: function() {
        // فحص وجود صفحة التقرير الجديد
        if (!document.getElementById('reportForm')) return;
        
        // تهيئة الخطوات
        this.initSteps();
        
        // تهيئة أحداث النموذج
        this.initFormEvents();
        
        // تهيئة اختيار التواريخ
        this.initDatePickers();
        
        // تهيئة نموذج الآلات
        this.initMachineForm();
        
        // تهيئة الحفظ التلقائي
        this.initAutoSave();
        
        // فحص وضع التعديل
        this.checkEditMode();
        
        // فحص نوع التقييم من URL
        this.checkEvaluationType();
        
        // تحميل المسودة إذا وجدت
        this.loadDraft();
    },

    /**
     * تهيئة الخطوات
     */
    initSteps: function() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const previewBtn = document.getElementById('previewBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewReport());
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitReport();
            });
        }
        
        // زر حفظ المسودة
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft(true));
        }
    },

    /**
     * الانتقال للخطوة التالية
     */
    nextStep: function() {
        // التحقق من صحة الخطوة الحالية
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.state.currentStep}"]`);
        const validation = Validation.validateStep(currentStepElement);
        
        if (!validation.valid) {
            Utils.showToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // جمع بيانات الخطوة الحالية
        this.collectStepData(this.state.currentStep);
        
        // التحقق من وجود آلة واحدة على الأقل في الخطوة 4
        if (this.state.currentStep === 4 && this.state.machines.length === 0) {
            Utils.showToast('يرجى إضافة آلة واحدة على الأقل', 'error');
            return;
        }
        
        if (this.state.currentStep < this.state.totalSteps) {
            this.state.currentStep++;
            this.updateStepUI();
            
            // إذا كانت الخطوة الأخيرة، عرض ملخص المراجعة
            if (this.state.currentStep === 6) {
                this.showReviewContent();
            }
        }
    },

    /**
     * الرجوع للخطوة السابقة
     */
    prevStep: function() {
        if (this.state.currentStep > 1) {
            this.state.currentStep--;
            this.updateStepUI();
        }
    },

    /**
     * تحديث واجهة الخطوات
     */
    updateStepUI: function() {
        // إخفاء جميع الخطوات
        document.querySelectorAll('.form-step').forEach(step => {
            step.style.display = 'none';
        });
        
        // إظهار الخطوة الحالية
        const currentStep = document.querySelector(`.form-step[data-step="${this.state.currentStep}"]`);
        if (currentStep) {
            currentStep.style.display = 'block';
        }
        
        // تحديث شريط التقدم
        document.querySelectorAll('.progress-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            
            if (stepNum < this.state.currentStep) {
                step.classList.add('completed');
            } else if (stepNum === this.state.currentStep) {
                step.classList.add('active');
            }
        });
        
        // تحديث أزرار التنقل
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const previewBtn = document.getElementById('previewBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        prevBtn.style.display = this.state.currentStep > 1 ? 'inline-flex' : 'none';
        
        if (this.state.currentStep === this.state.totalSteps) {
            nextBtn.style.display = 'none';
            previewBtn.style.display = 'inline-flex';
            submitBtn.style.display = 'inline-flex';
        } else {
            nextBtn.style.display = 'inline-flex';
            previewBtn.style.display = 'none';
            submitBtn.style.display = 'none';
        }
        
        // التمرير للأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * جمع بيانات الخطوة
     */
    collectStepData: function(step) {
        switch (step) {
            case 1:
                const selectedType = document.querySelector('input[name="evaluationType"]:checked');
                this.state.reportData.evaluationType = selectedType ? selectedType.value : '';
                if (this.state.reportData.evaluationType === 'other') {
                    this.state.reportData.otherType = document.getElementById('otherType')?.value || '';
                }
                break;
                
            case 2:
                this.state.reportData.projectNumber = document.getElementById('projectNumber')?.value || '';
                this.state.reportData.evaluationDate = document.getElementById('evaluationDate')?.value || '';
                this.state.reportData.evaluatorName = document.getElementById('evaluatorName')?.value || '';
                this.state.reportData.requestingEntity = document.getElementById('requestingEntity')?.value || '';
                break;
                
            case 3:
                this.state.reportData.clientName = document.getElementById('clientName')?.value || '';
                this.state.reportData.clientId = document.getElementById('clientId')?.value || '';
                this.state.reportData.clientPhone = document.getElementById('clientPhone')?.value || '';
                this.state.reportData.clientEmail = document.getElementById('clientEmail')?.value || '';
                this.state.reportData.clientCity = document.getElementById('clientCity')?.value || '';
                this.state.reportData.clientAddress = document.getElementById('clientAddress')?.value || '';
                break;
                
            case 4:
                // الآلات تُجمع تلقائياً
                this.state.reportData.machines = this.state.machines;
                break;
                
            case 5:
                this.state.reportData.valuationMethod = document.getElementById('valuationMethod')?.value || '';
                this.state.reportData.currency = document.getElementById('currency')?.value || 'SAR';
                this.state.reportData.valuationBasis = document.getElementById('valuationBasis')?.value || '';
                this.state.reportData.recommendations = document.getElementById('recommendations')?.value || '';
                this.state.reportData.generalNotes = document.getElementById('generalNotes')?.value || '';
                
                // حساب الإجمالي
                this.state.reportData.totalValue = this.state.machines.reduce((sum, m) => 
                    sum + (parseFloat(m.value) || 0), 0);
                break;
        }
    },

    /**
     * تهيئة أحداث النموذج
     */
    initFormEvents: function() {
        // اختيار نوع التقييم
        const typeCards = document.querySelectorAll('#evaluationTypeCards .choice-card');
        typeCards.forEach(card => {
            card.addEventListener('click', () => {
                typeCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const input = card.querySelector('input');
                if (input) input.checked = true;
                
                // إظهار/إخفاء حقل النوع الآخر
                const otherGroup = document.getElementById('otherTypeGroup');
                if (otherGroup) {
                    otherGroup.style.display = input.value === 'other' ? 'block' : 'none';
                }
            });
        });
        
        // توليد رقم المشروع تلقائياً
        const projectNumberInput = document.getElementById('projectNumber');
        if (projectNumberInput && !projectNumberInput.value) {
            projectNumberInput.placeholder = Utils.generateReportNumber();
        }
        
        // تحديث العملة
        const currencySelect = document.getElementById('currency');
        if (currencySelect) {
            currencySelect.addEventListener('change', () => {
                this.updateTotalDisplay();
            });
        }
    },

    /**
     * تهيئة اختيار التواريخ
     */
    initDatePickers: function() {
        if (typeof flatpickr !== 'undefined') {
            flatpickr('.datepicker', {
                dateFormat: 'Y-m-d',
                locale: 'ar',
                defaultDate: new Date()
            });
        }
    },

    /**
     * تهيئة نموذج الآلات
     */
    initMachineForm: function() {
        const addBtn = document.getElementById('addMachineBtn');
        const container = document.getElementById('machinesContainer');
        
        if (!addBtn || !container) return;
        
        // إضافة آلة أولى تلقائياً
        this.addMachine();
        
        // زر إضافة آلة جديدة
        addBtn.addEventListener('click', () => this.addMachine());
    },

    /**
     * إضافة آلة جديدة
     */
    addMachine: function() {
        const container = document.getElementById('machinesContainer');
        const template = document.getElementById('machineTemplate');
        
        if (!container || !template) return;
        
        const index = this.state.machines.length;
        const clone = template.content.cloneNode(true);
        const machineItem = clone.querySelector('.machine-item');
        
        // تعيين الفهرس
        machineItem.dataset.machineIndex = index;
        machineItem.querySelector('.machine-number').textContent = index + 1;
        
        // تحديث اسم الراديو للحالة
        const conditionInputs = machineItem.querySelectorAll('.condition-selector input');
        conditionInputs.forEach(input => {
            input.name = `machine_${index}_condition`;
        });
        
        // أحداث الآلة
        this.initMachineEvents(machineItem, index);
        
        container.appendChild(clone);
        
        // إضافة بيانات فارغة
        this.state.machines.push({});
        
        // تحديث العدد
        this.updateMachineCount();
    },

    /**
     * تهيئة أحداث الآلة
     */
    initMachineEvents: function(machineItem, index) {
        // زر طي/توسيع
        const toggleBtn = machineItem.querySelector('.toggle-machine');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                machineItem.classList.toggle('open');
            });
        }
        
        // زر الحذف
        const deleteBtn = machineItem.querySelector('.delete-machine');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.removeMachine(index);
            });
        }
        
        // تحديث العنوان عند تغيير الاسم
        const nameInput = machineItem.querySelector('.machine-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                const title = machineItem.querySelector('.machine-title');
                title.textContent = e.target.value || 'آلة / معدة جديدة';
            });
        }
        
        // أحداث اختيار الحالة
        const conditionOptions = machineItem.querySelectorAll('.condition-option');
        conditionOptions.forEach(option => {
            option.addEventListener('click', () => {
                conditionOptions.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                option.querySelector('input').checked = true;
            });
        });
        
        // رفع الصور
        const imageInput = machineItem.querySelector('.machine-images-input');
        const imagePreview = machineItem.querySelector('.machine-images-preview');
        
        if (imageInput && imagePreview) {
            imageInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                const currentImages = this.state.machines[index]?.images || [];
                
                if (currentImages.length + files.length > 10) {
                    Utils.showToast('الحد الأقصى 10 صور', 'warning');
                    return;
                }
                
                for (const file of files) {
                    if (file.size > 5 * 1024 * 1024) {
                        Utils.showToast(`الملف ${file.name} كبير جداً`, 'error');
                        continue;
                    }
                    
                    try {
                        const compressed = await Utils.compressImage(file);
                        currentImages.push(compressed);
                    } catch (err) {
                        console.error('Error compressing image:', err);
                    }
                }
                
                if (!this.state.machines[index]) {
                    this.state.machines[index] = {};
                }
                this.state.machines[index].images = currentImages;
                
                this.renderImagePreviews(imagePreview, currentImages, index);
            });
        }
        
        // جمع البيانات عند التغيير
        const inputs = machineItem.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.collectMachineData(machineItem, index);
                this.updateTotalDisplay();
            });
        });
    },

    /**
     * عرض معاينات الصور
     */
    renderImagePreviews: function(container, images, machineIndex) {
        container.innerHTML = images.map((img, imgIndex) => `
            <div class="image-preview-item">
                <img src="${img}" alt="صورة ${imgIndex + 1}">
                <button type="button" class="remove-btn" onclick="FormHandler.removeImage(${machineIndex}, ${imgIndex})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    },

    /**
     * إزالة صورة
     */
    removeImage: function(machineIndex, imageIndex) {
        if (this.state.machines[machineIndex]?.images) {
            this.state.machines[machineIndex].images.splice(imageIndex, 1);
            
            const machineItem = document.querySelector(`.machine-item[data-machine-index="${machineIndex}"]`);
            const imagePreview = machineItem?.querySelector('.machine-images-preview');
            
            if (imagePreview) {
                this.renderImagePreviews(imagePreview, this.state.machines[machineIndex].images, machineIndex);
            }
        }
    },

    /**
     * جمع بيانات آلة
     */
    collectMachineData: function(machineItem, index) {
        const data = {
            type: machineItem.querySelector('.machine-type')?.value || '',
            name: machineItem.querySelector('.machine-name')?.value || '',
            model: machineItem.querySelector('.machine-model')?.value || '',
            serial: machineItem.querySelector('.machine-serial')?.value || '',
            year: machineItem.querySelector('.machine-year')?.value || '',
            country: machineItem.querySelector('.machine-country')?.value || '',
            manufacturer: machineItem.querySelector('.machine-manufacturer')?.value || '',
            location: machineItem.querySelector('.machine-location')?.value || '',
            condition: machineItem.querySelector('.condition-selector input:checked')?.value || '',
            hours: machineItem.querySelector('.machine-hours')?.value || '',
            hoursUnit: machineItem.querySelector('.machine-hours-unit')?.value || 'hours',
            usage: machineItem.querySelector('.machine-usage')?.value || '',
            value: machineItem.querySelector('.machine-value')?.value || 0,
            notes: machineItem.querySelector('.machine-notes')?.value || '',
            images: this.state.machines[index]?.images || []
        };
        
        this.state.machines[index] = data;
    },

    /**
     * حذف آلة
     */
    removeMachine: function(index) {
        if (this.state.machines.length <= 1) {
            Utils.showToast('يجب وجود آلة واحدة على الأقل', 'warning');
            return;
        }
        
        Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذه الآلة؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                // حذف من المصفوفة
                this.state.machines.splice(index, 1);
                
                // إعادة بناء القائمة
                this.rebuildMachinesList();
                
                // تحديث الإجمالي
                this.updateTotalDisplay();
            }
        });
    },

    /**
     * إعادة بناء قائمة الآلات
     */
    rebuildMachinesList: function() {
        const container = document.getElementById('machinesContainer');
        container.innerHTML = '';
        
        const machinesBackup = [...this.state.machines];
        this.state.machines = [];
        
        machinesBackup.forEach((data, index) => {
            this.addMachine();
            
            const machineItem = container.querySelector(`.machine-item[data-machine-index="${index}"]`);
            if (machineItem) {
                this.fillMachineData(machineItem, data);
                this.state.machines[index] = data;
            }
        });
        
        this.updateMachineCount();
    },

    /**
     * تعبئة بيانات آلة
     */
    fillMachineData: function(machineItem, data) {
        if (!data) return;
        
        const setVal = (selector, value) => {
            const el = machineItem.querySelector(selector);
            if (el) el.value = value || '';
        };
        
        setVal('.machine-type', data.type);
        setVal('.machine-name', data.name);
        setVal('.machine-model', data.model);
        setVal('.machine-serial', data.serial);
        setVal('.machine-year', data.year);
        setVal('.machine-country', data.country);
        setVal('.machine-manufacturer', data.manufacturer);
        setVal('.machine-location', data.location);
        setVal('.machine-hours', data.hours);
        setVal('.machine-hours-unit', data.hoursUnit);
        setVal('.machine-usage', data.usage);
        setVal('.machine-value', data.value);
        setVal('.machine-notes', data.notes);
        
        // تحديث العنوان
        const title = machineItem.querySelector('.machine-title');
        if (title && data.name) title.textContent = data.name;
        
        // الحالة
        if (data.condition) {
            const conditionInput = machineItem.querySelector(`.condition-selector input[value="${data.condition}"]`);
            if (conditionInput) {
                conditionInput.checked = true;
                conditionInput.closest('.condition-option')?.classList.add('selected');
            }
        }
        
        // الصور
        if (data.images?.length > 0) {
            const imagePreview = machineItem.querySelector('.machine-images-preview');
            const index = parseInt(machineItem.dataset.machineIndex);
            if (imagePreview) {
                this.renderImagePreviews(imagePreview, data.images, index);
            }
        }
    },

    /**
     * تحديث عدد الآلات
     */
    updateMachineCount: function() {
        const items = document.querySelectorAll('.machine-item');
        items.forEach((item, index) => {
            item.dataset.machineIndex = index;
            item.querySelector('.machine-number').textContent = index + 1;
            
            // تحديث اسم الراديو
            const conditionInputs = item.querySelectorAll('.condition-selector input');
            conditionInputs.forEach(input => {
                input.name = `machine_${index}_condition`;
            });
        });
    },

    /**
     * تحديث عرض الإجمالي
     */
    updateTotalDisplay: function() {
        const total = this.state.machines.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0);
        const currency = document.getElementById('currency')?.value || 'SAR';
        
        const totalDisplay = document.getElementById('totalValueDisplay');
        if (totalDisplay) {
            totalDisplay.querySelector('.in-numbers').innerHTML = 
                `${total.toLocaleString('ar-SA', {minimumFractionDigits: 2})} <span id="currencySymbol">${currency === 'SAR' ? 'ر.س' : currency}</span>`;
            totalDisplay.querySelector('.in-words').textContent = 
                Utils.numberToArabicWords(total) + ' ' + (currency === 'SAR' ? 'ريال سعودي' : currency) + ' فقط لا غير';
        }
    },

    /**
     * عرض محتوى المراجعة
     */
    showReviewContent: function() {
        const reviewContent = document.getElementById('reviewContent');
        if (!reviewContent) return;
        
        // جمع جميع البيانات
        for (let i = 1; i <= 5; i++) {
            this.collectStepData(i);
        }
        
        const data = this.state.reportData;
        const total = this.state.machines.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0);
        
        reviewContent.innerHTML = `
            <div class="review-section">
                <h4><i class="fas fa-clipboard-list"></i> نوع التقييم</h4>
                <p>${Utils.getEvaluationTypeName(data.evaluationType)}</p>
            </div>
            
            <div class="review-section">
                <h4><i class="fas fa-project-diagram"></i> معلومات المشروع</h4>
                <table class="info-table">
                    <tr><td>رقم المشروع</td><td>${data.projectNumber || Utils.generateReportNumber()}</td></tr>
                    <tr><td>تاريخ التقييم</td><td>${data.evaluationDate}</td></tr>
                    <tr><td>المقيّم</td><td>${data.evaluatorName}</td></tr>
                    <tr><td>الجهة الطالبة</td><td>${data.requestingEntity}</td></tr>
                </table>
            </div>
            
            <div class="review-section">
                <h4><i class="fas fa-user"></i> معلومات العميل</h4>
                <table class="info-table">
                    <tr><td>الاسم</td><td>${data.clientName}</td></tr>
                    <tr><td>رقم الهوية/السجل</td><td>${data.clientId}</td></tr>
                    <tr><td>الجوال</td><td>${data.clientPhone}</td></tr>
                    <tr><td>البريد</td><td>${data.clientEmail || '-'}</td></tr>
                    <tr><td>العنوان</td><td>${data.clientCity} - ${data.clientAddress}</td></tr>
                </table>
            </div>
            
            <div class="review-section">
                <h4><i class="fas fa-cogs"></i> الآلات (${this.state.machines.length})</h4>
                ${this.state.machines.map((m, i) => `
                    <div class="review-machine">
                        <strong>${i + 1}. ${m.name || m.type}</strong>
                        <span class="text-muted"> - ${m.manufacturer} ${m.model} (${m.year})</span>
                        <span class="text-primary" style="float:left;">${Utils.formatCurrency(m.value)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="review-section">
                <h4><i class="fas fa-coins"></i> ملخص التقييم</h4>
                <table class="info-table">
                    <tr><td>طريقة التقييم</td><td>${Utils.getValuationMethodName(data.valuationMethod)}</td></tr>
                    <tr><td>القيمة الإجمالية</td><td class="text-primary" style="font-size:1.2em;font-weight:bold;">${Utils.formatCurrency(total)}</td></tr>
                    <tr><td>بالأحرف</td><td>${Utils.numberToArabicWords(total)} ريال سعودي فقط لا غير</td></tr>
                </table>
            </div>
        `;
    },

    /**
     * معاينة التقرير
     */
    previewReport: function() {
        // حفظ التقرير كمسودة أولاً
        const report = this.prepareReportData();
        report.status = 'draft';
        const saved = Storage.saveReport(report);
        
        if (saved) {
            window.open(`preview.html?id=${saved.id}`, '_blank');
        }
    },

    /**
     * إرسال التقرير
     */
    submitReport: function() {
        const report = this.prepareReportData();
        report.status = 'completed';
        
        const saved = Storage.saveReport(report);
        
        if (saved) {
            // حذف المسودة
            Storage.deleteDraft(this.state.editId || 'current');
            
            Swal.fire({
                icon: 'success',
                title: 'تم إنشاء التقرير',
                text: 'تم حفظ التقرير بنجاح',
                showCancelButton: true,
                confirmButtonText: 'عرض التقرير',
                cancelButtonText: 'تقرير جديد'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = `preview.html?id=${saved.id}`;
                } else {
                    window.location.reload();
                }
            });
        } else {
            Swal.fire('خطأ', 'حدث خطأ أثناء حفظ التقرير', 'error');
        }
    },

    /**
     * تحضير بيانات التقرير
     */
    prepareReportData: function() {
        // جمع جميع البيانات
        for (let i = 1; i <= 5; i++) {
            this.collectStepData(i);
        }
        
        const report = { ...this.state.reportData };
        
        // توليد رقم المشروع إذا لم يكن موجوداً
        if (!report.projectNumber) {
            report.projectNumber = Utils.generateReportNumber();
        }
        
        // حساب الإجمالي
        report.totalValue = this.state.machines.reduce((sum, m) => sum + (parseFloat(m.value) || 0), 0);
        report.machines = this.state.machines;
        
        // إضافة المعرف إذا كان تعديلاً
        if (this.state.editId) {
            report.id = this.state.editId;
        }
        
        return report;
    },

    /**
     * حفظ كمسودة
     */
    saveDraft: function(showMessage = false) {
        const report = this.prepareReportData();
        report.status = 'draft';
        
        Storage.saveDraft(report);
        
        // تحديث حالة الحفظ التلقائي
        const status = document.getElementById('autoSaveStatus');
        if (status) {
            status.classList.remove('saving');
            status.classList.add('saved');
            status.innerHTML = '<i class="fas fa-check"></i> <span>تم الحفظ</span>';
            
            setTimeout(() => {
                status.classList.remove('saved');
                status.innerHTML = '<i class="fas fa-save"></i> <span>الحفظ التلقائي مفعّل</span>';
            }, 2000);
        }
        
        if (showMessage) {
            Utils.showToast('تم حفظ المسودة', 'success');
        }
    },

    /**
     * تحميل مسودة
     */
    loadDraft: function() {
        if (this.state.isEditing) return;
        
        const draft = Storage.getDraft('current');
        if (!draft) return;
        
        Swal.fire({
            title: 'استعادة المسودة',
            text: 'توجد مسودة محفوظة. هل تريد استعادتها؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم، استعد',
            cancelButtonText: 'لا، ابدأ من جديد'
        }).then((result) => {
            if (result.isConfirmed) {
                this.fillFormData(draft);
            } else {
                Storage.deleteDraft('current');
            }
        });
    },

    /**
     * تعبئة بيانات النموذج
     */
    fillFormData: function(data) {
        this.state.reportData = data;
        
        // نوع التقييم
        if (data.evaluationType) {
            const card = document.querySelector(`input[name="evaluationType"][value="${data.evaluationType}"]`)?.closest('.choice-card');
            if (card) {
                card.click();
            }
        }
        
        // معلومات المشروع
        this.setInputValue('projectNumber', data.projectNumber);
        this.setInputValue('evaluationDate', data.evaluationDate);
        this.setInputValue('evaluatorName', data.evaluatorName);
        this.setInputValue('requestingEntity', data.requestingEntity);
        
        // معلومات العميل
        this.setInputValue('clientName', data.clientName);
        this.setInputValue('clientId', data.clientId);
        this.setInputValue('clientPhone', data.clientPhone);
        this.setInputValue('clientEmail', data.clientEmail);
        this.setInputValue('clientCity', data.clientCity);
        this.setInputValue('clientAddress', data.clientAddress);
        
        // الآلات
        if (data.machines?.length > 0) {
            const container = document.getElementById('machinesContainer');
            container.innerHTML = '';
            this.state.machines = [];
            
            data.machines.forEach((machineData, index) => {
                this.addMachine();
                const machineItem = container.querySelector(`.machine-item[data-machine-index="${index}"]`);
                if (machineItem) {
                    this.fillMachineData(machineItem, machineData);
                    this.state.machines[index] = machineData;
                }
            });
        }
        
        // التقييم
        this.setInputValue('valuationMethod', data.valuationMethod);
        this.setInputValue('currency', data.currency);
        this.setInputValue('valuationBasis', data.valuationBasis);
        this.setInputValue('recommendations', data.recommendations);
        this.setInputValue('generalNotes', data.generalNotes);
        
        // تحديث الإجمالي
        this.updateTotalDisplay();
    },

    /**
     * تعيين قيمة حقل
     */
    setInputValue: function(id, value) {
        const el = document.getElementById(id);
        if (el && value) el.value = value;
    },

    /**
     * تهيئة الحفظ التلقائي
     */
    initAutoSave: function() {
        const settings = Storage.getSettings() || {};
        
        if (settings.autoSaveEnabled !== false) {
            this.state.autoSaveTimer = setInterval(() => {
                this.saveDraft(false);
            }, 30000); // كل 30 ثانية
        }
    },

    /**
     * فحص وضع التعديل
     */
    checkEditMode: function() {
        const params = Utils.getUrlParams();
        const editId = params.get('edit');
        
        if (editId) {
            const report = Storage.getReport(editId);
            if (report) {
                this.state.isEditing = true;
                this.state.editId = editId;
                this.fillFormData(report);
            }
        }
    },

    /**
     * فحص نوع التقييم من URL
     */
    checkEvaluationType: function() {
        const params = Utils.getUrlParams();
        const type = params.get('type');
        
        if (type) {
            const card = document.querySelector(`input[name="evaluationType"][value="${type}"]`)?.closest('.choice-card');
            if (card) {
                card.click();
            }
        }
    }
};

// جعل FormHandler متاحاً عالمياً
window.FormHandler = FormHandler;
