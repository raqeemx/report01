/**
 * نظام تقييم الآلات والمعدات
 * ملف توليد تقارير Word
 * يستخدم مكتبة docx لإنشاء ملفات .docx
 */

const WordGenerator = {
    /**
     * تحميل مكتبة docx ديناميكياً
     */
    loadDocxLibrary: function() {
        return new Promise((resolve, reject) => {
            if (typeof docx !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    /**
     * توليد تقرير Word
     */
    generateReport: async function(report) {
        try {
            await this.loadDocxLibrary();
        } catch (e) {
            console.error('Failed to load docx library:', e);
            Utils.showToast('فشل تحميل مكتبة Word', 'error');
            return false;
        }

        const settings = Storage.getSettings() || {};
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
                WidthType, AlignmentType, HeadingLevel, BorderStyle, 
                PageOrientation, convertInchesToTwip } = docx;

        // إنشاء المستند
        const doc = new Document({
            styles: {
                paragraphStyles: [
                    {
                        id: 'rtlParagraph',
                        name: 'RTL Paragraph',
                        basedOn: 'Normal',
                        next: 'Normal',
                        run: {
                            font: 'Arial',
                            size: 24,
                            rightToLeft: true
                        },
                        paragraph: {
                            alignment: AlignmentType.RIGHT,
                            bidirectional: true
                        }
                    }
                ]
            },
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.75),
                            right: convertInchesToTwip(0.75),
                            bottom: convertInchesToTwip(0.75),
                            left: convertInchesToTwip(0.75)
                        }
                    }
                },
                children: [
                    // ترويسة الشركة
                    ...this.createHeader(settings),
                    
                    // عنوان التقرير
                    this.createTitle(report),
                    
                    // الفاصل
                    this.createSpacer(),
                    
                    // معلومات التقرير
                    ...this.createReportInfo(report),
                    
                    // معلومات العميل
                    ...this.createClientInfo(report),
                    
                    // نطاق العمل
                    ...this.createScopeInfo(report),
                    
                    // تفاصيل الآلات
                    ...this.createMachinesSection(report),
                    
                    // ملخص القيم
                    ...this.createValuesSummary(report),
                    
                    // أساس التقييم
                    ...this.createValuationBasis(report),
                    
                    // التوصيات
                    ...this.createRecommendations(report),
                    
                    // التوقيعات
                    ...this.createSignatures(report, settings)
                ]
            }]
        });

        // تصدير المستند
        try {
            const blob = await Packer.toBlob(doc);
            const filename = `تقرير_${report.projectNumber || 'تقييم'}.docx`;
            this.downloadBlob(blob, filename);
            return true;
        } catch (e) {
            console.error('Error generating Word document:', e);
            Utils.showToast('حدث خطأ أثناء إنشاء ملف Word', 'error');
            return false;
        }
    },

    /**
     * إنشاء ترويسة الشركة
     */
    createHeader: function(settings) {
        const { Paragraph, TextRun, AlignmentType } = docx;
        
        return [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                    new TextRun({
                        text: settings.companyName || 'اسم الشركة',
                        bold: true,
                        size: 36,
                        font: 'Arial',
                        rightToLeft: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                    new TextRun({
                        text: settings.companyAddress || 'العنوان',
                        size: 22,
                        font: 'Arial',
                        rightToLeft: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                    new TextRun({
                        text: `${settings.companyPhone || ''} | ${settings.companyEmail || ''}`,
                        size: 22,
                        font: 'Arial',
                        rightToLeft: true
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                children: [
                    new TextRun({
                        text: `رقم الترخيص: ${settings.companyLicense || '-'}`,
                        size: 20,
                        font: 'Arial',
                        rightToLeft: true
                    })
                ]
            }),
            this.createDivider()
        ];
    },

    /**
     * إنشاء عنوان التقرير
     */
    createTitle: function(report) {
        const { Paragraph, TextRun, AlignmentType } = docx;
        const typeName = Utils.getEvaluationTypeName(report.evaluationType);
        
        return new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 400, after: 400 },
            children: [
                new TextRun({
                    text: `تقرير ${typeName}`,
                    bold: true,
                    size: 40,
                    font: 'Arial',
                    rightToLeft: true
                })
            ]
        });
    },

    /**
     * إنشاء معلومات التقرير
     */
    createReportInfo: function(report) {
        const { Paragraph, TextRun, AlignmentType } = docx;
        
        return [
            this.createSectionTitle('معلومات التقرير'),
            this.createInfoTable([
                ['رقم التقرير', report.projectNumber || '-'],
                ['تاريخ التقييم', Utils.formatDate(report.evaluationDate)],
                ['المقيّم', report.evaluatorName || '-'],
                ['الجهة الطالبة', report.requestingEntity || '-']
            ])
        ];
    },

    /**
     * إنشاء معلومات العميل
     */
    createClientInfo: function(report) {
        return [
            this.createSectionTitle('معلومات العميل'),
            this.createInfoTable([
                ['اسم العميل', report.clientName || '-'],
                ['رقم الهوية / السجل', report.clientId || '-'],
                ['رقم الجوال', report.clientPhone || '-'],
                ['البريد الإلكتروني', report.clientEmail || '-'],
                ['العنوان', `${report.clientCity || ''} - ${report.clientAddress || ''}`]
            ])
        ];
    },

    /**
     * إنشاء نطاق العمل
     */
    createScopeInfo: function(report) {
        const typeName = Utils.getEvaluationTypeName(report.evaluationType);
        const methodName = Utils.getValuationMethodName(report.valuationMethod);
        
        return [
            this.createSectionTitle('نطاق العمل والغرض من التقييم'),
            this.createInfoTable([
                ['الغرض من التقييم', typeName],
                ['الجهة الطالبة', report.requestingEntity || '-'],
                ['طريقة التقييم', methodName]
            ])
        ];
    },

    /**
     * إنشاء قسم الآلات
     */
    createMachinesSection: function(report) {
        const { Paragraph, TextRun, AlignmentType } = docx;
        const machines = report.machines || [];
        const sections = [this.createSectionTitle('تفاصيل الآلات المقيّمة')];
        
        machines.forEach((machine, index) => {
            sections.push(
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    spacing: { before: 200, after: 100 },
                    children: [
                        new TextRun({
                            text: `${index + 1}. ${machine.name || machine.type || 'آلة غير محددة'}`,
                            bold: true,
                            size: 26,
                            font: 'Arial',
                            rightToLeft: true
                        })
                    ]
                }),
                this.createInfoTable([
                    ['النوع', machine.type || '-'],
                    ['الموديل', machine.model || '-'],
                    ['الرقم التسلسلي', machine.serial || '-'],
                    ['سنة الصنع', machine.year || '-'],
                    ['الشركة المصنعة', machine.manufacturer || '-'],
                    ['بلد المنشأ', machine.country || '-'],
                    ['الحالة', Utils.getConditionName(machine.condition)],
                    ['الاستخدام', Utils.getUsageName(machine.usage)],
                    ['ساعات التشغيل', `${machine.hours || '-'} ${machine.hoursUnit || ''}`],
                    ['الموقع', machine.location || '-'],
                    ['القيمة المقدرة', Utils.formatCurrency(machine.value)]
                ])
            );
            
            if (machine.notes) {
                sections.push(
                    new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        bidirectional: true,
                        children: [
                            new TextRun({
                                text: `ملاحظات: ${machine.notes}`,
                                size: 22,
                                font: 'Arial',
                                rightToLeft: true,
                                italics: true
                            })
                        ]
                    })
                );
            }
        });
        
        return sections;
    },

    /**
     * إنشاء ملخص القيم
     */
    createValuesSummary: function(report) {
        const { Paragraph, TextRun, Table, TableRow, TableCell, 
                WidthType, AlignmentType, BorderStyle } = docx;
        const machines = report.machines || [];
        let total = 0;
        
        const rows = [
            new TableRow({
                children: [
                    this.createTableHeader('#'),
                    this.createTableHeader('وصف الآلة'),
                    this.createTableHeader('الحالة'),
                    this.createTableHeader('القيمة المقدرة')
                ]
            })
        ];
        
        machines.forEach((machine, index) => {
            const value = parseFloat(machine.value) || 0;
            total += value;
            
            rows.push(new TableRow({
                children: [
                    this.createTableCell(String(index + 1)),
                    this.createTableCell(machine.name || machine.type || '-'),
                    this.createTableCell(Utils.getConditionName(machine.condition)),
                    this.createTableCell(Utils.formatCurrency(value))
                ]
            }));
        });
        
        // صف الإجمالي
        rows.push(new TableRow({
            children: [
                this.createTableCell('الإجمالي', true, 3),
                this.createTableCell(Utils.formatCurrency(total), true)
            ]
        }));
        
        return [
            this.createSectionTitle('ملخص القيم المقدرة'),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: rows
            }),
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { before: 200, after: 200 },
                children: [
                    new TextRun({
                        text: `${Utils.numberToArabicWords(total)} ريال سعودي فقط لا غير`,
                        bold: true,
                        size: 24,
                        font: 'Arial',
                        rightToLeft: true
                    })
                ]
            })
        ];
    },

    /**
     * إنشاء أساس التقييم
     */
    createValuationBasis: function(report) {
        const { Paragraph, TextRun, AlignmentType } = docx;
        
        return [
            this.createSectionTitle('أساس وطريقة التقييم'),
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                children: [
                    new TextRun({
                        text: report.valuationBasis || '-',
                        size: 24,
                        font: 'Arial',
                        rightToLeft: true
                    })
                ]
            })
        ];
    },

    /**
     * إنشاء التوصيات
     */
    createRecommendations: function(report) {
        const { Paragraph, TextRun, AlignmentType } = docx;
        const sections = [];
        
        if (report.recommendations) {
            sections.push(
                this.createSectionTitle('التوصيات والملاحظات'),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [
                        new TextRun({
                            text: report.recommendations,
                            size: 24,
                            font: 'Arial',
                            rightToLeft: true
                        })
                    ]
                })
            );
        }
        
        if (report.generalNotes) {
            sections.push(
                this.createSectionTitle('ملاحظات عامة'),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [
                        new TextRun({
                            text: report.generalNotes,
                            size: 24,
                            font: 'Arial',
                            rightToLeft: true
                        })
                    ]
                })
            );
        }
        
        return sections;
    },

    /**
     * إنشاء التوقيعات
     */
    createSignatures: function(report, settings) {
        const { Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } = docx;
        
        return [
            this.createSpacer(),
            this.createDivider(),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: this.noBorders(),
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: 'توقيع المقيّم',
                                                bold: true,
                                                size: 24,
                                                font: 'Arial',
                                                rightToLeft: true
                                            })
                                        ]
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 400 },
                                        children: [
                                            new TextRun({
                                                text: '________________________',
                                                size: 24,
                                                font: 'Arial'
                                            })
                                        ]
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: report.evaluatorName || '-',
                                                size: 22,
                                                font: 'Arial',
                                                rightToLeft: true
                                            })
                                        ]
                                    })
                                ]
                            }),
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                borders: this.noBorders(),
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: 'ختم الشركة',
                                                bold: true,
                                                size: 24,
                                                font: 'Arial',
                                                rightToLeft: true
                                            })
                                        ]
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 400 },
                                        children: [
                                            new TextRun({
                                                text: '________________________',
                                                size: 24,
                                                font: 'Arial'
                                            })
                                        ]
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: Utils.formatDate(report.evaluationDate),
                                                size: 22,
                                                font: 'Arial',
                                                rightToLeft: true
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ];
    },

    /**
     * دوال مساعدة
     */
    createSectionTitle: function(text) {
        const { Paragraph, TextRun, AlignmentType, HeadingLevel } = docx;
        
        return new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 300, after: 150 },
            children: [
                new TextRun({
                    text: text,
                    bold: true,
                    size: 28,
                    font: 'Arial',
                    rightToLeft: true,
                    color: '1e3a8a'
                })
            ]
        });
    },

    createInfoTable: function(data) {
        const { Table, TableRow, WidthType } = docx;
        
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: data.map(row => new TableRow({
                children: [
                    this.createTableCell(row[0], true),
                    this.createTableCell(row[1])
                ]
            }))
        });
    },

    createTableHeader: function(text) {
        const { TableCell, Paragraph, TextRun, AlignmentType, WidthType, ShadingType } = docx;
        
        return new TableCell({
            shading: { fill: '1e3a8a', type: ShadingType.SOLID },
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: text,
                            bold: true,
                            size: 22,
                            font: 'Arial',
                            color: 'FFFFFF',
                            rightToLeft: true
                        })
                    ]
                })
            ]
        });
    },

    createTableCell: function(text, bold = false, colSpan = 1) {
        const { TableCell, Paragraph, TextRun, AlignmentType, VerticalAlign } = docx;
        
        const cell = new TableCell({
            columnSpan: colSpan,
            verticalAlign: VerticalAlign.CENTER,
            children: [
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    bidirectional: true,
                    children: [
                        new TextRun({
                            text: text || '-',
                            bold: bold,
                            size: 22,
                            font: 'Arial',
                            rightToLeft: true
                        })
                    ]
                })
            ]
        });
        
        return cell;
    },

    createSpacer: function() {
        const { Paragraph } = docx;
        return new Paragraph({ spacing: { before: 200, after: 200 }, children: [] });
    },

    createDivider: function() {
        const { Paragraph, TextRun, AlignmentType } = docx;
        return new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
                new TextRun({
                    text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                    size: 16,
                    color: '1e3a8a'
                })
            ]
        });
    },

    noBorders: function() {
        const { BorderStyle } = docx;
        return {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
        };
    },

    downloadBlob: function(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// جعل WordGenerator متاحاً عالمياً
window.WordGenerator = WordGenerator;
