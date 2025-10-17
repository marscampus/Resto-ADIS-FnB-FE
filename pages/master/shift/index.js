import { DataTable } from 'primereact/datatable';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Column } from 'primereact/column';
import { useFormik } from 'formik';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import postData from '../../../lib/Axios';
import { Dialog } from 'primereact/dialog';
import { FilterMatchMode } from 'primereact/api';
import PDFViewer from '../../../component/PDFViewer';
import { Toolbar } from 'primereact/toolbar';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { BlockUI } from 'primereact/blockui';
import { getEmail, getUserName, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import jsPDF from 'jspdf';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/master/shift');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

const Shift = (props) => {
    //state
    const toast = useRef(null);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [adjustDialog, setAdjustDialog] = useState(false);
    const fileName = `shift-${new Date().toISOString().slice(0, 10)}`;
    const [loadingPreview, setLoadingPreview] = useState(false);

    const [dataShift, setDataShift] = useState({
        data: [],
        load: false,
        show: false,
        edit: false,
        delete: false,

        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
    });
    //

    const formik = useFormik({
        initialValues: {
            KODE: '',
            KETERANGAN: ''
        },
        validate: (data) => {
            let errors = {};

            if (!data.KODE) {
                errors.gambar = 'Gambar Wajib Di isi';
            }

            return errors;
        },
        onSubmit: (data) => {
            handleSave(data);
        }
    });

    const handleSave = async (input) => {
        try {
            let endPoint;

            let body = input;
            if (dataShift.edit) {
                endPoint = '/api/shift/update';
            } else {
                endPoint = '/api/shift/store';
            }
            // Kirim data ke server
            const vaData = await postData(endPoint, body);
            let res = vaData.data;
            showSuccess(toast, res.data?.message || 'Berhasil Menyimpan Data');
            formik.resetForm();
            getShift();
        } catch (error) {
            const e = error.response?.data;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const getShift = async () => {
        setDataShift((p) => ({ ...p, load: true }));

        try {
            // Kirim data ke server
            const vaData = await postData('/api/shift/get', {});
            let res = vaData.data;
            setDataShift((p) => ({ ...p, data: res.data }));
            formik.resetForm();
        } catch (error) {
            const e = error.response?.data;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setDataShift((p) => ({ ...p, load: false, show: false, edit: false, delete: false }));
        }
    };

    const handleDelete = async () => {
        try {
            const res = await postData('/api/shift/delete', { KODE: formik.values.KODE });
            showSuccess(toast, res.data.message);
            setDataShift((p) => ({ ...p, show: false, edit: false, delete: false }));
            getShift();
        } catch (error) {
            const e = error.response?.data;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const rupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(number);
    };
    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    useEffect(() => {
        getShift();
    }, []);

    //template
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-pencil"
                    severity="success"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setDataShift((prev) => ({ ...prev, show: true, edit: true, delete: false }));
                        formik.setValues({
                            KODE: rowData.KODE,
                            KETERANGAN: rowData.KETERANGAN
                        });
                    }}
                />
                <Button
                    icon="pi pi-trash"
                    onClick={() => {
                        setDataShift((prev) => ({ ...prev, show: true, edit: false, delete: true }));

                        formik.setValues((p) => ({
                            ...p,
                            KODE: rowData.KODE,
                            KETERANGAN: rowData.KETERANGAN
                        }));
                    }}
                    severity="danger"
                    rounded
                />
            </>
        );
    };

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDataShift((prev) => ({ ...prev, show: false, edit: false, delete: false }))} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <Button label="Add" icon="pi pi-plus" onClick={() => setDataShift((p) => ({ ...p, show: true }))} />
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => {
                            const value = e.target.value;
                            let _filters = { ...dataShift.filters };

                            _filters['global'].value = value;

                            setDataShift((p) => ({ ...p, searchVal: value, filters: _filters }));
                        }}
                        placeholder="Search..."
                        value={dataShift.searchVal}
                    />
                </span>
            </div>
        </div>
    );

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (dataShift.data.length == 0 || !dataShift.data) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
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

            if (!dataShift.data || dataShift.data.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Shift';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = dataShift.data.map((item) => [item.KODE, item.KETERANGAN]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'JENIS MEMBER']],
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
                columnStyles: {},
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
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
        exportToXLSX(dataShift.data, 'master-shift.xlsx');
    };

    const previewMember = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    return (
        <>
            <BlockUI
                blocked={loadingPreview}
                template={
                    <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                        <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                        <p>Loading...</p>
                    </ div>
                }
            >
                <Toast ref={toast}></Toast>
                <div className="card">
                    <h4>Shift</h4>
                    <DataTable size='small' value={dataShift.data} paginator rows={10} header={header} globalFilterFields={['KODE', 'KETERANGAN']} filters={dataShift.filters} loading={dataShift.load} emptyMessage="Data Kosong">
                        <Column field="KODE" header="KODE"></Column>
                        <Column field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="Action" body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" start={previewMember}></Toolbar>
                </div>

                <Dialog
                    visible={dataShift.show && !dataShift.delete}
                    header={dataShift.edit ? 'Edit Data Shift' : 'Tambah Data Shift'}
                    modal
                    // style={{ width: '40%' }}
                    onHide={() => {
                        setDataShift((p) => ({ ...p, show: false, edit: false, delete: false }));
                        formik.resetForm();
                    }}
                >
                    <form onSubmit={formik.handleSubmit} className="flex gap-2 flex-column">
                        <div className="flex flex-column gap-3">
                            <div className="flex flex-column gap-2 w-full">
                                <label htmlFor="KODE">KODE</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        id="KODE"
                                        name="KODE"
                                        keyfilter={'int'}
                                        readOnly={dataShift.edit}
                                        value={formik.values.KODE}
                                        onChange={(e) => {
                                            formik.setFieldValue('KODE', e.target.value);
                                        }}
                                        className={isFormFieldInvalid('KODE') ? 'p-invalid' : ''}
                                    />
                                </div>
                                {isFormFieldInvalid('KODE') ? getFormErrorMessage('KODE') : ''}
                            </div>

                            <div className="flex flex-column gap-2 w-full">
                                <label htmlFor="KETERANGAN">KETERANGAN</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        id="KETERANGAN"
                                        name="KETERANGAN"
                                        value={formik.values.KETERANGAN}
                                        onChange={(e) => {
                                            formik.setFieldValue('KETERANGAN', e.target.value);
                                        }}
                                        className={isFormFieldInvalid('KETERANGAN') ? 'p-invalid' : ''}
                                    />
                                </div>
                                {isFormFieldInvalid('KETERANGAN') ? getFormErrorMessage('KETERANGAN') : ''}
                            </div>
                        </div>
                        <Button type="submit" label={dataShift.edit ? 'Update' : 'Save'} className="mt-2" loading={dataShift.load} />
                    </form>
                </Dialog>

                <Dialog header="Delete" visible={dataShift.show && dataShift.delete} onHide={() => setDataShift((prev) => ({ ...prev, show: false, edit: false, delete: false }))} footer={footerDeleteTemplate}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>
                            apakah kamu ingin menghapus  <strong>{formik.values.KODE}</strong>
                        </span>
                    </div>
                </Dialog>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </BlockUI >
        </>
    );
};

export default Shift;
