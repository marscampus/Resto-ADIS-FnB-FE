import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useFormik } from 'formik';
import { RadioButton } from 'primereact/radiobutton';
import { Dropdown } from 'primereact/dropdown';
import { TabPanel, TabView } from 'primereact/tabview';
import { getSessionServerSide } from '../../../../utilities/servertool';
import postData from '../../../../lib/Axios';
import jsPDF from 'jspdf';
import { getEmail, getUserName, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../../component/PDFViewer';
import * as XLSX from 'xlsx';
import { BlockUI } from 'primereact/blockui';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function Rekening() {
    const apiEndPointGet = '/api/rekening/get';
    const apiEndPointStore = '/api/rekening/store';
    const apiEndPointUpdate = '/api/rekening/update';
    const apiEndPointDelete = '/api/rekening/delete';
    const apiEndPointKonversi = '/api/rekening/konversi';
    const toast = useRef(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusAction, setStatusAction] = useState(null);
    const [allRekening, setAllRekening] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const fileName = `laporan-daftar-rekening-${new Date().toISOString().slice(0, 10)}`;
    const tipeRekeningOptions = [
        { name: '1.', label: 'Aset' },
        { name: '2.', label: 'Kewajiban' },
        { name: '3.', label: 'Modal' },
        { name: '4.', label: 'Pendapatan' },
        { name: '5.', label: 'Biaya' },
        { name: '6.', label: 'Administratif' }
    ];
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [dialog, setDialog] = useState({
        data: {
            id: '',
            tipe_rekening: '',
            kode: '',
            keterangan: '',
            jenis_rekening: ''
        },
        show: false,
        edit: false,
        delete: false
    });

    const [dataRekening, setDataRekening] = useState({
        data: [],
        load: false,
        filterValue: '',
        filteredData: []
    });

    const vaRadioButton = [
        {
            id: 'induk',
            name: 'I',
            value: 'Induk',
            inputId: 'f1'
        },
        {
            id: 'detail',
            name: 'D',
            value: 'Detail',
            inputId: 'f2'
        }
    ];

    useEffect(() => {
        loadLazyData();
    }, []);

    const onPage = (event) => {
        setlazyState(event);

        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        setFirst(event.first);
        setRows(event.rows);

        loadLazyData();
    };

    const loadLazyData = async () => {
        setDataRekening((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData(apiEndPointGet, lazyState);
            setDataRekening((prev) => ({ ...prev, data: res.data.data, load: false }));
        } catch (error) {
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            setDataRekening((prev) => ({ ...prev, data: [], load: false }));
        }
    };

    //  Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button
                        label="New"
                        icon="pi pi-plus"
                        className="p-button-success mr-2"
                        onClick={() => {
                            setDialog({ data: {}, show: true, edit: false, delete: false });
                            formik.resetForm();
                            setStatusAction('store');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Template
    const handleTemplate = () => {
        const filePath = '/template/TemplateCoa.xlsx';
        const link = document.createElement('a');
        link.href = filePath;
        link.download = 'TemplateCoa.xlsx';
        link.click();
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Download Template" icon="pi pi-download" className="p-button-warning mr-2" onClick={handleTemplate}></Button>
            </React.Fragment>
        );
    };

    // Yang Handle Search
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search..." value={dataRekening.filterValue} onChange={(e) => filterSearch(e.target.value)} />
                </span>
            </div>
        </div>
    );

    const filterSearch = (searchVal) => {
        const regex = searchVal ? new RegExp(searchVal, 'i') : null;

        // Jika tidak ada teks pencarian, kembalikan data asli
        const filtered = !searchVal
            ? dataRekening.data
            : dataRekening.data.map((item) => ({
                ...item,
                detail: regex ? item.detail.filter((k) => regex.test(k.kode) || regex.test(k.keterangan)) : item.detail
            }));

        setDataRekening((prev) => ({
            ...prev,
            filteredData: filtered,
            filterValue: searchVal
        }));
    };

    // Yang Handle Action pada Tabel
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-pencil"
                    severity="success"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setDialog({ data: rowData, show: true, edit: true, delete: false });
                        const tipeRekening = rowData.kode.split('.')[0] + '.';
                        setStatusAction('update');
                        formik.setValues({
                            id: rowData.id,
                            tipe_rekening: tipeRekening,
                            kode: rowData.kode,
                            keterangan: rowData.keterangan,
                            jenis_rekening: rowData.jenis_rekening
                        });
                    }}
                />
                <Button icon="pi pi-trash" onClick={() => setDialog({ data: rowData, show: true, edit: false, delete: true })} severity="danger" rounded />
            </>
        );
    };

    const formik = useFormik({
        initialValues: {
            id: '',
            tipe_rekening: '',
            kode: '',
            keterangan: '',
            jenis_rekening: ''
        },
        validate: (data) => {
            let errors = {};
            //  Validasi tipe rekening
            if (!data.tipe_rekening) {
                errors.tipe_rekening = 'Tipe Rekening belum dipilih.';
            }

            // Validasi kode
            if (!data.kode) {
                errors.kode = 'Kode tidak boleh kosong.';
            }

            // Validasi keterangan
            if (!data.keterangan) {
                errors.keterangan = 'Keterangan tidak boleh kosong.';
            }

            // Validasi jenis rekening
            if (!data.jenis_rekening) {
                errors.rekening = 'Jenis Rekening belum dipilih.';
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    useEffect(() => {
        console.log('Formik values:', formik.values);
    }, [formik.values]);

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    //  Yang Handle Delete
    const handleDelete = async () => {
        try {
            const res = await postData(apiEndPointDelete, { Kode: dialog.data.kode });
            showSuccess(toast, res.data.message);
            setDialog({ data: {}, show: false, edit: false, delete: false });
            loadLazyData();
        } catch (error) {
            console.log(error);
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDialog({ data: {}, show: false, edit: false, delete: false })} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    //  Yang Handle Save/Update
    const handleSave1 = async (input) => {
        try {
            const rekening = `${input.tipe_rekening}${input.kode}`;
            const modifiedInput = { ...input, rekening };
            let endPoint;
            if (input.id) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            // Kirim data ke server
            const vaData = await postData(endPoint, modifiedInput);
            let res = vaData.data;
            showSuccess(toast, res.data?.message || 'Berhasil Create Data');
            loadLazyData();
            formik.resetForm();
            setDialog({ data: {}, show: false, edit: false, delete: false });
        } catch (error) {
            console.log(error);
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const handleSave = async (input) => {
        if (Array.isArray(input)) {
            try {
                const response = await postData(apiEndPointKonversi, input);
                const json = response.data;
                showSuccess(toast, json.data?.message || 'Berhasil Create Data');
                setDialog({ data: {}, show: false, edit: false, delete: false });
                loadLazyData();
            } catch (error) {
                const e = error?.response?.data || error;
                toast.current.show({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 });
            }
        } else {
            const rekening = `${input.tipe_rekening}${input.kode}`;
            const modifiedInput = { ...input, rekening };
            try {
                const apiEndPoint = statusAction === 'update' ? apiEndPointUpdate : apiEndPointStore;
                const vaData = await postData(apiEndPoint, modifiedInput);
                let res = vaData.data;
                showSuccess(toast, res.data?.message || 'Berhasil Create Data');
                loadLazyData();
                formik.resetForm();
                setDialog({ data: {}, show: false, edit: false, delete: false });
            } catch (error) {
                console.log(error);
                const e = error.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        }
    };

    const btnAdjust = () => {
        if (dataRekening.length == 0 || !dataRekening) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            if (!allRekening || allRekening.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Rekening';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = allRekening.map((item) => [
                item.Kode,
                item.Keterangan,
                item.JenisRekening === 'I' ? 'Induk' : 'Detail',]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'KETERANGAN', 'JENIS REKENING']],
                body: tableData,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8
                },
                columnStyles: {
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didParseCell: function (data) {
                    // Mengambil data asli dari rekeningPDF berdasarkan index baris
                    const currentRow = allRekening[data.row.index];
                    // Jika JenisRekening adalah 'I', maka set style cell menjadi bold
                    if (currentRow && currentRow.JenisRekening === 'I') {
                        data.cell.styles.fontStyle = 'bold';
                    }
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(allRekening, 'master-rekening.xlsx');
    };

    //  Yang Handle Upload File
    const confirmUpload = () => {
        document.getElementById('excelFileInput').click();
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    // Membaca file sebagai string biner
                    const binaryString = e.target.result;
                    // Membaca workbook dari file Excel
                    const workbook = XLSX.read(binaryString, { type: 'binary' });
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        toast.current.show({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Tidak ada sheet yang ditemukan',
                            life: 3000
                        });
                        return;
                    }

                    // Ambil sheet pertama
                    const sheetRekening = workbook.SheetNames[0];
                    const workSheetRekening = workbook.Sheets[sheetRekening];

                    // Ambil header dari file Excel
                    const excelHeader = XLSX.utils.sheet_to_json(workSheetRekening, {
                        header: 1,
                        range: 0
                    })[0];

                    // Header yang diharapkan
                    const expectedHeader = ['KODE', 'KETERANGAN', 'JENIS'];

                    // Cek apakah header sesuai
                    if (!excelHeader || excelHeader.length !== expectedHeader.length || !expectedHeader.every((val, index) => val === excelHeader[index])) {
                        toast.current.show({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'File yang Anda masukkan tidak sesuai',
                            life: 3000
                        });
                        return;
                    }

                    // Konversi seluruh sheet ke JSON dengan header yang telah ditentukan
                    const jsonDataRekening = XLSX.utils.sheet_to_json(workSheetRekening, {
                        range: 1,
                        header: expectedHeader,
                        defval: ''
                    });

                    // Bersihkan data dan tambahkan index
                    const cleanedJsonDataRekening = jsonDataRekening.map((row, index) => ({
                        KODE: row.KODE !== undefined ? row.KODE : '',
                        KETERANGAN: row.KETERANGAN !== undefined ? row.KETERANGAN : '',
                        JENIS: row.JENIS !== undefined ? row.JENIS : ''
                    }));
                    await handleSave(cleanedJsonDataRekening);
                } catch (error) {
                    const e = error?.response?.data || error;
                    toast.current.show({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 });
                    console.error('Error saat memproses file Excel:', error);
                    alert(error.message); // Berikan feedback ke pengguna
                } finally {
                    setLoading(false);
                }
            };

            reader.onerror = (err) => {
                console.error('Error saat membaca file:', err);
                setLoading(false);
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Error umum:', error);
            setLoading(false);
            const e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 });
        }
    };

    return (
        <BlockUI
            blocked={loadingPreview}
            template={
                <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                    <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                    <p>Loading...</p>
                </ div>
            }
        >
            <div className="grid crud-demo">
                <Toast ref={toast}></Toast>
                <div className="col-12">
                    <div className="card">
                        <h4>Master Rekening</h4>
                        <hr></hr>
                        <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>
                        <TabView>
                            {(dataRekening.filterValue ? dataRekening.filteredData : dataRekening.data).map((item, index) => {
                                return (
                                    <TabPanel key={index} header={item.tipe_rekening}>
                                        <DataTable
                                            value={item.detail}
                                            filters={lazyState.filters}
                                            header={headerSearch}
                                            first={first}
                                            rows={rows}
                                            onPage={onPage}
                                            paginator
                                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                            totalRecords={totalRecords}
                                            size="small"
                                            loading={loading}
                                            className="datatable-responsive"
                                            emptyMessage="Data Kosong"
                                        >
                                            <Column headerStyle={{ textAlign: 'center' }} field="kode" header="KODE"></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="keterangan" header="KETERANGAN"></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} field="jenis_rekening" header="JENIS REKENING" body={(rowData) => (rowData.jenis_rekening === 'I' ? 'Induk' : 'Detail')}></Column>
                                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                                        </DataTable>
                                    </TabPanel>
                                );
                            })}
                        </TabView>
                        <Toolbar className="mb-4" start={preview}></Toolbar>
                    </div>
                </div>
                <Dialog
                    visible={dialog.show && !dialog.delete}
                    header={dialog.edit ? 'Edit Data Rekening' : 'Tambah Data Rekening'}
                    modal
                    style={{ width: '40%' }}
                    onHide={() => {
                        setDialog({ data: {}, show: false, edit: false, delete: false });
                        formik.resetForm();
                    }}
                >
                    <form onSubmit={formik.handleSubmit} className="flex flex-column gap-2">
                        <div>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="kode">Kode</label>
                                <div className="p-inputgroup">
                                    <Dropdown
                                        id="tipe_rekening"
                                        disabled={dialog.edit}
                                        value={formik.values.tipe_rekening}
                                        options={tipeRekeningOptions}
                                        onChange={(e) => {
                                            formik.setFieldValue('tipe_rekening', e.target.value);
                                        }}
                                        optionLabel="label"
                                        optionValue="name"
                                        className={isFormFieldInvalid('tipe_rekening') ? 'p-invalid' : ''}
                                    />
                                    <InputText
                                        id="kode"
                                        name="kode"
                                        readOnly={dialog.edit}
                                        value={formik.values.kode}
                                        onChange={(e) => {
                                            formik.setFieldValue('kode', e.target.value);
                                        }}
                                        className={isFormFieldInvalid('kode') ? 'p-invalid' : ''}
                                    />
                                </div>
                                {isFormFieldInvalid('kode') ? getFormErrorMessage('kode') : ''}
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="keterangan">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        id="keterangan"
                                        name="keterangan"
                                        value={formik.values.keterangan}
                                        onChange={(e) => {
                                            formik.setFieldValue('keterangan', e.target.value);
                                        }}
                                        className={isFormFieldInvalid('keterangan') ? 'p-invalid' : ''}
                                    />
                                </div>
                                {isFormFieldInvalid('keterangan') ? getFormErrorMessage('keterangan') : ''}
                            </div>
                            <div className="flex flex-column gap-2">
                                <label htmlFor="jenis_rekening">Jenis Rekening</label>
                                <div className="p-inputgroup">
                                    <div className="flex flex-wrap gap-6">
                                        {vaRadioButton.map((btn, i) => {
                                            return (
                                                <div key={i} className="flex align-items-center mr-3">
                                                    <RadioButton
                                                        {...btn}
                                                        checked={formik.values.jenis_rekening === btn.name}
                                                        onChange={(e) => {
                                                            formik.setFieldValue('jenis_rekening', e.target.name);
                                                        }}
                                                    />
                                                    <label htmlFor={btn.inputId} className="ml-1">
                                                        {btn.value}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {isFormFieldInvalid('jenis_rekening') ? getFormErrorMessage('jenis_rekening') : ''}
                            </div>
                        </div>
                        <div className="flex justify-content-end gap-2">
                            <Button type="submit" className="mt-2" label={dialog.edit ? 'Update' : 'Save'} />
                            <input type="file" id="excelFileInput" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                            <label htmlFor="excelFileInput">
                                <Button loading={loading} label="Import Excel" icon="pi pi-external-link" className="mt-2" onClick={confirmUpload} />
                            </label>
                        </div>
                    </form>
                </Dialog>
                <Dialog header="Delete" visible={dialog.show && dialog.delete} onHide={() => setDialog({ data: {}, show: false, edit: false, delete: false })} footer={footerDeleteTemplate}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>
                            apakah kamu ingin menghapus  <strong>{dialog.data?.keterangan}</strong>
                        </span>
                    </div>
                </Dialog>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </div>
        </BlockUI>
    );
}
