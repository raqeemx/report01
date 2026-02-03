/**
 * نظام تقييم الآلات والمعدات
 * ملف التحقق من المدخلات (Validation)
 */

const Validation = {
    /**
     * رسائل الخطأ
     */
    messages: {
        required: 'هذا الحقل مطلوب',
        email: 'يرجى إدخال بريد إلكتروني صحيح',
        phone: 'يرجى إدخال رقم جوال صحيح (05xxxxxxxx)',
        number: 'يرجى إدخال رقم صحيح',
        minLength: 'يجب أن يكون الحقل %s حرف على الأقل',
        maxLength: 'يجب أن يكون الحقل %s حرف كحد أقصى',
        min: 'يجب أن تكون القيمة %s على الأقل',
        max: 'يجب أن تكون القيمة %s كحد أقصى',
        pattern: 'الصيغة غير صحيحة',
        fileSize: 'حجم الملف يجب أن يكون أقل من %s MB',
        fileType: 'نوع الملف غير مسموح'
    },

    /**
     * قواعد التحقق
     */
    rules: {
        required: (value) => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'string') return value.trim().length > 0;
            return value !== null && value !== undefined;
        },
        
        email: (value) => {
            if (!value) return true;
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(value);
        },
        
        phone: (value) => {
            if (!value) return true;
            const re = /^(05|5)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
            return re.test(value.replace(/\s/g, ''));
        },
        
        number: (value) => {
            if (!value && value !== 0) return true;
            return !isNaN(parseFloat(value));
        },
        
        integer: (value) => {
            if (!value && value !== 0) return true;
            return Number.isInteger(Number(value));
        },
        
        minLength: (value, min) => {
            if (!value) return true;
            return value.length >= min;
        },
        
        maxLength: (value, max) => {
            if (!value) return true;
            return value.length <= max;
        },
        
        min: (value, min) => {
            if (!value && value !== 0) return true;
            return parseFloat(value) >= min;
        },
        
        max: (value, max) => {
            if (!value && value !== 0) return true;
            return parseFloat(value) <= max;
        },
        
        pattern: (value, pattern) => {
            if (!value) return true;
            return new RegExp(pattern).test(value);
        },
        
        url: (value) => {
            if (!value) return true;
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        
        date: (value) => {
            if (!value) return true;
            const date = new Date(value);
            return !isNaN(date.getTime());
        },
        
        year: (value) => {
            if (!value) return true;
            const year = parseInt(value);
            return year >= 1900 && year <= new Date().getFullYear() + 5;
        }
    },

    /**
     * التحقق من حقل واحد
     */
    validateField: function(input, rules = {}) {
        const value = input.value;
        const errors = [];
        
        // الحصول على القواعد من data attributes
        if (input.required || rules.required) {
            if (!this.rules.required(value)) {
                errors.push(this.messages.required);
            }
        }
        
        if (input.type === 'email' || rules.email) {
            if (!this.rules.email(value)) {
                errors.push(this.messages.email);
            }
        }
        
        if (input.type === 'tel' || rules.phone) {
            if (!this.rules.phone(value)) {
                errors.push(this.messages.phone);
            }
        }
        
        if (input.type === 'number' || rules.number) {
            if (!this.rules.number(value)) {
                errors.push(this.messages.number);
            }
        }
        
        if (input.minLength || rules.minLength) {
            const min = input.minLength || rules.minLength;
            if (!this.rules.minLength(value, min)) {
                errors.push(this.messages.minLength.replace('%s', min));
            }
        }
        
        if (input.maxLength || rules.maxLength) {
            const max = input.maxLength || rules.maxLength;
            if (!this.rules.maxLength(value, max)) {
                errors.push(this.messages.maxLength.replace('%s', max));
            }
        }
        
        if (input.min || rules.min) {
            const min = input.min || rules.min;
            if (!this.rules.min(value, min)) {
                errors.push(this.messages.min.replace('%s', min));
            }
        }
        
        if (input.max || rules.max) {
            const max = input.max || rules.max;
            if (!this.rules.max(value, max)) {
                errors.push(this.messages.max.replace('%s', max));
            }
        }
        
        if (input.pattern || rules.pattern) {
            const pattern = input.pattern || rules.pattern;
            if (!this.rules.pattern(value, pattern)) {
                errors.push(this.messages.pattern);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * التحقق من نموذج كامل
     */
    validateForm: function(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        const errors = {};
        let isValid = true;
        
        inputs.forEach(input => {
            const result = this.validateField(input);
            
            if (!result.valid) {
                isValid = false;
                errors[input.name || input.id] = result.errors;
                this.showFieldError(input, result.errors[0]);
            } else {
                this.clearFieldError(input);
            }
        });
        
        return {
            valid: isValid,
            errors: errors
        };
    },

    /**
     * التحقق من خطوة في النموذج
     */
    validateStep: function(stepElement) {
        const inputs = stepElement.querySelectorAll('input:not([type="hidden"]), select, textarea');
        const errors = {};
        let isValid = true;
        
        inputs.forEach(input => {
            // تخطي الحقول المخفية أو المعطلة
            if (input.offsetParent === null || input.disabled) return;
            
            const result = this.validateField(input);
            
            if (!result.valid) {
                isValid = false;
                errors[input.name || input.id] = result.errors;
                this.showFieldError(input, result.errors[0]);
            } else {
                this.clearFieldError(input);
            }
        });
        
        return {
            valid: isValid,
            errors: errors
        };
    },

    /**
     * عرض خطأ الحقل
     */
    showFieldError: function(input, message) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
            
            let errorElement = formGroup.querySelector('.form-error');
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'form-error';
                input.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        input.classList.add('error');
    },

    /**
     * مسح خطأ الحقل
     */
    clearFieldError: function(input) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
            
            const errorElement = formGroup.querySelector('.form-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
        
        input.classList.remove('error');
    },

    /**
     * مسح جميع الأخطاء في النموذج
     */
    clearFormErrors: function(form) {
        const inputs = form.querySelectorAll('.error');
        inputs.forEach(input => this.clearFieldError(input));
        
        const errorMessages = form.querySelectorAll('.form-error');
        errorMessages.forEach(msg => msg.style.display = 'none');
        
        const formGroups = form.querySelectorAll('.has-error');
        formGroups.forEach(group => group.classList.remove('has-error'));
    },

    /**
     * التحقق من ملف
     */
    validateFile: function(file, options = {}) {
        const {
            maxSize = 5 * 1024 * 1024, // 5MB
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
        } = options;
        
        const errors = [];
        
        if (file.size > maxSize) {
            errors.push(this.messages.fileSize.replace('%s', maxSize / (1024 * 1024)));
        }
        
        if (!allowedTypes.includes(file.type)) {
            errors.push(this.messages.fileType);
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * التحقق من مجموعة ملفات
     */
    validateFiles: function(files, options = {}) {
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            const result = this.validateFile(files[i], options);
            if (!result.valid) {
                errors.push({
                    file: files[i].name,
                    errors: result.errors
                });
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * تهيئة التحقق التلقائي
     */
    initAutoValidation: function(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // التحقق عند مغادرة الحقل
            input.addEventListener('blur', () => {
                const result = this.validateField(input);
                if (!result.valid) {
                    this.showFieldError(input, result.errors[0]);
                } else {
                    this.clearFieldError(input);
                }
            });
            
            // مسح الخطأ عند البدء في الكتابة
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.clearFieldError(input);
                }
            });
        });
    },

    /**
     * التحقق من بيانات آلة
     */
    validateMachine: function(machineData) {
        const errors = {};
        
        if (!machineData.type) errors.type = 'نوع الآلة مطلوب';
        if (!machineData.name) errors.name = 'اسم الآلة مطلوب';
        if (!machineData.model) errors.model = 'الموديل مطلوب';
        if (!machineData.serial) errors.serial = 'الرقم التسلسلي مطلوب';
        if (!machineData.year) errors.year = 'سنة الصنع مطلوبة';
        if (!machineData.country) errors.country = 'بلد المنشأ مطلوب';
        if (!machineData.manufacturer) errors.manufacturer = 'الشركة المصنعة مطلوبة';
        if (!machineData.location) errors.location = 'الموقع مطلوب';
        if (!machineData.condition) errors.condition = 'الحالة مطلوبة';
        if (!machineData.usage) errors.usage = 'الاستخدام مطلوب';
        if (!machineData.value) errors.value = 'القيمة مطلوبة';
        
        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
};

// جعل Validation متاحاً عالمياً
window.Validation = Validation;
