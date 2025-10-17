import React, { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Toast } from 'primereact/toast';
import { FilterMatchMode } from 'primereact/api';
import { useFormik } from 'formik';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { FileUpload } from 'primereact/fileupload';
import { InputNumber } from 'primereact/inputnumber';
import { Toolbar } from 'primereact/toolbar';
import { BlockUI } from 'primereact/blockui';
import jsPDF from 'jspdf';
import { useSession } from 'next-auth/react';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import postData from '../../../lib/Axios';
import { convertToISODate, formatDateTable, getEmail, getUserName, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';
import { Calendar } from 'primereact/calendar';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
};

export default function Reservasi() {
    const toast = useRef(null);
    const { data: session, status } = useSession();
    let unitUsaha = session?.unit_usaha;
    const [reservasi, setReservasi] = useState({
        data: [],
        load: false,
        show: false,
        edit: false,
        delete: false,
        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } }
    });
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const fileName = `master-reservasi-${new Date().toISOString().slice(0, 10)}`;
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const formik = useFormik({
        initialValues: {
            nama: '',
            no_telp: '',
            tgl_reservasi: '',
            jml_reservasi: 1,
            rekening: '',
            nominal: 0,
            bukti: ''
        },
        validate: (values) => {
            let errors = {};
            !values.nama && (errors.nama = 'Nama tidak boleh kosong.');
            !values.no_telp && (errors.no_telp = 'No. Telepon tidak boleh kosong.');
            !values.tgl_reservasi && (errors.tgl_reservasi = 'Tanggal Reservasi tidak boleh kosong.');
            !values.jml_reservasi && (errors.jml_reservasi = 'Jumlah Reservasi tidak boleh kosong.');
            !values.rekening && (errors.rekening = 'Rekening tidak boleh kosong.');
            !values.nominal && (errors.nominal = 'Nominal tidak boleh kosong.');
            if (!reservasi.edit) {
                !values.bukti && (errors.bukti = 'Bukti tidak boleh kosong.');
            }

            return errors;
        },
        onSubmit: (input) => {
            handleSave(input);
        }
    });

    const getDataReservasi = async () => {
        setReservasi((p) => ({ ...p, load: true }));
        try {
            const res = await postData('/api/reservasi/get');
            setReservasi((p) => ({ ...p, data: res.data.data }));
        } catch (error) {
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setReservasi((p) => ({ ...p, load: false, show: false, edit: false }));
        }
    };

    //  Yang Handle Save
    const handleSave = async (input) => {
        setLoading(true);
        setReservasi((p) => ({ ...p, load: true }));
        try {
            let endpoint = '';
            let body = { ...input };
            if (body.tgl_reservasi) {
                body.tgl_reservasi = convertToISODate(body.tgl_reservasi);
            }
            if (reservasi.edit) {
                endpoint = '/api/reservasi/update';
                body.nama = input.nama;
            } else {
                endpoint = '/api/reservasi/store';
            }
            const res = await postData(endpoint, body);
            showSuccess(toast, res.data.message);
            formik.resetForm();
            getDataReservasi();
        } catch (error) {
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
            setReservasi((p) => ({ ...p, load: false, show: false }));
        }
    };

    //  Yang Handle Delete
    const handleDelete = async () => {
        try {
            const res = await postData('/api/reservasi/delete', { nama: formik.values.nama });
            showSuccess(toast, res.data.message);
            getDataReservasi();
        } catch (error) {
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    useEffect(() => {
        getDataReservasi();
    }, []);

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (reservasi.data.length == 0 || !reservasi.data) {
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
            const dataPDF = reservasi.data ? JSON.parse(JSON.stringify(reservasi.data)) : [];

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

            if (!dataPDF || dataPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Reservasi';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan, unitUsaha });

            const tableData = dataPDF.map((item) => [
                item.nama,
                item.no_telp,
                formatDateTable(item.tgl_reservasi),
                item.jml_reservasi ? parseInt(item.jml_reservasi).toLocaleString() : 0,
                item.nominal ? parseInt(item.nominal).toLocaleString() : 0,
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NAMA', 'NO. TELP', 'TGL RESERVASI', 'JML RESERVASI', 'UANG MUKA']],
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
                    2: { halign: 'center' },
                    4: { halign: 'right' }
                },
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

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2, unitUsaha });
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
        exportToXLSX(reservasi.data, 'master-reservasi.xlsx');
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

    const isFormFieldInvalid = (name) => !!(formik.touched[name] && formik.errors[name]);

    const getFormErrorMessage = (name) => {
        return isFormFieldInvalid(name) ? <small className="p-error">{formik.errors[name]}</small> : <small className="p-error">&nbsp;</small>;
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center w-full">
            <div>
                <Button onClick={() => setReservasi((p) => ({ ...p, show: true }))} label="Add" />
            </div>
            <div className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText placeholder="Search..." value={reservasi.searchVal} onChange={(e) => { }} />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button
                    icon="pi pi-pencil"
                    severity="success"
                    rounded
                    className="mr-2"
                    onClick={() => {
                        setReservasi((p) => ({ ...p, show: true, edit: true, delete: false }));

                        formik.setValues({
                            id: rowData.id,
                            nama: rowData.nama,
                            no_telp: rowData.no_telp,
                            rekening: rowData.rekening,
                            tgl_reservasi: rowData.tgl_reservasi,
                            jml_reservasi: rowData.jml_reservasi,
                            nominal: rowData.nominal,
                            bukti: rowData.bukti
                        });
                    }}
                />
                <Button
                    icon="pi pi-trash"
                    onClick={() => {
                        setReservasi((p) => ({ ...p, show: true, edit: false, delete: true }));
                        formik.setFieldValue('nama', rowData.nama);
                    }}
                    severity="danger"
                    rounded
                />
            </>
        );
    };

    const footerDeleteTemplate = (
        <div>
            <Button label="No" icon="pi pi-times" onClick={() => reservasi((p) => ({ ...p, show: false, edit: false, delete: false }))} className="p-button-text" />
            <Button label="Yes" icon="pi pi-check" onClick={() => handleDelete()} />
        </div>
    );

    //  Yang Handle Inputan File
    const onFileSelect = (event) => {
        const file = event.files[0]; // Ambil file pertama dari FileUpload
        if (file.size > 900000) {
            formik.setFieldValue('bukti', null);
            return showError('File tidak boleh lebih dari 1MB.');
        }
        const reader = new FileReader();

        reader.onload = (e) => {
            formik.setFieldValue('bukti', e.target.result);
        };

        if (file) {
            reader.readAsDataURL(file); // Konversi file ke base64
        }
    };

    //  Yang Handle Gambar
    const imageBodyTemplate = (rowData) => {
        return (
            <>
                <Image
                    src={rowData.bukti || `/layout/images/no_img.jpg`}
                    width={100}
                    height={100}
                    style={{
                        borderRadius: '6px',
                        height: '80px',
                        width: '80px',
                        objectPosition: 'center',
                        objectFit: 'cover',
                        boxShadow: '0px 0px 3px 1px rgba(107,102,102,0.35)'
                    }}
                />
            </>
        );
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
                <div className="col-12">
                    <div className="card">
                        <h4>Master Reservasi</h4>
                        <hr />
                        <Toast ref={toast} />
                        <DataTable size='small' value={reservasi.data} header={headerSearch} filters={reservasi.filters} globalFilterFields={['kode', 'nama']} loading={reservasi.load}>
                            <Column field="nama" header="NAMA"></Column>
                            <Column field="no_telp" header="NO. TELEPON"></Column>
                            <Column field="tgl_reservasi" body={(rowData) => rowData.tgl_reservasi ? `${formatDateTable(rowData.tgl_reservasi)}` : ""} header="TGL RESERVASI"></Column>
                            <Column field="jml_reservasi" header="JML. RESERVASI"></Column>
                            <Column field="rekening" header="REKENING"></Column>
                            <Column field="nominal" body={(rowData) => {
                                const value = rowData.nominal ? parseInt(rowData.nominal).toLocaleString() : "";
                                return value;
                            }}
                                align={'right'} header="NOMINAL"></Column>
                            {/* <Column field="bukti" header="BUKTI PEMBAYARAN" body={imageBodyTemplate}></Column> */}
                            <Column header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" start={preview}></Toolbar>
                        <Dialog
                            visible={reservasi.show && !reservasi.delete}
                            header={reservasi.edit ? 'Edit Data Reservasi' : 'Tambah Data Reservasi'}
                            modal
                            style={{ width: '50%' }}
                            onHide={() => {
                                setReservasi((p) => ({ ...p, show: false, edit: false, delete: false }));
                                formik.resetForm();
                            }}
                        >
                            <form onSubmit={formik.handleSubmit} className="flex flex-column gap-3">
                                <div className="grid">
                                    {/* Row 1 - Nama dan No Telp */}
                                    <div className="field col-6">
                                        <label htmlFor="nama" className="font-bold">Nama</label>
                                        <div className="p-inputgroup">
                                            <InputText
                                                id="nama"
                                                name="nama"
                                                value={formik.values.nama}
                                                onChange={formik.handleChange}
                                                className={`w-full ${isFormFieldInvalid('nama') ? 'p-invalid' : ''}`}
                                            />
                                        </div>
                                        {isFormFieldInvalid('nama') && getFormErrorMessage('nama')}
                                    </div>

                                    <div className="field col-6">
                                        <label htmlFor="no_telp" className="font-bold">No. Telepon</label>
                                        <div className="p-inputgroup">
                                            <InputText
                                                id="no_telp"
                                                name="no_telp"
                                                keyfilter="int"
                                                value={formik.values.no_telp}
                                                onChange={formik.handleChange}
                                                className={`w-full ${isFormFieldInvalid('no_telp') ? 'p-invalid' : ''}`}
                                            />
                                        </div>
                                        {isFormFieldInvalid('no_telp') && getFormErrorMessage('no_telp')}
                                    </div>
                                </div>

                                {/* Row 2 - Tanggal dan Jumlah */}
                                <div className="grid">
                                    <div className="field col-6">
                                        <label htmlFor="tgl_reservasi" className="font-bold">Tanggal Reservasi</label>
                                        <Calendar
                                            inputId="tgl_reservasi"
                                            value={formik.values.tgl_reservasi}
                                            onChange={(e) => formik.setFieldValue('tgl_reservasi', e.value)}
                                            dateFormat="yy-mm-dd"
                                            showIcon
                                            className={`w-full ${isFormFieldInvalid('tgl_reservasi') ? 'p-invalid' : ''}`}
                                        />
                                        {isFormFieldInvalid('tgl_reservasi') && getFormErrorMessage('tgl_reservasi')}
                                    </div>

                                    <div className="field col-6">
                                        <label htmlFor="jml_reservasi" className="font-bold">Jumlah Reservasi</label>
                                        <InputNumber
                                            id="jml_reservasi"
                                            name="jml_reservasi"
                                            value={formik.values.jml_reservasi}
                                            onValueChange={(e) => formik.setFieldValue('jml_reservasi', e.value)}
                                            className={`w-full ${isFormFieldInvalid('jml_reservasi') ? 'p-invalid' : ''}`}
                                            showButtons
                                            min={1}
                                        />
                                        {isFormFieldInvalid('jml_reservasi') && getFormErrorMessage('jml_reservasi')}
                                    </div>
                                </div>

                                {/* Row 3 - Nominal dan Bukti */}
                                <div className="grid">
                                    <div className="field col-6">
                                        <label htmlFor="rekening" className="font-bold">Rekening</label>
                                        <InputText
                                            id="rekening"
                                            name="rekening"
                                            value={formik.values.rekening}
                                            onChange={formik.handleChange}
                                            className={`w-full ${isFormFieldInvalid('rekening') ? 'p-invalid' : ''}`}
                                        />
                                        {isFormFieldInvalid('rekening') && getFormErrorMessage('rekening')}
                                    </div>

                                    <div className="field col-6">
                                        <label htmlFor="nominal" className="font-bold">Uang Muka</label>
                                        <InputNumber
                                            inputStyle={{ textAlign: 'right' }}
                                            id="nominal"
                                            name="nominal"
                                            value={formik.values.nominal}
                                            onValueChange={(e) => formik.setFieldValue('nominal', e.value)}
                                            className={`w-full ${isFormFieldInvalid('nominal') ? 'p-invalid' : ''}`}
                                            mode="currency"
                                            currency="IDR"
                                            locale="id-ID"
                                        />
                                        {isFormFieldInvalid('nominal') && getFormErrorMessage('nominal')}
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="bukti" className="font-bold">Bukti Pembayaran</label>
                                    {!formik.values.bukti && <FileUpload name="bukti" key={formik.values.bukti} accept="image/*" customUpload mode="basic" chooseLabel="Pilih Foto" auto={false} onSelect={onFileSelect} />}
                                    {formik.values.bukti && (
                                        <div className="mt-2" style={{ position: 'relative' }}>
                                            <img src={formik.values.bukti} alt="Preview Foto" className="mb-3" style={{ width: '300px', height: '300px', objectFit: 'cover', objectPosition: 'center' }} />
                                            <Button
                                                icon="pi pi-trash"
                                                type='button'
                                                className="p-button-danger"
                                                style={{ position: 'absolute', top: '0', right: '0' }}
                                                onClick={() => {
                                                    formik.setValues((prev) => ({
                                                        ...prev,
                                                        bukti: null
                                                    }));
                                                }}
                                            />
                                        </div>
                                    )}
                                    {isFormFieldInvalid('bukti') ? getFormErrorMessage('bukti') : ''}
                                </div>

                                <Button
                                    loading={loading}
                                    type="submit"
                                    className="mt-3"
                                    label={reservasi.edit ? 'Update' : 'Simpan'}
                                    icon="pi pi-check"
                                />
                            </form>
                        </Dialog>
                        <Dialog header="Delete" visible={reservasi.show && reservasi.delete} onHide={() => setReservasi((p) => ({ ...p, show: false, edit: false, delete: false }))} footer={footerDeleteTemplate}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                <span>
                                    apakah kamu ingin menghapus  <strong>{formik.values.nama}</strong>
                                </span>
                            </div>
                        </Dialog>
                        <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                        <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                            <div className="p-dialog-content">
                                <PDFViewer pdfUrl={pdfUrl} />
                            </div>
                        </Dialog>
                    </div>
                </div>
            </div>
        </BlockUI>
    )
}